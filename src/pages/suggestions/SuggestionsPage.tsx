import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import { useAccount } from '@/context/account'
import { AREAS, COMBINED, useSuggestionItems, type AreaId } from '@/hooks/suggestion-items'
import { cn } from '@/lib/utils'
import { AreaPage } from './components/AreaPage'
import { TrendsPanel } from './components/TrendsPanel'

/** The chips on the one Suggestions page: each is a set of areas */
const FILTERS: { id: string; label: string; areas: AreaId[] }[] = [
  { id: 'all', label: 'All', areas: COMBINED },
  { id: 'content', label: 'Content', areas: ['content'] },
  { id: 'brand', label: 'Brand', areas: ['brand'] },
  { id: 'leads', label: 'Leads & sales', areas: ['leads', 'sales'] },
]

export function SuggestionsPage() {
  const { area } = useParams()
  if (area) {
    // Old links (/suggestions/content and the like) open the matching chip
    const chip = area === 'sales' ? 'leads' : area
    if (FILTERS.some((f) => f.id === chip)) return <Navigate to={`/suggestions?area=${chip}`} replace />
    const def = AREAS.find((a) => a.id === area)
    if (!def) return <Navigate to="/suggestions" replace />
    return <AreaPage key={def.id} areas={[def.id]} />
  }
  return <CombinedSuggestions />
}

function CombinedSuggestions() {
  const [params, setParams] = useSearchParams()
  const { account } = useAccount()
  const { counts } = useSuggestionItems(account?.id)
  const current = FILTERS.find((f) => f.id === params.get('area')) ?? FILTERS[0]
  const pick = (id: string) =>
    setParams(
      (p) => {
        if (id === 'all') p.delete('area')
        else p.set('area', id)
        return p
      },
      { replace: true },
    )

  const chips = (
    <div role="tablist" aria-label="Which suggestions" className="flex flex-wrap gap-1.5">
      {FILTERS.map((f) => {
        const n = f.areas.reduce((a, x) => a + counts[x], 0)
        const on = f.id === current.id
        return (
          <button
            key={f.id}
            role="tab"
            aria-selected={on}
            type="button"
            onClick={() => pick(f.id)}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium ring-1 transition-colors',
              on ? 'bg-primary text-primary-foreground ring-primary' : 'bg-card text-foreground ring-border hover:bg-accent',
            )}
          >
            {f.label}
            {n > 0 && <span className={cn('text-xs tabular-nums', on ? 'opacity-80' : 'text-muted-foreground')}>{n}</span>}
          </button>
        )
      })}
    </div>
  )

  return (
    <AreaPage
      key={current.id}
      areas={current.areas}
      eyebrow="Content"
      title="Suggestions"
      description="What to do next, in one list: what to post, how the page comes across, and how to turn attention into enquiries and sales."
      filter={chips}
      above={current.id === 'brand' && account ? <TrendsPanel accountId={account.id} /> : undefined}
      showArea={current.id === 'all'}
      empty={current.id === 'all' ? 'No suggestions right now. They appear as new posts and numbers come in, and when Claude generates ideas.' : undefined}
    />
  )
}
