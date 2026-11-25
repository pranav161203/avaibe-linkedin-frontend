/**
 * Suggestions → Brand: what's trending, from three places.
 *  1. Coming up: the app's own calendar (UAE holidays, events, periods) for the next 45 days. No key needed.
 *  2. Rising in your posts: topics whose posts beat that topic's usual impressions (7-day figures). No key needed.
 *  3. From the web: Claude with web search (news, industry, LinkedIn, culture, design, format and voice trends),
 *     each idea with its sources, use-by date, audience and risks. Needs the Claude key.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns'
import { Bot, CalendarDays, CheckCircle2, ChevronDown, ChevronRight, Copy, ExternalLink, Globe, TrendingUp, TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { todayUae } from '@/components/period'
import { useAuth } from '@/context/auth'
import { useTz } from '@/context/timezone'
import { CLAUDE_TIP, fmtNumber } from '@/lib/format'
import type { PlannedFormat, Post, TrendIdea, TrendType } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useGetCalendarItems } from '@/pages/calendar/queries'
import { useGetPosts } from '@/pages/data/queries'
import { median } from '@/pages/compare/utils/insights'
import { useFindTrends, useGetDecisions, useGetTrends, useSaveDecision } from '../queries'

const TYPE_LABEL: Record<TrendType, string> = {
  industry: 'Industry',
  policy: 'Rules & policy',
  news: 'News',
  linkedin: 'On LinkedIn',
  culture: 'Culture',
  design: 'Design',
  format: 'Format',
  calendar: 'Calendar',
  voice: 'Tone & voice',
}
const AUDIENCE: Record<string, string> = { schools: 'Schools', smes: 'SMEs', tech: 'Tech leaders', partners: 'Partners' }
const KIND_LABEL: Record<string, string> = { uae_holiday: 'UAE holiday', event: 'Event', period: 'Period', awareness: 'Awareness day' }
const FORMATS: PlannedFormat[] = ['text', 'image', 'carousel', 'video', 'article', 'poll']

function Section({ icon: Icon, title, sub, children }: { icon: typeof Globe; title: string; sub: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[1.4rem] bg-card p-5">
      <div className="mb-3 flex items-start gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{sub}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

export function TrendsPanel({ accountId }: { accountId: number }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Trends</h2>
      <div className="grid gap-3 lg:grid-cols-2">
        <ComingUp />
        <Rising accountId={accountId} />
      </div>
      <FromTheWeb accountId={accountId} />
    </div>
  )
}

/** 1. The app's calendar, next 45 days */
function ComingUp() {
  const today = todayUae()
  const until = format(addDays(parseISO(today), 45), 'yyyy-MM-dd')
  const { data } = useGetCalendarItems(today, until)
  const items = (data?.items ?? []).filter((i) => KIND_LABEL[i.kind] && i.end >= today).sort((a, b) => a.start.localeCompare(b.start)).slice(0, 6)
  return (
    <Section icon={CalendarDays} title="Coming up" sub="UAE dates in the next 45 days">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No dates in the next 45 days.</p>
      ) : (
        <ul className="divide-y">
          {items.map((i) => {
            const days = differenceInCalendarDays(parseISO(i.start), parseISO(today))
            return (
              <li key={i.title + i.start} className="flex items-center gap-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{i.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {KIND_LABEL[i.kind]} · {format(parseISO(i.start), 'EEE d MMM')}
                    {i.end !== i.start && ` – ${format(parseISO(i.end), 'd MMM')}`}
                    {i.status === 'expected' && ' · date expected'}
                  </div>
                </div>
                <span className={cn('shrink-0 text-xs font-medium tabular-nums', days <= 7 ? 'text-primary' : 'text-muted-foreground')}>
                  {days <= 0 ? 'Now' : days === 1 ? 'Tomorrow' : `in ${days} days`}
                </span>
                <Link to={`/create?from=calendar&topic=${encodeURIComponent(i.title)}`} className={buttonVariants({ size: 'xs', variant: 'outline' })}>
                  Plan post
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </Section>
  )
}

/** 2. Topics whose recent posts beat that topic's usual 7-day impressions */
function Rising({ accountId }: { accountId: number }) {
  const { data: posts = [] } = useGetPosts(accountId)
  const rows = useMemo(() => risingTopics(posts), [posts])
  return (
    <Section icon={TrendingUp} title="Rising in your posts" sub="Last 30 days compared with each topic’s median at 7 days">
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No rising topics. Each topic needs at least 2 posts in the last 30 days and 3 earlier posts for comparison.
        </p>
      ) : (
        <ul className="divide-y">
          {rows.slice(0, 5).map((r) => (
            <li key={r.topic} className="flex items-center gap-3 py-2">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{r.topic}</div>
                <div className="text-xs text-muted-foreground tabular-nums">
                  {fmtNumber(Math.round(r.recent))} vs usual {fmtNumber(Math.round(r.usual))} · {r.nRecent} recent, {r.nUsual} earlier posts
                </div>
              </div>
              <span className="shrink-0 text-sm font-semibold text-good-fg tabular-nums">+{Math.round((r.recent / r.usual - 1) * 100)}%</span>
              <Link to={`/create?topic=${encodeURIComponent(r.topic)}`} className={buttonVariants({ size: 'xs', variant: 'outline' })}>
                Start post
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}

function risingTopics(posts: Post[]) {
  const now = Date.now()
  const day = 86_400_000
  const by = new Map<string, { recent: number[]; usual: number[] }>()
  for (const p of posts) {
    const v = p.snapshots.find((s) => s.checkpoint === '7d')?.impressions
    if (!p.topic || v == null) continue
    const age = (now - new Date(p.published_at).getTime()) / day
    const e = by.get(p.topic) ?? { recent: [], usual: [] }
    if (age <= 37) e.recent.push(v) // a 7-day figure exists, so "last 30 days" means published 7-37 days ago
    else if (age <= 187) e.usual.push(v)
    by.set(p.topic, e)
  }
  const out: { topic: string; recent: number; usual: number; nRecent: number; nUsual: number }[] = []
  for (const [topic, e] of by) {
    if (e.recent.length < 2 || e.usual.length < 3) continue
    const recent = median(e.recent)!
    const usual = median(e.usual)!
    if (usual > 0 && recent / usual >= 1.2) out.push({ topic, recent, usual, nRecent: e.recent.length, nUsual: e.usual.length })
  }
  return out.sort((a, b) => b.recent / b.usual - a.recent / a.usual)
}

/** 3. Claude with web search */
function FromTheWeb({ accountId }: { accountId: number }) {
  const auth = useAuth()
  const tz = useTz()
  const { data: state } = useGetTrends(accountId)
  const { data: decisions = [] } = useGetDecisions(accountId)
  const find = useFindTrends(accountId)
  const [showDecided, setShowDecided] = useState(false)
  const run = state?.latest
  const ideas = run?.result?.ideas ?? []
  const decided = new Map(decisions.map((d) => [d.key, d.status]))
  const keyOf = (i: number) => `trend:${run!.id}:${i}`
  const open = ideas.map((idea, i) => ({ idea, i })).filter((x) => !decided.has(keyOf(x.i)))
  const closed = ideas.map((idea, i) => ({ idea, i })).filter((x) => decided.has(keyOf(x.i)))
  const busy = find.isPending || !!state?.running
  const limit = !!state && state.runs_today >= state.daily_limit
  const ageDays = run ? differenceInCalendarDays(new Date(), new Date(run.created_at)) : null

  return (
    <Section icon={Globe} title="From the web" sub="Current trends identified by Claude, with sources">
      {!state ? null : !state.configured ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-primary/30 bg-brand-soft/40 px-3 py-2 text-xs text-muted-foreground">
          <Bot className="size-4 text-brand-fg" />
          <span>
            Available once Claude is connected with web search enabled ({' '}
            <Link to="/settings?tab=claude" className="underline">
              Settings → Claude
            </Link>
            ).
          </span>
        </div>
      ) : (
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
          {auth.can('editor') && (
            <Button
              size="sm"
              disabled={busy || limit}
              onClick={() =>
                find.mutate(undefined, {
                  onSuccess: (r) => toast.success(`${r.result?.ideas.length ?? 0} trend ideas found`),
                  onError: (e) => toast.error(e.message),
                })
              }
            >
              <Globe /> {busy ? 'Searching…' : run ? 'Find new trends' : 'Find trends'}
            </Button>
          )}
          {run ? (
            <span>
              Last searched {tz.dual(run.created_at)}
              {run.created_by && <> by {run.created_by}</>} · {run.result?.searches ?? 0} searches · about ${run.cost_usd.toFixed(2)}
              {ageDays != null && ageDays >= 4 && <b className="ml-1 font-medium text-foreground">· {ageDays} days old. Refresh recommended.</b>}
            </span>
          ) : (
            <span>Searches the web for current trends. Each search has a small cost; twice a week is recommended.</span>
          )}
          {limit && <span>Daily limit reached ({state.daily_limit} searches).</span>}
        </div>
      )}

      {open.length > 0 && (
        <ul className="space-y-2.5">
          {open.map(({ idea, i }) => (
            <TrendCard key={i} idea={idea} k={keyOf(i)} accountId={accountId} />
          ))}
        </ul>
      )}
      {run && ideas.length > 0 && open.length === 0 && <p className="text-sm text-muted-foreground">All trend ideas from this search have been reviewed.</p>}
      {closed.length > 0 && (
        <div className="mt-2">
          <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => setShowDecided((v) => !v)}>
            {showDecided ? <ChevronDown /> : <ChevronRight />} Done, dismissed &amp; later ({closed.length})
          </Button>
          {showDecided && (
            <ul className="mt-2 space-y-2.5 opacity-75">
              {closed.map(({ idea, i }) => (
                <TrendCard key={i} idea={idea} k={keyOf(i)} accountId={accountId} status={decided.get(keyOf(i))} />
              ))}
            </ul>
          )}
        </div>
      )}
      {run?.result?.skipped && run.result.skipped.length > 0 && (
        <p className="mt-3 text-[11px] text-muted-foreground">Left out on purpose: {run.result.skipped.join(' · ')}</p>
      )}
    </Section>
  )
}

function TrendCard({ idea, k, accountId, status }: { idea: TrendIdea; k: string; accountId: number; status?: string }) {
  const auth = useAuth()
  const decide = useSaveDecision(accountId)
  const [open, setOpen] = useState(false)
  const today = todayUae()
  const late = idea.use_by < today
  const daysLeft = differenceInCalendarDays(parseISO(idea.use_by), parseISO(today))
  const fmt = FORMATS.find((f) => idea.format.toLowerCase().includes(f))
  const qs = new URLSearchParams({ topic: idea.title.slice(0, 200), ...(fmt ? { format: fmt } : {}) })
  const set = (s: 'done' | 'later' | 'dismissed' | null, msg: string) =>
    decide.mutate({ key: k, status: s }, { onSuccess: () => toast.success(msg), onError: (e) => toast.error(e.message) })

  return (
    <li className="rounded-xl p-4 ring-1 ring-border">
      <div className="flex flex-wrap items-start gap-3">
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex min-w-0 flex-1 items-start gap-2 text-left">
          {open ? <ChevronDown className="mt-0.5 size-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />}
          <span className="min-w-0">
            <span className="block leading-snug font-medium">{idea.title}</span>
            <span className={cn('mt-0.5 block text-sm text-muted-foreground', !open && 'line-clamp-2')}>{idea.angle}</span>
            <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <Badge className="bg-primary/10 text-brand-fg">{TYPE_LABEL[idea.trend_type]}</Badge>
              <Badge variant="outline" className={cn('tabular-nums', late ? 'text-muted-foreground line-through' : daysLeft <= 7 && 'border-primary/40 text-brand-fg')}>
                Use by {format(parseISO(idea.use_by), 'd MMM')}
              </Badge>
              {idea.audiences.map((a) => (
                <Badge key={a} variant="secondary">
                  {AUDIENCE[a] ?? a}
                </Badge>
              ))}
              <Badge variant="outline" className="capitalize">
                {idea.format} · {idea.voice}
              </Badge>
              {idea.confidence_pct != null && (
                <Badge variant="outline" className="cursor-help tabular-nums" title={CLAUDE_TIP}>
                  Claude’s estimate: {idea.confidence_pct}%
                </Badge>
              )}
            </span>
          </span>
        </button>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          <Link to={`/create?${qs}`} className={buttonVariants({ size: 'sm', variant: 'outline' })}>
            Start post
          </Link>
          {auth.can('editor') &&
            (status ? (
              <Button size="sm" variant="ghost" onClick={() => set(null, 'Restored')}>
                Restore
              </Button>
            ) : (
              <>
                <Button size="sm" variant="outline" title="Mark as completed" onClick={() => set('done', 'Marked as completed')}>
                  <CheckCircle2 /> Done
                </Button>
                <Button size="sm" variant="ghost" title="Snooze for 7 days" onClick={() => set('later', 'Snoozed for 7 days')}>
                  Later
                </Button>
                <Button size="sm" variant="ghost" title="Dismiss as not relevant" onClick={() => set('dismissed', 'Dismissed')}>
                  Dismiss
                </Button>
              </>
            ))}
        </div>
      </div>

      {idea.avoid_for && (
        <p className="mt-2 flex items-start gap-1.5 pl-6 text-xs text-bad-fg">
          <TriangleAlert className="mt-px size-3.5 shrink-0" /> Not for: {idea.avoid_for}
        </p>
      )}

      {open && (
        <div className="mt-3 space-y-2.5 border-t border-border/60 pt-3 pl-6 text-sm">
          <p>
            <b className="font-medium">Trend:</b> {idea.trend}
          </p>
          <p>
            <b className="font-medium">Related service:</b> {idea.service}
          </p>
          <p>
            <b className="font-medium">Visual direction:</b> {idea.look}
          </p>
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="mb-1 flex items-center justify-between gap-2 text-xs font-medium">
              Image prompt for a design tool
              <Button
                size="xs"
                variant="ghost"
                onClick={() => navigator.clipboard.writeText(idea.image_prompt).then(() => toast.success('Prompt copied'), () => toast.error('Copy failed'))}
              >
                <Copy /> Copy
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{idea.image_prompt}</p>
          </div>
          {idea.risks.length > 0 && (
            <ul className="list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
              {idea.risks.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          )}
          <div className="text-xs">
            <div className="mb-1 font-medium">Sources (verify dates and figures before posting)</div>
            {idea.sources.length === 0 ? (
              <p className="text-muted-foreground">No source confirmed. Treat this idea as unverified.</p>
            ) : (
              <ul className="space-y-0.5">
                {idea.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline underline-offset-2">
                      {s.title} <ExternalLink className="size-3" />
                    </a>
                    {s.date && <span className="text-muted-foreground"> · {s.date}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </li>
  )
}
