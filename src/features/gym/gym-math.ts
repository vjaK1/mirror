import type { SessionType } from "@/lib/data"
import { logicalDay } from "@/lib/logical-day"

const ROTATION: Record<SessionType, SessionType> = {
  push: "pull",
  pull: "legs",
  legs: "push",
  other: "push",
}

export function nextSessionType(last: SessionType | undefined): SessionType {
  return last ? ROTATION[last] : "push"
}

/** Monday-start week key (YYYY-MM-DD of Monday) for a logical day string. */
export function weekKey(day: string): string {
  const d = new Date(`${day}T00:00:00Z`)
  const dow = (d.getUTCDay() + 6) % 7 // Mon = 0
  d.setUTCDate(d.getUTCDate() - dow)
  return d.toISOString().slice(0, 10)
}

export function currentWeekKey(): string {
  return weekKey(logicalDay())
}
