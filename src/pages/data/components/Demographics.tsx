import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { Globe } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PageAudienceSnapshot } from '@/lib/api'
import { fmtNumber, fmtPct } from '@/lib/format'
import { cn } from '@/lib/utils'
import { IconTile } from '@/components/common'

const DIM_LABELS: Record<string, string> = {
  country: 'Country',
  location: 'Location',
  job_function: 'Job function',
  seniority: 'Seniority',
  industry: 'Industry',
  company_size: 'Company size',
}

const UAE = /united arab emirates|\buae\b|dubai|abu dhabi|sharjah|ajman|ras al|fujairah|umm al/i

export function Demographics({ snapshot, noun }: { snapshot: PageAudienceSnapshot | undefined; noun: string }) {
  const [dim, setDim] = useState('country')
  const groups = useMemo(() => {
    const out = new Map<string, { value: string; n: number; isCount: boolean }[]>()
    if (!snapshot) return out
    for (const r of snapshot.rows) {
      const n = r.count ?? r.pct
      if (n == null) continue
      const list = out.get(r.dimension) ?? []
      list.push({ value: r.value, n, isCount: r.count != null })
      out.set(r.dimension, list)
    }
    // Countries, rolled up from LinkedIn's regions ("Greater Delhi Area, India" → India)
    const loc = out.get('location')
    if (loc?.length) {
      const by = new Map<string, number>()
      for (const r of loc) {
        // A region without a country ("Los Angeles Metropolitan Area") can't be placed reliably
        const c = r.value.includes(',') ? r.value.split(',').at(-1)!.trim() : UAE.test(r.value) ? 'United Arab Emirates' : 'Other (region only)'
        by.set(c, (by.get(c) ?? 0) + r.n)
      }
      out.set('country', [...by].map(([value, n]) => ({ value, n, isCount: loc[0].isCount })))
    }
    for (const list of out.values()) list.sort((a, b) => b.n - a.n)
    return out
  }, [snapshot])

  if (!snapshot) {
    return (
      <Card>
        <CardHeader>
          <span className="flex items-center gap-3"><IconTile icon={Globe} /><CardTitle className="text-base font-semibold">{noun[0].toUpperCase() + noun.slice(1)} demographics</CardTitle></span>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No {noun} breakdown yet. <Link to="/import" className="underline">Import LinkedIn’s export</Link> or record one below.
          </p>
        </CardContent>
      </Card>
    )
  }

  const dims = Object.keys(DIM_LABELS).filter((d) => groups.get(d)?.length)
  const active = dims.includes(dim) ? dim : dims[0]
  const rows = groups.get(active) ?? []
  const total = snapshot.total
  const geo = active === 'country' || active === 'location'
  // The top 6, plus UAE rows further down: the target market is always shown
  const top = [...rows.slice(0, 6), ...(geo ? rows.slice(6).filter((r) => UAE.test(r.value)).slice(0, 3) : [])]
  const max = top[0]?.n ?? 1
  const uaeRow = geo ? rows.filter((r) => UAE.test(r.value)) : []
  const uaeRank = active === 'country' ? rows.findIndex((r) => UAE.test(r.value)) : -1

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="flex items-center gap-3"><IconTile icon={Globe} /><CardTitle className="text-base font-semibold">{noun[0].toUpperCase() + noun.slice(1)} demographics</CardTitle></span>
            <div className="text-xs text-muted-foreground">
              As of {format(parseISO(snapshot.as_of), 'd MMM yyyy')}
              {total != null && ` · ${fmtNumber(total)} ${noun}`}
            </div>
          </div>
          <div role="tablist" aria-label="Breakdown" className="flex flex-wrap gap-1 rounded-lg bg-secondary p-1">
            {dims.map((d) => (
              <button
                key={d}
                role="tab"
                type="button"
                aria-selected={d === active}
                onClick={() => setDim(d)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  d === active ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {DIM_LABELS[d]}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2.5">
          {top.map((r) => {
            const isUae = geo && UAE.test(r.value)
            const share = r.isCount && total ? r.n / total : r.isCount ? null : r.n / 100
            return (
              <li key={r.value} className="text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <span className={cn('truncate', isUae && 'font-semibold')}>
                    {r.value}
                    {isUae && <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">Target market</span>}
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {r.isCount ? fmtNumber(r.n) : `${r.n}%`}
                    {share != null && r.isCount && <span className="ml-2 inline-block w-12 text-right">{fmtPct(share)}</span>}
                  </span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-muted">
                  <div className={cn('h-1.5 rounded-full', isUae ? 'bg-primary' : 'bg-[var(--chart-current)] opacity-60')} style={{ width: `${(r.n / max) * 100}%` }} />
                </div>
              </li>
            )
          })}
        </ul>
        {active === 'country' && (
          <p className="mt-4 text-xs text-muted-foreground">
            {uaeRow.length
              ? `The UAE is #${uaeRank + 1} of ${rows.length} countries${uaeRank >= 6 ? ' (added to the list above)' : ''}. `
              : 'No UAE locations in LinkedIn’s list. '}
            Countries are added up from LinkedIn’s regions, and LinkedIn lists only the biggest ones, so small countries are undercounted.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
