import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/card'
import type { Change } from '@/components/period'
import { cn } from '@/lib/utils'

export function Kpi({ to, icon: Icon, label, value, change, note }: { to: string; icon: LucideIcon; label: string; value: string; change: Change | null; note: string }) {
  return (
    <Link to={to} className="group block rounded-2xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
      <Card size="sm" className="h-full transition-shadow group-hover:shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between gap-2 text-sm font-medium">
            {label}
            <Icon className="size-4 shrink-0 text-primary" aria-hidden />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-[34px] leading-none font-medium tracking-tight tabular-nums">{value}</span>
            <ChangePill c={change} />
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{note}</div>
        </CardHeader>
      </Card>
    </Link>
  )
}

/** The change as a small coloured pill: ▲ green up, ▼ red down, grey when about the same */
function ChangePill({ c }: { c: Change | null }) {
  if (!c) return null
  const tone = c.dir === 'up' ? 'bg-good/15 text-good-fg' : c.dir === 'down' ? 'bg-bad/10 text-bad-fg' : 'bg-muted text-muted-foreground'
  return (
    <span className={cn('inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums', tone)}>
      {c.dir === 'up' ? '▲' : c.dir === 'down' ? '▼' : '•'} {c.text.replace(/^[+-]/, '')}
    </span>
  )
}
