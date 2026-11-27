-- 0017_program_leads.sql — aplicada en el proyecto uyxvzztnsvfcqmgkrnol (ecocupon-cl) el 2026-11-27.
begin;
create table if not exists public.program_leads (
  id                   uuid primary key default gen_random_uuid(),
  rol                  text not null check (rol in ('municipio','marca','empresa','comercio')),
  organizacion         text not null,
  nombre               text not null,
  cargo                text,
  comuna               text not null,
  email                text not null,
  whatsapp             text,
  tipo_programa        text check (tipo_programa is null or tipo_programa in ('puntos_limpios','retail','eventos','educativo','otro')),
  comercios_estimados  integer check (comercios_estimados is null or comercios_estimados >= 0),
  mensaje              text,
  origen               text not null default 'landing_recicla',
  created_at           timestamptz not null default now()
);
create index if not exists program_leads_created_idx on public.program_leads (created_at desc);
create index if not exists program_leads_rol_idx on public.program_leads (rol);
alter table public.program_leads enable row level security;
comment on table public.program_leads is 'Interesados del programa EcoCupon Recicla. Solo service role.';
commit;