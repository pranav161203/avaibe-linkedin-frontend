import { useEffect, useState } from 'react'
import { ExternalLink, Upload } from 'lucide-react'
import { getPlannedMediaUrl, type PlannedPost } from '@/lib/api'

export function FilePreview({ file }: { file: File }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    const u = URL.createObjectURL(file)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [file])
  return url ? <img src={url} alt="" className="mt-2 max-h-48 rounded-lg ring-1 ring-border" /> : null
}

export function MediaPicker({
  accept,
  label,
  file,
  onFile,
  current,
}: {
  accept: string
  label: string
  file: File | null
  onFile: (f: File | null) => void
  current?: PlannedPost
}) {
  return (
    <div>
      {current && !file && (
        <a href={getPlannedMediaUrl(current.id)} target="_blank" rel="noreferrer" className="mb-2 inline-flex items-center gap-1 text-xs underline">
          Current file: {current.media_name ?? 'open'} <ExternalLink className="size-3" />
        </a>
      )}
      <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed px-3 py-3 text-sm text-muted-foreground hover:bg-muted">
        <Upload className="size-4" />
        {file ? file.name : current ? `Replace ${label}` : `Attach ${label} for the approver to review`}
        <input type="file" accept={accept} className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
      </label>
    </div>
  )
}
