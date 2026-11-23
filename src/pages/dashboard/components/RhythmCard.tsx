import { addDays, format, startOfWeek } from 'date-fns'
import { CalendarRange } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { CardHeading } from '@/components/common'
import type { Post } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Tip } from './ChartTip'
import { median, uaeDay, WEEKS } from '../utils'

export function RhythmCard({ posts }: { posts: Post[] }) {
  const thisWeek = startOfWeek(uaeDay(new Date().toISOString()), { weekStartsOn: 1 })
  const weeks = Array.from({ length: WEEKS }, (_, i) => ({ start: addDays(thisWeek, (i - WEEKS + 1) * 7), count: 0 }))
  for (const p of posts) {
    const w = startOfWeek(uaeDay(p.published_at), { weekStartsOn: 1 }).getTime()
    const hit = weeks.find((x) => x.start.getTime() === w)
    if (hit) hit.count += 1
  }
  const full = weeks.slice(0, -1) // the current week isn't over yet
  const active = full.filter((w) => w.count > 0).length
  const typical = median(full.map((w) => w.count))
  const max = Math.max(1, ...weeks.map((w) => w.count))

  return (
    <Card>
      <CardHeader>
        <CardHeading icon={CalendarRange} title="Posting rhythm" sub="Posts per week, last 12 weeks (UAE time)" />
      </CardHeader>
      <CardContent>
        <p className="text-sm">
          Posted in <b className="font-semibold tabular-nums">{active}</b> of {full.length} full weeks
          {typical != null && (
            <>
              {' '}
              · usually <b className="font-semibold tabular-nums">{typical}</b> a week
            </>
          )}
        </p>
        <div className="mt-4 flex h-28 items-end gap-[2px]" role="img" aria-label={`Posts per week: ${weeks.map((w) => `${format(w.start, 'd MMM')} ${w.count}`).join(', ')}`}>
          {weeks.map((w, i) => {
            const current = i === WEEKS - 1
            return (
              <div key={w.start.toISOString()} tabIndex={0} className="group relative flex h-full flex-1 items-end outline-none">
                {w.count > 0 ? (
                  <div className={cn('w-full rounded-t-[4px] bg-primary', current && 'opacity-50')} style={{ height: `${(w.count / max) * 100}%` }} />
                ) : (
                  <div className="h-[2px] w-full bg-border" />
                )}
                <Tip align={i < 2 ? 'left' : 'center'}>
                  Week of {format(w.start, 'd MMM')}
                  {current ? ' (so far)' : ''}: <b>{w.count}</b> {w.count === 1 ? 'post' : 'posts'}
                </Tip>
              </div>
            )
          })}
        </div>
        <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
          <span>{format(weeks[0].start, 'd MMM')}</span>
          <span>This week</span>
        </div>
      </CardContent>
    </Card>
  )
}
