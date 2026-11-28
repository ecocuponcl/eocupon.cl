-- 0018_program_leads_eo_status.sql
-- Agrega la columna eo_status para registrar eventos de EmailOctopus
-- (unsubscribe, bounce, complaint, delete) sobre los leads del programa Recicla.
begin;

alter table public.program_leads
  add column if not exists eo_status text
    check (eo_status is null or eo_status in (
      'contact.unsubscribed',
      'contact.complained',
      'contact.bounced',
      'contact.deleted'
    ));

comment on column public.program_leads.eo_status is
  'Último evento de EmailOctopus que afectó la capacidad de contacto de este lead.';

commit;
