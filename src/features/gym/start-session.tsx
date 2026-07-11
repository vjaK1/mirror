import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { SessionType } from "@/lib/data"
import { nextSessionType } from "./gym-math"
import { useRecentSessions, useStartSession } from "./queries"

const TYPES: SessionType[] = ["push", "pull", "legs", "other"]

export function StartSession() {
  const { data: sessions } = useRecentSessions()
  const startSession = useStartSession()
  const suggested = nextSessionType(sessions?.[0]?.session_type as SessionType | undefined)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Start session</CardTitle>
        <CardDescription>
          Next in rotation: <span className="capitalize">{suggested}</span>. Starting
          prefills your last {suggested} session.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {TYPES.map((type) => (
          <Button
            key={type}
            variant={type === suggested ? "default" : "outline"}
            className="flex-1 capitalize"
            disabled={startSession.isPending}
            onClick={() => startSession.mutate(type)}
          >
            {type}
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
