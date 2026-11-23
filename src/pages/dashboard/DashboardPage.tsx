import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { Eye, Info, MapPin, MousePointerClick, UserPlus, Users } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, PageHeader } from '@/components/common'
import { FormatsCard } from '@/pages/dashboard/components/FormatsCard'
import { ResultsCard } from '@/pages/dashboard/components/ResultsCard'
import { RhythmCard } from '@/pages/dashboard/components/RhythmCard'
import { engagementOf, pt, rel, useSortedDaily, usePeriod } from '@/components/period'
import { TimeRangePicker, type TimeRange } from '@/components/time-range'
import { useAccount } from '@/context/account'
import { fmtNumber, fmtPct } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Attention } from './components/Attention'
import { AudienceCard } from './components/AudienceCard'
import { BestPosts } from './components/BestPosts'
import { FounderCard } from './components/FounderCard'
import { Kpi } from './components/Kpi'
import { useGetOverview, useGetPageAudience, useGetPosts } from '@/pages/data/queries'

export function DashboardPage() {
  const { account, accounts } = useAccount()
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
  const founders = accounts.filter((a) => a.parent_id != null && a.parent_id === id)
  // Posts at the age most of them have, so formats are compared like with like
  const { data: probe } = useGetOverview(id, '24h')
  const { data: posts = [] } = useGetPosts(id, { checkpoint: probe?.suggested_checkpoint ?? '24h' })

  const uae = useMemo(() => {
    const latest = (aud: 'followers' | 'visitors') =>
      audience.filter((a) => a.audience === aud).sort((a, b) => a.as_of.localeCompare(b.as_of)).at(-1)
    const f = latest('followers')
    return { share: f?.shares.uae_share ?? null, asOf: f?.as_of ?? null, visitors: latest('visitors')?.shares.uae_share ?? null }
  }, [audience])

  // The same period carried over to Data
  const rangeQs = `range=${range.preset}${range.preset === 'custom' ? `&from=${range.from ?? ''}&to=${range.to ?? ''}` : ''}`
  const dataLink = (tab: string, extra?: string) => `/data?tab=${tab}&${rangeQs}${extra ? `&${extra}` : ''}`

  return (
    <div className="mx-auto max-w-page">
      <PageHeader eyebrow="Overview" title="Dashboard" description={account ? `${account.name}${founders.length ? ` and its ${founders.length} founder profile${founders.length === 1 ? '' : 's'}` : ''}` : undefined} actions={<TimeRangePicker value={range} onChange={setRange} />} />

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

          {/* Headline numbers: each shows what it's compared with, and opens the matching Data tab */}
          <div className={cn('grid gap-3 sm:grid-cols-2', account?.kind === 'company' ? 'lg:grid-cols-5' : 'lg:grid-cols-4')}>
            <Kpi
              to={dataLink('content', 'cm=impressions')}
              icon={Eye}
              label="Impressions"
              value={fmtNumber(stats.cur.impressions)}
              change={rel(stats.cur.impressions, stats.prev?.impressions)}
              note={stats.prev ? `vs. ${fmtNumber(stats.prev.impressions)} last period` : 'No earlier period to compare'}
            />
            <Kpi
              to={dataLink('content', 'cm=engagements')}
              icon={MousePointerClick}
              label="Engagement rate"
              value={fmtPct(engagementOf(stats.cur))}
              change={pt(engagementOf(stats.cur), stats.prev ? engagementOf(stats.prev) : null)}
              note={stats.prev ? `vs. ${fmtPct(engagementOf(stats.prev))} last period` : 'No earlier period to compare'}
            />
            {account?.kind === 'company' && (
              <Kpi
                to={dataLink('visitors', 'vm=unique_visitors')}
                icon={Users}
                label="Page visitors"
                value={fmtNumber(stats.cur.unique_visitors)}
                change={rel(stats.cur.unique_visitors, stats.prev?.unique_visitors)}
                // LinkedIn counts unique visitors per day; the period adds those up
                note={stats.prev ? `vs. ${fmtNumber(stats.prev.unique_visitors)} last period` : 'No earlier period to compare'}
              />
            )}
            <Kpi
              to={dataLink('followers')}
              icon={UserPlus}
              label="New followers"
              value={fmtNumber(stats.cur.new_followers)}
              change={rel(stats.cur.new_followers, stats.prev?.new_followers)}
              note={stats.prev ? `vs. ${fmtNumber(stats.prev.new_followers)} last period` : 'No earlier period to compare'}
            />
            {account?.kind === 'company' ? (
              <Kpi
                to={dataLink('followers')}
                icon={MapPin}
                label="UAE share of followers"
                value={fmtPct(uae.share)}
                change={null}
                note={uae.asOf ? `As of ${format(parseISO(uae.asOf), 'd MMM')}` : 'Import or sync follower demographics'}
              />
            ) : (
              <Kpi
                to={dataLink('content', 'cm=clicks')}
                icon={MousePointerClick}
                label="Clicks"
                value={fmtNumber(stats.cur.clicks)}
                change={rel(stats.cur.clicks, stats.prev?.clicks)}
                note={stats.prev ? `vs. ${fmtNumber(stats.prev.clicks)} last period` : 'No earlier period to compare'}
              />
            )}
          </div>

          {/* Things the Data page doesn't show: how steady the posting is, which formats get seen, what attention turned into */}
          <div className="mt-4 grid items-start gap-4 lg:grid-cols-3">
            <RhythmCard posts={posts} />
            <FormatsCard posts={posts} range={range} checkpoint={probe?.suggested_checkpoint ?? '24h'} />
            <ResultsCard cur={stats.cur} prev={stats.prev} company={account?.kind === 'company'} />
          </div>
        </>
      )}

      {/* Two-thirds: posts and founders. One-third: who the audience is, and what needs doing */}
      <div className="mt-5 grid items-start gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <BestPosts accountId={id} range={range} />
          {founders.length > 0 && win && (
            <section>
              <h2 className="mb-1 text-base font-semibold">Founders</h2>
              <p className="mb-3 text-xs text-muted-foreground">All their posts, including ones not published through this app, for the same period.</p>
              <div className="grid gap-4 md:grid-cols-2">
                {founders.map((f) => (
                  <FounderCard key={f.id} founder={f} from={win.from} to={win.to} />
                ))}
              </div>
            </section>
          )}
        </div>
        <div className="space-y-4">
          {account?.kind === 'company' && <AudienceCard audience={audience} followersLink={dataLink('followers')} visitorsLink={dataLink('visitors')} />}
          <div id="tasks" className="scroll-mt-6">
            <Attention accountId={id} />
          </div>
        </div>
      </div>

    </div>

  )
}
