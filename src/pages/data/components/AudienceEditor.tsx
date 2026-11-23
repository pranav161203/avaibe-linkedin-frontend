import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SimpleSelect } from '@/components/common'
import { DIMENSIONS, type Dimension } from '@/lib/api'
import { DIMENSION_LABELS } from '@/lib/format'

export interface EditorRow {
  dimension: Dimension
  value: string
  pct: string
  count: string
}

const DIMENSION_OPTIONS = DIMENSIONS.map((d) => ({ value: d, label: DIMENSION_LABELS[d] }))

// Typical values worth recording for AVAIBE's target audience
const QUICK_ADD: { dimension: Dimension; value: string }[] = [
  { dimension: 'location', value: 'United Arab Emirates' },
  { dimension: 'location', value: 'Dubai' },
  { dimension: 'location', value: 'Abu Dhabi' },
  { dimension: 'location', value: 'India' },
  { dimension: 'industry', value: 'Primary and Secondary Education' },
  { dimension: 'industry', value: 'Education Administration Programs' },
  { dimension: 'industry', value: 'IT Services and IT Consulting' },
  { dimension: 'seniority', value: 'Director' },
  { dimension: 'seniority', value: 'Owner' },
  { dimension: 'seniority', value: 'CXO' },
]

export function toEditorRows(rows: { dimension: Dimension; value: string; pct: number | null; count?: number | null }[]): EditorRow[] {
  return rows.map((r) => ({
    dimension: r.dimension,
    value: r.value,
    pct: r.pct != null ? String(r.pct) : '',
    count: r.count != null ? String(r.count) : '',
  }))
}

export function parseNum(s: string): number | null {
  const v = s.replace(/[,%\s]/g, '')
  return v === '' ? null : Number(v)
}

export function AudienceEditor({ rows, onChange, withCount = false }: {
  rows: EditorRow[]
  onChange: (rows: EditorRow[]) => void
  withCount?: boolean
}) {
  const [lastDim, setLastDim] = useState<Dimension>('location')
  const update = (i: number, patch: Partial<EditorRow>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)))
  const add = (dimension: Dimension, value = '') => onChange([...rows, { dimension, value, pct: '', count: '' }])
  const existing = new Set(rows.map((r) => `${r.dimension}|${r.value.toLowerCase()}`))

  return (
    <div className="space-y-3">
      {rows.length > 0 && (
        <div className="space-y-2">
          <div className="grid grid-cols-[9rem_1fr_5.5rem_2rem] gap-2 text-xs text-muted-foreground max-sm:hidden" style={withCount ? { gridTemplateColumns: '9rem 1fr 5.5rem 5.5rem 2rem' } : undefined}>
            <span>Breakdown</span>
            <span>Value as LinkedIn shows it</span>
            {withCount && <span>Count</span>}
            <span>%</span>
            <span />
          </div>
          {rows.map((r, i) => (
            <div
              key={i}
              className="grid grid-cols-[9rem_1fr_5.5rem_2rem] items-center gap-2"
              style={withCount ? { gridTemplateColumns: '9rem 1fr 5.5rem 5.5rem 2rem' } : undefined}
            >
              <SimpleSelect
                value={r.dimension}
                onChange={(v) => {
                  update(i, { dimension: v as Dimension })
                  setLastDim(v as Dimension)
                }}
                options={DIMENSION_OPTIONS}
                className="w-full"
              />
              <Input value={r.value} onChange={(e) => update(i, { value: e.target.value })} placeholder="e.g. Dubai, United Arab Emirates" />
              {withCount && (
                <Input inputMode="numeric" value={r.count} onChange={(e) => update(i, { count: e.target.value })} placeholder="—" />
              )}
              <Input inputMode="decimal" value={r.pct} onChange={(e) => update(i, { pct: e.target.value })} placeholder={withCount ? 'or %' : '%'} />
              <Button type="button" size="icon-sm" variant="ghost" aria-label="Remove row" onClick={() => onChange(rows.filter((_, j) => j !== i))}>
                <X />
              </Button>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-1.5">
        <Button type="button" size="sm" variant="outline" onClick={() => add(lastDim)}>
          <Plus /> Add row
        </Button>
        <span className="ml-2 text-xs text-muted-foreground">Quick add:</span>
        {QUICK_ADD.filter((q) => !existing.has(`${q.dimension}|${q.value.toLowerCase()}`)).map((q) => (
          <button
            key={`${q.dimension}|${q.value}`}
            type="button"
            onClick={() => add(q.dimension, q.value)}
            className="rounded-md border border-dashed px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {q.value}
          </button>
        ))}
      </div>
    </div>
  )
}
