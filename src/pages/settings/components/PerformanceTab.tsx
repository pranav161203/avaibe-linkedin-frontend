import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Gauge, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Section } from '@/components/common'
import type { PerformanceSettings } from '@/lib/api'
import { useSaveSettings } from '@/pages/settings/queries'

export function PerformanceTab({ current, defaults }: { current: PerformanceSettings; defaults: PerformanceSettings }) {
  const save = useSaveSettings()
  const [f, setF] = useState({
    min_history: String(current.min_history),
    min_slot_posts: String(current.min_slot_posts),
    cut_high: String(Math.round(current.cut_high * 100)),
    cut_above: String(Math.round(current.cut_above * 100)),
    cut_average: String(Math.round(current.cut_average * 100)),
    cut_below: String(Math.round(current.cut_below * 100)),
    trend_threshold: String(Math.round(current.trend_threshold * 100)),
  })
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  const submit = () => {
    const pct = (v: string) => Number(v) / 100
    const body: PerformanceSettings = {
      min_history: Number(f.min_history),
      min_slot_posts: Number(f.min_slot_posts),
      cut_high: pct(f.cut_high),
      cut_above: pct(f.cut_above),
      cut_average: pct(f.cut_average),
      cut_below: pct(f.cut_below),
      trend_threshold: pct(f.trend_threshold),
    }
    if (Object.values(body).some((v) => Number.isNaN(v))) return toast.error('All fields require a number')
    save.mutate({ section: 'performance', body }, { onSuccess: () => toast.success('Performance rules saved'), onError: (e) => toast.error(e.message) })
  }
  const reset = () =>
    save.mutate(
      { section: 'performance', reset: true },
      { onSuccess: () => toast.success('Default rules restored'), onError: (e) => toast.error(e.message) },
    )

  return (
    <Section icon={Gauge}
      title="Performance rules"
      description="Each post is compared with the account’s own history at the same checkpoint. Higher minimums produce more reliable labels but require more posts."
      actions={
        <Button size="sm" variant="ghost" onClick={reset} disabled={save.isPending}>
          <RotateCcw /> Restore defaults
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField label="Minimum posts before labelling" hint={`Default: ${defaults.min_history}. Below this, posts are marked “Insufficient history”.`}>
            <Input type="number" min={3} max={200} value={f.min_history} onChange={set('min_history')} />
          </NumberField>
          <NumberField label="Minimum posts per time slot" hint={`Default: ${defaults.min_slot_posts}. A time slot is not recommended until it has this many posts.`}>
            <Input type="number" min={1} max={50} value={f.min_slot_posts} onChange={set('min_slot_posts')} />
          </NumberField>
        </div>

        <div>
          <Label className="mb-1 block">Label thresholds (percentile of account history)</Label>
          <p className="mb-2 text-xs text-muted-foreground">Posts at or above a threshold receive that label. Posts below “Below average” are marked “Needs investigation”.</p>
          <div className="grid gap-3 sm:grid-cols-4">
            {(
              [
                ['cut_high', 'High performer', defaults.cut_high],
                ['cut_above', 'Above average', defaults.cut_above],
                ['cut_average', 'Average', defaults.cut_average],
                ['cut_below', 'Below average', defaults.cut_below],
              ] as const
            ).map(([k, label, d]) => (
              <NumberField key={k} label={label} hint={`Default: ${Math.round(d * 100)}`}>
                <div className="flex items-center gap-1.5">
                  <Input type="number" min={1} max={99} value={f[k]} onChange={set(k)} />
                  <span className="text-xs text-muted-foreground">th</span>
                </div>
              </NumberField>
            ))}
          </div>
        </div>

        <NumberField label="Trend threshold" hint={`Default: ${Math.round(defaults.trend_threshold * 100)}%. Smaller changes are shown as “Stable”.`}>
          <div className="flex max-w-40 items-center gap-1.5">
            <Input type="number" min={1} max={100} value={f.trend_threshold} onChange={set('trend_threshold')} />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
        </NumberField>

        <Button onClick={submit} disabled={save.isPending}>
          {save.isPending ? 'Saving…' : 'Save rules'}
        </Button>
      </div>
    </Section>
  )
}

function NumberField({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
