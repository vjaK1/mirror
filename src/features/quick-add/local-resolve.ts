// No-API resolution paths (BLUEPRINT §5 cost control): saved meals and
// strict "Ng food" text resolve locally; anything ambiguous falls through to
// the ai-parse-log edge function. Conservative by design — a wrong local
// match is worse than one cheap API call.
import { getFoodsByIds, getSavedMeals, searchFoods } from "@/lib/data"
import type { FoodProposal, ProposalItem } from "@/lib/parse-types"
import { itemFromFood } from "@/features/diet/food-math"
import type { SavedMealItem } from "@/lib/data"

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ")
}

async function resolveSavedMeal(text: string): Promise<FoodProposal | null> {
  const wanted = normalize(text)
  if (wanted.length < 3) return null
  const meals = await getSavedMeals()
  const meal = meals.find((m) => normalize(m.name) === wanted)
  if (!meal) return null

  const items = meal.items as SavedMealItem[]
  const foods = await getFoodsByIds(items.map((i) => i.food_id))
  const byId = new Map(foods.map((f) => [f.id, f]))
  const proposalItems: ProposalItem[] = []
  for (const item of items) {
    const food = byId.get(item.food_id)
    if (!food) return null // meal references a deleted food — let the user retype
    proposalItems.push(itemFromFood(food, item.grams, meal.name))
  }
  return {
    intent: "food_log",
    origin: "saved_meal",
    rawText: text,
    items: proposalItems,
    unmatched: [],
  }
}

const GRAMS_FIRST = /^(\d+(?:\.\d+)?)\s*g\s+(.+)$/i
const GRAMS_LAST = /^(.+?)\s+(\d+(?:\.\d+)?)\s*g$/i

async function resolveGramsText(text: string): Promise<FoodProposal | null> {
  const segments = text
    .split(/,|\+|\n/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (segments.length === 0) return null

  const items: ProposalItem[] = []
  for (const segment of segments) {
    const m = GRAMS_FIRST.exec(segment) ?? GRAMS_LAST.exec(segment)
    if (!m) return null
    const grams = Number(GRAMS_FIRST.test(segment) ? m[1] : m[2])
    const term = normalize(GRAMS_FIRST.test(segment) ? m[2] : m[1])
    if (!grams || grams <= 0 || grams > 5000 || term.length < 3) return null

    const candidates = await searchFoods(term)
    const containing = candidates.filter((c) =>
      normalize(c.name).includes(term),
    )
    // Unambiguous only: a single containing match, or an exact name match.
    const exact = containing.find((c) => normalize(c.name) === term)
    const food = exact ?? (containing.length === 1 ? containing[0] : undefined)
    if (!food) return null
    items.push(itemFromFood(food, grams, segment))
  }
  return { intent: "food_log", origin: "manual", rawText: text, items, unmatched: [] }
}

export async function resolveLocally(text: string): Promise<FoodProposal | null> {
  const meal = await resolveSavedMeal(text)
  if (meal) return meal
  return resolveGramsText(text)
}
