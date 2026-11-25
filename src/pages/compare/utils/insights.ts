import { format, parseISO } from 'date-fns'
import type { CalendarItem, Checkpoint, PlannedFormat, Post } from '@/lib/api'
import { FORMAT_LABELS, fmtNumber } from '@/lib/format'

export type Evidence = 'likely' | 'possible' | 'unlikely' | 'unknown'
export interface Finding {
  key: string
  label: string
  text: string
  detail: string
  evidence: Evidence
  /** 0-100, measured from the account's own past posts; null when it can't be measured */
  score?: number | null
  scoreTip?: string
}
export interface NextStep {
  text: string
  format?: PlannedFormat
  topic?: string
}

export const median = (v: number[]) => {
  if (!v.length) return null
  const s = [...v].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

export const uaeDay = (iso: string) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai' }).format(new Date(iso))
export const firstLine = (p: Post) => (p.caption ?? '').split('\n').find((l) => l.trim())?.trim() ?? ''
export const impAt = (p: Post, cp: Checkpoint) => p.snapshots.find((s) => s.checkpoint === cp)?.impressions ?? null
export const periodLabel = (from: string, to: string) =>
  from === to ? format(parseISO(from), 'EEE d MMM yyyy') : `${format(parseISO(from), 'd MMM')} – ${format(parseISO(to), 'd MMM yyyy')}`

const CTA_WORDS = /\b(comment|dm|message us|book|visit|link in|sign up|register|download|reach out|contact|follow us|learn more|demo)\b/i

export const FACTORS: { key: string; label: string; get: (p: Post, items: Map<string, CalendarItem[]>) => string | null }[] = [
  { key: 'slot', label: 'Time slot', get: (p) => (p.time_known ? p.slot_uae : null) },
  { key: 'weekday', label: 'Day of the week', get: (p) => (p.day_uae ? (['Saturday', 'Sunday'].includes(p.day_uae) ? `${p.day_uae} (UAE weekend)` : p.day_uae) : null) },
  { key: 'format', label: 'Format', get: (p) => (p.format === 'untagged' ? null : FORMAT_LABELS[p.format]) },
  { key: 'topic', label: 'Topic', get: (p) => p.topic ?? null },
  {
    key: 'hook',
    label: 'Hook (first line)',
    get: (p) => {
      const h = firstLine(p)
      if (!h) return null
      const kind = h.includes('?') ? 'a question' : /^\d/.test(h) ? 'starts with a number' : 'a statement'
      const len = h.length < 60 ? 'short' : h.length <= 120 ? 'medium' : 'long'
      return `${kind}, ${len}`
    },
  },
  {
    key: 'length',
    label: 'Post length',
    get: (p) => (!p.caption ? null : p.caption.length < 500 ? 'short (under 500 characters)' : p.caption.length <= 1300 ? 'medium (500–1,300)' : 'long (over 1,300)'),
  },
  {
    key: 'hashtags',
    label: 'Hashtags',
    get: (p) => {
      const n = p.hashtags.length
      return n === 0 ? 'none' : n <= 3 ? '1–3' : n <= 5 ? '4–5' : '6 or more'
    },
  },
  { key: 'cta', label: 'Call to action', get: (p) => (p.cta || CTA_WORDS.test(p.caption ?? '') ? 'clear call to action' : 'no call to action') },
  {
    key: 'event',
    label: 'Holiday or event that day',
    get: (p, items) => {
      const its = (items.get(uaeDay(p.published_at)) ?? []).filter((i) => i.kind !== 'india_holiday' && i.kind !== 'business')
      return its.length ? its.map((i) => i.title).join(', ') : 'none'
    },
  },
]

export function itemsByDate(items: CalendarItem[], from: string, to: string): Map<string, CalendarItem[]> {
  const m = new Map<string, CalendarItem[]>()
  for (const it of items) {
    let d = it.start < from ? from : it.start
    const end = it.end > to ? to : it.end
    while (d <= end) {
      m.set(d, [...(m.get(d) ?? []), it])
      const next = new Date(`${d}T00:00:00`)
      next.setDate(next.getDate() + 1)
      d = format(next, 'yyyy-MM-dd')
    }
  }
  return m
}

export function factorHistory(history: Post[], cp: Checkpoint, factorKey: string, items: Map<string, CalendarItem[]>) {
  const f = FACTORS.find((x) => x.key === factorKey)!
  const all = history.map((p) => ({ p, v: impAt(p, cp) })).filter((x): x is { p: Post; v: number } => x.v != null)
  const typical = median(all.map((x) => x.v))
  const by = new Map<string, number[]>()
  if (typical)
    for (const { p, v } of all) {
      const val = f.get(p, items)
      if (val) by.set(val, [...(by.get(val) ?? []), v / typical])
    }
  return (value: string) => {
    const xs = by.get(value) ?? []
    return { n: xs.length, lift: median(xs), xs }
  }
}

/** How often a post from `a` beat a post from `b`, over every pair (ties count half). 50% = no difference. */
export function beatRate(a: number[], b: number[]) {
  if (!a.length || !b.length) return null
  let wins = 0
  for (const x of a) for (const y of b) wins += x > y ? 1 : x === y ? 0.5 : 0
  return Math.round((wins / (a.length * b.length)) * 100)
}

function judge(score: number | null, nWin: number, nLose: number): Evidence {
  if (score == null || nWin < 3 || nLose < 3) return 'unknown'
  if (score >= 70) return nWin >= 8 && nLose >= 8 ? 'likely' : 'possible'
  if (score >= 60) return 'possible'
  return 'unlikely'
}

const ORDER: Evidence[] = ['likely', 'possible', 'unknown', 'unlikely']
const lift = (x: number | null) => (x == null ? '—' : `${x.toFixed(1)}×`)

export interface PostInsights {
  headline: string
  subline: string | null
  findings: Finding[]
  same: string[]
  next: NextStep[]
  caution: string | null
}

export function analysePosts(posts: Post[], history: Post[], cp: Checkpoint, items: Map<string, CalendarItem[]>, ageLabel: string): PostInsights | null {
  const scored = posts.map((p) => ({ p, imp: impAt(p, cp) })).filter((x): x is { p: Post; imp: number } => x.imp != null)
  if (scored.length < 2) return null
  scored.sort((a, b) => b.imp - a.imp)
  const win = scored[0]
  const rest = scored.slice(1)
  const restMedian = median(rest.map((x) => x.imp))!
  const ratio = restMedian > 0 ? win.imp / restMedian : null
  const ref = (p: Post) => p.ref ?? `Post ${p.id}`
  const headline =
    rest.length === 1
      ? `${ref(win.p)} got ${ratio ? `${ratio.toFixed(1)}×` : 'more than'} the impressions of ${ref(rest[0].p)} at ${ageLabel} (${fmtNumber(win.imp)} vs ${fmtNumber(rest[0].imp)}).`
      : `${ref(win.p)} led with ${fmtNumber(win.imp)} impressions at ${ageLabel}, ${ratio ? `${ratio.toFixed(1)}×` : 'above'} the middle of the others.`

  const er = (p: Post) => p.snapshots.find((s) => s.checkpoint === cp)?.engagement_rate ?? null
  const byEr = posts.filter((p) => er(p) != null).sort((a, b) => er(b)! - er(a)!)
  const subline =
    byEr.length >= 2 && byEr[0].id !== win.p.id
      ? `But ${ref(byEr[0])} had the best engagement rate (${(er(byEr[0])! * 100).toFixed(1)}%): fewer people saw it, more of them responded.`
      : null

  const findings: Finding[] = []
  const same: string[] = []
  for (const f of FACTORS) {
    const wv = f.get(win.p, items)
    const others = rest.map((x) => f.get(x.p, items))
    if (!wv || others.every((v) => !v)) continue
    if (others.every((v) => v === wv)) {
      same.push(f.label)
      continue
    }
    const counts = new Map<string, number>()
    for (const v of others) if (v && v !== wv) counts.set(v, (counts.get(v) ?? 0) + 1)
    const ov = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
    if (!ov) continue
    const h = factorHistory(history, cp, f.key, items)
    const hw = h(wv)
    const ho = h(ov)
    const enough = hw.n >= 3 && ho.n >= 3
    const score = enough ? beatRate(hw.xs, ho.xs) : null
    const evidence = judge(score, hw.n, ho.n)
    const detail = !enough
      ? `Insufficient data (${hw.n} with “${wv}”, ${ho.n} with “${ov}”).`
      : `In your history, “${wv}” posts beat “${ov}” posts ${score}% of the time (${hw.n} vs ${ho.n} posts; ${lift(hw.lift)} vs ${lift(ho.lift)} your typical post).`
    findings.push({
      key: f.key,
      label: f.label,
      text: `${wv} vs ${ov}`,
      detail,
      evidence,
      score,
      scoreTip: score == null ? undefined : `Out of every pairing of a “${wv}” post with a “${ov}” post in your history, the “${wv}” one got more impressions ${score}% of the time. 50% means no difference.`,
    })
  }
  // Highest number first; unmeasured ones sit in the middle
  findings.sort((a, b) => (b.score ?? 50) - (a.score ?? 50))

  const next: NextStep[] = []
  const good = findings.filter((f) => f.evidence === 'likely' || f.evidence === 'possible')
  const slot = good.find((f) => f.key === 'slot')
  const fmt = good.find((f) => f.key === 'format')
  const topic = good.find((f) => f.key === 'topic')
  const fmtValue = win.p.format === 'newsletter' ? 'article' : win.p.format === 'untagged' ? undefined : (win.p.format as PlannedFormat)
  if (fmt || slot)
    next.push({
      text: `Make another ${fmt ? FORMAT_LABELS[win.p.format].toLowerCase() : ''} post${slot ? ` and schedule it for ${win.p.slot_uae} UAE` : ''}.`.replace('another  post', 'another post'),
      format: fmt ? fmtValue : undefined,
    })
  if (topic && win.p.topic) next.push({ text: `Publish a follow-up on “${win.p.topic}” from a new angle.`, topic: win.p.topic, format: fmtValue })
  for (const f of good.filter((x) => ['hook', 'hashtags', 'length', 'cta'].includes(x.key)).slice(0, 2))
    next.push({ text: `Keep the ${f.label.toLowerCase()} like ${ref(win.p)}'s: ${f.text.split(' vs ')[0]}.` })
  if (!next.length)
    next.push({ text: 'No difference is supported by historical data yet. Change one variable at a time, such as time or format, to make future comparisons clearer.' })

  const caution =
    win.imp < 150 || rest.some((x) => x.imp < 50)
      ? 'Low volumes: a single share or repost can change the result. Treat these findings as indicative.'
      : null

  return { headline, subline, findings, same, next: next.slice(0, 3), caution }
}

export interface PeriodSide {
  from: string
  to: string
  days: number
  posts: Post[]
  perPost: number | null
  formats: Map<string, number>
  topics: Map<string, number>
  events: CalendarItem[]
}

export function periodSide(from: string, to: string, history: Post[], cp: Checkpoint, items: CalendarItem[]): PeriodSide {
  const posts = history.filter((p) => {
    const d = uaeDay(p.published_at)
    return d >= from && d <= to
  })
  const days = Math.round((parseISO(to).getTime() - parseISO(from).getTime()) / 86_400_000) + 1
  const count = (get: (p: Post) => string | null) => {
    const m = new Map<string, number>()
    for (const p of posts) {
      const k = get(p)
      if (k) m.set(k, (m.get(k) ?? 0) + 1)
    }
    return m
  }
  return {
    from,
    to,
    days,
    posts,
    perPost: median(posts.map((p) => impAt(p, cp)).filter((v): v is number => v != null)),
    formats: count((p) => (p.format === 'untagged' ? null : FORMAT_LABELS[p.format])),
    topics: count((p) => p.topic),
    events: items.filter((i) => i.end >= from && i.start <= to && i.kind !== 'india_holiday'),
  }
}

export interface PeriodInsights {
  headline: string
  subline: string | null
  findings: Finding[]
  next: NextStep[]
}

export function analysePeriods(
  a: PeriodSide,
  b: PeriodSide,
  totalsA: { impressions: number | null; new_followers: number | null },
  totalsB: { impressions: number | null; new_followers: number | null },
  history: Post[],
  cp: Checkpoint,
  itemMap: Map<string, CalendarItem[]>,
): PeriodInsights {
  const pct = (x: number | null, y: number | null) => (x != null && y ? ((x - y) / y) * 100 : null)
  const sign = (v: number) => `${v >= 0 ? '+' : ''}${Math.round(v)}%`
  const perDay = (v: number | null, days: number) => (v == null ? null : v / days)
  const impChange = pct(perDay(totalsA.impressions, a.days), perDay(totalsB.impressions, b.days))
  const headline =
    impChange == null
      ? 'Insufficient data in one period to compare impressions.'
      : Math.abs(impChange) < 3
        ? `Impressions held steady (${fmtNumber(totalsA.impressions)} vs ${fmtNumber(totalsB.impressions)}).`
        : `Impressions ${impChange >= 0 ? 'rose' : 'fell'} ${Math.abs(Math.round(impChange))}% (${fmtNumber(totalsA.impressions)} vs ${fmtNumber(totalsB.impressions)}${a.days !== b.days ? ', per day' : ''}).`
  const fChange = pct(perDay(totalsA.new_followers, a.days), perDay(totalsB.new_followers, b.days))
  const subline =
    fChange == null
      ? null
      : `New followers ${Math.abs(fChange) < 3 ? 'held steady' : `${fChange >= 0 ? 'rose' : 'fell'} ${Math.abs(Math.round(fChange))}%`} (${fmtNumber(totalsA.new_followers)} vs ${fmtNumber(totalsB.new_followers)})${
          impChange != null && Math.abs(fChange) >= 3 && Math.abs(impChange) >= 3 && Math.sign(fChange) !== Math.sign(impChange) ? ': the opposite way to impressions, so reach and relevance moved apart.' : '.'
        }`

  const findings: Finding[] = []
  const perWeekA = (a.posts.length / a.days) * 7
  const perWeekB = (b.posts.length / b.days) * 7
  const volChange = pct(perWeekA, perWeekB)
  const perPostChange = pct(a.perPost, b.perPost)
  if (volChange != null)
    findings.push({
      key: 'volume',
      label: 'Posting frequency',
      // Under a week, plain counts read better than a weekly rate
      text: a.days < 7 || b.days < 7 ? `${a.posts.length} vs ${b.posts.length} posts` : `${perWeekA.toFixed(1)} vs ${perWeekB.toFixed(1)} posts a week (${sign(volChange)})`,
      detail:
        perPostChange == null
          ? 'Per-post reach could not be compared: too few posts with figures at the same age.'
          : `A typical post got ${fmtNumber(a.perPost)} vs ${fmtNumber(b.perPost)} impressions (${sign(perPostChange)}). ${
              Math.abs(volChange) > Math.abs(perPostChange) ? 'The change is driven more by posting volume than by per-post performance.' : 'So the change comes more from how well each post did than from how much you posted.'
            }`,
      evidence: Math.abs(volChange) < 10 ? 'unlikely' : Math.abs(volChange) >= 20 && impChange != null && Math.sign(volChange) === Math.sign(impChange) ? 'likely' : 'possible',
    })

  const shift = (key: 'format' | 'topic', ma: Map<string, number>, mb: Map<string, number>, label: string) => {
    const names = new Set([...ma.keys(), ...mb.keys()])
    let best: { name: string; d: number } | null = null
    for (const n of names) {
      const sa = (ma.get(n) ?? 0) / Math.max(1, a.posts.length)
      const sb = (mb.get(n) ?? 0) / Math.max(1, b.posts.length)
      if (!best || Math.abs(sa - sb) > Math.abs(best.d)) best = { name: n, d: sa - sb }
    }
    if (!best || Math.abs(best.d) < 0.15) return
    const h = factorHistory(history, cp, key, itemMap)(best.name)
    const usuallyGood = h.lift != null && h.n >= 3 ? h.lift >= 1.15 : null
    const more = best.d > 0
    const beat = h.n >= 3 ? Math.round((h.xs.filter((x) => x > 1).length / h.n) * 100) : null
    const name = best.name.toLowerCase()
    findings.push({
      key,
      label,
      text: `${more ? 'More' : 'Fewer'} ${name} posts (${ma.get(best.name) ?? 0} vs ${mb.get(best.name) ?? 0})`,
      detail:
        beat != null
          ? `In your history, ${beat}% of ${name} posts beat your typical post (${h.n} posts; ${lift(h.lift)} your typical post).`
          : `Insufficient history for ${name} posts.`,
      score: beat,
      scoreTip: beat == null ? undefined : `${beat}% of your ${name} posts got more impressions than your typical post. 50% means they're ordinary.`,
      evidence:
        usuallyGood == null ? 'unknown' : (more && usuallyGood) || (!more && !usuallyGood) ? (impChange != null && impChange > 0 ? 'possible' : 'unlikely') : impChange != null && impChange < 0 ? 'possible' : 'unlikely',
    })
  }
  shift('format', a.formats, b.formats, 'Format mix')
  shift('topic', a.topics, b.topics, 'Topic mix')

  const titles = (s: PeriodSide) => new Set(s.events.filter((e) => e.kind !== 'business').map((e) => e.title))
  const onlyA = [...titles(a)].filter((t) => !titles(b).has(t))
  const onlyB = [...titles(b)].filter((t) => !titles(a).has(t))
  if (onlyA.length || onlyB.length)
    findings.push({
      key: 'events',
      label: 'Holidays and events',
      text: [onlyA.length ? `Only in A: ${onlyA.slice(0, 3).join(', ')}` : '', onlyB.length ? `Only in B: ${onlyB.slice(0, 3).join(', ')}` : ''].filter(Boolean).join(' · '),
      detail: 'Holidays typically reduce activity; industry events (GESS, GITEX) and national days can increase it. Consider these before drawing conclusions.',
      evidence: 'possible',
    })

  findings.sort((x, y) => ORDER.indexOf(x.evidence) - ORDER.indexOf(y.evidence))

  const next: NextStep[] = []
  if (volChange != null && volChange < -20 && a.days >= 7 && b.days >= 7) next.push({ text: `Return to about ${Math.round(perWeekB)} posts per week. Reduced posting is the clearest difference.` })
  if (volChange != null && volChange > 20 && perPostChange != null && perPostChange < -15)
    next.push({ text: 'Posting volume rose but reach per post fell. Prioritise fewer, stronger posts.' })
  const fmtFinding = findings.find((f) => f.key === 'format' && f.evidence === 'possible')
  if (fmtFinding) {
    const name = fmtFinding.text.replace(/^(More|Fewer) /, '').replace(/ posts.*$/, '')
    const fmt = Object.entries(FORMAT_LABELS).find(([, l]) => l.toLowerCase() === name.toLowerCase())?.[0]
    const planned = fmt === 'newsletter' ? 'article' : fmt && fmt !== 'untagged' ? (fmt as PlannedFormat) : undefined
    next.push({ text: `Review the format mix: ${fmtFinding.text.toLowerCase()} coincides with the change.`, format: planned })
  }
  if (!next.length) next.push({ text: 'No single factor stands out. Maintain a steady posting schedule and change one variable at a time.' })
  return { headline, subline, findings, next: next.slice(0, 3) }
}
