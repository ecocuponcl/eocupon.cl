-- 0015_plan_limits.sql
--
-- Aplica los límites del plan en la base y no en la interfaz: el navegador
-- inserta cupones directo contra PostgREST, así que un chequeo en React se
-- salta con una petición a mano.
--
--   prueba   → 7 días con las funciones de Pro, sin cambiar `plan_type`.
--   free     → 3 cupones por mes calendario (America/Santiago), sin logo.
--   pro      → 50 cupones por mes, con logo.
--   business → sin límite.
--
-- La cuponera es gratuita a propósito: es el mecanismo que llena la red.
--
-- `profiles.plan_type` sólo lo escribe la service role (migración 0011), o sea
-- el webhook de Reveniu: el usuario no puede subirse de plan para saltarse esto.

alter table public.profiles
  add column if not exists trial_ends_at timestamptz;

comment on column public.profiles.trial_ends_at is
  'Fin de la prueba de Pro. Mientras esté en el futuro, la cuenta opera como Pro.';

-- Cuentas nuevas: siete días de Pro desde el registro.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, trial_ends_at)
  values (new.id, new.email, now() + interval '7 days')
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.enforce_plan_limits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
  v_trial timestamptz;
  v_limit integer;
  v_used integer;
  v_month_start timestamptz;
begin
  select coalesce(plan_type, 'free'), trial_ends_at
    into v_plan, v_trial
  from public.profiles
  where id = new.user_id;

  v_plan := coalesce(v_plan, 'free');

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

-- El logo no está aquí: lo bloquea /api/upload-logo, que es el único camino
-- para escribir en el bucket `logos`.
drop trigger if exists coupons_plan_limits on public.coupons;

create trigger coupons_plan_limits
  before insert on public.coupons
  for each row
  execute function public.enforce_plan_limits();

-- La función la invoca el trigger, no los clientes.
revoke execute on function public.enforce_plan_limits() from public, anon, authenticated;