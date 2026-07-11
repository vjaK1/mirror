import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getFoodsByIds } from "@/lib/data"
import type { SavedMealItem } from "@/lib/data"
import type { FoodRow, SavedMealRow } from "@/lib/database.types"
import { itemFromFood } from "./food-math"
import { GramsDialog } from "./grams-dialog"
import {
  useDeleteSavedMeal,
  useLogFood,
  useRecentFoods,
  useSavedMeals,
} from "./queries"

/** One-tap logging: saved meals log immediately; recent foods open a grams
 * dialog prefilled with the last-used amount. No AI involved. */
export function QuickAddRow() {
  const { data: meals } = useSavedMeals()
  const { data: recents } = useRecentFoods()
  const logFood = useLogFood()
  const deleteMeal = useDeleteSavedMeal()
  const [pendingMealId, setPendingMealId] = useState<string | null>(null)
  const [dialogFood, setDialogFood] = useState<FoodRow | null>(null)
  const [dialogGrams, setDialogGrams] = useState(100)

  async function logMeal(meal: SavedMealRow) {
    setPendingMealId(meal.id)
    try {
      const items = meal.items as SavedMealItem[]
      const foods = await getFoodsByIds(items.map((i) => i.food_id))
      const byId = new Map(foods.map((f) => [f.id, f]))
      const rows = items.flatMap((item) => {
        const food = byId.get(item.food_id)
        if (!food) return []
        const p = itemFromFood(food, item.grams, meal.name)
        return [
          {
            food_id: p.matched_food_id,
            grams: p.grams,
            kcal: p.kcal,
            protein_g: p.protein_g,
            carbs_g: p.carbs_g,
            fat_g: p.fat_g,
            fibre_g: p.fibre_g,
            micros: p.micros,
            source: "saved_meal",
            raw_text: meal.name,
          },
        ]
      })
      if (rows.length > 0) await logFood.mutateAsync(rows)
    } finally {
      setPendingMealId(null)
    }
  }

  function logRecent(grams: number) {
    if (!dialogFood) return
    const p = itemFromFood(dialogFood, grams, `${grams}g ${dialogFood.name}`)
    logFood.mutate(
      [
        {
          food_id: p.matched_food_id,
          grams: p.grams,
          kcal: p.kcal,
          protein_g: p.protein_g,
          carbs_g: p.carbs_g,
          fat_g: p.fat_g,
          fibre_g: p.fibre_g,
          micros: p.micros,
          source: "manual",
          raw_text: p.raw,
        },
      ],
      { onSuccess: () => setDialogFood(null) },
    )
  }

  const hasContent = (meals?.length ?? 0) > 0 || (recents?.length ?? 0) > 0
  if (!hasContent) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick add</CardTitle>
        <CardDescription>Saved meals log in one tap; recents ask for grams.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {meals && meals.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {meals.map((meal) => (
              <span key={meal.id} className="inline-flex items-center">
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-full rounded-r-none pr-1.5"
                  disabled={pendingMealId === meal.id}
                  onClick={() => void logMeal(meal)}
                >
                  {pendingMealId === meal.id ? "Logging…" : meal.name}
                </Button>
                <Button
                  variant="secondary"
                  size="icon-sm"
                  className="rounded-full rounded-l-none border-l border-border"
                  aria-label={`Delete saved meal ${meal.name}`}
                  onClick={() => deleteMeal.mutate(meal.id)}
                >
                  <X aria-hidden="true" />
                </Button>
              </span>
            ))}
          </div>
        )}
        {recents && recents.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {recents.map(({ food, lastGrams }) => (
              <Button
                key={food.id}
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => {
                  setDialogFood(food)
                  setDialogGrams(lastGrams)
                }}
              >
                {food.name}
              </Button>
            ))}
          </div>
        )}
      </CardContent>

      <GramsDialog
        food={dialogFood}
        defaultGrams={dialogGrams}
        saving={logFood.isPending}
        onSave={logRecent}
        onOpenChange={(open) => {
          if (!open) setDialogFood(null)
        }}
      />
    </Card>
  )
}
