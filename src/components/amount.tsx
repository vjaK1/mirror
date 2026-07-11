import { usePrivacy } from "@/components/privacy-provider"
import { cn } from "@/lib/utils"

const formatters = new Map<string, Intl.NumberFormat>()

export function formatCurrency(value: number, currency = "AUD"): string {
  let f = formatters.get(currency)
  if (!f) {
    f = new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    })
    formatters.set(currency, f)
  }
  return f.format(value)
}

/** A money amount respecting the global privacy blur (CLAUDE.md rule 9).
 * Percentages and relative changes stay visible — this is only for absolutes. */
export function Amount({
  value,
  currency = "AUD",
  className,
}: {
  value: number
  currency?: string
  className?: string
}) {
  const { hidden } = usePrivacy()
  return (
    <span
      className={cn(className, hidden && "select-none blur-[7px]")}
      aria-label={hidden ? "Amount hidden" : undefined}
    >
      {formatCurrency(value, currency)}
    </span>
  )
}
