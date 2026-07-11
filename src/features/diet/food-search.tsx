import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Search } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { getLastGrams, searchFoods } from "@/lib/data"
import type { FoodRow } from "@/lib/database.types"
import { displayName } from "./food-math"
import { GramsDialog } from "./grams-dialog"
import { itemFromFood } from "./food-math"
import { useLogFood } from "./queries"

export function FoodSearch() {
  const [term, setTerm] = useState("")
  const [debounced, setDebounced] = useState("")
  const [dialogFood, setDialogFood] = useState<FoodRow | null>(null)
  const [defaultGrams, setDefaultGrams] = useState(100)
  const logFood = useLogFood()

  // Friction fix: prefill the grams you used last time for this food.
  async function openFood(food: FoodRow) {
    setDefaultGrams(100)
    setDialogFood(food)
    const last = await getLastGrams(food.id)
    if (last) setDefaultGrams(last)
  }

  useEffect(() => {
    const t = setTimeout(() => setDebounced(term.trim()), 250)
    return () => clearTimeout(t)
  }, [term])

  const { data: results, isFetching } = useQuery({
    queryKey: ["food-search", debounced],
    queryFn: () => searchFoods(debounced),
    enabled: debounced.length >= 2,
  })

  function add(grams: number) {
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
      {
        onSuccess: () => {
          setDialogFood(null)
          setTerm("")
        },
      },
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add food</CardTitle>
        <CardDescription>Search the food table, then enter grams.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="relative">
          <Search
            className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            className="pl-8"
            placeholder="Search foods…"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            autoComplete="off"
          />
        </div>
        {debounced.length >= 2 && (
          <ul className="flex flex-col divide-y divide-border">
            {(results ?? []).map((food) => (
              <li key={food.id}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 py-2 text-left hover:bg-muted/50"
                  onClick={() => void openFood(food)}
                >
                  <span className="min-w-0 truncate text-sm">{displayName(food)}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {Math.round(food.kcal)} kcal / 100 g
                  </span>
                </button>
              </li>
            ))}
            {results && results.length === 0 && !isFetching && (
              <li className="py-2 text-sm text-muted-foreground">
                No match — try the + sheet, the AI can estimate it.
              </li>
            )}
          </ul>
        )}
      </CardContent>

      <GramsDialog
        food={dialogFood}
        defaultGrams={defaultGrams}
        saving={logFood.isPending}
        onSave={add}
        onOpenChange={(open) => {
          if (!open) setDialogFood(null)
        }}
      />
    </Card>
  )
}
