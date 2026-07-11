import { useState } from "react"
import { Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { SavedMealItem } from "@/lib/data"
import { displayName } from "./food-math"
import { useCreateSavedMeal, useDeleteLog, useTodayLogs } from "./queries"

const timeFormat = new Intl.DateTimeFormat("en-AU", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Australia/Melbourne",
})

export function TodayLog() {
  const { data: logs, isLoading } = useTodayLogs()
  const deleteLog = useDeleteLog()
  const createMeal = useCreateSavedMeal()
  const [mealDialogOpen, setMealDialogOpen] = useState(false)
  const [mealName, setMealName] = useState("")

  const matchedItems: SavedMealItem[] = (logs ?? [])
    .filter((l) => l.food_id && l.grams)
    .map((l) => ({ food_id: l.food_id!, grams: l.grams! }))

  function saveMeal() {
    if (!mealName.trim() || matchedItems.length === 0) return
    createMeal.mutate(
      { name: mealName.trim(), items: matchedItems },
      {
        onSuccess: () => {
          setMealDialogOpen(false)
          setMealName("")
        },
      },
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today</CardTitle>
        <CardDescription>
          {isLoading
            ? "Loading…"
            : `${logs?.length ?? 0} ${logs?.length === 1 ? "entry" : "entries"} this logical day`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {logs && logs.length > 0 ? (
          <>
            <ul className="flex flex-col divide-y divide-border">
              {logs.map((log) => (
                <li key={log.id} className="flex items-center gap-2 py-2">
                  <span className="w-14 shrink-0 text-xs text-muted-foreground">
                    {timeFormat.format(new Date(log.logged_at))}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">
                      {log.foods ? displayName(log.foods) : (log.raw_text ?? "Entry")}
                      {log.grams ? (
                        <span className="text-muted-foreground"> · {log.grams} g</span>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(log.kcal)} kcal · P {log.protein_g} · C {log.carbs_g} · F{" "}
                      {log.fat_g}
                    </p>
                  </div>
                  {log.source === "ai_estimate" && (
                    <Badge variant="outline" className="shrink-0 text-warning">
                      estimate
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete entry"
                    onClick={() => deleteLog.mutate(log.id)}
                    disabled={deleteLog.isPending}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 self-start"
              onClick={() => setMealDialogOpen(true)}
              disabled={matchedItems.length === 0}
            >
              Save today as meal
            </Button>
          </>
        ) : (
          !isLoading && (
            <p className="py-2 text-sm text-muted-foreground">
              Nothing logged yet — use the + button or add food below.
            </p>
          )
        )}
      </CardContent>

      <Dialog open={mealDialogOpen} onOpenChange={setMealDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Save today as meal</DialogTitle>
            <DialogDescription>
              Saves the {matchedItems.length} matched item
              {matchedItems.length === 1 ? "" : "s"} for one-tap logging later.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder='e.g. "breakfast usual"'
            value={mealName}
            onChange={(e) => setMealName(e.target.value)}
            autoFocus
          />
          <DialogFooter>
            <Button
              className="w-full"
              onClick={saveMeal}
              disabled={!mealName.trim() || createMeal.isPending}
            >
              {createMeal.isPending ? "Saving…" : "Save meal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
