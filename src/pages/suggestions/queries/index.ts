import { useMutation, useQuery } from '@tanstack/react-query'
import { createDraftFromIdea, generateIdeas, getDecisions, getIdeas, getSimilarPosts, getSuggestions, saveDecision, type DecisionStatus } from '@/lib/api'
import { queryClient } from '@/providers'

export const useGetSuggestions = (accountId: number | undefined) => {
  return useQuery({
    queryKey: ['analytics', accountId, 'suggestions'],
    queryFn: () => getSuggestions({ account_id: accountId! }),
    enabled: !!accountId,
  })
}

export const useGetDecisions = (accountId: number | undefined) => {
  return useQuery({
    queryKey: ['decisions', accountId],
    queryFn: () => getDecisions(accountId!),
    enabled: !!accountId,
  })
}

export const useGetIdeas = (accountId: number | undefined) => {
  return useQuery({
    queryKey: ['ideas', accountId],
    queryFn: () => getIdeas(accountId!),
    enabled: !!accountId,
    refetchInterval: (q) => (q.state.data?.running ? 10_000 : false),
  })
}

export const useGetSimilarPosts = (accountId: number | undefined, queries: { key: string; text: string; topic?: string | null }[]) => {
  return useQuery({
    queryKey: ['similar', accountId, queries],
    queryFn: () => getSimilarPosts({ account_id: accountId!, queries }),
    enabled: !!accountId && queries.length > 0,
    staleTime: 5 * 60_000,
  })
}

export const useSaveDecision = (accountId: number) => {
  return useMutation({
    mutationFn: ({ key, status }: { key: string; status: DecisionStatus | null }) => saveDecision({ account_id: accountId, key, status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['decisions', accountId] }),
  })
}

export const useGenerateIdeas = (accountId: number) => {
  return useMutation({
    mutationFn: (focus: string | null) => generateIdeas({ account_id: accountId, focus }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas', accountId] })
      queryClient.invalidateQueries({ queryKey: ['settings', 'claude'] })
    },
  })
}

export const useCreateDraftFromIdea = (accountId: number) => {
  return useMutation({
    mutationFn: createDraftFromIdea,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['planned', accountId] }),
  })
}
