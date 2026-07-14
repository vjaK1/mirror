import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useGoal, useUpsertGoal } from "./queries"

/** V1 has exactly one goal: the October cut (weight target + date).
 * It powers the Home header countdown and the weight-card projection. */
export function GoalCard() {
  const { data: goal } = useGoal()
  const upsert = useUpsertGoal()
  const [target, setTarget] = useState<string | null>(null)
  const [date, setDate] = useState<string | null>(null)

  const targetValue = target ?? goal?.target_value.toString() ?? ""
  const dateValue = date ?? goal?.target_date ?? ""

  function save() {
    const kg = Number(targetValue)
    if (!Number.isFinite(kg) || kg <= 0 || !dateValue) return
    upsert.mutate({
      name: goal?.name ?? "October cut",
      target_value: kg,
      target_date: dateValue,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Goal</CardTitle>
        <CardDescription>
          {goal
            ? `${goal.name}: ${goal.target_value} kg by ${goal.target_date}`
            : "Target weight and date — drives the Home header and projection."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-end gap-2">
        <div className="flex flex-1 flex-col gap-1">
          <Label htmlFor="goal-target">Target kg</Label>
          <Input
            id="goal-target"
            type="number"
            inputMode="decimal"
            step="0.1"
            placeholder="74.0"
            value={targetValue}
            onChange={(e) => setTarget(e.target.value)}
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <Label htmlFor="goal-date">By date</Label>
          <Input
            id="goal-date"
            type="date"
            value={dateValue}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <Button onClick={save} disabled={upsert.isPending || !targetValue || !dateValue}>
          {upsert.isPending ? "Saving…" : "Save"}
        </Button>
      </CardContent>
    </Card>
  )
}
