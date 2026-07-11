import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as data from "@/lib/data"
import { logicalDay } from "@/lib/logical-day"
import type { FoodLogInsert } from "@/lib/database.types"

export function useTodayMacros() {
  const day = logicalDay()
  return useQuery({
    queryKey: ["macros", day],
    queryFn: () => data.getMacrosForDay(day),
  })
}

export function useTodayLogs() {
  const day = logicalDay()
  return useQuery({
    queryKey: ["logs", day],
    queryFn: () => data.getLogsForDay(day),
  })
}

export function useActivePhase() {
  return useQuery({ queryKey: ["phase"], queryFn: data.getActivePhase })
}

export function useWeighIns(days = 90) {
  return useQuery({
    queryKey: ["weigh-ins", days],
    queryFn: () => data.getWeighIns(days),
  })
}

export function useSavedMeals() {
  return useQuery({ queryKey: ["saved-meals"], queryFn: data.getSavedMeals })
}

export function useRecentFoods() {
  return useQuery({ queryKey: ["recent-foods"], queryFn: () => data.getRecentFoods() })
}

function useInvalidateDiet() {
  const qc = useQueryClient()
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ["macros"] }),
      qc.invalidateQueries({ queryKey: ["logs"] }),
      qc.invalidateQueries({ queryKey: ["recent-foods"] }),
    ])
}

export function useLogFood() {
  const invalidate = useInvalidateDiet()
  return useMutation({
    mutationFn: (rows: Omit<FoodLogInsert, "user_id">[]) => data.insertFoodLogs(rows),
    onSuccess: invalidate,
  })
}

export function useDeleteLog() {
  const invalidate = useInvalidateDiet()
  return useMutation({
    mutationFn: (id: string) => data.deleteFoodLog(id),
    onSuccess: invalidate,
  })
}

export function useAddWeighIn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (weightKg: number) => data.addWeighIn(weightKg),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["weigh-ins"] }),
  })
}

export function useStartPhase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (targets: data.PhaseTargets) => data.startPhase(targets),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["phase"] }),
  })
}

export function useUpdateTargets() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      id: string
      targets: Omit<data.PhaseTargets, "phase">
    }) => data.updatePhaseTargets(input.id, input.targets),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["phase"] }),
  })
}

export function useCreateSavedMeal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { name: string; items: data.SavedMealItem[] }) =>
      data.createSavedMeal(input.name, input.items),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-meals"] }),
  })
}

export function useDeleteSavedMeal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => data.deleteSavedMeal(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-meals"] }),
  })
}
