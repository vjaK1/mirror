import { useMemo } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { logicalDay } from "@/lib/logical-day"
import { currentWeekKey, weekKey } from "./gym-math"
import { useProfile, useRecentSessions, useSetWeeklyTarget } from "./queries"

export function AdherenceCard() {
  const { data: sessions } = useRecentSessions()
  const { data: profile } = useProfile()
  const setTarget = useSetWeeklyTarget()

  const target = profile?.weekly_session_target ?? 6
  const thisWeek = useMemo(() => {
    const week = currentWeekKey()
    return (sessions ?? []).filter(
      (s) => weekKey(logicalDay(new Date(s.started_at))) === week,
    )
  }, [sessions])

  const byType = useMemo(() => {
    const counts = new Map<string, number>()
    for (const s of thisWeek) {
      counts.set(s.session_type, (counts.get(s.session_type) ?? 0) + 1)
    }
    return [...counts.entries()]
  }, [thisWeek])

  return (
    <Card>
      <CardHeader>
        <CardTitle>This week</CardTitle>
        <CardDescription>
          {thisWeek.length} of {target} sessions
          {byType.length > 0 &&
            ` — ${byType.map(([t, n]) => `${t} ×${n}`).join(", ")}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Weekly target</span>
        <Input
          type="number"
          inputMode="numeric"
          min={1}
          max={14}
          className="h-8 w-16"
          defaultValue={target}
          key={target}
          onBlur={(e) => {
            const value = Number(e.target.value)
            if (value >= 1 && value <= 14 && value !== target) {
              setTarget.mutate(value)
            }
          }}
          aria-label="Weekly session target"
        />
      </CardContent>
    </Card>
  )
}
