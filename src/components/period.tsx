/** Period totals from the daily page data, compared with the previous period: shared by the Dashboard and Data page. */
import { useMemo } from 'react'
import { addDays, addYears, differenceInCalendarDays, format, parseISO, subYears } from 'date-fns'
import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { TimeRange } from '@/components/time-range'
import type { PageDay } from '@/lib/api'
import { fmtNumber, fmtPct } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useGetPageDaily } from '@/pages/data/queries'

export const ymd = (d: Date) => format(d, 'yyyy-MM-dd')
export const todayUae = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai' }).format(new Date())

type Field = Exclude<keyof PageDay, 'date'>
const FIELDS: Field[] = ['impressions', 'unique_impressions', 'clicks', 'reactions', 'comments', 'reposts', 'page_views', 'unique_visitors', 'new_followers']
export type Totals = Record<Field, number | null> & { days: number }

/** Sum each metric over the days; a metric with no data on any day stays null ("not available") */
export function totals(days: PageDay[]): Totals {
  const out = { days: days.length } as Totals
  for (const f of FIELDS) {
    const vals = days.map((d) => d[f]).filter((v): v is number => v != null)
    out[f] = vals.length ? vals.reduce((a, b) => a + b, 0) : null
  }
  return out
}

export const engagementOf = (t: Totals) =>
  t.impressions ? ((t.clicks ?? 0) + (t.reactions ?? 0) + (t.comments ?? 0) + (t.reposts ?? 0)) / t.impressions : null

/** The chosen range as [from, to] dates; "All time" spans the data itself */
export function windowOf(range: TimeRange, daily: PageDay[]): { from: string; to: string } | null {
  const today = todayUae()
  if (range.preset === 'custom') return range.from && range.to ? { from: range.from, to: range.to } : null
  if (range.preset === 'all') return daily.length ? { from: daily[0].date, to: daily[daily.length - 1].date } : null
  return { from: ymd(addDays(parseISO(today), -(Number(range.preset) - 1))), to: today }
}

export interface PeriodStats {
  len: number
  cur: Totals
  prev: Totals | null
  curDays: PageDay[]
  lastData: string
  partial: boolean
  /** The dates compared with (null when there's nothing to compare) */
  prevWin: { from: string; to: string } | null
  /** Custom comparison of a different length: its totals were scaled to this period's number of days */
  prevScaled: boolean
}

/** What a period is compared with: the days just before (default), the same days a year earlier, or chosen dates */
export interface Comparison {
  mode: 'prev' | 'year' | 'custom'
  from?: string
  to?: string
}

/** This period's totals and the comparison period's. "Previous" and "last year" use the same days only, so days
    LinkedIn hasn't reported don't count against either side; a custom period of another length is scaled. */
export function usePeriod(daily: PageDay[], range: TimeRange, cmp: Comparison = { mode: 'prev' }) {
  const win = windowOf(range, daily)
  const stats = useMemo<PeriodStats | null>(() => {
    if (!win || !daily.length) return null
    const len = differenceInCalendarDays(parseISO(win.to), parseISO(win.from)) + 1
    const cur = daily.filter((d) => d.date >= win.from && d.date <= win.to)
    const curDates = new Set(cur.map((d) => d.date))
    const lastData = daily[daily.length - 1].date
    let prev: Totals | null = null
    let prevWin: PeriodStats['prevWin'] = null
    let prevScaled = false
    if (cmp.mode === 'custom' && cmp.from && cmp.to) {
      const days = daily.filter((d) => d.date >= cmp.from! && d.date <= cmp.to!)
      prevWin = { from: cmp.from, to: cmp.to }
      if (days.length && cur.length) {
        prev = totals(days)
        if (days.length !== cur.length) {
          // Different lengths: compare like for like by scaling the other period to this one's number of days
          const k = cur.length / days.length
          for (const key of Object.keys(prev) as (keyof Totals)[]) if (key !== 'days' && prev[key] != null) prev[key] = Math.round((prev[key] as number) * k)
          prev.days = cur.length
          prevScaled = true
        }
      }
    } else if (range.preset !== 'all') {
      const shift = (d: string) => (cmp.mode === 'year' ? ymd(addYears(parseISO(d), 1)) : ymd(addDays(parseISO(d), len)))
      const prevDays = daily.filter((d) => curDates.has(shift(d.date)))
      prevWin =
        cmp.mode === 'year'
          ? { from: ymd(subYears(parseISO(win.from), 1)), to: ymd(subYears(parseISO(win.to), 1)) }
          : { from: ymd(addDays(parseISO(win.from), -len)), to: ymd(addDays(parseISO(win.from), -1)) }
      // Only compare when the other period is (almost) fully covered by data
      if (cur.length && prevDays.length >= cur.length * 0.8) prev = totals(prevDays)
    }
    return { len, cur: totals(cur), prev, curDays: cur, lastData, partial: lastData < win.to, prevWin, prevScaled }
  }, [daily, win?.from, win?.to, range.preset, cmp.mode, cmp.from, cmp.to]) // eslint-disable-line react-hooks/exhaustive-deps
  return { win, stats }
}

/** "vs previous 30 days" / "vs same period last year" / "vs 1 Mar – 30 Mar 2026" */
export function comparisonLabel(stats: PeriodStats | null, cmp: Comparison): string {
  if (!stats) return ''
  if (cmp.mode === 'year') return 'vs same period last year'
  if (cmp.mode === 'custom' && stats.prevWin)
    return `vs ${format(parseISO(stats.prevWin.from), 'd MMM')} – ${format(parseISO(stats.prevWin.to), 'd MMM yyyy')}`
  return `vs previous ${stats.len} days`
}

/** The account's daily page data, sorted by date */
export function useSortedDaily(accountId: number | undefined) {
  const q = useGetPageDaily(accountId)
  const daily = useMemo(() => [...(q.data ?? [])].sort((a, b) => a.date.localeCompare(b.date)), [q.data])
  return { daily, isLoading: q.isLoading }
}

// ---------------------------------------------------------------- change vs the previous period

export type Change = { text: string; dir: 'up' | 'down' | 'flat' }

export function rel(cur: number | null | undefined, prev: number | null | undefined): Change | null {
  if (cur == null || !prev) return null
  const r = cur / prev - 1
  return { text: `${r >= 0 ? '+' : ''}${(r * 100).toFixed(0)}%`, dir: Math.abs(r) < 0.02 ? 'flat' : r > 0 ? 'up' : 'down' }
}

export function pt(cur: number | null, prev: number | null): Change | null {
  if (cur == null || prev == null) return null
  const d = (cur - prev) * 100
  return { text: `${d >= 0 ? '+' : ''}${d.toFixed(1)} pt`, dir: Math.abs(d) < 0.1 ? 'flat' : d > 0 ? 'up' : 'down' }
}

export function ChangeTag({ c }: { c: Change | null }) {
  if (!c) return null
  const Icon = c.dir === 'up' ? ArrowUpRight : c.dir === 'down' ? ArrowDownRight : ArrowRight
  return (
    <span className={cn('inline-flex items-center text-xs font-medium tabular-nums', c.dir === 'up' ? 'text-good-fg' : c.dir === 'down' ? 'text-bad-fg' : 'text-muted-foreground')}>
      <Icon className="size-3.5" />
      {c.text}
    </span>
  )
}

export function Mini({ label, v, prev, pct = false }: { label: string; v: number | null; prev?: number | null; pct?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 flex items-baseline gap-1.5">
        <span className="text-lg font-semibold tabular-nums">{v == null ? '—' : pct ? fmtPct(v) : fmtNumber(v)}</span>
        <ChangeTag c={pct ? pt(v, prev ?? null) : rel(v, prev)} />
      </dd>
    </div>
  )
}

// ---------------------------------------------------------------- the "Summary for this period" card

const ctr = (t: Totals | null | undefined) => (t?.impressions && t.clicks != null ? t.clicks / t.impressions : null)

export function PeriodSummary({ accountId, range }: { accountId?: number; range: TimeRange }) {
  const { daily, isLoading } = useSortedDaily(accountId)
  const { win, stats } = usePeriod(daily, range)
  if (isLoading) return <Skeleton className="h-36 rounded-xl" />
  if (!stats || !win) return null
  const c = stats.cur
  const p = stats.prev
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Summary for this period</CardTitle>
        <div className="text-xs text-muted-foreground">
          {format(parseISO(win.from), 'd MMM yyyy')} – {format(parseISO(win.to), 'd MMM yyyy')}
          {p ? ', compared with the preceding period of equal length' : ''}
          {stats.partial && <> · LinkedIn data available to {format(parseISO(stats.lastData), 'd MMM yyyy')}</>}
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4 lg:grid-cols-6">
          <Mini label="Impressions" v={c.impressions} prev={p?.impressions} />
          <Mini label="Unique impressions" v={c.unique_impressions} prev={p?.unique_impressions} />
          <Mini label="Clicks" v={c.clicks} prev={p?.clicks} />
          <Mini label="CTR" v={ctr(c)} prev={ctr(p)} pct />
          <Mini label="Engagement rate" v={engagementOf(c)} prev={p ? engagementOf(p) : null} pct />
          <Mini label="Reactions" v={c.reactions} prev={p?.reactions} />
          <Mini label="Comments" v={c.comments} prev={p?.comments} />
          <Mini label="Reposts" v={c.reposts} prev={p?.reposts} />
          <Mini label="Page views" v={c.page_views} prev={p?.page_views} />
          <Mini label="Unique visitors" v={c.unique_visitors} prev={p?.unique_visitors} />
          <Mini label="New followers" v={c.new_followers} prev={p?.new_followers} />
        </dl>
      </CardContent>
    </Card>
  )
}
