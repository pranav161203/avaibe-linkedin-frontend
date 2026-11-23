import type { Post, Snapshot } from '@/lib/api'
import { MIN_FOR_TYPICAL } from '../constants/posts'

export type SortKey = 'date' | 'impressions' | 'views' | 'clicks' | 'ctr' | 'reactions' | 'comments' | 'reposts' | 'vs'

export interface Row {
  post: Post
  latest?: Snapshot
  impressions: number | null
  views: number | null
  clicks: number | null
  ctr: number | null
  reactions: number | null
  comments: number | null
  reposts: number | null
  vs: number | null // impressions ÷ the account's typical post at the same age
}

const median = (v: number[]) => {
  if (!v.length) return null
  const s = [...v].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/** First line of the caption, like LinkedIn's "Post title" */
export function postTitle(p: Post): string {
  const first = (p.caption ?? '').split('\n').find((l) => l.trim())?.trim()
  return first || p.topic || p.ref || `Post ${p.id}`
}

export function buildRows(posts: Post[]): Row[] {
  // Typical impressions per account and age (checkpoint), from all of that account's posts
  const byKey = new Map<string, number[]>()
  for (const p of posts) {
    for (const s of p.snapshots) {
      if (s.impressions == null) continue
      const k = `${p.account_id}:${s.checkpoint}`
      byKey.set(k, [...(byKey.get(k) ?? []), s.impressions])
    }
  }
  return posts.map((p) => {
    const latest = p.snapshots[p.snapshots.length - 1]
    const imp = latest?.impressions ?? null
    const peers = latest ? byKey.get(`${p.account_id}:${latest.checkpoint}`) ?? [] : []
    const typical = peers.length >= MIN_FOR_TYPICAL ? median(peers) : null
    return {
      post: p,
      latest,
      impressions: imp,
      views: latest?.video_views ?? latest?.newsletter_views ?? null,
      clicks: latest?.clicks ?? null,
      ctr: latest?.click_rate ?? null,
      reactions: latest?.reactions ?? null,
      comments: latest?.comments ?? null,
      reposts: latest?.reposts ?? null,
      vs: imp != null && typical ? imp / typical : null,
    }
  })
}

/** Why a post has no view count (shown on hover), so a blank isn't mistaken for missing data */
export function viewsBlankReason(format: string): string {
  if (format === 'video') return 'Video views not recorded yet (LinkedIn’s API keeps them for about 6 months)'
  if (format === 'newsletter') return 'Article views come only from LinkedIn’s Excel export, not the API'
  if (format === 'untagged') return 'Set the post type to see whether views apply'
  return 'LinkedIn doesn’t count views for this post type (only for videos and articles)'
}
