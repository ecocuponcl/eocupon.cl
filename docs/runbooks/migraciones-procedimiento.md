# Procedimiento de migraciones — pendiente de autorización

**No ejecutado.** Este documento describe exactamente qué se haría, qué cambia y
cómo se revierte. Nada de esto se ha corrido: ni `supabase link`, ni
`migration repair`, ni `db push`, ni DDL por MCP.

> **Corregido tras la review Stage 9.** La versión anterior omitía `--linked` en
> los comandos. El CLI de Supabase apunta **a la base local por defecto**
> (verificado: `supabase migration list` respondió
> `Target: local stack (127.0.0.1:54322)` con `ECONNREFUSED`), así que esas
> órdenes no habrían tocado producción. Todos los comandos de abajo llevan
> `--linked` de forma explícita.

Proyecto Supabase: `vwjdfyljacoxwabtfoco`. CLI: `supabase` 3.1.0.
El repo no está enlazado todavía (`supabase/.temp/project-ref` no existe).

---

## Por qué hace falta tocar el historial

`supabase_migrations.schema_migrations` tiene registradas cuatro entradas en
remoto:

| Versión registrada en remoto | Archivo local hoy | ¿Coincide? |
|---|---|---|
| `0001` | `0001_init.sql` | sí |
| `0002` | `0002_security.sql` | sí |
| `20260712022655` | `0005_coupon_logo.sql` | **no** |
| `20260713160745` | `0006_drop_logo_storage_rls.sql` | **no** |

Y cinco migraciones **aplicadas sin registrar**: `0003`, `0004`, `0007`, `0008`,
`0009`. Sus efectos están comprobados en la base (policy, función, columnas,
tablas ausentes), pero no hay fila en el historial.

### El problema de `0005` y `0006`

No basta con reparar las cinco que faltan. `0005` y `0006` se aplicaron por CLI y
quedaron con versión **timestamp**, mientras los archivos locales se llaman
`0005_…` y `0006_…`. El CLI compara por versión, así que las verá como no
aplicadas y `db push --dry-run` mostrará más que `0010`.

Dos formas de resolverlo, y hay que elegir una antes de empezar:

- **Opción recomendada — alinear los nombres locales a remoto** (cambio en el
  repo, reversible, sin tocar la base):
  ```bash
  git mv supabase/migrations/0005_coupon_logo.sql \
         supabase/migrations/20260712022655_coupon_logo.sql
  git mv supabase/migrations/0006_drop_logo_storage_rls.sql \
         supabase/migrations/20260713160745_drop_logo_storage_rls.sql
  ```
  Así local y remoto coinciden sin añadir filas falsas al historial.

- **Alternativa — reparar también `0005` y `0006`** con sus versiones locales:
  ```bash
  supabase migration repair --status applied 0005 0006 --linked
  ```
  Funciona, pero deja dos filas por migración en el historial (una con timestamp
  de cuando se aplicó y otra que se añade ahora). Más ruido para el futuro.

## Paso 0 — Precondiciones (verificar, no asumir)

1. **Copia de seguridad**: panel de Supabase, *Database → Backups*. Anotar la hora.
2. **`SUPABASE_SERVICE_ROLE_KEY` presente en Vercel** (Production y Preview). Sin
   ella, aplicar `0010` deja el enlace a cupones privados devolviendo 404, porque
   la lectura ya no puede hacerse con service role. No es verificable desde el
   repo: hay que mirarlo en *Vercel → Settings → Environment Variables*.
3. **Para verificar el enlace privado en local** hace falta esa clave también en
   `.env.local` (gitignorado). Sin ella el código cae a RLS y devuelve 404, igual
   que un fallo real: la prueba no distinguiría una cosa de la otra.
4. **Ventana sin tráfico relevante** y `main` sin despliegues en curso.
5. **`supabase login`** (interactivo, lo haces tú).

## Paso 1 — Enlazar y comprobar el estado real

```bash
supabase link --project-ref vwjdfyljacoxwabtfoco
supabase migration list --linked
```

`migration list --linked` muestra las columnas local y remota. **Antes de reparar**,
anota qué aparece solo en local y qué solo en remoto. Si el resultado no coincide
con la tabla de arriba, parar y revisar.

## Paso 2 — Reparar el historial (no ejecuta DDL)

```bash
supabase migration repair --status applied 0003 0004 0007 0008 0009 --linked
supabase migration list --linked
```

`migration repair` **solo escribe filas** en `supabase_migrations.schema_migrations`:
no ejecuta el SQL de esos archivos ni toca datos. Es lo correcto aquí, porque sus
efectos ya están aplicados.

## Paso 3 — Confirmar que solo queda `0010`

```bash
supabase db push --linked --dry-run
```

Salida esperada: **únicamente** `0010_harden_rls_and_timestamps.sql`.

Si aparece cualquier otra, **no continuar**: el historial no quedó bien. En
particular, si vuelven a aparecer `0005`/`0006`, aplica la opción de alinear
nombres del apartado anterior y repite.

## Paso 4 — Aplicar `0010`

```bash
supabase db push --linked
```

| Cambio | Efecto |
|---|---|
| Policy SELECT de `coupons` → `is_public = true or auth.uid() = user_id` | Se cierra el listado anónimo de la tabla. El enlace directo al cupón privado sigue funcionando vía service role. |
| `alter table profiles enable row level security` + 4 policies | Versiona lo que ya existía solo en producción. Idempotente: `drop policy if exists` con los **nombres reales** (`profiles_select_own`, `profiles_insert_own`, `profiles_update_own`, `profiles_delete_own`, verificados en `pg_policies`). |
| `revoke truncate ... from anon, authenticated` | Sin impacto: PostgREST no ofrece TRUNCATE. |
| `revoke execute on function handle_new_user() from public, anon, authenticated` | Sin impacto en el trigger; sin esto el aviso del asesor seguiría apareciendo porque Postgres concede EXECUTE a PUBLIC. |
| Triggers `coupons_set_updated_at` / `profiles_set_updated_at` | `updated_at` pasa a actualizarse de verdad. |

## Paso 5 — Verificar (comandos exactos, no impresiones)

Por SQL, contra el proyecto enlazado:

```bash
supabase migration list --linked
```

```sql
-- 1) La policy ya no es `true`
select qual from pg_policies
 where schemaname='public' and tablename='coupons' and cmd='SELECT';
-- esperado: (is_public = true) OR (auth.uid() = user_id)

-- 2) profiles: RLS activo y 4 policies
select relrowsecurity from pg_class where relname='profiles';
select policyname from pg_policies where schemaname='public' and tablename='profiles';
-- esperado: true + 4 filas

-- 3) Triggers presentes
select tgname from pg_trigger
 where tgrelid in ('public.coupons'::regclass,'public.profiles'::regclass)
   and not tgisinternal;
-- esperado: coupons_set_updated_at y profiles_set_updated_at

-- 4) anon ve solo el cupón público
begin;
set local role anon;
select count(*) as visibles, count(*) filter (where not is_public) as privados
  from public.coupons;
-- esperado: privados = 0
rollback;
```

Por HTTP, con la clave publicable (línea base antes y después):

```bash
# Cuponera: debe seguir devolviendo los cupones públicos.
curl -s "http://localhost:3000/cuponera" -o /dev/null -w "%{http_code}\n"

# El mismo cupón privado, por su UUID: debe seguir abriendo (200).
# Guarda el ID antes del cambio para poder comparar.
curl -s "http://localhost:3000/cupon/<UUID_PRIVADO>" -o /dev/null -w "%{http_code}\n"
```

Y con la app levantada, entrar al dashboard con una cuenta con sesión: `/dashboard`
debe listar los cupones del usuario (eso no lo cubre `curl`).

**Línea base obligatoria**: anota el resultado de estos `curl` **antes** de aplicar
`0010`. Sin línea base, "sigue funcionando" es una impresión, no una comprobación.

## Paso 6 — Reversión

`0010` es reversible sin pérdida de datos:

```sql
drop policy if exists coupons_select_own_or_public on public.coupons;
create policy coupons_select_own_or_public on public.coupons
  for select using (true);

drop trigger if exists coupons_set_updated_at on public.coupons;
drop trigger if exists profiles_set_updated_at on public.profiles;

grant truncate on public.coupons, public.profiles to anon, authenticated;
grant execute on function public.handle_new_user() to anon, authenticated;
```

El historial reparado del Paso 2 **no se deshace**: esas migraciones sí están
aplicadas.

## Riesgos que asumo y cómo se acotan

- **Enlaces privados**: el riesgo real es aplicar `0010` sin la service key en
  Vercel. Mitigación: Paso 0.2 y la comprobación del Paso 5 con línea base.
- **Métricas**: `increment_views` solo incrementa si `is_public = true`; las
  visitas a cupones privados nunca se contaron. No cambia con esta migración, pero
  conviene decidirlo.
- **Ventana de error**: si algo falla en el Paso 4, el Paso 6 devuelve el
  comportamiento anterior en segundos sin tocar datos.

## Lo que este procedimiento NO arregla

- `user_exists(text)` sigue siendo un oráculo de enumeración de correos abierto a
  `anon`. Cerrarlo exige mover la comprobación al servidor y cambiar la UI de
  recuperación.
- `increment_views` / `increment_shares` siguen inflables sin límite.
- Las métricas de `updated_at` empiezan a cambiar solo a partir de la aplicación.