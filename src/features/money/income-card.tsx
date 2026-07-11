import { useEffect, useRef, useState } from "react"
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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { logicalDay } from "@/lib/logical-day"
import {
  useAddIncome,
  useIncome,
  useMaterializeRecurring,
  useRecurringIncome,
  useSaveRecurring,
} from "./queries"

const dateFormat = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "short",
  timeZone: "Australia/Melbourne",
})

type Cadence = "weekly" | "fortnightly" | "monthly"

export function IncomeCard() {
  const { data: income } = useIncome()
  const { data: recurring } = useRecurringIncome()
  const addIncome = useAddIncome()
  const saveRecurring = useSaveRecurring()
  const materialize = useMaterializeRecurring()

  const [amount, setAmount] = useState("")
  const [source, setSource] = useState("")
  const [recAmount, setRecAmount] = useState<string | null>(null)
  const [recSource, setRecSource] = useState<string | null>(null)
  const [recCadence, setRecCadence] = useState<Cadence | null>(null)
  const [recNext, setRecNext] = useState<string | null>(null)

  // Materialize due recurring income once per mount (BLUEPRINT §4).
  const materialized = useRef(false)
  useEffect(() => {
    if (!materialized.current) {
      materialized.current = true
      materialize.mutate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function logIncome() {
    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0 || !source.trim()) return
    addIncome.mutate(
      { amount: value, source: source.trim() },
      {
        onSuccess: () => {
          setAmount("")
          setSource("")
        },
      },
    )
  }

  function saveRec() {
    const value = Number(recAmount ?? recurring?.amount ?? 0)
    const src = (recSource ?? recurring?.source ?? "").trim()
    const cadence = recCadence ?? (recurring?.cadence as Cadence) ?? "monthly"
    const next = recNext ?? recurring?.next_date ?? logicalDay()
    if (!Number.isFinite(value) || value <= 0 || !src) return
    saveRecurring.mutate({
      id: recurring?.id,
      amount: value,
      source: src,
      cadence,
      next_date: next,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Income</CardTitle>
        <CardDescription>
          One-off entries plus a recurring salary that logs itself.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-end gap-2">
          <div className="flex flex-1 flex-col gap-1">
            <Label htmlFor="income-amount">Amount</Label>
            <Input
              id="income-amount"
              type="number"
              inputMode="decimal"
              min={0}
              placeholder="1500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <Label htmlFor="income-source">Source</Label>
            <Input
              id="income-source"
              placeholder="e.g. freelance"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
          </div>
          <Button
            onClick={logIncome}
            disabled={addIncome.isPending || !amount || !source.trim()}
          >
            Add
          </Button>
        </div>

        <div className="rounded-lg border border-border p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Recurring salary
            {recurring && ` — next ${recurring.next_date}`}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              placeholder="Amount"
              value={recAmount ?? recurring?.amount.toString() ?? ""}
              onChange={(e) => setRecAmount(e.target.value)}
              aria-label="Recurring amount"
            />
            <Input
              placeholder="Source"
              value={recSource ?? recurring?.source ?? ""}
              onChange={(e) => setRecSource(e.target.value)}
              aria-label="Recurring source"
            />
            <Select
              value={recCadence ?? (recurring?.cadence as Cadence) ?? "monthly"}
              onValueChange={(v) => setRecCadence(v as Cadence)}
            >
              <SelectTrigger aria-label="Cadence">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="fortnightly">Fortnightly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={recNext ?? recurring?.next_date ?? ""}
              onChange={(e) => setRecNext(e.target.value)}
              aria-label="Next payment date"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={saveRec}
            disabled={saveRecurring.isPending}
          >
            {saveRecurring.isPending
              ? "Saving…"
              : recurring
                ? "Update recurring"
                : "Set up recurring"}
          </Button>
        </div>

        {income && income.length > 0 && (
          <ul className="flex flex-col divide-y divide-border">
            {income.slice(0, 5).map((event) => (
              <li key={event.id} className="flex items-center justify-between py-1.5">
                <span className="text-sm">
                  {event.source}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {dateFormat.format(new Date(event.received_at))}
                    {event.from_recurring && " · auto"}
                  </span>
                </span>
                <Amount value={event.amount} className="text-sm font-medium" />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
