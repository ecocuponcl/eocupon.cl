-- 0019_program_leads_eo_status_email.sql
-- EmailOctopus puede nombrar los eventos de correo como `email.*` y los de
-- contacto como `contact.*`. La columna guarda el tipo real recibido, así que
-- la restricción acepta ambas familias para los eventos que afectan el contacto.
begin;

alter table public.program_leads
  drop constraint if exists program_leads_eo_status_check;

alter table public.program_leads
  add constraint program_leads_eo_status_check
  check (eo_status is null or eo_status in (
    'contact.unsubscribed',
    'contact.complained',
    'contact.bounced',
    'contact.deleted',
    'email.unsubscribed',
    'email.complained',
    'email.bounced'
  ));

commit;