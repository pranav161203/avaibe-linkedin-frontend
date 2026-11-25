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
      text: `UAE public holiday (${uae.title}${uae.status === 'expected' ? ', date expected' : ''}). Most decision-makers are unavailable. Avoid business posts; a short greeting is appropriate.`,
    })
  } else if (UAE_WEEKEND.has(d.getDay())) {
    lines.push({ tone: 'quiet', text: 'UAE weekend. Business posts typically perform better on working days.' })
  }
  if (ramadan) {
    lines.push({
      tone: 'note',
      text: 'Ramadan: shorter working hours and later evening activity. The usual best time may not apply; consider testing an evening slot.',
    })
  }
  if (d.getDay() === 5 && !uae) {
    lines.push({ tone: 'note', text: 'Friday: shorter working day in the UAE, with prayers around midday.' })
  }
  if (india) {
    lines.push({
      tone: 'note',
      text: `${india.title} in India${india.note ? ` (${india.note.toLowerCase()})` : ''}. Early engagement may be lower if a large share of followers are in India.`,
    })
  }
  if (summer && !uae) {
    lines.push({ tone: 'note', text: 'UAE summer: activity is typically lower due to travel. Compare results with other summer posts.' })
  }
  if (t.ready && adv) {
    for (const key of adv.labels) {
      const e = t.special[key]
      if (!e || e.posts === 0) continue
      const what = `${e.posts} past post${e.posts === 1 ? '' : 's'} on ${e.label.replace(/ \(.*\)$/, '')}`
      if (e.verdict === 'better' || e.verdict === 'worse') {
        lines.push({ tone: e.verdict === 'worse' ? 'quiet' : 'good', text: `Historical data: ${what} achieved ${e.lift.toFixed(2)}× a typical day (range ${e.low.toFixed(2)}–${e.high.toFixed(2)}×).` })
      } else if (e.verdict === 'no_clear_difference') {
        lines.push({ tone: 'note', text: `Historical data: ${what} performed in line with typical days.` })
      } else {
        lines.push({ tone: 'note', text: `Insufficient data: ${what}.` })
      }
    }
  }
  if (isPast) return lines.filter((l) => l.tone !== 'good')
  if (!t.ready) {
    lines.push({ tone: 'note', text: `${t.reason} Posts imported from a LinkedIn export only have a date.` })
  } else if (adv && !uae && !UAE_WEEKEND.has(d.getDay())) {
    if (proven(data, adv)) {
      lines.push({ tone: 'good', text: `Recommended time: ${adv.best_slot} UAE, ${pct(adv.best_lift)} vs a typical slot. Supported by historical and recent post performance.` })
    } else {
      lines.push({
        tone: 'note',
        text: `No proven best time yet. Any time between 8 AM and 6 PM UAE is suitable; ${adv.best_slot} is slightly ahead but not yet proven. Content has more impact than timing.`,
      })
    }
    if (adv.test_slot) {
      lines.push({ tone: 'note', text: `Suggested test slot: ${adv.test_slot} (insufficient data on ${adv.weekday}s).` })
    }
  }
  return lines
}

export const proven = (data: CalendarData, adv: DateAdvice) => data.timing.ready && data.timing.backtest.verdict === 'helps' && adv.clear
export const pct = (lift: number) => `${lift >= 1 ? '+' : '−'}${Math.round(Math.abs(lift - 1) * 100)}%`
