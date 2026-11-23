import type { ExportFileResult } from '@/lib/api'
import { fmtNumber } from '@/lib/format'

/** One short line per file for the pop-up, e.g. "Posts: 12 new, 20 with new numbers" */
export function summaryOf(r: ExportFileResult): string {
  if (r.kind === 'content') {
    const parts = [r.posts_created && `${r.posts_created} new`, r.posts_updated && `${r.posts_updated} with new numbers`].filter(Boolean)
    return `Posts: ${parts.length ? parts.join(', ') : 'no changes'}`
  }
  const label = r.kind === 'followers' ? 'Followers' : 'Visitors'
  const changedDays = (r.days_new ?? 0) + (r.days_changed ?? 0)
  const breakdown = r.demographic_status && r.demographic_status !== 'unchanged'
  if (!changedDays && !breakdown) return `${label}: no changes`
  return `${label}: ${[changedDays && `${changedDays} day${changedDays === 1 ? '' : 's'}`, breakdown && 'breakdown'].filter(Boolean).join(' + ')} updated`
}

export const plural = (n: number, word: string) => `${fmtNumber(n)} ${word}${n === 1 ? '' : 's'}`
