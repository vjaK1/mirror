import { useMemo, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TrendChart } from "@/components/trend-chart"
import { progressionSeries } from "./gym-math"
import { useExerciseSets, useExercises } from "./queries"

export function ProgressionCard() {
  const { data: exercises } = useExercises()
  const [exerciseId, setExerciseId] = useState<string | undefined>()
  const { data: sets } = useExerciseSets(exerciseId)

  const series = useMemo(() => progressionSeries(sets ?? []), [sets])
  const latest = series.at(-1)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progression</CardTitle>
        <CardDescription>
          {latest
            ? `Best recent: e1RM ${latest.v} kg (${latest.detail})`
            : "Estimated 1RM of the top set per session."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Select value={exerciseId} onValueChange={setExerciseId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pick an exercise" />
          </SelectTrigger>
          <SelectContent>
            {(exercises ?? []).map((exercise) => (
              <SelectItem key={exercise.id} value={exercise.id}>
                {exercise.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {exerciseId &&
          (series.length >= 2 ? (
            <TrendChart
              line={series}
              formatValue={(v) => `e1RM ${v} kg`}
              ariaLabel="Estimated one-rep max of the top set per session"
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {series.length === 1
                ? `One session logged (${series[0].detail}) — the trend appears from the second.`
                : "No weighted sets logged for this exercise yet."}
            </p>
          ))}
      </CardContent>
    </Card>
  )
}
