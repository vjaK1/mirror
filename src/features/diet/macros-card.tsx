import { Link } from "react-router"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { round1 } from "./food-math"
import { useActivePhase, useTodayMacros } from "./queries"

const MACROS = [
  { key: "protein", label: "Protein", barClass: "bg-macro-protein" },
  { key: "carbs", label: "Carbs", barClass: "bg-macro-carbs" },
  { key: "fat", label: "Fat", barClass: "bg-macro-fat" },
  { key: "fibre", label: "Fibre", barClass: "bg-macro-fibre" },
] as const

/** After 20:00 local (until the 03:00 day boundary) remaining shortfalls
 * switch the chip to warning styling (BLUEPRINT §3). */
function inWarningWindow(now = new Date()): boolean {
  const h = now.getHours()
  return h >= 20 || h < 3
}

export function MacrosCard() {
  const { data: macros, isLoading: macrosLoading } = useTodayMacros()
  const { data: phase, isLoading: phaseLoading } = useActivePhase()

  const eaten = {
    kcal: macros?.kcal ?? 0,
    protein: macros?.protein_g ?? 0,
    carbs: macros?.carbs_g ?? 0,
    fat: macros?.fat_g ?? 0,
    fibre: macros?.fibre_g ?? 0,
  }

  if (!phase && !phaseLoading) {
    return (
      <Card className="min-h-0 flex-[1.2] shadow-sm">
        <CardHeader>
          <CardDescription>Remaining today</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-center gap-2">
          <p className="text-2xl font-semibold tracking-tight">
            {Math.round(eaten.kcal)} kcal eaten
          </p>
          <p className="text-sm text-muted-foreground">
            <Link to="/diet" className="underline underline-offset-2">
              Start a phase
            </Link>{" "}
            to set targets and see remaining.
          </p>
        </CardContent>
      </Card>
    )
  }

  const targets = {
    kcal: phase?.kcal_target ?? 0,
    protein: phase?.protein_target_g ?? 0,
    carbs: phase?.carbs_target_g ?? 0,
    fat: phase?.fat_target_g ?? 0,
    fibre: phase?.fibre_target_g ?? 0,
  }
  const remainingKcal = Math.round(targets.kcal - eaten.kcal)
  const pct = targets.kcal > 0 ? Math.min(100, (eaten.kcal / targets.kcal) * 100) : 0

  const shortfalls = MACROS.flatMap(({ key, label }) => {
    const left = round1(targets[key] - eaten[key])
    return left > 0 ? [{ label, left }] : []
  })
  const warn = shortfalls.length > 0 && inWarningWindow()
  const loading = macrosLoading || phaseLoading

  return (
    <Card className="min-h-0 flex-[1.2] shadow-sm">
      <CardHeader>
        <CardDescription>Remaining today</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-center gap-3">
        <div>
          <p
            className={cn(
              "text-3xl font-semibold tracking-tight",
              loading && "text-muted-foreground/40",
            )}
          >
            {remainingKcal >= 0
              ? `${remainingKcal.toLocaleString()} kcal`
              : `${Math.abs(remainingKcal).toLocaleString()} kcal over`}
          </p>
          <p className="text-xs text-muted-foreground">
            {Math.round(eaten.kcal).toLocaleString()} eaten of{" "}
            {targets.kcal.toLocaleString()}
          </p>
        </div>

        <Progress value={pct} aria-label="Calories eaten" />

        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {MACROS.map(({ key, label, barClass }) => {
            const target = targets[key]
            const fill = target > 0 ? Math.min(100, (eaten[key] / target) * 100) : 0
            return (
              <div key={key} className="flex flex-col gap-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {Math.round(eaten[key])}/{Math.round(target)}g
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full", barClass)}
                    style={{ width: `${fill}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <p
          className={cn(
            "self-start rounded-full px-2.5 py-1 text-xs",
            shortfalls.length === 0
              ? "bg-muted text-muted-foreground"
              : warn
                ? "bg-warning/15 font-medium text-warning"
                : "bg-muted text-muted-foreground",
          )}
        >
          {shortfalls.length === 0
            ? "All targets met"
            : `To go: ${shortfalls.map((s) => `${s.left}g ${s.label.toLowerCase()}`).join(" · ")}`}
        </p>
      </CardContent>
    </Card>
  )
}
