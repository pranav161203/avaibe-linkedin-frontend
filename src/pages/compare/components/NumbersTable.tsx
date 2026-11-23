import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { engagementOf, type Totals } from '@/components/period'
import { fmtNumber, fmtPct } from '@/lib/format'
import { cn } from '@/lib/utils'
import { periodLabel, type PeriodSide } from '../utils/insights'

type Range = { from: string; to: string }

export function NumbersTable({ a, b, ta, tb, sa, sb, uaeA, uaeB, lenA, lenB }: { a: Range; b: Range; ta: Totals; tb: Totals; sa: PeriodSide; sb: PeriodSide; uaeA: number | null; uaeB: number | null; lenA: number; lenB: number }) {
  const allRows: { label: string; va: number | null; vb: number | null; fmt: (v: number) => string; total: boolean }[] = [
    { label: 'Impressions', va: ta.impressions, vb: tb.impressions, fmt: fmtNumber, total: true },
    { label: 'Clicks', va: ta.clicks, vb: tb.clicks, fmt: fmtNumber, total: true },
    { label: 'Engagement rate', va: engagementOf(ta), vb: engagementOf(tb), fmt: (v) => fmtPct(v), total: false },
    { label: 'Reactions', va: ta.reactions, vb: tb.reactions, fmt: fmtNumber, total: true },
    { label: 'Comments', va: ta.comments, vb: tb.comments, fmt: fmtNumber, total: true },
    { label: 'Reposts', va: ta.reposts, vb: tb.reposts, fmt: fmtNumber, total: true },
    { label: 'Page views', va: ta.page_views, vb: tb.page_views, fmt: fmtNumber, total: true },
    { label: 'Page visitors', va: ta.unique_visitors, vb: tb.unique_visitors, fmt: fmtNumber, total: true },
    { label: 'New followers', va: ta.new_followers, vb: tb.new_followers, fmt: fmtNumber, total: true },
    { label: 'Posts published', va: sa.posts.length, vb: sb.posts.length, fmt: fmtNumber, total: true },
    { label: 'Typical impressions per post', va: sa.perPost, vb: sb.perPost, fmt: (v) => fmtNumber(Math.round(v)), total: false },
    { label: 'UAE share of followers (at the end)', va: uaeA, vb: uaeB, fmt: (v) => fmtPct(v), total: false },
  ]
  const rows = allRows.filter((r) => r.va != null || r.vb != null)
  return (
    <div className="overflow-x-auto rounded-[1.8rem] bg-card">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th className="px-5 py-3 font-medium"> </th>
            <th className="px-4 py-3 text-right font-medium">
              <span className="text-foreground">A</span> · {periodLabel(a.from, a.to)}
            </th>
            <th className="px-4 py-3 text-right font-medium">
              <span className="text-foreground">B</span> · {periodLabel(b.from, b.to)}
            </th>
            <th className="px-5 py-3 text-right font-medium">Change</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const pa = r.va != null && r.total ? r.va / lenA : r.va
            const pb = r.vb != null && r.total ? r.vb / lenB : r.vb
            const change = pa != null && pb ? (pa - pb) / pb : null
            const up = change != null && change > 0.02
            const down = change != null && change < -0.02
            return (
              <tr key={r.label} className="border-b last:border-0">
                <td className="px-5 py-3 font-medium">{r.label}</td>
                <td className="px-4 py-3 text-right tabular-nums">{r.va == null ? '—' : r.fmt(r.va)}</td>
                <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">{r.vb == null ? '—' : r.fmt(r.vb)}</td>
                <td className="px-5 py-3 text-right tabular-nums">
                  {change == null ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <span className={cn('inline-flex items-center gap-0.5 font-medium', up && 'text-good-fg', down && 'text-bad-fg', !up && !down && 'text-muted-foreground')}>
                      {up ? <ArrowUpRight className="size-3.5" /> : down ? <ArrowDownRight className="size-3.5" /> : null}
                      {change >= 0 ? '+' : ''}
                      {Math.round(change * 100)}%
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
