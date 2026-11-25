import { CLAUDE_TIP, MEASURED_TIP } from '@/lib/format'
import { useContext, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { CheckCircle2, ChevronDown, ChevronRight, Sparkles, Undo2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/context/auth'
import { useTz } from '@/context/timezone'
import { AREAS, type Item } from '@/hooks/suggestion-items'
import type { DecisionStatus } from '@/lib/api'
import { fmtNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import { RuleDetails, IdeaDetails } from './ItemDetails'
import { SimilarLine, SimilarList } from './SimilarPosts'
import { PRIORITY, IDEA_TYPE, STATUS_LABEL } from '../constants'
import { SimilarCtx } from '../context/similar'
import { useSaveDecision } from '@/pages/suggestions/queries'

const AREA_TAG: Partial<Record<Item['area'], string>> = { content: 'Content', brand: 'Brand', leads: 'Leads & sales', sales: 'Leads & sales' }

export function ItemCard({ item, accountId, highlight, muted, showArea }: { item: Item; accountId: number; highlight?: boolean; muted?: boolean; showArea?: boolean }) {
  const [open, setOpen] = useState(false)
  const auth = useAuth()
  const tz = useTz()
  const decide = useSaveDecision(accountId)
  const status = item.decision?.status
  const measured = item.rule?.confidence.pct ?? null
  const estimate = item.idea?.idea.confidence_pct ?? null
  const progress = item.rule?.progress
  const similarAll = useContext(SimilarCtx)
  const similar = similarAll?.results[item.key]

  const set = (s: DecisionStatus | null, msg: string) =>
    decide.mutate({ key: item.key, status: s }, { onSuccess: () => toast.success(msg), onError: (e) => toast.error(e.message) })

  return (
    <Card className={cn('relative overflow-hidden p-0', muted && 'opacity-75')}>
      {highlight && <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-brand-gradient" />}
      <div className="flex flex-wrap items-start gap-3 p-3.5 pl-4">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-start gap-2 text-left"
        >
          {open ? <ChevronDown className="mt-0.5 size-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />}
          <span className="min-w-0">
            <span className="block leading-snug font-medium">{item.title}</span>
            <span className={cn('mt-0.5 block text-sm text-muted-foreground', !open && 'line-clamp-1')}>{item.summary}</span>
            {similar && <SimilarLine s={similar} baseline={similarAll?.baseline ?? null} />}
            <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {showArea && AREA_TAG[item.area] && (
                <span className="mr-1 inline-flex items-center gap-1 text-xs font-semibold text-foreground">
                  {(() => {
                    const Icon = AREAS.find((x) => x.id === (item.area === 'sales' ? 'leads' : item.area))!.icon
                    return <Icon className="size-3.5 text-muted-foreground" />
                  })()}
                  {AREA_TAG[item.area]}
                </span>
              )}
              {item.rule ? (
                <>
                  <Badge variant="outline" className={PRIORITY[item.rule.priority].cls}>
                    {PRIORITY[item.rule.priority].label}
                  </Badge>
                  <Badge variant="secondary">{item.rule.category === 'page' ? 'Page setup' : item.rule.category === 'lead' ? 'Leads log' : 'Performance data'}</Badge>
                </>
              ) : (
                <>
                  <Badge variant="outline">{IDEA_TYPE[item.idea!.idea.type]}</Badge>
                  <Badge variant="outline" className="border-primary/30 text-brand-fg">
                    <Sparkles className="size-3" /> Claude
                  </Badge>
                  <Badge variant="outline" className="capitalize">Effort: {item.idea!.idea.effort}</Badge>
                </>
              )}
              {measured != null ? (
                <Badge variant="outline" className="cursor-help tabular-nums" title={`${MEASURED_TIP} ${item.rule!.confidence.reason}`}>
                  {measured}% supporting posts
                </Badge>
              ) : (
                estimate != null && (
                  <Badge variant="outline" className="cursor-help tabular-nums" title={CLAUDE_TIP}>
                    Estimated: {estimate}%
                  </Badge>
                )
              )}
              {status && (
                <Badge variant="secondary">
                  {STATUS_LABEL[status]}
                  {status === 'later' && item.decision?.until && <> · until {tz.dateTime(item.decision.until).split(',')[0]}</>}
                </Badge>
              )}
            </span>
          </span>
        </button>

        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          {item.rule?.action && (
            <Link to={item.rule.action.to} className={buttonVariants({ size: 'sm', variant: item.area === 'data' ? 'default' : 'outline' })}>
              {item.rule.action.label}
            </Link>
          )}
          {auth.can('editor') &&
            (!status ? (
              <>
                {/* Only records the team's decision; nothing is changed on LinkedIn or in the app */}
                <Button size="sm" variant="outline" title="Mark as completed" disabled={decide.isPending} onClick={() => set('done', 'Marked as completed')}>
                  <CheckCircle2 /> Done
                </Button>
                <Button size="sm" variant="ghost" title="Snooze for 7 days" disabled={decide.isPending} onClick={() => set('later', 'Snoozed for 7 days')}>
                  Later
                </Button>
                <Button size="sm" variant="ghost" title="Dismiss as not relevant" disabled={decide.isPending} onClick={() => set('dismissed', 'Dismissed')}>
                  Dismiss
                </Button>
              </>
            ) : (
              <Button size="sm" variant="ghost" disabled={decide.isPending} onClick={() => set(null, 'Restored')}>
                <Undo2 /> Restore
              </Button>
            ))}
        </div>

        {progress && progress.total > 0 && (
          <div className="basis-full pl-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-1.5 max-w-60 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${Math.min(100, (progress.done / progress.total) * 100)}%` }} />
              </div>
              <span className="tabular-nums">
                {fmtNumber(progress.done)} of {fmtNumber(progress.total)} {progress.label}
              </span>
            </div>
          </div>
        )}
      </div>

      {open && (
        <div className="border-t border-border/60 px-4 pt-3 pb-4 pl-10">
          {item.rule ? <RuleDetails s={item.rule} /> : <IdeaDetails {...item.idea!} accountId={accountId} />}
          {similar && (
            <div className="mt-3">
              <SimilarList s={similar} />
            </div>
          )}
          {item.decision?.decided_by && (
            <p className="mt-3 text-xs text-muted-foreground">
              {STATUS_LABEL[item.decision.status]} · by {item.decision.decided_by}
            </p>
          )}
        </div>
      )}
    </Card>
  )
}
