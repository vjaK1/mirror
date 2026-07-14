// Data-access layer (CLAUDE.md rule 6).
//
// Every Supabase table read/write in the app goes through this module —
// feature code never imports `supabase` directly for data access. This keeps
// a single seam where the offline queue (IndexedDB) can be inserted later
// without touching features. Auth calls are exempt (they are not data).
import { supabase } from "./supabase"
import { logicalDay, logicalDayRange } from "./logical-day"
import type {
  AccountRow,
  BalanceEventRow,
  DietPhaseRow,
  ExerciseRow,
  FoodLogInsert,
  FoodLogRow,
  FoodRow,
  FxSnapshotRow,
  GoalRow,
  HoldingRow,
  IncomeEventRow,
  MacrosDailyRow,
  NoteRow,
  PriceSnapshotRow,
  ProfileRow,
  RecurringIncomeRow,
  SavedMealRow,
  SetRow,
  WeighInRow,
  WorkoutSessionRow,
} from "./database.types"
import type { AskResponse, ParseResponse } from "./parse-types"

async function userId(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  const id = data.session?.user.id
  if (!id) throw new Error("Not signed in")
  return id
}

// --- foods -----------------------------------------------------------------

export async function searchFoods(term: string): Promise<FoodRow[]> {
  const { data, error } = await supabase
    .from("foods")
    .select("*")
    .ilike("name", `%${term}%`)
    .order("name")
    .limit(12)
  if (error) throw error
  return data
}

export async function getFoodsByIds(ids: string[]): Promise<FoodRow[]> {
  if (ids.length === 0) return []
  const { data, error } = await supabase.from("foods").select("*").in("id", ids)
  if (error) throw error
  return data
}

// --- food logs ---------------------------------------------------------------

export async function insertFoodLogs(
  rows: Omit<FoodLogInsert, "user_id">[],
): Promise<void> {
  const uid = await userId()
  const { error } = await supabase
    .from("food_logs")
    .insert(rows.map((r) => ({ ...r, user_id: uid })))
  if (error) throw error
}

export type FoodLogWithFood = FoodLogRow & {
  foods: Pick<FoodRow, "name" | "brand"> | null
}

export async function getLogsForDay(day = logicalDay()): Promise<FoodLogWithFood[]> {
  const { start, end } = logicalDayRange(day)
  const { data, error } = await supabase
    .from("food_logs")
    .select("*, foods(name, brand)")
    .gte("logged_at", start)
    .lt("logged_at", end)
    .order("logged_at", { ascending: true })
  if (error) throw error
  return data as FoodLogWithFood[]
}

export async function deleteFoodLog(id: string): Promise<void> {
  const { error } = await supabase.from("food_logs").delete().eq("id", id)
  if (error) throw error
}

export async function getMacrosForDay(
  day = logicalDay(),
): Promise<MacrosDailyRow | null> {
  const { data, error } = await supabase
    .from("macros_daily")
    .select("*")
    .eq("day", day)
    .maybeSingle()
  if (error) throw error
  return data
}

/** Last N distinct foods logged, for the quick-add row. */
export async function getRecentFoods(
  limit = 8,
): Promise<{ food: FoodRow; lastGrams: number }[]> {
  const { data, error } = await supabase
    .from("food_logs")
    .select("food_id, grams, foods(*)")
    .not("food_id", "is", null)
    .order("logged_at", { ascending: false })
    .limit(40)
  if (error) throw error
  const seen = new Map<string, { food: FoodRow; lastGrams: number }>()
  for (const row of data) {
    const food = row.foods as unknown as FoodRow | null
    if (!food || seen.has(food.id)) continue
    seen.set(food.id, { food, lastGrams: row.grams ?? 100 })
    if (seen.size >= limit) break
  }
  return [...seen.values()]
}

// --- saved meals -------------------------------------------------------------

export type SavedMealItem = { food_id: string; grams: number }

export async function getSavedMeals(): Promise<SavedMealRow[]> {
  const { data, error } = await supabase
    .from("saved_meals")
    .select("*")
    .order("created_at", { ascending: false })
  if (error) throw error
  return data
}

export async function createSavedMeal(
  name: string,
  items: SavedMealItem[],
): Promise<void> {
  const uid = await userId()
  const { error } = await supabase
    .from("saved_meals")
    .insert({ name, items, user_id: uid })
  if (error) throw error
}

export async function deleteSavedMeal(id: string): Promise<void> {
  const { error } = await supabase.from("saved_meals").delete().eq("id", id)
  if (error) throw error
}

// --- phases ------------------------------------------------------------------

export async function getActivePhase(): Promise<DietPhaseRow | null> {
  const { data, error } = await supabase
    .from("diet_phases")
    .select("*")
    .is("end_date", null)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export type PhaseTargets = {
  phase: "cut" | "bulk" | "maintain"
  kcal_target: number
  protein_target_g: number
  carbs_target_g: number
  fat_target_g: number
  fibre_target_g: number
}

/** Ends the active phase (if any) and starts a new one today. */
export async function startPhase(targets: PhaseTargets): Promise<void> {
  const uid = await userId()
  const today = logicalDay()
  const active = await getActivePhase()
  if (active) {
    const { error } = await supabase
      .from("diet_phases")
      .update({ end_date: today })
      .eq("id", active.id)
    if (error) throw error
  }
  const { error } = await supabase
    .from("diet_phases")
    .insert({ ...targets, user_id: uid, start_date: today })
  if (error) throw error
}

/** Adjusts targets on the active phase in place (targets are config, not history). */
export async function updatePhaseTargets(
  id: string,
  targets: Omit<PhaseTargets, "phase">,
): Promise<void> {
  const { error } = await supabase.from("diet_phases").update(targets).eq("id", id)
  if (error) throw error
}

// --- weigh-ins ---------------------------------------------------------------

export async function addWeighIn(weightKg: number): Promise<void> {
  const uid = await userId()
  const { error } = await supabase
    .from("weigh_ins")
    .insert({ weight_kg: weightKg, user_id: uid })
  if (error) throw error
}

export async function getWeighIns(sinceDays = 90): Promise<WeighInRow[]> {
  const since = new Date(Date.now() - sinceDays * 86400_000).toISOString()
  const { data, error } = await supabase
    .from("weigh_ins")
    .select("*")
    .gte("measured_at", since)
    .order("measured_at", { ascending: true })
  if (error) throw error
  return data
}

/** Last grams logged for a food — prefills the grams dialog. */
export async function getLastGrams(foodId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from("food_logs")
    .select("grams")
    .eq("food_id", foodId)
    .not("grams", "is", null)
    .order("logged_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data?.grams ?? null
}

// --- exercises ---------------------------------------------------------------

export async function getExercises(): Promise<ExerciseRow[]> {
  const { data, error } = await supabase.from("exercises").select("*").order("name")
  if (error) throw error
  return data
}

export async function createCustomExercise(
  name: string,
  muscleGroup = "other",
): Promise<ExerciseRow> {
  const uid = await userId()
  const { data, error } = await supabase
    .from("exercises")
    .insert({ name, muscle_group: muscleGroup, is_custom: true, user_id: uid })
    .select()
    .single()
  if (error) throw error
  return data
}

// --- workout sessions ----------------------------------------------------------

export type SessionType = "push" | "pull" | "legs" | "other"

export async function startWorkoutSession(
  type: SessionType,
): Promise<WorkoutSessionRow> {
  const uid = await userId()
  const { data, error } = await supabase
    .from("workout_sessions")
    .insert({ session_type: type, user_id: uid })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getTodaySession(): Promise<WorkoutSessionRow | null> {
  const { start, end } = logicalDayRange(logicalDay())
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("*")
    .gte("started_at", start)
    .lt("started_at", end)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getRecentSessions(limit = 40): Promise<WorkoutSessionRow[]> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

/** Sessions in the trailing window, oldest first — feeds the activity grid. */
export async function getSessionsSince(days = 140): Promise<WorkoutSessionRow[]> {
  const since = new Date(Date.now() - days * 86400_000).toISOString()
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("*")
    .gte("started_at", since)
    .order("started_at", { ascending: true })
  if (error) throw error
  return data
}

/** Latest previous session of a type (excluding one id) — the prefill source. */
export async function getLastSessionOfType(
  type: SessionType,
  excludeId?: string,
): Promise<WorkoutSessionRow | null> {
  let query = supabase
    .from("workout_sessions")
    .select("*")
    .eq("session_type", type)
    .order("started_at", { ascending: false })
    .limit(1)
  if (excludeId) query = query.neq("id", excludeId)
  const { data, error } = await query.maybeSingle()
  if (error) throw error
  return data
}

export async function deleteWorkoutSession(id: string): Promise<void> {
  const { error } = await supabase.from("workout_sessions").delete().eq("id", id)
  if (error) throw error
}

// --- sets ----------------------------------------------------------------------

export type SetWithExercise = SetRow & {
  exercises: Pick<ExerciseRow, "name" | "muscle_group"> | null
}

export async function getSetsForSession(
  sessionId: string,
): Promise<SetWithExercise[]> {
  const { data, error } = await supabase
    .from("sets")
    .select("*, exercises(name, muscle_group)")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
  if (error) throw error
  return data as SetWithExercise[]
}

export async function insertSet(row: {
  session_id: string
  exercise_id: string
  set_number: number
  reps: number
  weight_kg: number | null
}): Promise<SetRow> {
  const uid = await userId()
  const { data, error } = await supabase
    .from("sets")
    .insert({ ...row, user_id: uid })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateSet(
  id: string,
  patch: { reps?: number; weight_kg?: number | null },
): Promise<void> {
  const { error } = await supabase.from("sets").update(patch).eq("id", id)
  if (error) throw error
}

export async function deleteSet(id: string): Promise<void> {
  const { error } = await supabase.from("sets").delete().eq("id", id)
  if (error) throw error
}

export type SetWithSession = SetRow & {
  workout_sessions: Pick<WorkoutSessionRow, "started_at" | "session_type"> | null
}

/** All sets for one exercise with session timestamps — progression data. */
export async function getExerciseSets(exerciseId: string): Promise<SetWithSession[]> {
  const { data, error } = await supabase
    .from("sets")
    .select("*, workout_sessions(started_at, session_type)")
    .eq("exercise_id", exerciseId)
    .order("created_at", { ascending: true })
    .limit(400)
  if (error) throw error
  return data as SetWithSession[]
}

/** Exercise's most recent set anywhere — default values for a fresh set row. */
export async function getLastSetForExercise(
  exerciseId: string,
): Promise<SetRow | null> {
  const { data, error } = await supabase
    .from("sets")
    .select("*")
    .eq("exercise_id", exerciseId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

// --- profile ---------------------------------------------------------------------

export async function getProfile(): Promise<ProfileRow | null> {
  const { data, error } = await supabase.from("profile").select("*").maybeSingle()
  if (error) throw error
  return data
}

export async function setWeeklyTarget(target: number): Promise<void> {
  const uid = await userId()
  const { error } = await supabase
    .from("profile")
    .upsert({ user_id: uid, weekly_session_target: target }, { onConflict: "user_id" })
  if (error) throw error
}

// --- money -----------------------------------------------------------------------

export async function getAccounts(): Promise<AccountRow[]> {
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .order("created_at")
  if (error) throw error
  return data
}

export async function createAccount(input: {
  name: string
  type: "hysa" | "brokerage" | "other"
  currency?: string
  apy?: number | null
}): Promise<AccountRow> {
  const uid = await userId()
  const { data, error } = await supabase
    .from("accounts")
    .insert({ ...input, user_id: uid })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateAccountApy(id: string, apy: number | null): Promise<void> {
  const { error } = await supabase.from("accounts").update({ apy }).eq("id", id)
  if (error) throw error
}

/** Deletes the account and (via FK cascade) its balance history. */
export async function deleteAccount(id: string): Promise<void> {
  const { error } = await supabase.from("accounts").delete().eq("id", id)
  if (error) throw error
}

export async function insertBalanceEvent(
  accountId: string,
  balance: number,
): Promise<void> {
  const uid = await userId()
  const { error } = await supabase
    .from("balance_events")
    .insert({ account_id: accountId, balance, user_id: uid })
  if (error) throw error
}

/** All balance events oldest-first — the net-worth series is derived client-side. */
export async function getBalanceEvents(): Promise<BalanceEventRow[]> {
  const { data, error } = await supabase
    .from("balance_events")
    .select("*")
    .order("recorded_at", { ascending: true })
  if (error) throw error
  return data
}

export async function insertIncomeEvent(input: {
  amount: number
  source: string
  currency?: string
  received_at?: string
  from_recurring?: boolean
}): Promise<void> {
  const uid = await userId()
  const { error } = await supabase
    .from("income_events")
    .insert({ ...input, user_id: uid })
  if (error) throw error
}

export async function getIncomeEvents(limit = 20): Promise<IncomeEventRow[]> {
  const { data, error } = await supabase
    .from("income_events")
    .select("*")
    .order("received_at", { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

export async function getRecurringIncome(): Promise<RecurringIncomeRow | null> {
  const { data, error } = await supabase
    .from("recurring_income")
    .select("*")
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function upsertRecurringIncome(input: {
  id?: string
  amount: number
  source: string
  cadence: "weekly" | "fortnightly" | "monthly"
  next_date: string
}): Promise<void> {
  const uid = await userId()
  const { error } = await supabase
    .from("recurring_income")
    .upsert({ ...input, user_id: uid })
  if (error) throw error
}

export async function deleteRecurringIncome(id: string): Promise<void> {
  const { error } = await supabase.from("recurring_income").delete().eq("id", id)
  if (error) throw error
}

function advance(date: string, cadence: "weekly" | "fortnightly" | "monthly"): string {
  const d = new Date(`${date}T00:00:00Z`)
  if (cadence === "weekly") d.setUTCDate(d.getUTCDate() + 7)
  else if (cadence === "fortnightly") d.setUTCDate(d.getUTCDate() + 14)
  else d.setUTCMonth(d.getUTCMonth() + 1)
  return d.toISOString().slice(0, 10)
}

/** Materialize due recurring income into income_events (BLUEPRINT §4).
 * Runs on Money tab load; catches up multiple missed occurrences. */
export async function materializeRecurringIncome(): Promise<number> {
  const recurring = await getRecurringIncome()
  if (!recurring) return 0
  const today = logicalDay()
  let next = recurring.next_date
  let created = 0
  while (next <= today && created < 12) {
    await insertIncomeEvent({
      amount: recurring.amount,
      source: recurring.source,
      currency: recurring.currency,
      received_at: `${next}T09:00:00+10:00`,
      from_recurring: true,
    })
    next = advance(next, recurring.cadence as "weekly" | "fortnightly" | "monthly")
    created++
  }
  if (created > 0) {
    const { error } = await supabase
      .from("recurring_income")
      .update({ next_date: next })
      .eq("id", recurring.id)
    if (error) throw error
  }
  return created
}

export async function getHolding(symbol = "VOO"): Promise<HoldingRow | null> {
  const { data, error } = await supabase
    .from("holdings")
    .select("*")
    .eq("symbol", symbol)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function upsertHolding(symbol: string, shares: number): Promise<void> {
  const uid = await userId()
  const { error } = await supabase
    .from("holdings")
    .upsert(
      { symbol, shares, currency: "USD", user_id: uid },
      { onConflict: "user_id,symbol" },
    )
  if (error) throw error
}

export async function getPriceSnapshots(
  symbol = "VOO",
  sinceDays = 120,
): Promise<PriceSnapshotRow[]> {
  const since = new Date(Date.now() - sinceDays * 86400_000)
    .toISOString()
    .slice(0, 10)
  const { data, error } = await supabase
    .from("price_snapshots")
    .select("*")
    .eq("symbol", symbol)
    .gte("date", since)
    .order("date", { ascending: true })
  if (error) throw error
  return data
}

export async function getFxSnapshots(
  pair = "AUDUSD",
  sinceDays = 120,
): Promise<FxSnapshotRow[]> {
  const since = new Date(Date.now() - sinceDays * 86400_000)
    .toISOString()
    .slice(0, 10)
  const { data, error } = await supabase
    .from("fx_snapshots")
    .select("*")
    .eq("pair", pair)
    .gte("date", since)
    .order("date", { ascending: true })
  if (error) throw error
  return data
}

// --- notes -----------------------------------------------------------------------

export type NoteType = "todo" | "scratch" | "journal"

export async function getNotes(): Promise<NoteRow[]> {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200)
  if (error) throw error
  return data
}

export async function createNote(type: NoteType, content: string): Promise<void> {
  const uid = await userId()
  const { error } = await supabase.from("notes").insert({
    type,
    content,
    is_done: type === "todo" ? false : null,
    user_id: uid,
  })
  if (error) throw error
}

export async function setNoteDone(id: string, done: boolean): Promise<void> {
  const { error } = await supabase
    .from("notes")
    .update({ is_done: done, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) throw error
}

export async function updateNoteContent(id: string, content: string): Promise<void> {
  const { error } = await supabase
    .from("notes")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) throw error
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from("notes").delete().eq("id", id)
  if (error) throw error
}

// --- goals -----------------------------------------------------------------------

export async function getGoal(): Promise<GoalRow | null> {
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("metric", "weight_kg")
    .maybeSingle()
  if (error) throw error
  return data
}

export async function upsertGoal(input: {
  name: string
  target_value: number
  target_date: string
}): Promise<void> {
  const uid = await userId()
  const { error } = await supabase
    .from("goals")
    .upsert(
      { ...input, metric: "weight_kg", user_id: uid },
      { onConflict: "user_id,metric" },
    )
  if (error) throw error
}

// --- edge functions ------------------------------------------------------------

export async function parseLog(text: string): Promise<ParseResponse> {
  const { data, error } = await supabase.functions.invoke("ai-parse-log", {
    body: { text },
  })
  if (error) throw error
  return data as ParseResponse
}

export async function askAI(question: string): Promise<AskResponse> {
  const { data, error } = await supabase.functions.invoke("ai-ask", {
    body: { question },
  })
  if (error) throw error
  return data as AskResponse
}
