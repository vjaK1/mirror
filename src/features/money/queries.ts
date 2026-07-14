import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as data from "@/lib/data"

export function useAccounts() {
  return useQuery({ queryKey: ["accounts"], queryFn: data.getAccounts })
}

export function useBalanceEvents() {
  return useQuery({ queryKey: ["balance-events"], queryFn: data.getBalanceEvents })
}

export function useHolding() {
  return useQuery({ queryKey: ["holding"], queryFn: () => data.getHolding() })
}

export function usePrices() {
  return useQuery({
    queryKey: ["price-snapshots"],
    queryFn: () => data.getPriceSnapshots(),
    staleTime: 3600_000,
  })
}

export function useFx() {
  return useQuery({
    queryKey: ["fx-snapshots"],
    queryFn: () => data.getFxSnapshots(),
    staleTime: 3600_000,
  })
}

export function useIncome() {
  return useQuery({ queryKey: ["income"], queryFn: () => data.getIncomeEvents() })
}

export function useRecurringIncome() {
  return useQuery({
    queryKey: ["recurring-income"],
    queryFn: data.getRecurringIncome,
  })
}

export function useCreateAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: data.createAccount,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
  })
}

export function useUpdateApy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: string; apy: number | null }) =>
      data.updateAccountApy(input.id, input.apy),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
  })
}

export function useDeleteAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => data.deleteAccount(id),
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: ["accounts"] }),
        qc.invalidateQueries({ queryKey: ["balance-events"] }),
      ]),
  })
}

export function useAddBalance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { accountId: string; balance: number }) =>
      data.insertBalanceEvent(input.accountId, input.balance),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["balance-events"] }),
  })
}

export function useUpsertHolding() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { symbol: string; shares: number }) =>
      data.upsertHolding(input.symbol, input.shares),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["holding"] }),
  })
}

export function useAddIncome() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: data.insertIncomeEvent,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["income"] }),
  })
}

export function useSaveRecurring() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: data.upsertRecurringIncome,
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: ["recurring-income"] }),
        qc.invalidateQueries({ queryKey: ["income"] }),
      ]),
  })
}

export function useMaterializeRecurring() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: data.materializeRecurringIncome,
    onSuccess: (created) => {
      if (created > 0) {
        return Promise.all([
          qc.invalidateQueries({ queryKey: ["income"] }),
          qc.invalidateQueries({ queryKey: ["recurring-income"] }),
        ])
      }
    },
  })
}
