import { useMutation, useQuery } from '@tanstack/react-query'
import {
  analysePost,
  createPlannedPost,
  getPostAssistStatus,
  getPostChatStatus,
  plannedPostAction,
  removePlannedImage,
  sendPostChat,
  updatePlannedPost,
  uploadPlannedImage,
  uploadPlannedMedia,
  type PlannedPostInput,
  type PostAssistBody,
  type PostChatBody,
} from '@/lib/api'
import { queryClient } from '@/providers'
import { invalidatePlanned } from '@/pages/publishing/queries'

type WithAttachment<B> = { body: B; getAttachment: () => Promise<File | null> }

export const useGetPostAssistStatus = (accountId: number) => {
  return useQuery({
    queryKey: ['post-assist', accountId],
    queryFn: () => getPostAssistStatus(accountId),
    staleTime: 30_000,
  })
}

export const useGetPostChatStatus = (accountId: number) => {
  return useQuery({
    queryKey: ['post-chat', accountId],
    queryFn: () => getPostChatStatus(accountId),
    staleTime: 30_000,
  })
}

export const useAnalysePost = (accountId: number) => {
  return useMutation({
    mutationFn: async ({ body, getAttachment }: WithAttachment<PostAssistBody>) => analysePost({ body, attachment: await getAttachment() }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['post-assist', accountId] }),
  })
}

export const useSendPostChat = (accountId: number) => {
  return useMutation({
    mutationFn: async ({ body, getAttachment }: WithAttachment<PostChatBody>) => sendPostChat({ body, attachment: await getAttachment() }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['post-chat', accountId] }),
  })
}

export interface SavePostArgs {
  id?: number
  body: PlannedPostInput
  image?: File | null
  removeImage?: boolean
  media?: File | null
  approve?: boolean
}

export const useSavePlannedPost = (accountId: number) => {
  return useMutation({
    mutationFn: async ({ id, body, image, removeImage, media, approve }: SavePostArgs) => {
      let saved = id ? await updatePlannedPost({ id, body }) : await createPlannedPost(body)
      if (body.format === 'image' && removeImage) saved = await removePlannedImage(saved.id)
      if (body.format === 'image' && image) saved = await uploadPlannedImage({ id: saved.id, file: image })
      if ((body.format === 'carousel' || body.format === 'video') && media) saved = await uploadPlannedMedia({ id: saved.id, file: media })
      if (approve) saved = await plannedPostAction({ id: saved.id, action: 'approve' })
      return saved
    },
    onSettled: () => invalidatePlanned(accountId),
  })
}
