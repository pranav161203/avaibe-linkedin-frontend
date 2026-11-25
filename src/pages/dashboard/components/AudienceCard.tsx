import { useState } from 'react'
import { Link } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { Users } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { CardHeading } from '@/components/common'
import type { PageAudienceSnapshot } from '@/lib/api'
import { fmtNumber, fmtPct } from '@/lib/format'
import { cn } from '@/lib/utils'
import { GROUPS } from '../constants'

export function AudienceCard({ audience, followersLink, visitorsLink }: { audience: PageAudienceSnapshot[]; followersLink: string; visitorsLink: string }) {
  const [kind, setKind] = useState<'followers' | 'visitors'>('followers')
  const latest = audience.filter((a) => a.audience === kind).sort((a, b) => a.as_of.localeCompare(b.as_of)).at(-1)
  return (
    <Card>
      <CardHeader>
        <CardHeading
          icon={Users}
          title="Audience"
          sub={latest ? `${latest.total != null ? `${fmtNumber(latest.total)} ${kind} · ` : ''}as of ${format(parseISO(latest.as_of), 'd MMM')}` : undefined}
        />
        <div role="tablist" aria-label="Audience" className="mt-3 flex w-fit rounded-lg bg-secondary p-1">
          {(['followers', 'visitors'] as const).map((k) => (
            <button
              key={k}
              role="tab"
              type="button"
              aria-selected={kind === k}
              onClick={() => setKind(k)}
              className={cn('rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors', kind === k ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
            >
              {k}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {!latest ? (
          <p className="text-sm text-muted-foreground">
            No {kind} breakdown available. <Link to="/import" className="underline">Import a LinkedIn export</Link>.
          </p>
        ) : (
          <>
            <ul className="space-y-3.5">
              {GROUPS.map((g) => {
                const share = latest.shares[g.key] ?? null
                const count = share != null && latest.total != null ? Math.round(share * latest.total) : null
                return (
                  <li key={g.key} title={g.hint}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-medium">{g.label}</span>
                      <span className="tabular-nums">
                        {count != null && <span className="font-semibold">{fmtNumber(count)}</span>}
                        <span className="ml-2 inline-block w-11 text-right text-xs text-muted-foreground">{share == null ? '—' : fmtPct(share)}</span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full" style={{ width: `${Math.max(share ? 2 : 0, (share ?? 0) * 100)}%`, background: g.color }} />
                    </div>
                  </li>
                )
              })}
            </ul>
            <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
              Groups overlap and may not total 100%. LinkedIn reports only the largest values, so figures are minimums.{' '}
              <Link to={kind === 'followers' ? followersLink : visitorsLink} className="underline">
                Full breakdown
              </Link>
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
