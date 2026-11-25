import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { AlertTriangle, FileSpreadsheet, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Section } from '@/components/common'
import type { ExportImportResult } from '@/lib/api'
import { FileResult } from './FileResult'
import { summaryOf } from '../utils/import'
import { useImportLinkedInExport } from '@/pages/data/queries'

export function LinkedInExportSection({ accountId, accountName, accountKind }: { accountId?: number; accountName?: string; accountKind?: string }) {
  const [files, setFiles] = useState<File[]>([])
  const [exportedOn, setExportedOn] = useState('')
  const [result, setResult] = useState<ExportImportResult | null>(null)
  const imp = useImportLinkedInExport(accountId ?? 0)
  const isProfile = !!accountKind && accountKind !== 'company'
  // Asked before uploading company-page exports into a founder/personal profile
  const [confirming, setConfirming] = useState(false)
  const run = (confirmProfile: boolean) =>
    imp.mutate(
      { files, exportedOn: exportedOn || null, confirmProfile },
      {
        onSuccess: (r) => {
          setResult(r)
          const ok = r.files.filter((f) => f.kind && !f.skipped && !(f.errors.length && !f.kind))
          if (ok.length) toast.success(`Updated: ${ok.map(summaryOf).join(' · ')}`, { duration: 8000 })
          const bad = r.files.length - ok.length
          if (bad) toast.warning(`${bad} file${bad === 1 ? '' : 's'} not imported: see below`)
        },
        onError: (e) => toast.error(e.message),
      },
    )

  return (
    <Section icon={FileSpreadsheet}
      title={`LinkedIn page export → ${accountName ?? '…'}`}
      description="On LinkedIn, go to the company page → Analytics → Content, Followers and Visitors → Export. Upload the files unchanged (.xls or .xlsx). Re-importing updates existing posts without creating duplicates."
    >
      {accountKind && accountKind !== 'company' && (
        <p className="mb-3 flex items-start gap-2 rounded-md border border-warn/50 bg-warn/10 px-3 py-2 text-xs">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>
            <b>{accountName}</b> is a {accountKind} profile, but these exports come from a company page. Switch to the company page in the
            sidebar first. Importing here requires confirmation.
          </span>
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <Label className="mb-1.5 block">Files (select all at once)</Label>
          <Input
            type="file"
            multiple
            accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          />
        </div>
        <div>
          <Label className="mb-1.5 block">Exported on (optional)</Label>
          <Input type="date" value={exportedOn} onChange={(e) => setExportedOn(e.target.value)} className="w-40" />
        </div>
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        If left blank, the date is read from the file name. It determines each post’s age when its totals were recorded.
      </p>
      <Button
        className="mt-3"
        disabled={!files.length || !accountId || imp.isPending}
        onClick={() => (isProfile ? setConfirming(true) : run(false))}
      >
        <Upload /> {imp.isPending ? 'Importing…' : `Import ${files.length || ''} file${files.length === 1 ? '' : 's'}`}
      </Button>

      <ul className="mt-4 space-y-1 text-xs text-muted-foreground">
        <li>
          <b>No posting times:</b> LinkedIn exports the date only. These posts are included in day-of-week analysis but excluded from the
          hourly heatmap. Set the time on a post if it is known.
        </li>
        <li>
          <b>Totals, not snapshots:</b> each post’s figures are stored as its 7-day value (24h or 48h if it was newer at export).
          Manually entered snapshots are never overwritten.
        </li>
        <li>
          <b>Review required:</b> unlabelled formats are imported as “Not tagged yet”, and topics and CTAs are suggested from the caption.
          Open each post and save it to confirm.
        </li>
      </ul>

      {result && (
        <div className="mt-4 space-y-2">
          {result.files.map((f) => (
            <FileResult key={f.file} r={f} />
          ))}
          <p className="text-xs">
            Next steps: <Link to="/data?tab=posts" className="underline">Review formats and topics</Link> ·{' '}
            <Link to="/" className="underline">Open dashboard</Link> · <Link to="/data?tab=followers" className="underline">View audience</Link>
          </p>
        </div>
      )}

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import into a profile?</DialogTitle>
            <DialogDescription>
              <b>{accountName}</b> is a {accountKind} profile, but LinkedIn page exports come from a company page. If these files belong to the
              company page, its posts, visitors and followers will be stored under {accountName} and combined with this profile’s results.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirming(false)
                run(true)
              }}
            >
              Import into {accountName} anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Section>
  )
}
