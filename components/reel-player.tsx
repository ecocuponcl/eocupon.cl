"use client"

import { useEffect, useRef, useState } from "react"
import { Play, Pause, RotateCcw, Repeat } from "lucide-react"
import { cn } from "@/lib/utils"
import styles from "./reel-player.module.css"

const COMP_W = 1000
const COMP_H = 600
// Bajo esta escala el escenario deja de encogerse y recorta los laterales:
// el cupon vive en el centro, asi que en movil se ve entero.
const MIN_SCALE = 0.62
const REEL_END = 15000
const CODE = "HOLA4TIME"
const VIEWS = 1284
const SHARES = 316

const SCENES = [
  { id: 1, name: "Kinetic type", start: 0, end: 2200 },
  { id: 2, name: "El cupón se arma", start: 2200, end: 6600 },
  { id: 3, name: "Compartir y medir", start: 6600, end: 9700 },
  { id: 4, name: "Cuponera", start: 9700, end: 12800 },
  { id: 5, name: "Cierre", start: 12800, end: 15000 },
]

const SHOPS = [
  { name: "Panadería Los Aromos", off: "-15%", code: "AROMOS15", seed: 31 },
  { name: "Café Aurora", off: "-20%", code: "AURORA20", seed: 32 },
  { name: "Verdulería El Huerto", off: "-25%", code: "HUERTO25", seed: 33 },
  { name: "Bicicletería Ruta 5", off: "-30%", code: "RUTA5", seed: 34 },
  { name: "Peluquería Nova", off: "-10%", code: "NOVA10", seed: 35 },
  { name: "Minimarket Doña Rosa", off: "-20%", code: "ROSA20", seed: 36 },
]

const EASE = {
  out: "cubic-bezier(.16,1,.3,1)",
  soft: "cubic-bezier(.22,1,.36,1)",
  spring: "cubic-bezier(.34,1.5,.5,1)",
  glide: "cubic-bezier(.2,.7,.3,1)",
  linear: "linear",
}

interface Track {
  tr: string
  at: number
  d: number
  e?: string
  stagger?: number
  k: Keyframe[]
}

// Todas las animaciones viven en la misma linea de tiempo: `at` es el retardo
// absoluto desde el segundo cero y un unico reloj les escribe currentTime.
const TRACKS: Track[] = [
  { tr: "glowA", at: 0, d: REEL_END, e: EASE.linear, k: [
    { transform: "translate3d(-30px,10px,0) scale(1)" },
    { transform: "translate3d(50px,-26px,0) scale(1.22)", offset: 0.5 },
    { transform: "translate3d(-30px,10px,0) scale(1)" } ] },
  { tr: "glowB", at: 0, d: REEL_END, e: EASE.linear, k: [
    { transform: "translate3d(20px,-10px,0) scale(1.1)" },
    { transform: "translate3d(-40px,20px,0) scale(.95)", offset: 0.55 },
    { transform: "translate3d(20px,-10px,0) scale(1.1)" } ] },
  { tr: "weave", at: 0, d: REEL_END, e: EASE.linear, k: [
    { transform: "translate3d(0,0,0)" },
    { transform: "translate3d(-44px,-44px,0)" } ] },

  { tr: "kick", at: 120, d: 640, e: EASE.out, k: [
    { opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "none" } ] },
  { tr: "kickMark", at: 120, d: 760, e: EASE.spring, k: [
    { opacity: 0, transform: "scale(.6) rotate(-12deg)" }, { opacity: 1, transform: "none" } ] },
  { tr: "l1", at: 340, d: 940, e: EASE.out, k: [
    { transform: "translateY(115%)" }, { transform: "translateY(0)" } ] },
  { tr: "l2w1", at: 470, d: 940, e: EASE.out, k: [
    { transform: "translateY(115%)" }, { transform: "translateY(0)" } ] },
  { tr: "l2w2", at: 570, d: 940, e: EASE.out, k: [
    { transform: "translateY(115%)" }, { transform: "translateY(0)" } ] },
  { tr: "hl", at: 980, d: 620, e: EASE.out, k: [
    { transform: "scaleX(0)" }, { transform: "scaleX(1)" } ] },
  { tr: "s1sub", at: 1040, d: 720, e: EASE.out, k: [
    { opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" } ] },

  { tr: "panel", at: 2350, d: 700, e: EASE.out, k: [
    { opacity: 0, transform: "translateX(-24px)" }, { opacity: 1, transform: "none" } ] },
  { tr: "card", at: 2600, d: 900, e: EASE.spring, k: [
    { opacity: 0, transform: "translateY(30px) scale(.93)" }, { opacity: 1, transform: "none" } ] },
  { tr: "cardH", at: 2900, d: 620, e: EASE.soft, k: [
    { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0 0 0)" } ] },
  { tr: "ph", at: 3150, d: 900, e: EASE.soft, k: [
    { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0 0)" } ] },
  { tr: "badge", at: 3620, d: 800, e: EASE.spring, k: [
    { opacity: 0, transform: "scale(.4) rotate(-18deg)" }, { opacity: 1, transform: "none" } ] },
  { tr: "cardOff", at: 3800, d: 760, e: EASE.out, k: [
    { opacity: 0, transform: "translateY(16px)" }, { opacity: 1, transform: "none" } ] },
  { tr: "cardSub", at: 3960, d: 660, e: EASE.out, k: [
    { opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" } ] },
  { tr: "cardCode", at: 4180, d: 700, e: EASE.out, k: [
    { opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" } ] },
  { tr: "cardQr", at: 4900, d: 520, e: EASE.out, k: [
    { opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" } ] },
  { tr: "cardBtns", at: 5600, d: 640, e: EASE.spring, stagger: 90, k: [
    { opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" } ] },

  { tr: "sum", at: 6700, d: 820, e: EASE.spring, k: [
    { opacity: 0, transform: "translate(80px,0) scale(.94)" }, { opacity: 1, transform: "none" } ] },
  { tr: "ring", at: 7150, d: 1500, e: EASE.glide, stagger: 240, k: [
    { opacity: 0.8, transform: "scale(.35)" }, { opacity: 0, transform: "scale(1.85)" } ] },
  { tr: "bub1", at: 7050, d: 760, e: EASE.spring, k: [
    { opacity: 0, transform: "translate(24px,8px) scale(.94)" }, { opacity: 1, transform: "none" } ] },
  { tr: "bubLink", at: 7560, d: 660, e: EASE.out, k: [
    { opacity: 0, transform: "translate(20px,6px)" }, { opacity: 1, transform: "none" } ] },
  { tr: "bub2", at: 7860, d: 760, e: EASE.spring, k: [
    { opacity: 0, transform: "translate(20px,8px) scale(.94)" }, { opacity: 1, transform: "none" } ] },
  { tr: "stat1", at: 7800, d: 760, e: EASE.out, k: [
    { opacity: 0, transform: "translateY(18px)" }, { opacity: 1, transform: "none" } ] },
  { tr: "stat2", at: 7930, d: 760, e: EASE.out, k: [
    { opacity: 0, transform: "translateY(18px)" }, { opacity: 1, transform: "none" } ] },

  { tr: "s4k", at: 9760, d: 700, e: EASE.out, k: [
    { opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "none" } ] },
  { tr: "s4h", at: 9880, d: 760, e: EASE.out, k: [
    { opacity: 0, transform: "translateY(16px)" }, { opacity: 1, transform: "none" } ] },
  { tr: "mini", at: 10000, d: 820, e: EASE.spring, stagger: 95, k: [
    { opacity: 0, transform: "translateY(26px) scale(.96)" }, { opacity: 1, transform: "none" } ] },
  { tr: "s4foot", at: 11100, d: 700, e: EASE.out, k: [
    { opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "none" } ] },

  { tr: "s5mark", at: 12760, d: 820, e: EASE.spring, k: [
    { opacity: 0, transform: "scale(.6) rotate(-10deg)" }, { opacity: 1, transform: "none" } ] },
  { tr: "s5name", at: 12900, d: 920, e: EASE.out, k: [
    { transform: "translateY(112%)" }, { transform: "translateY(0)" } ] },
  { tr: "s5tag", at: 13200, d: 760, e: EASE.out, k: [
    { opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" } ] },
  { tr: "s5url", at: 13500, d: 700, e: EASE.out, k: [
    { opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "none" } ] },
  { tr: "sweep", at: 13650, d: 900, e: EASE.glide, k: [
    { opacity: 0, transform: "translateX(-42%) skewX(-12deg)" },
    { opacity: 0.85, offset: 0.4, transform: "translateX(12%) skewX(-12deg)" },
    { opacity: 0, transform: "translateX(120%) skewX(-12deg)" } ] },

  { tr: "scene1", at: 2150, d: 270, e: EASE.linear, k: [
    { opacity: 1 }, { opacity: 0 } ] },
  { tr: "scene2", at: 2150, d: 4450, e: EASE.linear, k: [
    { opacity: 0, offset: 0 }, { opacity: 1, offset: 0.06 },
    { opacity: 1, offset: 0.945 }, { opacity: 0, offset: 1 } ] },
  { tr: "scene3", at: 6350, d: 3350, e: EASE.linear, k: [
    { opacity: 0, offset: 0 }, { opacity: 1, offset: 0.09 },
    { opacity: 1, offset: 0.925 }, { opacity: 0, offset: 1 } ] },
  { tr: "scene4", at: 9450, d: 3350, e: EASE.linear, k: [
    { opacity: 0, offset: 0 }, { opacity: 1, offset: 0.09 },
    { opacity: 1, offset: 0.925 }, { opacity: 0, offset: 1 } ] },
  { tr: "scene5", at: 12550, d: 240, e: EASE.soft, k: [
    { opacity: 0 }, { opacity: 1 } ] },
]

const at = (key: string) => ({ "data-tr": key })

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function easeOutCubic(x: number) {
  return 1 - Math.pow(1 - x, 3)
}

function formatTime(ms: number) {
  const total = clamp(ms, 0, REEL_END)
  const seconds = Math.floor(total / 1000)
  const cents = Math.floor((total % 1000) / 10)
  return `00:${String(seconds).padStart(2, "0")}.${String(cents).padStart(2, "0")}`
}

/* Codigos QR decorativos: patron determinista con los tres localizadores,
   la linea de sincronia y, si cabe, el patron de alineacion. */
function mulberry32(seed: number) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const gridCache = new Map<string, { n: number; cells: number[][] }>()

function qrGrid(seed: number, n: number, align: boolean) {
  const key = `${seed}:${n}`
  const cached = gridCache.get(key)
  if (cached) return cached

  const random = mulberry32(seed * 2654435761)
  const cells: number[][] = []
  for (let y = 0; y < n; y++) {
    const row: number[] = []
    for (let x = 0; x < n; x++) row.push(random() > 0.48 ? 1 : 0)
    cells.push(row)
  }

  const finder = (ox: number, oy: number) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const edge = x === 0 || x === 6 || y === 0 || y === 6
        const core = x >= 2 && x <= 4 && y >= 2 && y <= 4
        cells[oy + y][ox + x] = edge || core ? 1 : 0
      }
    }
  }
  finder(0, 0)
  finder(n - 7, 0)
  finder(0, n - 7)

  for (let i = 0; i < 8; i++) {
    cells[7][i] = 0
    cells[i][7] = 0
    cells[7][n - 1 - i] = 0
    cells[i][n - 8] = 0
    cells[n - 8][i] = 0
    cells[n - 1 - i][7] = 0
  }
  for (let i = 8; i < n - 8; i++) {
    const value = i % 2 === 0 ? 1 : 0
    cells[6][i] = value
    cells[i][6] = value
  }
  if (align) {
    const ax = n - 9
    const ay = n - 9
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const edge = x === 0 || x === 4 || y === 0 || y === 4
        const core = x === 2 && y === 2
        cells[ay + y][ax + x] = edge || core ? 1 : 0
      }
    }
  }

  const grid = { n, cells }
  gridCache.set(key, grid)
  return grid
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function drawQr(canvas: HTMLCanvasElement | null, progress: number, seed: number, n: number, align: boolean) {
  if (!canvas) return
  const ctx = canvas.getContext("2d")
  if (!ctx) return
  const size = canvas.width
  ctx.clearRect(0, 0, size, size)
  if (progress <= 0.01) return

  const grid = qrGrid(seed, n, align)
  const cell = size / grid.n
  ctx.fillStyle = "#FFFFFF"
  roundRect(ctx, 0, 0, size, size, size * 0.08)
  ctx.fill()

  const finders: number[][] = []
  const data: number[][] = []
  for (let y = 0; y < grid.n; y++) {
    for (let x = 0; x < grid.n; x++) {
      if (!grid.cells[y][x]) continue
      const isFinder =
        (x < 8 && y < 8) || (x >= grid.n - 8 && y < 8) || (x < 8 && y >= grid.n - 8)
      ;(isFinder ? finders : data).push([x, y])
    }
  }
  data.sort((a, b) => a[0] + a[1] - (b[0] + b[1]) || a[1] - b[1])

  ctx.fillStyle = "#0E1F16"
  ctx.globalAlpha = Math.min(1, progress / 0.22)
  for (const [x, y] of finders) ctx.fillRect(x * cell, y * cell, cell + 0.4, cell + 0.4)

  const revealed = Math.round(clamp((progress - 0.16) / 0.84, 0, 1) * data.length)
  ctx.globalAlpha = Math.min(1, progress / 0.12)
  for (let i = 0; i < revealed; i++) {
    const [x, y] = data[i]
    ctx.fillRect(x * cell, y * cell, cell + 0.4, cell + 0.4)
  }
  ctx.globalAlpha = 1
}

export function ReelPlayer() {
  const stageRef = useRef<HTMLDivElement>(null)
  const compRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLButtonElement>(null)
  const scrubRef = useRef<HTMLDivElement>(null)
  const rangeRef = useRef<HTMLInputElement>(null)
  const tcRef = useRef<HTMLSpanElement>(null)
  const apiRef = useRef<{
    play: () => void
    pause: () => void
    restart: () => void
    seek: (ms: number) => void
    setSpeed: (value: number) => void
  } | null>(null)

  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [looping, setLooping] = useState(false)
  const [activeScene, setActiveScene] = useState(5)

  useEffect(() => {
    const stage = stageRef.current
    const comp = compRef.current
    if (!stage || !comp) return

    // Las declaraciones de funcion se elevan: TypeScript pierde el narrowing
    // del guardia dentro de ellas, asi que fit() usa alias ya no nulos.
    const stageEl: HTMLDivElement = stage
    const compEl: HTMLDivElement = comp

    const dom = {
      hudScene: comp.querySelector<HTMLElement>('[data-el="hudScene"]'),
      qr: comp.querySelector<HTMLCanvasElement>('[data-el="qr"]'),
      qrSum: comp.querySelector<HTMLCanvasElement>('[data-el="qrSum"]'),
      panelCode: comp.querySelector<HTMLElement>('[data-el="panelCode"]'),
      cardCode: comp.querySelector<HTMLElement>('[data-el="cardCode"]'),
      views: comp.querySelector<HTMLElement>('[data-el="views"]'),
      shares: comp.querySelector<HTMLElement>('[data-el="shares"]'),
      barViews: comp.querySelector<HTMLElement>('[data-el="barViews"]'),
      barShares: comp.querySelector<HTMLElement>('[data-el="barShares"]'),
      steps: Array.from(comp.querySelectorAll<HTMLElement>('[data-el="step"]')),
      fields: [
        comp.querySelector<HTMLElement>('[data-field="1"]'),
        comp.querySelector<HTMLElement>('[data-field="2"]'),
        comp.querySelector<HTMLElement>('[data-field="3"]'),
      ],
    }

    for (const canvas of comp.querySelectorAll<HTMLCanvasElement>("canvas[data-qr-seed]")) {
      drawQr(canvas, 1, Number(canvas.dataset.qrSeed), 17, false)
    }

    const animations: Animation[] = []
    for (const track of TRACKS) {
      const nodes = comp.querySelectorAll<HTMLElement>(`[data-tr="${track.tr}"]`)
      nodes.forEach((node, index) => {
        const animation = node.animate(track.k, {
          duration: track.d,
          delay: track.at + (track.stagger ?? 0) * index,
          easing: track.e ?? EASE.soft,
          fill: "both",
        })
        animation.pause()
        animations.push(animation)
      })
    }

    let time = REEL_END
    let running = false
    let rate = 1
    let repeat = false
    let frame = 0
    let lastStamp = 0
    let sceneId = 5
    // El ancho manda: sin este guardia, ajustar la altura del escenario
    // volveria a disparar el observador de tamaño.
    let lastWidth = 0

    const format = (value: number) => value.toLocaleString("es-CL")

    function render(ms: number) {
      time = clamp(ms, 0, REEL_END)
      for (const animation of animations) animation.currentTime = time

      const ratio = time / REEL_END
      scrubRef.current?.style.setProperty("--p", `${(ratio * 100).toFixed(2)}%`)
      if (rangeRef.current && document.activeElement !== rangeRef.current) {
        rangeRef.current.value = String(Math.round(time))
      }
      if (tcRef.current) tcRef.current.textContent = formatTime(time)

      const scene = SCENES.find((item) => time < item.end) ?? SCENES[SCENES.length - 1]
      if (scene.id !== sceneId) {
        sceneId = scene.id
        setActiveScene(scene.id)
      }
      const label = `${String(scene.id).padStart(2, "0")} · ${scene.name}`
      if (dom.hudScene && dom.hudScene.textContent !== label) dom.hudScene.textContent = label

      drawQr(dom.qr, clamp((time - 5000) / 900, 0, 1), 7, 25, true)
      drawQr(dom.qrSum, clamp((time - 4900) / 900, 0, 1), 11, 21, false)

      const typed = (node: HTMLElement | null, value: number) => {
        if (!node) return
        const text = CODE.slice(0, Math.round(clamp(value, 0, 1) * CODE.length))
        if (node.textContent !== text) node.textContent = text
      }
      typed(dom.panelCode, (time - 4400) / 700)
      typed(dom.cardCode, (time - 5100) / 700)

      const step = time >= 5000 ? 3 : time >= 3600 ? 2 : time >= 2900 ? 1 : 0
      dom.steps.forEach((node, index) => {
        node.classList.toggle(styles.stepNow, index + 1 === step)
        node.classList.toggle(styles.stepDone, index + 1 < step)
      })
      if (dom.fields[0]) dom.fields[0].classList.toggle(styles.fieldOn, time >= 2900)
      if (dom.fields[1]) dom.fields[1].classList.toggle(styles.fieldOn, time >= 3600)
      if (dom.fields[2]) {
        dom.fields[2].classList.toggle(styles.fieldOn, time >= 4000)
        dom.fields[2].classList.toggle(styles.fieldTyping, time >= 4200 && time <= 5200)
      }

      const views = Math.round(easeOutCubic(clamp((time - 7900) / 1300, 0, 1)) * VIEWS)
      const shares = Math.round(easeOutCubic(clamp((time - 8050) / 1300, 0, 1)) * SHARES)
      if (dom.views) dom.views.textContent = format(views)
      if (dom.shares) dom.shares.textContent = format(shares)
      if (dom.barViews) dom.barViews.style.width = `${(views / VIEWS) * 100}%`
      if (dom.barShares) dom.barShares.style.width = `${(shares / SHARES) * 100}%`

      if (overlayRef.current) {
        overlayRef.current.classList.toggle(styles.overlayHidden, !(!running && time >= REEL_END - 1))
      }
    }

    function tick(stamp: number) {
      frame = 0
      if (!running) return
      const delta = (stamp - lastStamp) * rate
      lastStamp = stamp
      let next = time + delta
      if (next >= REEL_END) {
        if (repeat) {
          next %= REEL_END
        } else {
          render(REEL_END)
          stop()
          return
        }
      }
      render(next)
      frame = requestAnimationFrame(tick)
    }

    function start() {
      running = true
      setPlaying(true)
      lastStamp = performance.now()
      if (!frame) frame = requestAnimationFrame(tick)
      if (overlayRef.current) overlayRef.current.classList.add(styles.overlayHidden)
    }

    function stop() {
      running = false
      setPlaying(false)
      if (frame) {
        cancelAnimationFrame(frame)
        frame = 0
      }
      if (overlayRef.current) {
        overlayRef.current.classList.toggle(styles.overlayHidden, time < REEL_END - 1)
      }
    }

    function play() {
      if (time >= REEL_END - 1) render(0)
      start()
    }

    function fit() {
      const width = stageEl.getBoundingClientRect().width
      if (!width || Math.abs(width - lastWidth) < 0.5) return
      lastWidth = width
      const raw = width / COMP_W
      const scale = Math.max(raw, MIN_SCALE)
      compEl.style.transform = `translate(-50%,0) scale(${scale})`
      stageEl.style.height = `${Math.round(COMP_H * scale)}px`
      const pad = Math.max(0, (COMP_W - width / scale) / 2) + 22
      compEl.style.setProperty("--safe-l", `${pad}px`)
      compEl.style.setProperty("--safe-r", `${pad}px`)
      compEl.classList.toggle(styles.isCropped, raw < MIN_SCALE - 0.0001)
    }

    apiRef.current = {
      play,
      pause: stop,
      restart: () => {
        render(0)
        start()
      },
      seek: (ms: number) => {
        stop()
        render(ms)
      },
      setSpeed: (value: number) => {
        rate = value
        setSpeed(value)
      },
    }

    const toggle = () => (running ? stop() : play())
    stage.addEventListener("click", toggle)

    const observer = new ResizeObserver(fit)
    observer.observe(stage)

    fit()
    render(REEL_END)

    return () => {
      stage.removeEventListener("click", toggle)
      observer.disconnect()
      if (frame) cancelAnimationFrame(frame)
      for (const animation of animations) animation.cancel()
      apiRef.current = null
    }
  }, [])

  return (
    <div className={styles.reel}>
      <div
        ref={stageRef}
        className={styles.stage}
        role="group"
        aria-label="Reel animado de EcoCupon, 15 segundos, cinco planos"
      >
        <div ref={compRef} className={styles.comp} aria-hidden="true">
          <div className={styles.ground} />
          <div {...at("weave")} className={styles.weave} />
          <div {...at("glowA")} className={cn(styles.glow, styles.glowA)} />
          <div {...at("glowB")} className={cn(styles.glow, styles.glowB)} />

          <section {...at("scene1")} className={cn(styles.scene, styles.s1)}>
            <div {...at("kick")} className={styles.kick}>
              <span {...at("kickMark")} className={styles.kickMark}>-10%</span>
              <span className={styles.kickTxt}>EcoCupon</span>
            </div>
            <h2 className={styles.l1}>
              <span className={styles.mask}><span {...at("l1")} className={styles.maskIn}>Tu oferta lista</span></span>
            </h2>
            <h2 className={styles.l2}>
              <span className={cn(styles.mask, styles.l2Word)}>
                <span {...at("l2w1")} className={styles.maskIn}>para</span>
              </span>
              <span className={cn(styles.mask, styles.l2Word)}>
                <i {...at("hl")} className={styles.hl} />
                <span {...at("l2w2")} className={styles.maskIn}>compartir</span>
              </span>
            </h2>
            <p {...at("s1sub")} className={styles.s1Sub}>Imagen, enlace y código QR en un solo paso</p>
          </section>

          <section {...at("scene2")} className={cn(styles.scene, styles.s2)}>
            <div {...at("panel")} className={cn(styles.panel, styles.croppable)}>
              <p className={styles.panelH}>Nuevo cupón</p>
              <div data-field="1" className={styles.field}>
                <label className={styles.fieldLabel}>Descuento</label>
                <div className={styles.input}>10%</div>
              </div>
              <div data-field="2" className={styles.field}>
                <label className={styles.fieldLabel}>Negocio</label>
                <div className={styles.input}>4Time Repuestos</div>
              </div>
              <div data-field="3" className={styles.field}>
                <label className={styles.fieldLabel}>Código</label>
                <div className={cn(styles.input, styles.inputMono)}>
                  <span data-el="panelCode" />
                  <i className={styles.caret} />
                </div>
              </div>
            </div>

            <article {...at("card")} className={styles.card}>
              <header {...at("cardH")} className={styles.cardH}>
                <div className={styles.cardLogo}>4T</div>
                <div>
                  <p className={styles.cardName}>4Time Repuestos</p>
                  <p className={styles.cardTag}>Repuestos para tu vehículo</p>
                </div>
              </header>
              <div className={styles.cardImg}>
                <div {...at("ph")} className={styles.ph} />
                <span {...at("badge")} className={styles.badge}>-10%</span>
              </div>
              <div className={styles.cardBody}>
                <p {...at("cardOff")} className={styles.cardOff}>10% de descuento</p>
                <p {...at("cardSub")} className={styles.cardSub}>en tu primera compra</p>
                <div {...at("cardCode")} className={styles.cardCode}>
                  <span className={styles.cardCodeLbl}>Código</span>
                  <span data-el="cardCode" className={styles.cardCodeVal} />
                </div>
                <div {...at("cardQr")} className={styles.cardQr}>
                  <canvas data-el="qr" width={168} height={168} />
                  <p>Escanea el QR o comparte el enlace. Válido en la primera compra.</p>
                </div>
                <div {...at("cardBtns")} className={styles.cardBtns}>
                  <span className={styles.btnWa}>WhatsApp</span>
                  <span className={styles.btnDl}>Imagen</span>
                </div>
              </div>
            </article>

            <ol className={cn(styles.steps, styles.croppable)}>
              <li data-el="step"><b>1</b><span>Elige el descuento</span></li>
              <li data-el="step"><b>2</b><span>Pon el negocio y el código</span></li>
              <li data-el="step"><b>3</b><span>El QR y el enlace salen solos</span></li>
            </ol>
          </section>

          <section {...at("scene3")} className={cn(styles.scene, styles.s3)}>
            <div {...at("ring")} className={styles.ring} />
            <div {...at("ring")} className={styles.ring} />
            <div {...at("ring")} className={styles.ring} />

            <div {...at("sum")} className={styles.sum}>
              <div className={styles.sumH}>4Time Repuestos</div>
              <div className={styles.sumB}>
                <p className={styles.sumOff}>-10%</p>
                <p className={styles.sumCode}>HOLA4TIME</p>
                <canvas data-el="qrSum" width={124} height={124} />
              </div>
            </div>

            <div className={styles.chat}>
              <div {...at("bub1")} className={styles.bub}>
                ¡Hola! 10% de descuento en 4Time Repuestos para tu primera compra.
              </div>
              <div {...at("bubLink")} className={cn(styles.bubLink)}>
                ecocupon.cl/cupon/4time-10
              </div>
              <div {...at("bub2")} className={cn(styles.bub, styles.bubIn)}>
                ¡Lo usé y me hicieron el descuento, gracias!
              </div>
            </div>

            <div className={styles.stat}>
              <div {...at("stat1")} className={styles.tile}>
                <span className={styles.tileK}>Vistas del cupón</span>
                <span data-el="views" className={styles.tileV}>0</span>
                <span className={styles.tileBar}><i data-el="barViews" className={styles.tileBarFill} /></span>
              </div>
              <div {...at("stat2")} className={styles.tile}>
                <span className={styles.tileK}>Veces compartido</span>
                <span data-el="shares" className={styles.tileV}>0</span>
                <span className={styles.tileBar}><i data-el="barShares" className={styles.tileBarFill} /></span>
              </div>
            </div>
          </section>

          <section {...at("scene4")} className={cn(styles.scene, styles.s4)}>
            <p {...at("s4k")} className={styles.s4K}>Cuponera pública</p>
            <h3 {...at("s4h")} className={styles.s4H}>Tus cupones, a la vista de más clientes</h3>
            <div className={styles.minis}>
              {SHOPS.map((shop) => (
                <article key={shop.code} {...at("mini")} className={styles.mini}>
                  <h4 className={styles.miniName}>{shop.name}</h4>
                  <div className={styles.miniRow}>
                    <div>
                      <div className={styles.miniOff}>{shop.off}</div>
                      <div className={styles.miniCode}>{shop.code}</div>
                    </div>
                    <canvas data-qr-seed={shop.seed} width={80} height={80} />
                  </div>
                </article>
              ))}
            </div>
            <p {...at("s4foot")} className={styles.s4Foot}>Publicado y midiendo vistas y compartidos</p>
          </section>

          <section {...at("scene5")} className={cn(styles.scene, styles.s5)}>
            <div {...at("s5mark")} className={styles.s5Mark} />
            <h3 className={styles.s5Name}>
              <span className={styles.mask}><span {...at("s5name")} className={styles.maskIn}>EcoCupon</span></span>
            </h3>
            <p {...at("s5tag")} className={styles.s5Tag}>Crea tu primer cupón gratis</p>
            <p {...at("s5url")} className={styles.s5Url}>ecocupon.cl</p>
          </section>

          <div {...at("sweep")} className={styles.sweep} />

          <div className={styles.hud}>
            <span data-el="hudScene">05 · Cierre</span>
          </div>
        </div>

        <button
          ref={overlayRef}
          type="button"
          className={styles.overlay}
          aria-label="Reproducir el reel"
        >
          <span className={styles.ovCircle}><Play aria-hidden="true" /></span>
        </button>
      </div>

      <div className={styles.controls}>
        <div className={styles.cgroup}>
          <button
            type="button"
            className={cn(styles.cbtn, styles.cbtnPrimary)}
            aria-label={playing ? "Pausar" : "Reproducir"}
            onClick={() => (playing ? apiRef.current?.pause() : apiRef.current?.play())}
          >
            {playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
          </button>
          <button
            type="button"
            className={styles.cbtn}
            aria-label="Volver al inicio"
            onClick={() => apiRef.current?.restart()}
          >
            <RotateCcw aria-hidden="true" />
          </button>
          <span className={styles.tcRead}>
            <span ref={tcRef}>00:15.00</span> <em>/ 00:15.00</em>
          </span>
        </div>
        <span className={styles.grow} />
        <div className={styles.speeds} role="group" aria-label="Velocidad de reproducción">
          {[0.5, 1, 2].map((value) => (
            <button
              key={value}
              type="button"
              className={cn(styles.speed, speed === value && styles.speedOn)}
              aria-pressed={speed === value}
              onClick={() => apiRef.current?.setSpeed(value)}
            >
              {String(value).replace(".", ",")}×
            </button>
          ))}
        </div>
        <button
          type="button"
          className={cn(styles.cbtn, looping && styles.cbtnActive)}
          aria-label="Repetir en bucle"
          aria-pressed={looping}
          onClick={() => setLooping((value) => !value)}
        >
          <Repeat aria-hidden="true" />
        </button>
      </div>

      <div ref={scrubRef} className={styles.timeline}>
        <div className={styles.marks}>
          {SCENES.map((scene) => (
            <button
              key={scene.id}
              type="button"
              className={cn(styles.mark, activeScene === scene.id && styles.markOn)}
              style={{ left: `${(scene.start / REEL_END) * 100}%` }}
              aria-label={`Ir al plano ${scene.id}: ${scene.name}`}
              onClick={() => {
                apiRef.current?.seek(scene.start)
                apiRef.current?.play()
              }}
            >
              {String(scene.id).padStart(2, "0")}
            </button>
          ))}
        </div>
        <div className={styles.scrub}>
          <div className={styles.sbase} />
          <div className={styles.sfill} />
          <input
            ref={rangeRef}
            type="range"
            min={0}
            max={REEL_END}
            step={20}
            defaultValue={REEL_END}
            className={styles.scrubInput}
            aria-label="Avance del reel"
            onInput={(event) => apiRef.current?.seek(Number(event.currentTarget.value))}
          />
        </div>
      </div>
    </div>
  )
}
