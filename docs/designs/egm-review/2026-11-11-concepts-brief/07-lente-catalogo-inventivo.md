# Lente `egm-inventive-catalyst` — contradicciones y transformaciones

- **Objeto:** `docs/designs/concepts_brief.md`
- **Encargo:** convertir contradicciones en alternativas. Atacar la conclusión
  central y producir modelos que el brief no consideró.
- **Contexto:** limpio.
- **Herramientas:** `Read`, `Grep`, `Glob`. Sin shell, sin red.
- **Veredicto:** **la unidad de cobro no determina el modelo: la forma del precio
  determina la unidad.** Y hay al menos seis modelos viables que no requieren
  medir un canje.

> Síntesis del Elefante. Etiquetas `F1`–`F15` del informe original; `F7`, `F12` y
> `F13` no se recuperaron y no se citan en el informe consolidado. Los informes
> crudos no se persistieron.

## La contradicción central, resuelta

**F2 — La forma del precio precede a la unidad.** `[OR]`

El brief razona: «primero necesito una unidad medible, después elijo un modelo».
Es al revés. Hay cuatro formas de precio, y solo una exige medir un resultado:

| Forma | Unidad | ¿Necesita medir un resultado? |
|---|---|---|
| Precio plano | El acceso, por período | No |
| Por activo | El número de objetos vivos | No: se cuentan |
| Prepago de recurso | Unidades consumidas | No: las cuenta el servidor |
| Por resultado | El evento de negocio | **Sí** |

**El canje es una consecuencia de haber elegido la cuarta forma, no una
precondición de cobrar.** El brief invirtió la flecha causal y de ahí sale toda su
conclusión.

## Hallazgos

**F1 — El canje es peor que las vistas.** `[OR]`
El brief rechaza `views` porque el visitante puede inflarlas (`0010:103-104`). En
un cobro por canje, **quien reporta el evento es quien paga por él**, y su
incentivo apunta a no reportarlo. Se cambia un contador inflable por un tercero
por un contador deflactable por el cliente. La sustitución empeora el problema que
dice resolver.

**F3 — La objeción contra el prepago es circular.** `[OR]`
El brief descarta el prepago porque «el costo dominante seguiría sin estar
acotado» (`:290`). Pero el costo dominante declarado en §6 es, precisamente, un
costo **por operación**. Un prepago por unidades consumidas acota exactamente ese
costo. La objeción se apoya en el argumento que la unidad de prepago resuelve.

**F4 — La fila de la marca de agua está invertida.** `[HV]`
`app/api/coupon-image/route.tsx:184` emite «Creado con EcoCupon.cl»
incondicionalmente. Lo falso no es la marca de agua del plan gratis: es el «Sin
marca de agua» del Pro (`app/page.tsx:257`), que no se cumple nunca.

**F5 — La exposición legal es independiente y está mal ordenada.** `[OR]`
Prometer IA en los términos y condiciones (`app/condiciones/page.tsx:44`), en los
metadatos que indexa Google y en la portada es un riesgo que no depende de ninguna
decisión de modelo. El brief lo pone tercero.

**F6 — «No se puede servir desde CDN» es implementación, no ley.** `[OR]`
El brief trata como restricción estructural algo que es una decisión de diseño
(`app/api/coupon-image/route.tsx:6`, `dynamic = "force-dynamic"`). Una restricción
que se puede cambiar no puede sostener una conclusión comercial.

**F8 — Reemplazar la bandera por un contador del servidor.** `[OR]`
Si la cuota es un conteo de eventos cuyo único escritor es el servidor, no hay
booleano que falsificar y la pregunta «dónde vive el derecho» desaparece: no hay
derecho que vivir, hay un medidor que sumar. Resuelve la decisión 2 sin migrar
ninguna política.

**F9 — SmarterBOT necesita las direcciones inversas.** `[HC]`
El brief compara tres vías en las que **EcoCupon es quien concede**. Faltan:
- **SmarterBOT como revendedor de EcoCupon.** EcoCupon no toca WhatsApp, no carga
  costo variable por mensaje, y hereda demanda instalada.
- **EcoCupon como módulo dentro de la oferta de SmarterBOT.** EcoCupon deja de
  necesitar marca propia.
La pregunta que ordena no es la forma del acuerdo sino **quién trae al comercio y
quién carga el costo variable**.

**F10 — No hay comprador en el documento.** `[OR]`
Sin ICP, sin alternativa actual del comercio, sin canal. El competidor real es
**no hacer nada**, que es gratis.

**F11 — El render anónimo bloquea cualquier modelo de cobro.** `[HV]`
`lib/supabase/middleware.ts:43` cobra un `getUser()` en cada petición que pasa por
el matcher, incluidos los renders sin sesión. Ningún modelo atribuye ese costo a
un cliente. No es un hallazgo de precio: es un bloqueante transversal.

**F14 — Ocho alternativas con ocho criterios.** `[OR]`
Sin criterio común, la sección no permite decidir. Las alternativas no están
rechazadas: están yuxtapuestas.

**F15 — «Cambia el signo» es una afirmación cuantitativa sin número.** `[OR]`
Un cambio de signo es un resultado de cálculo. El brief declara no entregar cifras
y afirma un signo.

## Resultado Final Ideal

Formulación del lente, en su propia voz:

> **Facturar eventos que el servidor registra por sí solo. Reportar resultados que
> el comercio elige contar.**

El sistema cobra por lo que ya sabe —cupones creados, objetos almacenados,
posiciones publicadas— y entrega al comercio, como valor y no como base de cobro,
la capacidad de contar lo que a él le importa. Así el precio no depende de una
métrica que el cliente controla, y el comercio recibe información que el brief hoy
le quiere vender como obligación.

## Los seis modelos desarrollados

| Modelo | Nombre | Unidad | Carga |
|---|---|---|---|
| **A** | Prepago por renders | Render generado, contado por el servidor | Variable, prepagada |
| **B** | Prepago por posiciones | Posición viva en la vitrina, por semana | Variable, prepagada |
| **C** | Suscripción por cupones | Cupones por período (índice ya existente) | Fija, con techo |
| **D** | Escasez sobre audiencia ajena | Acceso a la audiencia de un tercero | Fija por campaña |
| **E** | Servicio asistido | Hora o entregable | Fija por servicio |
| **R** | Licencia blanca | Instancia, plana | Fija, sin costo variable |

**El modelo R es el único que resuelve a la vez los dos activos que el brief
identifica por separado:** el lado de la demanda vacío y la imposibilidad de medir
valor. Un revendedor que ya tiene los comercios paga una licencia plana y trae la
demanda. No exige canje, no exige webhook propio, no carga costo variable por
evento.

## Tabla de falsos dilemas

Contradicciones que el brief presenta como excluyentes y no lo son:

| El brief presenta | En realidad |
|---|---|
| Suscripción **o** prepago | Prepago **con** asiento base |
| Reveniu **o** Mercado Pago | Distintas funciones: tarifa frente a documento tributario |
| SmarterBOT incluido **o** independiente | Revendedor, módulo, o ambos |
| Medir canjes **o** no cobrar | Cobrar por lo que el servidor ya cuenta |
| Cobrar **o** mantener todo gratis | Cobrar por una parte y regalar el resto |
| Cerrar la exposición **o** decidir el modelo | Son independientes |

## Los cuatro híbridos

1. **Prepago + servicio asistido.** La única combinación vendible esta semana sin
   construir nada.
2. **Asiento + prepago de renders.** Acota el costo y da recurrencia, al precio de
   reintroducir el estado de suscripción.
3. **Gratis para el comercio + licencia blanca al revendedor.** El comercio no
   paga; paga quien trae comercios.
4. **Suscripción de cupones + auditoría de resultado regalada.** El conteo del
   comercio se entrega como valor, no se cobra como unidad.

## Respuestas a las diez preguntas

1. **¿Es necesario medir canjes?** No: solo si se elige la forma de precio por
   resultado.
2. **¿Madurez técnica confundida con potencial comercial?** Sí, y la confusión
   está en la flecha causal (F2).
3. **¿Modelos sin canjes?** Seis, en la tabla de arriba.
4. **¿Valor desde el día uno?** Cupones, imagen con QR, enlace público, vitrina,
   contadores, logo validado.
5. **¿Suscripción como modelo principal?** No necesariamente: el prepago acota el
   costo que la suscripción deja abierto (F3).
6. **¿Alternativas?** Seis modelos más cuatro híbridos.
7. **¿Reveniu y Mercado Pago compiten?** Cumplen funciones distintas.
8. **¿SmarterBOT?** Al menos cinco direcciones, dos de ellas invertidas (F9).
9. **¿Riesgo de automatizaciones en precio fijo?** Es el peor empaquetado posible:
   costo variable dentro de un precio fijo, sin medición.
10. **¿Empezar sin prometer lo inexistente?** Vender lo que ya existe por el canal
    manual que ya opera, y retirar las promesas falsas el mismo día.

## Sus dos frases más útiles

**«La unidad es consecuencia de la forma del precio, no al revés.»** `[OR]`

**«El canje es peor que las vistas: quien reporta el evento es quien paga por
él.»** `[OR]`
