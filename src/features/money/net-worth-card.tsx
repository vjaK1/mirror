import { Eye, EyeOff } from "lucide-react"
import { Amount } from "@/components/amount"
import { usePrivacy } from "@/components/privacy-provider"
import { TrendChart } from "@/components/trend-chart"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useNetWorth } from "./use-net-worth"

export function NetWorthCard() {
  const { hidden, toggle } = usePrivacy()
  const { series, current, delta } = useNetWorth()

  return (
    <Card>
      <CardHeader>
        <CardDescription>Net worth (AUD)</CardDescription>
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
      <CardContent className="flex flex-col gap-2">
        {current != null ? (
          <>
            <div>
              <Amount
                value={current}
                className="text-2xl font-semibold tracking-tight"
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
                  this week
                </p>
              )}
            </div>
            {series.length >= 2 && !hidden && (
              <TrendChart
                line={series}
                formatValue={(v) => `$${Math.round(v).toLocaleString()}`}
                ariaLabel="Net worth over time in Australian dollars"
              />
            )}
            {hidden && series.length >= 2 && (
              <p className="text-xs text-muted-foreground">
                Chart hidden — tap the eye to reveal.
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Add an account balance or your VOO shares below to start tracking.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
