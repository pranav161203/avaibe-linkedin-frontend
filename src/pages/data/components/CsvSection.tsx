import { useState } from 'react'
import { toast } from 'sonner'
import { Download, FileText, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Section } from '@/components/common'
import type { ImportResult } from '@/lib/api'
import { useImportCsv } from '@/pages/data/queries'

export function CsvSection({ accountId, accountName }: { accountId?: number; accountName?: string }) {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const imp = useImportCsv(accountId ?? 0)

  return (
    <Section icon={FileText}
      title="App CSV template"
      description="For posts LinkedIn can't export (e.g. founder profiles) or snapshots kept elsewhere. One row = one post at one checkpoint; rows with the same post URL update that post."
    >
      <a href="/api/import/template" download className="inline-flex items-center gap-1.5 text-sm underline">
        <Download className="size-4" /> linkedin_posts_template.csv
      </a>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
        <li>Dates are UAE time as YYYY-MM-DD HH:MM. Leave metrics blank if LinkedIn doesn&apos;t report them.</li>
        <li>
          <b>format</b>: image, carousel, video, poll, newsletter or text
        </li>
        <li>
          <b>checkpoint</b>: 1h, 6h, 24h, 48h or 7d. Add one row per checkpoint for the same post URL.
        </li>
        <li>
          <b>hashtags</b>: space-separated; <b>keywords</b>: separated with semicolons
        </li>
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Input type="file" accept=".csv,text/csv" className="max-w-sm" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <Button
          variant="outline"
          disabled={!file || !accountId || imp.isPending}
          onClick={() =>
            file &&
            imp.mutate(file, {
              onSuccess: (r) => {
                setResult(r)
                toast.success(`Imported: ${r.posts_created} new, ${r.posts_updated} updated`)
              },
              onError: (e) => toast.error(e.message),
            })
          }
        >
          <Upload /> {imp.isPending ? 'Importing…' : `Import into ${accountName ?? '…'}`}
        </Button>
      </div>
      {result && (
        <div className="mt-4 space-y-2 text-sm">
          <p>
            {result.posts_created} posts created · {result.posts_updated} updated · {result.snapshots_saved} snapshots saved
          </p>
          {result.errors.length > 0 && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3">
              <p className="mb-1 font-medium">{result.errors.length} rows skipped</p>
              <ul className="space-y-0.5 text-xs">
                {result.errors.map((e) => (
                  <li key={e.row}>
                    Row {e.row}: {e.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Section>
  )
}
