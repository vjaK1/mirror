import { useMemo, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { WorkoutSessionRow } from "@/lib/database.types"
import { logicalDay } from "@/lib/logical-day"
import { cn } from "@/lib/utils"
import { useSessionsSince } from "./queries"

const WEEKS = 20
const CELL = 10
const GAP = 2
const STEP = CELL + GAP
const GUTTER_L = 16
const GUTTER_T = 12
const W = GUTTER_L + WEEKS * STEP - GAP
const H = GUTTER_T + 7 * STEP - GAP

const readoutFormat = new Intl.DateTimeFormat("en-AU", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "Australia/Melbourne",
})

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

function toUtcDate(day: string): Date {
  return new Date(`${day}T00:00:00Z`)
}

function addDays(day: string, n: number): string {
  const d = toUtcDate(day)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** GitHub-contributions-style training grid: one cell per logical day,
 * green when you trained. Binary-plus encoding (1 vs 2+ sessions) using the
 * success status token — the point is "did I show up", not magnitude. */
export function ActivityCard() {
  const { data: sessions } = useSessionsSince(WEEKS * 7)
  const [active, setActive] = useState<string | null>(null)

  const today = logicalDay()

  const { byDay, gridStart } = useMemo(() => {
    const byDay = new Map<string, WorkoutSessionRow[]>()
    for (const session of sessions ?? []) {
      const day = logicalDay(new Date(session.started_at))
      const list = byDay.get(day) ?? []
      list.push(session)
      byDay.set(day, list)
    }
    const todayDow = (toUtcDate(today).getUTCDay() + 6) % 7 // Mon = 0
    const currentMonday = addDays(today, -todayDow)
    const gridStart = addDays(currentMonday, -(WEEKS - 1) * 7)
    return { byDay, gridStart }
  }, [sessions, today])

  const trainedDays = [...byDay.keys()].filter((d) => d >= gridStart).length
  const activeSessions = active ? byDay.get(active) : undefined

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity</CardTitle>
        <CardDescription>
          {trainedDays} training day{trainedDays === 1 ? "" : "s"} in the last{" "}
          {WEEKS} weeks
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <p className="h-4 text-xs text-muted-foreground">
          {active
            ? `${readoutFormat.format(toUtcDate(active))} · ${
                activeSessions
                  ? activeSessions.map((s) => s.session_type).join(" + ")
                  : "rest"
              }`
            : " "}
        </p>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full touch-none select-none"
          role="img"
          aria-label="Training activity grid, one cell per day, green when trained"
        >
          {["M", "W", "F"].map((label, i) => (
            <text
              key={label}
              x={0}
              y={GUTTER_T + (i * 2 + 0) * STEP + CELL - 2}
              className="fill-muted-foreground text-[7px]"
            >
              {label}
            </text>
          ))}
          {Array.from({ length: WEEKS }, (_, w) => {
            const monday = addDays(gridStart, w * 7)
            const prevMonday = addDays(gridStart, (w - 1) * 7)
            const month = toUtcDate(monday).getUTCMonth()
            const newMonth =
              w === 0 || month !== toUtcDate(prevMonday).getUTCMonth()
            return (
              <g key={monday}>
                {newMonth && w < WEEKS - 1 && (
                  <text
                    x={GUTTER_L + w * STEP}
                    y={8}
                    className="fill-muted-foreground text-[7px]"
                  >
                    {MONTHS[month]}
                  </text>
                )}
                {Array.from({ length: 7 }, (_, d) => {
                  const day = addDays(monday, d)
                  if (day > today) return null
                  const count = byDay.get(day)?.length ?? 0
                  const isToday = day === today
                  return (
                    <rect
                      key={day}
                      x={GUTTER_L + w * STEP}
                      y={GUTTER_T + d * STEP}
                      width={CELL}
                      height={CELL}
                      rx={2}
                      className={cn(
                        count >= 2
                          ? "fill-success"
                          : count === 1
                            ? "fill-success/70"
                            : "fill-muted",
                        isToday && count === 0 && "stroke-ring",
                        active === day && "stroke-foreground",
                      )}
                      strokeWidth={isToday || active === day ? 1.5 : 0}
                      onPointerDown={() => setActive(day)}
                      onPointerEnter={(e) => {
                        if (e.pointerType === "mouse") setActive(day)
                      }}
                    />
                  )
                })}
              </g>
            )
          })}
        </svg>
      </CardContent>
    </Card>
  )
}
