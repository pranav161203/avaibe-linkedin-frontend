import { Link } from 'react-router-dom'
import { addDays, format, parseISO } from 'date-fns'
import { Filter } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { CardHeading } from '@/components/common'
import { Demographics } from '@/pages/data/components/Demographics'
import { Highlights } from '@/pages/data/components/Highlights'
import { MetricsChart } from '@/pages/data/components/MetricsChart'
import { ymd } from '@/components/period'
import { fmtNumber, fmtPct } from '@/lib/format'
import { VISITOR_METRICS } from '../constants'
import { useSnapshots } from '../hooks/useSnapshots'
import type { TabProps } from '../types'
import { useGetLeads } from '@/pages/leads/queries'

export function VisitorsTab({ accountId, daily, win, stats, dates, compareLabel, posts }: TabProps) {
  const { latest, before } = useSnapshots(accountId, 'visitors')
  const { data: leads = [] } = useGetLeads(accountId)
  const prevFrom = ymd(addDays(parseISO(win.from), -stats.len))
  const prevTo = ymd(addDays(parseISO(win.from), -1))
  const inWin = leads.filter((l) => l.received_on >= win.from && l.received_on <= win.to)
  const inPrev = leads.filter((l) => l.received_on >= prevFrom && l.received_on <= prevTo)
  const visitors = stats.cur.unique_visitors

  return (
    <div className="space-y-4">
      <Highlights
        dates={dates}
        compareLabel={compareLabel}
        items={[
          { label: 'Page views', value: stats.cur.page_views, prev: stats.prev?.page_views },
          { label: 'Unique visitors', value: visitors, prev: stats.prev?.unique_visitors, hint: 'Sum of daily unique visitors' },
          {
            label: 'From the UAE',
            value: latest?.shares.uae_share ?? null,
            prev: before?.shares.uae_share ?? null,
            pct: true,
            small: (latest?.total ?? 0) < 100,
            hint: latest ? `Visitor breakdown as of ${format(parseISO(latest.as_of), 'd MMM')}` : undefined,
          },
          { label: 'Leads logged', value: inWin.length, prev: inPrev.length, hint: 'From the Leads log' },
        ]}
      />
      <MetricsChart daily={daily} from={win.from} to={win.to} metrics={VISITOR_METRICS} posts={posts} param="vm" title="Visits over time" />
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Demographics snapshot={latest} noun="visitors" />
        </div>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardHeading icon={Filter} title="Visit to lead conversion" sub="Same period. LinkedIn tracks visits; the Leads log tracks enquiries." />
          </CardHeader>
          <CardContent>
            <Funnel
              steps={[
                { label: 'Unique visitors', value: visitors },
                { label: 'Leads logged', value: inWin.length, to: '/leads/log' },
                { label: 'Qualified', value: inWin.filter((l) => l.is_qualified).length, to: '/leads/log' },
                { label: 'Won', value: inWin.filter((l) => l.stage === 'won').length, to: '/sales/pipeline' },
              ]}
            />
            <p className="mt-4 text-xs text-muted-foreground">
              {visitors && inWin.length
                ? `${fmtNumber((inWin.length / visitors) * 1000, 1)} leads per 1,000 visitors. `
                : !leads.length
                  ? 'No leads logged; visits cannot be linked to enquiries. '
                  : ''}
              Not all leads originate from the page. Button clicks are not yet tracked.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Funnel({ steps }: { steps: { label: string; value: number | null; to?: string }[] }) {
  const max = Math.max(1, ...steps.map((s) => s.value ?? 0))
  return (
    <ol className="space-y-2">
      {steps.map((s, i) => {
        const prev = i > 0 ? steps[i - 1].value : null
        const body = (
          <>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span>{s.label}</span>
              <span className="tabular-nums">
                <span className="font-semibold">{fmtNumber(s.value)}</span>
                {prev ? <span className="ml-2 text-xs text-muted-foreground">{fmtPct((s.value ?? 0) / prev)}</span> : null}
              </span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-muted">
              <div className="h-2 rounded-full bg-[var(--chart-current)]" style={{ width: `${Math.max(s.value ? 1.5 : 0, ((s.value ?? 0) / max) * 100)}%` }} />
            </div>
          </>
        )
        return (
          <li key={s.label}>
            {s.to ? (
              <Link to={s.to} className="group -mx-2 block rounded-md px-2 py-1 hover:bg-muted">
                {body}
              </Link>
            ) : (
              <div className="py-1">{body}</div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
