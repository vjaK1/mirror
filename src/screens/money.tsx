import { AccountsCard } from "@/features/money/accounts-card"
import { HoldingsCard } from "@/features/money/holdings-card"
import { IncomeCard } from "@/features/money/income-card"
import { NetWorthCard } from "@/features/money/net-worth-card"

export function MoneyScreen() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <h1 className="font-heading text-lg font-semibold">Money</h1>
      <NetWorthCard />
      <AccountsCard />
      <HoldingsCard />
      <IncomeCard />
    </div>
  )
}
