import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { ExerciseRow } from "@/lib/database.types"
import { useCreateExercise, useExercises } from "./queries"

export function ExercisePicker({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (exercise: ExerciseRow) => void
}) {
  const [term, setTerm] = useState("")
  const { data: exercises } = useExercises()
  const createExercise = useCreateExercise()

  const filtered = useMemo(() => {
    const t = term.trim().toLowerCase()
    const list = exercises ?? []
    if (!t) return list
    return list.filter((e) => e.name.toLowerCase().includes(t))
  }, [exercises, term])

  const exactExists = filtered.some(
    (e) => e.name.toLowerCase() === term.trim().toLowerCase(),
  )

  function pick(exercise: ExerciseRow) {
    onSelect(exercise)
    onOpenChange(false)
    setTerm("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add exercise</DialogTitle>
          <DialogDescription>Pick from the list or create your own.</DialogDescription>
        </DialogHeader>
        <Input
          placeholder="Search exercises…"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          autoFocus
          autoComplete="off"
        />
        <ul className="flex max-h-64 flex-col divide-y divide-border overflow-y-auto">
          {filtered.map((exercise) => (
            <li key={exercise.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 py-2 text-left hover:bg-muted/50"
                onClick={() => pick(exercise)}
              >
                <span className="text-sm">{exercise.name}</span>
                <span className="text-xs text-muted-foreground">
                  {exercise.muscle_group}
                </span>
              </button>
            </li>
          ))}
          {term.trim().length >= 3 && !exactExists && (
            <li className="py-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                disabled={createExercise.isPending}
                onClick={() =>
                  createExercise.mutate(term.trim(), { onSuccess: pick })
                }
              >
                {createExercise.isPending ? "Creating…" : `Create "${term.trim()}"`}
              </Button>
            </li>
          )}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
