import { differenceInCalendarDays, getDayOfYear, parseISO } from 'date-fns'
import type { CalendarItem, CalendarPost, PlannedFormat } from '@/lib/api'
import { PLANNED_FORMAT_LABELS } from '@/lib/publishing'
import { THEMES, type Idea } from '../constants'

function eventIdea(item: CalendarItem, daysAway: number): Idea | null {
  const soon = daysAway > 0 ? ` (in ${daysAway} day${daysAway === 1 ? '' : 's'})` : ''
  const t = item.title
  switch (item.kind) {
    case 'uae_holiday':
      if (/commemoration|martyr/i.test(t))
        return { topic: t, format: 'image', title: `${t}: a respectful message of remembrance`, why: `Solemn UAE day${soon}. Quiet and respectful; no promotion, no call to action.` }
      return { topic: t, format: 'image', title: `${t} greeting from the team`, why: `UAE holiday${soon}. Keep it warm and short, no sales pitch.` }
    case 'event':
      return daysAway > 0
        ? { topic: t, format: 'text', title: `Heading to ${t}? What we're looking forward to`, why: `Industry event${soon}: a teaser invites people to meet you there.` }
        : { topic: t, format: 'carousel', title: `Key takeaways from ${t}`, why: 'Industry event today: share what stood out while people are talking about it.' }
    case 'awareness':
      return { topic: t, format: 'carousel', title: `${t}: a practical tip for UAE teams`, why: `Awareness day${soon}. Tie it to something AVAIBE actually helps with.` }
    case 'period':
      return /school/i.test(t)
        ? { topic: 'LMS', format: 'carousel', title: `Using the ${t.toLowerCase()} to get school systems ready`, why: `${t}: school leaders plan ahead in breaks.` }
        : /ramadan/i.test(t)
          ? { topic: t, format: 'image', title: 'Ramadan Kareem from the team, with a note on reduced hours', why: 'Ramadan: a respectful tone; business posts do better after iftar time.' }
          : { topic: t, format: 'text', title: `What ${t.toLowerCase()} means for your business systems`, why: `${t}: relevant to how UAE companies work right now.` }
    case 'business':
      return { topic: t, format: 'text', title: `${t}: how the right software takes the stress out`, why: `Business date${soon}: a timely, practical reminder.` }
    default:
      return null
  }
}

const FORMAT_MAP: Record<string, PlannedFormat> = { image: 'image', carousel: 'carousel', video: 'video', poll: 'poll', newsletter: 'article', text: 'text' }

function bestFormat(posts: CalendarPost[], accountId: number): { format: PlannedFormat; lift: number } | null {
  const by = new Map<string, number[]>()
  for (const p of posts) {
    if (p.account_id !== accountId || p.vs_typical == null) continue
    by.set(p.format, [...(by.get(p.format) ?? []), p.vs_typical])
  }
  let best: { format: PlannedFormat; lift: number } | null = null
  for (const [f, v] of by) {
    if (v.length < 2 || !FORMAT_MAP[f]) continue
    const s = [...v].sort((a, b) => a - b)
    const med = s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2
    if (med > 1.1 && (!best || med > best.lift)) best = { format: FORMAT_MAP[f], lift: med }
  }
  return best
}

export function dayIdeas(day: string, items: CalendarItem[], posts: CalendarPost[], accountId: number): Idea[] {
  const d = parseISO(day)
  const ideas: Idea[] = []
  const near = items
    .map((i) => ({ i, away: differenceInCalendarDays(parseISO(i.start), d) }))
    .filter(({ i, away }) => (i.start <= day && i.end >= day) || (away > 0 && away <= 7))
    .sort((a, b) => Math.max(0, a.away) - Math.max(0, b.away))
  for (const { i, away } of near) {
    const idea = eventIdea(i, Math.max(0, away))
    if (idea && !ideas.some((x) => x.topic === idea.topic)) ideas.push(idea)
    if (ideas.length === 2) break
  }
  const theme = { ...THEMES[getDayOfYear(d) % THEMES.length] }
  const best = bestFormat(posts, accountId)
  if (best) {
    theme.format = best.format
    theme.why = `${theme.why}. ${PLANNED_FORMAT_LABELS[best.format]} posts have done ${best.lift.toFixed(1)}× your typical post lately.`
  }
  ideas.push(theme)
  return ideas
}
