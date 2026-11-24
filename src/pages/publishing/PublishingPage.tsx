import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, PageHeader, SimpleSelect } from '@/components/common'
import { useAccount } from '@/context/account'
import { PLANNED_FORMATS, type PlannedFormat } from '@/lib/api'
import { needsAction, PLANNED_FORMAT_LABELS } from '@/lib/publishing'
import { ConnectionBanner } from './components/ConnectionBanner'
import { PlannedCard } from './components/PlannedCard'
import { STATUS_FILTERS } from './constants'
import { useGetLinkedInConnections } from '@/pages/linkedin/queries'
import { useGetPlannedPosts } from '@/pages/publishing/queries'

export function PublishingPage() {
  const { account } = useAccount()
  const { data: connections = [] } = useGetLinkedInConnections()
  const { data: planned, isLoading } = useGetPlannedPosts(account?.id)
  const connection = connections.find((c) => c.account_id === account?.id)
  const isCompany = account?.kind === 'company'
  const [params, setParams] = useSearchParams()
  const formatParam = params.get('format') ?? params.get('tab')
  const tab: PlannedFormat | 'all' = (PLANNED_FORMATS as readonly string[]).includes(formatParam ?? '') ? (formatParam as PlannedFormat) : 'all'
  const statusParam = params.get('status') ?? 'all'
  const status = STATUS_FILTERS.some((f) => f.value === statusParam) ? statusParam : 'all'
  const setFilter = (key: 'format' | 'status', v: string) =>
    setParams((p) => { p.delete('tab'); if (v === 'all') p.delete(key); else p.set(key, v); return p }, { replace: true })
  const all = planned ?? []
  const shown = all.filter((p) => (tab === 'all' || p.format === tab) && STATUS_FILTERS.find((f) => f.value === status)!.test(p))
  const waitingIn = (f: PlannedFormat | 'all') => all.filter((p) => (f === 'all' || p.format === f) && needsAction(p)).length
  const navigate = useNavigate()
  useEffect(() => {
    const at = params.get('new_at')
    if (at) navigate(`/create?new_at=${encodeURIComponent(at)}`, { replace: true })
  }, [params, navigate])

  if (!account) return null

  return (
    <div className="mx-auto max-w-page space-y-4">
      <PageHeader eyebrow="Content"
        title="Publishing"
        description="Preview a post, then publish it now or at its scheduled time. Text and image posts are published by the app; carousel, video, article and poll posts are posted on LinkedIn by hand, then marked as posted."
      />

      <div className="flex flex-wrap items-center gap-3">
        <SimpleSelect
          label="Format"
          value={tab}
          onChange={(v) => setFilter('format', v)}
          options={[
            { value: 'all', label: 'All', count: all.length },
            ...PLANNED_FORMATS.map((f) => ({
              value: f,
              label: PLANNED_FORMAT_LABELS[f],
              count: all.filter((p) => p.format === f).length,
              countInList: false,
              dot: waitingIn(f) > 0,
              dotLabel: `${waitingIn(f)} waiting for someone`,
            })),
          ]}
        />
        <SimpleSelect
          label="Status"
          value={status}
          onChange={(v) => setFilter('status', v)}
          options={STATUS_FILTERS.map((f) => ({ value: f.value, label: f.label }))}
        />
        {waitingIn(tab) > 0 && status !== 'action' && (
          <button
            type="button"
            onClick={() => setFilter('status', 'action')}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <span className="size-2 rounded-full bg-bad" aria-hidden />
            {waitingIn(tab)} need{waitingIn(tab) === 1 ? 's' : ''} action
          </button>
        )}
        {(tab !== 'all' || status !== 'all') && (
          <button
            type="button"
            onClick={() => setParams((p) => { p.delete('tab'); p.delete('format'); p.delete('status'); return p }, { replace: true })}
            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Clear
          </button>
        )}
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
          {shown.length} of {all.length} post{all.length === 1 ? '' : 's'}
        </span>
      </div>

      {isCompany ? (
        <div className="rounded-lg border border-warn/50 bg-warn/10 px-4 py-3 text-sm">
          <b>{account.name}</b> is a company page. You can draft, edit and preview posts here, but the app can’t post as the page until
          LinkedIn’s Community Management API is approved. Until then, Publish copies the text for you to post on LinkedIn by hand.
        </div>
      ) : (
        <ConnectionBanner connection={connection} />
      )}

      {tab === 'all' || tab === 'text' || tab === 'image' ? (
        <p className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          Scheduled text and image posts are published by the backend, so it must be running at the scheduled time. A post found more
          than 15 minutes late is marked <b>Missed</b> rather than posted at the wrong time.
        </p>
      ) : (
        <p className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          The app can’t publish {PLANNED_FORMAT_LABELS[tab].toLowerCase()} posts yet. Draft and preview them here, post them on LinkedIn
          by hand, then click <b>Mark as posted</b> and paste the link, so the post is tracked with the right format.
        </p>
      )}

      {isLoading ? (
        <Skeleton className="h-48" />
      ) : !shown.length ? (
        <EmptyState>
          {all.length && (tab !== 'all' || status !== 'all')
            ? 'No posts match these filters.'
            : 'No posts in the queue. Plan one from the Calendar: New post, or click a day.'}
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {shown.map((p) => (
            <PlannedCard key={p.id} p={p} accountId={account.id} accountName={account.name} connection={connection} showFormat={tab === 'all'} onEdit={() => navigate(`/create/${p.id}`)} />
          ))}
        </div>
      )}

    </div>
  )
}
