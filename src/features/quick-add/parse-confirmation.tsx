import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { findOrCreateEstimateFood, getFoodsByIds } from "@/lib/data"
import type { FoodLogInsert } from "@/lib/database.types"
import type { EstimateItem, FoodProposal, ProposalItem } from "@/lib/parse-types"
import { itemFromFood, macrosFromPer100, round1 } from "@/features/diet/food-math"
import { useLogFood } from "@/features/diet/queries"

/** Per-item numbers with editable grams; nothing is written until Confirm.
 * Confirmed estimates are saved as user foods (source 'ai_estimate') so the
 * app learns them — searchable and AI-matchable from then on. */
export function ParseConfirmation({
  proposal,
  onDone,
  onCancel,
}: {
  proposal: FoodProposal
  onDone: () => void
  onCancel: () => void
}) {
  const [items, setItems] = useState<ProposalItem[]>(proposal.items)
  const [estimates, setEstimates] = useState<EstimateItem[]>(proposal.unmatched)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const logFood = useLogFood()

  const matchedIds = useMemo(
    () => proposal.items.map((i) => i.matched_food_id).filter((id): id is string => !!id),
    [proposal.items],
  )
  const { data: foods } = useQuery({
    queryKey: ["foods", matchedIds],
    queryFn: () => getFoodsByIds(matchedIds),
  })
  const foodById = useMemo(() => new Map((foods ?? []).map((f) => [f.id, f])), [foods])

  function setGrams(index: number, grams: number) {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index || !item.matched_food_id) return item
        const food = foodById.get(item.matched_food_id)
        if (!food || !Number.isFinite(grams) || grams <= 0) return item
        return itemFromFood(food, grams, item.raw, item.confidence)
      }),
    )
  }

  function setEstimateGrams(index: number, grams: number) {
    if (!Number.isFinite(grams) || grams <= 0) return
    setEstimates((prev) =>
      prev.map((est, i) => (i === index ? { ...est, grams } : est)),
    )
  }

  const totals = useMemo(() => {
    let kcal = 0,
      protein = 0,
      carbs = 0,
      fat = 0,
      fibre = 0
    for (const i of items) {
      kcal += i.kcal
      protein += i.protein_g
      carbs += i.carbs_g
      fat += i.fat_g
      fibre += i.fibre_g
    }
    for (const est of estimates) {
      const m = macrosFromPer100(est.per_100g, est.grams)
      kcal += m.kcal
      protein += m.protein_g
      carbs += m.carbs_g
      fat += m.fat_g
      fibre += m.fibre_g
    }
    return {
      kcal: Math.round(kcal),
      protein: round1(protein),
      carbs: round1(carbs),
      fat: round1(fat),
      fibre: round1(fibre),
    }
  }, [items, estimates])

  async function confirm() {
    setSaving(true)
    setError(null)
    try {
      const rows: Omit<FoodLogInsert, "user_id">[] = items.map((i) => ({
        food_id: i.matched_food_id,
        grams: i.grams,
        kcal: i.kcal,
        protein_g: i.protein_g,
        carbs_g: i.carbs_g,
        fat_g: i.fat_g,
        fibre_g: i.fibre_g,
        micros: i.micros,
        source: proposal.origin,
        raw_text: i.raw,
      }))

      for (const est of estimates) {
        const food = await findOrCreateEstimateFood(est.name, est.per_100g)
        rows.push({
          food_id: food.id,
          grams: est.grams,
          ...macrosFromPer100(est.per_100g, est.grams),
          micros: {},
          source: "ai_estimate",
          raw_text: est.raw,
        })
      }

      await logFood.mutateAsync(rows)
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {items.map((item, index) => (
          <li key={`${item.raw}-${index}`} className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.food_name}</p>
              <p className="text-xs text-muted-foreground">
                {item.kcal} kcal · P {item.protein_g} · C {item.carbs_g} · F {item.fat_g}
              </p>
            </div>
            {item.confidence !== "high" && (
              <Badge variant="outline" className="shrink-0 text-warning">
                check
              </Badge>
            )}
            <div className="flex shrink-0 items-center gap-1">
              <Input
                type="number"
                inputMode="decimal"
                className="h-8 w-16 text-right"
                value={item.grams}
                min={1}
                onChange={(e) => setGrams(index, Number(e.target.value))}
                aria-label={`Grams of ${item.food_name}`}
              />
              <span className="text-xs text-muted-foreground">g</span>
            </div>
          </li>
        ))}
        {estimates.map((est, index) => {
          const m = macrosFromPer100(est.per_100g, est.grams)
          return (
            <li key={`${est.raw}-${index}`} className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{est.name}</p>
                <p className="text-xs text-muted-foreground">
                  {m.kcal} kcal · P {m.protein_g} · C {m.carbs_g} · F {m.fat_g}
                </p>
              </div>
              <Badge variant="outline" className="shrink-0 text-warning">
                AI estimate
              </Badge>
              <div className="flex shrink-0 items-center gap-1">
                <Input
                  type="number"
                  inputMode="decimal"
                  className="h-8 w-16 text-right"
                  value={est.grams}
                  min={1}
                  onChange={(e) => setEstimateGrams(index, Number(e.target.value))}
                  aria-label={`Grams of ${est.name}`}
                />
                <span className="text-xs text-muted-foreground">g</span>
              </div>
            </li>
          )
        })}
      </ul>

      {estimates.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Estimated foods are saved to your food list. Next time they'll match
          without the AI.
        </p>
      )}

      <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
        <span className="font-medium">{totals.kcal} kcal</span>
        <span className="text-muted-foreground">
          P {totals.protein} · C {totals.carbs} · F {totals.fat} · Fib {totals.fibre}
        </span>
      </div>

      {error && <p className="text-sm text-destructive">Save failed: {error}</p>}

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onCancel} disabled={saving}>
          Back
        </Button>
        <Button className="flex-1" onClick={() => void confirm()} disabled={saving}>
          {saving ? "Saving…" : "Confirm & save"}
        </Button>
      </div>
    </div>
  )
}
