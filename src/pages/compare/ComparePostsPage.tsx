import { Link, useSearchParams } from 'react-router-dom'
import { ExternalLink, Info, X } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, PageHeader, PostRef } from '@/components/common'
import { useAuth } from '@/context/auth'
import { useTz } from '@/context/timezone'
import { CHECKPOINTS, POST_GOALS, type Checkpoint, type Post, type Snapshot } from '@/lib/api'
import { FORMAT_LABELS, fmtNumber, fmtPct } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useGetCalendarItems } from '@/pages/calendar/queries'
import { useGetPosts } from '@/pages/data/queries'
import { AiWhy } from './components/AiWhy'
import { GridCell, GridHeading, GridRow } from './components/CompareGrid'
import { InsightsPanel } from './components/InsightsPanel'
import { AGE, MIN_FOR_TYPICAL } from './constants'
import { useComparePosts, useGetCompareStatus, useGetPostsByIds } from './queries'
import { analysePosts, firstLine, itemsByDate, median, uaeDay } from './utils/insights'

type NumRow = { label: string; get: (s: Snapshot | undefined) => number | null; fmt: (v: number) => string; hint?: string }

const hasAt = (p: Post, cp: Checkpoint) => p.snapshots.some((s) => s.checkpoint === cp && s.impressions != null)

function commonCheckpoint(posts: Post[]): Checkpoint | null {
  for (const cp of [...CHECKPOINTS].reverse()) if (posts.every((p) => hasAt(p, cp))) return cp
  return null
}

export function ComparePostsPage() {
  const tz = useTz()
  const auth = useAuth()
  const [params, setParams] = useSearchParams()
  const ids = (params.get('ids') ?? '')
    .split(',')
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0)
    .slice(0, 4)
  const results = useGetPostsByIds(ids)
  const loading = results.some((r) => r.isLoading)
  const posts = results.map((r) => r.data).filter((p): p is Post => !!p)
  const cp = commonCheckpoint(posts)
  const snap = (p: Post) => (cp ? p.snapshots.find((s) => s.checkpoint === cp) : p.snapshots[p.snapshots.length - 1])

  const accountId = posts[0]?.account_id
  const { data: all = [] } = useGetPosts(accountId)
  const typical = cp && all.length ? median(all.flatMap((p) => p.snapshots.filter((s) => s.checkpoint === cp && s.impressions != null).map((s) => s.impressions!))) : null
  const enoughForTypical = cp ? all.filter((p) => hasAt(p, cp)).length >= MIN_FOR_TYPICAL : false

  const shared = CHECKPOINTS.filter((c) => posts.length > 1 && posts.every((p) => hasAt(p, c)))
  const histCount = (c: Checkpoint) => all.filter((p) => hasAt(p, c)).length
  const insightCp = shared.length ? shared.reduce((b, c) => (histCount(c) > histCount(b) ? c : b)) : null
  const today = uaeDay(new Date().toISOString())
  const histFrom = all.reduce((m, p) => (uaeDay(p.published_at) < m ? uaeDay(p.published_at) : m), today)
  const from400 = uaeDay(new Date(Date.now() - 400 * 86_400_000).toISOString())
  const calFrom = histFrom < from400 ? from400 : histFrom
  const { data: cal } = useGetCalendarItems(calFrom, today, all.length > 0)
  const insights = insightCp && cal && posts.length >= 2 ? analysePosts(posts, all, insightCp, itemsByDate(cal.items, calFrom, today), AGE[insightCp]) : null

  const status = useGetCompareStatus(accountId)
  const why = useComparePosts()

  const remove = (id: number) =>
    setParams((p) => {
      p.set('ids', ids.filter((x) => x !== id).join(','))
      return p
    })

  const NUMBERS: NumRow[] = [
    { label: 'Impressions', get: (s) => s?.impressions ?? null, fmt: fmtNumber },
    { label: 'Members reached', get: (s) => s?.members_reached ?? null, fmt: fmtNumber },
    { label: 'Clicks', get: (s) => s?.clicks ?? null, fmt: fmtNumber },
    { label: 'Click rate', get: (s) => s?.click_rate ?? null, fmt: (v) => fmtPct(v) },
    { label: 'Reactions', get: (s) => s?.reactions ?? null, fmt: fmtNumber },
    { label: 'Comments', get: (s) => s?.comments ?? null, fmt: fmtNumber },
    { label: 'Reposts', get: (s) => s?.reposts ?? null, fmt: fmtNumber },
    { label: 'Engagement rate', get: (s) => s?.engagement_rate ?? null, fmt: (v) => fmtPct(v) },
    { label: 'Views', get: (s) => s?.video_views ?? s?.newsletter_views ?? null, fmt: fmtNumber, hint: 'Video plays and article opens only' },
    { label: 'New followers', get: (s) => s?.followers_gained ?? null, fmt: fmtNumber },
    ...(typical && enoughForTypical
      ? [{ label: 'vs typical post', get: (s: Snapshot | undefined) => (s?.impressions != null ? s.impressions / typical : null), fmt: (v: number) => `${v.toFixed(1)}×`, hint: 'Impressions ÷ this account’s usual post at the same age' }]
      : []),
  ]

  const TEXT_ROWS: { label: string; get: (p: Post) => string }[] = [
    { label: 'Posted', get: (p) => (p.time_known ? `${tz.weekday(p.published_at)} ${tz.dateTime(p.published_at)}` : `${p.day_uae} ${p.published_at_uae.slice(0, 10)} (time unknown)`) },
    { label: 'Time slot (UAE)', get: (p) => p.slot_uae ?? '—' },
    { label: 'Format', get: (p) => FORMAT_LABELS[p.format] ?? p.format },
    { label: 'Goal', get: (p) => POST_GOALS.find((g) => g.value === p.goal)?.label ?? '—' },
    { label: 'Topic', get: (p) => p.topic ?? '—' },
    { label: 'Audience', get: (p) => (p.targeted == null ? '—' : p.targeted ? 'Targeted' : 'All') },
    { label: 'Hook (first line)', get: (p) => firstLine(p) || '—' },
    { label: 'Length', get: (p) => (p.caption ? `${p.caption.length.toLocaleString()} characters` : '—') },
    { label: 'Hashtags', get: (p) => (p.hashtags.length ? p.hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ') : 'None') },
    { label: 'Call to action', get: (p) => p.cta ?? '—' },
  ]

  const cols = `minmax(150px,190px) repeat(${Math.max(posts.length, 1)}, minmax(200px,1fr))`

  return (
    <div className="mx-auto max-w-page">
      <PageHeader eyebrow="Data" back="/data?tab=posts" title="Compare posts" description="Posts compared at the same age. The best value in each row is highlighted." />

      {ids.length < 2 ? (
        <EmptyState>
          Pick 2 to 4 posts to compare: tick them in{' '}
          <Link to="/data?tab=posts" className="underline">
            Data → Posts
          </Link>
          , then click Compare.
        </EmptyState>
      ) : loading ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : (
        <>
          {insights ? (
            <div className="mb-8">
              <InsightsPanel
                headline={insights.headline}
                subline={insights.subline}
                findings={insights.findings}
                same={insights.same}
                next={insights.next}
                caution={insights.caution}
                ai={
                  <AiWhy
                    result={why.data?.result}
                    busy={why.isPending}
                    configured={!!status.data?.configured}
                    canRun={auth.can('editor') && !!insightCp}
                    onRun={() => accountId && insightCp && why.mutate({ account_id: accountId, post_ids: posts.map((p) => p.id), checkpoint: insightCp })}
                  />
                }
              />
            </div>
          ) : (
            <Skeleton className="mb-8 h-48 rounded-[1.8rem]" />
          )}

          <h2 className="mb-1 text-base font-semibold">Metrics</h2>
          <p className="mb-3 flex items-start gap-1.5 text-xs text-muted-foreground">
            <Info className="mt-px size-3.5 shrink-0" />
            {cp
              ? `Figures are taken at ${AGE[cp]} after publishing.`
              : 'These posts have no common checkpoint, so the latest figures are shown. Older posts have had longer to accumulate results.'}
          </p>
          <div className="overflow-x-auto rounded-[1.8rem] bg-card">
            <div className="min-w-fit" style={{ display: 'grid', gridTemplateColumns: cols }}>
              <div className="sticky left-0 z-10 bg-card" />
              {posts.map((p) => (
                <div key={p.id} className="border-l px-4 pt-5 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <PostRef id={p.ref} />
                    {posts.length > 2 && (
                      <button type="button" onClick={() => remove(p.id)} aria-label="Remove from comparison" className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                        <X className="size-3.5" />
                      </button>
                    )}
                  </div>
                  <Link to={`/posts/${p.id}`} className="mt-2 line-clamp-2 text-sm font-semibold hover:text-primary">
                    {firstLine(p) || p.topic || p.ref}
                  </Link>
                  {p.post_url && (
                    <a href={p.post_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                      On LinkedIn <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              ))}

              <GridHeading cols={posts.length}>{cp ? `Metrics at ${AGE[cp]}` : 'Metrics (latest)'}</GridHeading>
              {NUMBERS.map((row) => {
                const vals = posts.map((p) => row.get(snap(p)))
                if (vals.every((v) => v == null)) return null
                const known = vals.filter((v): v is number => v != null)
                const best = known.length >= 2 && new Set(known).size > 1 ? Math.max(...known) : null
                return (
                  <GridRow key={row.label} label={row.label} hint={row.hint}>
                    {vals.map((v, i) => (
                      <GridCell key={posts[i].id} className={cn('tabular-nums', v != null && v === best && 'font-semibold text-primary')}>
                        {v == null ? <span className="text-muted-foreground">—</span> : row.fmt(v)}
                        {v != null && v === best && <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium">best</span>}
                      </GridCell>
                    ))}
                  </GridRow>
                )
              })}

              <GridHeading cols={posts.length}>Post details</GridHeading>
              {TEXT_ROWS.map((row) => (
                <GridRow key={row.label} label={row.label}>
                  {posts.map((p) => (
                    <GridCell key={p.id} className="text-[13px] leading-snug">
                      {row.get(p)}
                    </GridCell>
                  ))}
                </GridRow>
              ))}
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">The best value in each row is marked. The findings above are based on these figures.</p>
        </>
      )}
    </div>
  )
}
