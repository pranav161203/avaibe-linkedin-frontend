import { cn } from '@/lib/utils'

export function PeriodTag({ letter }: { letter: 'A' | 'B' }) {
  return (
    <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold', letter === 'A' ? 'bg-primary text-primary-foreground' : 'bg-period-b text-period-b-fg')}>
      {letter}
    </span>
  )
}
