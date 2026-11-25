import { Paperclip } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import type { Visual } from '../types'

export function VisualChip({ visual, include, setInclude }: { visual: NonNullable<Visual>; include: boolean; setInclude: (v: boolean) => void }) {
  if (visual.kind === 'video') {
    return (
      <p className="flex items-center gap-2 rounded-xl bg-muted/50 px-4 py-2.5 text-xs text-muted-foreground">
        <Paperclip className="size-3.5 shrink-0" /> The AI can’t watch videos, so it works from the text only.
      </p>
    )
  }
  return (
    <div className="rounded-xl bg-muted/50 px-4 py-2.5 text-xs">
      <label className="flex cursor-pointer items-center gap-2">
        <Checkbox checked={include} onChange={(e) => setInclude(e.target.checked)} />
        <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="min-w-0 truncate">
          The AI will also look at <span className="font-medium">{visual.name}</span>
          {visual.kind === 'pdf' ? ' (every slide)' : ''}
        </span>
      </label>
      {include && visual.kind === 'pdf' && (
        <p className="mt-1 pl-6 text-muted-foreground">
          A PDF makes each request cost more (roughly $0.05–0.15 for a 10-slide deck). In Chat it’s cached after the first message, so later messages cost much
          less.
        </p>
      )}
    </div>
  )
}
