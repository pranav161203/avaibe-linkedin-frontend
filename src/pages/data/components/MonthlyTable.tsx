import { useMemo } from 'react'
import { differenceInCalendarDays, endOfMonth, format, parseISO } from 'date-fns'
import { CalendarDays } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { PageDay } from '@/lib/api'
import { fmtNumber, fmtPct } from '@/lib/format'
import { engagementOf, totals, type Totals } from '@/components/period'
import { CardHeading } from '@/components/common'

export function MonthlyTable({ days }: { days: PageDay[] }) {
  const months = useMemo(() => {
    const groups = new Map<string, PageDay[]>()
    for (const d of days) {
      const k = d.date.slice(0, 7)
      groups.set(k, [...(groups.get(k) ?? []), d])
    }
    return [...groups.entries()].sort().map(([k, ds]) => ({ key: k, t: totals(ds), partial: ds.length < differenceInCalendarDays(endOfMonth(parseISO(`${k}-01`)), parseISO(`${k}-01`)) + 1 }))
  }, [days])
  if (months.length < 2) return null
  const cols: [string, (t: Totals) => string][] = [
    ['Impressions', (t) => fmtNumber(t.impressions)],
    ['Unique', (t) => fmtNumber(t.unique_impressions)],
    ['Clicks', (t) => fmtNumber(t.clicks)],
    ['Reactions', (t) => fmtNumber(t.reactions)],
    ['Comments', (t) => fmtNumber(t.comments)],
    ['Reposts', (t) => fmtNumber(t.reposts)],
    ['Engagement', (t) => fmtPct(engagementOf(t))],
    ['Page views', (t) => fmtNumber(t.page_views)],
    ['Visitors', (t) => fmtNumber(t.unique_visitors)],
    ['New followers', (t) => fmtNumber(t.new_followers)],
  ]
  return (
    <Card>
      <CardHeader>
        <CardHeading icon={CalendarDays} title="Month by month" />
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Month</th>
                {cols.map(([h]) => (
                  <th key={h} className="px-2 py-2 text-right font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {months.map((m) => (
                <tr key={m.key} className="border-b last:border-0">
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {format(parseISO(`${m.key}-01`), 'MMM yyyy')}
                    {m.partial && <span className="ml-1 text-xs text-muted-foreground">(part)</span>}
                  </td>
                  {cols.map(([h, f]) => (
                    <td key={h} className="px-2 py-2 text-right tabular-nums">{f(m.t)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
