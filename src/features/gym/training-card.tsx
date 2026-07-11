import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import type { SessionType } from "@/lib/data"
import { logicalDay } from "@/lib/logical-day"
import { currentWeekKey, nextSessionType, weekKey } from "./gym-math"
import { useProfile, useRecentSessions } from "./queries"

/** Home training card: next session type + weekly adherence (BLUEPRINT §3). */
export function TrainingCard() {
  const { data: sessions } = useRecentSessions()
  const { data: profile } = useProfile()

  const target = profile?.weekly_session_target ?? 6
  const thisWeek = useMemo(() => {
    const week = currentWeekKey()
    return (sessions ?? []).filter(
      (s) => weekKey(logicalDay(new Date(s.started_at))) === week,
    ).length
  }, [sessions])
  const next = nextSessionType(sessions?.[0]?.session_type as SessionType | undefined)

  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>Training</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-lg font-semibold capitalize tracking-tight">{next}</p>
        <p className="text-[11px] text-muted-foreground">
          next · {thisWeek} of {target} this week
        </p>
      </CardContent>
    </Card>
  )
}
