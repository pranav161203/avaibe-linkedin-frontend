import type { ReactNode } from 'react'
import { ArrowDownRight, ArrowRight, ArrowUpRight, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { fmtNumber, fmtPct } from '@/lib/format'
import { cn } from '@/lib/utils'
import { CardHeading } from '@/components/common'

export interface Highlight {
  label: string
  value: number | null
  prev?: number | null
  /** A rate (0..1): the change is shown in percentage points */
  pct?: boolean
  /** Too little behind the number for a change to mean anything (counts decide this themselves) */
  small?: boolean
  hint?: string
}

/** Below this, a count's % change is mostly noise (2 → 4 comments is "+100%") */
const SMALL_COUNT = 20

function changeLine(h: Highlight, compareLabel: string): { text: string; dir: 'up' | 'down' | 'flat' | 'none' } {
  if (h.value == null) return { text: 'Not in your data yet', dir: 'none' }
  if (h.prev == null) return { text: 'No earlier period to compare', dir: 'none' }
  const small = h.small ?? (!h.pct && Math.max(h.value, h.prev) < SMALL_COUNT)
  if (small) return { text: 'Too few to compare', dir: 'none' }
  if (h.pct) {
    const d = (h.value - h.prev) * 100
    return { text: `${d >= 0 ? '+' : ''}${d.toFixed(1)} pt ${compareLabel}`, dir: Math.abs(d) < 0.1 ? 'flat' : d > 0 ? 'up' : 'down' }
  }
  if (!h.prev) return { text: `up from 0 ${compareLabel}`, dir: 'up' }
  const r = h.value / h.prev - 1
  return { text: `${r >= 0 ? '+' : ''}${(r * 100).toFixed(0)}% ${compareLabel}`, dir: Math.abs(r) < 0.02 ? 'flat' : r > 0 ? 'up' : 'down' }
}

export function Highlights({ items, dates, compareLabel, summary }: { items: Highlight[]; dates: ReactNode; compareLabel: string; summary?: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardHeading icon={Sparkles} title="Highlights" sub={dates} />
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4">
          {items.map((h) => {
            const c = changeLine(h, compareLabel)
            const Icon = c.dir === 'up' ? ArrowUpRight : c.dir === 'down' ? ArrowDownRight : c.dir === 'flat' ? ArrowRight : null
            return (
              <div key={h.label}>
                <dd className="text-[30px] leading-none font-medium tracking-tight tabular-nums">{h.value == null ? '—' : h.pct ? fmtPct(h.value) : fmtNumber(h.value)}</dd>
                <dt className="mt-0.5 text-sm text-muted-foreground">{h.label}</dt>
                <div
                  className={cn(
                    'mt-1 inline-flex items-center gap-0.5 text-xs tabular-nums',
                    c.dir === 'up' ? 'text-good-fg' : c.dir === 'down' ? 'text-bad-fg' : 'text-muted-foreground',
                  )}
                >
                  {Icon && <Icon className="size-3.5" />}
                  {c.text}
                </div>
                {h.hint && <div className="mt-0.5 text-[11px] text-muted-foreground">{h.hint}</div>}
              </div>
            )
          })}
        </dl>
        {summary && <p className="mt-5 border-t pt-4 text-sm">{summary}</p>}
      </CardContent>
    </Card>
  )
}
