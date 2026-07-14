// Client-side weight projection: 7-day average carried forward on the
// least-squares slope of recent weigh-ins — the same math the read-only
// get_weight_trend() SQL tool uses, so Home and ask-AI agree.

export function slopeKgPerDay(points: { t: number; kg: number }[]): number | null {
  if (points.length < 3) return null
  const xs = points.map((p) => p.t / 86400_000)
  const ys = points.map((p) => p.kg)
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length
  const my = ys.reduce((a, b) => a + b, 0) / ys.length
  let num = 0
  let den = 0
  for (let i = 0; i < xs.length; i++) {
    num += (xs[i] - mx) * (ys[i] - my)
    den += (xs[i] - mx) ** 2
  }
  if (den === 0) return null
  return num / den
}

export function daysUntil(dateStr: string): number {
  const target = new Date(`${dateStr}T00:00:00Z`).getTime()
  return Math.round((target - Date.now()) / 86400_000)
}

export function projectWeight(
  points: { t: number; kg: number }[],
  currentAvg7: number,
  targetDate: string,
): number | null {
  const slope = slopeKgPerDay(points)
  if (slope == null) return null
  const days = daysUntil(targetDate)
  if (days <= 0) return currentAvg7
  return Math.round((currentAvg7 + slope * days) * 10) / 10
}
