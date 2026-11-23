import { Bot, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CompareExplanation } from '@/lib/api'
import { CONFIDENCE } from '../constants'

export function AiWhy({ result, busy, configured, canRun, onRun }: { result?: CompareExplanation; busy: boolean; configured: boolean; canRun: boolean; onRun: () => void }) {
  return (
    <section className="rounded-[1.8rem] bg-card p-6">
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <Bot className="size-4 text-primary" /> Ask AI why
      </h3>
      {!result ? (
        <>
          <p className="text-xs text-muted-foreground">Claude reads the posts in full (hooks, wording, timing) and explains the difference. Uses one analysis.</p>
          <Button size="sm" className="mt-3" onClick={onRun} disabled={!configured || !canRun || busy}>
            <Sparkles /> {busy ? 'Reading the posts…' : 'Ask AI why'}
          </Button>
          {!configured && <p className="mt-2 text-[11px] text-muted-foreground">Switches on once Claude is connected (your manager adds the API key).</p>}
        </>
      ) : (
        <div className="space-y-3 text-sm">
          <p>{result.summary}</p>
          <ul className="space-y-1.5">
            {result.reasons.map((r) => (
              <li key={r.reason} className="flex gap-2">
                <span className="mt-0.5 shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium">{CONFIDENCE[r.confidence]}</span>
                <span className="text-[13px]">{r.reason}</span>
              </li>
            ))}
          </ul>
          {result.try_next.length > 0 && (
            <div>
              <div className="text-xs font-semibold">Try next</div>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[13px]">
                {result.try_next.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          )}
          {result.caveats.length > 0 && <p className="text-[11px] text-muted-foreground">{result.caveats.join(' ')}</p>}
        </div>
      )}
    </section>
  )
}
