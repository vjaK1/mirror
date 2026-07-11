import { useEffect, useState } from "react"
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { PhaseTargets } from "@/lib/data"
import { useActivePhase, useStartPhase, useUpdateTargets } from "./queries"

type PhaseName = PhaseTargets["phase"]

const DEFAULTS: Record<PhaseName, Omit<PhaseTargets, "phase">> = {
  cut: { kcal_target: 2000, protein_target_g: 170, carbs_target_g: 180, fat_target_g: 55, fibre_target_g: 30 },
  maintain: { kcal_target: 2500, protein_target_g: 160, carbs_target_g: 280, fat_target_g: 75, fibre_target_g: 32 },
  bulk: { kcal_target: 2900, protein_target_g: 180, carbs_target_g: 350, fat_target_g: 85, fibre_target_g: 35 },
}

const FIELDS = [
  { key: "kcal_target", label: "kcal" },
  { key: "protein_target_g", label: "Protein g" },
  { key: "carbs_target_g", label: "Carbs g" },
  { key: "fat_target_g", label: "Fat g" },
  { key: "fibre_target_g", label: "Fibre g" },
] as const

export function PhaseCard() {
  const { data: active, isLoading } = useActivePhase()
  const startPhase = useStartPhase()
  const updateTargets = useUpdateTargets()

  const [phase, setPhase] = useState<PhaseName>("cut")
  const [targets, setTargets] = useState(DEFAULTS.cut)

  useEffect(() => {
    if (active) {
      setPhase(active.phase as PhaseName)
      setTargets({
        kcal_target: active.kcal_target,
        protein_target_g: active.protein_target_g,
        carbs_target_g: active.carbs_target_g,
        fat_target_g: active.fat_target_g,
        fibre_target_g: active.fibre_target_g,
      })
    }
  }, [active])

  const samePhase = active?.phase === phase
  const pending = startPhase.isPending || updateTargets.isPending

  function save() {
    if (active && samePhase) {
      updateTargets.mutate({ id: active.id, targets })
    } else {
      startPhase.mutate({ phase, ...targets })
    }
  }

  if (isLoading) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Phase & targets</CardTitle>
        <CardDescription>
          {active
            ? `${active.phase} since ${active.start_date}`
            : "No active phase — targets power the Home card."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <ToggleGroup
          type="single"
          variant="outline"
          className="w-full"
          value={phase}
          onValueChange={(v) => {
            if (!v) return
            const next = v as PhaseName
            setPhase(next)
            if (active?.phase !== next) setTargets(DEFAULTS[next])
            else if (active)
              setTargets({
                kcal_target: active.kcal_target,
                protein_target_g: active.protein_target_g,
                carbs_target_g: active.carbs_target_g,
                fat_target_g: active.fat_target_g,
                fibre_target_g: active.fibre_target_g,
              })
          }}
        >
          {(["cut", "maintain", "bulk"] as const).map((p) => (
            <ToggleGroupItem key={p} value={p} className="flex-1 capitalize">
              {p}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {FIELDS.map(({ key, label }) => (
            <div key={key} className="flex flex-col gap-1">
              <Label htmlFor={key} className="text-xs text-muted-foreground">
                {label}
              </Label>
              <Input
                id={key}
                type="number"
                inputMode="numeric"
                value={targets[key]}
                onChange={(e) =>
                  setTargets((t) => ({ ...t, [key]: Number(e.target.value) }))
                }
              />
            </div>
          ))}
        </div>

        {(startPhase.isError || updateTargets.isError) && (
          <p className="text-sm text-destructive">
            Save failed:{" "}
            {((startPhase.error ?? updateTargets.error) as Error).message}
          </p>
        )}

        <Button onClick={save} disabled={pending} className="self-start">
          {pending
            ? "Saving…"
            : active && samePhase
              ? "Update targets"
              : `Start ${phase} phase`}
        </Button>
      </CardContent>
    </Card>
  )
}
