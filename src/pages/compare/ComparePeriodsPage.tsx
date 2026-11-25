import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { addDays, differenceInCalendarDays, parseISO, subYears } from 'date-fns'
import { Info } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, PageHeader } from '@/components/common'
import { engagementOf, todayUae, totals, useSortedDaily, ymd } from '@/components/period'
import { TimeRangePicker, type TimeRange } from '@/components/time-range'
import { useAccount } from '@/context/account'
import type { Checkpoint, PageDay } from '@/lib/api'
import { fmtNumber, fmtPct } from '@/lib/format'
import { useGetCalendarItems } from '@/pages/calendar/queries'
import { MetricsChart } from '@/pages/data/components/MetricsChart'
import { useGetOverview, useGetPosts } from '@/pages/data/queries'
import { InsightsPanel } from './components/InsightsPanel'
import { PeriodTag } from './components/PeriodTag'
import { CompareToPicker, type CompareMode } from './components/CompareToPicker'
import { PostedSide } from './components/PostedSide'
import { PERIOD_METRICS } from './constants'
import { analysePeriods, itemsByDate, periodLabel, periodSide } from './utils/insights'

type Range = { from: string; to: string }

function readRange(params: URLSearchParams, key: 'a' | 'b', fallback: Range): Range {
  const from = params.get(`${key}_from`)
  const to = params.get(`${key}_to`)
  return from && to && from <= to ? { from, to } : fallback
}

const asRange = (w: Range): TimeRange => ({ preset: 'custom', from: w.from, to: w.to })

function toDates(r: TimeRange, daily: PageDay[]): Range | null {
  const today = todayUae()
  if (r.preset === 'custom') return r.from && r.to ? { from: r.from, to: r.to } : null
  if (r.preset === 'all') return daily.length ? { from: daily[0].date, to: daily[daily.length - 1].date } : null
  return { from: ymd(addDays(parseISO(today), -(Number(r.preset) - 1))), to: today }
}

export function ComparePeriodsPage() {
  const { account } = useAccount()
  const id = account?.id
  const [params, setParams] = useSearchParams()
  const today = todayUae()
  const a = readRange(params, 'a', { from: ymd(addDays(parseISO(today), -29)), to: today })
  const lenA = differenceInCalendarDays(parseISO(a.to), parseISO(a.from)) + 1
  // Period B: the previous period (default), the same dates a year earlier, or custom dates
  const prevB: Range = { from: ymd(addDays(parseISO(a.from), -lenA)), to: ymd(addDays(parseISO(a.from), -1)) }
  const yearB: Range = { from: ymd(subYears(parseISO(a.from), 1)), to: ymd(subYears(parseISO(a.to), 1)) }
  const modeParam = params.get('b')
  const custom = readRange(params, 'b', prevB)
  const bMode: CompareMode = modeParam === 'year' ? 'year' : modeParam === 'custom' && params.get('b_from') ? 'custom' : 'prev'
  const b = bMode === 'year' ? yearB : bMode === 'custom' ? custom : prevB
  const lenB = differenceInCalendarDays(parseISO(b.to), parseISO(b.from)) + 1
  const setA = (w: Range | null) =>
    w &&
    setParams(
      (p) => {
        p.set('a_from', w.from)
        p.set('a_to', w.to)
        return p
      },
      { replace: true },
    )
  const setB = (m: CompareMode, r?: Range) =>
    setParams(
      (p) => {
        if (m === 'prev') p.delete('b')
        else p.set('b', m)
        if (m === 'custom' && r) {
          p.set('b_from', r.from)
          p.set('b_to', r.to)
        } else {
          p.delete('b_from')
          p.delete('b_to')
        }
        return p
      },
      { replace: true },
    )

  const { daily, isLoading } = useSortedDaily(id)
  const { data: probe } = useGetOverview(id, '24h')
  const cp = (probe?.suggested_checkpoint ?? '7d') as Checkpoint
  const { data: posts = [] } = useGetPosts(id, { checkpoint: cp })
  const calFrom = a.from < b.from ? a.from : b.from
  const calTo = a.to > b.to ? a.to : b.to
  const histFrom = posts.reduce((m, p) => (p.published_at_uae.slice(0, 10) < m ? p.published_at_uae.slice(0, 10) : m), calFrom)
  const { data: cal } = useGetCalendarItems(histFrom, calTo, differenceInCalendarDays(parseISO(calTo), parseISO(histFrom)) <= 800)

  const view = useMemo(() => {
    if (!daily.length) return null
    const days = (w: Range) => daily.filter((d) => d.date >= w.from && d.date <= w.to)
    const ta = totals(days(a))
    const tb = totals(days(b))
    const items = cal?.items ?? []
    const sa = periodSide(a.from, a.to, posts, cp, items)
    const sb = periodSide(b.from, b.to, posts, cp, items)
    const insights = analysePeriods(sa, sb, ta, tb, posts, cp, itemsByDate(items, histFrom, calTo))
    // Totals for each metric tile: A, B, and the change (per day when the periods differ in length)
    const sumOf = (rows: PageDay[], get: (d: PageDay) => number | null) => {
      const vals = rows.map(get).filter((v): v is number => v != null)
      return vals.length ? vals.reduce((x, y) => x + y, 0) : null
    }
    const rowsA = days(a)
    const rowsB = days(b)
    const summary = (m: (typeof PERIOD_METRICS)[number]) => {
      const va = sumOf(rowsA, m.get)
      const vb = sumOf(rowsB, m.get)
      const change = va != null && vb ? (va / lenA - vb / lenB) / (vb / lenB) : null
      const rate = m.value === 'engagements' ? { a: engagementOf(ta), b: engagementOf(tb) } : null
      return {
        a: va == null ? '—' : fmtNumber(va),
        b: vb == null ? '—' : fmtNumber(vb),
        change,
        // Per day, so a longer period doesn't win just by being longer
        higher: va == null || vb == null || va / lenA === vb / lenB ? null : va / lenA > vb / lenB ? ('a' as const) : ('b' as const),
        note: rate && rate.a != null ? `Rate: A ${fmtPct(rate.a)} · B ${fmtPct(rate.b)}` : undefined,
      }
    }
    return { ta, tb, sa, sb, insights, summary }
  }, [daily, posts, cal, cp, a.from, a.to, b.from, b.to]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mx-auto max-w-page">
      <PageHeader eyebrow="Data" back="/data" title="Compare periods" description="Compare two periods and the factors behind the change." />

      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-[1.8rem] bg-card px-5 py-4">
        <PeriodTag letter="A" />
        <TimeRangePicker bare value={asRange(a)} onChange={(r) => setA(toDates(r, daily))} />
        <span className="text-sm text-muted-foreground">compared with</span>
        <PeriodTag letter="B" />
        <CompareToPicker mode={bMode} value={b} prev={prevB} year={yearB} today={parseISO(today)} onChange={setB} />
      </div>

      {isLoading ? (
        <Skeleton className="h-96 rounded-[1.8rem]" />
      ) : !view ? (
        <EmptyState>
          No LinkedIn data yet.{' '}
          <Link to="/import" className="underline">
            Import LinkedIn’s export
          </Link>{' '}
          to compare periods.
        </EmptyState>
      ) : (
        <div className="space-y-8">
          <InsightsPanel headline={view.insights.headline} subline={view.insights.subline} findings={view.insights.findings} next={view.insights.next} />

          <section>
            <h2 className="mb-1 text-base font-semibold">Metrics</h2>
            <p className="mb-3 flex items-start gap-1.5 text-xs text-muted-foreground">
              <Info className="mt-px size-3.5 shrink-0" />
              {lenA === lenB
                ? `Both periods are ${lenA} day${lenA === 1 ? '' : 's'}.`
                : `A is ${lenA} day${lenA === 1 ? '' : 's'} and B is ${lenB}; changes are calculated per day.`}{' '}
              {Math.min(lenA, lenB) < 7 && 'Short periods are volatile; treat changes as indicative.'} Typical post figures are measured at{' '}
              {cp === '7d' ? '7 days' : cp}.{lenA > 2 && ' Select a metric to view it by day.'}
            </p>
            {/* One card: the tiles carry both periods' totals; the chart shows the chosen one day by day (needs a few days) */}
            <MetricsChart
              daily={daily}
              from={a.from}
              to={a.to}
              metrics={PERIOD_METRICS}
              posts={view.sa.posts}
              param="pm"
              title={lenA > 2 ? 'A vs B by day' : 'A vs B'}
              compare={{ from: b.from, to: b.to, label: `B: ${periodLabel(b.from, b.to)}` }}
              summary={view.summary}
              showChart={lenA > 2}
            />
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold">Posts published</h2>
            <div className="grid gap-4 lg:grid-cols-2">
              <PostedSide letter="A" side={view.sa} cp={cp} />
              <PostedSide letter="B" side={view.sb} cp={cp} />
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
