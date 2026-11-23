import type { ChartMetric } from '@/pages/data/components/MetricsChart'
import { sum } from '../utils'

/** LinkedIn-style tabs: by where the data comes from. Founders' profiles have no visitor data. */
export const TABS = [
  { value: 'analytics', label: 'Analytics' },
  { value: 'posts', label: 'Posts' },
  { value: 'visitors', label: 'Visitors', companyOnly: true },
  { value: 'followers', label: 'Followers' },
] as const

/** Old links (?tab=timing etc.) still land in the right place */
export const LEGACY: Record<string, string> = {
  rankings: 'posts',
  content: 'analytics', // the tab was called Content
  formats: 'analytics',
  timing: 'analytics',
  consistency: 'analytics',
  audience: 'followers',
}

export const CONTENT_METRICS: ChartMetric[] = [
  { value: 'impressions', label: 'Impressions', get: (d) => d.impressions },
  { value: 'clicks', label: 'Clicks', get: (d) => d.clicks },
  { value: 'comments', label: 'Comments', get: (d) => d.comments },
  { value: 'engagements', label: 'All engagements', get: (d) => sum([d.clicks, d.reactions, d.comments, d.reposts]) },
]

export const VISITOR_METRICS: ChartMetric[] = [
  { value: 'page_views', label: 'Page views', get: (d) => d.page_views },
  { value: 'unique_visitors', label: 'Unique visitors', get: (d) => d.unique_visitors },
]

export const FOLLOWER_METRICS: ChartMetric[] = [{ value: 'new_followers', label: 'New followers', get: (d) => d.new_followers }]

