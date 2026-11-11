# Lente `egm-implementation-readiness` — viabilidad y secuencia

- **Objeto:** `docs/designs/concepts_brief.md`
- **Encargo:** evaluar si lo que el brief propone se puede ejecutar, en qué orden,
  y con qué precondiciones. Atacar la conclusión central.
- **Contexto:** limpio.
- **Herramientas:** `Read`, `Grep`, `Glob`. Sin shell, sin red.
- **Veredicto:** **la secuencia del brief rompe el sistema.** El orden propuesto
  aplica una migración que versiona una política defectuosa antes de decidir si
  esa política debe existir, y encadena publicar y migrar como si fueran un solo
  paso.

> Síntesis del Elefante. El informe original numeraba los hallazgos sin etiqueta
> alfabética y proponía un orden propio de 8 pasos (0 a 7), que se reproduce al
> final. Los informes crudos no se persistieron.

## El bloqueante que el brief no ve

**Aplicar `0010` antes de resolver la decisión 2 convierte en código versionado
la política que el brief denuncia.** `[HV]`

`supabase/migrations/0010_harden_rls_and_timestamps.sql:51-53` **versiona**
`profiles_update_own` tal como está hoy en la base:

```sql
... for update using (auth.uid() = id) with check (auth.uid() = id)
```

Esa policy permite que el titular reescriba **cualquier** columna de su propia
fila, incluida `plan_type`. El brief dedica su decisión 2 exactamente a eso: «ningún
dato que conceda cuota puede residir en una fila que su titular pueda escribir».
El brief propone aplicar `0010` (decisión 6) y **después** decidir dónde vive el
derecho (decisión 2). Ese orden garantiza que, cuando se decida, haya que escribir
una segunda migración que deshaga lo que la primera acaba de fijar.

**Corolario:** las decisiones 2 y 6 no son independientes, y el brief afirma que
las cuatro primeras sí lo son.

## Hallazgos

1. **La única acción ejecutable está tercera.** `[OR]` sobre `[HV]`
   Retirar las promesas falsas no depende de ninguna decisión ni de ningún
   despliegue. Está en la posición 3.

2. **La decisión 2 no es ejecutable sin reparar el historial de migraciones.**
   `[HV]`
   `CLAUDE.md` advierte que `0003`, `0004`, `0007`, `0008` y `0009` están
   aplicadas en la base pero **no registradas** en
   `supabase_migrations.schema_migrations`. Cualquier `db push` las vería como
   pendientes. Y el proyecto **no está enlazado**: `supabase/.temp/project-ref` no
   existe. Falta `supabase login` y `supabase link` antes de cualquier otra cosa.

3. **`SUPABASE_SERVICE_ROLE_KEY` es una precondición que el brief no nombra.**
   `[HV]`
   `0010` acota `coupons_select_own_or_public` a `is_public = true or auth.uid() =
   user_id`, lo que **rompe el enlace directo a un cupón privado** para un
   visitante anónimo. Ese enlace solo sobrevive porque `app/cupon/[id]/page.tsx`
   lee con service role. Si la variable no está en Vercel, aplicar `0010` deja sin
   funcionar **lo único que un comercio que paga usa**: el enlace que le manda a
   sus clientes. El briefing no lo menciona.

4. **Publicar `main` y aplicar migraciones no pueden ser un solo paso.** `[HV]`
   `CLAUDE.md:7-8` dice que cada merge despliega solo. Publicar `main` **crea** un
   despliegue. El runbook de migraciones exige una ventana sin despliegues en
   curso. Encadenarlos contradice la propia documentación operativa del proyecto.
   Y falta un respaldo antes de tocar la base.

5. **La consecuencia de `0007` está sobreactuada en el brief.** `[HV]`
   `0007` está envuelta en `begin;` (`:23`) y `commit;` (`:37`), así que al
   re-ejecutarse revierte y el esquema queda igual. La frase «con la aplicación ya
   desplegada leyendo un esquema que no existe» no se sostiene. El daño real es
   que **el push se detiene y las migraciones siguientes no se aplican**.

6. **No existe un paso 0 de costo.** `[OR]`
   Ni línea base, ni punto de equilibrio, ni tarifas de proveedor. El brief decide
   sobre un precio sin conocer el costo.

7. **§9 se contradice a sí mismo.** `[OR]` sobre `[HV]`
   Concluye que la comparación de pasarelas «no es la decisión» y a la vez deja
   como entregable pendiente la comparación de tarifas verificadas. Una de las dos
   frases sobra.

8. **El plan Business no tiene pasarela: su canal es WhatsApp, y nunca ha
   convertido.** `[HV]`
   `app/precios/page.tsx:61-62` no apunta a ninguna pasarela: es un
   `https://wa.me/56979540471?text=…`. **Corrección posterior:** el informe
   original afirmaba que la mitad alta de la oferta «se vende hoy por
   conversación», infiriendo actividad de la existencia del enlace. El propietario
   confirmó que **nunca se ha vendido**. El canal existe; no está validado. Esto
   tiene dos lecturas y las dos importan: el brief no lo cuenta como canal
   operando (acertado) ni como intento fallido (omisión).

9. **«Transferencia bancaria» es incompatible con un cobro recurrente
   automático.** `[HV]`
   `app/precios/page.tsx:164` la promete. El plan se anuncia «/mes». Una
   transferencia no se puede debitar sola: o la cobranza es manual, o el producto
   no es una suscripción. Es una decisión de producto disfrazada de detalle de
   pago.

10. **El drift de `plan_type` es total.** `[HV]`
    Cero apariciones en `app/`, `lib/`, `components/`, `hooks/`. Si alguien paga
    hoy por Reveniu, no queda registro **y no recibe nada**.

11. **§9 apoya su conclusión en una fuente no trazable.** `[HV]`
    «Reveniu, verificado antes, ofrece el mismo conjunto» no lleva archivo, línea,
    fecha ni artefacto. La única mención de Reveniu en el repositorio es
    `docs/designs/2026-11-11_DRIFT_REPORT.md:65-72`.

12. **La instrucción de publicar no incluye verificación posterior.** `[OR]`
    El commit de SEO cambia `/robots.txt`, `/sitemap.xml`, canonical y `og:*`.
    Publicar sin comprobar esos cuatro endpoints deja el resultado sin confirmar,
    y el drift report los usa como el marcador de que el deploy ocurrió.

## El orden que este lente propone

Reproducido tal como lo entregó. **No es una propuesta de implementación**: cada
paso está sujeto a la decisión del propietario y a la prohibición de la §7 del
brief.

| # | Paso | Naturaleza |
|---|---|---|
| 0 | Abrir el panel de Reveniu: ¿alguien ha pagado? | Lectura, cero ingeniería |
| 1 | Establecer el costo fijo mensual y el punto de equilibrio | Lectura |
| 2 | Retirar del sitio las promesas que no se cumplen | Edición de textos |
| 3 | Decidir la forma del precio | Decisión del propietario |
| 4 | Resolver dónde vive el derecho (`plan_type`) | Decisión, **antes** de `0010` |
| 5 | `supabase login` + `link`, reparar el historial, `db push --dry-run` | Operación |
| 6 | Verificar `SUPABASE_SERVICE_ROLE_KEY` en Vercel | Operación |
| 7 | Publicar `main` y comprobar los cuatro endpoints del commit de SEO | Operación |

Los pasos 5 a 7 son los únicos que tocan el sistema, y son los últimos, después de
que exista una decisión comercial. El brief los pone primero.

## Respuestas a las diez preguntas

1. **¿Es necesario medir canjes para cobrar?** No. Y no es implementable antes de
   resolver el historial de migraciones.
2. **¿Madurez técnica confundida con potencial comercial?** Al revés: el brief
   **subestima** lo implementable. Varias alternativas que descarta son más
   baratas que la que elige.
3. **¿Modelos sin canjes?** Todos los que no dependan de un webhook nuevo.
4. **¿Valor desde el día uno?** Lo que ya funciona, ofrecido por el canal manual
   disponible (hallazgo 8). *El canal no está validado: nunca ha vendido.*
5. **¿Suscripción como modelo principal?** La transferencia bancaria prometida es
   incompatible con ella (hallazgo 9).
6. **¿Alternativas?** Existen y el brief no las evalúa por costo de implementación.
7. **¿Reveniu y Mercado Pago?** Deciden tarifa y documento tributario, no
   capacidad.
8. **¿SmarterBOT?** Es la única decisión con reloj ajeno: se inicia temprano o se
   descarta.
9. **¿Riesgo de automatizaciones en precio fijo?** Alto, y el brief no lo acota.
10. **¿Empezar sin prometer lo inexistente?** Es el paso 2 de la tabla, y es el
    único que no tiene precondición alguna.

## Su frase más útil

**«El plan Business, el de $29.990, no tiene pasarela: su único canal es
WhatsApp. El brief lo trata como alternativa a evaluar, y no ha vendido nunca. El
error del brief no es darlo por operativo —no lo hace— sino no leerlo como un
intento comercial que ya falló.»** `[HV]` + `[OR]`
