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

const quickActions = [
  { label: "Log food", icon: UtensilsCrossed },
  { label: "Log lift", icon: Dumbbell },
  { label: "Weigh in", icon: Scale },
  { label: "Note", icon: NotebookPen },
]

/** The universal input (BLUEPRINT §3). Visual shell only for now —
 * parsing and the confirm flow arrive with ai-parse-log in Session 2. */
export function QuickAddSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto max-w-md rounded-t-3xl pb-[max(env(safe-area-inset-bottom),1.25rem)]"
      >
        <SheetHeader>
          <SheetTitle>Quick add</SheetTitle>
          <SheetDescription>
            Type anything — food, a lift, a note, or a question.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-3 px-4">
          <Input
            placeholder='e.g. "150g rice, 200g chicken" or "bench 80kg 3x8"'
            autoComplete="off"
          />
          <div className="flex flex-wrap gap-2">
            {quickActions.map(({ label, icon: Icon }) => (
              <Button
                key={label}
                type="button"
                variant="secondary"
                size="sm"
                className="rounded-full"
              >
                <Icon aria-hidden="true" />
                {label}
              </Button>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
