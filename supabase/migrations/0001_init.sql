-- ============================================================================
-- EcoCupon — Migración 0001: esquema inicial (FUENTE DE VERDAD)
--
-- Aplica con:  supabase db push   (envuelve cada archivo en una transacción;
-- si algún paso falla, se hace rollback y NO se marca como aplicada).
--
-- Idempotente: usa CREATE TABLE IF NOT EXISTS / CREATE OR REPLACE, por lo que
-- puede re-ejecutarse sin error ni duplicados.
--   - En una BD nueva: crea todo el esquema final (is_public, shares_count, views).
--   - En la BD existente (tablas ya creadas en su momento vía scripts/ históricos):
--     es no-op, porque las tablas ya existen; el paso de reconciliación del
--     esquema viejo->nuevo vive en 0002_security.sql.
--
-- No borra datos: solo crea objetos si no existen.
-- ============================================================================

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  business_name text not null,
  discount_percentage integer not null check (discount_percentage > 0 and discount_percentage <= 100),
  coupon_code text not null,
  description text,
  title text,
  image_url text,
  generated_image_url text,
  cta_text text default 'Usa este código',
  is_public boolean default false,
  expires_at timestamptz,
  views integer not null default 0,
  shares_count integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  business_name text,
  email text,
  phone text,
  logo_url text,
  plan_type text default 'free',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Trigger: crea el perfil automáticamente al registrarse un usuario.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
