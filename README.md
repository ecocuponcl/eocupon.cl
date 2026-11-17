# ecocupon.cl

SaaS para comercios chilenos que generan cupones de descuento, los comparten por
link/QR y miden vistas y compartidos. El sitio público vive en
`https://www.ecocupon.cl`.

## Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS 4 vía `@tailwindcss/postcss`
- shadcn/ui sobre Radix
- Supabase: auth SSR, Postgres con RLS, Storage
- Vercel + `@vercel/analytics`
- Gestor de paquetes: **pnpm**

## Getting Started

```bash
pnpm dev      # servidor de desarrollo
pnpm build    # build de producción
pnpm start    # servir build
pnpm lint     # eslint .
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador.

## Aprende más

- [Documentación de Next.js](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
