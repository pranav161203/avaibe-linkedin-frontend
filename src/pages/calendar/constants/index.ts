import type { CalendarKind } from '@/lib/api'

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
