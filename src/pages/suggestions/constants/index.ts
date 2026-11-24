import type { DecisionStatus, Idea, SimilarResult, Suggestion } from '@/lib/api'

export const TOP = 3

export const VISIBLE = 5

export const PRIORITY: Record<Suggestion['priority'], { label: string; cls: string }> = {
  high: { label: 'High priority', cls: 'border-bad/40 bg-bad/10 text-bad-fg' },
  medium: { label: 'Medium priority', cls: 'border-info/40 bg-info/10 text-info-fg' },
  low: { label: 'Low priority', cls: 'border-border bg-muted text-muted-foreground' },
}

export const IDEA_TYPE: Record<Idea['type'], string> = {
  post: 'Post',
  campaign: 'Campaign / series',
  outreach: 'Outreach',
  brand: 'Brand',
  seo_aeo: 'SEO / AEO',
  leads: 'Leads',
  sales: 'Sales',
}

export const STATUS_LABEL: Record<DecisionStatus, string> = {
  later: 'Later',
  dismissed: 'Dismissed',
  done: 'Done',
}

export const VERDICT: Record<NonNullable<SimilarResult['verdict']>, { text: string; cls: string }> = {
  above: { text: 'above your typical post', cls: 'text-good-fg' },
  similar: { text: 'about your typical post', cls: 'text-muted-foreground' },
  below: { text: 'below your typical post', cls: 'text-bad-fg' },
}
