// The logical day ends at 03:00 Australia/Melbourne (CLAUDE.md rule 2).
// Mirrors the SQL logical_day() helper for client-side range queries.
const TZ = "Australia/Melbourne"

/** Melbourne UTC offset (ms) at a given instant, DST-aware. */
function melbourneOffsetMs(at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    timeZoneName: "longOffset",
  }).formatToParts(at)
  const name = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT+10"
  const m = name.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/)
  if (!m) return 10 * 3600_000
  const sign = m[1] === "-" ? -1 : 1
  return sign * (Number(m[2]) * 3600_000 + Number(m[3] ?? 0) * 60_000)
}

/** 'YYYY-MM-DD' logical day for an instant (defaults to now). */
export function logicalDay(at: Date = new Date()): string {
  const shifted = new Date(at.getTime() + melbourneOffsetMs(at) - 3 * 3600_000)
  return shifted.toISOString().slice(0, 10)
}

/** UTC instant of Melbourne wall time y-m-d h:00, DST-aware (two-pass). */
function melbourneWallToUtc(y: number, m: number, d: number, h: number): Date {
  const wall = Date.UTC(y, m - 1, d, h)
  let utc = wall - 10 * 3600_000
  for (let i = 0; i < 2; i++) {
    utc = wall - melbourneOffsetMs(new Date(utc))
  }
  return new Date(utc)
}

/** UTC [start, end) covering one logical day (03:00 → 03:00 Melbourne). */
export function logicalDayRange(day: string): { start: string; end: string } {
  const [y, m, d] = day.split("-").map(Number)
  const start = melbourneWallToUtc(y, m, d, 3)
  const next = new Date(Date.UTC(y, m - 1, d) + 24 * 3600_000)
  const end = melbourneWallToUtc(
    next.getUTCFullYear(),
    next.getUTCMonth() + 1,
    next.getUTCDate(),
    3,
  )
  return { start: start.toISOString(), end: end.toISOString() }
}
