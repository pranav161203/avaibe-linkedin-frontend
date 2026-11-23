import { AlertTriangle, CheckCircle2, FileSpreadsheet } from 'lucide-react'
import type { ExportFileResult } from '@/lib/api'
import { fmtNumber } from '@/lib/format'
import { KIND_LABEL } from '../constants/import'
import { plural } from '../utils/import'

export function FileResult({ r }: { r: ExportFileResult }) {
  const failed = r.errors.length > 0 && !r.kind
  const lines: string[] = []
  if (r.posts_created != null) {
    // Only what really changed: importing the same file again shows everything as unchanged
    const parts = [
      `${plural(r.posts_created, 'new post')}`,
      `${fmtNumber(r.posts_updated ?? 0)} with new numbers`,
      `${fmtNumber(r.posts_unchanged ?? 0)} unchanged`,
    ]
    lines.push(parts.join(' · '))
  }
  if (r.snapshots_kept_manual) lines.push(`${r.snapshots_kept_manual} hand-entered snapshots kept`)
  if (r.posts_too_new) lines.push(`${r.posts_too_new} posts under a day old at export: no totals stored yet`)
  if (r.days_saved != null) {
    lines.push(
      `${plural(r.days_saved, 'day')} of page activity: ${fmtNumber(r.days_new ?? 0)} new, ${fmtNumber(r.days_changed ?? 0)} changed, ${fmtNumber(r.days_unchanged ?? 0)} unchanged`,
    )
  }
  if (r.demographic_rows) {
    const what = r.demographic_status === 'unchanged' ? 'unchanged' : r.demographic_status === 'changed' ? 'updated' : 'added'
    lines.push(`Breakdown as of ${r.exported_on} ${what} (${fmtNumber(r.demographic_rows)} rows, total ≈ ${fmtNumber(r.demographic_total ?? null)})`)
  }
  return (
    <div className={`rounded-md border p-3 text-sm ${failed ? 'border-destructive/40 bg-destructive/5' : r.skipped ? 'border-warn/50 bg-warn/10' : ''}`}>
      <div className="flex items-center gap-2 font-medium">
        {failed || r.skipped ? <AlertTriangle className="size-4 shrink-0" /> : <CheckCircle2 className="size-4 shrink-0 text-good-fg" />}
        <FileSpreadsheet className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate">{r.file}</span>
        {r.kind && <span className="ml-auto shrink-0 text-xs font-normal text-muted-foreground">{KIND_LABEL[r.kind]}</span>}
      </div>
      {r.skipped && <p className="mt-1 text-xs">{r.skipped}</p>}
      {lines.length > 0 && (
        <ul className="mt-1 list-disc pl-5 text-xs text-muted-foreground">
          {lines.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      )}
      {r.errors.length > 0 && (
        <ul className="mt-1 space-y-0.5 text-xs text-destructive">
          {r.errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
