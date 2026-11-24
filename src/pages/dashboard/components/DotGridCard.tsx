/** Posting days: one dot per day for the last 12 weeks (UAE time), coral when something went out. Gaps jump out. */
import { addDays, format, startOfWeek } from 'date-fns'
import { CalendarRange } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { CardHeading } from '@/components/common'
import type { Post } from '@/lib/api'
import { cn } from '@/lib/utils'
import { median, uaeDay, WEEKS } from '../utils'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function DotGridCard({ posts }: { posts: Post[] }) {
  const today = uaeDay(new Date().toISOString())
  const first = addDays(startOfWeek(today, { weekStartsOn: 1 }), -(WEEKS - 1) * 7)
  const counts = new Map<string, number>()
  for (const p of posts) {
    const k = format(uaeDay(p.published_at), 'yyyy-MM-dd')
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  const weeks = Array.from({ length: WEEKS }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = addDays(first, w * 7 + d)
      const k = format(date, 'yyyy-MM-dd')
      return { date, n: counts.get(k) ?? 0, future: date > today, weekend: d >= 5 }
    }),
  )
  const days = weeks.flat().filter((x) => !x.future)
  const workdays = days.filter((x) => !x.weekend)
  const postedWorkdays = workdays.filter((x) => x.n > 0).length
  const perWeek = median(weeks.slice(0, -1).map((w) => w.reduce((a, x) => a + x.n, 0)))

  return (
    <Card>
      <CardHeader>
        <CardHeading icon={CalendarRange} title="Posting days" sub="Last 12 weeks, UAE time" />
      </CardHeader>
      <CardContent>
        <p className="text-sm">
          Posted on <b className="font-semibold tabular-nums">{postedWorkdays}</b> of {workdays.length} working days
          {perWeek != null && (
            <>
              {' '}
              · usually <b className="font-semibold tabular-nums">{perWeek}</b> a week
            </>
          )}
        </p>
        <div className="mt-4 flex gap-2">
          <div className="grid grid-rows-7 gap-1.5 text-[10px] text-muted-foreground">
            {DAYS.map((d, i) => (
              <span key={d} className="flex h-3.5 items-center">
                {i % 2 === 0 ? d : ''}
              </span>
            ))}
          </div>
          <div className="grid flex-1 grid-flow-col grid-rows-7 gap-1.5" role="img" aria-label={`Posted on ${postedWorkdays} of ${workdays.length} working days in the last 12 weeks`}>
            {weeks.flat().map((x) => (
              <span
                key={x.date.toISOString()}
                title={x.future ? undefined : `${format(x.date, 'EEE d MMM')}: ${x.n ? `${x.n} post${x.n > 1 ? 's' : ''}` : 'no post'}`}
                className={cn(
                  'size-3.5 justify-self-center rounded-full',
                  x.future ? 'opacity-0' : x.n >= 2 ? 'bg-primary ring-2 ring-primary/25' : x.n === 1 ? 'bg-primary' : x.weekend ? 'bg-muted/60' : 'bg-muted',
                )}
              />
            ))}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] whitespace-nowrap text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-primary" /> posted
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-primary ring-2 ring-primary/25" /> 2+
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-muted" /> none
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
