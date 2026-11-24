/**
 * The building blocks of the Data page, laid out like LinkedIn's own analytics (Highlights → Metrics → detail),
 * plus what LinkedIn doesn't do: small-number honesty, post markers and holidays on the chart, and a
 * "what happened that day" explainer for spikes and dips.
 */
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Area, CartesianGrid, ComposedChart, Line, ReferenceArea, XAxis, YAxis } from 'recharts'
import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns'
import { CalendarDays, LineChart } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart'
import { type CalendarItem, type PageDay, type Post } from '@/lib/api'
import { FORMAT_LABELS, fmtNumber } from '@/lib/format'
import { ymd } from '@/components/period'
import { cn } from '@/lib/utils'
import { CardHeading } from '@/components/common'
import { useGetCalendarItems } from '@/pages/calendar/queries'

export interface ChartMetric {
  value: string
  label: string
  get: (d: PageDay) => number | null
}

const MARKER_KINDS = new Set(['uae_holiday', 'period', 'event'])

const MARKER_COLOR: Record<string, string> = { uae_holiday: 'var(--cal-uae)', period: 'var(--cal-period)', event: 'var(--cal-event)' }

const chartConfig = { value: { label: 'Value', color: 'var(--chart-current)' } } satisfies ChartConfig

const postDate = (p: Post) => p.published_at_uae.slice(0, 10)

const postTitle = (p: Post) => p.caption?.split('\n').find((l) => l.trim())?.trim() || p.topic || p.ref || `Post ${p.id}`

const postImpressions = (p: Post) => p.snapshots[p.snapshots.length - 1]?.impressions ?? null

interface Point {
  key: string // first day of the bucket, YYYY-MM-DD
  end: string // last day of the bucket
  label: string
  value: number | null
  covered: number
  days: number
  posts: Post[]
  cmp: number | null
  cmpKey: string | null
}

export type CompareLine = { from: string; to: string; label: string } | null
export type MetricSummary = { a: string; b: string; change: number | null; note?: string; higher?: 'a' | 'b' | null }

export function MetricsChart({
  daily,
  from,
  to,
  metrics,
  posts = [],
  param = 'metric',
  title = 'Metrics',
  compare = null,
  summary,
  showChart = true,
}: {
  daily: PageDay[]
  from: string
  to: string
  metrics: ChartMetric[]
  posts?: Post[]
  /** Address parameter holding the chosen metric, so each tab remembers its own */
  param?: string
  title?: string
  compare?: CompareLine
  /** Compare periods: each metric becomes a tile with both periods' totals and the change */
  summary?: (m: ChartMetric) => MetricSummary
  showChart?: boolean
}) {
  const [params, setParams] = useSearchParams()
  const metric = metrics.find((m) => m.value === params.get(param)) ?? metrics[0]
  const setMetric = (v: string) => setParams((p) => { p.set(param, v); return p }, { replace: true })
  const [picked, setPicked] = useState<string | null>(null)
  const { data: cal } = useGetCalendarItems(from, to, differenceInCalendarDays(parseISO(to), parseISO(from)) <= 400)

  const span = differenceInCalendarDays(parseISO(to), parseISO(from)) + 1
  const unit: 'day' | 'week' = span <= 120 ? 'day' : 'week'

  const view = useMemo(() => {
    const byDate = new Map(daily.map((d) => [d.date, d]))
    const points: Point[] = []
    for (let i = 0; i < span; i++) {
      const day = addDays(parseISO(from), i)
      if (unit === 'day' || i % 7 === 0) {
        const end = unit === 'day' ? day : addDays(day, Math.min(6, span - 1 - i))
        const cday = compare ? ymd(addDays(parseISO(compare.from), i)) : null
        points.push({ key: ymd(day), end: ymd(end), label: format(day, 'd MMM'), value: null, covered: 0, days: 0, posts: [], cmp: null, cmpKey: cday && compare && cday <= compare.to ? cday : null })
      }
      const pt = points[points.length - 1]
      pt.days += 1
      const row = byDate.get(ymd(day))
      const v = row ? metric.get(row) : null
      if (v != null) {
        pt.value = (pt.value ?? 0) + v
        pt.covered += 1
      }
      if (compare) {
        const cd = ymd(addDays(parseISO(compare.from), i))
        const crow = cd <= compare.to ? byDate.get(cd) : undefined
        const cv = crow ? metric.get(crow) : null
        if (cv != null) pt.cmp = (pt.cmp ?? 0) + cv
      }
    }
    for (const p of posts) {
      const d = postDate(p)
      const pt = points.find((x) => d >= x.key && d <= x.end)
      if (pt) pt.posts.push(p)
    }
    // Only complete buckets count as "typical"; an unfinished last week would drag it down
    const complete = points.filter((p) => p.covered > 0 && p.covered === p.days).map((p) => p.value ?? 0).sort((a, b) => a - b)
    const typical = complete.length ? complete[Math.floor((complete.length - 1) / 2)] : null
    const peak = points.reduce<Point | null>((m, p) => (p.value != null && (!m || p.value > (m.value ?? 0)) ? p : m), null)
    return { points, typical, peak }
  }, [daily, from, span, unit, metric, posts, compare?.from, compare?.to]) // eslint-disable-line react-hooks/exhaustive-deps

  const markers = (cal?.items ?? []).filter((it) => MARKER_KINDS.has(it.kind))
  const bucketOf = (iso: string) => view.points.find((p) => iso >= p.key && iso <= p.end)?.key
  // Name a band only when there's room: it doesn't start too close to the last named one (the explainer lists them all)
  const labelled = new Set<CalendarItem>()
  {
    const gap = Math.max(4, Math.round(view.points.length / 6))
    let lastIdx = -Infinity
    for (const m of [...markers].sort((a, b) => a.start.localeCompare(b.start))) {
      const k = bucketOf(m.start < from ? from : m.start)
      const idx = view.points.findIndex((p) => p.key === k)
      if (idx >= 0 && idx - lastIdx >= gap) {
        labelled.add(m)
        lastIdx = idx
      }
    }
  }
  // The explainer opens only when asked (a click on the chart, or the highest-point link), so the chart stays calm
  const selected = view.points.find((p) => p.key === picked) ?? null
  const hasData = view.points.some((p) => p.value != null)

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardHeading icon={LineChart} title={title} />
          {!summary && <div role="tablist" aria-label="Chart metric" className="flex flex-wrap gap-1 rounded-lg bg-secondary p-1">
            {metrics.map((m) => (
              <button
                key={m.value}
                role="tab"
                aria-selected={m.value === metric.value}
                type="button"
                onClick={() => {
                  setMetric(m.value)
                  setPicked(null)
                }}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  m.value === metric.value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {m.label}
              </button>
            ))}
          </div>}
        </div>
        {summary && (
          <div role="tablist" aria-label="Chart metric" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {metrics.map((m) => {
              const s = summary(m)
              const on = m.value === metric.value && showChart
              const up = s.change != null && s.change > 0.02
              const down = s.change != null && s.change < -0.02
              return (
                <button
                  key={m.value}
                  role="tab"
                  aria-selected={on}
                  type="button"
                  disabled={!showChart}
                  onClick={() => {
                    setMetric(m.value)
                    setPicked(null)
                  }}
                  className={cn('flex flex-col justify-start rounded-xl px-3.5 py-3 text-left ring-1 transition-colors disabled:cursor-default', on ? 'bg-primary/5 ring-primary/40' : 'ring-border enabled:hover:bg-accent')}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">{m.label}</span>
                    {s.change != null && (
                      <span className={cn('text-xs font-medium tabular-nums', up && 'text-good-fg', down && 'text-bad-fg', !up && !down && 'text-muted-foreground')}>
                        {s.change >= 0 ? '+' : ''}
                        {Math.round(s.change * 100)}%
                      </span>
                    )}
                  </div>
                  {/* A always on top, B below (same order as the chart); the higher one is bold */}
                  <div className="mt-2 space-y-1">
                    {(['a', 'b'] as const).map((k) => (
                      <div key={k} className="flex items-center gap-2">
                        <span
                          className={cn(
                            'flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                            k === 'a' ? 'bg-primary text-primary-foreground' : 'bg-period-b text-period-b-fg',
                          )}
                        >
                          {k.toUpperCase()}
                        </span>
                        <span className={cn('text-base tabular-nums', s.higher === k ? 'font-semibold text-foreground' : 'text-muted-foreground')}>{s[k]}</span>
                      </div>
                    ))}
                  </div>
                  {s.note && <div className="mt-1.5 truncate text-[11px] text-muted-foreground tabular-nums">{s.note}</div>}
                </button>
              )
            })}
          </div>
        )}
        {showChart && <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full bg-[var(--chart-current)]" aria-hidden /> {metric.label} per {unit}
          </span>
          {posts.length > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full border-2 border-[var(--chart-current)] bg-card" aria-hidden /> a post went out
            </span>
          )}
          {compare && (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-4 border-t-2 border-dashed border-period-b" aria-hidden /> {compare.label}
            </span>
          )}
          {markers.length > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-[var(--cal-period)] opacity-40" aria-hidden /> holidays, Ramadan, events
            </span>
          )}

        </div>}
      </CardHeader>
      {showChart && <CardContent>
        {!hasData ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No {metric.label.toLowerCase()} in this period yet.</p>
        ) : (
          <>
            <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
              <ComposedChart
                data={view.points}
                margin={{ left: 0, right: 16, top: 16, bottom: 0 }}
                onClick={(s) => {
                  const k = (s as { activeLabel?: string } | null)?.activeLabel
                  if (k) setPicked(String(k))
                }}
                className="cursor-pointer"
              >
                <defs>
                  <linearGradient id="metrics-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.16} />
                    <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                {markers.map((m) => {
                  const x1 = bucketOf(m.start < from ? from : m.start)
                  const x2 = bucketOf(m.end > to ? to : m.end)
                  return x1 && x2 ? (
                    <ReferenceArea
                      key={m.title + m.start}
                      x1={x1}
                      x2={x2}
                      fill={MARKER_COLOR[m.kind]}
                      fillOpacity={0.12}
                      strokeOpacity={0}
                      ifOverflow="hidden"
                      label={
                        labelled.has(m)
                          ? { value: m.title.length > 22 ? `${m.title.slice(0, 21)}…` : m.title, position: 'insideTopLeft', fontSize: 10, fill: 'var(--muted-foreground)' }
                          : undefined
                      }
                    />
                  ) : null
                })}
                {selected && <ReferenceArea x1={selected.key} x2={selected.key} fill="var(--foreground)" fillOpacity={0.06} strokeOpacity={0} />}
                <XAxis dataKey="key" tickLine={false} axisLine={false} tickMargin={10} fontSize={11} minTickGap={24} tickFormatter={(k: string) => format(parseISO(k), 'd MMM')} />
                <YAxis tickLine={false} axisLine={false} width={44} fontSize={11} allowDecimals={false} tickFormatter={(v: number) => (v >= 10_000 ? `${Math.round(v / 1000)}K` : fmtNumber(v))} />
                <ChartTooltip cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1, strokeOpacity: 0.35 }} content={<PointTooltip unit={unit} metric={metric.label} />} />
                {compare && (
                  <Line dataKey="cmp" type="monotone" stroke="var(--period-b)" strokeWidth={2} strokeDasharray="5 4" dot={false} activeDot={false} connectNulls isAnimationActive={false} />
                )}
                <Area
                  dataKey="value"
                  type="monotone"
                  stroke="var(--color-value)"
                  strokeWidth={2}
                  fill="url(#metrics-fill)"
                  isAnimationActive={false}
                  connectNulls
                  activeDot={{ r: 4, fill: 'var(--color-value)', stroke: 'var(--card)', strokeWidth: 2 }}
                  // A ring on the line wherever a post went out, so spikes can be matched to posts at a glance
                  dot={(props: { cx?: number; cy?: number; payload?: Point; index?: number }) =>
                    props.payload?.posts.length && props.cx != null && props.cy != null ? (
                      <circle key={props.index} cx={props.cx} cy={props.cy} r={4} fill="var(--card)" stroke="var(--color-value)" strokeWidth={2} />
                    ) : (
                      <g key={props.index} />
                    )
                  }
                />
              </ComposedChart>
            </ChartContainer>
            {selected ? (
              <Explainer point={selected} unit={unit} metric={metric.label} typical={view.typical} isPeak={selected === view.peak} posts={posts} markers={markers} onClose={() => setPicked(null)} />
            ) : (
              view.peak && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Highest: {format(parseISO(view.peak.key), unit === 'week' ? "'week of' d MMM" : 'EEE d MMM')}, {fmtNumber(view.peak.value)}.{' '}
                  <button type="button" onClick={() => setPicked(view.peak!.key)} className="font-medium text-foreground underline underline-offset-2">
                    See why
                  </button>{' '}
                  · or click any {unit} on the chart.
                </p>
              )
            )}
          </>
        )}
      </CardContent>}
    </Card>
  )
}

function PointTooltip({ active, payload, unit, metric }: { active?: boolean; payload?: { payload?: Point }[]; unit: string; metric: string }) {
  const p = payload?.[0]?.payload
  if (!active || !p) return null
  return (
    <div className="min-w-44 rounded-lg bg-popover px-3 py-2 text-xs shadow-md ring-1 ring-foreground/10">
      <div className="mb-1 font-medium">{unit === 'week' ? `7 days from ${p.label}` : format(parseISO(p.key), 'EEE d MMM yyyy')}</div>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">{metric}</span>
        <span className="font-semibold tabular-nums">{p.value == null ? 'No data yet' : fmtNumber(p.value)}</span>
      </div>
      {p.cmpKey && (
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">{unit === 'week' ? `Week from ${format(parseISO(p.cmpKey), 'd MMM')}` : format(parseISO(p.cmpKey), 'EEE d MMM yyyy')}</span>
          <span className="tabular-nums">{p.cmp == null ? 'No data' : fmtNumber(p.cmp)}</span>
        </div>
      )}
      {p.posts.length > 0 && (
        <div className="mt-1 text-muted-foreground">
          {p.posts.length} post{p.posts.length === 1 ? '' : 's'} went out
        </div>
      )}
    </div>
  )
}

/** "What happened": the posts that went out just before, and any holiday or event, for the chosen day or week */
function Explainer({
  point,
  unit,
  metric,
  typical,
  isPeak,
  posts,
  markers,
  onClose,
}: {
  point: Point
  unit: 'day' | 'week'
  metric: string
  typical: number | null
  isPeak: boolean
  posts: Post[]
  markers: CalendarItem[]
  onClose: () => void
}) {
  // Posts collect most impressions in their first 2–3 days, so look a little before the day too
  const lookFrom = ymd(addDays(parseISO(point.key), -3))
  const nearby = posts
    .filter((p) => postDate(p) >= lookFrom && postDate(p) <= point.end)
    .sort((a, b) => (postImpressions(b) ?? 0) - (postImpressions(a) ?? 0))
    .slice(0, 3)
  const events = markers.filter((m) => m.start <= point.end && m.end >= point.key)
  const ratio = point.value != null && typical ? point.value / typical : null
  const when = unit === 'week' ? `Week from ${format(parseISO(point.key), 'd MMM')}` : format(parseISO(point.key), 'EEE d MMM')

  return (
    <div className="mt-4 rounded-lg border bg-muted/30 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="text-sm font-medium">
          {isPeak ? 'Highest point: ' : ''}
          {when} · {fmtNumber(point.value)} {metric.toLowerCase()}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {ratio != null && (
            <span>
              {ratio >= 1.15 ? `${ratio.toFixed(1)}× a typical ${unit}` : ratio <= 0.85 ? `${Math.round(ratio * 100)}% of a typical ${unit}` : `about a typical ${unit}`}
              {' '}({fmtNumber(typical)})
            </span>
          )}
          <button type="button" onClick={onClose} className="rounded px-1.5 py-0.5 hover:bg-muted hover:text-foreground">
            Close
          </button>
        </div>
      </div>
      {point.covered < point.days && <p className="mt-1 text-xs text-muted-foreground">{point.covered} of {point.days} days reported so far.</p>}

      {nearby.length > 0 ? (
        <>
          <p className="mt-3 text-xs text-muted-foreground">Posts that went out {unit === 'day' ? 'that day or up to 3 days before' : 'that week or just before'}:</p>
          <ul className="mt-1.5 space-y-1">
            {nearby.map((p) => (
              <li key={p.id}>
                <Link to={`/posts/${p.id}`} className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                  <span className="w-14 shrink-0 text-xs text-muted-foreground tabular-nums">{format(parseISO(postDate(p)), 'd MMM')}</span>
                  <span className="min-w-0 flex-1 truncate">{postTitle(p)}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{FORMAT_LABELS[p.format]}</span>
                  <span className="w-16 shrink-0 text-right text-xs tabular-nums">{postImpressions(p) == null ? '—' : `${fmtNumber(postImpressions(p))} impr.`}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          No posts went out just before. Possible reasons: an older post being reshared, a founder sharing the page, or people finding the page in search.
        </p>
      )}
      {events.length > 0 && (
        <p className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="size-3.5" />
          Around then: {events.map((e) => e.title).join(' · ')}
        </p>
      )}
    </div>
  )
}
