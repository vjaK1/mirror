// Portion math from per-100g foods rows — the only client-side source of
// nutrition numbers (CLAUDE.md rule 8).
import type { FoodRow } from "@/lib/database.types"
import type { Per100g, ProposalItem } from "@/lib/parse-types"

export function round1(n: number): number {
  return Math.round(n * 10) / 10
}

export function displayName(food: Pick<FoodRow, "name" | "brand">): string {
  return food.brand ? `${food.name} (${food.brand})` : food.name
}

export function macrosFromPer100(per100: Per100g, grams: number) {
  const f = grams / 100
  return {
    kcal: Math.round(per100.kcal * f),
    protein_g: round1(per100.protein_g * f),
    carbs_g: round1(per100.carbs_g * f),
    fat_g: round1(per100.fat_g * f),
    fibre_g: round1(per100.fibre_g * f),
  }
}

export function itemFromFood(
  food: FoodRow,
  grams: number,
  raw: string,
  confidence: ProposalItem["confidence"] = "high",
): ProposalItem {
  const f = grams / 100
  return {
    raw,
    matched_food_id: food.id,
    food_name: displayName(food),
    grams,
    kcal: Math.round(food.kcal * f),
    protein_g: round1(food.protein_g * f),
    carbs_g: round1(food.carbs_g * f),
    fat_g: round1(food.fat_g * f),
    fibre_g: round1(food.fibre_g * f),
    micros: {
      sodium_mg: food.sodium_mg == null ? null : round1(food.sodium_mg * f),
      potassium_mg: food.potassium_mg == null ? null : round1(food.potassium_mg * f),
      iron_mg: food.iron_mg == null ? null : round1(food.iron_mg * f),
      calcium_mg: food.calcium_mg == null ? null : round1(food.calcium_mg * f),
    },
    confidence,
  }
}
