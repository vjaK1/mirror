# Mirror

Single-user personal life dashboard PWA — money, diet, training, weight, goals, notes.
Spec: [BLUEPRINT.md](BLUEPRINT.md) · standing rules: [CLAUDE.md](CLAUDE.md).

## Stack

Vite · React · TypeScript · Tailwind v4 · shadcn/ui · Supabase (Sydney) · Vercel.

## Setup

```sh
cp .env.example .env.local   # fill in the Supabase URL + anon key
npm install
npm run dev
```

The single user is created in the Supabase dashboard — there is no signup UI.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Type-check + production build (also emits the service worker) |
| `npm run preview` | Serve the production build (test PWA install) |
| `npm run icons` | Regenerate PWA icons from `public/mirror-mark.svg` |
| `npm run lint` | Oxlint |

## Deploy (Vercel)

Framework preset **Vite**. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
in the Vercel project env vars. `vercel.json` rewrites all routes to the SPA.
Install on iPhone: Safari → Share → Add to Home Screen.
