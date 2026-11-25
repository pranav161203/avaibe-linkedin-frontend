/** Two progress rings: the UAE share of followers, and posts this month against a usual month. */
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { fmtNumber } from '@/lib/format'

function Ring({ fraction, center, sub }: { fraction: number | null; center: string; sub?: string }) {
  const r = 42
  const c = 2 * Math.PI * r
  const f = fraction == null ? 0 : Math.max(0, Math.min(1, fraction))
  return (
    <svg viewBox="0 0 100 100" className="size-28 shrink-0 -rotate-90" aria-hidden>
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--muted)" strokeWidth="9" />
      {f > 0 && <circle cx="50" cy="50" r={r} fill="none" stroke="var(--primary)" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${f * c} ${c}`} />}
      <g className="rotate-90" style={{ transformOrigin: '50px 50px' }}>
        <text x="50" y={sub ? 49 : 55} textAnchor="middle" className="fill-foreground text-[19px] font-semibold tabular-nums">
          {center}
        </text>
        {sub && (
          <text x="50" y="64" textAnchor="middle" className="fill-muted-foreground text-[9px]">
            {sub}
          </text>
        )}
      </g>
    </svg>
  )
}

export function RingsCard({
  uae,
  posts,
}: {
  /** UAE share of followers (0–1), with the total and date it's from; null for accounts without demographics */
  uae: { share: number | null; total: number | null; asOf: string | null; to: string } | null
  posts: { count: number; usual: number | null; month: string; to: string }
}) {
  return (
    <Card className="justify-around gap-6 p-6">
      {uae && (
        <Link to={uae.to} className="group flex items-center gap-5">
          <Ring fraction={uae.share} center={uae.share == null ? '—' : `${(uae.share * 100).toFixed(1)}%`} />
          <div className="min-w-0">
            <div className="text-sm font-semibold group-hover:text-primary">UAE followers</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {uae.share == null
                ? 'Import follower demographics'
                : `${fmtNumber(uae.total != null ? Math.round(uae.total * uae.share) : null)} of ${fmtNumber(uae.total)} followers${uae.asOf ? ` · ${uae.asOf}` : ''}`}
            </div>
          </div>
        </Link>
      )}
      <Link to={posts.to} className="group flex items-center gap-5">
        <Ring fraction={posts.usual ? posts.count / posts.usual : null} center={String(posts.count)} sub={posts.usual ? `of ~${posts.usual}` : undefined} />
        <div className="min-w-0">
          <div className="text-sm font-semibold group-hover:text-primary">Posts in {posts.month}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {posts.usual ? `Typical month: ${posts.usual} (last 3 months)` : 'Published so far this month'}
          </div>
        </div>
      </Link>
    </Card>
  )
}
