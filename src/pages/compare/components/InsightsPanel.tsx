import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Lightbulb, Sparkles, TriangleAlert } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CAUSE_LABEL, EVIDENCE_LABEL, type Evidence, type Finding, type NextStep } from '../utils/insights'

const PILL: Record<Evidence, string> = {
  likely: 'bg-primary/12 text-primary ring-primary/30',
  possible: 'bg-muted text-foreground ring-border',
  unknown: 'bg-card text-muted-foreground ring-border ring-dashed',
  unlikely: 'bg-card text-muted-foreground ring-border',
}

export function InsightsPanel({
  headline,
  subline,
  findings,
  same,
  next,
  caution,
  ai,
  wording = 'helped',
}: {
  headline: string
  subline?: string | null
  findings: Finding[]
  same?: string[]
  next: NextStep[]
  caution?: string | null
  ai?: ReactNode
  wording?: 'helped' | 'cause'
}) {
  const LABEL = wording === 'cause' ? CAUSE_LABEL : EVIDENCE_LABEL
  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="rounded-[1.8rem] bg-card p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="size-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg leading-snug font-semibold">{headline}</h2>
            {subline && <p className="mt-1 text-sm text-muted-foreground">{subline}</p>}
          </div>
        </div>

        <h3 className="mt-6 mb-3 text-sm font-semibold">What made the difference</h3>
        {findings.length ? (
          <ol className="space-y-3">
            {findings.map((f) => (
              <li key={f.key} className={cn('rounded-xl p-4 ring-1 ring-border', f.evidence === 'unlikely' && 'opacity-70')}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm">
                    <span className="font-semibold">{f.label}:</span> {f.text}
                  </div>
                  <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1', PILL[f.evidence])}>{LABEL[f.evidence]}</span>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">{f.detail}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">Nothing that differs could be checked against your history.</p>
        )}
        {same && same.length > 0 && <p className="mt-3 text-xs text-muted-foreground">The same for all: {same.join(', ').toLowerCase()}, so these didn’t cause the difference.</p>}
        {caution && (
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-warn/10 px-3 py-2 text-xs ring-1 ring-warn/40">
            <TriangleAlert className="mt-px size-3.5 shrink-0" /> {caution}
          </p>
        )}
        <p className="mt-4 text-[11px] text-muted-foreground">
          “Likely” means your own past posts back it up; it shows a pattern, not proof. Labels compare each choice with your typical post at the same age.
        </p>
      </section>

      <div className="space-y-4">
        <section className="rounded-[1.8rem] bg-card p-6">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Lightbulb className="size-4 text-primary" /> What to try next
          </h3>
          <ul className="space-y-3">
            {next.map((n) => {
              const qs = new URLSearchParams()
              if (n.format) qs.set('format', n.format)
              if (n.topic) qs.set('topic', n.topic)
              return (
                <li key={n.text} className="text-sm">
                  <p>{n.text}</p>
                  {(n.format || n.topic) && (
                    <Link to={`/create?${qs}`} className={cn(buttonVariants({ variant: 'outline', size: 'xs' }), 'mt-2')}>
                      Start post <ArrowRight />
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
        {ai}
      </div>
    </div>
  )
}
