import type { Account, SegmentSettings } from '@/lib/api'

export const TABS = ['general', 'team', 'companies', 'audience', 'performance', 'claude'] as const

export const KIND_LABELS: Record<Account['kind'], string> = {
  company: 'Company page',
  founder: 'Founder profile',
  personal: 'Personal profile',
}

export const SEGMENT_FIELDS: { key: keyof SegmentSettings; label: string; hint: string }[] = [
  { key: 'uae_country', label: 'UAE: country names', hint: 'Locations matching these names count as the UAE. City shares are not added on top.' },
  { key: 'uae_cities', label: 'UAE: cities and emirates', hint: 'Used when LinkedIn reports cities rather than the country. Shares are combined.' },
  { key: 'education_industry', label: 'Education: industry keywords', hint: 'Industries containing any of these keywords count as education.' },
  { key: 'decision_seniority', label: 'Decision-makers: seniority levels', hint: 'LinkedIn seniority levels classified as decision-makers.' },
  { key: 'decision_titles', label: 'Decision-makers: job title keywords', hint: 'Used only when seniority data is unavailable for a post.' },
  { key: 'tech_functions', label: 'Technology professionals: job functions', hint: 'LinkedIn job functions classified as technology professionals.' },
  { key: 'partner_functions', label: 'Potential partners: job functions', hint: 'LinkedIn job functions classified as potential partners.' },
]
