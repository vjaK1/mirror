import { Link } from "react-router"
import { Eye, EyeOff } from "lucide-react"
import { Amount } from "@/components/amount"
import { usePrivacy } from "@/components/privacy-provider"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { latestBalance } from "@/lib/money-math"
import { useNetWorth } from "./use-net-worth"

/** Home money card (BLUEPRINT §3): net worth hero + weekly delta, then
 * compact VOO and HYSA rows. The eye toggles the GLOBAL privacy blur. */
export function MoneyCard() {
  const { hidden, toggle } = usePrivacy()
  const { inputs, current, delta, vooDayPct, loading } = useNetWorth()

  const hysa = inputs.accounts.find((a) => a.type === "hysa")
  const hysaBalance = hysa ? latestBalance(inputs.balanceEvents, hysa.id) : null
  const latestPrice = inputs.prices.at(-1)
  const latestFx = inputs.fx.at(-1)
  const vooAud =
    inputs.holding && latestPrice && latestFx
      ? (inputs.holding.shares * latestPrice.close_price) / latestFx.rate
      : null

  return (
    <Card className="min-h-0 flex-1 shadow-sm">
      <CardHeader>
        <CardDescription>Net worth</CardDescription>
        <CardAction>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggle}
            aria-label={hidden ? "Show amounts" : "Hide amounts"}
            aria-pressed={!hidden}
          >
            {hidden ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-center gap-2">
        {current != null ? (
          <>
            <div>
              <Amount
                value={current}
                className="text-3xl font-semibold tracking-tight"
              />
              {delta && (
                <p className="text-xs text-muted-foreground">
                  <span
                    className={cn(
                      delta.pct >= 0 ? "text-success" : "text-destructive",
                    )}
                  >
                    {delta.pct >= 0 ? "+" : ""}
                    {delta.pct}%
                  </span>{" "}
                  this week · <Amount value={delta.abs} />
                </p>
              )}
            </div>
            <div className="border-t border-border pt-2 text-sm">
              <div className="flex items-baseline justify-between py-0.5">
                <span className="text-muted-foreground">VOO</span>
                <span className="flex items-baseline gap-2">
                  {vooAud != null ? <Amount value={vooAud} /> : "—"}
                  {vooDayPct != null && (
                    <span
                      className={cn(
                        "text-xs",
                        vooDayPct >= 0 ? "text-success" : "text-destructive",
                      )}
                    >
                      {vooDayPct >= 0 ? "+" : ""}
                      {vooDayPct}%
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-baseline justify-between py-0.5">
                <span className="text-muted-foreground">
                  {hysa?.name ?? "HYSA"}
                </span>
                <span className="flex items-baseline gap-2">
                  {hysaBalance ? <Amount value={hysaBalance.balance} /> : "—"}
                  {hysa?.apy != null && (
                    <span className="text-xs text-muted-foreground">
                      {hysa.apy}% APY
                    </span>
                  )}
                </span>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {loading ? (
              "Loading…"
            ) : (
              <>
                <Link to="/money" className="underline underline-offset-2">
                  Add your accounts
                </Link>{" "}
                to see net worth.
              </>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
