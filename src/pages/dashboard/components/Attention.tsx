import { Link } from 'react-router-dom'
import { BellRing, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { CardHeading } from '@/components/common'
import { AREAS, areaPath, itemState, useSuggestionItems } from '@/hooks/suggestion-items'
import { needsAction } from '@/lib/publishing'
import { useGetDueSnapshots } from '@/pages/data/queries'
import { useGetPlannedPosts } from '@/pages/publishing/queries'

export function Attention({ accountId }: { accountId?: number }) {
  const { data: planned = [] } = useGetPlannedPosts(accountId)
  const { data: due = [] } = useGetDueSnapshots(accountId)
  const { items } = useSuggestionItems(accountId)
  const waiting = planned.filter(needsAction).length
  const top = items.filter((it) => itemState(it.decision?.status) === 'open').slice(0, 3)
  const rows: { to: string; text: string; sub?: string }[] = []
  if (waiting) rows.push({ to: '/publishing', text: `${waiting} post${waiting === 1 ? '' : 's'} waiting in Publishing` })
  if (due.length) rows.push({ to: '/posts', text: `${due.length} snapshot${due.length === 1 ? '' : 's'} due` })
  for (const it of top) rows.push({ to: areaPath(it.area), text: it.title, sub: AREAS.find((a) => a.id === it.area)?.label })

  return (
    <Card>
      <CardHeader>
        <CardHeading icon={BellRing} title="Action required" />
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending actions.</p>
        ) : (
          <ul className="-mx-2">
            {rows.map((r) => (
              <li key={r.to + r.text}>
                <Link to={r.to} className="flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{r.text}</span>
                    {r.sub && <span className="block text-xs text-muted-foreground">{r.sub}</span>}
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
