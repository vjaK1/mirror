import { Fragment, useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { usePrivacy } from "@/components/privacy-provider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { AskResponse } from "@/lib/parse-types"

/** Dollar amounts inside the free-text answer respect the global privacy
 * blur (CLAUDE.md rule 9); percentages and everything else stay visible. */
function BlurredText({ text }: { text: string }) {
  const { hidden } = usePrivacy()
  const parts = text.split(/(\$[\d,]+(?:\.\d{1,2})?)/g)
  return (
    <>
      {parts.map((part, i) =>
        /^\$[\d,]/.test(part) ? (
          <span key={i} className={cn(hidden && "select-none blur-[6px]")}>
            {part}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  )
}

export function AskAnswer({
  question,
  response,
  onAskAnother,
  onDone,
}: {
  question: string
  response: Extract<AskResponse, { answer: string }>
  onAskAnother: () => void
  onDone: () => void
}) {
  const [showQuery, setShowQuery] = useState(false)
  const answer = response.answer.replace(/\*\*/g, "")

  return (
    <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto">
      <p className="text-xs text-muted-foreground">“{question}”</p>
      <p className="whitespace-pre-wrap text-sm leading-relaxed">
        <BlurredText text={answer} />
      </p>

      {response.tool_calls.length > 0 && (
        <div>
          <button
            type="button"
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground"
            onClick={() => setShowQuery((s) => !s)}
            aria-expanded={showQuery}
          >
            {showQuery ? (
              <ChevronDown className="size-3" aria-hidden="true" />
            ) : (
              <ChevronRight className="size-3" aria-hidden="true" />
            )}
            Show the query ({response.tool_calls.length} tool
            {response.tool_calls.length === 1 ? "" : "s"})
          </button>
          {showQuery && (
            <ul className="mt-2 flex flex-col gap-2">
              {response.tool_calls.map((call, i) => (
                <li key={i} className="rounded-lg bg-muted p-2">
                  <p className="font-mono text-xs">
                    {call.name}({Object.keys(call.input).length > 0 ? JSON.stringify(call.input) : ""})
                  </p>
                  <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap break-all font-mono text-[10px] text-muted-foreground">
                    {JSON.stringify(call.result, null, 1)}
                  </pre>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onAskAnother}>
          Ask another
        </Button>
        <Button className="flex-1" onClick={onDone}>
          Done
        </Button>
      </div>
    </div>
  )
}
