import { toast } from 'sonner'

export const plural = (n: number) => `${n} minute${n === 1 ? '' : 's'}`

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('Post text copied.')
  } catch {
    toast.error('Copy failed. Open the post and copy the text manually.')
  }
}
