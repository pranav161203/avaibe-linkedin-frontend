import { useMutation, useQuery } from '@tanstack/react-query'
import { deletePlannedPost, getPlannedPosts, markPlannedPosted, plannedPostAction } from '@/lib/api'
import { queryClient } from '@/providers'

export const invalidatePlanned = (accountId: number) => {
  queryClient.invalidateQueries({ queryKey: ['planned', accountId] })
  queryClient.invalidateQueries({ queryKey: ['posts'] })
  queryClient.invalidateQueries({ queryKey: ['analytics', accountId] })
  queryClient.invalidateQueries({ queryKey: ['calendar', accountId] })
}

export const useGetPlannedPosts = (accountId: number | undefined) => {
  return useQuery({
    queryKey: ['planned', accountId],
    queryFn: () => getPlannedPosts(accountId!),
    enabled: !!accountId,
    refetchInterval: 30_000,
  })
}

export const usePlannedPostAction = (accountId: number, id: number) => {
  return useMutation({
    mutationFn: (action: 'approve' | 'unapprove' | 'publish') => plannedPostAction({ id, action }),
    onSettled: () => invalidatePlanned(accountId),
  })
}

export const useSchedulePlannedPost = (accountId: number, id: number) => {
  return useMutation({
    mutationFn: (now: boolean) => plannedPostAction({ id, action: 'approve', now }),
    onSettled: () => invalidatePlanned(accountId),
  })
}

export const useDeletePlannedPost = (accountId: number, id: number) => {
  return useMutation({
    mutationFn: () => deletePlannedPost(id),
    onSettled: () => invalidatePlanned(accountId),
  })
}

export const useMarkPlannedPosted = (accountId: number, id: number) => {
  return useMutation({
    mutationFn: (postUrl: string) => markPlannedPosted({ id, postUrl }),
    onSettled: () => invalidatePlanned(accountId),
  })
}
