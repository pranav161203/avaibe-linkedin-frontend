import { useMutation, useQuery } from '@tanstack/react-query'
import { getAccountDoc, saveAccountDoc, type AccountDocs } from '@/lib/api'
import { queryClient } from '@/providers'

export const useGetAccountDoc = <K extends keyof AccountDocs>(accountId: number | undefined, kind: K) => {
  return useQuery({
    queryKey: ['doc', accountId, kind],
    queryFn: () => getAccountDoc(accountId!, kind),
    enabled: !!accountId,
  })
}

export const useSaveAccountDoc = <K extends keyof AccountDocs>(accountId: number, kind: K) => {
  return useMutation({
    mutationFn: (data: AccountDocs[K]) => saveAccountDoc({ accountId, kind, data }),
    onSuccess: (doc) => queryClient.setQueryData(['doc', accountId, kind], doc),
  })
}
