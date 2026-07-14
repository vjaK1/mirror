import { useState } from "react"
import { Trash2 } from "lucide-react"
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
import {
  useAccounts,
  useAddBalance,
  useBalanceEvents,
  useCreateAccount,
  useDeleteAccount,
  useUpdateApy,
} from "./queries"

type AccountType = "hysa" | "brokerage" | "other"

export function AccountsCard() {
  const { data: accounts } = useAccounts()
  const { data: events } = useBalanceEvents()
  const addBalance = useAddBalance()
  const createAccount = useCreateAccount()
  const updateApy = useUpdateApy()
  const deleteAccount = useDeleteAccount()

  const [updating, setUpdating] = useState<AccountRow | null>(null)
  const [balanceInput, setBalanceInput] = useState("")
  const [apyInput, setApyInput] = useState("")
  const [deleting, setDeleting] = useState<AccountRow | null>(null)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState("")
  const [type, setType] = useState<AccountType>("hysa")
  const [apy, setApy] = useState("")

  async function saveUpdate() {
    if (!updating) return
    const latest = latestBalance(events ?? [], updating.id)
    const balance = Number(balanceInput)
    const newApy = apyInput === "" ? null : Number(apyInput)

    const balanceChanged =
      balanceInput !== "" &&
      Number.isFinite(balance) &&
      balance >= 0 &&
      balance !== latest?.balance
    const apyChanged =
      updating.type === "hysa" &&
      (apyInput === "" ? updating.apy != null : newApy !== updating.apy)

    if (balanceChanged) {
      await addBalance.mutateAsync({ accountId: updating.id, balance })
    }
    if (apyChanged) {
      await updateApy.mutateAsync({ id: updating.id, apy: newApy })
    }
    setUpdating(null)
    setBalanceInput("")
    setApyInput("")
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
                    setApyInput(account.apy?.toString() ?? "")
                  }}
                >
                  Update
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Delete ${account.name}`}
                  onClick={() => setDeleting(account)}
                >
                  <Trash2 aria-hidden="true" />
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
              Balance changes append to history; the rate updates in place.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="update-balance">Balance $</Label>
              <Input
                id="update-balance"
                type="number"
                inputMode="decimal"
                step="0.01"
                min={0}
                value={balanceInput}
                onChange={(e) => setBalanceInput(e.target.value)}
                autoFocus
              />
            </div>
            {updating?.type === "hysa" && (
              <div className="flex flex-col gap-1">
                <Label htmlFor="update-apy">Interest rate (APY %)</Label>
                <Input
                  id="update-apy"
                  type="number"
                  inputMode="decimal"
                  step="0.05"
                  min={0}
                  placeholder="5.10"
                  value={apyInput}
                  onChange={(e) => setApyInput(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              className="w-full"
              onClick={() => void saveUpdate()}
              disabled={addBalance.isPending || updateApy.isPending}
            >
              {addBalance.isPending || updateApy.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete {deleting?.name}?</DialogTitle>
            <DialogDescription>
              Removes the account and its whole balance history from net worth.
              This can't be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeleting(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={deleteAccount.isPending}
              onClick={() => {
                if (!deleting) return
                deleteAccount.mutate(deleting.id, {
                  onSuccess: () => setDeleting(null),
                })
              }}
            >
              {deleteAccount.isPending ? "Deleting…" : "Delete account"}
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
