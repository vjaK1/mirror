# Mirror — Claude Code session prompts

How to use: put `CLAUDE.md` and `BLUEPRINT.md` in the repo root before the first session. Run one session per module. Paste the prompt, answer its questions (it will ask for Supabase keys in Session 1 and the Anthropic key in Session 2), verify the "done when" checklist yourself, then move on.

---

## Session 1 — scaffold (paste this first)

Read CLAUDE.md and BLUEPRINT.md in full before writing any code. This session is scaffolding only — no feature modules.

Build:
1. Vite + React + TypeScript + Tailwind + shadcn/ui project.
2. Design token system per CLAUDE.md rule 1: CSS variables for all colors/surfaces, Light/Dark/System theme with System as default, toggle wired in a basic Settings screen. No hardcoded hex in components.
3. Supabase client + email/password auth. Login screen only (no signup UI — I'll create my user in the Supabase dashboard). Protected routes: nothing renders without a session.
4. App shell: bottom nav with Home, Diet, [+], Gym, Money per BLUEPRINT §3. Five placeholder screens. The center + opens a bottom sheet containing a text input and the four quick chips — non-functional for now.
5. PWA: manifest named "Mirror", icons generated from the SVG mark in BLUEPRINT §3, service worker, installable.
6. A `lib/data.ts` data-access layer stub that all future DB reads/writes will go through (CLAUDE.md rule 6).
7. Vercel-ready config.

Ask me for SUPABASE_URL and SUPABASE_ANON_KEY when you need them. Run the dev server, fix all console/build errors before finishing, and commit in logical slices.

Done when: app boots clean, login works, all five tabs navigate, theme toggle switches Light/Dark/System, the + sheet opens, and `npm run build` succeeds.

---

## Session 2 — diet module (paste after Session 1 is verified and deployed)

Read CLAUDE.md and BLUEPRINT.md again, then build the diet module end-to-end per BLUEPRINT §4 (diet tables), §5 Job 1, and §8 Session 2.

Order of work:
1. Migration: diet schema + the `logical_day()` SQL helper (CLAUDE.md rule 2 — 03:00 Australia/Melbourne boundary). RLS on everything. Generate TypeScript types.
2. Seed `foods` from a free composition source (AFCD or USDA FDC): ~100 staples, and these must be included and verified: white rice (cooked), chicken breast (cooked), eggs, oats, whey protein powder.
3. Manual logging UI: search foods → grams → save (denormalize macros at log time per the schema notes).
4. Edge function `ai-parse-log` implementing the exact JSON contract in BLUEPRINT §5 Job 1, including the candidate-food DB search before the model call. I'll give you the ANTHROPIC_API_KEY for edge secrets.
5. Wire the + sheet: typed food text → parse → confirmation card (per-item numbers, editable grams) → save on confirm. Saved meals and previously matched foods must resolve without an API call.
6. Phases & targets UI (cut/bulk/maintain), weigh-in entry, Diet tab per BLUEPRINT §3, and wire the Home macros card to real data, including the after-20:00 warning behavior on the shortfall chip.

Done when: I can log a real day of eating (mix of saved meals + one AI-parsed novel meal) in under ~30 seconds of interaction; Home shows correct remaining and shortfalls; a log entered at 12:30am lands on the previous logical day; build and console are clean; committed in slices.

---

## Sessions 3–6 — pattern

Same shape each time: "Read CLAUDE.md and BLUEPRINT.md, then build [gym | money | ask-AI | notes & goals] per BLUEPRINT §4/§5/§8 [session N]. Schema + types first, then edge functions, then UI, then wire the relevant Home card. Done when [the §8 checklist for that session]." Before each session, tell Claude Code any friction you found using the previous module so fixes land first.
