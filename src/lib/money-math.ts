// Net worth in AUD derived from append-only events + daily snapshots
// (CLAUDE.md rules 3 and 7). All conversion goes through the FX snapshot —
// USD values are never mixed into AUD sums directly.
import type {
  AccountRow,
  BalanceEventRow,
  FxSnapshotRow,
  HoldingRow,
  PriceSnapshotRow,
} from "./database.types"

export type MoneyInputs = {
  accounts: AccountRow[]
  balanceEvents: BalanceEventRow[] // oldest first
  holding: HoldingRow | null
  prices: PriceSnapshotRow[] // oldest first
  fx: FxSnapshotRow[] // oldest first
}

export type NetWorthPoint = { t: number; v: number }

function atOrBefore<T extends { date: string }>(rows: T[], day: string): T | null {
  let found: T | null = null
  for (const row of rows) {
    if (row.date <= day) found = row
    else break
  }
  return found
}

/** USD → AUD via the AUDUSD rate (USD per 1 AUD). */
function usdToAud(usd: number, rate: number): number {
  return rate > 0 ? usd / rate : 0
}

export function netWorthOn(inputs: MoneyInputs, day: string): number | null {
  const dayEnd = `${day}T23:59:59Z`
  const fxRow = atOrBefore(inputs.fx, day)

  let total = 0
  let hasData = false

  for (const account of inputs.accounts) {
    let latest: BalanceEventRow | null = null
    for (const event of inputs.balanceEvents) {
      if (event.account_id !== account.id) continue
      if (event.recorded_at <= dayEnd) latest = event
      else break
    }
    if (!latest) continue
    hasData = true
    if (account.currency === "AUD") total += latest.balance
    else if (account.currency === "USD" && fxRow)
      total += usdToAud(latest.balance, fxRow.rate)
  }

  if (inputs.holding && inputs.holding.shares > 0) {
    const price = atOrBefore(inputs.prices, day)
    if (price && fxRow) {
      hasData = true
      total += usdToAud(inputs.holding.shares * price.close_price, fxRow.rate)
    }
  }

  return hasData ? Math.round(total * 100) / 100 : null
}

export function netWorthSeries(inputs: MoneyInputs, days = 60): NetWorthPoint[] {
  const points: NetWorthPoint[] = []
  const today = new Date()
  for (let i = days; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400_000)
    const day = d.toISOString().slice(0, 10)
    const v = netWorthOn(inputs, day)
    if (v != null) points.push({ t: d.getTime(), v })
  }
  return points
}

export function weeklyDelta(
  series: NetWorthPoint[],
): { abs: number; pct: number } | null {
  if (series.length < 2) return null
  const now = series.at(-1)!
  const weekAgoT = now.t - 7 * 86400_000
  let base = series[0]
  for (const p of series) {
    if (p.t <= weekAgoT) base = p
    else break
  }
  if (base.t === now.t || base.v === 0) return null
  const abs = Math.round((now.v - base.v) * 100) / 100
  return { abs, pct: Math.round((abs / base.v) * 1000) / 10 }
}

/** Day-over-day % of the latest two price snapshots. */
export function dayChangePct(prices: PriceSnapshotRow[]): number | null {
  if (prices.length < 2) return null
  const last = prices.at(-1)!.close_price
  const prev = prices.at(-2)!.close_price
  if (prev <= 0) return null
  return Math.round(((last - prev) / prev) * 1000) / 10
}

export function latestBalance(
  events: BalanceEventRow[],
  accountId: string,
): BalanceEventRow | null {
  let found: BalanceEventRow | null = null
  for (const event of events) {
    if (event.account_id === accountId) found = event
  }
  return found
}

export function projectedMonthlyInterest(balance: number, apy: number): number {
  return Math.round(((balance * apy) / 100 / 12) * 100) / 100
}
