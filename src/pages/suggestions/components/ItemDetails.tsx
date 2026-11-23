import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowDownRight, ArrowUpRight, CheckCircle2, CircleAlert, Clock3, Copy, FilePlus2, Lightbulb, type LucideIcon, Users } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { useAuth } from '@/context/auth'
import type { Idea, Suggestion } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useCreateDraftFromIdea } from '@/pages/suggestions/queries'

export function RuleDetails({ s }: { s: Suggestion }) {
  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <Fact icon={Clock3} label="When" value={s.when} />
        <Fact icon={Users} label="Who it targets" value={s.who} />
      </div>
      <Why items={s.why} />
      <BoostRisk boost={s.boost} risk={s.risk} />
      <Footer confidence={s.confidence.reason} measure={s.measure} />
    </div>
  )
}

export function IdeaDetails({ idea, runId, index, accountId }: { idea: Idea; runId: number; index: number; accountId: number }) {
  const auth = useAuth()
  const toDraft = useCreateDraftFromIdea(accountId)
  const [draftId, setDraftId] = useState<number | null>(null)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(idea.draft_caption ?? '')
      toast.success('Caption copied')
    } catch {
      toast.error('Couldn’t copy. Select the text instead.')
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm">{idea.what}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <Fact icon={Clock3} label="When" value={idea.when} />
        <Fact icon={Users} label="Who it targets" value={idea.who} />
      </div>
      <div className="flex gap-2 rounded-lg bg-background/40 px-3 py-2 text-sm ring-1 ring-border">
        <Lightbulb className="mt-0.5 size-4 shrink-0 text-brand-fg" />
        <div>
          <span className="text-[11px] tracking-wide text-muted-foreground uppercase">What’s new about it · </span>
          {idea.novelty}
        </div>
      </div>
      <Why items={idea.why} />
      <BoostRisk boost={idea.boost} risk={idea.risk} />
      {idea.draft_caption && (
        <div className="rounded-lg border border-border/70 p-3">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Draft caption (edit before use)</span>
            <div className="flex gap-1">
              <Button size="xs" variant="ghost" onClick={copy}>
                <Copy /> Copy
              </Button>
              {auth.can('editor') &&
                (draftId ? (
                  <Link to="/publishing" className={buttonVariants({ size: 'xs', variant: 'outline' })}>
                    Open in Publishing
                  </Link>
                ) : (
                  <Button
                    size="xs"
                    disabled={toDraft.isPending}
                    onClick={() =>
                      toDraft.mutate(
                        { runId, index },
                        {
                          onSuccess: (d) => {
                            setDraftId(d.planned_id)
                            toast.success('Draft added to Publishing. It still needs editing and approval.')
                          },
                          onError: (e) => toast.error(e.message),
                        },
                      )
                    }
                  >
                    <FilePlus2 /> Create draft
                  </Button>
                ))}
            </div>
          </div>
          <p className="text-sm whitespace-pre-line">{idea.draft_caption}</p>
        </div>
      )}
      <Footer confidence={idea.confidence_reason} measure={idea.measure} />
    </div>
  )
}

function Why({ items }: { items: string[] }) {
  return (
    <div className="rounded-lg bg-brand-soft p-3 ring-1 ring-primary/15">
      <div className="mb-1.5 text-xs font-semibold tracking-wide text-brand-fg uppercase">Why: the evidence</div>
      <ul className="space-y-1.5 text-sm">
        {items.map((w, i) => {
          const assumption = /^assumption:/i.test(w.trim())
          return (
            <li key={i} className="flex gap-2">
              {assumption ? <CircleAlert className="mt-0.5 size-4 shrink-0 text-serious-fg" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-fg" />}
              <span className={cn(assumption && 'text-muted-foreground italic')}>{w}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function BoostRisk({ boost, risk }: { boost: string; risk: string }) {
  return (
    <div className="grid gap-2 md:grid-cols-2">
      <div className="rounded-lg border border-good/30 bg-good/5 p-3">
        <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-good-fg uppercase">
          <ArrowUpRight className="size-4" /> How it can boost outreach
        </div>
        <p className="text-sm">{boost}</p>
      </div>
      <div className="rounded-lg border border-serious/35 bg-serious/5 p-3">
        <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-serious-fg uppercase">
          <ArrowDownRight className="size-4" /> How it could lower outreach
        </div>
        <p className="text-sm">{risk}</p>
      </div>
    </div>
  )
}

function Footer({ confidence, measure }: { confidence: string; measure: { metric: string; period: string; target: string } }) {
  return (
    <div className="grid gap-1 border-t border-border/60 pt-2 text-xs text-muted-foreground sm:grid-cols-2 sm:gap-6">
      <div>
        <span className="font-medium text-foreground">Confidence: </span>
        {confidence}
      </div>
      <div>
        <span className="font-medium text-foreground">How to measure: </span>
        {measure.metric} · {measure.period} · target: {measure.target}
      </div>
    </div>
  )
}

function Fact({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-background/40 px-3 py-2 ring-1 ring-border">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div>
        <div className="text-[11px] tracking-wide text-muted-foreground uppercase">{label}</div>
        <div className="text-sm">{value}</div>
      </div>
    </div>
  )
}
