# CLAUDE.md — Mirror

Mirror is a **single-user** personal life dashboard PWA for Victor (Melbourne, Australia). It tracks money, diet, training, weight, goals, and notes, with a Claude API layer for natural-language logging and questions. The full product spec is `BLUEPRINT.md` — read it before starting any module or making structural changes.

## Stack
- Frontend: Vite + React + TypeScript + Tailwind CSS + shadcn/ui, installable PWA
- Backend: Supabase (Sydney region) — Postgres, Auth, Edge Functions, scheduled functions
- AI: Claude API, called **only** from edge functions
- Hosting: Vercel

## Non-negotiable rules

1. **Design tokens only.** All colors and spacing come from CSS variables / the Tailwind theme. Never hardcode hex values in components. Dark mode is a single root attribute flip. Theme setting: Light / Dark / System, default System.
2. **The logical day ends at 03:00 Australia/Melbourne.** Store `timestamptz` everywhere. Every daily aggregate (macros, sessions, weigh-ins) uses this boundary — a meal logged at 12:30am belongs to the *previous* day. Implement once as a SQL helper (`logical_day(ts)`) and reuse it in every view. Never group by raw UTC date.
3. **Append-only events.** Balance updates, weigh-ins, sets, and income are event rows. Current state is always derived from history. Never overwrite or delete history to update a value.
4. **The AI never touches raw tables.** Question-answering uses tool calling against read-only SQL views/functions through a database role with SELECT-only grants. Logging: AI parses → user confirms → the app writes through the normal authenticated path. No AI-generated raw SQL.
5. **Secrets live in edge function secrets.** No API keys in frontend code or client-exposed env vars. The Anthropic key has a spending cap set in the console.
6. **All database writes go through one data-access layer** in the frontend, so an offline queue can be added later without touching every feature.
7. **Currency:** VOO is USD; savings and income are AUD. Net worth is reported in AUD using the daily FX snapshot. Never mix currencies without converting.
8. **Nutrition numbers come from the seeded `foods` table, not the LLM.** The AI's job is matching text to a food row and doing portion math. A pure AI estimate is allowed only as a fallback and must be flagged (`source = 'ai_estimate'`).
9. **Money amounts blur by default.** Global privacy state, eye-icon toggle, resets to hidden on every fresh app open. Percentages and relative changes may stay visible.
10. **The Home screen never scrolls.** Its layout and order are fixed in BLUEPRINT.md §3.
11. **Weight is displayed as the 7-day trailing average.** Raw daily weigh-ins are secondary (dots on a chart, not the headline number).
12. **Row Level Security is enabled on every table at creation**, scoped to the single user.

## Working conventions
- Build one module per session, in this order: scaffold → diet → gym → money → ask-AI → notes/goals.
- Within a module: schema + generated types first, then edge functions, then UI.
- Run the dev server, check console and build errors, and fix them before handing back.
- Commit after each working slice with a clear message. Never leave the repo broken at the end of a session.
- If a decision isn't covered here or in BLUEPRINT.md, state your assumption in one line, proceed, and flag it in the commit message.
