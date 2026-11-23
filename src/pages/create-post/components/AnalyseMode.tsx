import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { CalendarClock, Clock, ImagePlus, Sparkles, TriangleAlert, Type } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/context/auth'
import { type PlannedFormat, type PostAssistResult, type AnalysePart } from '@/lib/api'
import { cn } from '@/lib/utils'
import { SlidePromptsView, VisualPromptView } from './MediaPrompt'
import { Block, TextBox } from './TextBlocks'
import { FORMAT_ICON, FIX_ICON, VISUAL_LABEL } from '../constants'
import { useParts } from '../hooks/useParts'
import type { Draft, Visual } from '../types'
import { useAnalysePost, useGetPostAssistStatus } from '@/pages/create-post/queries'

export function AnalyseMode({
  accountId,
  draft,
  visual,
  onUseText,
  onUsePoll,
  getAttachment,
}: {
  accountId: number
  draft: Draft
  visual: Visual
  onUseText: (text: string) => void
  onUsePoll: (question: string, options: string[]) => void
  getAttachment: (force?: boolean) => Promise<File | null>
}) {
  const auth = useAuth()
  const parts = useParts(draft, visual)
  const [picking, setPicking] = useState(false)
  const [picked, setPicked] = useState<AnalysePart[]>(['text', 'visual', 'timing', 'poll'])
  const chosen = picked.filter((f) => parts.some((o) => o.value === f))
  const toggle = (f: AnalysePart) => setPicked((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]))
  const [analysed, setAnalysed] = useState<{
    result: PostAssistResult
    caption: string
    cost: number
    format: PlannedFormat
  } | null>(null)
  const status = useGetPostAssistStatus(accountId)
  const run = useAnalysePost(accountId)
  const analyse = () =>
    run.mutate(
      {
        body: {
          account_id: accountId,
          format: draft.format,
          caption: draft.caption,
          topic: draft.topic.trim() || null,
          industry: draft.industry.trim() || null,
          cta: draft.cta.trim() || null,
          goal: draft.goal,
          focus: chosen,
          scheduled_at: draft.scheduledAt ?? null,
          details: draft.details ?? {},
          media_attached: !!visual,
        },
        getAttachment: async () => (chosen.includes('visual') ? await getAttachment(true) : null),
      },
      {
        onSuccess: (r) => {
          setAnalysed({ result: r.result, caption: draft.caption, cost: r.cost_usd, format: draft.format })
          setPicking(false)
        },
        onError: (e) => toast.error(e.message),
      },
    )
  useEffect(() => {
    setAnalysed(null)
  }, [accountId])

  const configured = status.data?.configured
  const left = status.data ? status.data.daily_limit - status.data.runs_today : null
  const stale = analysed && analysed.caption !== draft.caption
  const r = analysed?.result
  const blocked = !configured || !auth.can('editor') || left === 0

  return (
    <div className="space-y-4">
      {!picking ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => setPicking(true)} disabled={blocked || run.isPending}>
            <Sparkles /> {run.isPending ? 'Analysing…' : analysed ? 'Analyse again' : 'Analyse'}
          </Button>
          <span className="text-xs text-muted-foreground">
            {left != null && configured ? `${left} of ${status.data!.daily_limit} analyses left today` : ''}
          </span>
        </div>
      ) : (
        <div className="rounded-xl ring-1 ring-border">
          <div className="px-4 pt-3 pb-1 text-sm font-semibold">What should the AI look at?</div>
          <ul className="divide-y">
            {parts.map((o) => {
              const on = chosen.includes(o.value)
              return (
                <li key={o.value}>
                  <label className="flex cursor-pointer items-start gap-3 px-4 py-2.5 hover:bg-muted/50">
                    <input type="checkbox" className="mt-1 accent-[var(--primary)]" checked={on} onChange={() => toggle(o.value)} />
                    <o.icon className={cn('mt-0.5 size-4 shrink-0', on ? 'text-primary' : 'text-muted-foreground')} />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{o.label}</span>
                      <span className="block text-xs text-muted-foreground">{o.detail}</span>
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
          <div className="flex flex-wrap items-center gap-2 border-t px-4 py-3">
            <span className="mr-auto text-xs text-muted-foreground">
              {!draft.caption.trim()
                ? 'Write some post text first.'
                : !chosen.length
                  ? 'Pick at least one.'
                  : left != null && configured
                    ? `Uses 1 of ${left} analyses left today`
                    : ''}
            </span>
            <Button variant="ghost" onClick={() => setPicking(false)} disabled={run.isPending}>
              Cancel
            </Button>
            <Button onClick={analyse} disabled={blocked || !draft.caption.trim() || !chosen.length || run.isPending}>
              <Sparkles /> {run.isPending ? 'Analysing…' : 'Analyse'}
            </Button>
          </div>
        </div>
      )}

      {run.isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      ) : !r ? (
        <div className="rounded-xl border border-dashed px-6 py-10 text-center">
          <Sparkles className="mx-auto mb-3 size-6 text-primary/60" />
          <p className="text-sm font-medium">Nothing is sent to the AI until you click Analyse</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
            Pick the parts of the post to check: the text, the {VISUAL_LABEL[draft.format]?.toLowerCase() ?? 'visual'}, the posting time and more. Suggestions
            for each appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {stale && (
            <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
              You’ve edited the text since this analysis. Click “Analyse again” to refresh it.
            </p>
          )}

          <>
            {r.text && (
              <Block
                icon={Type}
                title="Post text"
                action={
                  <Button variant="outline" size="sm" onClick={() => onUseText(r.text!.improved_text)}>
                    Use this
                  </Button>
                }
              >
                <TextBox text={r.text.improved_text} />
                {r.text.what_changed.length > 0 && (
                  <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
                    {r.text.what_changed.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                )}
                {r.text.quick_fixes.length > 0 && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    {r.text.quick_fixes.map((f) => {
                      const Icon = FIX_ICON[f.kind]
                      return (
                        <button
                          key={f.kind}
                          type="button"
                          onClick={() => onUseText(f.text)}
                          title="Replace the post text with this version"
                          className="flex items-start gap-2.5 rounded-xl p-3 text-left ring-1 ring-border transition-colors hover:bg-muted"
                        >
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Icon className="size-3.5" />
                          </span>
                          <span className="text-xs leading-snug font-medium">{f.title}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </Block>
            )}

            {r.visual && (
              <Block icon={FORMAT_ICON[analysed!.format] ?? ImagePlus} title={VISUAL_LABEL[analysed!.format] ?? 'Visual'}>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {r.visual.notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
                {(r.visual.prompt || r.visual.slide_prompts) && (
                  <div className="mt-3">
                    {r.visual.prompt && (analysed!.format === 'image' || analysed!.format === 'video') && (
                      <VisualPromptView kind={analysed!.format} prompt={r.visual.prompt} />
                    )}
                    {r.visual.slide_prompts && <SlidePromptsView prompts={r.visual.slide_prompts} />}
                  </div>
                )}
              </Block>
            )}

            {r.timing && (
              <Block icon={CalendarClock} title="Posting time">
                <p className="text-sm">{r.timing.verdict}</p>
                {r.timing.suggested_time && (
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    <Clock className="size-3.5" /> Try {r.timing.suggested_time} (UAE)
                  </p>
                )}
                {r.timing.suggestions.length > 0 && (
                  <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
                    {r.timing.suggestions.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                )}
              </Block>
            )}

            {r.poll && (
              <Block
                icon={FORMAT_ICON.poll}
                title="Poll"
                action={
                  <Button variant="outline" size="sm" onClick={() => onUsePoll(r.poll!.question, r.poll!.options)}>
                    Use this
                  </Button>
                }
              >
                <p className="text-sm font-medium">{r.poll.question}</p>
                <ul className="mt-2 space-y-1">
                  {r.poll.options.map((o) => (
                    <li key={o} className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-border">
                      {o}
                    </li>
                  ))}
                </ul>
                {r.poll.notes.length > 0 && (
                  <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
                    {r.poll.notes.map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                )}
              </Block>
            )}

            {r.cautions.length > 0 && (
              <div className="flex gap-3 rounded-xl border border-warn/50 bg-warn/10 px-4 py-3 text-sm">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                <ul className="space-y-1">
                  {r.cautions.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </>

          <p className="text-right text-[11px] text-muted-foreground">This analysis cost about ${analysed!.cost.toFixed(3)}</p>
        </div>
      )}
    </div>
  )
}
