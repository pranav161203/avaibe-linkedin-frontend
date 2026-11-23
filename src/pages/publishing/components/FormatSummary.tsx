import { ExternalLink, FileText, ListChecks } from 'lucide-react'
import { getPlannedMediaUrl, type PlannedPost } from '@/lib/api'
import { DURATION_LABELS } from '@/pages/create-post/constants'

export function FormatSummary({ p }: { p: PlannedPost }) {
  const d = p.details
  if (p.format === 'poll' && d.question) {
    return (
      <div className="mt-3 rounded-md border px-3 py-2 text-sm">
        <div className="flex items-center gap-1.5 font-medium">
          <ListChecks className="size-4 text-muted-foreground" /> {d.question}
        </div>
        <ul className="mt-1 ml-6 list-disc text-muted-foreground">
          {(d.options ?? []).map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
        {d.duration && <p className="mt-1 text-xs text-muted-foreground">Runs for {DURATION_LABELS[d.duration]}</p>}
      </div>
    )
  }
  if (p.format === 'article' && (d.title || d.link)) {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm">
        <FileText className="size-4 text-muted-foreground" />
        {d.title && <span className="font-medium">{d.title}</span>}
        {d.link && (
          <a href={d.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground underline">
            {d.link} <ExternalLink className="size-3" />
          </a>
        )}
      </div>
    )
  }
  if ((p.format === 'carousel' || p.format === 'video') && (p.has_media || d.document_title || d.subtitles !== undefined)) {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border px-3 py-2 text-sm">
        <FileText className="size-4 text-muted-foreground" />
        {d.document_title && <span className="font-medium">{d.document_title}</span>}
        {p.has_media ? (
          <a href={getPlannedMediaUrl(p.id)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs underline">
            {p.media_name ?? 'Open file'} <ExternalLink className="size-3" />
          </a>
        ) : (
          <span className="text-xs text-warn-fg">No file attached yet</span>
        )}
        {p.format === 'video' && (
          <span className="text-xs text-muted-foreground">{d.subtitles ? 'Subtitles added' : 'No subtitles yet (many people watch on mute)'}</span>
        )}
      </div>
    )
  }
  return null
}
