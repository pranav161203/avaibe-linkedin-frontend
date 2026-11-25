import { useState } from 'react'
import { differenceInCalendarDays, endOfMonth, format, parseISO, startOfMonth, subMonths } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { CalendarDays, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

/** A time range like LinkedIn's: a preset, or custom From/To dates (UAE dates, both inclusive). */
export interface TimeRange {
  preset: string // '7' | '30' | '90' | '365' | 'all' | 'custom'
  from?: string // YYYY-MM-DD
  to?: string
}

const ROLLING = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: '365', label: 'Last 12 months' },
]

/** What the analytics endpoints take: { days } for a preset, { from, to } for custom dates */
export function rangeQuery(r: TimeRange): { days?: number; from?: string; to?: string } {
  if (r.preset === 'custom') return { from: r.from || undefined, to: r.to || undefined }
  if (r.preset === 'all') return {}
  return { days: Number(r.preset) }
}

const ymd = (d: Date) => format(d, 'yyyy-MM-dd')
const uaeDate = (iso: string) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai' }).format(new Date(iso))

/** Client-side check for lists already loaded (e.g. the Posts table) */
export function inRange(publishedIso: string, r: TimeRange): boolean {
  if (r.preset === 'all') return true
  if (r.preset === 'custom') {
    const d = uaeDate(publishedIso)
    return (!r.from || d >= r.from) && (!r.to || d <= r.to)
  }
  return new Date(publishedIso).getTime() >= Date.now() - Number(r.preset) * 86_400_000
}

function label(r: TimeRange): string {
  if (r.preset === 'all') return 'All time'
  if (r.preset !== 'custom') return ROLLING.find((p) => p.value === r.preset)?.label ?? 'Last 90 days'
  if (!r.from && !r.to) return 'Select dates'
  const f = r.from ? parseISO(r.from) : null
  const t = r.to ? parseISO(r.to) : null
  if (f && t && r.from === r.to) return format(f, 'EEE d MMM yyyy')
  if (f && t) {
    const sameYear = f.getFullYear() === t.getFullYear()
    return `${format(f, sameYear ? 'd MMM' : 'd MMM yyyy')} – ${format(t, 'd MMM yyyy')}`
  }
  return f ? `From ${format(f, 'd MMM yyyy')}` : `Until ${format(t!, 'd MMM yyyy')}`
}

/** bare: just the button, without the "Time range" text beside it (the button itself says the period).
    minDays: a custom range shorter than this can't be applied (e.g. comparisons need a week or more). */
export function TimeRangePicker({ value, onChange, bare = false, minDays = 1 }: { value: TimeRange; onChange: (r: TimeRange) => void; bare?: boolean; minDays?: number }) {
  const [open, setOpen] = useState(false)
  const today = new Date()
  // Dates being picked in the calendar, applied only on "Apply"
  const [draft, setDraft] = useState<DateRange | undefined>(undefined)

  const draftDays = draft?.from ? differenceInCalendarDays(draft.to ?? draft.from, draft.from) + 1 : 0
  const tooShort = !!draft?.from && draftDays < minDays

  const openChange = (o: boolean) => {
    setOpen(o)
    if (o) setDraft(value.preset === 'custom' && value.from ? { from: parseISO(value.from), to: value.to ? parseISO(value.to) : undefined } : undefined)
  }
  const choose = (r: TimeRange) => {
    onChange(r)
    setOpen(false)
  }
  const month = (offset: number): TimeRange => {
    const m = subMonths(today, offset)
    const end = offset === 0 ? today : endOfMonth(m)
    return { preset: 'custom', from: ymd(startOfMonth(m)), to: ymd(end) }
  }
  const quick: { label: string; r: TimeRange }[] = [
    ...ROLLING.map((p) => ({ label: p.label, r: { preset: p.value } })),
    { label: 'This month', r: month(0) },
    { label: 'Last month', r: month(1) },
    { label: 'All time', r: { preset: 'all' } },
  ]
  const isActive = (r: TimeRange) =>
    r.preset === value.preset && (r.preset !== 'custom' || (r.from === value.from && r.to === value.to))

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {!bare && <span>Time range</span>}
      <Popover open={open} onOpenChange={openChange}>
        <PopoverTrigger render={<Button variant="outline" size="sm" aria-label={bare ? `Time range: ${label(value)}` : undefined} className="h-8 gap-2 font-normal text-foreground" />}>
          <CalendarDays className="size-4 text-muted-foreground" />
          {label(value)}
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto max-w-[calc(100vw-2rem)] p-0">
          <div className="flex flex-col sm:flex-row">
            {/* Quick choices */}
            <div className="flex flex-wrap gap-1 border-b p-2 sm:w-40 sm:flex-col sm:flex-nowrap sm:border-r sm:border-b-0">
              {quick.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => choose(q.r)}
                  className={cn(
                    'rounded-md px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                    isActive(q.r) ? 'bg-accent font-medium text-accent-foreground' : 'text-foreground',
                  )}
                >
                  {q.label}
                </button>
              ))}
            </div>
            {/* Calendar: pick a start and an end day */}
            <div className="flex flex-col">
              <Calendar
                mode="range"
                numberOfMonths={2}
                weekStartsOn={1}
                selected={draft}
                onSelect={setDraft}
                // Each month shows only its own days, so a range never appears twice
                showOutsideDays={false}
                // Show the month before the range's end and the end month itself; never page into the future
                defaultMonth={subMonths(draft?.to ?? draft?.from ?? today, 1)}
                endMonth={today}
                disabled={{ after: today }}
                className="p-3"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 border-t px-3 py-2.5">
                <span className={cn('text-xs tabular-nums', tooShort ? 'text-bad-fg' : 'text-muted-foreground')}>
                  {!draft?.from
                    ? 'Select a date or a date range'
                    : !draft.to
                      ? `${format(draft.from, 'EEE d MMM yyyy')} · 1 day`
                      : `${format(draft.from, 'd MMM yyyy')} – ${format(draft.to, 'd MMM yyyy')} · ${draftDays} day${draftDays === 1 ? '' : 's'}${tooShort ? ` (minimum ${minDays} days)` : ''}`}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={!draft?.from || tooShort}
                    onClick={() => choose({ preset: 'custom', from: ymd(draft!.from!), to: ymd(draft!.to ?? draft!.from!) })}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
