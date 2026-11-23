import { ImagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SimpleSelect } from '@/components/common'
import { getPlannedImageUrl, type PlannedDetails, type PlannedFormat, type PlannedPost } from '@/lib/api'
import { FilePreview, MediaPicker } from './MediaPicker'
import { DURATION_LABELS } from '../constants'

export function FormatFields(props: {
  format: PlannedFormat
  details: PlannedDetails
  setDetail: <K extends keyof PlannedDetails>(k: K, v: PlannedDetails[K]) => void
  media: File | null
  setMedia: (f: File | null) => void
  initial?: PlannedPost
  file: File | null
  setFile: (f: File | null) => void
  removeImage: boolean
  setRemoveImage: (v: boolean) => void
  imageAlt: string
  setImageAlt: (v: string) => void
}) {
  const { format, details, setDetail, media, setMedia, initial, file, setFile, removeImage, setRemoveImage, imageAlt, setImageAlt } = props
  if (format === 'image') {
    return (
      <div>
        <Label className="mb-2 block font-semibold">Image</Label>
        {initial?.has_image && !removeImage && !file && (
          <div className="mb-2 flex items-center gap-3">
            <img src={getPlannedImageUrl(initial.id, initial.approved_at ?? 'x')} alt="" className="size-16 rounded-lg object-cover" />
            <Button size="xs" variant="outline" onClick={() => setRemoveImage(true)}>
              Remove image
            </Button>
          </div>
        )}
        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed px-3 py-3 text-sm text-muted-foreground hover:bg-muted">
          <ImagePlus className="size-4" />
          {file ? file.name : initial?.has_image && !removeImage ? 'Replace image (JPG, PNG or GIF, max 10 MB)' : 'Add an image (JPG, PNG or GIF, max 10 MB)'}
          <input type="file" accept="image/jpeg,image/png,image/gif" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        {(file || (initial?.has_image && !removeImage)) && (
          <Input
            className="mt-2 h-10 rounded-xl"
            value={imageAlt}
            onChange={(e) => setImageAlt(e.target.value)}
            placeholder="Alt text: describe the image for screen readers"
          />
        )}
        {file && <FilePreview file={file} />}
      </div>
    )
  }
  if (format === 'carousel') {
    return (
      <div className="space-y-2">
        <Label className="block font-semibold">Carousel</Label>
        <Input
          value={details.document_title ?? ''}
          onChange={(e) => setDetail('document_title', e.target.value)}
          maxLength={100}
          className="h-10 rounded-xl"
          placeholder="Document title shown on LinkedIn, e.g. 5 signs your school has outgrown its LMS"
        />
        <MediaPicker
          accept="application/pdf"
          label="the PDF (up to 100 MB)"
          file={media}
          onFile={setMedia}
          current={initial?.has_media ? initial : undefined}
        />
        <p className="text-xs text-muted-foreground">LinkedIn carousels are PDF documents: one slide per page. Make the first slide the hook.</p>
      </div>
    )
  }
  if (format === 'video') {
    return (
      <div className="space-y-2">
        <Label className="block font-semibold">Video</Label>
        <MediaPicker
          accept="video/mp4,video/quicktime"
          label="the video (MP4 or MOV, up to 200 MB)"
          file={media}
          onFile={setMedia}
          current={initial?.has_media ? initial : undefined}
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!details.subtitles} onChange={(e) => setDetail('subtitles', e.target.checked)} />
          Subtitles added (many people watch with the sound off)
        </label>
      </div>
    )
  }
  if (format === 'article') {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="mb-2 block font-semibold">Article / newsletter title</Label>
          <Input
            value={details.title ?? ''}
            onChange={(e) => setDetail('title', e.target.value)}
            maxLength={150}
            className="h-10 rounded-xl"
            placeholder="e.g. Gulf business-tech brief: November"
          />
        </div>
        <div>
          <Label className="mb-2 block font-semibold">Link (if already published)</Label>
          <Input value={details.link ?? ''} onChange={(e) => setDetail('link', e.target.value)} className="h-10 rounded-xl" placeholder="https://…" />
        </div>
      </div>
    )
  }
  if (format === 'poll') {
    return (
      <div className="space-y-2">
        <Label className="block font-semibold">
          Poll question <span className="text-bad-fg">*</span>
        </Label>
        <Input
          value={details.question ?? ''}
          onChange={(e) => setDetail('question', e.target.value)}
          maxLength={140}
          className="h-10 rounded-xl"
          placeholder="e.g. What slows down your ERP project most?"
        />
        <div className="grid gap-2 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Input
              key={i}
              value={details.options?.[i] ?? ''}
              maxLength={30}
              className="h-10 rounded-xl"
              placeholder={`Option ${i + 1}${i < 2 ? ' *' : ' (optional)'}`}
              onChange={(e) => {
                const next = [...(details.options ?? [])]
                while (next.length <= i) next.push('')
                next[i] = e.target.value
                setDetail('options', next)
              }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Runs for</span>
          <SimpleSelect
            value={details.duration ?? '1w'}
            onChange={(v) => setDetail('duration', v as PlannedDetails['duration'])}
            options={Object.entries(DURATION_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
          />
        </div>
        <p className="text-xs text-muted-foreground">LinkedIn polls: question up to 140 characters, 2 to 4 options of up to 30 characters.</p>
      </div>
    )
  }
  return null
}
