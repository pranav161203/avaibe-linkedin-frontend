import { useMutation, useQuery } from '@tanstack/react-query'
import { addKnowledge, deleteKnowledge, getAccountDoc, getKnowledge, getKnowledgeSource, saveAccountDoc, searchKnowledge, updateKnowledge, type AccountDocs } from '@/lib/api'
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

// ---- Company knowledge base
const refreshKnowledge = () => queryClient.invalidateQueries({ queryKey: ['knowledge'] })

export const useGetKnowledge = (accountId: number | undefined) =>
  useQuery({ queryKey: ['knowledge', 'list', accountId], queryFn: () => getKnowledge(accountId!), enabled: !!accountId })

export const useGetKnowledgeSource = (id: number | null) =>
  useQuery({ queryKey: ['knowledge', id], queryFn: () => getKnowledgeSource(id!), enabled: id != null })

export const useAddKnowledge = () => useMutation({ mutationFn: addKnowledge, onSuccess: refreshKnowledge })

export const useUpdateKnowledge = () => useMutation({ mutationFn: updateKnowledge, onSuccess: refreshKnowledge })

export const useDeleteKnowledge = () => useMutation({ mutationFn: deleteKnowledge, onSuccess: refreshKnowledge })

export const useSearchKnowledge = (q: string, accountId: number | undefined) =>
  useQuery({ queryKey: ['knowledge', 'search', q, accountId], queryFn: () => searchKnowledge(q, accountId!), enabled: q.trim().length > 1 && !!accountId })
