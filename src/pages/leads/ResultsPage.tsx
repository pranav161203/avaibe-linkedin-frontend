import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import { ArrowRight, Banknote, Filter, Trophy } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CardHeading, EmptyState, PageHeader, SimpleSelect } from '@/components/common'
import { useAccount } from '@/context/account'
import { type Lead } from '@/lib/api'
import { FORMAT_LABELS, fmtNumber, fmtPct } from '@/lib/format'
import { aed } from '@/pages/leads/utils'
import { FROM_LINKEDIN, SOURCE_LABEL } from '@/pages/leads/constants'
import { MoneyList } from './components/MoneyList'
import { PERIODS } from './constants/periods'
import { latestImpressions, latestClicks } from './utils/post-numbers'
import { useGetAllPosts } from '@/pages/data/queries'
import { useGetLeads } from '@/pages/leads/queries'

export function ResultsPage() {
  const { account, accounts } = useAccount()
  const [period, setPeriod] = useState('90')
  const { data: leads = [], isLoading: leadsLoading } = useGetLeads(account?.id)
  const { data: allPosts = [], isLoading: postsLoading } = useGetAllPosts()

  const r = useMemo(() => {
    if (!account) return null
    const family = new Set([account.id, ...accounts.filter((a) => a.parent_id === account.id).map((a) => a.id)])
    const inPeriod = (date: string) => period === 'all' || differenceInCalendarDays(new Date(), parseISO(date)) < Number(period)
    const posts = allPosts.filter((p) => family.has(p.account_id) && inPeriod(p.published_at_uae.slice(0, 10)))
    const periodLeads = leads.filter((l) => inPeriod(l.received_on))
    const fromLinkedIn = periodLeads.filter((l) => FROM_LINKEDIN.includes(l.source))
    const won = fromLinkedIn.filter((l) => l.stage === 'won')
    const sumAed = (ls: Lead[]) => ls.reduce((s, l) => s + (l.value_aed ?? 0), 0)

    const postById = new Map(allPosts.map((p) => [p.id, p]))
    const byPost = new Map<number, Lead[]>()
    for (const l of periodLeads) if (l.post_id) byPost.set(l.post_id, [...(byPost.get(l.post_id) ?? []), l])
    const postRows = [...byPost.entries()]
      .map(([id, ls]) => {
        const p = postById.get(id)
        const imp = p ? latestImpressions(p) : 0
        return {
          id,
          post: p,
          title: ls[0].post_title ?? p?.caption?.split('\n')[0] ?? 'Post',
          profile: accounts.find((a) => a.id === p?.account_id)?.name ?? '–',
          leads: ls.length,
          qualified: ls.filter((l) => l.is_qualified).length,
          won: ls.filter((l) => l.stage === 'won').length,
          wonAed: sumAed(ls.filter((l) => l.stage === 'won')),
          per10k: imp ? (ls.length / imp) * 10_000 : null,
        }
      })
      .sort((a, b) => b.qualified - a.qualified || b.leads - a.leads || b.wonAed - a.wonAed)

    const group = (key: (l: Lead) => string) => {
      const m = new Map<string, { leads: number; won: number; wonAed: number; openAed: number }>()
      for (const l of periodLeads) {
        const k = key(l)
        const g = m.get(k) ?? { leads: 0, won: 0, wonAed: 0, openAed: 0 }
        g.leads += 1
        if (l.stage === 'won') {
          g.won += 1
          g.wonAed += l.value_aed ?? 0
        } else if (l.stage !== 'lost') g.openAed += l.value_aed ?? 0
        m.set(k, g)
      }
      return [...m.entries()].sort((a, b) => b[1].wonAed - a[1].wonAed || b[1].leads - a[1].leads)
    }
    const totalWonAed = sumAed(periodLeads.filter((l) => l.stage === 'won'))

    return {
      funnel: [
        { label: 'Impressions', value: posts.reduce((s, p) => s + latestImpressions(p), 0), hint: `${posts.length} posts` },
        { label: 'Clicks', value: posts.reduce((s, p) => s + latestClicks(p), 0), hint: 'on those posts' },
        { label: 'Leads from LinkedIn', value: fromLinkedIn.length, hint: `of ${periodLeads.length} leads in all` },
        { label: 'Qualified', value: fromLinkedIn.filter((l) => l.is_qualified).length, hint: 'UAE decision-makers' },
        { label: 'Won', value: won.length, hint: aed(sumAed(won)) },
      ],
      postRows,
      bySource: group((l) => SOURCE_LABEL[l.source]),
      byProfile: group((l) => (l.via_account_name ?? (FROM_LINKEDIN.includes(l.source) ? account.name : 'Not through LinkedIn'))),
      totalWonAed,
      linkedInWonAed: sumAed(won),
      leadsCount: periodLeads.length,
    }
  }, [account, accounts, allPosts, leads, period])

  if (!account) return null
  const loading = leadsLoading || postsLoading

  return (
    <div className="mx-auto max-w-page space-y-4">
      <PageHeader
        eyebrow="Leads & sales"
        title="Results"
        description="What LinkedIn brings the business: from people seeing the posts to won deals, which posts brought enquiries, and where the money came from."
        actions={<SimpleSelect label="Period" value={period} onChange={setPeriod} options={PERIODS} />}
      />

      {loading || !r ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : r.leadsCount === 0 ? (
        <EmptyState>
          No leads in this period. Results appear as enquiries are recorded in the <Link to="/leads/log" className="underline">Leads log</Link>, with the post or profile
          they came through.
        </EmptyState>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardHeading icon={Filter} title="From seeing a post to a won deal" sub={`${account.name} and its founder profiles · the share of each step that reached the next`} />
            </CardHeader>
            <CardContent>
              <ol className="grid gap-2 md:grid-cols-5">
                {r.funnel.map((step, i) => {
                  const prev = r.funnel[i - 1]
                  return (
                    <li key={step.label} className="rounded-xl border bg-muted/30 p-3">
                      <div className="flex items-baseline justify-between gap-2 text-xs text-muted-foreground">
                        {step.label}
                        {prev && (
                          <span className="inline-flex items-center gap-0.5 tabular-nums" title={`Share of “${prev.label}” that reached this step`}>
                            <ArrowRight className="size-3" />
                            {prev.value ? fmtPct(step.value / prev.value) : '–'}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{fmtNumber(step.value)}</div>
                      <div className="text-xs text-muted-foreground">{step.hint}</div>
                    </li>
                  )
                })}
              </ol>
              <p className="mt-3 text-xs text-muted-foreground">
                Leads are counted when they arrived, posts when they were published. Only leads recorded as coming from a post, a page or a profile count as “from LinkedIn”.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardHeading icon={Trophy} title="Posts that brought leads" sub="Ranked by qualified leads, not likes. Link each lead to its post in the Leads log to see more here." />
            </CardHeader>
            <CardContent className="overflow-x-auto px-0">
              {r.postRows.length === 0 ? (
                <p className="px-4 pb-2 text-sm text-muted-foreground">No lead in this period is linked to a post yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4">Post</TableHead>
                      <TableHead>Profile</TableHead>
                      <TableHead className="text-right">Leads</TableHead>
                      <TableHead className="text-right">Qualified</TableHead>
                      <TableHead className="text-right">Won</TableHead>
                      <TableHead className="text-right">Won value</TableHead>
                      <TableHead className="pr-4 text-right" title="Leads per 10,000 impressions: compares posts of different reach fairly">
                        Per 10k views
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {r.postRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="max-w-96 pl-4">
                          <Link to={`/posts/${row.id}`} className="line-clamp-1 font-medium hover:underline">
                            {row.title}
                          </Link>
                          <div className="text-xs text-muted-foreground">
                            {[row.post?.topic, row.post ? FORMAT_LABELS[row.post.format] : null, row.post?.published_at_uae.slice(0, 10)].filter(Boolean).join(' · ')}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{row.profile}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.leads}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.qualified}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.won}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.wonAed ? aed(row.wonAed) : '–'}</TableCell>
                        <TableCell className="pr-4 text-right tabular-nums">{row.per10k == null ? '–' : row.per10k.toFixed(1)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardHeading
                icon={Banknote}
                title="Where the money came from"
                sub={
                  r.totalWonAed
                    ? `${aed(r.linkedInWonAed)} of ${aed(r.totalWonAed)} won in this period came through LinkedIn (${fmtPct(r.linkedInWonAed / r.totalWonAed)})`
                    : 'Nothing won in this period yet: open deals are shown so you can see what’s coming'
                }
              />
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <MoneyList title="By source" rows={r.bySource} />
              <MoneyList title="By profile" rows={r.byProfile} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
