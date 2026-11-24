import { useState, type ReactNode } from 'react'
import { CheckCircle2, ChevronDown, ChevronRight, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, PageHeader } from '@/components/common'
import { useAccount } from '@/context/account'
import { AREAS, itemState, useSimilarPosts, useSuggestionItems, type AreaId } from '@/hooks/suggestion-items'
import { fmtNumber } from '@/lib/format'
import { GenerateBar } from './GenerateBar'
import { ItemList } from './ItemList'
import { TOP, VISIBLE } from '../constants'
import { SimilarCtx } from '../context/similar'

export function AreaPage({ areas, eyebrow = 'Suggestions', title, description, filter, above, empty, showArea = false }: {
  areas: AreaId[]
  eyebrow?: string
  title?: string
  description?: string
  /** Shown under the header, e.g. the area chips on the combined Suggestions page */
  filter?: ReactNode
  /** Shown above the list, e.g. Trends on the Brand chip */
  above?: ReactNode
  empty?: string
  showArea?: boolean
}) {
  const areaId = areas[0]
  const def = AREAS.find((a) => a.id === areaId)!
  const { account } = useAccount()
  const { items, suggestions, ideas, isLoading } = useSuggestionItems(account?.id)
  const [showAll, setShowAll] = useState(false)
  const [showClosed, setShowClosed] = useState(false)

  const mine = items.filter((it) => areas.includes(it.area))
  const { data: similar } = useSimilarPosts(account?.id, mine)
  const open = mine.filter((it) => itemState(it.decision?.status) === 'open')
  const closed = mine.filter((it) => ['later', 'closed'].includes(itemState(it.decision?.status)))
  const top = open.slice(0, TOP)
  const rest = open.slice(TOP)
  const restShown = showAll ? rest : rest.slice(0, VISIBLE - TOP)
  const usesData = areas.includes('content') || areaId === 'data'
  const gaps = areaId === 'data' ? (ideas?.latest?.result?.data_gaps ?? []) : []

  return (
    <SimilarCtx.Provider value={similar}>
    <div className="mx-auto max-w-page space-y-5">
      <PageHeader eyebrow={eyebrow} title={title ?? def.label} description={description ?? def.intro} />
      {filter}

      {usesData && suggestions && suggestions.baseline != null && (
        <p className="text-xs text-muted-foreground">
          Based on your own posts, compared at <b>{suggestions.checkpoint ?? '24h'}</b> · typical post: <b>{fmtNumber(suggestions.baseline)}</b>{' '}
          {suggestions.metric_label}
        </p>
      )}

      {account && areaId !== 'data' && <GenerateBar accountId={account.id} state={ideas} />}

      {above}

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      ) : (
        <>
          {open.length === 0 ? (
            <EmptyState icon={CheckCircle2}>{closed.length ? 'Everything here has been decided. ' : ''}{empty ?? def.empty}</EmptyState>
          ) : (
            open.length > 0 && (
              <>
                <ItemList title={`Top ${Math.min(TOP, top.length)}`} items={top} accountId={account!.id} highlight showArea={showArea} />
                {rest.length > 0 && (
                  <ItemList title="Other suggestions" items={restShown} accountId={account!.id} showArea={showArea}>
                    {rest.length > restShown.length && (
                      <Button size="sm" variant="ghost" onClick={() => setShowAll(true)}>
                        <ChevronDown /> Show {rest.length - restShown.length} more
                      </Button>
                    )}
                  </ItemList>
                )}
              </>
            )
          )}

          {gaps.length > 0 && (
            <div className="rounded-lg border border-border/70 p-4">
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                <Lightbulb className="size-4" /> Claude also noted these gaps
              </div>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {gaps.map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            </div>
          )}

          {closed.length > 0 && (
            <div>
              <Button size="sm" variant="ghost" onClick={() => setShowClosed((v) => !v)} className="text-muted-foreground">
                {showClosed ? <ChevronDown /> : <ChevronRight />} Done, dismissed &amp; later ({closed.length})
              </Button>
              {showClosed && <ItemList items={closed} accountId={account!.id} muted showArea={showArea} />}
            </div>
          )}
        </>
      )}
    </div>
    </SimilarCtx.Provider>
  )
}
