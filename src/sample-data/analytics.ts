import type {
  AudienceStats,
  CalendarData,
  CalendarItem,
  CalendarTiming,
  Checkpoint,
  CheckpointQ,
  Classification,
  Consistency,
  DateAdvice,
  DueSnapshot,
  FormatRow,
  GroupRow,
  Heatmap,
  HeatCell,
  Overview,
  Post,
  PostFormat,
  SimilarResponse,
  Snapshot,
  Suggestion,
  SuggestionsResult,
  TimingEffect,
  TimingModel,
  Trend,
  WindowStats,
} from '@/types/api'
import { CHECKPOINTS } from '@/types/api'
import { CHECKPOINT_HOURS, type MockDb, type StoredPost } from './seed'
import { addDays, DAY, HEAT_DAYS, HOUR, median, round, SLOTS, sum, uaeDate, uaeMidnight, uaeTime, uaeWeekday } from './util'

export type Range = { days?: number; from?: string; to?: string }

const KEY_METRIC: Record<PostFormat, string> = {
  image: 'impressions',
  carousel: 'impressions',
  video: 'video_views',
  poll: 'poll_votes',
  newsletter: 'newsletter_views',
  text: 'impressions',
  untagged: 'impressions',
}

const METRIC_LABELS: Record<string, string> = {
  impressions: 'impressions',
  engagement_rate: 'engagement rate',
  clicks: 'clicks',
  comments: 'comments',
  reactions: 'reactions',
  followers_gained: 'followers gained',
}

export function snapAt(p: StoredPost, cp: CheckpointQ): Snapshot | undefined {
  if (cp === 'latest') {
    return [...p.snapshots].sort((a, b) => CHECKPOINTS.indexOf(a.checkpoint) - CHECKPOINTS.indexOf(b.checkpoint)).at(-1)
  }
  return p.snapshots.find((s) => s.checkpoint === cp)
}

const metricOf = (s: Snapshot | undefined, metric: string): number | null =>
  s ? ((s as unknown as Record<string, number | null>)[metric] ?? null) : null

export function inRange(p: StoredPost, range: Range | undefined, now = Date.now()) {
  if (!range) return true
  const d = p.published_at_uae.slice(0, 10)
  if (range.days) return Date.parse(p.published_at) >= now - range.days * DAY
  if (range.from && d < range.from) return false
  if (range.to && d > range.to) return false
  return true
}

export function accountPosts(db: MockDb, accountId: number, range?: Range) {
  return db.posts.filter((p) => p.account_id === accountId && inRange(p, range))
}

export function classify(db: MockDb, p: StoredPost, cp: CheckpointQ, metric = 'impressions'): Classification | null {
  const perf = db.settings.performance
  const peers = db.posts.filter((x) => x.account_id === p.account_id)
  const values = peers.map((x) => metricOf(snapAt(x, cp), metric)).filter((v): v is number => v != null)
  const mine = metricOf(snapAt(p, cp), metric)
  if (mine == null || values.length < perf.min_history) return null
  const below = values.filter((v) => v < mine).length
  const percentile = Math.round((below / values.length) * 100)
  const label =
    percentile >= perf.cut_high
      ? 'High performer'
      : percentile >= perf.cut_above
        ? 'Above average'
        : percentile >= perf.cut_average
          ? 'Average'
          : percentile >= perf.cut_below
            ? 'Below average'
            : 'Needs investigation'
  const m = median(values)
  return { label, percentile, baseline: `median ${Math.round(m ?? 0).toLocaleString('en')} ${METRIC_LABELS[metric] ?? metric} over ${values.length} posts at ${cp}` }
}

export function toPost(db: MockDb, p: StoredPost, cp: CheckpointQ = 'latest'): Post {
  const shares = p.audience.length
    ? sharesOf(db, p)
    : { uae_share: null, education_share: null, decision_maker_share: null, tech_share: null, partner_share: null }
  return { ...p, shares, classification: classify(db, p, cp) }
}

function sharesOf(db: MockDb, p: StoredPost) {
  const seg = db.settings.segments
  const total = (dim: string, list: string[]) => {
    const rs = p.audience.filter((r) => r.dimension === dim)
    if (!rs.length) return null
    return Math.min(1, rs.filter((r) => list.some((x) => r.value.toLowerCase().includes(x.toLowerCase()))).reduce((s, r) => s + r.pct, 0) / 100)
  }
  return {
    uae_share: total('location', [...seg.uae_country]),
    education_share: total('industry', seg.education_industry),
    decision_maker_share: total('seniority', seg.decision_seniority),
    tech_share: total('job_function', seg.tech_functions),
    partner_share: total('job_function', seg.partner_functions),
  }
}

function audienceStats(db: MockDb, posts: StoredPost[], cp: CheckpointQ): AudienceStats {
  const withAud = posts.filter((p) => p.audience.length)
  const sh = withAud.map((p) => ({ s: sharesOf(db, p), imp: metricOf(snapAt(p, cp), 'impressions') }))
  return {
    posts_with_audience: withAud.length,
    median_uae_share: median(sh.map((x) => x.s.uae_share)),
    median_education_share: median(sh.map((x) => x.s.education_share)),
    median_decision_maker_share: median(sh.map((x) => x.s.decision_maker_share)),
    median_uae_impressions: median(sh.map((x) => (x.imp != null && x.s.uae_share != null ? x.imp * x.s.uae_share : null))),
    median_education_impressions: median(sh.map((x) => (x.imp != null && x.s.education_share != null ? x.imp * x.s.education_share : null))),
  }
}

function suggestedCheckpoint(posts: StoredPost[]): Checkpoint {
  let best: Checkpoint = '24h'
  let bestN = -1
  for (const cp of CHECKPOINTS) {
    const n = posts.filter((p) => p.snapshots.some((s) => s.checkpoint === cp)).length
    if (n > bestN || (n === bestN && cp === '24h')) {
      best = cp
      bestN = n
    }
  }
  return best
}

export function overview(db: MockDb, accountId: number, cp: CheckpointQ): Overview {
  const posts = accountPosts(db, accountId)
  const snaps = posts.map((p) => snapAt(p, cp)).filter((s): s is Snapshot => !!s)
  return {
    ...audienceStats(db, posts, cp),
    checkpoint: cp,
    suggested_checkpoint: suggestedCheckpoint(posts),
    posts_total: posts.length,
    posts_time_unknown: posts.filter((p) => !p.time_known).length,
    posts_untagged: posts.filter((p) => p.format === 'untagged').length,
    posts_topic_suggested: posts.filter((p) => p.topic_suggested).length,
    posts_at_checkpoint: snaps.length,
    median_impressions: median(snaps.map((s) => s.impressions)),
    median_engagement_rate: median(snaps.map((s) => s.engagement_rate)),
    median_click_rate: median(snaps.map((s) => s.click_rate)),
    total_clicks: sum(snaps.map((s) => s.clicks)),
    total_followers_gained: sum(snaps.map((s) => s.followers_gained)),
  }
}

export function formats(db: MockDb, accountId: number, cp: CheckpointQ, range?: Range): FormatRow[] {
  const posts = accountPosts(db, accountId, range)
  const byFormat = new Map<PostFormat, StoredPost[]>()
  for (const p of posts) byFormat.set(p.format, [...(byFormat.get(p.format) ?? []), p])
  return [...byFormat.entries()]
    .map(([format, ps]) => {
      const snaps = ps.map((p) => snapAt(p, cp))
      return {
        ...audienceStats(db, ps, cp),
        format,
        posts: ps.length,
        median_impressions: median(snaps.map((s) => s?.impressions)),
        median_engagement_rate: median(snaps.map((s) => s?.engagement_rate)),
        median_clicks: median(snaps.map((s) => s?.clicks)),
        median_comments: median(snaps.map((s) => s?.comments)),
        key_metric: KEY_METRIC[format],
        median_key_metric: median(snaps.map((s) => metricOf(s, KEY_METRIC[format]))),
        followers_gained: sum(snaps.map((s) => s?.followers_gained)),
      }
    })
    .sort((a, b) => b.posts - a.posts)
}

export function groups(db: MockDb, accountId: number, cp: CheckpointQ, by: string, range?: Range): GroupRow[] {
  const posts = accountPosts(db, accountId, range)
  const map = new Map<string, StoredPost[]>()
  for (const p of posts) {
    const keys: string[] =
      by === 'hashtag' ? p.hashtags : by === 'keyword' ? p.keywords : [String((p as unknown as Record<string, unknown>)[by] ?? 'Not set')]
    for (const k of keys) map.set(k, [...(map.get(k) ?? []), p])
  }
  return [...map.entries()]
    .map(([key, ps]) => {
      const snaps = ps.map((p) => snapAt(p, cp))
      return {
        ...audienceStats(db, ps, cp),
        key,
        posts: ps.length,
        median_impressions: median(snaps.map((s) => s?.impressions)),
        median_engagement_rate: median(snaps.map((s) => s?.engagement_rate)),
        median_comments: median(snaps.map((s) => s?.comments)),
        median_clicks: median(snaps.map((s) => s?.clicks)),
        followers_gained: sum(snaps.map((s) => s?.followers_gained)),
      }
    })
    .sort((a, b) => b.posts - a.posts)
}

export function heatmap(db: MockDb, accountId: number, cp: CheckpointQ, metric: string, format?: string, range?: Range): Heatmap {
  const minPosts = db.settings.performance.min_slot_posts
  const all = accountPosts(db, accountId, range).filter((p) => !format || p.format === format)
  const timed = all.filter((p) => p.time_known && p.slot_uae)
  const cells: HeatCell[] = []
  for (const day of HEAT_DAYS) {
    for (const slot of SLOTS) {
      const ps = timed.filter((p) => p.day_uae === day && p.slot_uae === slot)
      const m = median(ps.map((p) => metricOf(snapAt(p, cp), metric)))
      cells.push({ day, slot, posts: ps.length, median: m, low_confidence: ps.length < minPosts })
    }
  }
  const good = cells.filter((c) => !c.low_confidence && c.median != null).sort((a, b) => (b.median ?? 0) - (a.median ?? 0))
  return {
    metric,
    checkpoint: String(cp),
    format: format ?? null,
    days: HEAT_DAYS,
    slots: [...SLOTS],
    min_posts_per_slot: minPosts,
    overall_median: median(timed.map((p) => metricOf(snapAt(p, cp), metric))),
    posts_without_time: all.length - timed.length,
    cells,
    suggestion: good[0] ? { day: good[0].day, slot: good[0].slot, median: good[0].median!, posts: good[0].posts } : null,
  }
}

function effects(db: MockDb, accountId: number, keyOf: (p: StoredPost) => string | null, keys: string[], labelOf = (k: string) => k): TimingEffect[] {
  const timed = accountPosts(db, accountId).filter((p) => p.time_known)
  const overall = median(timed.map((p) => snapAt(p, 'latest')?.impressions)) ?? 1
  return keys.map((key) => {
    const ps = timed.filter((p) => keyOf(p) === key)
    const m = median(ps.map((p) => snapAt(p, 'latest')?.impressions))
    const lift = m ? round(m / overall, 2) : 1
    const width = ps.length ? 0.9 / Math.sqrt(ps.length) : 0.5
    const low = round(Math.max(0.1, lift - width), 2)
    const high = round(lift + width, 2)
    const verdict: TimingEffect['verdict'] =
      ps.length === 0 ? 'untested' : ps.length < 3 ? 'too_few' : low > 1 ? 'better' : high < 1 ? 'worse' : 'no_clear_difference'
    return { key, label: labelOf(key), posts: ps.length, lift, low, high, verdict }
  })
}

const SPECIAL_LABELS: Record<string, string> = {
  uae_holiday: 'UAE public holidays',
  ramadan: 'Ramadan',
  summer: 'UAE summer (July–August)',
  india_holiday: 'Indian holidays',
  weekend: 'Weekends',
}

function specialEffects(db: MockDb, accountId: number): TimingEffect[] {
  const ps = accountPosts(db, accountId).filter((p) => p.time_known)
  const overall = median(ps.map((p) => snapAt(p, 'latest')?.impressions)) ?? 1
  const make = (key: string, match: (p: StoredPost) => boolean): TimingEffect => {
    const sel = ps.filter(match)
    const m = median(sel.map((p) => snapAt(p, 'latest')?.impressions))
    const lift = m ? round(m / overall, 2) : 1
    const width = sel.length ? 0.9 / Math.sqrt(sel.length) : 0.5
    return {
      key,
      label: SPECIAL_LABELS[key],
      posts: sel.length,
      lift,
      low: round(Math.max(0.1, lift - width), 2),
      high: round(lift + width, 2),
      verdict: sel.length === 0 ? 'untested' : sel.length < 3 ? 'too_few' : lift - width > 1 ? 'better' : lift + width < 1 ? 'worse' : 'no_clear_difference',
    }
  }
  const month = (p: StoredPost) => Number(p.published_at_uae.slice(5, 7))
  return [
    make('weekend', (p) => p.day_uae === 'Saturday' || p.day_uae === 'Sunday'),
    make('summer', (p) => month(p) === 7 || month(p) === 8),
    make('ramadan', (p) => itemsBetween(p.published_at_uae.slice(0, 10), p.published_at_uae.slice(0, 10)).some((i) => i.title === 'Ramadan')),
    make('uae_holiday', (p) => itemsBetween(p.published_at_uae.slice(0, 10), p.published_at_uae.slice(0, 10)).some((i) => i.kind === 'uae_holiday')),
  ]
}

function dateAdvice(db: MockDb, accountId: number, date: string, slotEff: TimingEffect[], dayEff: TimingEffect[]): DateAdvice {
  const ts = uaeMidnight(date) + 12 * HOUR
  const weekday = uaeWeekday(ts)
  const weekend = weekday === 'Saturday' || weekday === 'Sunday'
  const items = itemsBetween(date, date)
  const labels: string[] = []
  if (weekend) labels.push('weekend')
  if (items.some((i) => i.title === 'Ramadan')) labels.push('ramadan')
  if (items.some((i) => i.title === 'UAE summer')) labels.push('summer')
  if (items.some((i) => i.kind === 'uae_holiday')) labels.push('uae_holiday')
  const timed = accountPosts(db, accountId).filter((p) => p.time_known && p.day_uae === weekday)
  const slots = slotEff.map((s) => ({ slot: s.key, lift: s.lift, posts: timed.filter((p) => p.slot_uae === s.key).length }))
  const best = [...slotEff].sort((a, b) => b.lift - a.lift)[0]
  const untried = slots.filter((s) => s.posts < 2).sort((a, b) => (slotEff.find((e) => e.key === b.slot)?.lift ?? 0) - (slotEff.find((e) => e.key === a.slot)?.lift ?? 0))[0]
  const d = dayEff.find((e) => e.key === weekday)
  return {
    date,
    weekday,
    labels,
    weekend,
    best_slot: best.key,
    best_lift: best.lift,
    clear: best.verdict === 'better',
    slots,
    date_lift: d?.lift ?? 1,
    date_posts: d?.posts ?? 0,
    test_slot: untried?.slot ?? null,
  }
}

export function timing(db: MockDb, accountId: number, metric = 'impressions'): TimingModel {
  const posts = accountPosts(db, accountId)
  const timed = posts.filter((p) => p.time_known)
  const minPosts = 20
  const base = {
    metric,
    metric_label: METRIC_LABELS[metric] ?? metric,
    checkpoint: 'latest',
    posts_used: timed.length,
    posts_without_time: posts.length - timed.length,
    prior: 8,
    min_posts: minPosts,
  }
  if (timed.length < minPosts) {
    return { ...base, ready: false, reason: `Needs at least ${minPosts} posts with a known time; this account has ${timed.length}.` }
  }
  const days = effects(db, accountId, (p) => p.day_uae, HEAT_DAYS)
  const slots = effects(db, accountId, (p) => p.slot_uae, [...SLOTS, 'Outside 8 AM-8 PM'])
  const fmt = formats(db, accountId, 'latest')
  const overall = median(timed.map((p) => snapAt(p, 'latest')?.impressions)) ?? 1
  const today = uaeDate(Date.now())
  return {
    ...base,
    ready: true,
    days,
    slots,
    special: specialEffects(db, accountId),
    ramadan_slots: [],
    formats: fmt.map((f) => ({ key: f.format, posts: f.posts, lift: round((f.median_impressions ?? overall) / overall, 2) })),
    topics: groups(db, accountId, 'latest', 'topic').map((g) => ({ key: g.key, posts: g.posts, lift: round((g.median_impressions ?? overall) / overall, 2) })),
    spread: { day: 0.18, slot: 0.24, format: 0.41, topic: 0.29 },
    backtest: backtest(timed.length),
    upcoming: Array.from({ length: 14 }, (_, i) => dateAdvice(db, accountId, addDays(today, i + 1), slots.filter((s) => s.key !== 'Outside 8 AM-8 PM'), days)),
  }
}

function backtest(n: number) {
  return {
    ran: true,
    train: Math.round(n * 0.7),
    test: n - Math.round(n * 0.7),
    improvement_pct: 6.5,
    verdict: 'helps' as const,
    text: 'Knowing the day and time made predictions for newer posts about 6% better than ignoring them.',
  }
}

function yearItems(y: number): CalendarItem[] {
  const it = (start: string, end: string, title: string, kind: CalendarItem['kind'], note = '', status: CalendarItem['status'] = 'confirmed'): CalendarItem => ({
    start,
    end,
    title,
    kind,
    status,
    note,
  })
  const lunar: Record<number, { ramadan: [string, string]; fitr: [string, string]; adha: [string, string]; hijri: string; mawlid: string }> = {
    2025: { ramadan: ['2025-03-01', '2025-03-29'], fitr: ['2025-03-30', '2025-04-01'], adha: ['2025-06-05', '2025-06-08'], hijri: '2025-06-26', mawlid: '2025-09-04' },
    2026: { ramadan: ['2026-02-18', '2026-03-19'], fitr: ['2026-03-20', '2026-03-22'], adha: ['2026-05-26', '2026-05-29'], hijri: '2026-06-16', mawlid: '2026-08-25' },
    2027: { ramadan: ['2027-02-08', '2027-03-09'], fitr: ['2027-03-10', '2027-03-12'], adha: ['2027-05-15', '2027-05-18'], hijri: '2027-06-06', mawlid: '2027-08-14' },
  }
  const l = lunar[y]
  const expected = y >= 2027 ? 'expected' : 'confirmed'
  const items: CalendarItem[] = [
    it(`${y}-01-01`, `${y}-01-01`, 'New Year’s Day', 'uae_holiday'),
    it(`${y}-01-24`, `${y}-01-24`, 'International Day of Education', 'awareness'),
    it(`${y}-01-26`, `${y}-01-26`, 'Republic Day', 'india_holiday', 'National holiday'),
    it(`${y}-07-01`, `${y}-08-31`, 'UAE summer', 'period', 'Many residents travel; schools are closed'),
    it(`${y}-08-15`, `${y}-08-15`, 'Independence Day', 'india_holiday', 'National holiday'),
    it(`${y}-08-24`, `${y}-08-28`, 'Back to school (UAE)', 'business', 'New academic year for most private schools'),
    it(`${y}-10-05`, `${y}-10-05`, 'World Teachers’ Day', 'awareness'),
    it(`${y}-10-12`, `${y}-10-16`, 'GITEX Global', 'event', 'Dubai World Trade Centre'),
    it(`${y}-11-03`, `${y}-11-03`, 'UAE Flag Day', 'awareness'),
    it(`${y}-11-15`, `${y}-12-15`, 'Budget season', 'business', 'Schools and SMEs plan next year’s spending'),
    it(`${y}-12-01`, `${y}-12-01`, 'Commemoration Day', 'uae_holiday'),
    it(`${y}-12-02`, `${y}-12-03`, 'UAE National Day', 'uae_holiday'),
    it(`${y}-12-25`, `${y}-12-25`, 'Christmas Day', 'business', 'Quiet week for many international teams'),
  ]
  if (l) {
    items.push(
      it(l.ramadan[0], l.ramadan[1], 'Ramadan', 'period', 'Shorter working hours', expected),
      it(l.fitr[0], l.fitr[1], 'Eid al-Fitr', 'uae_holiday', '', expected),
      it(l.adha[0], l.adha[1], 'Arafat Day and Eid al-Adha', 'uae_holiday', '', expected),
      it(l.hijri, l.hijri, 'Islamic New Year', 'uae_holiday', '', expected),
      it(l.mawlid, l.mawlid, 'Prophet Muhammad’s Birthday', 'uae_holiday', '', expected),
    )
  }
  return items
}

export function itemsBetween(from: string, to: string): CalendarItem[] {
  const out: CalendarItem[] = []
  for (let y = Number(from.slice(0, 4)); y <= Number(to.slice(0, 4)); y++) {
    for (const i of yearItems(y)) if (i.end >= from && i.start <= to) out.push(i)
  }
  return out.sort((a, b) => a.start.localeCompare(b.start))
}

export function calendar(db: MockDb, accountId: number, from: string, to: string): CalendarData {
  const family = db.accounts.filter((a) => a.id === accountId || a.parent_id === accountId)
  const ids = new Set(family.map((a) => a.id))
  const overall = new Map<number, number | null>()
  for (const a of family) overall.set(a.id, median(accountPosts(db, a.id).map((p) => snapAt(p, 'latest')?.impressions)))
  const posts = db.posts
    .filter((p) => ids.has(p.account_id))
    .filter((p) => {
      const d = p.published_at_uae.slice(0, 10)
      return d >= from && d <= to
    })
    .map((p) => {
      const a = family.find((x) => x.id === p.account_id)!
      const s = snapAt(p, 'latest')
      const typical = overall.get(p.account_id)
      return {
        id: p.id,
        ref: p.ref,
        account_id: p.account_id,
        account_name: a.name,
        account_kind: a.kind,
        date: p.published_at_uae.slice(0, 10),
        time: p.time_known ? p.published_at_uae.slice(11, 16) : null,
        format: p.format,
        title: (p.caption ?? p.topic ?? 'Post').split('\n')[0].slice(0, 90),
        impressions: s?.impressions ?? null,
        checkpoint: s?.checkpoint ?? null,
        vs_typical: s?.impressions != null && typical ? round(s.impressions / typical, 2) : null,
      }
    })
  const planned = db.planned
    .filter((p) => p.account_id === accountId && p.scheduled_at && p.status !== 'published')
    .map((p) => {
      const ts = Date.parse(p.scheduled_at!)
      return {
        id: p.id,
        ref: p.ref,
        date: uaeDate(ts),
        time: uaeTime(ts),
        slot: p.scheduled_slot_uae ?? '',
        format: p.format,
        status: p.status,
        title: p.caption.split('\n')[0].slice(0, 90) || 'Untitled draft',
      }
    })
    .filter((p) => p.date >= from && p.date <= to)

  const t = timing(db, accountId)
  let tm: CalendarTiming
  if (!t.ready) {
    tm = { ready: false, posts_used: t.posts_used, reason: t.reason ?? 'Not enough posts with a known time yet.' }
  } else {
    const slotEff = t.slots!.filter((s) => s.key !== 'Outside 8 AM-8 PM')
    const days: Record<string, DateAdvice> = {}
    for (let d = from; d <= to; d = addDays(d, 1)) days[d] = dateAdvice(db, accountId, d, slotEff, t.days!)
    tm = {
      ready: true,
      posts_used: t.posts_used,
      backtest: t.backtest!,
      special: Object.fromEntries(t.special!.map((s) => [s.key, s])),
      days,
    }
  }
  return {
    from,
    to,
    accounts: family.map((a) => ({ id: a.id, name: a.name, kind: a.kind })),
    posts,
    planned,
    items: itemsBetween(from, to),
    timing: tm,
    dates_cover: [2025, 2027],
  }
}

function windowStats(db: MockDb, posts: StoredPost[], cp: CheckpointQ): WindowStats {
  const snaps = posts.map((p) => snapAt(p, cp))
  return {
    ...audienceStats(db, posts, cp),
    posts: posts.length,
    total_impressions: sum(snaps.map((s) => s?.impressions)),
    median_impressions: median(snaps.map((s) => s?.impressions)),
    median_engagement_rate: median(snaps.map((s) => s?.engagement_rate)),
    total_clicks: sum(snaps.map((s) => s?.clicks)),
    followers_gained: sum(snaps.map((s) => s?.followers_gained)),
  }
}

function trend(cur: number | null, prev: number | null, threshold: number): Trend {
  if (cur == null || prev == null || !prev) return 'unknown'
  const r = (cur / prev - 1) * 100
  return r > threshold ? 'improving' : r < -threshold ? 'declining' : 'stable'
}

export function consistency(db: MockDb, accountId: number, cp: CheckpointQ): Consistency {
  const now = Date.now()
  const posts = accountPosts(db, accountId)
  const th = db.settings.performance.trend_threshold
  const between = (a: number, b: number) => posts.filter((p) => {
    const t = Date.parse(p.published_at)
    return t >= now - a * DAY && t < now - b * DAY
  })
  const windows = [30, 90].map((days) => {
    const current = windowStats(db, between(days, 0), cp)
    const previous = windowStats(db, between(days * 2, days), cp)
    return {
      days,
      current,
      previous,
      median_impressions_trend: trend(current.median_impressions, previous.median_impressions, th),
      engagement_rate_trend: trend(current.median_engagement_rate, previous.median_engagement_rate, th),
      followers_trend: trend(current.followers_gained, previous.followers_gained, th),
      uae_impressions_trend: trend(current.median_uae_impressions, previous.median_uae_impressions, th),
    }
  })
  const todayTs = uaeMidnight(uaeDate(now))
  const dow = (new Date(todayTs + 4 * HOUR).getUTCDay() + 6) % 7
  const thisMonday = todayTs - dow * DAY
  const weekly_posts = Array.from({ length: 12 }, (_, i) => {
    const start = thisMonday - (11 - i) * 7 * DAY
    return { week_start: uaeDate(start), posts: posts.filter((p) => Date.parse(p.published_at) >= start && Date.parse(p.published_at) < start + 7 * DAY).length }
  })
  const recent = between(90, 0)
  const total = sum(recent.map((p) => snapAt(p, cp)?.impressions)) ?? 0
  const fs = formats(db, accountId, cp, { days: 90 }).map((f) => {
    const imp = sum(recent.filter((p) => p.format === f.format).map((p) => snapAt(p, cp)?.impressions)) ?? 0
    return { format: f.format, impressions: imp, share: total ? round(imp / total, 3) : null }
  }).sort((a, b) => b.impressions - a.impressions)
  return {
    checkpoint: String(cp),
    windows,
    weekly_posts,
    weeks_without_posts: weekly_posts.filter((w) => w.posts === 0).length,
    format_share_90d: fs,
    dominant_format_90d: fs[0] && fs[0].share != null && fs[0].share > 0.5 ? { format: fs[0].format, impressions: fs[0].impressions, share: fs[0].share } : null,
  }
}

export function dueSnapshots(db: MockDb, accountId: number): DueSnapshot[] {
  const now = Date.now()
  const out: DueSnapshot[] = []
  for (const p of accountPosts(db, accountId)) {
    if (!p.time_known) continue
    const pub = Date.parse(p.published_at)
    for (const cp of CHECKPOINTS) {
      const due = pub + CHECKPOINT_HOURS[cp] * HOUR
      const closes = due + Math.max(2, CHECKPOINT_HOURS[cp] * 0.5) * HOUR
      if (due > now || closes < now - 7 * DAY) continue
      if (p.snapshots.some((s) => s.checkpoint === cp)) continue
      out.push({
        post_id: p.id,
        topic: p.topic,
        format: p.format,
        checkpoint: cp,
        due_at: new Date(due).toISOString(),
        due_at_uae: new Date(due + 4 * HOUR).toISOString().slice(0, 16).replace('T', ' '),
        hours_late: Math.max(0, Math.round((now - due) / HOUR)),
        closes_at: new Date(closes).toISOString(),
        closes_at_uae: new Date(closes + 4 * HOUR).toISOString().slice(0, 16).replace('T', ' '),
      })
    }
  }
  return out.sort((a, b) => a.due_at.localeCompare(b.due_at))
}

export function suggestions(db: MockDb, accountId: number): SuggestionsResult {
  const posts = accountPosts(db, accountId)
  const cp: CheckpointQ = 'latest'
  const baseline = median(posts.map((p) => snapAt(p, cp)?.impressions))
  const fmts = formats(db, accountId, cp).filter((f) => f.posts >= 3 && f.format !== 'untagged')
  const bestFmt = [...fmts].sort((a, b) => (b.median_impressions ?? 0) - (a.median_impressions ?? 0))[0]
  const h = heatmap(db, accountId, cp, 'impressions')
  const topics = groups(db, accountId, cp, 'topic').filter((g) => g.posts >= 3 && g.key !== 'null')
  const bestTopic = [...topics].sort((a, b) => (b.median_impressions ?? 0) - (a.median_impressions ?? 0))[0]
  const ctas = groups(db, accountId, cp, 'cta').filter((g) => g.posts >= 3)
  const bestCta = [...ctas].sort((a, b) => (b.median_clicks ?? 0) - (a.median_clicks ?? 0))[0]
  const untagged = posts.filter((p) => p.format === 'untagged').length
  const suggestedTopics = posts.filter((p) => p.topic_suggested).length
  const noAudience = posts.filter((p) => p.time_known && !p.audience.length).length
  // Measured: of the posts a suggestion rests on, the % that beat the typical post (same rule as the backend)
  const share = (match: (p: (typeof posts)[number]) => boolean) => {
    const vals = posts.filter(match).map((p) => snapAt(p, cp)?.impressions).filter((v): v is number => v != null)
    return vals.length >= 3 && baseline ? Math.round((100 * vals.filter((v) => v > baseline).length) / vals.length) : null
  }
  const pct = (v: number | null | undefined) => (v != null && baseline ? `${v >= baseline ? '+' : '−'}${Math.round(Math.abs(v / baseline - 1) * 100)}%` : '')
  const out: Suggestion[] = []
  const base = (s: Partial<Suggestion> & Pick<Suggestion, 'id' | 'category' | 'title'>): Suggestion => ({
    priority: 'medium',
    when: 'Over the next 2 weeks',
    who: 'Whoever plans the posts',
    why: [],
    boost: '',
    risk: 'Low',
    confidence: { level: 'medium', reason: 'Based on this page’s own posts.' },
    measure: { metric: 'Median impressions', period: 'Next 4 weeks', target: 'Above the page’s typical post' },
    action: null,
    progress: null,
    ...s,
  })
  if (bestFmt) {
    out.push(
      base({
        id: `format:${bestFmt.format}`,
        category: 'format',
        priority: 'high',
        title: `Post more ${bestFmt.format} posts`,
        why: [`${bestFmt.format[0].toUpperCase()}${bestFmt.format.slice(1)} posts get a median ${Math.round(bestFmt.median_impressions ?? 0).toLocaleString('en')} impressions (${pct(bestFmt.median_impressions)} vs the typical post), over ${bestFmt.posts} posts.`],
        boost: 'More reach per post',
        confidence: { level: bestFmt.posts >= 8 ? 'high' : 'medium', reason: `${bestFmt.posts} posts in this format`, pct: share((p) => p.format === bestFmt.format) },
        action: { label: 'Create a post', to: '/create' },
      }),
    )
  }
  if (h.suggestion) {
    out.push(
      base({
        id: `timing:${h.suggestion.day}:${h.suggestion.slot}`,
        category: 'timing',
        title: `Try ${h.suggestion.day}s, ${h.suggestion.slot} (UAE)`,
        why: [`${h.suggestion.posts} posts in that slot have a median of ${Math.round(h.suggestion.median).toLocaleString('en')} impressions (${pct(h.suggestion.median)}).`, 'Timing matters less than what you post: treat this as a tie-breaker.'],
        boost: 'A small lift in early reach',
        confidence: { level: 'low', reason: 'Few posts per slot' },
        action: { label: 'Open the calendar', to: '/calendar' },
      }),
    )
  }
  if (bestTopic) {
    out.push(
      base({
        id: `topic:${bestTopic.key}`,
        category: 'topic',
        title: `Plan a short series on “${bestTopic.key}”`,
        topic: bestTopic.key,
        confidence: { level: bestTopic.posts >= 8 ? 'high' : 'medium', reason: `${bestTopic.posts} posts on this topic`, pct: share((p) => p.topic === bestTopic.key) },
        why: [`Posts on this topic get ${pct(bestTopic.median_impressions)} vs the typical post (${bestTopic.posts} posts).`],
        boost: 'More reach and more relevant comments',
        action: { label: 'Create a post', to: '/create' },
      }),
    )
  }
  if (bestCta) {
    out.push(
      base({
        id: `cta:${bestCta.key}`,
        category: 'cta',
        priority: 'low',
        title: `End more posts with “${bestCta.key}”`,
        why: [`Posts with this call to action get a median of ${Math.round(bestCta.median_clicks ?? 0)} clicks.`],
        boost: 'More clicks and enquiries',
        measure: { metric: 'Median clicks', period: 'Next 4 weeks', target: 'Higher than now' },
      }),
    )
  }
  const c = consistency(db, accountId, cp)
  if (c.weeks_without_posts > 0) {
    out.push(
      base({
        id: 'consistency:gaps',
        category: 'consistency',
        priority: 'medium',
        title: 'Post every week, even a short one',
        why: [`${c.weeks_without_posts} of the last 12 weeks had no post.`],
        boost: 'Steadier reach; LinkedIn favours pages that post regularly',
      }),
    )
  }
  if (untagged) {
    out.push(
      base({
        id: 'data:untagged',
        category: 'data',
        priority: 'high',
        title: 'Tag the format of imported posts',
        why: ['LinkedIn’s export doesn’t say what kind of post each one was, so format comparisons leave them out.'],
        boost: 'More reliable format suggestions',
        progress: { done: posts.length - untagged, total: posts.length, label: 'posts tagged' },
        action: { label: 'Open posts', to: '/data?tab=posts' },
      }),
    )
  }
  if (suggestedTopics) {
    out.push(
      base({
        id: 'data:topics',
        category: 'data',
        title: 'Check the suggested topics',
        why: [`${suggestedTopics} topics were guessed from the caption on import.`],
        progress: { done: posts.length - suggestedTopics, total: posts.length, label: 'topics confirmed' },
        action: { label: 'Open posts', to: '/data?tab=posts' },
      }),
    )
  }
  if (noAudience) {
    out.push(
      base({
        id: 'data:audience',
        category: 'data',
        priority: 'low',
        title: 'Record who saw your posts',
        why: ['Audience numbers show whether posts reach UAE decision-makers, not just anyone.'],
        progress: { done: posts.filter((p) => p.audience.length).length, total: posts.filter((p) => p.time_known).length, label: 'posts with audience' },
        action: { label: 'Open posts', to: '/data?tab=posts' },
      }),
    )
  }
  return {
    metric: 'impressions',
    metric_label: 'impressions',
    baseline,
    checkpoint: suggestedCheckpoint(posts),
    generated_at: new Date().toISOString(),
    suggestions: out,
  }
}

export function similarPosts(db: MockDb, accountId: number, queries: { key: string; text: string; topic?: string | null }[]): SimilarResponse {
  const posts = accountPosts(db, accountId)
  const baseline = median(posts.map((p) => snapAt(p, 'latest')?.impressions))
  const results: SimilarResponse['results'] = {}
  for (const q of queries) {
    const words = q.text.toLowerCase().split(/\W+/).filter((w) => w.length > 4)
    const match = posts.filter((p) =>
      q.topic ? p.topic === q.topic : words.some((w) => (p.caption ?? '').toLowerCase().includes(w)),
    )
    const m = median(match.map((p) => snapAt(p, 'latest')?.impressions))
    results[q.key] = {
      topic: q.topic ?? null,
      count: match.length,
      with_numbers: match.filter((p) => p.snapshots.length).length,
      median_impressions: m,
      verdict: m == null || baseline == null ? null : m > baseline * 1.1 ? 'above' : m < baseline * 0.9 ? 'below' : 'similar',
      posts: match.slice(0, 3).map((p) => ({
        id: p.id,
        hook: (p.caption ?? '').split('\n')[0],
        published: p.published_at_uae.slice(0, 10),
        impressions: snapAt(p, 'latest')?.impressions ?? null,
      })),
    }
  }
  return { checkpoint: 'latest', baseline, results }
}

