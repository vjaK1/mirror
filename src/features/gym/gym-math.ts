import type { SessionType } from "@/lib/data"
import type { SetWithSession } from "@/lib/data"
import { logicalDay } from "@/lib/logical-day"

/** Epley estimated 1RM; a 1-rep set is its own max. */
export function epley1Rm(weightKg: number, reps: number): number {
  const e = reps <= 1 ? weightKg : weightKg * (1 + reps / 30)
  return Math.round(e * 10) / 10
}

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

export type ProgressionPoint = {
  t: number
  v: number
  detail: string
}

/** Top set per session by estimated 1RM. */
export function progressionSeries(sets: SetWithSession[]): ProgressionPoint[] {
  const bySession = new Map<string, { t: number; best: SetWithSession }>()
  for (const set of sets) {
    if (set.weight_kg == null || !set.workout_sessions) continue
    const t = new Date(set.workout_sessions.started_at).getTime()
    const current = bySession.get(set.session_id)
    if (
      !current ||
      epley1Rm(set.weight_kg, set.reps) >
        epley1Rm(current.best.weight_kg ?? 0, current.best.reps)
    ) {
      bySession.set(set.session_id, { t, best: set })
    }
  }
  return [...bySession.values()]
    .sort((a, b) => a.t - b.t)
    .map(({ t, best }) => ({
      t,
      v: epley1Rm(best.weight_kg ?? 0, best.reps),
      detail: `${best.weight_kg} kg × ${best.reps}`,
    }))
}
