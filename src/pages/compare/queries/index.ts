import { useMutation, useQueries, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { comparePosts, getPost, getPostAssistStatus, type Checkpoint } from '@/lib/api'
import { queryClient } from '@/providers'

export const useGetPostsByIds = (ids: number[]) => {
  return useQueries({ queries: ids.map((id) => ({ queryKey: ['post', id], queryFn: () => getPost(id) })) })
}

export const useGetCompareStatus = (accountId: number | undefined) => {
  return useQuery({
    queryKey: ['post-assist', accountId],
    queryFn: () => getPostAssistStatus(accountId!),
    enabled: !!accountId,
    staleTime: 30_000,
  })
}

export const useComparePosts = () => {
  return useMutation({
    mutationFn: (body: { account_id: number; post_ids: number[]; checkpoint: Checkpoint }) => comparePosts(body),
    onSuccess: (_data, body) => queryClient.invalidateQueries({ queryKey: ['post-assist', body.account_id] }),
    onError: (e) => toast.error((e as Error).message),
  })
}
