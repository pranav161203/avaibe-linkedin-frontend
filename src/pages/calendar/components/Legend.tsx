import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { KIND_META, KINDS, ALL_LAYERS, type Layer } from '../constants'

export function Legend({ hidden, toggle, linkedNames }: { hidden: Set<Layer>; toggle: (l: Layer) => void; linkedNames: string[] }) {
  const chip = (l: Layer, label: string, swatch: React.ReactNode, title?: string) => {
    const on = !hidden.has(l)
    return (
      <button
        key={l}
        type="button"
        title={title}
        aria-pressed={on}
        onClick={() => toggle(l)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors',
          on ? 'bg-card text-foreground' : 'bg-transparent text-muted-foreground line-through decoration-muted-foreground/60',
        )}
      >
        <span className={cn(!on && 'opacity-40')}>{swatch}</span>
        {label}
      </button>
    )
  }
  const dot = (color: string) => <span className="block size-2 rounded-full" style={{ backgroundColor: color }} />
  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-label="Show or hide on the calendar">
      {chip('ours', 'Our posts', <span className="block size-2 rounded-sm bg-primary" />)}
      {linkedNames.length > 0 &&
        chip('linked', 'Linked profiles', <span className="block size-2 rounded-sm border border-primary" />, linkedNames.join(', '))}
      {chip('planned', 'Planned', <span className="block size-2 rounded-sm border border-dashed border-foreground/60" />)}
      {KINDS.map((k) => chip(k, KIND_META[k].label, dot(KIND_META[k].color)))}
      {chip('hints', 'Best-time hints', <Clock className="size-3" />)}
      {ALL_LAYERS.some((l) => hidden.has(l)) && (
        <span className="text-xs text-muted-foreground">Click a label to show or hide it</span>
      )}
    </div>
  )
}
