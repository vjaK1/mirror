import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { FoodRow } from "@/lib/database.types"
import { displayName, itemFromFood } from "./food-math"

export function GramsDialog({
  food,
  defaultGrams = 100,
  onSave,
  onOpenChange,
  saving = false,
}: {
  food: FoodRow | null
  defaultGrams?: number
  onSave: (grams: number) => void
  onOpenChange: (open: boolean) => void
  saving?: boolean
}) {
  const [grams, setGrams] = useState(defaultGrams)

  useEffect(() => {
    setGrams(defaultGrams)
  }, [food, defaultGrams])

  const preview = food && grams > 0 ? itemFromFood(food, grams, "") : null

  return (
    <Dialog open={!!food} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{food ? displayName(food) : ""}</DialogTitle>
          <DialogDescription>
            {preview
              ? `${preview.kcal} kcal · P ${preview.protein_g} · C ${preview.carbs_g} · F ${preview.fat_g}`
              : "Enter an amount"}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="decimal"
            min={1}
            autoFocus
            value={grams}
            onChange={(e) => setGrams(Number(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && grams > 0) onSave(grams)
            }}
          />
          <span className="text-sm text-muted-foreground">g</span>
        </div>
        <DialogFooter>
          <Button
            className="w-full"
            disabled={!preview || saving}
            onClick={() => onSave(grams)}
          >
            {saving ? "Adding…" : "Add to log"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
