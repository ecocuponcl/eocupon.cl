-- 0013_coupon_instances_and_redemptions.sql
--
-- Adapta el modelo de GoldenTickets (Mi Gusto, ramirolacci/GoldenTickets) a
-- EcoCupon: instancias individuales de cupón y registro de canjes confirmados
-- por el comercio.
--
-- Concepto:
--   `coupons`          → plantilla del comercio (ya existe)
--   `coupon_instances` → instancia activada por UN consumidor
--   `redemptions`      → cada canje confirmado por el comercio en sucursal
--
-- Seguridad:
--   - El consumidor crea su instancia vía Route Handler público (/api/coupon-instance).
--     El handler no requiere sesión de consumidor; aplica rate-limit por IP de Vercel.
--   - El canje se registra vía Route Handler autenticado (/api/redeem).
--     El handler verifica que el `coupon_id` pertenece al `auth.uid()` del comercio.
--   - `anon` y `authenticated` leen instancias/canjes propios únicamente (RLS).
--   - `updated_at` automático via trigger `set_updated_at` creado en 0010.
--
-- Idempotente: IF NOT EXISTS / OR REPLACE / DROP IF EXISTS en todo.

begin;

-- ---------------------------------------------------------------------------
-- 1. Columnas adicionales en `coupons` (vigencia, política y condiciones)
-- ---------------------------------------------------------------------------
alter table public.coupons
  add column if not exists expires_campaign_at  timestamptz,
  add column if not exists redemption_period    text
    check (redemption_period in ('once', 'daily', 'weekly', 'monthly', 'unlimited'))
    default 'once',
  add column if not exists max_total_redemptions integer
    check (max_total_redemptions > 0),
  add column if not exists conditions           text;

-- ---------------------------------------------------------------------------
-- 2. Tabla `coupon_instances`
-- ---------------------------------------------------------------------------
create table if not exists public.coupon_instances (
  id               uuid primary key default gen_random_uuid(),
  coupon_id        uuid not null references public.coupons(id) on delete cascade,

  -- Datos del consumidor que activó este cupón (sin cuenta requerida)
  consumer_name    text not null,
  consumer_phone   text,

  -- Estado
  activated_at     timestamptz not null default now(),
  expires_at       timestamptz,                  -- null = sin vencimiento de instancia
  is_active        boolean not null default true,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Índices
create index if not exists coupon_instances_coupon_id_idx
  on public.coupon_instances (coupon_id);
create index if not exists coupon_instances_activated_at_idx
  on public.coupon_instances (activated_at desc);

-- RLS: solo el dueño del cupón relacionado puede leer las instancias
alter table public.coupon_instances enable row level security;

drop policy if exists coupon_instances_select_owner on public.coupon_instances;
create policy coupon_instances_select_owner on public.coupon_instances
  for select
  using (
    exists (
      select 1 from public.coupons c
      where c.id = coupon_instances.coupon_id
        and c.user_id = auth.uid()
    )
  );

-- INSERT: solo vía service role (lo hace el Route Handler /api/coupon-instance)
-- No se abre a anon ni a authenticated directamente.

-- UPDATE: solo el dueño del cupón puede desactivar instancias
drop policy if exists coupon_instances_update_owner on public.coupon_instances;
create policy coupon_instances_update_owner on public.coupon_instances
  for update
  using (
    exists (
      select 1 from public.coupons c
      where c.id = coupon_instances.coupon_id
        and c.user_id = auth.uid()
    )
  );

-- Trigger updated_at (reutiliza función creada en 0010)
drop trigger if exists coupon_instances_set_updated_at on public.coupon_instances;
create trigger coupon_instances_set_updated_at
  before update on public.coupon_instances
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. Tabla `redemptions`
-- ---------------------------------------------------------------------------
create table if not exists public.redemptions (
  id              uuid primary key default gen_random_uuid(),
  instance_id     uuid not null references public.coupon_instances(id) on delete cascade,

  -- Comercio que confirmó la entrega (usuario autenticado)
  redeemed_by     uuid not null references auth.users(id),
  redeemed_at     timestamptz not null default now(),

  -- Periodo de control para prevención de doble canje (formato YYYY-MM o YYYY-WNN o YYYY-DDD)
  -- Se calcula en el Route Handler y se almacena aquí para facilitar el índice único.
  period          text not null,

  notes           text,
  created_at      timestamptz not null default now()
);

-- Índice único para prevención de doble canje por periodo.
-- Para cupones 'once' el handler usa period = 'once' (valor fijo): solo puede
-- existir una fila por instancia.
create unique index if not exists redemptions_instance_period_idx
  on public.redemptions (instance_id, period);

-- Índice para el historial del comercio
create index if not exists redemptions_redeemed_by_idx
  on public.redemptions (redeemed_by, redeemed_at desc);
create index if not exists redemptions_instance_idx
  on public.redemptions (instance_id);

-- RLS: el comercio ve los canjes de sus propios cupones
alter table public.redemptions enable row level security;

drop policy if exists redemptions_select_owner on public.redemptions;
create policy redemptions_select_owner on public.redemptions
  for select
  using (redeemed_by = auth.uid());

-- INSERT: solo el dueño del cupón puede registrar el canje
-- (el Route Handler /api/redeem verifica la propiedad antes del insert)
drop policy if exists redemptions_insert_owner on public.redemptions;
create policy redemptions_insert_owner on public.redemptions
  for insert
  with check (redeemed_by = auth.uid());

-- ---------------------------------------------------------------------------
-- 4. RPC: verificar si una instancia puede canjearse
--    Devuelve el estado sin modificar nada; el INSERT lo hace el Route Handler.
--    SECURITY DEFINER para bypassear RLS en la lectura (el consumidor no tiene sesión).
-- ---------------------------------------------------------------------------
create or replace function public.check_instance_redeemable(
  p_instance_id uuid,
  p_period       text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_instance record;
  v_coupon   record;
  v_total    integer;
begin
  -- Leer instancia
  select * into v_instance
  from public.coupon_instances
  where id = p_instance_id;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'instance_not_found');
  end if;

  if not v_instance.is_active then
    return jsonb_build_object('ok', false, 'reason', 'instance_inactive');
  end if;

  if v_instance.expires_at is not null and now() > v_instance.expires_at then
    return jsonb_build_object('ok', false, 'reason', 'instance_expired');
  end if;

  -- Leer cupón para verificar límites de campaña
  select * into v_coupon
  from public.coupons
  where id = v_instance.coupon_id;

  if v_coupon.expires_campaign_at is not null and now() > v_coupon.expires_campaign_at then
    return jsonb_build_object('ok', false, 'reason', 'campaign_expired');
  end if;

  -- Verificar si ya canjeó este periodo
  if exists (
    select 1 from public.redemptions
    where instance_id = p_instance_id
      and period = p_period
  ) then
    return jsonb_build_object('ok', false, 'reason', 'already_redeemed_this_period');
  end if;

  -- Verificar límite total de canjes (si aplica)
  if v_coupon.max_total_redemptions is not null then
    select count(*) into v_total
    from public.redemptions r
    join public.coupon_instances ci on ci.id = r.instance_id
    where ci.coupon_id = v_coupon.id;

    if v_total >= v_coupon.max_total_redemptions then
      return jsonb_build_object('ok', false, 'reason', 'max_redemptions_reached');
    end if;
  end if;

  return jsonb_build_object(
    'ok', true,
    'consumer_name', v_instance.consumer_name,
    'consumer_phone', v_instance.consumer_phone,
    'coupon_id', v_coupon.id,
    'coupon_title', v_coupon.title,
    'business_name', v_coupon.business_name,
    'discount_percentage', v_coupon.discount_percentage,
    'coupon_code', v_coupon.coupon_code,
    'redemption_period', v_coupon.redemption_period
  );
end;
$$;

revoke execute on function public.check_instance_redeemable(uuid, text)
  from public, anon;
grant execute on function public.check_instance_redeemable(uuid, text)
  to authenticated;

commit;
