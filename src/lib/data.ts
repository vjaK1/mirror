// Data-access layer (CLAUDE.md rule 6).
//
// Every Supabase table read/write in the app goes through this module —
// feature code never imports `supabase` directly for data access. This keeps
// a single seam where the offline queue (IndexedDB) can be inserted later
// without touching features. Auth calls are exempt (they are not data).
import { supabase } from "./supabase"
import { logicalDay, logicalDayRange } from "./logical-day"
import type {
  DietPhaseRow,
  FoodLogInsert,
  FoodLogRow,
  FoodRow,
  MacrosDailyRow,
  SavedMealRow,
  WeighInRow,
} from "./database.types"
import type { ParseResponse } from "./parse-types"

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

// --- edge functions ------------------------------------------------------------

export async function parseLog(text: string): Promise<ParseResponse> {
  const { data, error } = await supabase.functions.invoke("ai-parse-log", {
    body: { text },
  })
  if (error) throw error
  return data as ParseResponse
}
