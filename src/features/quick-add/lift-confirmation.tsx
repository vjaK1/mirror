import { useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  createCustomExercise,
  getSetsForSession,
  getTodaySession,
  insertSet,
  startWorkoutSession,
} from "@/lib/data"
import type { SessionType } from "@/lib/data"
import type { ExerciseRow } from "@/lib/database.types"
import { useExercises } from "@/features/gym/queries"

export type LiftProposal = {
  session_type_guess: SessionType
  sets: { exercise: string; weight_kg: number | null; reps: number }[]
}

type Row = {
  exerciseName: string
  matched: ExerciseRow | null
  weight: string
  reps: string
}

function matchExercise(name: string, exercises: ExerciseRow[]): ExerciseRow | null {
  const n = name.trim().toLowerCase()
  const exact = exercises.find((e) => e.name.toLowerCase() === n)
  if (exact) return exact
  const containing = exercises.filter(
    (e) => e.name.toLowerCase().includes(n) || n.includes(e.name.toLowerCase()),
  )
  containing.sort((a, b) => a.name.length - b.name.length)
  return containing[0] ?? null
}

/** Confirm parsed lifts: appends to today's session of the same type, or
 * starts one. Unmatched exercise names become custom exercises on save. */
export function LiftConfirmation({
  proposal,
  onDone,
  onCancel,
}: {
  proposal: LiftProposal
  onDone: () => void
  onCancel: () => void
}) {
  const { data: exercises } = useExercises()
  const queryClient = useQueryClient()
  const [type, setType] = useState<SessionType>(proposal.session_type_guess)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initialRows = useMemo<Row[]>(
    () =>
      proposal.sets.map((s) => ({
        exerciseName: s.exercise,
        matched: matchExercise(s.exercise, exercises ?? []),
        weight: s.weight_kg?.toString() ?? "",
        reps: s.reps.toString(),
      })),
    [proposal, exercises],
  )
  const [rows, setRows] = useState<Row[] | null>(null)
  const effectiveRows = rows ?? initialRows

  function patchRow(index: number, patch: Partial<Row>) {
    setRows(effectiveRows.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  async function confirm() {
    setSaving(true)
    setError(null)
    try {
      const today = await getTodaySession()
      const session =
        today && today.session_type === type ? today : await startWorkoutSession(type)

      const existing = await getSetsForSession(session.id)
      const counts = new Map<string, number>()
      for (const s of existing) {
        counts.set(s.exercise_id, (counts.get(s.exercise_id) ?? 0) + 1)
      }

      const resolved = new Map<string, ExerciseRow>()
      for (const row of effectiveRows) {
        const reps = Number(row.reps)
        if (!reps || reps <= 0) continue
        let exercise = row.matched
        if (!exercise) {
          const key = row.exerciseName.trim().toLowerCase()
          exercise =
            resolved.get(key) ?? (await createCustomExercise(row.exerciseName.trim()))
          resolved.set(key, exercise)
        }
        const n = (counts.get(exercise.id) ?? 0) + 1
        counts.set(exercise.id, n)
        await insertSet({
          session_id: session.id,
          exercise_id: exercise.id,
          set_number: n,
          reps,
          weight_kg: row.weight === "" ? null : Number(row.weight),
        })
      }

      await queryClient.invalidateQueries({ queryKey: ["gym-session"] })
      await queryClient.invalidateQueries({ queryKey: ["gym-sessions"] })
      await queryClient.invalidateQueries({ queryKey: ["gym-sets"] })
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <ToggleGroup
        type="single"
        variant="outline"
        className="w-full"
        value={type}
        onValueChange={(v) => {
          if (v) setType(v as SessionType)
        }}
      >
        {(["push", "pull", "legs", "other"] as const).map((t) => (
          <ToggleGroupItem key={t} value={t} className="flex-1 capitalize">
            {t}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <ul className="flex flex-col gap-2">
        {effectiveRows.map((row, index) => (
          <li key={index} className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {row.matched?.name ?? row.exerciseName}
              </p>
              {!row.matched && (
                <Badge variant="outline" className="text-warning">
                  new exercise
                </Badge>
              )}
            </div>
            <Input
              type="number"
              inputMode="decimal"
              step="0.5"
              className="h-8 w-20 text-right"
              placeholder="BW"
              value={row.weight}
              onChange={(e) => patchRow(index, { weight: e.target.value })}
              aria-label="Weight in kg"
            />
            <span className="text-xs text-muted-foreground">kg ×</span>
            <Input
              type="number"
              inputMode="numeric"
              className="h-8 w-14 text-right"
              value={row.reps}
              onChange={(e) => patchRow(index, { reps: e.target.value })}
              aria-label="Reps"
            />
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Remove set"
              onClick={() =>
                setRows(effectiveRows.filter((_, i) => i !== index))
              }
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </li>
        ))}
      </ul>

      {error && <p className="text-sm text-destructive">Save failed: {error}</p>}

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onCancel}>
          Back
        </Button>
        <Button
          className="flex-1"
          onClick={() => void confirm()}
          disabled={saving || effectiveRows.length === 0}
        >
          {saving ? "Saving…" : "Confirm & save"}
        </Button>
      </div>
    </div>
  )
}
