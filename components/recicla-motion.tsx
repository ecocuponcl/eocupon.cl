"use client"

import { gsap, SplitText, useGSAP } from "@/lib/gsap"

const RISE = 18

/**
 * Cuenta desde 0 hasta el valor de `data-count-to`, conservando prefijo y
 * sufijo. El texto final ya viene en el HTML: si esto no corre, se ve igual.
 */
function countTo(el: HTMLElement) {
  const target = Number(el.dataset.countTo)
  if (!Number.isFinite(target)) return
  const decimals = Number(el.dataset.countDecimals ?? 0)
  const prefix = el.dataset.countPrefix ?? ""
  const suffix = el.dataset.countSuffix ?? ""
  const format = new Intl.NumberFormat("es-CL", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  const value = { v: 0 }

  gsap.to(value, {
    v: target,
    duration: 1.1,
    ease: "power2.out",
    scrollTrigger: { trigger: el, start: "top 92%", once: true },
    onUpdate: () => {
      el.textContent = `${prefix}${format.format(value.v)}${suffix}`
    },
  })
}

/**
 * Movimiento de la landing Recicla.
 *
 * El scope no se le pasa a useGSAP porque el scope en texto se resuelve
 * durante el render, y ahí no hay DOM (el servidor revienta). En vez de eso se
 * resuelve `main#top` dentro del efecto y todos los selectores pasan por
 * `gsap.utils.selector`, así que ninguno alcanza otras páginas del sitio.
 *
 * Reglas que se respetan a propósito:
 * - `prefers-reduced-motion` desactiva todo el bloque; matchMedia revierte lo
 *   creado si el usuario cambia de preferencia.
 * - Sólo se animan transform y `autoAlpha`; nunca width/height/top/left.
 * - El titular sube por líneas desde detrás de una máscara (`mask: "lines"`).
 *   Eso retrasa el LCP: el texto no se pinta hasta que la línea sale de la
 *   máscara. Si algún día importan los Core Web Vitals, la versión barata es
 *   sacar la máscara y dejar sólo el desplazamiento.
 * - `.ticket` no se toca: su transform lo gobierna el `@keyframes float` de
 *   recicla.css, y mezclar los dos deja el ticket temblando. El parallax va en
 *   `.hero-visual`, que es su contenedor, no en el ticket.
 */
export function ReciclaMotion() {
  useGSAP(() => {
    const root = document.getElementById("top")
    if (!root) return

    const q = gsap.utils.selector(root)
    const one = (selector: string) => q(selector)[0]

    const mm = gsap.matchMedia()

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const rise = (
        targets: string,
        trigger: string,
        vars: gsap.TweenVars = {},
      ) => {
        const elements = q(targets)
        if (!elements.length) return
        gsap.from(elements, {
          y: RISE,
          autoAlpha: 0,
          duration: 0.55,
          ease: "power2.out",
          stagger: 0.09,
          ...vars,
          scrollTrigger: { trigger: one(trigger), start: "top 85%", once: true },
        })
      }

      const countersIn = (selector: string) =>
        q(`${selector} [data-count-to]`).forEach((el) => countTo(el as HTMLElement))

      // Titular por líneas. `autoSplit` vuelve a partir el texto al cambiar el
      // ancho: sin eso las máscaras quedan con las medidas anteriores y el
      // titular se recorta al rotar el teléfono.
      //
      // `onSplit` va como función normal a propósito: envolverlo en el
      // `contextSafe` de useGSAP crea un ciclo de contextos (el contexto raíz
      // entra al de matchMedia y viceversa) y `getTweens()` revienta por
      // recursión. El tween y el propio SplitText quedan igual dentro del
      // contexto de matchMedia, así que se revierten con él.
      const title = one(".hero-copy h1")
      if (title) {
        SplitText.create(title, {
          type: "lines",
          mask: "lines",
          autoSplit: true,
          onSplit: (self: SplitText) =>
            gsap.from(self.lines, {
              yPercent: 110,
              duration: 0.55,
              stagger: 0.06,
              ease: "power3.out",
            }),
        })
      }

      // Héroe: entra al cargar, sin ScrollTrigger porque ya está en pantalla.
      gsap
        .timeline({ defaults: { duration: 0.6, ease: "power3.out" } })
        .from(
          q(".hero-copy .eyebrow, .hero-copy .lede, .hero-copy .hero-ctas, .hero-note"),
          { y: RISE, autoAlpha: 0, stagger: 0.08 },
          0.12,
        )
        .from(
          q(".ticket-stage"),
          { y: RISE + 10, autoAlpha: 0, scale: 0.96, duration: 0.75 },
          0.2,
        )
        .from(q(".ticket-2"), { autoAlpha: 0 }, "<")

      // Parallax del cupón: se queda atrás mientras la portada sale de pantalla.
      gsap.to(q(".hero-visual"), {
        yPercent: -18,
        ease: "none",
        scrollTrigger: {
          trigger: one(".hero"),
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      })

      rise(".stats .stat", ".stats", { stagger: 0.1 })
      countersIn(".stats")

      rise("#como .head", "#como .head", { stagger: 0 })
      rise(".steps .step", ".steps")

      rise("#para-quien .head", "#para-quien .head", { stagger: 0 })
      rise(".aud", ".aud-grid", { stagger: 0.1 })

      rise(".panel", ".panel")
      countersIn(".panel")
      gsap.from(q(".bars i"), {
        scaleY: 0,
        transformOrigin: "bottom center",
        duration: 0.6,
        ease: "power2.out",
        stagger: 0.045,
        scrollTrigger: { trigger: one(".bars"), start: "top 92%", once: true },
      })
      rise(".panel-copy > *", ".panel-wrap", { stagger: 0.08 })

      rise(".split .head", ".split .head", { stagger: 0 })
      rise(".split-row", ".split-table", { x: -14, y: 0, stagger: 0.07 })

      rise(".offer", ".offer", { stagger: 0, duration: 0.65 })

      rise(".pilot-copy > *", ".pilot-grid", { stagger: 0.07 })
      rise("form.card", "form.card", { stagger: 0, y: RISE + 8 })

      rise("#faq .head", "#faq .head", { stagger: 0 })
      rise(".qa", ".faq", { stagger: 0.06 })
    })
  })

  return null
}
