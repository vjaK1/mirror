import { useState } from "react"
import { Amount } from "@/components/amount"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { dayChangePct } from "@/lib/money-math"
import { useFx, useHolding, usePrices, useUpsertHolding } from "./queries"

export function HoldingsCard() {
  const { data: holding } = useHolding()
  const { data: prices } = usePrices()
  const { data: fx } = useFx()
  const upsert = useUpsertHolding()
  const [shares, setShares] = useState<string | null>(null)

  const latestPrice = prices?.at(-1)
  const latestFx = fx?.at(-1)
  const dayPct = dayChangePct(prices ?? [])
  const sharesValue = shares ?? holding?.shares.toString() ?? ""

  const valueUsd =
    holding && latestPrice ? holding.shares * latestPrice.close_price : null
  const valueAud = valueUsd != null && latestFx ? valueUsd / latestFx.rate : null

  function save() {
    const n = Number(sharesValue)
    if (!Number.isFinite(n) || n < 0) return
    upsert.mutate({ symbol: "VOO", shares: n }, { onSuccess: () => setShares(null) })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>VOO</CardTitle>
        <CardDescription>
          {latestPrice
            ? `Close ${latestPrice.close_price} USD · ${latestPrice.date}`
            : "Waiting for the first price snapshot."}
          {dayPct != null && (
            <span
              className={cn(
                "ml-1",
                dayPct >= 0 ? "text-success" : "text-destructive",
              )}
            >
              {dayPct >= 0 ? "+" : ""}
              {dayPct}%
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {valueAud != null && (
          <div>
            <Amount value={valueAud} className="text-2xl font-semibold tracking-tight" />
            <p className="text-xs text-muted-foreground">
              <Amount value={valueUsd!} currency="USD" /> at {latestFx?.rate} AUD/USD
            </p>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="decimal"
            step="0.0001"
            min={0}
            placeholder="Shares held"
            value={sharesValue}
            onChange={(e) => setShares(e.target.value)}
            aria-label="VOO shares held"
          />
          <Button onClick={save} disabled={upsert.isPending || sharesValue === ""}>
            {upsert.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
