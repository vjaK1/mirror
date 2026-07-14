import { useMemo, useState } from "react"
import { Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { NoteRow } from "@/lib/database.types"
import type { NoteType } from "@/lib/data"
import { cn } from "@/lib/utils"
import {
  useCreateNote,
  useDeleteNote,
  useNotes,
  useSetNoteDone,
  useUpdateNote,
} from "@/features/notes/queries"

const dateFormat = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "short",
  timeZone: "Australia/Melbourne",
})

const PLACEHOLDERS: Record<NoteType, string> = {
  todo: "e.g. book dentist, call the accountant…",
  scratch: "quick thought, link, number to remember…",
  journal: "how did today actually go?",
}

type Filter = "all" | NoteType

export function NotesScreen() {
  const { data: notes } = useNotes()
  const createNote = useCreateNote()
  const setDone = useSetNoteDone()
  const updateNote = useUpdateNote()
  const deleteNote = useDeleteNote()

  const [type, setType] = useState<NoteType>("todo")
  const [content, setContent] = useState("")
  const [filter, setFilter] = useState<Filter>("all")
  const [editing, setEditing] = useState<NoteRow | null>(null)
  const [editText, setEditText] = useState("")

  const visible = useMemo(() => {
    const list = (notes ?? []).filter((n) => filter === "all" || n.type === filter)
    // Open todos float to the top; everything else stays newest-first.
    return [...list].sort((a, b) => {
      const aOpen = a.type === "todo" && a.is_done === false ? 0 : 1
      const bOpen = b.type === "todo" && b.is_done === false ? 0 : 1
      if (aOpen !== bOpen) return aOpen - bOpen
      return b.created_at.localeCompare(a.created_at)
    })
  }, [notes, filter])

  function add() {
    const trimmed = content.trim()
    if (!trimmed) return
    createNote.mutate({ type, content: trimmed }, { onSuccess: () => setContent("") })
  }

  function saveEdit() {
    if (!editing || !editText.trim()) return
    updateNote.mutate(
      { id: editing.id, content: editText.trim() },
      { onSuccess: () => setEditing(null) },
    )
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <h1 className="font-heading text-lg font-semibold">Notes</h1>

      <Card>
        <CardContent className="flex flex-col gap-2">
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            className="w-full"
            value={type}
            onValueChange={(v) => v && setType(v as NoteType)}
          >
            <ToggleGroupItem value="todo" className="flex-1">
              Todo
            </ToggleGroupItem>
            <ToggleGroupItem value="scratch" className="flex-1">
              Scratch
            </ToggleGroupItem>
            <ToggleGroupItem value="journal" className="flex-1">
              Journal
            </ToggleGroupItem>
          </ToggleGroup>
          <Textarea
            rows={type === "journal" ? 4 : 2}
            placeholder={PLACEHOLDERS[type]}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <Button
            className="self-start"
            size="sm"
            onClick={add}
            disabled={createNote.isPending || !content.trim()}
          >
            {createNote.isPending ? "Saving…" : "Add"}
          </Button>
        </CardContent>
      </Card>

      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        className="w-full"
        value={filter}
        onValueChange={(v) => v && setFilter(v as Filter)}
      >
        {(["all", "todo", "scratch", "journal"] as const).map((f) => (
          <ToggleGroupItem key={f} value={f} className="flex-1 capitalize">
            {f === "all" ? "All" : f}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <ul className="flex flex-col gap-2">
        {visible.map((note) => (
          <li key={note.id}>
            <Card size="sm">
              <CardContent className="flex items-start gap-2">
                {note.type === "todo" && (
                  <Checkbox
                    checked={note.is_done === true}
                    onCheckedChange={(checked) =>
                      setDone.mutate({ id: note.id, done: checked === true })
                    }
                    aria-label="Mark done"
                    className="mt-0.5"
                  />
                )}
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => {
                    setEditing(note)
                    setEditText(note.content)
                  }}
                >
                  <p
                    className={cn(
                      "whitespace-pre-wrap text-sm",
                      note.is_done && "text-muted-foreground line-through",
                    )}
                  >
                    {note.content}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    {note.type !== "todo" && (
                      <Badge variant="outline" className="px-1 py-0 text-[10px]">
                        {note.type}
                      </Badge>
                    )}
                    {dateFormat.format(new Date(note.created_at))}
                  </p>
                </button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Delete note"
                  onClick={() => deleteNote.mutate(note.id)}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </CardContent>
            </Card>
          </li>
        ))}
        {visible.length === 0 && (
          <li className="py-4 text-center text-sm text-muted-foreground">
            Nothing here yet — add one above, or type “note: …” in the + sheet.
          </li>
        )}
      </ul>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="capitalize">Edit {editing?.type}</DialogTitle>
          </DialogHeader>
          <Textarea
            rows={5}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            autoFocus
          />
          <DialogFooter>
            <Button
              className="w-full"
              onClick={saveEdit}
              disabled={updateNote.isPending || !editText.trim()}
            >
              {updateNote.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
