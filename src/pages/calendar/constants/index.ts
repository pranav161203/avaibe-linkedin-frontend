import type { CalendarKind, PlannedFormat } from '@/lib/api'

export type Layer = 'ours' | 'linked' | 'planned' | CalendarKind | 'hints'

export const KIND_META: Record<CalendarKind, { label: string; color: string }> = {
  uae_holiday: { label: 'UAE holidays', color: 'var(--cal-uae)' },
  india_holiday: { label: 'India holidays', color: 'var(--cal-india)' },
  period: { label: 'Special periods', color: 'var(--cal-period)' },
  event: { label: 'Industry events', color: 'var(--cal-event)' },
  awareness: { label: 'Awareness days', color: 'var(--cal-aware)' },
  business: { label: 'Business dates', color: 'var(--cal-biz)' },
}

export const KINDS = Object.keys(KIND_META) as CalendarKind[]

export const ALL_LAYERS: Layer[] = ['ours', 'linked', 'planned', ...KINDS, 'hints']

export const STORE = 'calendar.hidden'

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export type Idea = { title: string; why: string; format: PlannedFormat; topic: string }

export const THEMES: Idea[] = [
  { topic: 'LMS', format: 'carousel', title: 'One LMS problem UAE schools know well, and the fix', why: 'Education technology theme' },
  { topic: 'ERP', format: 'text', title: 'The ERP or CRM headache UAE SMEs complain about most', why: 'ERP and CRM theme' },
  { topic: 'AI in business', format: 'image', title: 'A small, practical AI use any UAE business can start this month', why: 'AI in business theme' },
  { topic: 'Cybersecurity', format: 'carousel', title: 'Five security habits every UAE SME should have', why: 'Cybersecurity for SMEs theme' },
  { topic: 'Cloud', format: 'text', title: 'What moving to the cloud actually changes for a growing company', why: 'Cloud and DevOps theme' },
  { topic: 'Software delivery', format: 'article', title: 'Why software projects slip, and how to keep yours on time', why: 'Software development theme' },
  { topic: 'AVAIBE projects', format: 'image', title: 'Behind a recent AVAIBE project: the problem and what changed', why: 'Your own work (check the client agrees first)' },
]