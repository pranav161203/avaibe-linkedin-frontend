import { Link } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { Trophy } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { CardHeading } from '@/components/common'
import { inRange, type TimeRange } from '@/components/time-range'
import { FORMAT_LABELS, fmtNumber } from '@/lib/format'
import { useGetOverview, useGetPosts } from '@/pages/data/queries'

export function BestPosts({ accountId, range }: { accountId?: number; range: TimeRange }) {
  const { data: probe } = useGetOverview(accountId, '24h')
  const { data: posts = [] } = useGetPosts(accountId, { checkpoint: probe?.suggested_checkpoint ?? '24h' })
  const best = posts
    .filter((p) => inRange(p.published_at, range))
    .map((p) => ({ p, s: p.snapshots[p.snapshots.length - 1] }))
    .filter((x) => x.s?.impressions != null)
    .sort((a, b) => (b.s!.impressions ?? 0) - (a.s!.impressions ?? 0))
    .slice(0, 7)

  return (
    <Card>
      <CardHeader>
        <CardHeading
          icon={Trophy}
          title="Top posts"
          sub="Impressions to date. Recent posts have had less time to accumulate impressions."
          action={
            <Link to="/data?tab=posts" className="pt-1 text-xs text-muted-foreground hover:text-foreground">
              All posts
            </Link>
          }
        />
      </CardHeader>
      <CardContent>
        {best.length === 0 ? (
          <p className="text-sm text-muted-foreground">No posts with metrics in this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] table-fixed text-sm">
              <thead>
                <tr className="border-b text-left text-[11px] tracking-wide text-muted-foreground uppercase">
                  <th className="w-[46%] py-2 pr-3 font-medium">Post</th>
                  <th className="w-[20%] px-2 py-2 font-medium">Type</th>
                  <th className="w-[11%] px-2 py-2 font-medium">Posted</th>
                  <th className="w-[13%] px-2 py-2 text-right font-medium">Impressions</th>
                  <th className="w-[10%] py-2 pl-2 text-right font-medium">Clicks</th>
                </tr>
              </thead>
              <tbody>
                {best.map(({ p, s: snap }) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-3 pr-3">
                      <Link to={`/posts/${p.id}`} className="block truncate font-medium hover:underline">
                        {p.caption?.split('\n')[0] || p.topic || p.ref || `Post ${p.id}`}
                      </Link>
                    </td>
                    <td className="truncate px-2 py-3 text-xs text-muted-foreground">{FORMAT_LABELS[p.format]}</td>
                    <td className="px-2 py-3 text-xs whitespace-nowrap text-muted-foreground">{format(parseISO(p.published_at_uae.slice(0, 10)), 'd MMM')}</td>
                    <td className="px-2 py-3 text-right font-semibold tabular-nums">{fmtNumber(snap!.impressions)}</td>
                    <td className="py-3 pl-2 text-right tabular-nums">{fmtNumber(snap!.clicks)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
