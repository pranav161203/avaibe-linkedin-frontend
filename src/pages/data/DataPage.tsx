import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { FileUp } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { useAuth } from '@/context/auth'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, PageHeader } from '@/components/common'
import { Highlights } from '@/pages/data/components/Highlights'
import { MetricsChart } from '@/pages/data/components/MetricsChart'
import { engagementOf, useSortedDaily, usePeriod } from '@/components/period'
import { useAccount } from '@/context/account'
import { PostsPage } from '@/pages/data/PostsPage'
import { TimeRangePicker, type TimeRange } from '@/components/time-range'
import { cn } from '@/lib/utils'
import type { CheckpointQ } from '@/lib/api'
import { ContentSummary } from './components/ContentSummary'
import { FollowersTab } from './components/FollowersTab'
import { LastUpdated } from './components/LastUpdated'
import { VisitorsTab } from './components/VisitorsTab'
import { TABS, LEGACY, CONTENT_METRICS } from './constants'
import { postDate } from './utils'
import { useGetOverview, useGetPosts } from '@/pages/data/queries'

/** Analytics in LinkedIn's layout (Highlights → Metrics → detail), with our analysis inside the Content tab. */
export function DataPage() {
  const { account } = useAccount()
  const auth = useAuth()
  const id = account?.id
  const isCompany = account?.kind === 'company'
  const tabs = TABS.filter((t) => isCompany || !('companyOnly' in t))
  // Posts are compared at the age most of them have (7d for history from LinkedIn), chosen automatically
  const { data: probe } = useGetOverview(id, '24h')
  const checkpoint: CheckpointQ = probe?.suggested_checkpoint ?? '24h'
  const [params, setParams] = useSearchParams()

  const raw = params.get('tab') ?? 'analytics'
  const tabRaw = LEGACY[raw] ?? raw
  const tab = tabs.some((t) => t.value === tabRaw) ? tabRaw : 'analytics'
  const setTab = (v: string) => setParams((p) => { p.set('tab', v); p.delete('view'); return p }, { replace: true })

  // Time range: like LinkedIn's own analytics, kept in the address so it can be shared
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
  const { win, stats } = usePeriod(daily, range)
  const { data: posts = [] } = useGetPosts(id, { checkpoint })
  const periodPosts = useMemo(() => (win ? posts.filter((p) => postDate(p) >= win.from && postDate(p) <= win.to) : []), [posts, win?.from, win?.to]) // eslint-disable-line react-hooks/exhaustive-deps

  const dates = win && (
    <>
      Data for {format(parseISO(win.from), 'd MMM yyyy')} – {format(parseISO(win.to), 'd MMM yyyy')}
      {stats?.partial && <> · LinkedIn data so far runs to {format(parseISO(stats.lastData), 'd MMM yyyy')}</>}
    </>
  )
  const compareLabel = stats ? `vs previous ${stats.len} days` : ''

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Overview"
        title="Data"
        description="How your posts, page visitors and followers are doing."
        actions={
          <div className="flex items-center gap-2">
            <TimeRangePicker value={range} onChange={setRange} />
            {/* Import brings in posts, so it sits with the Posts tab only */}
            {tab === 'posts' && auth.can('editor') && (
              <Link to="/import" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                <FileUp /> Import
              </Link>
            )}
          </div>
        }
      />

      {/* LinkedIn-style underlined tabs */}
      <nav role="tablist" aria-label="Analytics" className="mb-5 flex gap-6 border-b">
        {tabs.map((t) => (
          <button
            key={t.value}
            role="tab"
            type="button"
            aria-selected={tab === t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              '-mb-px border-b-2 px-0.5 pb-2.5 text-sm font-medium transition-colors',
              tab === t.value ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
        {id && <LastUpdated accountId={id} kind={tab === 'visitors' ? 'visitors' : tab === 'followers' ? 'followers' : 'content'} />}
      </nav>

      {tab === 'posts' ? (
        // Every post with its numbers (was its own page); uses the time range above
        <PostsPage embedded range={range} />
      ) : isLoading ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : !win || !stats ? (
        <EmptyState>
          {daily.length ? 'Pick a start and end date to see this period.' : <>No LinkedIn data yet. <Link to="/import" className="underline">Import LinkedIn’s export</Link> to see how the account is doing.</>}
        </EmptyState>
      ) : tab === 'analytics' ? (
        <div className="space-y-4">
          <Highlights
            dates={dates}
            compareLabel={compareLabel}
            items={[
              { label: 'Impressions', value: stats.cur.impressions, prev: stats.prev?.impressions },
              { label: 'Clicks', value: stats.cur.clicks, prev: stats.prev?.clicks },
              {
                label: 'Engagement rate',
                value: engagementOf(stats.cur),
                prev: stats.prev ? engagementOf(stats.prev) : null,
                pct: true,
                small: (stats.cur.impressions ?? 0) < 300,
              },
              { label: 'Comments', value: stats.cur.comments, prev: stats.prev?.comments },
            ]}
            summary={<ContentSummary periodPosts={periodPosts} allPosts={posts} />}
          />
          <MetricsChart daily={daily} from={win.from} to={win.to} metrics={CONTENT_METRICS} posts={posts} param="cm" title="What happened when" />
        </div>
      ) : tab === 'visitors' ? (
        <VisitorsTab accountId={id} daily={daily} win={win} stats={stats} dates={dates} compareLabel={compareLabel} posts={posts} />
      ) : (
        <FollowersTab accountId={id} daily={daily} win={win} stats={stats} dates={dates} compareLabel={compareLabel} posts={posts} />
      )}
    </div>
  )
}
