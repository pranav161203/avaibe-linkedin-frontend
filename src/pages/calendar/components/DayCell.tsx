import { format, parseISO } from 'date-fns'
import { Clock } from 'lucide-react'
import type { CalendarItem, CalendarPlanned, CalendarPost } from '@/lib/api'
import { cn } from '@/lib/utils'
import { UAE_WEEKEND } from '@/lib/timing-advice'
import { KIND_META } from '../constants'
import { postFormat, plannedFormat, plannedStatus } from '../utils'

export function DayCell({
  day,
  idx,
  inMonth,
  isToday,
  isPast,
  selected,
  onSelect,
  posts,
  planned,
  items,
  accountId,
  hint,
  allItems,
}: {
  day: string
  idx: number
  inMonth: boolean
  isToday: boolean
  isPast: boolean
  selected: boolean
  onSelect: () => void
  posts: CalendarPost[]
  planned: CalendarPlanned[]
  items: CalendarItem[]
  accountId: number
  hint?: string
  allItems: CalendarItem[]
}) {
  const d = parseISO(day)
  const weekend = UAE_WEEKEND.has(d.getDay())
  const uaeHoliday = allItems.some((i) => i.kind === 'uae_holiday')
  const periods = items.filter((i) => i.start !== i.end && i.kind !== 'uae_holiday')
  const chips = items.filter((i) => !periods.includes(i))
  const own = posts.filter((p) => p.account_id === accountId)
  const entries: React.ReactNode[] = [
    ...chips.map((i) => (
      <div key={`i-${i.title}-${i.start}`} className="flex items-center gap-1 truncate text-[11px] leading-4" title={i.title}>
        <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: KIND_META[i.kind].color }} />
        <span className="truncate">
          {i.title}
          {i.status === 'expected' && <span className="text-muted-foreground"> (exp.)</span>}
        </span>
      </div>
    )),
    ...posts.map((p) => {
      const mine = p.account_id === accountId
      return (
        <div
          key={`p-${p.id}`}
          title={`${p.account_name}: ${p.title}`}
          className={cn(
            'flex items-center gap-1 truncate rounded px-1 text-[11px] leading-4',
            mine ? 'bg-primary/10 text-foreground' : 'border border-primary/40 text-muted-foreground',
          )}
        >
          <span className="shrink-0 tabular-nums">{p.time ?? '·'}</span>
          <span className="truncate">{mine ? postFormat(p.format) : p.account_name.split(' ')[0]}</span>
        </div>
      )
    }),
    ...planned.map((p) => (
      <div
        key={`pl-${p.id}`}
        title={`Planned (${plannedStatus(p.status)}): ${p.title}`}
        className="flex items-center gap-1 truncate rounded border border-dashed border-foreground/40 px-1 text-[11px] leading-4"
      >
        <span className="shrink-0 tabular-nums">{p.time}</span>
        <span className="truncate">{plannedFormat(p.format)}</span>
      </div>
    )),
  ]
  const MAX = 3
  const showHint = hint && !isPast && !weekend && !uaeHoliday && inMonth
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`${format(d, 'EEEE d MMMM')}: ${own.length} posts, ${planned.length} planned${allItems.length ? `, ${allItems.map((i) => i.title).join(', ')}` : ''}`}
      className={cn(
        'relative flex min-h-[104px] flex-col gap-0.5 border-b border-r p-1.5 pt-2 text-left align-top outline-none transition-colors hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
        (idx + 1) % 7 === 0 && 'border-r-0',
        !inMonth && 'bg-muted/30 text-muted-foreground',
        inMonth && (weekend || uaeHoliday) && 'bg-muted/40',
        selected && 'bg-accent/60 ring-2 ring-primary ring-inset',
      )}
    >
      {periods.length > 0 && (
        <div className="absolute inset-x-1 top-1 flex h-[3px] gap-px overflow-hidden rounded-full">
          {periods.map((p) => (
            <span key={p.title + p.start} className="flex-1 opacity-70" style={{ backgroundColor: KIND_META[p.kind].color }} title={p.title} />
          ))}
        </div>
      )}
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'inline-flex size-6 items-center justify-center rounded-full text-xs tabular-nums',
            isToday && 'bg-primary font-semibold text-primary-foreground',
            !isToday && inMonth && 'font-medium',
          )}
        >
          {d.getDate()}
        </span>
        {own.length >= 2 && <span className="rounded-full bg-warn/15 px-1.5 text-[10px] text-warn-fg">{own.length} posts</span>}
      </div>
      {periods.length > 0 && inMonth && (periods.some((p) => p.start === day) || d.getDay() === 1) && (
        <div className="truncate text-[10px] leading-3 font-medium" style={{ color: KIND_META[periods[0].kind].color }}>
          {periods.map((p) => p.title).join(' · ')}
        </div>
      )}
      {entries.slice(0, MAX)}
      {entries.length > MAX && <div className="text-[11px] text-muted-foreground">+{entries.length - MAX} more</div>}
      {showHint && (
        <div className="mt-auto flex items-center gap-1 text-[10px] text-muted-foreground" title="Recommended time based on past performance">
          <Clock className="size-3" /> {hint}
        </div>
      )}
    </button>
  )
}
