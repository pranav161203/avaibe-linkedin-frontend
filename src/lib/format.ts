import type { PostFormat } from './api'

export const FORMAT_LABELS: Record<PostFormat, string> = {
  image: 'Image',
  carousel: 'Carousel',
  video: 'Video',
  poll: 'Poll',
  newsletter: 'Article',
  text: 'Text',
  untagged: 'Not tagged yet',
}

export const METRIC_LABELS: Record<string, string> = {
  impressions: 'Impressions',
  members_reached: 'Members reached',
  engagements: 'Engagements',
  engagement_rate: 'Engagement rate',
  click_rate: 'Click rate',
  clicks: 'Clicks',
  reactions: 'Reactions',
  comments: 'Comments',
  reposts: 'Reposts',
  video_views: 'Video views',
  poll_votes: 'Poll votes',
  newsletter_views: 'Article / newsletter views',
  newsletter_subscribers: 'Newsletter subscribers',
  followers_gained: 'Followers gained',
  uae_impressions: 'Est. UAE impressions',
  education_impressions: 'Est. education impressions',
  decision_maker_impressions: 'Est. decision-maker impressions',
  uae_share: 'UAE share of viewers',
  education_share: 'Education share of viewers',
  decision_maker_share: 'Decision-maker share',
}

export const DIMENSION_LABELS: Record<string, string> = {
  location: 'Location',
  industry: 'Industry',
  seniority: 'Seniority',
  job_title: 'Job title',
  job_function: 'Job function',
  company_size: 'Company size',
  company: 'Company',
}

export const AUDIENCE_METRICS = new Set([
  'uae_impressions',
  'education_impressions',
  'decision_maker_impressions',
  'uae_share',
  'education_share',
  'decision_maker_share',
])

const RATE_METRICS = new Set(['engagement_rate', 'click_rate', 'uae_share', 'education_share', 'decision_maker_share'])

export function fmtNumber(v: number | null | undefined, digits = 0): string {
  if (v === null || v === undefined) return '—'
  return v.toLocaleString('en-US', { maximumFractionDigits: digits })
}

export function fmtPct(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—'
  return `${(v * 100).toFixed(1)}%`
}

export function fmtMetric(metric: string, v: number | null | undefined): string {
  if (RATE_METRICS.has(metric)) return fmtPct(v)
  return fmtNumber(v, metric.endsWith('_impressions') ? 0 : 1)
}

export function metricLabel(m: string): string {
  return METRIC_LABELS[m] ?? m
}

/** Confidence as a percentage. Measured (share of the account's own posts that back it) or Claude's own estimate;
 * suggestions with neither (best practice, data fixes) show no number rather than an invented one. */
export const MEASURED_TIP = 'Measured on your own posts: the share of the posts this rests on that back it.'
export const CLAUDE_TIP = 'Claude’s own estimate, from the evidence it was given. Not a measurement.'
