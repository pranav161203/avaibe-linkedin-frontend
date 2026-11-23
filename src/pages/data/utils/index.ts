import type { Post } from '@/lib/api'

export const sum = (vals: (number | null)[]) => {
  const v = vals.filter((x): x is number => x != null)
  return v.length ? v.reduce((a, b) => a + b, 0) : null
}

export const postDate = (p: Post) => p.published_at_uae.slice(0, 10)

export const postImpressions = (p: Post) => p.snapshots[p.snapshots.length - 1]?.impressions ?? null

export const median = (xs: number[]) => {
  if (!xs.length) return null
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
