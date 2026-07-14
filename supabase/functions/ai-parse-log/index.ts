// ai-parse-log (BLUEPRINT §5 Job 1): raw text → structured log proposal.
// The DB candidate search runs BEFORE the model call; the model only matches
// text to candidate rows and extracts portions. Macros for matched items are
// recomputed server-side from the foods table (CLAUDE.md rule 8) — the model
// never supplies nutrition numbers except for flagged ai_estimate fallbacks.
import { createClient } from "npm:@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const MODEL = Deno.env.get("MIRROR_AI_MODEL") ?? "claude-sonnet-5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type FoodRow = {
  id: string;
  name: string;
  brand: string | null;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fibre_g: number;
  sodium_mg: number | null;
  potassium_mg: number | null;
  iron_mg: number | null;
  calcium_mg: number | null;
};

// --- output contract schema (structured outputs) -------------------------
const NUMBER_OR_NULL = { anyOf: [{ type: "number" }, { type: "null" }] };

const OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["intent", "items", "unmatched", "lift", "note"],
  properties: {
    intent: { type: "string", enum: ["food_log", "lift_log", "note", "question"] },
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["raw", "matched_food_id", "food_name", "grams", "confidence"],
        properties: {
          raw: { type: "string" },
          matched_food_id: { anyOf: [{ type: "string" }, { type: "null" }] },
          food_name: { type: "string" },
          grams: { type: "number" },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
        },
      },
    },
    unmatched: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["raw", "ai_estimate"],
        properties: {
          raw: { type: "string" },
          ai_estimate: {
            type: "object",
            additionalProperties: false,
            required: ["kcal", "protein_g", "carbs_g", "fat_g", "fibre_g"],
            properties: {
              kcal: { type: "number" },
              protein_g: { type: "number" },
              carbs_g: { type: "number" },
              fat_g: { type: "number" },
              fibre_g: { type: "number" },
            },
          },
        },
      },
    },
    lift: {
      anyOf: [
        {
          type: "object",
          additionalProperties: false,
          required: ["session_type_guess", "sets"],
          properties: {
            session_type_guess: {
              type: "string",
              enum: ["push", "pull", "legs", "other"],
            },
            sets: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["exercise", "weight_kg", "reps"],
                properties: {
                  exercise: { type: "string" },
                  weight_kg: NUMBER_OR_NULL,
                  reps: { type: "number" },
                },
              },
            },
          },
        },
        { type: "null" },
      ],
    },
    note: {
      anyOf: [
        {
          type: "object",
          additionalProperties: false,
          required: ["note_type", "content"],
          properties: {
            note_type: { type: "string", enum: ["todo", "scratch", "journal"] },
            content: { type: "string" },
          },
        },
        { type: "null" },
      ],
    },
  },
} as const;

// --- candidate search ------------------------------------------------------
function segmentText(text: string): string[] {
  return text
    .split(/,|\band\b|\bwith\b|\+|\n/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

function searchTerm(segment: string): string {
  return segment
    .replace(/\d+(\.\d+)?\s*(g|gram|grams|kg|ml|l|cup|cups|tbsp|tsp|scoop|scoops|slice|slices|x)?/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function findCandidates(
  supabase: ReturnType<typeof createClient>,
  text: string,
): Promise<FoodRow[]> {
  const terms = [...new Set(segmentText(text).map(searchTerm).filter((t) => t.length >= 2))];
  const byId = new Map<string, FoodRow>();
  for (const term of terms.slice(0, 8)) {
    // Two passes per term: substring match, then per-word match for
    // colloquial phrasings ("chicken 200g" → "chicken").
    const words = term.split(" ").filter((w) => w.length >= 3);
    const patterns = [term, ...words].slice(0, 3);
    for (const p of patterns) {
      const { data } = await supabase
        .from("foods")
        .select(
          "id, name, brand, kcal, protein_g, carbs_g, fat_g, fibre_g, sodium_mg, potassium_mg, iron_mg, calcium_mg",
        )
        .ilike("name", `%${p}%`)
        .limit(6);
      for (const row of (data ?? []) as FoodRow[]) byId.set(row.id, row);
      if (byId.size >= 30) break;
    }
  }
  return [...byId.values()].slice(0, 30);
}

// --- model call --------------------------------------------------------------
async function parseWithClaude(text: string, candidates: FoodRow[]) {
  const candidateList = candidates.map((c) => ({
    id: c.id,
    name: c.brand ? `${c.name} (${c.brand})` : c.name,
    per_100g: { kcal: c.kcal, protein_g: c.protein_g, carbs_g: c.carbs_g, fat_g: c.fat_g },
  }));

  const system = [
    "You parse a short user message from a personal food/training tracker into a structured log proposal.",
    "Classify intent: food_log (ate/drank something), lift_log (gym sets), note (reminder/journal), question (asking about their data).",
    "For food_log: split the text into items. Match each item to ONE candidate food from the provided list by id — never invent an id, never match to a food not in the list. Estimate grams from the text; convert colloquial portions (1 raw/boiled egg ≈ 50 g, 1 scrambled egg ≈ 61 g, 1 fried egg ≈ 46 g, 1 cup cooked rice ≈ 180 g, 1 scoop protein powder ≈ 30 g, 1 slice bread ≈ 40 g, 1 tbsp ≈ 15 g/20 g oil, 1 banana ≈ 120 g, 1 can tuna ≈ 95 g drained). Do not compute macros for matched items — the server does that.",
    "If no candidate is a plausible match for an item, put it in unmatched with your best per-portion nutrition estimate (whole portion, not per 100 g).",
    "For lift_log: expand shorthand like '3x8' into that many identical sets. Weight in kg; bodyweight exercises get weight_kg null.",
    "For note: note_type todo for actionable reminders, journal for reflections, scratch otherwise.",
    "items and unmatched are empty arrays unless intent is food_log; lift is null unless lift_log; note is null unless intent is note.",
  ].join("\n");

  const userMsg = `Candidate foods (id, name, per 100 g):\n${JSON.stringify(candidateList)}\n\nUser text: "${text}"`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2000,
      output_config: { effort: "low", format: { type: "json_schema", schema: OUTPUT_SCHEMA } },
      system,
      messages: [{ role: "user", content: userMsg }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${body.slice(0, 300)}`);
  }
  const message = await res.json();
  if (message.stop_reason === "refusal") throw new Error("Model refused the request");
  const textBlock = message.content?.find((b: { type: string }) => b.type === "text");
  if (!textBlock) throw new Error("No text block in model response");
  return JSON.parse(textBlock.text);
}

// --- portion math (server-side, from the foods table) -----------------------
function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function computeItem(
  item: { raw: string; matched_food_id: string | null; food_name: string; grams: number; confidence: string },
  foods: Map<string, FoodRow>,
) {
  const food = item.matched_food_id ? foods.get(item.matched_food_id) : undefined;
  if (!food) return null;
  const f = item.grams / 100;
  return {
    raw: item.raw,
    matched_food_id: food.id,
    food_name: food.brand ? `${food.name} (${food.brand})` : food.name,
    grams: item.grams,
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
    confidence: item.confidence,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string" || text.length > 500) {
      return json({ error: "Provide 'text' (max 500 chars)" }, 400);
    }

    // Client bound to the caller's JWT so foods RLS applies (global + own rows).
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } },
    );

    const candidates = await findCandidates(supabase, text);
    const foodsById = new Map(candidates.map((c) => [c.id, c]));

    const parsed = await parseWithClaude(text, candidates);

    if (parsed.intent === "food_log") {
      const items = [];
      const unmatched = [...(parsed.unmatched ?? [])].map(
        (u: { raw: string; ai_estimate: Record<string, number> }) => ({
          ...u,
          flagged: true,
        }),
      );
      for (const item of parsed.items ?? []) {
        const computed = computeItem(item, foodsById);
        if (computed) items.push(computed);
        else if (item.raw) {
          // Model referenced a food id that isn't a real candidate — degrade
          // to unmatched rather than trusting invented numbers.
          unmatched.push({
            raw: item.raw,
            ai_estimate: { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fibre_g: 0 },
            flagged: true,
          });
        }
      }
      return json({ intent: "food_log", items, unmatched, needs_confirmation: true });
    }

    if (parsed.intent === "lift_log") {
      return json({
        intent: "lift_log",
        session_type_guess: parsed.lift?.session_type_guess ?? "other",
        sets: parsed.lift?.sets ?? [],
        needs_confirmation: true,
      });
    }

    if (parsed.intent === "note") {
      return json({
        intent: "note",
        note_type: parsed.note?.note_type ?? "scratch",
        content: parsed.note?.content ?? text,
        needs_confirmation: true,
      });
    }

    return json({ intent: "question", needs_confirmation: false });
  } catch (err) {
    console.error("ai-parse-log error:", err);
    return json({ error: String(err instanceof Error ? err.message : err) }, 500);
  }
});
