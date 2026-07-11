import { useState } from "react"
import { Amount } from "@/components/amount"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { AccountRow } from "@/lib/database.types"
import { latestBalance, projectedMonthlyInterest } from "@/lib/money-math"
import { useAccounts, useAddBalance, useBalanceEvents, useCreateAccount } from "./queries"

type AccountType = "hysa" | "brokerage" | "other"

export function AccountsCard() {
  const { data: accounts } = useAccounts()
  const { data: events } = useBalanceEvents()
  const addBalance = useAddBalance()
  const createAccount = useCreateAccount()

  const [updating, setUpdating] = useState<AccountRow | null>(null)
  const [balanceInput, setBalanceInput] = useState("")
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState("")
  const [type, setType] = useState<AccountType>("hysa")
  const [apy, setApy] = useState("")

  function saveBalance() {
    const balance = Number(balanceInput)
    if (!updating || !Number.isFinite(balance) || balance < 0) return
    addBalance.mutate(
      { accountId: updating.id, balance },
      {
        onSuccess: () => {
          setUpdating(null)
          setBalanceInput("")
        },
      },
    )
  }

  function saveAccount() {
    if (!name.trim()) return
    createAccount.mutate(
      {
        name: name.trim(),
        type,
        apy: type === "hysa" && apy ? Number(apy) : null,
      },
      {
        onSuccess: () => {
          setAdding(false)
          setName("")
          setApy("")
        },
      },
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accounts</CardTitle>
        <CardDescription>
          Balance updates append to history — current value is the latest event.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <ul className="flex flex-col divide-y divide-border">
          {(accounts ?? []).map((account) => {
            const latest = latestBalance(events ?? [], account.id)
            return (
              <li key={account.id} className="flex items-center gap-2 py-2">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    {account.name}
                    <Badge variant="outline" className="uppercase">
                      {account.type}
                    </Badge>
                  </p>
                  {account.type === "hysa" && account.apy != null && latest && (
                    <p className="text-xs text-muted-foreground">
                      {account.apy}% APY ≈{" "}
                      <Amount
                        value={projectedMonthlyInterest(latest.balance, account.apy)}
                      />
                      /mo interest
                    </p>
                  )}
                </div>
                <div className="text-right">
                  {latest ? (
                    <Amount value={latest.balance} className="text-sm font-medium" />
                  ) : (
                    <span className="text-xs text-muted-foreground">no balance yet</span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    setUpdating(account)
                    setBalanceInput(latest?.balance.toString() ?? "")
                  }}
                >
                  Update
                </Button>
              </li>
            )
          })}
          {(accounts ?? []).length === 0 && (
            <li className="py-2 text-sm text-muted-foreground">
              No accounts yet — add your HYSA to start.
            </li>
          )}
        </ul>
        <Button
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => setAdding(true)}
        >
          Add account
        </Button>
      </CardContent>

      <Dialog open={!!updating} onOpenChange={(open) => !open && setUpdating(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Update {updating?.name}</DialogTitle>
            <DialogDescription>
              Records a new balance event (history is kept).
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">$</span>
            <Input
              type="number"
              inputMode="decimal"
              step="0.01"
              min={0}
              value={balanceInput}
              onChange={(e) => setBalanceInput(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") saveBalance()
              }}
            />
          </div>
          <DialogFooter>
            <Button
              className="w-full"
              onClick={saveBalance}
              disabled={addBalance.isPending || !balanceInput}
            >
              {addBalance.isPending ? "Saving…" : "Save balance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add account</DialogTitle>
            <DialogDescription>AUD accounts; VOO lives under Holdings.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="account-name">Name</Label>
              <Input
                id="account-name"
                placeholder="e.g. ING Savings Maximiser"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <ToggleGroup
              type="single"
              variant="outline"
              className="w-full"
              value={type}
              onValueChange={(v) => v && setType(v as AccountType)}
            >
              <ToggleGroupItem value="hysa" className="flex-1">
                HYSA
              </ToggleGroupItem>
              <ToggleGroupItem value="brokerage" className="flex-1">
                Brokerage
              </ToggleGroupItem>
              <ToggleGroupItem value="other" className="flex-1">
                Other
              </ToggleGroupItem>
            </ToggleGroup>
            {type === "hysa" && (
              <div className="flex flex-col gap-1">
                <Label htmlFor="account-apy">APY %</Label>
                <Input
                  id="account-apy"
                  type="number"
                  inputMode="decimal"
                  step="0.05"
                  placeholder="5.10"
                  value={apy}
                  onChange={(e) => setApy(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              className="w-full"
              onClick={saveAccount}
              disabled={createAccount.isPending || !name.trim()}
            >
              {createAccount.isPending ? "Adding…" : "Add account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
