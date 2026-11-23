import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { format, parseISO, differenceInCalendarDays } from 'date-fns'
import { EmptyState, PageHeader, SimpleSelect } from '@/components/common'
import { Skeleton } from '@/components/ui/skeleton'
import { todayUae } from '@/components/period'
import { useAccount } from '@/context/account'
import { useAuth } from '@/context/auth'
import type { Lead, LeadStage } from '@/lib/api'
import { fmtPct } from '@/lib/format'
import { cn } from '@/lib/utils'
import { LeadDialog } from './components/LeadDialog'
import { Stat } from './components/Stat'
import { SOURCE_LABEL, STAGE_LABEL, STAGES, STALE_DAYS } from './constants'
import { aed, daysSinceUpdate, isStale, toInput } from './utils'
import { useGetLeads, useSaveLead } from '@/pages/leads/queries'

export function PipelinePage() {
  const { account } = useAccount()
  const auth = useAuth()
  const { data: leads = [], isLoading } = useGetLeads(account?.id)
  const save = useSaveLead(account?.id)
  const [editing, setEditing] = useState<Lead | null>(null)

  const stats = useMemo(() => {
    const open = leads.filter((l) => !['won', 'lost'].includes(l.stage))
    const won = leads.filter((l) => l.stage === 'won')
    const lost = leads.filter((l) => l.stage === 'lost')
    const sum = (ls: Lead[]) => ls.reduce((s, l) => s + (l.value_aed ?? 0), 0)
    const days = won.filter((l) => l.closed_on).map((l) => differenceInCalendarDays(parseISO(l.closed_on!), parseISO(l.received_on)))
    days.sort((a, b) => a - b)
    return {
      open,
      openValue: sum(open),
      won,
      wonValue: sum(won),
      winRate: won.length + lost.length ? won.length / (won.length + lost.length) : null,
      closed: won.length + lost.length,
      medianDays: days.length ? days[Math.floor(days.length / 2)] : null,
      stale: open.filter(isStale).length,
    }
  }, [leads])

  if (!account) return null
  const move = (l: Lead, stage: LeadStage) => save.mutate({ id: l.id, body: { ...toInput(l), stage, closed_on: null } })

  return (
    <div className="mx-auto max-w-page">
      <PageHeader
        eyebrow="Leads & sales"
        title="Pipeline"
        description="Each lead from the Leads log, by stage. Move a lead when it progresses; won and lost leads show which sources turn into business."
        actions={
          <Link to="/leads/log" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
            Add leads in the Leads log →
          </Link>
        }
      />
      {isLoading ? (
        <Skeleton className="h-64" />
      ) : leads.length === 0 ? (
        <EmptyState>
          The pipeline fills from the <Link to="/leads/log" className="underline">Leads log</Link>. Record enquiries there first.
        </EmptyState>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label="Open pipeline"
              value={aed(stats.openValue)}
              hint={`${stats.open.length} open lead${stats.open.length === 1 ? '' : 's'}${stats.stale ? ` · ${stats.stale} with no change for ${STALE_DAYS}+ days` : ''}`}
            />
            <Stat label="Won" value={aed(stats.wonValue)} hint={`${stats.won.length} deal${stats.won.length === 1 ? '' : 's'}`} />
            <Stat label="Win rate" value={stats.winRate == null ? '–' : fmtPct(stats.winRate)} hint={`of ${stats.closed} closed lead${stats.closed === 1 ? '' : 's'}`} />
            <Stat label="Time to win" value={stats.medianDays == null ? '–' : `${stats.medianDays} days`} hint="Median, from enquiry to won" />
          </div>
          <div className="mt-4 grid gap-3 overflow-x-auto pb-2 md:grid-cols-5">
            {STAGES.map((s) => {
              const col = leads.filter((l) => l.stage === s)
              return (
                <div key={s} className="min-w-52 rounded-xl border bg-muted/30 p-2">
                  <div className="mb-2 flex items-center justify-between px-1 text-sm font-medium">
                    {STAGE_LABEL[s]}
                    <span className="text-xs text-muted-foreground tabular-nums">{col.length}</span>
                  </div>
                  <div className="space-y-2">
                    {col.map((l) => (
                      <div key={l.id} className={cn('rounded-lg border bg-card p-2.5 text-sm shadow-xs', isStale(l) && 'border-warn/50')}>
                        <div className="flex items-start justify-between gap-1">
                          <button type="button" className="text-left font-medium hover:underline" onClick={() => auth.can('editor') && setEditing(l)}>
                            {l.company}
                          </button>
                          {l.in_uae && <span className="shrink-0 rounded-full bg-muted px-1.5 text-[10px] text-muted-foreground">UAE</span>}
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {[l.service, l.value_aed != null ? aed(l.value_aed) : null].filter(Boolean).join(' · ') || SOURCE_LABEL[l.source]}
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {s === 'won' || s === 'lost'
                            ? l.closed_on && `Closed ${format(parseISO(l.closed_on), 'd MMM')}`
                            : `${differenceInCalendarDays(parseISO(todayUae()), parseISO(l.received_on))} days since enquiry`}
                        </div>
                        {isStale(l) && (
                          <div className="mt-1.5 rounded-md bg-warn/10 px-1.5 py-0.5 text-xs text-warn-fg" title="Follow up, or move it to Lost">
                            No change for {daysSinceUpdate(l)} days
                          </div>
                        )}
                        {auth.can('editor') && (
                          <div className="mt-2">
                            <SimpleSelect
                              label="Stage"
                              value={l.stage}
                              onChange={(v) => move(l, v as LeadStage)}
                              options={STAGES.map((x) => ({ value: x, label: STAGE_LABEL[x] }))}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
      {editing && <LeadDialog accountId={account.id} initial={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
