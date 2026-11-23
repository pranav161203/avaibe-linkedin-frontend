import { useMutation, useQuery } from '@tanstack/react-query'
import { createLead, deleteLead, getLeads, markLeadReplied, updateLead, type LeadInput } from '@/lib/api'
import { queryClient } from '@/providers'

export const useGetLeads = (accountId: number | undefined) => {
  return useQuery({
    queryKey: ['leads', accountId],
    queryFn: () => getLeads(accountId!),
    enabled: !!accountId,
  })
}

export const useSaveLead = (accountId?: number) => {
  return useMutation({
    mutationFn: ({ id, body }: { id?: number; body: LeadInput }) => (id ? updateLead({ id, body }) : createLead(body)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads', accountId] }),
  })
}

export const useDeleteLead = (accountId?: number) => {
  return useMutation({
    mutationFn: deleteLead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads', accountId] }),
  })
}

export const useMarkLeadReplied = (accountId?: number) => {
  return useMutation({
    mutationFn: markLeadReplied,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads', accountId] }),
  })
}
