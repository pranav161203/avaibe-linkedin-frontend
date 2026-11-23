import { useState } from 'react'
import { toast } from 'sonner'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { Trash2, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState, PageHeader, Section, SimpleSelect } from '@/components/common'
import { useAccount } from '@/context/account'
import { fmtNumber, fmtPct } from '@/lib/format'
import { RecordSnapshot } from './components/RecordSnapshot'
import { chartConfig, SERIES, type AudienceType } from './constants/audience'
import { useDeletePageAudience, useGetPageAudience } from '@/pages/data/queries'

/** embedded: shown as the Audience tab of the Data page (no page title of its own) */
export function AudiencePage({ embedded = false, fixed }: { embedded?: boolean; fixed?: AudienceType }) {
  const { account } = useAccount()
  const [chosen, setView] = useState<AudienceType>('followers')
  const view = fixed ?? chosen
  const { data = [] } = useGetPageAudience(account?.id)
  const del = useDeletePageAudience(account?.id ?? 0)
  const series = data.filter((d) => d.audience === view)
  const chartData = series.map((d) => ({
    as_of: d.as_of,
    uae: d.shares.uae_share,
    education: d.shares.education_share,
    decision: d.shares.decision_maker_share,
  }))

  const viewSelect = (
    <SimpleSelect
      label="Show"
      value={view}
      onChange={(v) => setView(v as AudienceType)}
      options={[
        { value: 'followers', label: 'Followers' },
        { value: 'visitors', label: 'Page visitors' },
      ]}
    />
  )

  return (
    <div className={embedded ? 'space-y-4' : 'mx-auto max-w-6xl space-y-4'}>
      {fixed ? null : embedded ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Is the page’s audience becoming more UAE- and education-focused?</p>
          {viewSelect}
        </div>
      ) : (
        <PageHeader
          eyebrow="Audience intelligence"
          title="Audience"
          description="Is the page's audience becoming more UAE- and education-focused? Record follower and visitor demographics from LinkedIn page analytics once a week."
          actions={viewSelect}
        />
      )}

      <Section icon={TrendingUp}
        title={`Target share of ${view} over time`}
        description="Share of the audience in each target segment. These are minimums, because LinkedIn lists only top values."
      >
        {chartData.length >= 2 ? (
          <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
            <LineChart data={chartData} margin={{ left: 0, right: 16, top: 8 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="as_of" tickLine={false} axisLine={false} tickFormatter={(v: string) => v.slice(5)} />
              <YAxis tickLine={false} axisLine={false} width={44} tickFormatter={(v: number) => `${Math.round(v * 100)}%`} />
              <ChartTooltip
                content={<ChartTooltipContent labelFormatter={(v) => `Week of ${v}`} formatter={(value, name) => (
                  <span className="flex w-full justify-between gap-4">
                    <span className="text-muted-foreground">{chartConfig[name as keyof typeof chartConfig]?.label}</span>
                    <span className="font-medium tabular-nums">{fmtPct(value as number)}</span>
                  </span>
                )} />}
              />
              <ChartLegend content={<ChartLegendContent />} itemSorter={(item) => SERIES.indexOf(item.dataKey as (typeof SERIES)[number])} />
              {SERIES.map((k) => (
                <Line
                  key={k}
                  dataKey={k}
                  type="linear"
                  stroke={`var(--color-${k})`}
                  strokeWidth={2}
                  dot={{ r: 4, fill: `var(--color-${k})`, strokeWidth: 2, stroke: 'var(--card)' }}
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ChartContainer>
        ) : (
          <EmptyState>
            {chartData.length === 1 ? 'One snapshot recorded. The trend appears after the second.' : `No ${view} snapshots yet. Record the first one below.`}
          </EmptyState>
        )}

        {series.length > 0 && (
          <Table className="mt-4">
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">UAE</TableHead>
                <TableHead className="text-right">Education</TableHead>
                <TableHead className="text-right">Decision-makers</TableHead>
                <TableHead className="text-right">Est. UAE {view}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...series].reverse().map((d) => (
                <TableRow key={d.as_of}>
                  <TableCell>{d.as_of}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtNumber(d.total)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtPct(d.shares.uae_share)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtPct(d.shares.education_share)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtPct(d.shares.decision_maker_share)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {d.total != null && d.shares.uae_share != null ? fmtNumber(d.total * d.shares.uae_share) : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`Delete snapshot ${d.as_of}`}
                      onClick={() => del.mutate({ as_of: d.as_of, audience: d.audience }, { onError: (e) => toast.error(e.message) })}
                    >
                      <Trash2 />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Section>

      {account && <RecordSnapshot accountId={account.id} defaultType={view} />}
    </div>
  )
}
