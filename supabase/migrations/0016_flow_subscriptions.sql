-- 0016_flow_subscriptions.sql
--
-- Cobro con Flow reemplaza a Reveniu. La suscripción vive en Flow (plan +
-- cliente + tarjeta enrolada); acá se guarda el estado necesario para operar:
--
--   profiles.rut               RUT del comercio, para la boleta. Dato personal:
--                              sólo lo lee su titular y lo escribe el servidor.
--   profiles.flow_customer_id  id del cliente en Flow (se crea una vez).
--   profiles.flow_subscription_id
--   profiles.billing_period    'mensual' | 'anual', el plan contratado.
--   profiles.plan_ends_at      fin del periodo pagado. Pasada esta fecha y sin
--                              cobro confirmado, la cuenta vuelve a free.
--   flow_payments              cada cobro confirmado, con `flow_order` como
--                              llave de idempotencia: Flow puede reenviar el
--                              callback y no se debe extender dos veces.

alter table public.profiles
  add column if not exists rut text,
  add column if not exists flow_customer_id text,
  add column if not exists flow_subscription_id text,
  add column if not exists billing_period text,
  add column if not exists plan_ends_at timestamptz;

alter table public.profiles
  drop constraint if exists profiles_rut_check;

alter table public.profiles
  add constraint profiles_rut_check
  check (rut is null or rut ~ '^[0-9]{1,8}-[0-9K]$');

alter table public.profiles
  drop constraint if exists profiles_billing_period_check;

alter table public.profiles
  add constraint profiles_billing_period_check
  check (billing_period is null or billing_period in ('mensual', 'anual'));

comment on column public.profiles.rut is
  'RUT del comercio en formato 12345678-9. Lo escribe solo el servidor.';
comment on column public.profiles.plan_ends_at is
  'Fin del periodo pagado en Flow. Venció: la cuenta opera como free.';

create table if not exists public.flow_payments (
  flow_order bigint primary key,
  user_id uuid references auth.users(id) on delete set null,
  commerce_order text,
  amount integer,
  status integer,
  paid_at timestamptz not null default now(),
  raw jsonb
);

alter table public.flow_payments enable row level security;

comment on table public.flow_payments is
  'Cobros confirmados por Flow. Sin políticas: solo la service role la toca.';

-- Un plan vencido deja de dar ventajas aunque `plan_type` siga en 'pro'.
create or replace function public.enforce_plan_limits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
  v_trial timestamptz;
  v_ends timestamptz;
  v_limit integer;
  v_used integer;
  v_month_start timestamptz;
begin
  select coalesce(plan_type, 'free'), trial_ends_at, plan_ends_at
    into v_plan, v_trial, v_ends
  from public.profiles
  where id = new.user_id;

  v_plan := coalesce(v_plan, 'free');

  if v_plan in ('pro', 'business')
     and v_ends is not null and v_ends <= now() then
    v_plan := 'free';
  end if;

  if v_trial is not null and v_trial > now() then
    v_plan := 'pro';
  end if;

  if tg_op = 'INSERT' then
    v_limit := case v_plan
      when 'pro' then 50
      when 'business' then null
      else 3
    end;

    if v_limit is not null then
      v_month_start :=
        date_trunc('month', now() at time zone 'America/Santiago')
        at time zone 'America/Santiago';

      select count(*) into v_used
      from public.coupons
      where user_id = new.user_id
        and created_at >= v_month_start;

      if v_used >= v_limit then
        raise exception 'Límite del plan alcanzado: % cupones por mes.', v_limit
          using errcode = 'check_violation';
      end if;
    end if;
  end if;

  return new;
end;
$$;

revoke execute on function public.enforce_plan_limits() from public, anon, authenticated;