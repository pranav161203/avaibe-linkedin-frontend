import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, parseISO, startOfMonth, startOfWeek } from 'date-fns'
import { CalendarClock, ChevronLeft, ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/common'
import { NewPostMenu } from '@/components/NewPostMenu'
import { todayUae, ymd } from '@/components/period'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAccount } from '@/context/account'
import { useAuth } from '@/context/auth'
import { cn } from '@/lib/utils'
import { proven, UAE_WEEKEND } from '@/lib/timing-advice'
import { DayCell } from './components/DayCell'
import { DayPanel } from './components/DayPanel'
import { Legend } from './components/Legend'
import { TimingNote } from './components/TimingNote'
import { WEEKDAYS, type Layer } from './constants'
import { loadHidden, saveHidden, covers } from './utils'
import { useGetCalendar } from '@/pages/calendar/queries'

export function CalendarPage() {
  const { account } = useAccount()
  const auth = useAuth()
  const [params, setParams] = useSearchParams()
  const today = todayUae()
  const monthParam = params.get('month')
  const month = startOfMonth(monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? parseISO(`${monthParam}-01`) : parseISO(today))
  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
  const from = ymd(gridStart)
  const to = ymd(gridEnd)
  const [hidden, setHidden] = useState<Set<Layer>>(loadHidden)
  const [selected, setSelected] = useState<string | null>(null)

  const { data, isLoading, isError } = useGetCalendar(account?.id, from, to)

  const setMonth = (m: Date) => {
    setSelected(null)
    setParams((p) => { p.set('month', format(m, 'yyyy-MM')); return p }, { replace: true })
  }
  const toggle = (l: Layer) =>
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(l)) next.delete(l)
      else next.add(l)
      saveHidden(next)
      return next
    })

  const days = useMemo(() => eachDayOfInterval({ start: gridStart, end: gridEnd }).map(ymd), [from, to]) // eslint-disable-line react-hooks/exhaustive-deps

  const view = useMemo(() => {
    if (!data || !account) return null
    const show = (l: Layer) => !hidden.has(l)
    const posts = data.posts.filter((p) => (p.account_id === account.id ? show('ours') : show('linked')))
    const planned = show('planned') ? data.planned : []
    const items = data.items.filter((i) => show(i.kind))
    return { posts, planned, items }
  }, [data, account, hidden])

  if (!account) return null

  const inMonth = (d: string) => d.slice(0, 7) === format(month, 'yyyy-MM')
  const own = (data?.posts ?? []).filter((p) => p.account_id === account.id && inMonth(p.date))
  const perDay = new Map<string, number>()
  own.forEach((p) => perDay.set(p.date, (perDay.get(p.date) ?? 0) + 1))
  const workingPast = days.filter((d) => {
    if (!inMonth(d) || d >= today) return false
    const wd = parseISO(d).getDay()
    return !UAE_WEEKEND.has(wd) && !(data?.items ?? []).some((i) => i.kind === 'uae_holiday' && covers(i, d))
  })
  const gaps = workingPast.filter((d) => !perDay.has(d)).length
  const busy = [...perDay.values()].filter((n) => n >= 2).length
  const upcoming = (data?.planned ?? []).filter((p) => inMonth(p.date)).length

  const linked = (data?.accounts ?? []).filter((a) => a.id !== account.id)

  return (
    <div className="mx-auto max-w-page">
      <PageHeader
        eyebrow="Content"
        title="Calendar"
        description="Published and planned posts, holidays and events. Select a day for details or to plan a post."
        actions={<NewPostMenu from="calendar" />}
      />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" aria-label="Previous month" onClick={() => setMonth(addMonths(month, -1))}>
            <ChevronLeft />
          </Button>
          <h2 className="w-40 text-center text-lg font-semibold tabular-nums" aria-live="polite">
            {format(month, 'MMMM yyyy')}
          </h2>
          <Button variant="ghost" size="icon-sm" aria-label="Next month" onClick={() => setMonth(addMonths(month, 1))}>
            <ChevronRight />
          </Button>
          {!isSameMonth(month, parseISO(today)) && (
            <Button variant="outline" size="sm" className="ml-2" onClick={() => setMonth(parseISO(today))}>
              Today
            </Button>
          )}
        </div>
        {data && (
          <p className="text-sm text-muted-foreground">
            <b className="text-foreground tabular-nums">{own.length}</b> {own.length === 1 ? 'post' : 'posts'} by {account.name}
            {workingPast.length > 0 && (
              <>
                {' · '}
                <b className={cn('tabular-nums', gaps > 0 ? 'text-warn-fg' : 'text-foreground')}>{gaps}</b> working {gaps === 1 ? 'day' : 'days'} without a post
              </>
            )}
            {busy > 0 && (
              <>
                {' · '}
                <b className="tabular-nums text-foreground">{busy}</b> {busy === 1 ? 'day' : 'days'} with 2+ posts
              </>
            )}
            {' · '}
            <b className="tabular-nums text-foreground">{upcoming}</b> planned
          </p>
        )}
      </div>

      <Legend hidden={hidden} toggle={toggle} linkedNames={linked.map((a) => a.name)} />

      {data && !hidden.has('hints') && <TimingNote data={data} />}

      <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="overflow-x-auto">
          <div className="min-w-[520px] overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="grid grid-cols-7 border-b bg-muted/40 text-xs font-medium text-muted-foreground">
              {WEEKDAYS.map((w, i) => (
                <div key={w} className={cn('px-2 py-2', i >= 5 && 'text-muted-foreground/70')}>
                  {w}
                  {i >= 5 && <span className="sr-only"> (UAE weekend)</span>}
                </div>
              ))}
            </div>
            {isLoading || !view || !data ? (
              <Skeleton className="m-3 h-[540px]" />
            ) : (
              <div className="grid grid-cols-7">
                {days.map((d, idx) => (
                  <DayCell
                    key={d}
                    day={d}
                    idx={idx}
                    inMonth={isSameMonth(parseISO(d), month)}
                    isToday={d === today}
                    isPast={d < today}
                    selected={selected === d}
                    onSelect={() => setSelected(selected === d ? null : d)}
                    posts={view.posts.filter((p) => p.date === d)}
                    planned={view.planned.filter((p) => p.date === d)}
                    items={view.items.filter((i) => covers(i, d))}
                    accountId={account.id}
                    hint={!hidden.has('hints') && data.timing.ready && proven(data, data.timing.days[d]) ? data.timing.days[d].best_slot : undefined}
                    allItems={data.items.filter((i) => covers(i, d))}
                  />
                ))}
              </div>
            )}
          </div>
          {isError && <p className="mt-2 text-sm text-bad-fg">The calendar could not be loaded. Try again shortly.</p>}
          {data && (
            <p className="mt-2 text-xs text-muted-foreground">
              Times are in UAE time. Islamic holiday dates depend on moon sighting and are marked <i>expected</i> until officially
              confirmed. Holiday and event dates cover {data.dates_cover[0]}–{data.dates_cover[1]}.
            </p>
          )}
        </div>

        <aside className="lg:sticky lg:top-4 lg:self-start">
          {selected && data ? (
            <DayPanel
              day={selected}
              data={data}
              accountId={account.id}
              canPlan={auth.can('editor') && selected >= today}
              onClose={() => setSelected(null)}
            />
          ) : (
            <div className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">
              <CalendarClock className="mb-2 size-5" />
              Select a day to view holidays, events and weekday performance, or to plan a post.
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
