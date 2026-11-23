import { CHECKPOINTS, type Post } from '@/lib/api'

export function latestImpressions(p: Post): number {
  const snaps = [...p.snapshots].sort((a, b) => CHECKPOINTS.indexOf(a.checkpoint) - CHECKPOINTS.indexOf(b.checkpoint))
  return snaps.at(-1)?.impressions ?? 0
}

export function latestClicks(p: Post): number {
  const snaps = [...p.snapshots].sort((a, b) => CHECKPOINTS.indexOf(a.checkpoint) - CHECKPOINTS.indexOf(b.checkpoint))
  return snaps.at(-1)?.clicks ?? 0
}
