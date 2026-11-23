import { Link } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { Pencil, Plus, X } from 'lucide-react'
import { PostRef } from '@/components/common'
import { Button, buttonVariants } from '@/components/ui/button'
import { useAuth } from '@/context/auth'
import type { CalendarData } from '@/lib/api'
import { fmtNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import { SLOT_START } from '@/lib/timing-advice'
import { KIND_META } from '../constants'
import { DayIdeas } from './DayIdeas'
import { covers, postFormat, plannedFormat, plannedStatus } from '../utils'

export function DayPanel({
  day,
  data,
  accountId,
  canPlan,
  onClose,
}: {
  day: string
  data: CalendarData
  accountId: number
  canPlan: boolean
  onClose: () => void
}) {
  const canEdit = useAuth().can('editor')
  const items = data.items.filter((i) => covers(i, day))
  const posts = data.posts.filter((p) => p.date === day)
  const planned = data.planned.filter((p) => p.date === day)
  const adv = data.timing.ready ? data.timing.days[day] : undefined
  const start = (adv && SLOT_START[adv.best_slot]) || '10:00'
  const newAt = new Date(`${day}T${start}:00+04:00`).toISOString()

  return (
    <>
    <div className="rounded-2xl border bg-card p-5 text-sm shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs text-muted-foreground">{format(parseISO(day), 'EEEE')}</div>
          <div className="text-base font-semibold">{format(parseISO(day), 'd MMMM yyyy')}</div>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={onClose}>
          <X />
        </Button>
      </div>

      {items.length > 0 && (
        <ul className="mt-3 space-y-2">
          {items.map((i) => (
            <li key={i.title + i.start} className="flex gap-2">
              <span className="mt-1.5 size-2 shrink-0 rounded-full" style={{ backgroundColor: KIND_META[i.kind].color }} />
              <div>
                <div className="font-medium">
                  {i.title}
                  {i.status === 'expected' && (
                    <span className="ml-1.5 rounded-full bg-warn/15 px-1.5 py-0.5 text-[10px] font-normal text-warn-fg">expected</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {KIND_META[i.kind].label.replace(/s$/, '')}
                  {i.start !== i.end && ` · ${format(parseISO(i.start), 'd MMM')} – ${format(parseISO(i.end), 'd MMM')}`}
                  {i.note && ` · ${i.note}`}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 space-y-2 border-t pt-3">
        <div className="text-xs font-medium text-muted-foreground">Posts</div>
        {posts.length === 0 && planned.length === 0 && <p className="text-muted-foreground">Nothing posted or planned.</p>}
        {posts.map((p) => {
          return (
            <Link key={p.id} to={`/posts/${p.id}`} className="block rounded-lg border px-2.5 py-2 hover:bg-accent/40">
              <div className="text-xs text-muted-foreground">
                {p.ref && <PostRef id={p.ref} className="mr-1.5" />}
                {p.account_id === accountId ? 'Our post' : p.account_name} · {postFormat(p.format)}
                {p.time && ` · ${p.time}`}
              </div>
              <div className="mt-0.5 line-clamp-2 text-[13px]">{p.title}</div>
              {p.impressions != null && (
                <div className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                  {fmtNumber(p.impressions)} impressions{p.checkpoint ? ` at ${p.checkpoint}` : ''}
                </div>
              )}
            </Link>
          )
        })}
        {planned.map((p) => {
          const editable = canEdit && p.status !== 'publishing'
          return (
            <div key={`pl-${p.id}`} className="flex items-start gap-2 rounded-lg border border-dashed px-2.5 py-2">
              <div className="min-w-0 flex-1">
                <div className="text-xs text-muted-foreground">
                  <PostRef id={p.ref} className="mr-1.5" />
                  {plannedFormat(p.format)} · {p.time} · {plannedStatus(p.status)}
                </div>
                <div className="mt-0.5 line-clamp-2 text-[13px]">{p.title}</div>
              </div>
              {editable && (
                <Link to={`/create/${p.id}?from=calendar`} className={cn(buttonVariants({ variant: 'outline', size: 'xs' }), 'shrink-0')}>
                  <Pencil /> Edit
                </Link>
              )}
            </div>
          )
        })}
      </div>

      {canPlan && (
        <Link to={`/create?new_at=${encodeURIComponent(newAt)}&from=calendar`} className={cn(buttonVariants({ size: 'sm' }), 'mt-4 w-full')}>
          <Plus /> Plan a post for this day
        </Link>
      )}
    </div>
    {canPlan && <DayIdeas day={day} items={data.items} posts={data.posts} accountId={accountId} newAt={newAt} />}
    </>
  )
}
