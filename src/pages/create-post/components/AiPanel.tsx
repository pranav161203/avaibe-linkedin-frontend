import { useRef, useState } from 'react'
import { Sparkles, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { prepareForAI } from '@/lib/attachment'
import { AnalyseMode } from './AnalyseMode'
import { ChatMode } from './ChatMode'
import { VisualChip } from './VisualChip'
import { MODES } from '../constants'
import type { Draft, Visual } from '../types'
import { useGetPostAssistStatus } from '@/pages/create-post/queries'

export function AiPanel({
  accountId,
  visual,
  ask,
  draft,
  onUseText,
  onUsePoll,
}: {
  accountId: number
  visual: Visual
  ask?: string
  draft: Draft
  onUseText: (text: string) => void
  onUsePoll: (question: string, options: string[]) => void
}) {
  const [mode, setMode] = useState<(typeof MODES)[number]['value']>(ask ? 'chat' : 'analyse')
  const [include, setInclude] = useState(true)
  const prepared = useRef<{ key: string; file: File } | null>(null)
  const getAttachment = async (force = false): Promise<File | null> => {
    if (!visual || (!include && !force) || visual.kind === 'video') return null
    if (prepared.current?.key !== visual.key)
      prepared.current = {
        key: visual.key,
        file: await prepareForAI(await visual.load()),
      }
    return prepared.current.file
  }
  const status = useGetPostAssistStatus(accountId)
  return (
    <section className="rounded-[1.8rem] bg-card">
      <header className="flex flex-wrap items-start gap-3 px-6 pt-5">
        <Sparkles className="mt-0.5 size-7 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold tracking-tight">AI suggestions</h2>
          <p className="text-sm text-muted-foreground">Improve your post, get ideas and data-backed recommendations.</p>
        </div>
        <div role="tablist" aria-label="AI mode" className="flex rounded-lg bg-secondary p-1">
          {MODES.map((m) => (
            <button
              key={m.value}
              role="tab"
              type="button"
              aria-selected={mode === m.value}
              onClick={() => setMode(m.value)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                mode === m.value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <m.icon className="size-3.5" />
              {m.label}
            </button>
          ))}
        </div>
      </header>

      <div className="space-y-4 px-6 py-5">
        {status.data && !status.data.configured && (
          <div className="flex gap-3 rounded-xl border border-warn/50 bg-warn/10 px-4 py-3 text-sm">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <span>
              Claude isn’t connected yet, so the AI is switched off. It needs an Anthropic API key added to the backend (waiting on manager approval).
              Everything else on this page works without it.
            </span>
          </div>
        )}
        {visual && mode === 'chat' && <VisualChip visual={visual} include={include} setInclude={setInclude} />}
        <div className={cn(mode !== 'analyse' && 'hidden')}>
          <AnalyseMode accountId={accountId} draft={draft} visual={visual} onUseText={onUseText} onUsePoll={onUsePoll} getAttachment={getAttachment} />
        </div>
        <div className={cn(mode !== 'chat' && 'hidden')}>
          <ChatMode accountId={accountId} draft={draft} onUseText={onUseText} getAttachment={() => getAttachment()} initialText={ask} />
        </div>
      </div>
    </section>
  )
}
