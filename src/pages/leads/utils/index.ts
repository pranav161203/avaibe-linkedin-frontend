import { differenceInCalendarDays } from 'date-fns'
import type { Lead, LeadInput } from '@/lib/api'
import { fmtNumber } from '@/lib/format'
import { STALE_DAYS } from '../constants'

export const aed = (v: number | null | undefined) => (v == null ? '–' : `AED ${fmtNumber(v)}`)

export const daysSinceUpdate = (l: Lead) => differenceInCalendarDays(new Date(), new Date(l.updated_at))

export const isStale = (l: Lead) => !['won', 'lost'].includes(l.stage) && daysSinceUpdate(l) >= STALE_DAYS

export function replyHours(l: Lead, now = Date.now()): number {
  const start = new Date(`${l.received_on}T00:00:00+04:00`).getTime()
  const end = l.replied_at ? new Date(l.replied_at).getTime() : now
  return Math.max(0, (end - start) / 3_600_000)
}

export const fmtHours = (h: number) => (h < 1 ? 'under 1 h' : h < 48 ? `${Math.round(h)} h` : `${Math.round(h / 24)} days`)

export const sourceKnown = (l: Lead) => l.source !== 'other' || !!l.how_heard

export const yesNo = (v: boolean | null) => (v == null ? '' : v ? 'yes' : 'no')

export const toInput = (l: Lead): LeadInput => ({
  account_id: l.account_id,
  received_on: l.received_on,
  source: l.source,
  post_id: l.post_id,
  via_account_id: l.via_account_id,
  company: l.company,
  industry: l.industry,
  in_uae: l.in_uae,
  role: l.role,
  decision_maker: l.decision_maker,
  service: l.service,
  stage: l.stage,
  value_aed: l.value_aed,
  closed_on: l.closed_on,
  notes: l.notes,
  how_heard: l.how_heard,
  utm_source: l.utm_source,
  utm_medium: l.utm_medium,
  utm_campaign: l.utm_campaign,
  replied_at: l.replied_at,
  qualified: l.qualified,
})
