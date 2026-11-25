import { useMemo, useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ExternalLink, GitCompareArrows, Plus, Search } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, PageHeader, PostRef, SimpleSelect } from '@/components/common'
import { Input } from '@/components/ui/input'
import { inRange, TimeRangePicker, type TimeRange } from '@/components/time-range'
import { useAccount } from '@/context/account'
import { useAuth } from '@/context/auth'
import { useTz } from '@/context/timezone'
import { FORMATS } from '@/lib/api'
import { FORMAT_LABELS, fmtNumber, fmtPct } from '@/lib/format'
import { cn } from '@/lib/utils'
import { CompareBar } from './components/CompareBar'
import { SortButton, NumTh, Dash, Num, VsTypical } from './components/PostsTableParts'
import { PAGE_SIZES, DEFAULT_SORT, MAX_COMPARE } from './constants/posts'
import { postTitle, buildRows, viewsBlankReason, type SortKey, type Row } from './utils/posts'
import { useGetDueSnapshots, useGetOverview, useGetPosts } from '@/pages/data/queries'

/** embedded: shown as the Posts tab of the Data page, which supplies the time range and the page title */
export function PostsPage({ embedded = false, range: outerRange }: { embedded?: boolean; range?: TimeRange } = {}) {
  const { account } = useAccount()
  const auth = useAuth()
  const tz = useTz()
  const [format, setFormat] = useState('all')
  // Status filter: posts still to check (format not tagged, or topic only suggested) or with snapshots due to record
  const [status, setStatus] = useState<'all' | 'check' | 'due'>('all')
  // Search by post ID (P-0042) or words in the post; looks through all dates
  const [q, setQ] = useState('')
  const { data: dueList = [] } = useGetDueSnapshots(account?.id)
  const dueIds = useMemo(() => new Set(dueList.map((d) => d.post_id)), [dueList])
  const [ownRange, setRange] = useState<TimeRange>({ preset: '90' })
  const range = outerRange ?? ownRange
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>(DEFAULT_SORT)
  const [pageSize, setPageSize] = useState('10')
  const [picked, setPicked] = useState<number[]>([])
  const togglePick = (id: number) => setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : cur.length < MAX_COMPARE ? [...cur, id] : cur))
  const [page, setPage] = useState(0)

  // One account at a time (switch accounts at the top left)
  const { data: probe } = useGetOverview(account?.id, '24h')
  const cp = probe?.suggested_checkpoint ?? '24h'
  const opts = { format: format === 'all' ? undefined : format, checkpoint: cp }
  const { data: posts, isLoading } = useGetPosts(account?.id, opts)

  const rows = useMemo(() => buildRows(posts ?? []), [posts])

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const list = rows.filter((r) =>
      needle
        ? (r.post.ref ?? '').toLowerCase().includes(needle) || (r.post.caption ?? '').toLowerCase().includes(needle) || (r.post.topic ?? '').toLowerCase().includes(needle)
        : status === 'due'
        ? dueIds.has(r.post.id) // due posts are recent: shown whatever the time range
        : inRange(r.post.published_at, range) && (status === 'all' || r.post.format === 'untagged' || r.post.topic_suggested),
    )
    const val = (r: Row) => (sort.key === 'date' ? new Date(r.post.published_at).getTime() : r[sort.key])
    return list.sort((a, b) => {
      const x = val(a)
      const y = val(b)
      if (x == null && y == null) return 0
      if (x == null) return 1 // empty values last, whichever direction
      if (y == null) return -1
      if (x !== y) return sort.desc ? y - x : x - y
      return new Date(b.post.published_at).getTime() - new Date(a.post.published_at).getTime() // ties: latest first
    })
  }, [rows, range, sort, status, dueIds, q])

  const size = Number(pageSize)
  const pages = Math.max(1, Math.ceil(shown.length / size))
  const current = Math.min(page, pages - 1)
  const pageRows = shown.slice(current * size, current * size + size)
  const resetPage = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v)
    setPage(0)
  }
  const toggleSort = (key: SortKey) => {
    setSort((s) => (s.key === key ? { key, desc: !s.desc } : { key, desc: true }))
    setPage(0)
  }

  return (
    <div className={embedded ? '' : 'mx-auto max-w-page'}>
      {!embedded && <PageHeader
        title="Posts"
        description="All posts and their metrics to date. “vs typical” compares each post with this account’s median post at the same age."
        actions={
          auth.can('editor') && (
            <Link to="/posts/new" className={buttonVariants({ size: 'sm' })}>
              <Plus /> Log post
            </Link>
          )
        }
      />}

      {/* Filters: a few, in one row */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {!embedded && <TimeRangePicker value={range} onChange={resetPage(setRange)} />}
        <SimpleSelect
          label="Type"
          value={format}
          onChange={resetPage(setFormat)}
          options={[{ value: 'all', label: 'All types' }, ...FORMATS.map((f) => ({ value: f, label: FORMAT_LABELS[f] }))]}
        />
        <SimpleSelect
          label="Status"
          value={status}
          onChange={resetPage((v: string) => setStatus(v as 'all' | 'check' | 'due'))}
          options={[
            { value: 'all', label: 'All' },
            { value: 'check', label: 'Needs checking' },
            { value: 'due', label: 'Snapshots due' },
          ]}
        />
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(0)
            }}
            placeholder="Search ID or text"
            aria-label="Search posts by ID or text"
            className="h-8 w-48 rounded-full pl-8 text-sm"
          />
        </div>
        {embedded && auth.can('editor') && (
          <Link to="/posts/new" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'ml-auto')}>
            <Plus /> Log post
          </Link>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : !shown.length ? (
        <EmptyState>
          {rows.length ? (q.trim() ? `No post matches “${q.trim()}”.` : 'No posts match these filters.') : <>No posts available. <Link to="/posts/new" className="underline">Log one</Link> or <Link to="/import" className="underline">import LinkedIn’s export</Link>.</>}
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-[1.8rem] bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th
                    className="sticky left-0 z-10 w-[340px] min-w-[300px] bg-card px-4 py-3 font-medium shadow-[1px_0_0_var(--border)]"
                    aria-sort={sort.key === 'date' ? (sort.desc ? 'descending' : 'ascending') : 'none'}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex w-4 shrink-0 justify-center text-muted-foreground" title="Select posts to compare">
                        <GitCompareArrows className="size-3.5" />
                      </span>
                      <SortButton label="Post" k="date" sort={sort} onSort={toggleSort} />
                    </div>
                  </th>
                  <th className="px-3 py-3 font-medium">Type</th>
                  <th className="px-3 py-3 font-medium">Audience</th>
                  <NumTh label="Impressions" k="impressions" sort={sort} onSort={toggleSort} />
                  <NumTh
                    label="Views"
                    k="views"
                    sort={sort}
                    onSort={toggleSort}
                    hint="Video plays and article opens. LinkedIn does not report views for image, text or poll posts."
                  />
                  <NumTh label="Clicks" k="clicks" sort={sort} onSort={toggleSort} />
                  <NumTh label="CTR" k="ctr" sort={sort} onSort={toggleSort} hint="Clicks Ã· impressions" />
                  <NumTh label="Reactions" k="reactions" sort={sort} onSort={toggleSort} />
                  <NumTh label="Comments" k="comments" sort={sort} onSort={toggleSort} />
                  <NumTh label="Reposts" k="reposts" sort={sort} onSort={toggleSort} />
                  <NumTh label="vs typical" k="vs" sort={sort} onSort={toggleSort} hint="Impressions compared with this account’s median post at the same age" />
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r) => {
                  const p = r.post
                  return (
                    <tr key={p.id} className="group border-b last:border-0 hover:bg-muted/40">
                      <td className="sticky left-0 z-10 w-[340px] max-w-[340px] min-w-[300px] bg-card px-4 py-3 align-top shadow-[1px_0_0_var(--border)] group-hover:bg-muted">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            aria-label={`Compare ${postTitle(p)}`}
                            title={picked.includes(p.id) ? 'Remove from comparison' : picked.length >= MAX_COMPARE ? `Up to ${MAX_COMPARE} posts can be compared` : 'Add to comparison'}
                            checked={picked.includes(p.id)}
                            disabled={!picked.includes(p.id) && picked.length >= MAX_COMPARE}
                            onChange={() => togglePick(p.id)}
                            className="mt-0.5"
                          />
                          <div className="min-w-0">
                            <Link to={`/posts/${p.id}`} className="line-clamp-2 font-medium text-foreground transition-colors hover:text-primary">
                              {postTitle(p)}
                            </Link>
                            <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
                              <PostRef id={p.ref} />
                              <span title={p.time_known ? undefined : 'The LinkedIn export includes the date only'}>
                                {p.time_known ? tz.dateTime(p.published_at) : `${p.published_at_uae.slice(0, 10)} (time unknown)`}
                              </span>
                              {p.post_url && (
                                <a href={p.post_url} target="_blank" rel="noreferrer" className="hover:text-foreground" aria-label="Open on LinkedIn" title="Open on LinkedIn">
                                  <ExternalLink className="size-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className={cn('px-3 py-3 align-top text-xs', p.format === 'untagged' && 'text-warn-fg')}>{FORMAT_LABELS[p.format]}</td>
                      <td className="px-3 py-3 align-top text-xs">{p.targeted == null ? (
                          <span className="text-muted-foreground" title="Unknown: LinkedIn exports and manually logged posts do not indicate targeting">
                            —
                          </span>
                        ) : p.targeted ? (
                          'Targeted'
                        ) : (
                          'All'
                        )}</td>
                      <Num v={r.impressions} />
                      <td className="px-3 py-3 text-right align-top tabular-nums">
                        {r.views != null ? (
                          fmtNumber(r.views)
                        ) : (
                          <span className="text-muted-foreground" title={viewsBlankReason(p.format)}>
                            —
                          </span>
                        )}
                      </td>
                      <Num v={r.clicks} />
                      <td className="px-3 py-3 text-right align-top tabular-nums">{r.ctr == null ? <Dash /> : fmtPct(r.ctr)}</td>
                      <Num v={r.reactions} />
                      <Num v={r.comments} />
                      <Num v={r.reposts} />
                      <td className="px-3 py-3 text-right align-top">
                        <VsTypical v={r.vs} checkpoint={r.latest?.checkpoint} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <CompareBar picked={picked} onClear={() => setPicked([])} />

          {/* Pagination, like LinkedIn's "Show 10" */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-2.5 text-xs text-muted-foreground">
            <span className="tabular-nums">
              {current * size + 1}–{Math.min(shown.length, current * size + size)} of {shown.length} posts
            </span>
            <div className="flex items-center gap-3">
              <SimpleSelect label="Show" value={pageSize} onChange={resetPage(setPageSize)} options={PAGE_SIZES.map((s) => ({ value: s, label: s }))} />
              <div className="flex items-center gap-1">
                <Button size="icon-sm" variant="ghost" aria-label="Previous page" disabled={current === 0} onClick={() => setPage(current - 1)}>
                  <ChevronLeft />
                </Button>
                <span className="tabular-nums">
                  Page {current + 1} of {pages}
                </span>
                <Button size="icon-sm" variant="ghost" aria-label="Next page" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>
                  <ChevronRight />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
