import { useMutation, useQuery } from '@tanstack/react-query'
import {
  createPost,
  deletePageAudience,
  deletePost,
  deleteSnapshot,
  getDueSnapshots,
  getLastImports,
  getOverview,
  getPageAudience,
  getPageDaily,
  getPost,
  getPosts,
  importCsv,
  importLinkedInExport,
  savePageAudience,
  savePostAudience,
  saveSnapshot,
  updatePost,
  type AudienceRow,
  type Checkpoint,
  type CheckpointQ,
  type PageAudienceInput,
  type PostInput,
  type SnapshotInput,
} from '@/lib/api'
import { queryClient } from '@/providers'

export const invalidateAccountData = (accountId: number, postId?: number) => {
  queryClient.invalidateQueries({ queryKey: ['posts'] })
  queryClient.invalidateQueries({ queryKey: ['analytics', accountId] })
  if (postId) queryClient.invalidateQueries({ queryKey: ['post', postId] })
}

export const useGetPosts = (accountId: number | undefined, opts: { format?: string; checkpoint?: CheckpointQ } = {}) => {
  return useQuery({
    queryKey: ['posts', accountId, opts],
    queryFn: () => getPosts({ account_id: accountId!, ...opts }),
    enabled: !!accountId,
  })
}

export const useGetAllPosts = () => {
  return useQuery({
    queryKey: ['posts', 'all'],
    queryFn: () => getPosts({}),
  })
}

export const useGetPost = (id: number) => {
  return useQuery({
    queryKey: ['post', id],
    queryFn: () => getPost(id),
  })
}

export const useGetOverview = (accountId: number | undefined, checkpoint: CheckpointQ) => {
  return useQuery({
    queryKey: ['analytics', accountId, 'overview', checkpoint],
    queryFn: () => getOverview({ account_id: accountId!, checkpoint }),
    enabled: !!accountId,
  })
}

export const useGetDueSnapshots = (accountId: number | undefined) => {
  return useQuery({
    queryKey: ['analytics', accountId, 'due'],
    queryFn: () => getDueSnapshots({ account_id: accountId! }),
    enabled: !!accountId,
  })
}

export const useGetPageAudience = (accountId: number | undefined) => {
  return useQuery({
    queryKey: ['page-audience', accountId],
    queryFn: () => getPageAudience(accountId!),
    enabled: !!accountId,
  })
}

export const useGetPageDaily = (accountId: number | undefined) => {
  return useQuery({
    queryKey: ['page-daily', accountId],
    queryFn: () => getPageDaily(accountId!),
    enabled: !!accountId,
  })
}

export const useGetLastImports = (accountId: number) => {
  return useQuery({
    queryKey: ['last-imports', accountId],
    queryFn: () => getLastImports(accountId),
    staleTime: 60_000,
  })
}

export const useSavePost = (postId?: number) => {
  return useMutation({
    mutationFn: (body: PostInput) => (postId ? updatePost({ id: postId, body }) : createPost(body)),
    onSuccess: (post) => invalidateAccountData(post.account_id, post.id),
  })
}

export const useDeletePost = (accountId: number) => {
  return useMutation({
    mutationFn: deletePost,
    onSuccess: () => invalidateAccountData(accountId),
  })
}

export const useSaveSnapshot = (postId: number, accountId: number) => {
  return useMutation({
    mutationFn: ({ checkpoint, body }: { checkpoint: Checkpoint; body: SnapshotInput }) => saveSnapshot({ postId, checkpoint, body }),
    onSuccess: () => invalidateAccountData(accountId, postId),
  })
}

export const useDeleteSnapshot = (postId: number, accountId: number) => {
  return useMutation({
    mutationFn: (checkpoint: Checkpoint) => deleteSnapshot({ postId, checkpoint }),
    onSuccess: () => invalidateAccountData(accountId, postId),
  })
}

export const useSavePostAudience = (postId: number, accountId: number) => {
  return useMutation({
    mutationFn: (rows: AudienceRow[]) => savePostAudience({ postId, rows }),
    onSuccess: () => invalidateAccountData(accountId, postId),
  })
}

export const useSavePageAudience = (accountId: number) => {
  return useMutation({
    mutationFn: (body: PageAudienceInput) => savePageAudience({ accountId, body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['page-audience', accountId] }),
  })
}

export const useDeletePageAudience = (accountId: number) => {
  return useMutation({
    mutationFn: ({ as_of, audience }: { as_of: string; audience: string }) => deletePageAudience({ accountId, as_of, audience }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['page-audience', accountId] }),
  })
}

export const useImportCsv = (accountId: number) => {
  return useMutation({
    mutationFn: (file: File) => importCsv({ accountId, file }),
    onSuccess: () => invalidateAccountData(accountId),
  })
}

export const useImportLinkedInExport = (accountId: number) => {
  return useMutation({
    mutationFn: ({ files, exportedOn, confirmProfile }: { files: File[]; exportedOn: string | null; confirmProfile?: boolean }) =>
      importLinkedInExport({ accountId, files, exportedOn, confirmProfile }),
    onSuccess: () => {
      invalidateAccountData(accountId)
      queryClient.invalidateQueries({ queryKey: ['page-daily', accountId] })
      queryClient.invalidateQueries({ queryKey: ['page-audience', accountId] })
      queryClient.invalidateQueries({ queryKey: ['last-imports', accountId] })
    },
  })
}
