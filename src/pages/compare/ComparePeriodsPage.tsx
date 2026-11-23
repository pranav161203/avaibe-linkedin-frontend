import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { addDays, differenceInCalendarDays, parseISO } from 'date-fns'
import { Info } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, PageHeader } from '@/components/common'
import { todayUae, totals, useSortedDaily, ymd } from '@/components/period'
import { TimeRangePicker, type TimeRange } from '@/components/time-range'
import { useAccount } from '@/context/account'
import type { Checkpoint, PageDay } from '@/lib/api'
import { useGetCalendarItems } from '@/pages/calendar/queries'
import { MetricsChart } from '@/pages/data/components/MetricsChart'
import { useGetOverview, useGetPageAudience, useGetPosts } from '@/pages/data/queries'
import { InsightsPanel } from './components/InsightsPanel'
import { NumbersTable } from './components/NumbersTable'
import { PeriodTag } from './components/PeriodTag'
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
  const b = readRange(params, 'b', { from: ymd(addDays(parseISO(a.from), -lenA)), to: ymd(addDays(parseISO(a.from), -1)) })
  const lenB = differenceInCalendarDays(parseISO(b.to), parseISO(b.from)) + 1
  const setSide = (key: 'a' | 'b', w: Range | null) =>
    w &&
    setParams((p) => {
      p.set(`${key}_from`, w.from)
      p.set(`${key}_to`, w.to)
      return p
    }, { replace: true })

  const { daily, isLoading } = useSortedDaily(id)
  const { data: probe } = useGetOverview(id, '24h')
  const cp = (probe?.suggested_checkpoint ?? '7d') as Checkpoint
  const { data: posts = [] } = useGetPosts(id, { checkpoint: cp })
  const { data: audience = [] } = useGetPageAudience(id)
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
    return { ta, tb, sa, sb, insights }
  }, [daily, posts, cal, cp, a.from, a.to, b.from, b.to]) // eslint-disable-line react-hooks/exhaustive-deps

  const uaeAt = (end: string) =>
    audience
      .filter((x) => x.audience === 'followers' && x.as_of <= end)
      .sort((x, y) => x.as_of.localeCompare(y.as_of))
      .at(-1)?.shares.uae_share ?? null

  return (
    <div className="mx-auto max-w-page">
      <PageHeader eyebrow="Data" back="/data" title="Compare periods" description="Two periods side by side: what changed, and what's behind it." />

      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-[1.8rem] bg-card px-5 py-4">
        <PeriodTag letter="A" />
        <TimeRangePicker bare value={asRange(a)} onChange={(r) => setSide('a', toDates(r, daily))} />
        <span className="text-sm text-muted-foreground">compared with</span>
        <PeriodTag letter="B" />
        <TimeRangePicker bare value={asRange(b)} onChange={(r) => setSide('b', toDates(r, daily))} />
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
          <InsightsPanel wording="cause" headline={view.insights.headline} subline={view.insights.subline} findings={view.insights.findings} next={view.insights.next} />

          <section>
            <h2 className="mb-1 text-base font-semibold">The numbers</h2>
            <p className="mb-3 flex items-start gap-1.5 text-xs text-muted-foreground">
              <Info className="mt-px size-3.5 shrink-0" />
              {lenA === lenB ? `Both periods are ${lenA} days.` : `A is ${lenA} days and B is ${lenB}, so the change is worked out per day to keep it fair.`} Typical post figures are at{' '}
              {cp === '7d' ? '7 days' : cp} old.
            </p>
            <NumbersTable a={a} b={b} ta={view.ta} tb={view.tb} sa={view.sa} sb={view.sb} uaeA={uaeAt(a.to)} uaeB={uaeAt(b.to)} lenA={lenA} lenB={lenB} />
          </section>

          <MetricsChart
            daily={daily}
            from={a.from}
            to={a.to}
            metrics={PERIOD_METRICS}
            posts={view.sa.posts}
            param="pm"
            title="Both periods, day by day"
            compare={{ from: b.from, to: b.to, label: `B: ${periodLabel(b.from, b.to)}` }}
          />

          <section>
            <h2 className="mb-3 text-base font-semibold">What you posted</h2>
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
