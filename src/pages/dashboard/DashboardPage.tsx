import { useMemo } from 'react'
import { addDays, differenceInCalendarDays, startOfMonth, subMonths } from 'date-fns'
import { Link, useSearchParams } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { Eye, Info, MousePointerClick, Pointer, UserPlus, Users } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, PageHeader } from '@/components/common'
import { NewPostMenu } from '@/components/NewPostMenu'
import { FormatsCard } from '@/pages/dashboard/components/FormatsCard'
import { WeeklyPostsCard } from '@/pages/dashboard/components/WeeklyPostsCard'
import { RingsCard } from '@/pages/dashboard/components/RingsCard'
import { engagementOf, pt, rel, useSortedDaily, usePeriod, ymd } from '@/components/period'
import { TimeRangePicker, type TimeRange } from '@/components/time-range'
import { useAccount } from '@/context/account'
import { fmtNumber, fmtPct } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Attention } from './components/Attention'
import { AudienceCard } from './components/AudienceCard'
import { BestPosts } from './components/BestPosts'
import { Kpi } from './components/Kpi'
import { uaeDay } from './utils'
import { useGetOverview, useGetPageAudience, useGetPosts } from '@/pages/data/queries'

export function DashboardPage() {
  const { account } = useAccount()
  const id = account?.id
  const [params, setParams] = useSearchParams()
  const range: TimeRange = { preset: params.get('range') ?? '30', from: params.get('from') ?? undefined, to: params.get('to') ?? undefined }
  const setRange = (r: TimeRange) =>
    setParams((p) => {
      p.set('range', r.preset)
      for (const k of ['from', 'to'] as const) {
        if (r.preset === 'custom' && r[k]) p.set(k, r[k]!)
        else p.delete(k)
      }
      return p
    }, { replace: true })

  const { daily, isLoading } = useSortedDaily(id)
  const { data: audience = [] } = useGetPageAudience(id)
  // This period vs the previous one (same days only, so days LinkedIn hasn't reported don't count against it)
  const { win, stats } = usePeriod(daily, range)
  // Posts at the age most of them have, so formats are compared like with like
  const { data: probe } = useGetOverview(id, '24h')
  const { data: posts = [] } = useGetPosts(id, { checkpoint: probe?.suggested_checkpoint ?? '24h' })

  const uae = useMemo(() => {
    const latest = (aud: 'followers' | 'visitors') =>
      audience.filter((a) => a.audience === aud).sort((a, b) => a.as_of.localeCompare(b.as_of)).at(-1)
    const f = latest('followers')
    return { share: f?.shares.uae_share ?? null, total: f?.total ?? null, asOf: f?.as_of ?? null, visitors: latest('visitors')?.shares.uae_share ?? null }
  }, [audience])

  // Day-by-day values for the hero chart and the tiles' trend lines
  const byDate = useMemo(() => new Map(daily.map((d) => [d.date, d])), [daily])
  const series = useMemo(() => {
    if (!win) return null
    const len = differenceInCalendarDays(parseISO(win.to), parseISO(win.from)) + 1
    const days = Array.from({ length: len }, (_, i) => ymd(addDays(parseISO(win.from), i)))
    const pick = (get: (d: (typeof daily)[number]) => number | null) => days.map((d) => (byDate.get(d) ? get(byDate.get(d)!) : null))
    const er = (d: (typeof daily)[number]) => (d.impressions ? ((d.clicks ?? 0) + (d.reactions ?? 0) + (d.comments ?? 0) + (d.reposts ?? 0)) / d.impressions : null)
    return {
      impressions: pick((d) => d.impressions),
      engagement: pick(er),
      clicks: pick((d) => d.clicks),
      visitors: pick((d) => d.unique_visitors),
      followers: pick((d) => d.new_followers),
    }
  }, [win?.from, win?.to, byDate]) // eslint-disable-line react-hooks/exhaustive-deps

  // Posts this calendar month, against a usual month (median of the last 3 full months)
  const monthPosts = useMemo(() => {
    const now = uaeDay(new Date().toISOString())
    const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`
    const counts = new Map<string, number>()
    for (const p of posts) {
      const k = key(uaeDay(p.published_at))
      counts.set(k, (counts.get(k) ?? 0) + 1)
    }
    const last3 = [1, 2, 3].map((n) => counts.get(key(subMonths(startOfMonth(now), n))) ?? 0).sort((a, b) => a - b)
    return { count: counts.get(key(now)) ?? 0, usual: last3.some((v) => v > 0) ? last3[1] : null, month: format(now, 'MMMM') }
  }, [posts])

  // The same period carried over to Data
  const rangeQs = `range=${range.preset}${range.preset === 'custom' ? `&from=${range.from ?? ''}&to=${range.to ?? ''}` : ''}`
  const dataLink = (tab: string, extra?: string) => `/data?tab=${tab}&${rangeQs}${extra ? `&${extra}` : ''}`

  return (
    <div className="mx-auto max-w-page">
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description={account?.name}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <TimeRangePicker value={range} onChange={setRange} />
            <NewPostMenu from="dashboard" />
          </div>
        }
      />

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : !stats ? (
        <EmptyState>
          {daily.length ? 'Pick a start and end date to see this period.' : <>No page data yet. <Link to="/import" className="underline">Import LinkedIn’s page export</Link> to see how the page is doing.</>}
        </EmptyState>
      ) : (
        <>
          <p className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info className="size-3.5" />
            {format(parseISO(win!.from), 'd MMM yyyy')} – {format(parseISO(win!.to), 'd MMM yyyy')}
            {stats.prev ? ', compared with the same number of days before' : ''}
            {stats.partial && <> · LinkedIn data so far runs to {format(parseISO(stats.lastData), 'd MMM yyyy')}</>}
          </p>

          {/* Row 1: the headline numbers, each with its day-by-day trend */}
          <div className={cn('grid gap-3 sm:grid-cols-2', account?.kind === 'company' ? 'lg:grid-cols-5' : 'lg:grid-cols-4')}>
            <Kpi
              to={dataLink('analytics', 'cm=impressions')}
              icon={Eye}
              label="Impressions"
              value={fmtNumber(stats.cur.impressions)}
              change={rel(stats.cur.impressions, stats.prev?.impressions)}
              note={stats.prev ? `vs. ${fmtNumber(stats.prev.impressions)}` : 'No earlier period'}
              trend={series?.impressions}
            />
            <Kpi
              to={dataLink('analytics', 'cm=engagements')}
              icon={MousePointerClick}
              label="Engagement rate"
              value={fmtPct(engagementOf(stats.cur))}
              change={pt(engagementOf(stats.cur), stats.prev ? engagementOf(stats.prev) : null)}
              note={stats.prev ? `vs. ${fmtPct(engagementOf(stats.prev))}` : 'No earlier period'}
              trend={series?.engagement}
            />
            <Kpi
              to={dataLink('analytics', 'cm=clicks')}
              icon={Pointer}
              label="Clicks"
              value={fmtNumber(stats.cur.clicks)}
              change={rel(stats.cur.clicks, stats.prev?.clicks)}
              note={stats.prev ? `vs. ${fmtNumber(stats.prev.clicks)}` : 'No earlier period'}
              trend={series?.clicks}
            />
            {account?.kind === 'company' && (
              <Kpi
                to={dataLink('visitors', 'vm=unique_visitors')}
                icon={Users}
                label="Page visitors"
                value={fmtNumber(stats.cur.unique_visitors)}
                change={rel(stats.cur.unique_visitors, stats.prev?.unique_visitors)}
                note={stats.prev ? `vs. ${fmtNumber(stats.prev.unique_visitors)}` : 'No earlier period'}
                trend={series?.visitors}
              />
            )}
            <Kpi
              to={dataLink('followers')}
              icon={UserPlus}
              label="New followers"
              value={fmtNumber(stats.cur.new_followers)}
              change={rel(stats.cur.new_followers, stats.prev?.new_followers)}
              note={stats.prev ? `vs. ${fmtNumber(stats.prev.new_followers)}` : 'No earlier period'}
              trend={series?.followers}
            />
          </div>
        </>
      )}

      {stats && (
        <>
          {/* Row 2: three cards of the same height: the rings, posts per week, what needs doing */}
          <div className="mt-4 grid gap-4 lg:grid-cols-3 [&>*]:h-full">
            <RingsCard
              uae={account?.kind === 'company' ? { share: uae.share, total: uae.total, asOf: uae.asOf ? format(parseISO(uae.asOf), 'd MMM') : null, to: dataLink('followers') } : null}
              posts={{ ...monthPosts, to: '/data?tab=posts' }}
            />
            <WeeklyPostsCard posts={posts} />
            <div id="tasks" className="scroll-mt-6 [&>*]:h-full">
              <Attention accountId={id} />
            </div>
          </div>

          {/* Row 3: what did well, and who the audience is */}
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className={cn('[&>*]:h-full', account?.kind === 'company' ? 'lg:col-span-2' : 'lg:col-span-3')}>
              <BestPosts accountId={id} range={range} />
            </div>
            {account?.kind === 'company' && (
              <div className="[&>*]:h-full">
                <AudienceCard audience={audience} followersLink={dataLink('followers')} visitorsLink={dataLink('visitors')} />
              </div>
            )}
          </div>

          {/* Row 4: which formats get seen */}
          <div className="mt-4">
            <FormatsCard posts={posts} range={range} checkpoint={probe?.suggested_checkpoint ?? '24h'} />
          </div>
        </>
      )}
    </div>

  )
}
