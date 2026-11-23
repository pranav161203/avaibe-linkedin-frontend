import type { Checkpoint, MetricField, PostFormat } from '@/lib/api'

// Fields shown for every format, plus the format-specific ones
export const COMMON: MetricField[] = ['impressions', 'members_reached', 'reactions', 'comments', 'reposts', 'clicks', 'followers_gained']

export const EXTRA: Partial<Record<PostFormat, MetricField[]>> = {
  video: ['video_views'],
  poll: ['poll_votes'],
  newsletter: ['newsletter_views', 'newsletter_subscribers'],
}

export const CHECKPOINT_HOURS: Record<Checkpoint, number> = { '1h': 1, '6h': 6, '24h': 24, '48h': 48, '7d': 168 }
