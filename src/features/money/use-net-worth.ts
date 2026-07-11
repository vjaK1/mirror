import { useMemo } from "react"
import {
  dayChangePct,
  netWorthSeries,
  weeklyDelta,
} from "@/lib/money-math"
import type { MoneyInputs } from "@/lib/money-math"
import {
  useAccounts,
  useBalanceEvents,
  useFx,
  useHolding,
  usePrices,
} from "./queries"

export function useNetWorth() {
  const accounts = useAccounts()
  const events = useBalanceEvents()
  const holding = useHolding()
  const prices = usePrices()
  const fx = useFx()

  const inputs: MoneyInputs = useMemo(
    () => ({
      accounts: accounts.data ?? [],
      balanceEvents: events.data ?? [],
      holding: holding.data ?? null,
      prices: prices.data ?? [],
      fx: fx.data ?? [],
    }),
    [accounts.data, events.data, holding.data, prices.data, fx.data],
  )

  const series = useMemo(() => netWorthSeries(inputs), [inputs])

  return {
    inputs,
    series,
    current: series.at(-1)?.v ?? null,
    delta: useMemo(() => weeklyDelta(series), [series]),
    vooDayPct: useMemo(() => dayChangePct(inputs.prices), [inputs.prices]),
    loading:
      accounts.isLoading ||
      events.isLoading ||
      holding.isLoading ||
      prices.isLoading ||
      fx.isLoading,
  }
}
