/**
 * Date and time picker in the app's style (replaces the browser's datetime-local box).
 * Value is the same "YYYY-MM-DDTHH:mm" string a datetime-local input uses, in the chosen time zone; '' = not set.
 * Left: a month calendar. Right: time of day in 15-minute steps, from 06:00 to 23:45.
 */
import { useEffect, useRef, useState } from 'react'
import { format, parse } from 'date-fns'
import { CalendarClock, ChevronDown, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const TIMES = Array.from({ length: (24 - 6) * 4 }, (_, i) => {
  const m = 6 * 60 + i * 15
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
})

export function DateTimePicker({
  value,
  onChange,
  placeholder = 'Select date and time',
  zoneLabel,
  minDate,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  zoneLabel?: string
  minDate?: Date
}) {
  const [open, setOpen] = useState(false)
  const date = value ? parse(value.slice(0, 10), 'yyyy-MM-dd', new Date()) : undefined
  const time = value ? value.slice(11, 16) : ''
  const list = useRef<HTMLDivElement>(null)

  // Open on the chosen time (or 10:00) so it's visible without scrolling
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => list.current?.querySelector<HTMLElement>(`[data-time="${time || '10:00'}"]`)?.scrollIntoView({ block: 'center' }), 30)
    return () => clearTimeout(t)
  }, [open, time])

  const set = (d: Date | undefined, t: string) => onChange(d ? `${format(d, 'yyyy-MM-dd')}T${t || '10:00'}` : '')
  // Times not on the 15-minute list (e.g. 10:20 from a suggestion) still show, in order
  const times = time && !TIMES.includes(time) ? [...TIMES, time].sort() : TIMES

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className={cn(
              'flex h-10 w-full items-center gap-2 rounded-xl border border-input bg-card px-3 text-left text-sm shadow-xs transition-colors hover:bg-accent/50',
              'focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none',
            )}
          />
        }
      >
        <CalendarClock className="size-4 shrink-0 text-muted-foreground" />
        {date ? (
          <span className="min-w-0 flex-1 truncate tabular-nums">
            {format(date, date.getFullYear() === new Date().getFullYear() ? 'EEE d MMM' : 'EEE d MMM yyyy')} · <b className="font-semibold">{time}</b>
          </span>
        ) : (
          <span className="flex-1 text-muted-foreground">{placeholder}</span>
        )}
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto max-w-[calc(100vw-2rem)] p-0">
        <div className="flex flex-col sm:flex-row">
          <Calendar
            mode="single"
            weekStartsOn={1}
            showOutsideDays={false}
            selected={date}
            defaultMonth={date ?? minDate ?? new Date()}
            onSelect={(d) => set(d, time)}
            disabled={minDate ? { before: minDate } : undefined}
            className="p-3"
          />
          <div className="flex flex-col border-t sm:w-32 sm:border-t-0 sm:border-l">
            <div className="px-3 pt-3 pb-1.5 text-xs font-medium text-muted-foreground">Time{zoneLabel && ` (${zoneLabel})`}</div>
            <div ref={list} className="flex max-h-40 flex-row gap-1 overflow-x-auto px-2 pb-2 sm:max-h-[17rem] sm:flex-col sm:overflow-x-visible sm:overflow-y-auto">
              {times.map((t) => (
                <button
                  key={t}
                  type="button"
                  data-time={t}
                  disabled={!date}
                  onClick={() => set(date, t)}
                  className={cn(
                    'shrink-0 rounded-lg px-2.5 py-1.5 text-sm tabular-nums transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                    t === time ? 'bg-primary font-semibold text-primary-foreground' : 'hover:bg-accent',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 border-t px-3 py-2">
          <Button size="xs" variant="ghost" disabled={!value} onClick={() => onChange('')}>
            <X /> Clear
          </Button>
          <span className="text-xs text-muted-foreground">{date ? (time ? 'Pick another day or time, or close' : 'Now pick a time') : 'Pick a day first'}</span>
          <Button size="xs" onClick={() => setOpen(false)}>
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
