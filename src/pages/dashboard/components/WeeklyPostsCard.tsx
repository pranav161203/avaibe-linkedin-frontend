/**
 * Posts per week: one bar per week (Monday to Sunday, UAE time) for the last 12 weeks, with a dashed line at the
 * usual week (median of the full weeks). This week is drawn lighter, because it isn't over yet.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { addDays, format, startOfWeek } from 'date-fns'
import { CalendarRange } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { CardHeading } from '@/components/common'
import type { Post } from '@/lib/api'
import { cn } from '@/lib/utils'
import { median, uaeDay, WEEKS } from '../utils'

export function WeeklyPostsCard({ posts }: { posts: Post[] }) {
  const today = uaeDay(new Date().toISOString())
  const thisWeek = startOfWeek(today, { weekStartsOn: 1 })
  const weeks = Array.from({ length: WEEKS }, (_, i) => {
    const start = addDays(thisWeek, -(WEEKS - 1 - i) * 7)
    return { start, end: addDays(start, 6), n: 0, current: i === WEEKS - 1 }
  })
  for (const p of posts) {
    const d = uaeDay(p.published_at)
    const w = weeks.find((x) => d >= x.start && d <= x.end)
    if (w) w.n += 1
  }
  const full = weeks.filter((w) => !w.current)
  const usual = median(full.map((w) => w.n))
  const max = Math.max(1, ...weeks.map((w) => w.n), usual ?? 0)
  const now = weeks[weeks.length - 1]
  const quiet = full.filter((w) => w.n === 0).length
  const [hover, setHover] = useState<number | null>(null)
  const shown = hover != null ? weeks[hover] : null

  return (
    <Card>
      <CardHeader>
        <CardHeading icon={CalendarRange} title="Posts per week" sub="Last 12 weeks, Monday to Sunday (UAE time)" />
      </CardHeader>
      <CardContent>
        <p className="text-sm">
          {usual != null && (
            <>
              Typical: <b className="font-semibold tabular-nums">{usual}</b> per week ·{' '}
            </>
          )}
          this week: <b className="font-semibold tabular-nums">{now.n}</b>
          {quiet > 0 && <span className="text-muted-foreground"> · {quiet} week{quiet === 1 ? '' : 's'} without posts</span>}
        </p>

        <div className="relative mt-4 h-32" role="img" aria-label={`Posts per week for the last 12 weeks; usually ${usual ?? 0} a week, ${now.n} this week so far`}>
          {usual != null && usual > 0 && (
            <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-muted-foreground/60" style={{ bottom: `${(usual / max) * 100}%` }}>
              <span className="absolute -top-4 right-0 text-[10px] text-muted-foreground">usual</span>
            </div>
          )}
          <div className="flex h-full items-end gap-1.5">
            {weeks.map((w, i) => (
              <div
                key={i}
                className="flex h-full flex-1 cursor-default flex-col justify-end"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              >
                {w.n > 0 && <span className={cn('mb-0.5 text-center text-[10px] tabular-nums', hover === i ? 'font-semibold text-foreground' : 'text-muted-foreground')}>{w.n}</span>}
                <div
                  className={cn('w-full rounded-t-[4px] transition-opacity', w.current ? 'bg-primary/35' : 'bg-primary', hover != null && hover !== i && 'opacity-50')}
                  style={{ height: w.n ? `${(w.n / max) * 100}%` : 2, minHeight: 2, ...(w.n ? {} : { background: 'var(--border)' }) }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-1.5 flex gap-1.5 text-[10px] text-muted-foreground">
          {weeks.map((w, i) => (
            // Every third week is labelled (plus "Now"), with room to show the whole date
            <span key={i} className={cn('flex-1 overflow-visible text-center whitespace-nowrap', w.current && 'font-medium text-foreground')}>
              {w.current ? 'Now' : i % 3 === 0 && i < WEEKS - 2 ? format(w.start, 'd MMM') : ''}
            </span>
          ))}
        </div>

        <p className="mt-3 h-4 text-xs text-muted-foreground">
          {shown ? (
            <>
              Week of {format(shown.start, 'd MMM')}: <b className="font-medium text-foreground">{shown.n}</b> post{shown.n === 1 ? '' : 's'}
              {shown.current && ' to date'}
            </>
          ) : (
            <>
              Hover over a week for details ·{' '}
              <Link to="/calendar" className="underline underline-offset-2">
                Open calendar
              </Link>
            </>
          )}
        </p>
      </CardContent>
    </Card>
  )
}
