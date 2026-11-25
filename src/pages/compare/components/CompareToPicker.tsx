/**
 * "Compared with" on Compare periods: the familiar choice from analytics tools.
 * Previous period (default) · Same period last year · Custom dates (one day or any range).
 * Each choice shows its actual dates, so it's clear what period B is before picking it.
 */
import { useState } from 'react'
import { differenceInCalendarDays, format, parseISO, subMonths } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { Check, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export type Range = { from: string; to: string }
export type CompareMode = 'prev' | 'year' | 'custom'

const ymd = (d: Date) => format(d, 'yyyy-MM-dd')
export const rangeLabel = (r: Range) =>
  r.from === r.to ? format(parseISO(r.from), 'EEE d MMM yyyy') : `${format(parseISO(r.from), 'd MMM')} – ${format(parseISO(r.to), 'd MMM yyyy')}`
const MODE_NAME: Record<CompareMode, string> = { prev: 'Previous period', year: 'Same period last year', custom: 'Custom dates' }

export function CompareToPicker({
  mode,
  value,
  prev,
  year,
  today,
  onChange,
}: {
  mode: CompareMode
  value: Range
  prev: Range
  year: Range
  today: Date
  onChange: (mode: CompareMode, custom?: Range) => void
}) {
  const [open, setOpen] = useState(false)
  const [picking, setPicking] = useState(false)
  const [draft, setDraft] = useState<DateRange | undefined>(undefined)
  const days = draft?.from ? differenceInCalendarDays(draft.to ?? draft.from, draft.from) + 1 : 0

  const openChange = (o: boolean) => {
    setOpen(o)
    if (o) {
      setPicking(mode === 'custom')
      setDraft(mode === 'custom' ? { from: parseISO(value.from), to: parseISO(value.to) } : undefined)
    }
  }
  const choose = (m: CompareMode) => {
    onChange(m)
    setOpen(false)
  }

  const Option = ({ m, range }: { m: Exclude<CompareMode, 'custom'>; range: Range }) => (
    <button
      type="button"
      onClick={() => choose(m)}
      className={cn('flex w-full items-start gap-2 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-accent', mode === m && !picking && 'bg-accent')}
    >
      <Check className={cn('mt-0.5 size-4 shrink-0 text-primary', mode === m && !picking ? 'opacity-100' : 'opacity-0')} />
      <span>
        <span className="block text-sm font-medium">{MODE_NAME[m]}</span>
        <span className="block text-xs text-muted-foreground tabular-nums">{rangeLabel(range)}</span>
      </span>
    </button>
  )

  return (
    <Popover open={open} onOpenChange={openChange}>
      <PopoverTrigger render={<Button variant="outline" size="sm" aria-label={`Compared with: ${MODE_NAME[mode]}, ${rangeLabel(value)}`} className="h-8 gap-2 font-normal text-foreground" />}>
        <span className="font-medium">{MODE_NAME[mode]}</span>
        <span className="text-muted-foreground tabular-nums">{rangeLabel(value)}</span>
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto max-w-[calc(100vw-2rem)] p-0">
        <div className="flex flex-col sm:flex-row">
          <div className="space-y-0.5 border-b p-2 sm:w-60 sm:border-r sm:border-b-0">
            <Option m="prev" range={prev} />
            <Option m="year" range={year} />
            <button
              type="button"
              onClick={() => setPicking(true)}
              className={cn('flex w-full items-start gap-2 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-accent', picking && 'bg-accent')}
            >
              <Check className={cn('mt-0.5 size-4 shrink-0 text-primary', mode === 'custom' && picking ? 'opacity-100' : 'opacity-0')} />
              <span>
                <span className="block text-sm font-medium">Custom dates…</span>
                <span className="block text-xs text-muted-foreground">Select a start and end date</span>
              </span>
            </button>
          </div>
          {picking && (
            <div className="flex flex-col">
              <Calendar
                mode="range"
                numberOfMonths={2}
                weekStartsOn={1}
                showOutsideDays={false}
                selected={draft}
                onSelect={setDraft}
                defaultMonth={subMonths(draft?.to ?? draft?.from ?? parseISO(prev.to), 1)}
                endMonth={today}
                disabled={{ after: today }}
                className="p-3"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 border-t px-3 py-2.5">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {!draft?.from
                    ? 'Select a day, or a start and end date'
                    : days === 1
                      ? `${format(draft.from, 'EEE d MMM yyyy')} · 1 day`
                      : `${format(draft.from, 'd MMM yyyy')} – ${format(draft.to!, 'd MMM yyyy')} · ${days} days`}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={!draft?.from}
                    onClick={() => {
                      onChange('custom', { from: ymd(draft!.from!), to: ymd(draft!.to ?? draft!.from!) })
                      setOpen(false)
                    }}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
