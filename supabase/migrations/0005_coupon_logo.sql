-- Logo en cupones + bucket de Storage para imágenes de negocio.
-- Idempotente: usa IF NOT EXISTS / ON CONFLICT.

-- 1) Columna para guardar la URL del logo en cada cupón.
alter table public.coupons
  add column if not exists logo_url text;

-- 2) Bucket público para logos (se sirve vía CDN, sin RLS en la lectura).
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

-- 3) Políticas de Storage: cada usuario sube/modifica/borra solo en su carpeta.
drop policy if exists "Users can upload their own logo" on storage.objects;
create policy "Users can upload their own logo"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can update their own logo" on storage.objects;
create policy "Users can update their own logo"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete their own logo" on storage.objects;
create policy "Users can delete their own logo"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- La lectura pública la maneja el flag `public` del bucket (URLs de CDN),
-- por lo que no se necesita política de SELECT para anon.
