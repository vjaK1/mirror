import { Link } from "react-router"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { MacrosCard } from "@/features/diet/macros-card"
import { useWeighIns } from "@/features/diet/queries"
import { trailingAverage } from "@/features/diet/weigh-in-card"
import { TrainingCard } from "@/features/gym/training-card"
import { MoneyCard } from "@/features/money/money-card"

function formatToday() {
  return new Intl.DateTimeFormat("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date())
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
          <p className="text-xs text-muted-foreground">Day — of cut · — days to Oct 1</p>
        </div>
        <Link
          to="/settings"
          aria-label="Settings"
          className="flex size-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground"
        >
          V
        </Link>
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

/** 7-day trailing average is the headline (CLAUDE.md rule 11); the goal-pace
 * projection arrives with goals in Session 6. */
function WeightCard() {
  const { data: weighIns } = useWeighIns(30)
  const avg = trailingAverage(
    (weighIns ?? []).map((w) => ({
      t: new Date(w.measured_at).getTime(),
      kg: w.weight_kg,
    })),
  ).at(-1)?.kg

  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>Weight</CardDescription>
      </CardHeader>
      <CardContent>
        {avg ? (
          <>
            <p className="text-lg font-semibold tracking-tight">{avg.toFixed(1)} kg</p>
            <p className="text-[11px] text-muted-foreground">7-day avg</p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No weigh-ins yet</p>
        )}
      </CardContent>
    </Card>
  )
}
