import type { ChartMetric } from '@/pages/data/components/MetricsChart'
import type { Checkpoint } from '@/lib/api'

export const AGE: Record<Checkpoint, string> = { '1h': '1 hour', '6h': '6 hours', '24h': '24 hours', '48h': '48 hours', '7d': '7 days' }
export const MIN_FOR_TYPICAL = 5

const sum = (vals: (number | null)[]) => (vals.some((v) => v != null) ? vals.reduce<number>((a, v) => a + (v ?? 0), 0) : null)

export const PERIOD_METRICS: ChartMetric[] = [
  { value: 'impressions', label: 'Impressions', get: (d) => d.impressions },
  { value: 'clicks', label: 'Clicks', get: (d) => d.clicks },
  { value: 'engagements', label: 'All engagements', get: (d) => sum([d.clicks, d.reactions, d.comments, d.reposts]) },
  { value: 'reactions', label: 'Reactions', get: (d) => d.reactions },
  { value: 'comments', label: 'Comments', get: (d) => d.comments },
  { value: 'reposts', label: 'Reposts', get: (d) => d.reposts },
  { value: 'unique_visitors', label: 'Page visitors', get: (d) => d.unique_visitors },
  { value: 'new_followers', label: 'New followers', get: (d) => d.new_followers },
]
