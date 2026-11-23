import { aed } from '@/pages/leads/utils'

export function MoneyList({ title, rows }: { title: string; rows: [string, { leads: number; won: number; wonAed: number; openAed: number }][] }) {
  const max = Math.max(1, ...rows.map(([, g]) => g.wonAed + g.openAed))
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm font-medium">
        {title}
        <span className="flex items-center gap-3 text-xs font-normal text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-primary" /> Won
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-primary/30" /> Open
          </span>
        </span>
      </div>
      <div className="space-y-2.5">
        {rows.map(([k, g]) => (
          <div key={k}>
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="truncate" title={k}>
                {k}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                <b className="text-foreground">{g.wonAed ? aed(g.wonAed) : '–'}</b> · {g.leads} lead{g.leads === 1 ? '' : 's'}, {g.won} won
              </span>
            </div>
            <div className="mt-1 flex h-2 overflow-hidden rounded-full bg-muted">
              <span className="h-full bg-primary" style={{ width: `${(g.wonAed / max) * 100}%` }} />
              <span className="h-full bg-primary/30" style={{ width: `${(g.openAed / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
