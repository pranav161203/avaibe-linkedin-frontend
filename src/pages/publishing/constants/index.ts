import type { PlannedPost, PlannedStatus } from '@/lib/api'
import { dueByHand, needsAction } from '@/lib/publishing'

export const STATUS: Record<PlannedStatus, { label: string; cls: string }> = {
  draft: { label: 'Unpublished', cls: 'bg-muted text-foreground border-border' },
  approved: { label: 'Scheduled', cls: 'bg-info/10 text-info-fg border-info/30' },
  publishing: { label: 'Publishing…', cls: 'bg-info/10 text-info-fg border-info/30' },
  published: { label: 'Published', cls: 'bg-good/15 text-good-fg border-good/30' },
  failed: { label: 'Failed', cls: 'bg-bad/10 text-bad-fg border-bad/40' },
  missed: { label: 'Missed', cls: 'bg-serious/15 text-serious-fg border-serious/40' },
}

export const STATUS_FILTERS: { value: string; label: string; test: (p: PlannedPost) => boolean }[] = [
  { value: 'all', label: 'All', test: () => true },
  { value: 'action', label: 'Needs action', test: needsAction },
  { value: 'draft', label: 'Unpublished', test: (p) => p.status === 'draft' || dueByHand(p) },
  { value: 'approved', label: 'Scheduled', test: (p) => (p.status === 'approved' && !dueByHand(p)) || p.status === 'publishing' },
  { value: 'published', label: 'Published', test: (p) => p.status === 'published' },
  { value: 'problem', label: 'Failed or missed', test: (p) => p.status === 'failed' || p.status === 'missed' },
]

export const GROUPS: { value: string; label: string; test: (p: PlannedPost) => boolean }[] = [
  { value: 'unpublished', label: 'Unpublished', test: (p) => p.status === 'draft' || dueByHand(p) },
  { value: 'scheduled', label: 'Scheduled', test: (p) => (p.status === 'approved' && !dueByHand(p)) || p.status === 'publishing' },
  { value: 'problem', label: 'Failed or missed', test: (p) => p.status === 'failed' || p.status === 'missed' },
  { value: 'published', label: 'Published', test: (p) => p.status === 'published' },
]
