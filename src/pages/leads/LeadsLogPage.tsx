import { useState } from 'react'
import { Link } from 'react-router-dom'
import { format, parseISO, differenceInCalendarDays } from 'date-fns'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { EmptyState, PageHeader } from '@/components/common'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { todayUae } from '@/components/period'
import { useAccount } from '@/context/account'
import { useAuth } from '@/context/auth'
import type { Lead } from '@/lib/api'
import { fmtNumber, fmtPct } from '@/lib/format'
import { cn } from '@/lib/utils'
import { LeadDialog } from './components/LeadDialog'
import { Sources } from './components/LeadSources'
import { StageTag } from './components/StageTag'
import { Stat } from './components/Stat'
import { SOURCE_LABEL, FROM_LINKEDIN, REPLY_TARGET_HOURS } from './constants'
import { replyHours, fmtHours, sourceKnown, yesNo } from './utils'
import { useDeleteLead, useGetLeads, useMarkLeadReplied } from '@/pages/leads/queries'

export function LeadsLogPage() {
  const { account } = useAccount()
  const auth = useAuth()
  const { data: leads = [], isLoading } = useGetLeads(account?.id)
  const [editing, setEditing] = useState<Lead | 'new' | null>(null)
  const del = useDeleteLead(account?.id)
  const replied = useMarkLeadReplied(account?.id)

  if (!account) return null
  const n = leads.length
  const linkedIn = leads.filter((l) => FROM_LINKEDIN.includes(l.source)).length
  const qualified = leads.filter((l) => l.is_qualified).length
  const qualKnown = leads.filter((l) => l.is_qualified != null).length
  const known = leads.filter(sourceKnown).length
  const replyTimes = leads.filter((l) => l.replied_at).map((l) => replyHours(l)).sort((a, b) => a - b)
  const medianReply = replyTimes.length ? replyTimes[Math.floor(replyTimes.length / 2)] : null
  const waiting = leads.filter((l) => !l.replied_at && l.stage !== 'lost' && l.stage !== 'won').length

  return (
    <div className="mx-auto max-w-page">
      <PageHeader
        eyebrow="Leads & sales"
        title="Leads log"
        description="Enquiries and their sources, recorded manually because LinkedIn does not report them. Record company, role and source only, without personal names or contact details."
        actions={
          auth.can('editor') && (
            <Button size="sm" onClick={() => setEditing('new')}>
              <Plus /> Add lead
            </Button>
          )
        }
      />

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : n === 0 ? (
        <EmptyState>
          No leads recorded. Add each enquiry as it arrives to see which posts and profiles generate enquiries, not just engagement.
        </EmptyState>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label="Leads"
              value={fmtNumber(n)}
              hint={`${leads.filter((l) => differenceInCalendarDays(parseISO(todayUae()), parseISO(l.received_on)) < 30).length} in the last 30 days · ${fmtPct(linkedIn / n)} from LinkedIn`}
            />
            <Stat
              label="Qualified"
              value={fmtNumber(qualified)}
              hint={`UAE-based decision-makers${qualKnown < n ? ` · ${n - qualKnown} unknown` : ''}`}
            />
            <Stat label="Source known" value={fmtPct(known / n)} hint="Target: above 80%" />
            <Stat
              label="First reply"
              value={medianReply == null ? '–' : fmtHours(medianReply)}
              hint={`Median time from enquiry${waiting ? ` · ${waiting} awaiting reply` : ''}`}
            />
          </div>
          <Sources leads={leads} />
          <Card className="mt-4">
            <CardContent className="overflow-x-auto px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Received</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Came from</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>UAE</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Reply</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead className="pr-4" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="pl-4 tabular-nums">{format(parseISO(l.received_on), 'd MMM yyyy')}</TableCell>
                      <TableCell>
                        <div className="font-medium">{l.company}</div>
                        {l.industry && <div className="text-xs text-muted-foreground">{l.industry}</div>}
                      </TableCell>
                      <TableCell className="max-w-64 whitespace-normal">
                        <div>{SOURCE_LABEL[l.source]}</div>
                        {l.post_id ? (
                          <Link to={`/posts/${l.post_id}`} className="line-clamp-1 text-xs text-muted-foreground underline-offset-2 hover:underline">
                            {l.post_title}
                          </Link>
                        ) : (
                          l.via_account_name && <div className="text-xs text-muted-foreground">{l.via_account_name}</div>
                        )}
                        {l.how_heard && <div className="line-clamp-1 text-xs text-muted-foreground italic">“{l.how_heard}”</div>}
                      </TableCell>
                      <TableCell>
                        {l.role ?? '–'}
                        {l.is_qualified && <span className="ml-1.5 rounded-full bg-good/10 px-1.5 py-px text-[10px] text-good-fg">qualified</span>}
                      </TableCell>
                      <TableCell>{yesNo(l.in_uae) || '–'}</TableCell>
                      <TableCell>{l.service ?? '–'}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {l.replied_at ? (
                          <span className={cn('text-xs', replyHours(l) > REPLY_TARGET_HOURS ? 'text-warn-fg' : 'text-muted-foreground')}>
                            after {fmtHours(replyHours(l))}
                          </span>
                        ) : l.stage === 'won' || l.stage === 'lost' ? (
                          <span className="text-xs text-muted-foreground">–</span>
                        ) : auth.can('editor') ? (
                          <Button size="xs" variant="outline" onClick={() => replied.mutate(l.id)} title="Mark as replied now">
                            Mark replied
                            <span className={cn('tabular-nums', replyHours(l) > REPLY_TARGET_HOURS ? 'text-bad-fg' : 'text-muted-foreground')}>
                              · {fmtHours(replyHours(l))}
                            </span>
                          </Button>
                        ) : (
                          <span className="text-xs text-bad-fg">Waiting {fmtHours(replyHours(l))}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StageTag stage={l.stage} />
                      </TableCell>
                      <TableCell className="pr-4 text-right whitespace-nowrap">
                        {auth.can('editor') && (
                          <>
                            <Button variant="ghost" size="icon-sm" aria-label={`Edit ${l.company}`} onClick={() => setEditing(l)}>
                              <Pencil />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Delete ${l.company}`}
                              onClick={() => confirm(`Delete the lead from ${l.company}? This cannot be undone.`) && del.mutate(l.id)}
                            >
                              <Trash2 />
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {editing && <LeadDialog accountId={account.id} initial={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
