import { toast } from 'sonner'

export const plural = (n: number) => `${n} minute${n === 1 ? '' : 's'}`

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('Post text copied. Paste it on LinkedIn.')
  } catch {
    toast.error('Couldn’t copy. Open Edit and select the text instead.')
  }
}
