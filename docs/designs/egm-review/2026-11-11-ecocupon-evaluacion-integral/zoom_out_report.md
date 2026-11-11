# Etapa 5 — Zoom Out (revisor `egm-zoom-out`)

- **Objetivo:** `docs/designs/2026-11-11-ecocupon-evaluacion-integral.md`
- **Fecha:** 2026-11-11
- **Modo:** BRAINSTORM/REVIEW, contexto limpio. El revisor no vio esta conversación.
- **Estado:** ejecutado. Cuota de subagentes restablecida.

---

## 1. Bloqueante — El documento mide producción, pero buena parte de los
«problemas» ya están arreglados en `main`, y nunca separa «sin construir» de «sin
desplegar».

El revisor verificó el repositorio y encontró que estas secciones marcan como
hallazgos cosas que ya no son ciertas:

| Sección | Lo que dice el documento | Estado real en `main` |
|---|---|---|
| §5.4 | Registro sin `id`, `name`, `autocomplete`, etiqueta, `h1` ni enlaces legales | **Falso**: `app/auth/registro/page.tsx` ya tiene `FieldLabel htmlFor`, los tres `autoComplete`, un `<h1>` y enlaces a `/condiciones` y `/privacidad` |
| §5.1, §5.2 | El hero muestra una maqueta y un sello falso de IA | **Superado**: `app/page.tsx` ya renderiza un cupón real con imagen y `alt` |
| §7.3 | Metadatos idénticos en todas las páginas | **Superado**: cada página exporta su propio `metadata` |
| §8, filas 1, 2 y 4 | «Generación con IA», «Sin marca de agua», «cientos de negocios» | **Ya no están** en `app/` |

**Consecuencia:** la tesis central —que el sitio promete lo que el producto no
hace— es, en `main`, sobre todo un problema de **despliegue**, no de contenido. El
documento detecta el atraso en §7.3 pero lo archiva como un ítem de decisión más,
en lugar de propagarlo a §5, §8 y §9. Tal como está, §9 es en parte una orden de
trabajo para rehacer cosas hechas, y las etiquetas `[HV]` exageran su vigencia.

**Corrección exigida:** una columna de línea base —verificado en `main` frente a
verificado en producción— antes de que cualquier ítem P0 o P1 sea accionable.

## 2. Grave — §2, §3 y §4 diseñan facturación recurrente completa para un
producto con cero ventas.

El §1 declara que fijar precios es prematuro; §2-§4 diseñan niveles, cupos
mensuales, estado de plan dependiente de marca de agua, prorrateo, ventanas de
bajada, 3 reintentos más 7 días de gracia, correos de recuperación a los 7 y 21
días, y ocho requisitos de pasarela. La comparación de pasarelas ni siquiera se
ejecutó, así que el núcleo vinculante de §4 —tarifas contra un ticket de $9.990,
documento tributario— está sin verificar.

Esto pertenece a un documento aparte, que se abre cuando exista un comprador que
paga. Aquí debe quedar: «acceso con cupo mensual» como hipótesis, un párrafo.

## 3. Grave — §2.2 elige la unidad de cobro por costo de consulta, no por valor
para el cliente.

«Acceso + cupones/mes» gana porque `coupons.user_id + created_at` «ya son
exactos». Eso es sesgo de disponibilidad: se factura la unidad que resulta más
barata de consultar. Ata el ingreso a cupones **creados**, no a vistas o
compartidos **entregados**, y exige la maquinaria nueva más grande del documento
—estado de plan servido por el servidor, aplicación del cupo, marca de agua
condicional— antes de la primera venta.

El documento debería detenerse en «vender a mano, después elegir». Recomendar una
unidad mientras declara la demanda sin medir no tiene sustento.

## 4. Grave — §11.1 contra §1-§3. La única pregunta que cambiaría todas las
conclusiones se difiere, y el documento la responde igual.

Si nunca se intentó vender, el problema es de distribución y §2-§4 son
conjeturas. Si se intentó y falló, la razón es el dato más valioso disponible. El
documento pide al propietario resolver eso y luego procede como si estuviera
resuelto. Debe cortar §3-§4 hasta que §11.1 tenga respuesta.

## 5. Menor — §6, §6.2, §6.3 y las tablas de estado de herramientas en §10.

Es reporte de proceso («no hay plugins de diseño instalados», dos agentes fallaron
por cuota, `/egm:egm-brainstorm` está bloqueado). No dice nada del producto y
difumina qué se midió frente a qué se afirmó. El mismo material aparece dos veces.

## 6. Menor — Extensión contra audiencia.

480 líneas, ninguna decisión, y un propietario solo con cinco cuentas. El producto
utilizable son las cinco ediciones de texto de §9 y «vende un comercio a mano esta
semana». Debería salir como una lista de una página, con las tablas de medición
como anexo.

## 7. Brecha de reutilización.

El documento propone unificar cabeceras y pies (§5.3, §9 ítems 12 y 16) sin
ninguna búsqueda en el código. `components/dashboard-nav.tsx`,
`components/ui/field.tsx`, `components/ui/label.tsx` y el resto del conjunto
shadcn ya existen. El documento nunca declara qué existe ya, así que un lector no
puede distinguir construcción nueva de configuración.
