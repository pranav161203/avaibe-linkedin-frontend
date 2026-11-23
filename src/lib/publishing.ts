import type { PlannedFormat, PlannedPost } from '@/lib/api'

export const PLANNED_FORMAT_LABELS: Record<PlannedFormat, string> = {
  text: 'Text',
  image: 'Image',
  carousel: 'Carousel',
  video: 'Video',
  article: 'Article',
  poll: 'Poll',
}

export function needsAction(p: PlannedPost): boolean {
  return p.status === 'draft' || p.status === 'failed' || p.status === 'missed' || dueByHand(p)
}

export function dueByHand(p: PlannedPost): boolean {
  return p.status === 'approved' && p.by_hand && (!p.scheduled_at || new Date(p.scheduled_at).getTime() <= Date.now())
}
