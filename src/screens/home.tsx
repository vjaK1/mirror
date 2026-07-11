import { Link } from "react-router"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

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

      <Card className="min-h-0 flex-1 shadow-sm">
        <CardHeader>
          <CardDescription>Net worth</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-center gap-1">
          <p className="text-3xl font-semibold tracking-tight text-muted-foreground/40">
            $——
          </p>
          <p className="text-xs text-muted-foreground">Wired in Session 4</p>
        </CardContent>
      </Card>

      <Card className="min-h-0 flex-[1.2] shadow-sm">
        <CardHeader>
          <CardDescription>Remaining today</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-center gap-3">
          <p className="text-3xl font-semibold tracking-tight text-muted-foreground/40">
            —— kcal
          </p>
          <div className="grid grid-cols-4 gap-2">
            <MacroBar label="Protein" barClass="bg-macro-protein" />
            <MacroBar label="Carbs" barClass="bg-macro-carbs" />
            <MacroBar label="Fat" barClass="bg-macro-fat" />
            <MacroBar label="Fibre" barClass="bg-macro-fibre" />
          </div>
          <p className="text-xs text-muted-foreground">Wired in Session 2</p>
        </CardContent>
      </Card>

      <div className="grid shrink-0 grid-cols-2 gap-3">
        <Card size="sm">
          <CardHeader>
            <CardDescription>Training</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Session 3</CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Weight</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Session 2</CardContent>
        </Card>
      </div>
    </div>
  )
}

function MacroBar({ label, barClass }: { label: string; barClass: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full w-1/3 rounded-full", barClass)} />
      </div>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  )
}
