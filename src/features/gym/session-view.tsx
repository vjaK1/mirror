import { useMemo, useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { getLastSetForExercise } from "@/lib/data"
import type { SessionType, SetWithExercise } from "@/lib/data"
import type { ExerciseRow, SetRow, WorkoutSessionRow } from "@/lib/database.types"
import { ExercisePicker } from "./exercise-picker"
import {
  useDeleteSession,
  useDeleteSet,
  useInsertSet,
  useLastSessionOfType,
  useSessionSets,
  useUpdateSet,
} from "./queries"

const timeFormat = new Intl.DateTimeFormat("en-AU", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Australia/Melbourne",
})

const dateFormat = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "short",
  timeZone: "Australia/Melbourne",
})

type Group = {
  exerciseId: string
  name: string
  sets: SetWithExercise[]
}

function groupByExercise(sets: SetWithExercise[]): Group[] {
  const groups = new Map<string, Group>()
  for (const set of sets) {
    const g = groups.get(set.exercise_id)
    if (g) g.sets.push(set)
    else
      groups.set(set.exercise_id, {
        exerciseId: set.exercise_id,
        name: set.exercises?.name ?? "Exercise",
        sets: [set],
      })
  }
  return [...groups.values()]
}

/** One editable set line; edits commit on blur (sets are editable during a
 * live session per BLUEPRINT §3). */
function SetEditor({ set }: { set: SetRow }) {
  const updateSet = useUpdateSet()
  const deleteSet = useDeleteSet()
  const [weight, setWeight] = useState(set.weight_kg?.toString() ?? "")
  const [reps, setReps] = useState(set.reps.toString())

  function commit() {
    const w = weight === "" ? null : Number(weight)
    const r = Number(reps)
    if ((w !== set.weight_kg || r !== set.reps) && r > 0) {
      updateSet.mutate({ id: set.id, patch: { weight_kg: w, reps: r } })
    }
  }

  return (
    <li className="flex items-center gap-2 py-1">
      <span className="w-6 shrink-0 text-xs text-muted-foreground">
        #{set.set_number}
      </span>
      <Input
        type="number"
        inputMode="decimal"
        step="0.5"
        className="h-8 w-20 text-right"
        value={weight}
        placeholder="BW"
        onChange={(e) => setWeight(e.target.value)}
        onBlur={commit}
        aria-label="Weight in kg"
      />
      <span className="text-xs text-muted-foreground">kg ×</span>
      <Input
        type="number"
        inputMode="numeric"
        className="h-8 w-14 text-right"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        onBlur={commit}
        aria-label="Reps"
      />
      <Button
        variant="ghost"
        size="icon-sm"
        className="ml-auto"
        aria-label="Delete set"
        onClick={() => deleteSet.mutate(set.id)}
      >
        <Trash2 aria-hidden="true" />
      </Button>
    </li>
  )
}

export function SessionView({ session }: { session: WorkoutSessionRow }) {
  const { data: sets } = useSessionSets(session.id)
  const { data: last } = useLastSessionOfType(
    session.session_type as SessionType,
    session.id,
  )
  const insertSet = useInsertSet()
  const deleteSession = useDeleteSession()
  const [pickerOpen, setPickerOpen] = useState(false)

  const groups = useMemo(() => groupByExercise(sets ?? []), [sets])

  // Exercises from the last session of this type not yet logged today.
  const plan = useMemo(() => {
    const logged = new Set((sets ?? []).map((s) => s.exercise_id))
    return groupByExercise(last?.sets ?? []).filter((g) => !logged.has(g.exerciseId))
  }, [last, sets])

  function nextSetNumber(exerciseId: string): number {
    return (sets ?? []).filter((s) => s.exercise_id === exerciseId).length + 1
  }

  function addSet(exerciseId: string) {
    const existing = (sets ?? []).filter((s) => s.exercise_id === exerciseId)
    const lastSet = existing.at(-1)
    insertSet.mutate({
      session_id: session.id,
      exercise_id: exerciseId,
      set_number: existing.length + 1,
      reps: lastSet?.reps ?? 8,
      weight_kg: lastSet?.weight_kg ?? null,
    })
  }

  async function addExercise(exercise: ExerciseRow) {
    const lastEver = await getLastSetForExercise(exercise.id)
    insertSet.mutate({
      session_id: session.id,
      exercise_id: exercise.id,
      set_number: nextSetNumber(exercise.id),
      reps: lastEver?.reps ?? 8,
      weight_kg: lastEver?.weight_kg ?? null,
    })
  }

  function logPlanned(group: Group, set: SetWithExercise) {
    insertSet.mutate({
      session_id: session.id,
      exercise_id: group.exerciseId,
      set_number: nextSetNumber(group.exerciseId),
      reps: set.reps,
      weight_kg: set.weight_kg,
    })
  }

  function logAllPlanned(group: Group) {
    let n = nextSetNumber(group.exerciseId)
    for (const set of group.sets) {
      insertSet.mutate({
        session_id: session.id,
        exercise_id: group.exerciseId,
        set_number: n++,
        reps: set.reps,
        weight_kg: set.weight_kg,
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="capitalize">{session.session_type} session</CardTitle>
        <CardDescription className="flex items-center justify-between">
          <span>Started {timeFormat.format(new Date(session.started_at))}</span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Delete session"
            onClick={() => deleteSession.mutate(session.id)}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {groups.map((group) => (
          <div key={group.exerciseId}>
            <p className="text-sm font-medium">{group.name}</p>
            <ul className="mt-1 flex flex-col">
              {group.sets.map((set) => (
                <SetEditor key={set.id} set={set} />
              ))}
            </ul>
            <Button
              variant="ghost"
              size="xs"
              className="mt-1 text-muted-foreground"
              onClick={() => addSet(group.exerciseId)}
            >
              <Plus aria-hidden="true" /> Add set
            </Button>
          </div>
        ))}

        {groups.length === 0 && plan.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Empty session — add an exercise to start logging.
          </p>
        )}

        {plan.length > 0 && (
          <div className="rounded-lg border border-dashed border-border p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Last {session.session_type} ·{" "}
              {last ? dateFormat.format(new Date(last.session.started_at)) : ""} — tap
              to log the same
            </p>
            <div className="flex flex-col gap-3">
              {plan.map((group) => (
                <div key={group.exerciseId}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm">{group.name}</p>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => logAllPlanned(group)}
                    >
                      Log all
                    </Button>
                  </div>
                  <ul className="mt-1 flex flex-wrap gap-1.5">
                    {group.sets.map((set) => (
                      <li key={set.id}>
                        <Button
                          variant="secondary"
                          size="xs"
                          className="rounded-full"
                          onClick={() => logPlanned(group, set)}
                        >
                          {set.weight_kg ?? "BW"}
                          {set.weight_kg ? "kg" : ""} × {set.reps}
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => setPickerOpen(true)}
        >
          <Plus aria-hidden="true" /> Add exercise
        </Button>
      </CardContent>

      <ExercisePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(exercise) => void addExercise(exercise)}
      />
    </Card>
  )
}
