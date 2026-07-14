# Mirror — product blueprint

Single-user personal life dashboard for Victor. PWA on iPhone (Safari → Add to Home Screen) and desktop browser, one codebase. This document is the source of truth for scope and design; `CLAUDE.md` holds the standing rules.

---

## 1. What Mirror is (and isn't)

**In scope (v1):**
- **Money** — HYSA savings, VOO holding, income
- **Diet** — food logging (manual + AI parse), macro/micro targets by phase, weigh-ins
- **Gym** — lift logging on a PPL split, progression, adherence
- **Notes** — todo, scratchpad, journal (one table, three types)
- **Goals** — v1 is a single goal: the October cut (target weight + date, computed trajectory)
- **Ask AI** — plain-English questions answered from Victor's own data

**Explicitly out of scope:** Eira/business metrics, health module (sleep/HRV/bloodwork), habits module, relationships, generalized goal engine, native App Store apps, offline mode (design for it, don't build it).

---

## 2. Architecture

```
iPhone / PC (React PWA)
   │  HTTPS + Supabase Auth JWT
   ▼
Supabase (Sydney)
   ├─ Auth (single user, email + password; signups disabled)
   ├─ Postgres (all data; RLS on everything)
   ├─ SQL views + functions (read-only; the AI's tools)
   ├─ Edge functions (hold secrets; gateway for all AI + external calls)
   │    ├─ ai-parse-log   (text → structured log proposal)
   │    ├─ ai-ask         (question → tool-calling loop → answer)
   │    └─ daily-snapshot (cron: VOO price + AUD/USD rate)
   ▼
External: Claude API · free daily price source · free FX source (e.g. Frankfurter) · seeded food composition data (AFCD or USDA FDC)
```

Principles: the frontend is thin and holds no secrets. Claude handles language; Postgres handles truth. The AI's DB access is read-only at the role level, not as a prompt-level promise.

---

## 3. Screens & UX

### Bottom nav
`Home · Diet · [+] · Gym · Money` — the center **+** is a raised circular button opening the **universal input**.

### Universal input (the + sheet)
One text field. The AI routes intent:
- "150g rice, 200g chicken" → food log proposal → confirm → save
- "bench 80kg 3x8" → lift log proposal → confirm → save
- "note: call supplier tomorrow" → saved to notes (todo)
- "am I on track for my cut?" → ai-ask flow → answer rendered in the sheet

Also offer quick chips in the sheet: Log food · Log lift · Weigh in · Note.

### Home (never scrolls; fixed order)
1. **Header** — date · "Day N of cut" · "X days to Oct 1 goal" · avatar. No greeting text.
2. **Money card** (raised) — net worth in AUD as hero + weekly delta; divider; compact VOO row (value, day %) and HYSA row (value, APY %). Eye toggle in the card header controls the **global** privacy blur.
3. **Macros card** (raised) — "Remaining today" kcal as hero + "eaten of target"; main progress bar; 2×2 mini bars: protein / carbs / fat / fibre; neutral "To go: …" chip listing shortfalls. The chip switches to warning styling only after 20:00 local time if shortfalls remain.
4. **Row of two flat cards** — Training (next session type, "x of y sessions this week") · Weight (7-day avg, "on pace for 74.0 by Oct 1" computed from trend).

### Diet tab
Today's log (grouped by logical day), quick-add saved meals/foods, search-and-grams manual entry, phase settings (cut/bulk/maintain → targets, overridable), weigh-in entry, weight trend chart (7-day avg line, raw dots).

### Gym tab
Start session (type: push/pull/legs/other) → **prefilled with the last session of that type**; edit reps/weight per set; add/remove exercises; per-exercise progression view (est. 1RM or top-set trend); weekly adherence.

### Money tab
Accounts list; update HYSA balance (append event); interest computed from stored APY (projected monthly interest shown); VOO: manual share count, value from latest price snapshot × shares, converted to AUD; income log + recurring salary entry; net-worth-over-time chart from events + snapshots. All amounts respect the privacy blur.

### Settings
Theme (Light/Dark/System, default System) · privacy blur behavior · phase/targets shortcut · CSV export (later) · sign out.

### Theme & visual rules
Design tokens; dark mode is first-class (heaviest use is late-night gym). Macro identity colors: protein teal, carbs blue, fat amber, fibre green. One accent color elsewhere plus semantic green/amber/red. Flat surfaces, hairline borders, no decorative effects.

### PWA
Manifest name "Mirror", standalone display, themed splash. App icon = the Mirror mark (solid shape + faint reflected twin across a dashed center line):

```svg
<svg viewBox="0 0 88 88" xmlns="http://www.w3.org/2000/svg">
  <rect width="88" height="88" rx="20" fill="#1C1C1A"/>
  <path d="M40 26 L28 44 L40 62 Z" fill="#85B7EB"/>
  <path d="M48 26 L60 44 L48 62 Z" fill="#85B7EB" opacity="0.32"/>
  <line x1="44" y1="24" x2="44" y2="64" stroke="#85B7EB" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.5"/>
</svg>
```

Generate the required icon sizes from this. iOS install path: Safari → Share → Add to Home Screen.

---

## 4. Data model (starting point — refine per module, migrations are cheap)

All tables: `id uuid pk default gen_random_uuid()`, `user_id uuid references auth.users`, `created_at timestamptz default now()`, RLS `user_id = auth.uid()`. Shared SQL helper: `logical_day(ts timestamptz) returns date` using Australia/Melbourne with a 03:00 boundary.

### Diet
- `foods` — name, brand (null), source (`afcd | usda | custom | ai_estimate`), per-100g: kcal, protein_g, carbs_g, fat_g, fibre_g, sodium_mg, potassium_mg, iron_mg, calcium_mg. Seeded rows have no user_id (global, read-only to the app user); custom rows are user-owned.
- `saved_meals` — name, items jsonb `[{food_id, grams}]`.
- `food_logs` — logged_at, food_id (null if pure estimate), grams, **denormalized** kcal/protein_g/carbs_g/fat_g/fibre_g + micros jsonb (computed at log time so history is stable), source (`manual | ai_parse | saved_meal`), raw_text (what the user typed).
- `diet_phases` — phase (`cut | bulk | maintain`), start_date, end_date (null = active), kcal_target, protein_target_g, carbs_target_g, fat_target_g, fibre_target_g.
- `weigh_ins` — measured_at, weight_kg.
- `profile` — height_cm, display prefs.

### Gym
- `exercises` — name, muscle_group, is_custom. Seed a standard PPL list.
- `workout_sessions` — started_at, session_type (`push | pull | legs | other`), notes.
- `sets` — session_id, exercise_id, set_number, reps, weight_kg, rpe (null).

### Money
- `accounts` — name, type (`hysa | brokerage | other`), currency, apy (null; set for HYSA).
- `balance_events` — account_id, recorded_at, balance. Append-only.
- `income_events` — received_at, amount, currency, source, from_recurring (bool).
- `recurring_income` — amount, currency, source, cadence, next_date (materialize into income_events).
- `holdings` — symbol, shares, currency (manual share count; v1 has one row: VOO/USD).
- `price_snapshots` — symbol, date, close_price, currency. No user_id (global).
- `fx_snapshots` — date, pair (`AUDUSD`), rate. No user_id (global).

### Notes & goals
- `notes` — type (`todo | scratch | journal`), content, is_done (null for non-todos), updated_at.
- `goals` — name, metric (`weight_kg`), target_value, target_date. v1: one row (Oct 1 cut target).

### Read-only layer (the AI's tools; also power the dashboards)
Views/functions granted to a `mirror_readonly` role: `macros_daily` (by logical day vs active phase targets), `get_remaining_today()`, `get_weight_trend(days)` (7-day avg series, slope, projected value at goal date), `get_lift_progression(exercise)`, `get_session_adherence()`, `get_networth()` and `networth_history` (AUD, via snapshots), `get_income_summary(period)`.

---

## 5. The AI layer

Two jobs, both through edge functions holding the Anthropic key.

### Job 1 — parse-to-log (`ai-parse-log`)
Input: raw text. Claude receives the text plus a candidate-food search from `foods` (the function does a DB text search first and passes candidates in — the model matches and does portion math; it does not invent nutrition numbers). Output contract (always `needs_confirmation: true`; the app writes only after the user confirms):

```json
{
  "intent": "food_log",
  "items": [
    { "raw": "150g rice", "matched_food_id": "…", "food_name": "Rice, white, cooked",
      "grams": 150, "kcal": 195, "protein_g": 4.2, "carbs_g": 42.0, "fat_g": 0.4,
      "fibre_g": 0.6, "micros": {"sodium_mg": 2}, "confidence": "high" }
  ],
  "unmatched": [
    { "raw": "…", "ai_estimate": { "kcal": 0, "protein_g": 0 }, "flagged": true }
  ]
}
```

Lift intent: `{"intent":"lift_log","session_type_guess":"push","sets":[{"exercise":"Bench press","weight_kg":80,"reps":8}, …]}` (expand "3x8" into rows). Note intent: `{"intent":"note","note_type":"todo","content":"…"}`. Question intent: hand off to Job 2.

Cost control: saved meals and previously matched foods resolve **without** an API call; the AI path is only for novel text.

### Job 2 — questions (`ai-ask`)
Tool-calling loop: Claude gets the question + the tool list from §4 (names, params, descriptions — never raw table access). It picks tools; the function executes them via the read-only role; results go back; Claude writes the plain-English answer with the real numbers. Return the answer plus which tools ran (a "show the query" affordance for auditing).

---

## 6. Scheduled job

`daily-snapshot` (cron, once daily after US market close): fetch VOO close from a free no-key source and AUD/USD from a free FX source (e.g. Frankfurter/ECB), insert into `price_snapshots` and `fx_snapshots`. Idempotent per date. Dashboards and views always read the latest snapshot — no client-side market fetches.

---

## 7. Security & privacy

Single Supabase user created via dashboard; public signups disabled. RLS on all tables. `mirror_readonly` DB role: SELECT only on the §4 views/functions, used exclusively by `ai-ask`. Anthropic key in edge secrets with a console spending cap (~AU$15/mo). Privacy blur per CLAUDE.md rule 9. Region: Sydney.

---

## 8. Build order & definitions of done

**Session 1 — scaffold.** Vite/React/TS/Tailwind/shadcn; token system + Light/Dark/System; Supabase client + auth (login only); protected shell with bottom nav and five placeholder screens; + opens an empty sheet; PWA manifest + icons from §3; Vercel-ready. *Done when:* boots clean, login works, tabs navigate, theme toggle works, deployed URL installs on iPhone.

**Session 2 — diet.** Diet schema + `logical_day` helper; seed `foods` (AFCD or USDA staples subset — must include: white rice, chicken breast, eggs, oats, whey protein, plus ~100 common staples); manual search+grams logging; `ai-parse-log` + confirm flow via the + sheet; saved meals; phases/targets; Diet tab; Home macros card wired to real data. *Done when:* a full real day can be logged in under 30 seconds of interaction and Home shows correct remaining/shortfalls across the 3am boundary.

**Session 3 — gym.** Gym schema + seeds; session flow with last-session prefill; lift parse intent in the + sheet; progression + adherence; Home training card wired.

**Session 4 — money.** Money schema; balance/income entry; `daily-snapshot` cron; net worth in AUD; privacy blur (global state); Money tab + Home money card wired.

**Session 5 — ask AI.** Read-only role + views/functions; `ai-ask` tool loop; question intent in the + sheet; "show the query" toggle.

**Session 6 — notes & goals.** `notes` table + minimal UI (todo list, scratchpad, journal); `goals` row for the Oct cut; header "Day N / days to goal" + weight-card projection computed from `get_weight_trend`.

Between sessions: Victor uses the new module with real data for a day or two; friction fixes land before the next module starts.

**Session 7+ — post-v1 backlog.** One improvement per session, same rules as v1 (schema → edge → UI, friction fixes first). Candidates, roughly by leverage:

*Top three:*
1. **Evening AI digest (push).** Scheduled edge function (daily-snapshot pattern) calls the same read-only tools as `ai-ask` and sends a Web Push (iOS ≥16.4 supports PWA push) around 20:00: protein remaining, session logged or not, net-worth weekly move. Makes the app proactive.
2. **Barcode scanning.** Browser `BarcodeDetector` + Open Food Facts (free, keyless) → scan packaged foods, save as custom food rows (compounds over time). Biggest remaining logging-speed win.
3. **Offline queue.** IndexedDB write queue behind the data-access layer (the seam rule 6 exists for); replay on reconnect. Gyms and commutes have dead zones.

*Diet:* photo meal logging (Claude vision → flagged `ai_estimate` per rule 8), voice input (Web Speech API into the + sheet), micronutrient report view (micros are already denormalized, no UI reads them).

*Money:* implied spending (income − Δbalance per period as a read-only AI tool — insight with zero logging), VOO dividend income events, IBKR Flex Web Service auto-sync (token-based, unattended — not the MCP), bank CSV import.

*Gym:* rest timer in the session view, plate calculator, auto-progression hints ("all sets at 80×8 last time — try 82.5").

*Platform:* biometric app lock (WebAuthn — extends the privacy-blur posture), CSV export, app-logo redesign (new SVG into `public/mirror-mark.svg` → `npm run icons`).

---

## 9. Accounts & costs

| Service | Purpose | Cost |
|---|---|---|
| Supabase | DB, auth, functions | Free tier (note: pauses after ~7 days of inactivity; restore from dashboard) |
| Vercel | Hosting | Free tier |
| Anthropic Console | API key for the AI layer | Pay-as-you-go, ~a few $/mo; set a spending cap. Needed from Session 2 |
| Domain (optional) | Nicer URL | ~$15/yr, optional |
