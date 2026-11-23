import { parseISO } from 'date-fns'
import type { CalendarData, CalendarItem, DateAdvice } from '@/lib/api'

export const UAE_WEEKEND = new Set([6, 0])
export const SLOT_START: Record<string, string> = {
  '8-10 AM': '08:00',
  '10 AM-12 PM': '10:00',
  '12-2 PM': '12:00',
  '2-4 PM': '14:00',
  '4-6 PM': '16:00',
  '6-8 PM': '18:00',
}

export function dayAdvice(day: string, items: CalendarItem[], data: CalendarData, isPast: boolean) {
  const d = parseISO(day)
  const uae = items.find((i) => i.kind === 'uae_holiday')
  const india = items.find((i) => i.kind === 'india_holiday')
  const ramadan = items.find((i) => i.kind === 'period' && i.title === 'Ramadan')
  const summer = items.find((i) => i.kind === 'period' && i.title === 'UAE summer')
  const t = data.timing
  const adv = t.ready ? t.days[day] : undefined
  const lines: { tone: 'quiet' | 'note' | 'good'; text: string }[] = []

  if (uae) {
    lines.push({
      tone: 'quiet',
      text: `UAE public holiday (${uae.title}${uae.status === 'expected' ? ', date expected' : ''}). Decision-makers are mostly off: skip business posts, or share a short greeting.`,
    })
  } else if (UAE_WEEKEND.has(d.getDay())) {
    lines.push({ tone: 'quiet', text: 'Weekend in the UAE. Business posts usually do better on working days.' })
  }
  if (ramadan) {
    lines.push({
      tone: 'note',
      text: 'Ramadan: working hours are shorter and people are often online later in the evening. Your usual best time may not apply. Worth testing an evening slot.',
    })
  }
  if (d.getDay() === 5 && !uae) {
    lines.push({ tone: 'note', text: 'Friday: a short working day for many in the UAE, with Friday prayers around midday.' })
  }
  if (india) {
    lines.push({
      tone: 'note',
      text: `${india.title} in India${india.note ? ` (${india.note.toLowerCase()})` : ''}. If many of your followers are in India, the first hours after posting may be slower.`,
    })
  }
  if (summer && !uae) {
    lines.push({ tone: 'note', text: 'UAE summer: many residents travel, so activity is usually lower. Judge results against other summer posts.' })
  }
  if (t.ready && adv) {
    for (const key of adv.labels) {
      const e = t.special[key]
      if (!e || e.posts === 0) continue
      const what = `your ${e.posts} past post${e.posts === 1 ? '' : 's'} on ${e.label.replace(/ \(.*\)$/, '')}`
      if (e.verdict === 'better' || e.verdict === 'worse') {
        lines.push({ tone: e.verdict === 'worse' ? 'quiet' : 'good', text: `In your data, ${what} got ${e.lift.toFixed(2)}× a normal day (likely ${e.low.toFixed(2)}–${e.high.toFixed(2)}×).` })
      } else if (e.verdict === 'no_clear_difference') {
        lines.push({ tone: 'note', text: `In your data, ${what} did about the same as normal days.` })
      } else {
        lines.push({ tone: 'note', text: `Only ${what}: too few to measure the effect.` })
      }
    }
  }
  if (isPast) return lines.filter((l) => l.tone !== 'good')
  if (!t.ready) {
    lines.push({ tone: 'note', text: `${t.reason} Posts imported from a LinkedIn export only have a date.` })
  } else if (adv && !uae && !UAE_WEEKEND.has(d.getDay())) {
    if (proven(data, adv)) {
      lines.push({ tone: 'good', text: `Best time: ${adv.best_slot} UAE, about ${pct(adv.best_lift)} vs a typical slot. Backed by your past posts and by testing on newer ones.` })
    } else {
      lines.push({
        tone: 'note',
        text: `No proven best time yet: any time between 8 AM and 6 PM UAE is fine. Slightly ahead so far: ${adv.best_slot} (not proven). What you post matters more than when.`,
      })
    }
    if (adv.test_slot) {
      lines.push({ tone: 'note', text: `Worth testing now and then: ${adv.test_slot}, not yet tried enough on ${adv.weekday}s.` })
    }
  }
  return lines
}

export const proven = (data: CalendarData, adv: DateAdvice) => data.timing.ready && data.timing.backtest.verdict === 'helps' && adv.clear
export const pct = (lift: number) => `${lift >= 1 ? '+' : '−'}${Math.round(Math.abs(lift - 1) * 100)}%`
