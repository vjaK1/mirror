import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as data from "@/lib/data"
import type { NoteType } from "@/lib/data"

export function useNotes() {
  return useQuery({ queryKey: ["notes"], queryFn: data.getNotes })
}

function useInvalidateNotes() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ["notes"] })
}

export function useCreateNote() {
  const invalidate = useInvalidateNotes()
  return useMutation({
    mutationFn: (input: { type: NoteType; content: string }) =>
      data.createNote(input.type, input.content),
    onSuccess: invalidate,
  })
}

export function useSetNoteDone() {
  const invalidate = useInvalidateNotes()
  return useMutation({
    mutationFn: (input: { id: string; done: boolean }) =>
      data.setNoteDone(input.id, input.done),
    onSuccess: invalidate,
  })
}

export function useUpdateNote() {
  const invalidate = useInvalidateNotes()
  return useMutation({
    mutationFn: (input: { id: string; content: string }) =>
      data.updateNoteContent(input.id, input.content),
    onSuccess: invalidate,
  })
}

export function useDeleteNote() {
  const invalidate = useInvalidateNotes()
  return useMutation({
    mutationFn: (id: string) => data.deleteNote(id),
    onSuccess: invalidate,
  })
}
