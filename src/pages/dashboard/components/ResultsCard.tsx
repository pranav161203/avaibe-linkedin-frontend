/**
 * Dashboard-only charts: things the Data page doesn't show.
 * - Posting rhythm: posts per week over the last 12 weeks (consistency)
 * - Formats: the typical (median) post in each format this period, at the same age
 * - Per 1,000 impressions: what attention turned into (clicks, page visitors, new followers)
 * One series each, in the brand coral; every bar has a hover/focus tooltip with the exact figures.
 */
import { Target } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { CardHeading } from '@/components/common'
import { Tip } from './ChartTip'
import type { Totals } from '../utils'

export function ResultsCard({ cur, prev, company }: { cur: Totals; prev: Totals | null; company: boolean }) {
  const per = (t: Totals | null, v: number | null | undefined) => (t && t.impressions && v != null ? (v / t.impressions) * 1000 : null)
  const rows = [
    { label: 'Clicks', now: per(cur, cur.clicks), before: per(prev, prev?.clicks) },
    ...(company ? [{ label: 'Page visitors', now: per(cur, cur.unique_visitors), before: per(prev, prev?.unique_visitors) }] : []),
    { label: 'New followers', now: per(cur, cur.new_followers), before: per(prev, prev?.new_followers) },
  ].filter((r) => r.now != null)
  const max = Math.max(1, ...rows.map((r) => Math.max(r.now ?? 0, r.before ?? 0)))
  const fmt = (v: number) => (v >= 10 ? Math.round(v).toLocaleString() : v.toFixed(1))

  return (
    <Card>
      <CardHeader>
        <CardHeading icon={Target} title="Per 1,000 impressions" sub="What attention turned into this period" />
      </CardHeader>
      <CardContent>
        {!rows.length ? (
          <p className="text-sm text-muted-foreground">No impressions recorded in this period.</p>
        ) : (
          <ul className="space-y-2.5">
            {rows.map((r) => (
              <li key={r.label} tabIndex={0} className="group relative outline-none">
                <div className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="font-medium">{r.label}</span>
                  <span className="tabular-nums">
                    {fmt(r.now!)}
                    {r.before != null && <span className="text-muted-foreground"> · was {fmt(r.before)}</span>}
                  </span>
                </div>
                <div className="relative mt-1 h-2 rounded-[4px] bg-muted">
                  <div className="h-full rounded-[4px] bg-primary" style={{ width: `${Math.max(2, (r.now! / max) * 100)}%` }} />
                  {/* last period, as a tick on the same scale */}
                  {r.before != null && (
                    <div className="absolute -top-0.5 h-3 w-[2px] rounded bg-foreground/60" style={{ left: `calc(${Math.min(100, (r.before / max) * 100)}% - 1px)` }} />
                  )}
                </div>
                <Tip align="left">
                  {r.label}: {fmt(r.now!)} per 1,000 impressions
                  {r.before != null ? ` (last period ${fmt(r.before)})` : ''}
                </Tip>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-[11px] text-muted-foreground">
          Bar = this period, tick = last period. Visitors and followers can also come from outside your posts.
        </p>
      </CardContent>
    </Card>
  )
}
