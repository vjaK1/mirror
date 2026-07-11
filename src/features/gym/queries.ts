import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as data from "@/lib/data"
import { logicalDay } from "@/lib/logical-day"

export function useExercises() {
  return useQuery({ queryKey: ["exercises"], queryFn: data.getExercises })
}

export function useTodaySession() {
  return useQuery({
    queryKey: ["gym-session", logicalDay()],
    queryFn: data.getTodaySession,
  })
}

export function useRecentSessions() {
  return useQuery({
    queryKey: ["gym-sessions"],
    queryFn: () => data.getRecentSessions(),
  })
}

export function useSessionSets(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["gym-sets", sessionId],
    queryFn: () => data.getSetsForSession(sessionId!),
    enabled: !!sessionId,
  })
}

export function useLastSessionOfType(
  type: data.SessionType | undefined,
  excludeId?: string,
) {
  return useQuery({
    queryKey: ["gym-last-session", type, excludeId],
    queryFn: async () => {
      const session = await data.getLastSessionOfType(type!, excludeId)
      if (!session) return null
      const sets = await data.getSetsForSession(session.id)
      return { session, sets }
    },
    enabled: !!type,
  })
}

export function useExerciseSets(exerciseId: string | undefined) {
  return useQuery({
    queryKey: ["gym-exercise-sets", exerciseId],
    queryFn: () => data.getExerciseSets(exerciseId!),
    enabled: !!exerciseId,
  })
}

export function useProfile() {
  return useQuery({ queryKey: ["profile"], queryFn: data.getProfile })
}

function useInvalidateGym() {
  const qc = useQueryClient()
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ["gym-session", logicalDay()] }),
      qc.invalidateQueries({ queryKey: ["gym-sessions"] }),
      qc.invalidateQueries({ queryKey: ["gym-sets"] }),
      qc.invalidateQueries({ queryKey: ["gym-last-session"] }),
      qc.invalidateQueries({ queryKey: ["gym-exercise-sets"] }),
    ])
}

export function useStartSession() {
  const invalidate = useInvalidateGym()
  return useMutation({
    mutationFn: (type: data.SessionType) => data.startWorkoutSession(type),
    onSuccess: invalidate,
  })
}

export function useDeleteSession() {
  const invalidate = useInvalidateGym()
  return useMutation({
    mutationFn: (id: string) => data.deleteWorkoutSession(id),
    onSuccess: invalidate,
  })
}

export function useInsertSet() {
  const invalidate = useInvalidateGym()
  return useMutation({
    mutationFn: (row: {
      session_id: string
      exercise_id: string
      set_number: number
      reps: number
      weight_kg: number | null
    }) => data.insertSet(row),
    onSuccess: invalidate,
  })
}

export function useUpdateSet() {
  const invalidate = useInvalidateGym()
  return useMutation({
    mutationFn: (input: {
      id: string
      patch: { reps?: number; weight_kg?: number | null }
    }) => data.updateSet(input.id, input.patch),
    onSuccess: invalidate,
  })
}

export function useDeleteSet() {
  const invalidate = useInvalidateGym()
  return useMutation({
    mutationFn: (id: string) => data.deleteSet(id),
    onSuccess: invalidate,
  })
}

export function useCreateExercise() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => data.createCustomExercise(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exercises"] }),
  })
}

export function useSetWeeklyTarget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (target: number) => data.setWeeklyTarget(target),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  })
}
