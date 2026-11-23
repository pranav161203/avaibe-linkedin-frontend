import { toast } from 'sonner'
import type { PlannedPost } from '@/lib/api'

export function sortForGroup(list: PlannedPost[], group: string): PlannedPost[] {
  const t = (iso: string | null | undefined) => (iso ? new Date(iso).getTime() : Infinity)
  return [...list].sort((a, b) => (group === 'published' ? t(b.published_at) - t(a.published_at) : t(a.scheduled_at) - t(b.scheduled_at)))
}

export const plural = (n: number) => `${n} minute${n === 1 ? '' : 's'}`

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('Post text copied. Paste it on LinkedIn.')
  } catch {
    toast.error('Couldn’t copy. Open Edit and select the text instead.')
  }
}
