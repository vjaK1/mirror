import { Link } from "react-router"
import { NotebookPen } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { logicalDay } from "@/lib/logical-day"
import { MacrosCard } from "@/features/diet/macros-card"
import { useActivePhase, useWeighIns } from "@/features/diet/queries"
import { trailingAverage } from "@/features/diet/weigh-in-card"
import { TrainingCard } from "@/features/gym/training-card"
import { useGoal } from "@/features/goals/queries"
import { daysUntil, projectWeight } from "@/features/goals/projection"
import { MoneyCard } from "@/features/money/money-card"

function formatToday() {
  return new Intl.DateTimeFormat("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date())
}

const goalDateFormat = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "short",
  timeZone: "Australia/Melbourne",
})

function daysSince(dateStr: string): number {
  const start = new Date(`${dateStr}T00:00:00Z`).getTime()
  const today = new Date(`${logicalDay()}T00:00:00Z`).getTime()
  return Math.round((today - start) / 86400_000)
}

/** "Day N of cut · X days to 1 Oct" (BLUEPRINT §3 header, no greeting). */
function HeaderSubline() {
  const { data: phase } = useActivePhase()
  const { data: goal } = useGoal()

  const parts: string[] = []
  if (phase) parts.push(`Day ${daysSince(phase.start_date) + 1} of ${phase.phase}`)
  if (goal) {
    const days = daysUntil(goal.target_date)
    parts.push(
      days >= 0
        ? `${days} day${days === 1 ? "" : "s"} to ${goalDateFormat.format(new Date(`${goal.target_date}T00:00:00Z`))}`
        : `goal date passed`,
    )
  }
  return (
    <p className="text-xs text-muted-foreground">
      {parts.length > 0 ? parts.join(" · ") : "Set your goal in Settings"}
    </p>
  )
}

/** Home never scrolls; layout and order are fixed (CLAUDE.md rule 10,
 * BLUEPRINT §3): header → money card → macros card → training/weight row.
 * All values are placeholders until their modules land. */
export function HomeScreen() {
  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden p-4">
      <header className="flex shrink-0 items-center justify-between">
        <div>
          <h1 className="font-heading text-base font-semibold">{formatToday()}</h1>
          <HeaderSubline />
        </div>
        <div className="flex items-center gap-1">
          <Link
            to="/notes"
            aria-label="Notes"
            className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <NotebookPen className="size-5" aria-hidden="true" />
          </Link>
          <Link
            to="/settings"
            aria-label="Settings"
            className="flex size-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground"
          >
            V
          </Link>
        </div>
      </header>

      <MoneyCard />

      <MacrosCard />

      <div className="grid shrink-0 grid-cols-2 gap-3">
        <TrainingCard />
        <WeightCard />
      </div>
    </div>
  )
}

/** 7-day trailing average is the headline (CLAUDE.md rule 11); the pace line
 * projects it to the goal date on the recent weigh-in slope. */
function WeightCard() {
  const { data: weighIns } = useWeighIns(30)
  const { data: goal } = useGoal()
  const points = (weighIns ?? []).map((w) => ({
    t: new Date(w.measured_at).getTime(),
    kg: w.weight_kg,
  }))
  const avg = trailingAverage(points).at(-1)?.kg
  const projected =
    goal && avg != null ? projectWeight(points, avg, goal.target_date) : null

  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>Weight</CardDescription>
      </CardHeader>
      <CardContent>
        {avg ? (
          <>
            <p className="text-lg font-semibold tracking-tight">{avg.toFixed(1)} kg</p>
            <p className="text-[11px] text-muted-foreground">
              7-day avg
              {projected != null && goal && (
                <>
                  {" · "}
                  <span
                    className={cn(
                      projected <= goal.target_value
                        ? "text-success"
                        : "text-warning",
                    )}
                  >
                    on pace for {projected.toFixed(1)} by{" "}
                    {goalDateFormat.format(new Date(`${goal.target_date}T00:00:00Z`))}
                  </span>
                </>
              )}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No weigh-ins yet</p>
        )}
      </CardContent>
    </Card>
  )
}
