import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { Lead } from '@/lib/api'
import { SOURCE_LABEL } from '../constants'

export function Sources({ leads }: { leads: Lead[] }) {
  const group = (key: (l: Lead) => string | null) => {
    const m = new Map<string, { n: number; won: number; uae: number }>()
    for (const l of leads) {
      const k = key(l)
      if (!k) continue
      const g = m.get(k) ?? { n: 0, won: 0, uae: 0 }
      g.n += 1
      if (l.stage === 'won') g.won += 1
      if (l.in_uae) g.uae += 1
      m.set(k, g)
    }
    return [...m.entries()].sort((a, b) => b[1].n - a[1].n)
  }
  const bySource = group((l) => SOURCE_LABEL[l.source])
  const byTopic = group((l) => l.post_topic ?? (l.post_id ? 'Post without a topic' : null))
  const byProfile = group((l) => l.via_account_name)
  const max = Math.max(1, ...bySource.map(([, g]) => g.n))
  const List = ({ title, rows, note }: { title: string; rows: [string, { n: number; won: number; uae: number }][]; note?: string }) => (
    <div>
      <div className="mb-2 text-sm font-medium">{title}</div>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">{note}</p>
      ) : (
        <div className="space-y-1.5">
          {rows.slice(0, 6).map(([k, g]) => (
            <div key={k} className="grid grid-cols-[minmax(0,1fr)_48px_auto] items-center gap-2 text-sm">
              <span className="truncate" title={k}>
                {k}
              </span>
              <span className="h-2 rounded-full bg-muted">
                <span className="block h-full rounded-full bg-primary" style={{ width: `${(g.n / max) * 100}%` }} />
              </span>
              <span className="w-28 text-xs text-muted-foreground tabular-nums">
                <b className="text-foreground">{g.n}</b> · {g.uae} UAE · {g.won} won
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="text-sm font-medium">Where leads come from</div>
        <p className="text-xs text-muted-foreground">Small numbers are anecdotes: wait for a pattern across several leads before changing what you post.</p>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-3">
        <List title="By source" rows={bySource} />
        <List title="By post topic" rows={byTopic} note="Link leads to the post they came from to see which topics bring enquiries." />
        <List title="By profile" rows={byProfile} note="Choose the founder or page a lead came through to compare them." />
      </CardContent>
    </Card>
  )
}
