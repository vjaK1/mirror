import { useMemo, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAddWeighIn, useWeighIns } from "./queries"
import { WeightChart } from "./weight-chart"
import type { WeightPoint } from "./weight-chart"

const WEEK_MS = 7 * 86400_000

export function trailingAverage(points: WeightPoint[]): WeightPoint[] {
  return points.map((p) => {
    const window = points.filter((q) => q.t <= p.t && q.t > p.t - WEEK_MS)
    const mean = window.reduce((s, q) => s + q.kg, 0) / window.length
    return { t: p.t, kg: Math.round(mean * 100) / 100 }
  })
}

export function WeighInCard() {
  const { data: weighIns } = useWeighIns(90)
  const addWeighIn = useAddWeighIn()
  const [value, setValue] = useState("")

  const raw: WeightPoint[] = useMemo(
    () =>
      (weighIns ?? []).map((w) => ({
        t: new Date(w.measured_at).getTime(),
        kg: w.weight_kg,
      })),
    [weighIns],
  )
  const avg = useMemo(() => trailingAverage(raw), [raw])
  const currentAvg = avg.at(-1)?.kg
  const latest = raw.at(-1)?.kg

  function save() {
    const kg = Number(value)
    if (!Number.isFinite(kg) || kg <= 0 || kg > 400) return
    addWeighIn.mutate(kg, { onSuccess: () => setValue("") })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weight</CardTitle>
        <CardDescription>
          {currentAvg
            ? `7-day average ${currentAvg.toFixed(1)} kg${latest ? ` · last weigh-in ${latest.toFixed(1)} kg` : ""}`
            : "Log weigh-ins to build the trend."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="decimal"
            step="0.1"
            min={30}
            max={300}
            placeholder="76.4"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save()
            }}
          />
          <span className="text-sm text-muted-foreground">kg</span>
          <Button onClick={save} disabled={addWeighIn.isPending || !value}>
            {addWeighIn.isPending ? "Saving…" : "Add"}
          </Button>
        </div>
        {raw.length >= 2 && <WeightChart raw={raw} avg={avg} />}
      </CardContent>
    </Card>
  )
}
