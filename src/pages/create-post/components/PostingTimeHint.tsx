import { addDays, format, parseISO } from 'date-fns'
import { Clock } from 'lucide-react'
import { todayUae, ymd } from '@/components/period'
import { isoToZonedInput, UAE, zonedInputToIso } from '@/context/timezone'
import { dayAdvice, proven, SLOT_START, UAE_WEEKEND } from '@/lib/timing-advice'
import { cn } from '@/lib/utils'
import { useGetCalendar } from '@/pages/calendar/queries'

const TONE = { good: 'bg-good', note: 'bg-muted-foreground/50', quiet: 'bg-muted-foreground/25' } as const

export function PostingTimeHint({
  accountId,
  scheduled,
  zone,
  onPick,
}: {
  accountId: number
  scheduled: string
  zone: string
  onPick: (zonedInput: string) => void
}) {
  const today = todayUae()
  const uaeInput = scheduled ? isoToZonedInput(zonedInputToIso(scheduled, zone), UAE) : null
  const day = uaeInput ? uaeInput.slice(0, 10) : ymd(addDays(parseISO(today), 1))
  const { data, isLoading } = useGetCalendar(accountId, day, day, { staleTime: 5 * 60_000 })

  if (isLoading || !data) return <div className="h-16 animate-pulse rounded-lg bg-muted/50" />

  const items = data.items.filter((i) => i.start <= day && day <= i.end)
  const isPast = day < today
  const lines = dayAdvice(day, items, data, isPast)
  const adv = data.timing.ready ? data.timing.days[day] : undefined
  const offDay = items.some((i) => i.kind === 'uae_holiday') || UAE_WEEKEND.has(parseISO(day).getDay())
  const isProven = !!adv && proven(data, adv)
  const chosenTime = uaeInput?.slice(11, 16)

  const pick = (start: string) => onPick(isoToZonedInput(zonedInputToIso(`${day}T${start}`, UAE), zone))
  const slots = !isPast && adv && !offDay
    ? [
        { slot: adv.best_slot, label: isProven ? 'best time' : 'slightly ahead, not proven' },
        ...(adv.test_slot && adv.test_slot !== adv.best_slot ? [{ slot: adv.test_slot, label: 'worth testing' }] : []),
      ].filter((s) => SLOT_START[s.slot])
    : []
  const inSlot = (slot: string) => {
    if (!chosenTime || !SLOT_START[slot]) return false
    const [h] = SLOT_START[slot].split(':').map(Number)
    const ch = Number(chosenTime.slice(0, 2))
    return ch >= h && ch < h + 2
  }

  return (
    <div className="rounded-lg border bg-muted/30 p-3 text-xs">
      <div className="mb-1.5 flex items-center gap-1.5 font-medium text-foreground">
        <Clock className="size-3.5 text-muted-foreground" />
        Posting time for {format(parseISO(day), 'EEE d MMM')}
        {!scheduled && <span className="font-normal text-muted-foreground">(tomorrow; pick a date to check another day)</span>}
      </div>
      {lines.length > 0 && (
        <ul className="space-y-1">
          {lines.map((l) => (
            <li key={l.text} className={cn('flex gap-2', l.tone === 'quiet' ? 'text-muted-foreground' : 'text-foreground')}>
              <span className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', TONE[l.tone])} aria-hidden />
              {l.text}
            </li>
          ))}
        </ul>
      )}
      {slots.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {slots.map((s) =>
            inSlot(s.slot) ? (
              <span key={s.slot} className="rounded-full bg-good/15 px-2.5 py-1 font-medium text-good-fg">
                ✓ In the {s.label === 'worth testing' ? 'test' : 'suggested'} slot ({s.slot})
              </span>
            ) : (
              <button
                key={s.slot}
                type="button"
                onClick={() => pick(SLOT_START[s.slot])}
                className="rounded-full px-2.5 py-1 font-medium ring-1 ring-border transition-colors hover:bg-card hover:text-foreground"
              >
                Use {SLOT_START[s.slot]} UAE <span className="font-normal text-muted-foreground">· {s.label}</span>
              </button>
            ),
          )}
        </div>
      )}
    </div>
  )
}
