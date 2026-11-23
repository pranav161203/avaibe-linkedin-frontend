import { Layers } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { CardHeading } from '@/components/common'
import { inRange, type TimeRange } from '@/components/time-range'
import type { Post } from '@/lib/api'
import { FORMAT_LABELS, fmtNumber } from '@/lib/format'
import { Tip } from './ChartTip'
import { median } from '../utils'

export function FormatsCard({ posts, range, checkpoint }: { posts: Post[]; range: TimeRange; checkpoint: string }) {
  const by = new Map<string, number[]>()
  for (const p of posts) {
    if (!inRange(p.published_at, range) || p.format === 'untagged') continue
    // Same age for every post (the age most posts have), so newer posts aren't counted short
    const imp = p.snapshots.find((s) => s.checkpoint === checkpoint)?.impressions
    if (imp == null) continue
    by.set(p.format, [...(by.get(p.format) ?? []), imp])
  }
  // Like with like: a format needs at least 2 posts to show a typical figure
  const rows = [...by.entries()]
    .filter(([, v]) => v.length >= 2)
    .map(([f, v]) => ({ format: f, posts: v.length, median: median(v)! }))
    .sort((a, b) => b.median - a.median)
  const max = Math.max(1, ...rows.map((r) => r.median))
  const few = [...by.entries()].filter(([, v]) => v.length < 2).length

  return (
    <Card>
      <CardHeader>
        <CardHeading icon={Layers} title="Which formats get seen" sub={`Typical (median) impressions per post in this period, at ${checkpoint === '7d' ? '7 days' : checkpoint} old`} />
      </CardHeader>
      <CardContent>
        {rows.length < 2 ? (
          <p className="text-sm text-muted-foreground">Needs at least two formats with 2+ posts each (with figures at that age) in this period. Try a longer time range.</p>
        ) : (
          <ul className="space-y-2.5">
            {rows.map((r) => (
              <li key={r.format} tabIndex={0} className="group relative outline-none">
                <div className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="font-medium">{FORMAT_LABELS[r.format as keyof typeof FORMAT_LABELS] ?? r.format}</span>
                  <span className="tabular-nums">
                    {fmtNumber(Math.round(r.median))} <span className="text-muted-foreground">· {r.posts} posts</span>
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-[4px] bg-muted">
                  <div className="h-full rounded-[4px] bg-primary" style={{ width: `${Math.max(2, (r.median / max) * 100)}%` }} />
                </div>
                <Tip align="left">
                  {FORMAT_LABELS[r.format as keyof typeof FORMAT_LABELS] ?? r.format}: median {fmtNumber(Math.round(r.median))} impressions across {r.posts} posts
                </Tip>
              </li>
            ))}
          </ul>
        )}
        {rows.length >= 2 && few > 0 && (
          <p className="mt-3 text-[11px] text-muted-foreground">
            {few} {few === 1 ? 'format has' : 'formats have'} only one post in this period and {few === 1 ? 'is' : 'are'} left out.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
