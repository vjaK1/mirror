// Client-side types for the ai-parse-log contract (BLUEPRINT §5 Job 1) and
// locally resolved proposals (saved meals / regex matches that skip the API).

export type Micros = {
  sodium_mg: number | null
  potassium_mg: number | null
  iron_mg: number | null
  calcium_mg: number | null
}

export type ProposalItem = {
  raw: string
  matched_food_id: string | null
  food_name: string
  grams: number
  kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fibre_g: number
  micros: Micros
  confidence: "high" | "medium" | "low"
}

export type EstimateItem = {
  raw: string
  ai_estimate: {
    kcal: number
    protein_g: number
    carbs_g: number
    fat_g: number
    fibre_g: number
  }
  flagged: true
}

/** How the proposal was produced — becomes food_logs.source for matched items. */
export type ProposalOrigin = "ai_parse" | "manual" | "saved_meal"

export type FoodProposal = {
  intent: "food_log"
  origin: ProposalOrigin
  rawText: string
  items: ProposalItem[]
  unmatched: EstimateItem[]
}

export type AskResponse =
  | {
      answer: string
      tool_calls: { name: string; input: Record<string, unknown>; result: unknown }[]
    }
  | { error: string }

export type ParseResponse =
  | {
      intent: "food_log"
      items: ProposalItem[]
      unmatched: EstimateItem[]
      needs_confirmation: true
    }
  | {
      intent: "lift_log"
      session_type_guess: "push" | "pull" | "legs" | "other"
      sets: { exercise: string; weight_kg: number | null; reps: number }[]
      needs_confirmation: true
    }
  | {
      intent: "note"
      note_type: "todo" | "scratch" | "journal"
      content: string
      needs_confirmation: true
    }
  | { intent: "question"; needs_confirmation: false }
  | { error: string }
