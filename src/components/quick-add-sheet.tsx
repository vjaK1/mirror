import { useRef, useState } from "react"
import type { FormEvent } from "react"
import { Dumbbell, NotebookPen, Scale, UtensilsCrossed } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { parseLog } from "@/lib/data"
import type { FoodProposal } from "@/lib/parse-types"
import { resolveLocally } from "@/features/quick-add/local-resolve"
import { ParseConfirmation } from "@/features/quick-add/parse-confirmation"
import { LiftConfirmation } from "@/features/quick-add/lift-confirmation"
import type { LiftProposal } from "@/features/quick-add/lift-confirmation"
import { useAddWeighIn } from "@/features/diet/queries"

type Mode = "input" | "confirm" | "confirm-lift" | "weigh"

/** The universal input (BLUEPRINT §3). Saved meals and unambiguous "Ng food"
 * text resolve locally; everything else goes through ai-parse-log. */
export function QuickAddSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [mode, setMode] = useState<Mode>("input")
  const [text, setText] = useState("")
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [proposal, setProposal] = useState<FoodProposal | null>(null)
  const [liftProposal, setLiftProposal] = useState<LiftProposal | null>(null)
  const [weight, setWeight] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const addWeighIn = useAddWeighIn()

  function reset() {
    setMode("input")
    setText("")
    setBusy(false)
    setNotice(null)
    setProposal(null)
    setLiftProposal(null)
    setWeight("")
  }

  function close() {
    onOpenChange(false)
    reset()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || busy) return
    setBusy(true)
    setNotice(null)
    try {
      const local = await resolveLocally(trimmed)
      if (local) {
        setProposal(local)
        setMode("confirm")
        return
      }
      const parsed = await parseLog(trimmed)
      if ("error" in parsed) {
        setNotice(`Couldn't parse that: ${parsed.error}`)
      } else if (parsed.intent === "food_log") {
        if (parsed.items.length === 0 && parsed.unmatched.length === 0) {
          setNotice("Nothing recognisable as food in that — try adding grams.")
        } else {
          setProposal({
            intent: "food_log",
            origin: "ai_parse",
            rawText: trimmed,
            items: parsed.items,
            unmatched: parsed.unmatched,
          })
          setMode("confirm")
        }
      } else if (parsed.intent === "lift_log") {
        if (parsed.sets.length === 0) {
          setNotice("Couldn't read any sets out of that — try e.g. bench 80kg 3x8.")
        } else {
          setLiftProposal({
            session_type_guess: parsed.session_type_guess,
            sets: parsed.sets,
          })
          setMode("confirm-lift")
        }
      } else if (parsed.intent === "note") {
        setNotice("That looks like a note — notes land in Session 6.")
      } else {
        setNotice("That looks like a question — Ask AI lands in Session 5.")
      }
    } catch (err) {
      setNotice(`Something went wrong: ${err instanceof Error ? err.message : err}`)
    } finally {
      setBusy(false)
    }
  }

  function saveWeight() {
    const kg = Number(weight)
    if (!Number.isFinite(kg) || kg <= 0 || kg > 400) return
    addWeighIn.mutate(kg, { onSuccess: close })
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) reset()
      }}
    >
      <SheetContent
        side="bottom"
        className="mx-auto max-w-md rounded-t-3xl pb-[max(env(safe-area-inset-bottom),1.25rem)]"
      >
        <SheetHeader>
          <SheetTitle>
            {mode === "confirm"
              ? "Confirm log"
              : mode === "confirm-lift"
                ? "Confirm lifts"
                : mode === "weigh"
                  ? "Weigh in"
                  : "Quick add"}
          </SheetTitle>
          <SheetDescription>
            {mode === "confirm"
              ? "Check the numbers — adjust grams if needed."
              : mode === "confirm-lift"
                ? "Check weights and reps before saving."
                : mode === "weigh"
                  ? "Today's weight in kilograms."
                  : "Type anything — food, a lift, a note, or a question."}
          </SheetDescription>
        </SheetHeader>

        {mode === "confirm" && proposal ? (
          <div className="px-4">
            <ParseConfirmation
              proposal={proposal}
              onDone={close}
              onCancel={() => {
                setProposal(null)
                setMode("input")
              }}
            />
          </div>
        ) : mode === "confirm-lift" && liftProposal ? (
          <div className="px-4">
            <LiftConfirmation
              proposal={liftProposal}
              onDone={close}
              onCancel={() => {
                setLiftProposal(null)
                setMode("input")
              }}
            />
          </div>
        ) : mode === "weigh" ? (
          <div className="flex flex-col gap-3 px-4">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                inputMode="decimal"
                step="0.1"
                min={30}
                max={300}
                placeholder="76.4"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                autoFocus
              />
              <span className="text-sm text-muted-foreground">kg</span>
            </div>
            {addWeighIn.isError && (
              <p className="text-sm text-destructive">
                Save failed: {(addWeighIn.error as Error).message}
              </p>
            )}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setMode("input")}>
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={saveWeight}
                disabled={addWeighIn.isPending || !weight}
              >
                {addWeighIn.isPending ? "Saving…" : "Save weigh-in"}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-4">
            <Input
              ref={inputRef}
              placeholder='e.g. "150g rice, 200g chicken" or "2 eggs and toast"'
              autoComplete="off"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={busy}
            />
            {notice && <p className="text-sm text-muted-foreground">{notice}</p>}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="rounded-full"
                onClick={() => inputRef.current?.focus()}
              >
                <UtensilsCrossed aria-hidden="true" />
                Log food
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="rounded-full"
                onClick={() => {
                  setText("")
                  setNotice('Type a lift, e.g. "bench 80kg 3x8, incline db 30kg 2x10"')
                  inputRef.current?.focus()
                }}
              >
                <Dumbbell aria-hidden="true" />
                Log lift
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="rounded-full"
                onClick={() => setMode("weigh")}
              >
                <Scale aria-hidden="true" />
                Weigh in
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="rounded-full"
                onClick={() => setNotice("Notes land in Session 6.")}
              >
                <NotebookPen aria-hidden="true" />
                Note
              </Button>
            </div>
            <Button type="submit" disabled={busy || !text.trim()}>
              {busy ? "Parsing…" : "Parse & review"}
            </Button>
          </form>
        )}
      </SheetContent>
    </Sheet>
  )
}
