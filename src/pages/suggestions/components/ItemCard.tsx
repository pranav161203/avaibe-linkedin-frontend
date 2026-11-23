import { useContext, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { CheckCircle2, ChevronDown, ChevronRight, Sparkles, Undo2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/context/auth'
import { useTz } from '@/context/timezone'
import type { Item } from '@/hooks/suggestion-items'
import type { DecisionStatus } from '@/lib/api'
import { fmtNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import { RuleDetails, IdeaDetails } from './ItemDetails'
import { SimilarLine, SimilarList } from './SimilarPosts'
import { PRIORITY, IDEA_TYPE, STATUS_LABEL } from '../constants'
import { SimilarCtx } from '../context/similar'
import { useSaveDecision } from '@/pages/suggestions/queries'

export function ItemCard({ item, accountId, highlight, muted }: { item: Item; accountId: number; highlight?: boolean; muted?: boolean }) {
  const [open, setOpen] = useState(false)
  const auth = useAuth()
  const tz = useTz()
  const decide = useSaveDecision(accountId)
  const status = item.decision?.status
  const conf = item.rule ? item.rule.confidence.level : item.idea!.idea.confidence
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
              {item.rule ? (
                <>
                  <Badge variant="outline" className={PRIORITY[item.rule.priority].cls}>
                    {PRIORITY[item.rule.priority].label}
                  </Badge>
                  <Badge variant="secondary">{item.rule.category === 'page' ? 'Page setup' : item.rule.category === 'lead' ? 'From your Leads log' : 'From your data'}</Badge>
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
              <Badge variant="outline" className="capitalize">{conf} confidence</Badge>
              {status && status !== 'doing' && (
                <Badge variant="secondary">
                  {STATUS_LABEL[status]}
                  {status === 'later' && item.decision?.until && <> · back {tz.dateTime(item.decision.until).split(',')[0]}</>}
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
                <Button size="sm" variant="outline" disabled={decide.isPending} onClick={() => set('doing', 'Moved to In progress')}>
                  Do it
                </Button>
                <Button size="sm" variant="ghost" disabled={decide.isPending} onClick={() => set('later', 'Hidden for a week')}>
                  Later
                </Button>
                <Button size="sm" variant="ghost" disabled={decide.isPending} onClick={() => set('dismissed', 'Dismissed')}>
                  Dismiss
                </Button>
              </>
            ) : status === 'doing' ? (
              <>
                <Button size="sm" disabled={decide.isPending} onClick={() => set('done', 'Marked done')}>
                  <CheckCircle2 /> Mark done
                </Button>
                <Button size="icon-sm" variant="ghost" aria-label="Undo" title="Undo" disabled={decide.isPending} onClick={() => set(null, 'Moved back')}>
                  <Undo2 />
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
