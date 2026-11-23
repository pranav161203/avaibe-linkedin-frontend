import { useState } from 'react'
import { Globe } from 'lucide-react'
import type { PlannedDetails, PlannedFormat } from '@/lib/api'
import { hookPreview } from '../utils'

export function FeedPreview({
  accountName,
  caption,
  format,
  details,
  imageSrc,
  hasStoredImage = false,
}: {
  accountName: string
  caption: string
  format: PlannedFormat
  details: PlannedDetails
  imageSrc?: string | null
  hasStoredImage?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const short = hookPreview(caption)
  const cut = short.endsWith('…') || caption.trim().split('\n').length > 3
  const letters = accountName
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return (
    <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
      <div className="flex items-center gap-3 px-4 pt-4">
        <span className="flex size-11 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">{letters}</span>
        <div className="leading-tight">
          <div className="text-sm font-semibold">{accountName}</div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            Now · <Globe className="size-3" />
          </div>
        </div>
      </div>
      <div className="px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
        {expanded || !cut ? caption : short.replace(/…$/, '')}
        {cut && !expanded && (
          <button type="button" onClick={() => setExpanded(true)} className="ml-1 text-muted-foreground hover:underline">
            …see more
          </button>
        )}
      </div>
      {format === 'image' && (imageSrc || hasStoredImage) && (
        <div className="border-t bg-muted/40">
          {imageSrc ? (
            <img src={imageSrc} alt="" className="max-h-80 w-full object-cover" />
          ) : (
            <div className="py-10 text-center text-xs text-muted-foreground">Saved image</div>
          )}
        </div>
      )}
      {format === 'carousel' && (
        <div className="border-t bg-muted/40 py-10 text-center text-xs text-muted-foreground">PDF carousel: {details.document_title || 'untitled'}</div>
      )}
      {format === 'video' && <div className="border-t bg-muted/40 py-10 text-center text-xs text-muted-foreground">Video</div>}
      {format === 'article' && <div className="border-t bg-muted/40 px-4 py-4 text-sm font-semibold">{details.title || 'Article title'}</div>}
      {format === 'poll' && (
        <div className="space-y-2 border-t px-4 py-4">
          <div className="text-sm font-semibold">{details.question || 'Poll question'}</div>
          {(details.options ?? [])
            .filter((o) => o.trim())
            .map((o) => (
              <div key={o} className="rounded-full px-4 py-1.5 text-center text-sm font-medium text-primary ring-1 ring-primary">
                {o}
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
