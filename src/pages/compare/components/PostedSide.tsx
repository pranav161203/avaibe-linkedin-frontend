import { Link } from 'react-router-dom'
import { PostRef } from '@/components/common'
import type { Checkpoint } from '@/lib/api'
import { fmtNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import { firstLine, impAt, periodLabel, type PeriodSide } from '../utils/insights'
import { PeriodTag } from './PeriodTag'

export function PostedSide({ letter, side, cp }: { letter: 'A' | 'B'; side: PeriodSide; cp: Checkpoint }) {
  const perWeek = (side.posts.length / side.days) * 7
  const formats = [...side.formats.entries()].sort((x, y) => y[1] - x[1])
  const topics = [...side.topics.entries()].sort((x, y) => y[1] - x[1]).slice(0, 4)
  const top = side.posts.filter((p) => impAt(p, cp) != null).sort((x, y) => impAt(y, cp)! - impAt(x, cp)!).slice(0, 3)
  const max = Math.max(1, ...formats.map((f) => f[1]))
  return (
    <div className="rounded-[1.8rem] bg-card p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <PeriodTag letter={letter} />
        <span className="text-sm font-semibold">{periodLabel(side.from, side.to)}</span>
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
          {side.posts.length} posts · {perWeek.toFixed(1)} a week
        </span>
      </div>

      <div className="text-xs font-medium text-muted-foreground">Formats</div>
      <ul className="mt-2 space-y-1.5">
        {formats.length ? (
          formats.map(([name, n]) => (
            <li key={name} className="grid grid-cols-[90px_1fr_24px] items-center gap-2 text-xs">
              <span>{name}</span>
              <span className="h-2 rounded-[4px] bg-muted">
                <span className={cn('block h-full rounded-[4px]', letter === 'A' ? 'bg-primary' : 'bg-muted-foreground/70')} style={{ width: `${(n / max) * 100}%` }} />
              </span>
              <span className="text-right tabular-nums">{n}</span>
            </li>
          ))
        ) : (
          <li className="text-xs text-muted-foreground">No posts</li>
        )}
      </ul>

      {topics.length > 0 && (
        <>
          <div className="mt-4 text-xs font-medium text-muted-foreground">Top topics</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {topics.map(([t, n]) => (
              <span key={t} className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
                {t} · {n}
              </span>
            ))}
          </div>
        </>
      )}

      {top.length > 0 && (
        <>
          <div className="mt-4 text-xs font-medium text-muted-foreground">Best posts</div>
          <ul className="mt-1.5 space-y-1.5">
            {top.map((p) => (
              <li key={p.id} className="flex items-center gap-2 text-[13px]">
                <PostRef id={p.ref} />
                <Link to={`/posts/${p.id}`} className="min-w-0 flex-1 truncate hover:text-primary">
                  {firstLine(p) || p.topic}
                </Link>
                <span className="text-xs text-muted-foreground tabular-nums">{fmtNumber(impAt(p, cp))}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {side.events.length > 0 && (
        <>
          <div className="mt-4 text-xs font-medium text-muted-foreground">Holidays and events</div>
          <p className="mt-1 text-xs">{[...new Set(side.events.map((e) => e.title))].slice(0, 6).join(' · ')}</p>
        </>
      )}
    </div>
  )
}
