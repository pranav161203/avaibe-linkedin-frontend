import { Bot, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CompareExplanation } from '@/lib/api'
import { CLAUDE_TIP } from '@/lib/format'

export function AiWhy({ result, busy, configured, canRun, onRun }: { result?: CompareExplanation; busy: boolean; configured: boolean; canRun: boolean; onRun: () => void }) {
  return (
    <section className="rounded-[1.8rem] bg-card p-6">
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <Bot className="size-4 text-primary" /> Ask AI why
      </h3>
      {!result ? (
        <>
          <p className="text-xs text-muted-foreground">Claude analyses the full posts, including hooks, wording and timing, and explains the difference. Uses one AI run.</p>
          <Button size="sm" className="mt-3" onClick={onRun} disabled={!configured || !canRun || busy}>
            <Sparkles /> {busy ? 'Analysing…' : 'Ask AI why'}
          </Button>
          {!configured && <p className="mt-2 text-[11px] text-muted-foreground">Available once Claude is configured.</p>}
        </>
      ) : (
        <div className="space-y-3 text-sm">
          <p>{result.summary}</p>
          <ul className="space-y-1.5">
            {result.reasons.map((r) => (
              <li key={r.reason} className="flex gap-2">
                {r.confidence_pct != null && (
                  <span title={CLAUDE_TIP} className="mt-0.5 shrink-0 cursor-help rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">
                    {r.confidence_pct}%
                  </span>
                )}
                <span className="text-[13px]">{r.reason}</span>
              </li>
            ))}
          </ul>
          {result.try_next.length > 0 && (
            <div>
              <div className="text-xs font-semibold">Recommendations</div>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[13px]">
                {result.try_next.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          )}
          {result.caveats.length > 0 && <p className="text-[11px] text-muted-foreground">{result.caveats.join(' ')}</p>}
          <p className="text-[11px] text-muted-foreground">Percentages are Claude’s own estimates, not measurements.</p>
        </div>
      )}
    </section>
  )
}
