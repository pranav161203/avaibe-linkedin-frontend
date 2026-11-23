import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Bot, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/auth'
import { useTz } from '@/context/timezone'
import type { IdeasState } from '@/lib/api'
import { useGenerateIdeas } from '@/pages/suggestions/queries'

export function GenerateBar({ accountId, state }: { accountId: number; state: IdeasState | undefined }) {
  const auth = useAuth()
  const tz = useTz()
  const generate = useGenerateIdeas(accountId)
  const [focus, setFocus] = useState('')
  if (!state) return null
  const latest = state.latest

  const meta = latest && (
    <span>
      Claude ideas from {tz.dual(latest.created_at)}
      {latest.created_by && <> · by {latest.created_by}</>}
    </span>
  )

  if (!state.configured) {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-dashed border-primary/30 bg-brand-soft/40 px-3 py-2 text-xs text-muted-foreground">
        <Bot className="size-4 text-brand-fg" />
        <span>
          Claude isn’t connected yet, so new ideas can’t be generated (
          <Link to="/settings?tab=claude" className="underline">
            Settings → Claude
          </Link>
          ).
        </span>
        {meta}
      </div>
    )
  }

  const limitReached = state.runs_today >= state.daily_limit
  const busy = generate.isPending || state.running
  const submit = (e: FormEvent) => {
    e.preventDefault()
    generate.mutate(focus.trim() || null, {
      onSuccess: (run) => toast.success(`${run.result?.ideas.length ?? 0} new ideas from Claude, sorted into each area`),
      onError: (err) => toast.error(err.message),
    })
  }

  return (
    <div className="space-y-1.5 rounded-lg px-3 py-2.5 ring-1 ring-primary/20">
      {auth.can('editor') && (
        <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            maxLength={300}
            placeholder="Optional focus, e.g. UAE school principals before next term"
            disabled={busy}
            className="h-8 flex-1"
          />
          <Button type="submit" size="sm" disabled={busy || limitReached} className="shrink-0">
            <Wand2 /> {busy ? 'Thinking… (30–90 s)' : 'Generate ideas'}
          </Button>
        </form>
      )}
      <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
        {meta}
        <span>
          One run fills every area · {state.runs_today} of {state.daily_limit} runs used today
        </span>
      </div>
    </div>
  )
}
