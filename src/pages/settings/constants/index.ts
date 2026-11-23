import type { Account, SegmentSettings } from '@/lib/api'

export const TABS = ['general', 'team', 'audience', 'performance', 'claude'] as const

export const KIND_LABELS: Record<Account['kind'], string> = {
  company: 'Company page',
  founder: 'Founder profile',
  personal: 'Personal profile',
}

export const SEGMENT_FIELDS: { key: keyof SegmentSettings; label: string; hint: string }[] = [
  { key: 'uae_country', label: 'UAE: country names', hint: 'A location matching one of these counts as the whole UAE (cities are not added on top).' },
  { key: 'uae_cities', label: 'UAE: cities and emirates', hint: 'Used when LinkedIn lists cities instead of the country. Their shares are added together.' },
  { key: 'education_industry', label: 'Education: industry keywords', hint: 'An industry containing any of these words counts as education.' },
  { key: 'decision_seniority', label: 'Decision-makers: seniority levels', hint: 'LinkedIn seniority values that count as decision-makers.' },
  { key: 'decision_titles', label: 'Decision-makers: job title keywords', hint: 'Used only when a post has no seniority breakdown.' },
  { key: 'tech_functions', label: 'Technology professionals: job functions', hint: 'LinkedIn job functions that count as technology professionals (CTOs, IT managers, engineers).' },
  { key: 'partner_functions', label: 'Potential partners: job functions', hint: 'LinkedIn job functions that count as potential partners (consultants, business development).' },
]
