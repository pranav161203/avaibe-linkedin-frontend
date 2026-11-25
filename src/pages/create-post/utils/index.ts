import { toast } from 'sonner'
import { getPlannedImageUrl, getPlannedMediaUrl, type PlannedFormat, type PlannedPost, type ChatTurn } from '@/lib/api'
import { fetchAsFile } from '@/lib/attachment'
import type { Visual } from '../types'

export function hookPreview(caption: string): string {
  const lines = caption.trim().split('\n').slice(0, 3).join(' ').replace(/\s+/g, ' ')
  return lines.length > 210 ? `${lines.slice(0, 210).trimEnd()}…` : lines
}

export function visualFor(
  format: PlannedFormat,
  {
    file,
    media,
    removeImage,
    initial,
  }: {
    file: File | null
    media: File | null
    removeImage: boolean
    initial?: PlannedPost
  },
): Visual {
  if (format === 'image') {
    if (file)
      return {
        key: `new:${file.name}:${file.size}`,
        name: file.name,
        kind: 'image',
        load: async () => file,
      }
    if (initial?.has_image && !removeImage) {
      const url = getPlannedImageUrl(initial.id, initial.approved_at ?? 'x')
      return {
        key: `saved-image:${initial.id}`,
        name: 'the saved image',
        kind: 'image',
        load: () => fetchAsFile(url, 'image.jpg'),
      }
    }
  }
  if (format === 'carousel' || format === 'video') {
    const kind = format === 'carousel' ? 'pdf' : 'video'
    if (media)
      return {
        key: `new:${media.name}:${media.size}`,
        name: media.name,
        kind,
        load: async () => media,
      }
    if (initial?.has_media && initial.format === format) {
      const name = initial.media_name ?? (kind === 'pdf' ? 'carousel.pdf' : 'video')
      return {
        key: `saved-media:${initial.id}`,
        name,
        kind,
        load: () => fetchAsFile(getPlannedMediaUrl(initial.id), name),
      }
    }
  }
  return null
}

export async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('Copied')
  } catch {
    toast.error('Copy failed. Select the text manually.')
  }
}

export function assistantText(t: ChatTurn): string {
  const parts = [t.message]
  if (t.questions.length) parts.push(t.questions.map((q) => `- ${q.question} (options: ${q.options.join(' / ')})`).join('\n'))
  if (t.draft_text) parts.push(`Proposed post:\n${t.draft_text}`)
  return parts.join('\n\n')
}
