import { ExternalLink, Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Competitor } from '@/lib/api'
import { fmtNumber } from '@/lib/format'
import { SEGMENTS } from '../constants'

export function CompetitorCard({ c, canEdit, onEdit, onDelete }: { c: Competitor; canEdit: boolean; onEdit: () => void; onDelete: () => void }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div className="min-w-0">
          <CardTitle className="truncate text-base">{c.name}</CardTitle>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary">{SEGMENTS[c.segment]}</Badge>
            {c.website && (
              <a href={c.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
                Website <ExternalLink className="size-3" />
              </a>
            )}
            {c.linkedin_url && (
              <a href={c.linkedin_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
                LinkedIn <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        </div>
        {canEdit && (
          <div className="flex shrink-0 gap-1">
            <Button size="icon-sm" variant="ghost" aria-label="Edit" onClick={onEdit}>
              <Pencil />
            </Button>
            <Button size="icon-sm" variant="ghost" aria-label="Remove" onClick={onDelete}>
              <Trash2 />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <div className="mb-1 text-xs font-medium text-muted-foreground">Observed (public)</div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <span>Followers: {c.followers != null ? fmtNumber(c.followers) : '—'}</span>
            <span>Posts / week: {c.posts_per_week ?? '—'}</span>
            {c.checked_on && <span className="text-muted-foreground">checked {c.checked_on}</span>}
          </div>
          {c.topics && <p className="mt-1 text-xs">Topics: {c.topics}</p>}
          {c.positioning && <p className="mt-1 text-xs italic">“{c.positioning}”</p>}
        </div>
        {(c.strengths || c.opportunity) && (
          <div className="rounded-md bg-muted/60 p-2.5">
            <div className="mb-1 text-xs font-medium text-muted-foreground">Our view (interpretation)</div>
            {c.strengths && <p className="text-xs">Does well: {c.strengths}</p>}
            {c.opportunity && <p className="mt-1 text-xs">Where AVAIBE can be different: {c.opportunity}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
