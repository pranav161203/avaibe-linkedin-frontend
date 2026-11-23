import type { LeadStage } from '@/lib/api'
import { cn } from '@/lib/utils'
import { STAGE_LABEL } from '../constants'

export function StageTag({ stage }: { stage: LeadStage }) {
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-xs whitespace-nowrap',
        stage === 'won' ? 'bg-good/10 text-good-fg' : stage === 'lost' ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary',
      )}
    >
      {STAGE_LABEL[stage]}
    </span>
  )
}
