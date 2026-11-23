import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, ChevronRight, HelpCircle, Sparkles, type LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Classification, Shares, Trend } from '@/lib/api'
import { cn } from '@/lib/utils'

export function BackButton({ fallback }: { fallback: string }) {
  const navigate = useNavigate()
  const location = useLocation()
  return (
    <button
      type="button"
      onClick={() => (location.key !== 'default' ? navigate(-1) : navigate(fallback))}
      className="mr-1 inline-flex items-center gap-1 rounded-full bg-card px-2.5 py-1 text-xs font-medium text-foreground ring-1 ring-border transition-colors hover:bg-muted"
    >
      <ArrowLeft className="size-3.5" /> Back
    </button>
  )
}

export function PageHeader({ title, description, actions, eyebrow, back }: {
  title: string
  description?: ReactNode
  actions?: ReactNode
  eyebrow?: string
  back?: string
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {((eyebrow && eyebrow !== title) || back) && (
          <nav aria-label="Breadcrumb" className="mb-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            {back && <BackButton fallback={back} />}
            {eyebrow && eyebrow !== title && (
              <>
                <span>{eyebrow}</span>
                <ChevronRight className="size-3.5" />
                <span className="text-foreground">{title}</span>
              </>
            )}
          </nav>
        )}
        <h1 className="text-[32px] leading-tight font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function CardHeading({ icon, title, sub, action }: { icon: LucideIcon; title: ReactNode; sub?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <IconTile icon={icon} />
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="text-base leading-snug font-semibold">{title}</div>
        {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
      </div>
      {action}
    </div>
  )
}

export function IconTile({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary', className)}>
      <Icon className="size-4.5" />
    </span>
  )
}

export type Tone = 'violet' | 'magenta' | 'green' | 'orange'

export function StatTile({ label, value, hint, icon: Icon }: {
  label: string
  value: string
  hint?: string
  icon?: LucideIcon
  tone?: Tone
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex items-center gap-1.5">
          {Icon && <Icon className="size-3.5 text-muted-foreground" />}
          <CardDescription>{label}</CardDescription>
        </div>
        <div className="mt-1 text-2xl leading-tight font-semibold tracking-tight tabular-nums">{value}</div>
      </CardHeader>
      {hint && <CardContent className="text-xs text-muted-foreground">{hint}</CardContent>}
    </Card>
  )
}

export function Section({ title, description, actions, children, className, icon }: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
  icon?: LucideIcon
}) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 border-b">
        <div className="flex min-w-0 items-start gap-3">
          {icon && <IconTile icon={icon} />}
          <div className={cn('min-w-0', icon && 'pt-0.5')}>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription className="mt-1">{description}</CardDescription>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function EmptyState({ children, icon: Icon = Sparkles }: { children: ReactNode; icon?: LucideIcon }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-card/50 px-6 py-10 text-center text-sm text-muted-foreground">
      <Icon className="size-5" />
      <div>{children}</div>
    </div>
  )
}

const CLASS_STYLES: Record<string, string> = {
  'High performer': 'bg-good/15 text-good-fg border-good/30',
  'Above average': 'bg-info/10 text-info-fg border-info/30',
  Average: 'bg-muted text-foreground border-border',
  'Below average': 'bg-serious/15 text-serious-fg border-serious/40',
  'Needs investigation': 'bg-bad/10 text-bad-fg border-bad/40',
}

export function ClassificationBadge({ c, wrap = false }: { c: Classification | null | undefined; wrap?: boolean }) {
  if (!c) return <span className="text-xs text-muted-foreground">—</span>
  const style = CLASS_STYLES[c.label]
  return (
    <Badge
      variant="outline"
      className={cn(wrap ? 'h-auto py-0.5 text-left leading-tight whitespace-normal' : 'whitespace-nowrap', style ?? 'text-muted-foreground')}
      title={`Baseline: ${c.baseline}`}
    >
      {c.label}
    </Badge>
  )
}

export function ShareSummary({ shares, impressions }: { shares: Shares; impressions?: number | null }) {
  const items = [
    { label: 'UAE', share: shares.uae_share },
    { label: 'Education', share: shares.education_share },
    { label: 'Decision-makers', share: shares.decision_maker_share },
  ]
  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((it) => (
        <div key={it.label} className="rounded-lg bg-muted/60 px-3 py-2">
          <div className="text-xs text-muted-foreground">{it.label}</div>
          <div className="text-lg font-semibold tabular-nums">{it.share == null ? '—' : `≥ ${(it.share * 100).toFixed(1)}%`}</div>
          {impressions != null && it.share != null && (
            <div className="text-xs text-muted-foreground tabular-nums">≈ {Math.round(impressions * it.share).toLocaleString('en-US')} impressions</div>
          )}
        </div>
      ))}
    </div>
  )
}

export function TrendBadge({ trend }: { trend: Trend }) {
  const map = {
    improving: { icon: ArrowUpRight, text: 'Improving', cls: 'text-good-fg' },
    declining: { icon: ArrowDownRight, text: 'Declining', cls: 'text-bad-fg' },
    stable: { icon: ArrowRight, text: 'Stable', cls: 'text-muted-foreground' },
    unknown: { icon: HelpCircle, text: 'Not enough data', cls: 'text-muted-foreground' },
  }[trend]
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', map.cls)}>
      <map.icon className="size-3.5" />
      {map.text}
    </span>
  )
}

export function SimpleSelect({ value, onChange, options, label, className }: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string; dot?: boolean; dotLabel?: string; count?: number; countInList?: boolean }[]
  label?: string
  className?: string
}) {
  const dot = (o: { dot?: boolean; dotLabel?: string }) =>
    o.dot ? <span aria-label={o.dotLabel ?? 'Needs action'} title={o.dotLabel} className="size-2 shrink-0 self-center rounded-full bg-bad" /> : null
  const count = (o: { count?: number }, inList = false) =>
    o.count != null ? <span className={cn('self-center text-xs text-muted-foreground tabular-nums', inList && 'ml-auto')}>{o.count}</span> : null
  const selected = options.find((o) => o.value === value)
  return (
    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {label}
      <Select value={value} onValueChange={(v) => v !== null && onChange(v)} items={options}>
        <SelectTrigger size="sm" className={cn('min-w-28 text-foreground', className)}>
          <span className="flex flex-1 items-center gap-1.5">
            <SelectValue className="flex-none" />
            {selected && selected.count == null && dot(selected)}
          </span>
          {selected && count(selected)}
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
              {dot(o)}
              {o.countInList !== false && count(o, true)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  )
}

export function PostRef({ id, className }: { id: string | null | undefined; className?: string }) {
  if (!id) return null
  return (
    <span className={cn('inline-flex shrink-0 items-center rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] font-medium text-muted-foreground tabular-nums', className)}>
      {id}
    </span>
  )
}
