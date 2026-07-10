-- ============================================================================
-- EcoCupon — Migración 0002: seguridad, RLS, índices, RPCs y reconciliación
--
-- Aplica con:  supabase db push   (envuelve cada archivo en una transacción;
-- si algún paso falla, se hace rollback y NO se marca como aplicada).
-- Si usas el SQL Editor de Supabase, envuelve este archivo en BEGIN; ... COMMIT;.
--
-- Garantías de seguridad:
--   * IDEMPOTENTE: IF EXISTS / IF NOT EXISTS / CREATE OR REPLACE en todo.
--   * NO BORRA DATOS: solo renombra columnas (preserva las filas), añade una
--     columna con DEFAULT 0, y crea índices/policies/RPCs.
--   * PRE-VUELO: aborta con un mensaje CLARO si hay (user_id, coupon_code)
--     duplicados o user_id huérfanos, en vez de fallar a medias.
--   * RECONCILIA ESQUEMA: el código de la app espera is_public / shares_count /
--     views, pero el esquema histórico (scripts/) usa is_published / shares / y
--     no tiene views. Este paso lleva la BD del estado viejo al nuevo de forma
--     condicional; en una BD ya migrada es no-op.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. PRE-VUELO: abortar con mensaje claro ante datos inconsistentes.
--    (no borra nada; solo impide una migración a medias)
-- ---------------------------------------------------------------------------

-- 0a. (user_id, coupon_code) duplicados -> el índice único del paso 7 fallaría.
do $$
declare
  dupes int;
begin
  select count(*) into dupes
  from (
    select user_id, coupon_code
    from public.coupons
    group by user_id, coupon_code
    having count(*) > 1
  ) t;
  if dupes > 0 then
    raise exception
      'Hay % fila(s) con (user_id, coupon_code) duplicado. '
      'Deduplica manualmente antes de crear el índice único.', dupes;
  end if;
end $$;

-- 0b. user_id huérfanos -> la FK del paso 5 fallaría.
do $$
declare
  orphans int;
begin
  select count(*) into orphans
  from public.coupons c
  left join auth.users u on u.id = c.user_id
  where u.id is null;
  if orphans > 0 then
    raise exception
      'Hay % cupón(es) con user_id sin usuario correspondiente en auth.users. '
      'Limpia los huérfanos antes de crear la FK.', orphans;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 1. Eliminar policies viejas de scripts/ (referencian is_published).
--    HAY QUE HACERLO ANTES de renombrar la columna, porque una policy depende
--    de la columna y Postgres no permite renombrar una columna en uso.
-- ---------------------------------------------------------------------------
drop policy if exists "Users can view their own coupons" on public.coupons;
drop policy if exists "Anyone can view published coupons" on public.coupons;
drop policy if exists "Users can insert their own coupons" on public.coupons;
drop policy if exists "Users can update their own coupons" on public.coupons;
drop policy if exists "Users can delete their own coupons" on public.coupons;

-- ---------------------------------------------------------------------------
-- 2. Reconciliar esquema (viejo -> nuevo), de forma condicional e idempotente
-- ---------------------------------------------------------------------------
do $$
begin
  -- is_published -> is_public (o se crea si no existe ninguna de las dos)
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'coupons' and column_name = 'is_published'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'coupons' and column_name = 'is_public'
  ) then
    alter table public.coupons rename column is_published to is_public;
  elsif not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'coupons' and column_name = 'is_public'
  ) then
    alter table public.coupons add column is_public boolean not null default false;
  end if;

  -- shares -> shares_count (o se crea si no existe ninguna de las dos)
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'coupons' and column_name = 'shares'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'coupons' and column_name = 'shares_count'
  ) then
    alter table public.coupons rename column shares to shares_count;
  elsif not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'coupons' and column_name = 'shares_count'
  ) then
    alter table public.coupons add column shares_count integer not null default 0;
  end if;

  -- views (se crea si no existe)
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'coupons' and column_name = 'views'
  ) then
    alter table public.coupons add column views integer not null default 0;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 3. Defaults defensivos para contadores
-- ---------------------------------------------------------------------------
alter table public.coupons alter column views set default 0;
alter table public.coupons alter column shares_count set default 0;

-- ---------------------------------------------------------------------------
-- 4. Row Level Security
-- ---------------------------------------------------------------------------
alter table public.coupons enable row level security;

-- ---------------------------------------------------------------------------
-- 5. Clave foránea a auth.users (borrado en cascada del dueño)
-- ---------------------------------------------------------------------------
alter table public.coupons
  drop constraint if exists coupons_user_id_fkey;

alter table public.coupons
  add constraint coupons_user_id_fkey
  foreign key (user_id)
  references auth.users (id)
  on delete cascade;

-- ---------------------------------------------------------------------------
-- 6. Políticas RLS
--    - SELECT: el dueño ve los suyos; cualquiera ve los públicos.
--    - INSERT / UPDATE / DELETE: solo el dueño (user_id = auth.uid()).
-- ---------------------------------------------------------------------------
drop policy if exists coupons_select_own_or_public on public.coupons;
create policy coupons_select_own_or_public on public.coupons
  for select
  using (auth.uid() = user_id or is_public = true);

drop policy if exists coupons_insert_own on public.coupons;
create policy coupons_insert_own on public.coupons
  for insert
  with check (auth.uid() = user_id);

drop policy if exists coupons_update_own on public.coupons;
create policy coupons_update_own on public.coupons
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists coupons_delete_own on public.coupons;
create policy coupons_delete_own on public.coupons
  for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 7. Índices (rendimiento de las consultas frecuentes)
-- ---------------------------------------------------------------------------
create index if not exists coupons_user_id_idx on public.coupons (user_id);
create index if not exists coupons_is_public_idx on public.coupons (is_public);
create index if not exists coupons_created_at_idx on public.coupons (created_at desc);
-- Índice parcial para la cuponera pública (la consulta más caliente)
create index if not exists coupons_public_created_idx
  on public.coupons (created_at desc)
  where is_public = true;
-- Un código no se repite por usuario
create unique index if not exists coupons_user_code_idx
  on public.coupons (user_id, coupon_code);

-- ---------------------------------------------------------------------------
-- 8. RPCs SECURITY DEFINER para contadores (evitan abrir UPDATE a anon)
--    Se ejecutan como owner, así el anon puede incrementar sin RLS de escritura.
--    `set search_path = public` evita secuestro de search_path.
-- ---------------------------------------------------------------------------
create or replace function public.increment_shares(coupon_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.coupons
    set shares_count = coalesce(shares_count, 0) + 1
  where id = coupon_id;
end;
$$;

create or replace function public.increment_views(coupon_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.coupons
    set views = coalesce(views, 0) + 1
  where id = coupon_id
    and is_public = true;   -- solo se cuentan vistas de cupones públicos
end;
$$;

-- Permitir a anon y autenticados ejecutar los contadores
grant execute on function public.increment_shares(uuid) to anon, authenticated;
grant execute on function public.increment_views(uuid) to anon, authenticated;
