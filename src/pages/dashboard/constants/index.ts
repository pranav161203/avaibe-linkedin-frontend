import type { Shares } from '@/lib/api'

export const GROUPS: { key: keyof Shares; label: string; hint: string; color: string }[] = [
  { key: 'uae_share', label: 'In the UAE', hint: 'Located in the UAE', color: 'var(--chart-1)' },
  { key: 'decision_maker_share', label: 'Decision-makers', hint: 'Owners, CXOs, VPs, directors', color: 'var(--chart-2)' },
  { key: 'education_share', label: 'Education sector', hint: 'Schools, e-learning, education', color: 'var(--chart-3)' },
  { key: 'tech_share', label: 'Technology professionals', hint: 'Engineering and IT roles', color: 'var(--chart-4)' },
  { key: 'partner_share', label: 'Potential partners', hint: 'Business development and consulting', color: 'var(--chart-5)' },
]
