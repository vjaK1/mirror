import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as data from "@/lib/data"

export function useGoal() {
  return useQuery({ queryKey: ["goal"], queryFn: data.getGoal })
}

export function useUpsertGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { name: string; target_value: number; target_date: string }) =>
      data.upsertGoal(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goal"] }),
  })
}
