import { Link } from 'react-router-dom'
import { ArrowRight, Lightbulb } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import type { CalendarItem, CalendarPost } from '@/lib/api'
import { PLANNED_FORMAT_LABELS } from '@/lib/publishing'
import { dayIdeas } from '../utils/ideas'

export function DayIdeas({ day, items, posts, accountId, newAt }: { day: string; items: CalendarItem[]; posts: CalendarPost[]; accountId: number; newAt: string }) {
  const ideas = dayIdeas(day, items, posts, accountId)
  return (
    <div className="mt-4 rounded-2xl border bg-card p-5 text-sm shadow-sm">
      <div className="mb-3 flex items-center gap-2 font-semibold">
        <Lightbulb className="size-4 text-primary" /> Content ideas
      </div>
      <ul className="space-y-2.5">
        {ideas.map((idea) => {
          const qs = new URLSearchParams({ new_at: newAt, from: 'calendar', format: idea.format, topic: idea.topic })
          return (
            <li key={idea.title} className="rounded-xl p-3 ring-1 ring-border">
              <div className="text-[13px] leading-snug font-medium">{idea.title}</div>
              <div className="mt-1 text-xs text-muted-foreground">{idea.why}</div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium">{PLANNED_FORMAT_LABELS[idea.format]}</span>
                <Link to={`/create?${qs}`} className={buttonVariants({ variant: 'outline', size: 'xs' })}>
                  Start post <ArrowRight />
                </Link>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
