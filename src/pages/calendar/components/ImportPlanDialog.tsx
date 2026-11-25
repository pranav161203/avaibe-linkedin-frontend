/**
 * New post → Import from Excel. Three steps in one window: get the template, fill it, upload.
 * The file is checked first (nothing saved); only then "Import N posts" saves the ready rows as Unpublished.
 */
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CircleAlert, CircleCheck, Copy, Download, FileSpreadsheet, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useTz } from '@/context/timezone'
import { importPlan, PLAN_TEMPLATE_URL, POST_GOALS, type PlanImportResult } from '@/lib/api'
import { cn } from '@/lib/utils'
import { invalidatePlanned } from '@/pages/publishing/queries'

const FORMAT_NAME: Record<string, string> = { text: 'Text', image: 'Image', carousel: 'Carousel', video: 'Video', article: 'Article', poll: 'Poll' }

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{n}</span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{title}</div>
        <div className="mt-1 text-sm text-muted-foreground">{children}</div>
      </div>
    </li>
  )
}

export function ImportPlanDialog({ accountId, accountName, onClose }: { accountId: number; accountName: string; onClose: () => void }) {
  const tz = useTz()
  const navigate = useNavigate()
  const input = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [check, setCheck] = useState<PlanImportResult | null>(null)

  const run = useMutation({ mutationFn: importPlan })
  const checkFile = (f: File) => {
    setFile(f)
    setCheck(null)
    run.mutate({ accountId, file: f, confirm: false }, { onSuccess: setCheck, onError: (e) => toast.error(e.message) })
  }
  const doImport = () =>
    file &&
    run.mutate(
      { accountId, file, confirm: true },
      {
        onSuccess: (r) => {
          invalidatePlanned(accountId)
          const refs = r.refs.length > 1 ? ` (${r.refs[0]} to ${r.refs[r.refs.length - 1]})` : r.refs.length ? ` (${r.refs[0]})` : ''
          toast.success(`Imported ${r.created} post${r.created === 1 ? '' : 's'}${refs}`, {
            description: 'Added to Publishing as unpublished. Review each post and add media before scheduling.',
            action: { label: 'Open Publishing', onClick: () => navigate('/publishing') },
          })
          onClose()
        },
        onError: (e) => toast.error(e.message),
      },
    )

  const goal = (g: string | null) => POST_GOALS.find((x) => x.value === g)?.label ?? '—'
  const problems = check?.rows.filter((r) => r.status !== 'ready') ?? []
  const ready = check?.rows.filter((r) => r.status === 'ready') ?? []

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-x-hidden overflow-y-auto sm:max-w-xl [&>*]:min-w-0">
        <DialogHeader>
          <DialogTitle>Import posts from Excel</DialogTitle>
          <DialogDescription>
            Plan many posts at once for <b className="font-medium text-foreground">{accountName}</b>. Each one is added as Unpublished, so nothing goes out until you schedule or
            publish it.
          </DialogDescription>
        </DialogHeader>

        <ol className="space-y-4">
          <Step n={1} title="Download the template">
            <p>An Excel template with Format, Goal and Visibility options, instructions and an example.</p>
            <a href={PLAN_TEMPLATE_URL} download className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-lg border bg-card px-3 text-sm font-medium text-foreground hover:bg-accent">
              <Download className="size-4" /> avaibe_post_plan_template.xlsx
            </a>
          </Step>

          <Step n={2} title="Add one row per post on the Posts sheet">
            <ul className="list-disc space-y-1 pl-4 text-[13px]">
              <li>
                <b className="font-medium text-foreground">Required:</b> Format, Goal and Post text.
              </li>
              <li>
                <b className="font-medium text-foreground">To schedule:</b> Date and Time in UAE time, like <span className="tabular-nums">2026-12-02</span> and{' '}
                <span className="tabular-nums">10:30</span>. Leave both empty to keep a post unscheduled.
              </li>
              <li>
                <b className="font-medium text-foreground">Polls and articles:</b> use their dedicated columns (separate poll options with ;).
              </li>
              <li>Images, PDFs and videos are added to each post after import.</li>
              <li>Do not change the column headings. Maximum 200 posts per file.</li>
            </ul>
          </Step>

          <Step n={3} title="Upload and validate">
            <p>The file is validated first. Nothing is saved until you select Import.</p>
            <input
              ref={input}
              type="file"
              accept=".xlsx,.csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) checkFile(f)
                e.target.value = ''
              }}
            />
            <button
              type="button"
              onClick={() => input.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const f = e.dataTransfer.files?.[0]
                if (f) checkFile(f)
              }}
              className="mt-2 flex w-full items-center gap-3 rounded-xl border border-dashed bg-muted/30 px-4 py-3 text-left transition-colors hover:bg-accent"
            >
              {file ? <FileSpreadsheet className="size-5 shrink-0 text-primary" /> : <Upload className="size-5 shrink-0" />}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">{file ? file.name : 'Select a file or drop it here'}</span>
                <span className="block text-xs">{file ? (run.isPending && !check ? 'Checking…' : 'Select a different file') : '.xlsx or .csv with the same columns'}</span>
              </span>
            </button>
          </Step>
        </ol>

        {check && (
          <div className="space-y-3 rounded-xl bg-muted/40 p-4">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <span className="inline-flex items-center gap-1.5 font-medium text-good-fg">
                <CircleCheck className="size-4" /> {check.ready} ready
              </span>
              {check.errors > 0 && (
                <span className="inline-flex items-center gap-1.5 font-medium text-bad-fg">
                  <CircleAlert className="size-4" /> {check.errors} need fixing
                </span>
              )}
              {check.duplicates > 0 && (
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Copy className="size-4" /> {check.duplicates} already planned
                </span>
              )}
            </div>

            {problems.length > 0 && (
              <ul className="max-h-40 space-y-1.5 overflow-y-auto text-[13px]">
                {problems.map((r) => (
                  <li key={r.row} className={cn(r.status === 'duplicate' && 'text-muted-foreground')}>
                    <b className="font-medium tabular-nums">Row {r.row}</b>
                    {r.caption && <span className="text-muted-foreground"> · “{r.caption.slice(0, 40)}{r.caption.length > 40 ? '…' : ''}”</span>}: {r.problems.join('; ')}
                  </li>
                ))}
              </ul>
            )}
            {check.errors > 0 && <p className="text-xs text-muted-foreground">Correct these rows and upload again, or import the valid rows now.</p>}

            {ready.length > 0 && (
              <div className="overflow-hidden rounded-lg bg-card ring-1 ring-border">
                <table className="w-full table-fixed text-xs">
                  <colgroup>
                    <col className="w-32" />
                    <col className="w-18" />
                    <col className="w-28" />
                    <col />
                  </colgroup>
                  <tbody>
                    {ready.slice(0, 6).map((r) => (
                      <tr key={r.row} className="border-b last:border-0">
                        <td className="truncate px-3 py-2 text-muted-foreground tabular-nums">{r.scheduled_at ? tz.dateTime(r.scheduled_at) : 'Not scheduled'}</td>
                        <td className="truncate px-2 py-2">{FORMAT_NAME[r.format ?? ''] ?? r.format}</td>
                        <td className="truncate px-2 py-2 text-muted-foreground">{goal(r.goal)}</td>
                        <td className="truncate px-3 py-2" title={r.caption}>
                          {r.caption}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {ready.length > 6 && <div className="border-t px-3 py-1.5 text-xs text-muted-foreground">and {ready.length - 6} more</div>}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={doImport} disabled={!check || check.ready === 0 || run.isPending}>
            {run.isPending && check ? 'Importing…' : check && check.ready > 0 ? `Import ${check.ready} post${check.ready === 1 ? '' : 's'}` : 'Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
