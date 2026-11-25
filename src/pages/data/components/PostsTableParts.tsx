import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { fmtNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import { SORT_NAMES } from '../constants/posts'
import type { SortKey } from '../utils/posts'

export function SortButton({ label, k, sort, onSort }: { label: string; k: SortKey; sort: { key: SortKey; desc: boolean }; onSort: (k: SortKey) => void }) {
  const active = sort.key === k
  const Icon = active ? (sort.desc ? ArrowDown : ArrowUp) : ArrowUpDown
  return (
    <button
      type="button"
      onClick={() => onSort(k)}
      title={`Sort by ${SORT_NAMES[k]}`}
      aria-label={`Sort by ${SORT_NAMES[k]}${active ? (sort.desc ? ', currently highest or latest first' : ', currently lowest or oldest first') : ''}`}
      className={cn(
        'group -mx-1.5 inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors hover:bg-muted hover:text-foreground',
        active && 'text-foreground',
      )}
    >
      {label}
      <Icon className={cn('size-3 shrink-0', active ? 'text-primary' : 'opacity-35 group-hover:opacity-100')} />
    </button>
  )
}

export function NumTh({ label, k, sort, onSort, hint }: { label: string; k: SortKey; sort: { key: SortKey; desc: boolean }; onSort: (k: SortKey) => void; hint?: string }) {
  return (
    <th className="px-3 py-3 text-right font-medium whitespace-nowrap" title={hint} aria-sort={sort.key === k ? (sort.desc ? 'descending' : 'ascending') : 'none'}>
      <SortButton label={label} k={k} sort={sort} onSort={onSort} />
    </th>
  )
}

export const Dash = () => <span className="text-muted-foreground">—</span>

export function Num({ v }: { v: number | null }) {
  return <td className="px-3 py-3 text-right align-top tabular-nums">{v == null ? <Dash /> : fmtNumber(v)}</td>
}

export function VsTypical({ v, checkpoint }: { v: number | null; checkpoint?: string }) {
  if (v == null) return <span className="text-xs text-muted-foreground" title="Insufficient posts of the same age for comparison">—</span>
  const up = v >= 1.15
  const down = v <= 0.85
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap tabular-nums',
        up ? 'bg-good/10 text-good-fg' : down ? 'bg-bad/10 text-bad-fg' : 'bg-muted text-muted-foreground',
      )}
      title={`Compared with this account’s median post at ${checkpoint}`}
    >
      {up ? '▲' : down ? '▼' : '≈'} {v.toFixed(1)}×
    </span>
  )
}
