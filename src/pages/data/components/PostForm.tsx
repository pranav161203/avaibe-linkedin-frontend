import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SimpleSelect } from '@/components/common'
import { isoToZonedInput, nowZonedInput, UAE, useTz, zonedInputToIso, zoneLabel } from '@/context/timezone'
import { FORMATS, type Post, type PostFormat, type PostInput } from '@/lib/api'
import { FORMAT_LABELS } from '@/lib/format'

function splitList(v: string, onSpaces = false): string[] {
  const re = onSpaces ? /[;,\s]+/ : /[;,]+/
  return v.split(re).map((s) => s.trim()).filter(Boolean)
}

export function PostForm({ accountId, initial, onSubmit, submitting, submitLabel }: {
  accountId: number
  initial?: Post
  onSubmit: (body: PostInput) => void
  submitting: boolean
  submitLabel: string
}) {
  const tz = useTz()
  // Lock the zone for this form: switching zones mid-edit must not silently reinterpret the typed time
  const [zone] = useState(tz.zone)
  const [f, setF] = useState({
    post_url: initial?.post_url ?? '',
    author: initial?.author ?? '',
    published_at: initial ? isoToZonedInput(initial.published_at, zone) : nowZonedInput(zone),
    format: (initial?.format ?? 'image') as PostFormat,
    topic: initial?.topic ?? '',
    industry: initial?.industry ?? '',
    keywords: initial?.keywords.join('; ') ?? '',
    cta: initial?.cta ?? '',
    hashtags: initial?.hashtags.join(' ') ?? '',
    caption: initial?.caption ?? '',
    notes: initial?.notes ?? '',
  })
  // Imported posts only have a date. Changing the time here means someone knows it.
  const [timeKnown, setTimeKnown] = useState(initial?.time_known ?? true)
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })
  const orNull = (s: string) => (s.trim() ? s.trim() : null)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit({
      account_id: accountId,
      post_url: orNull(f.post_url),
      author: orNull(f.author),
      published_at: zonedInputToIso(f.published_at, zone),
      time_known: timeKnown,
      format: f.format,
      topic: orNull(f.topic),
      industry: orNull(f.industry),
      keywords: splitList(f.keywords),
      cta: orNull(f.cta),
      hashtags: splitList(f.hashtags, true),
      caption: orNull(f.caption),
      notes: orNull(f.notes),
    })
  }

  return (
    <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
      <Field label="LinkedIn post URL" className="md:col-span-2">
        <Input value={f.post_url} onChange={set('post_url')} placeholder="https://www.linkedin.com/feed/update/urn:li:activity:…" />
      </Field>
      <Field
        label={`Published at (${zoneLabel(zone)} time) *`}
        hint={
          !timeKnown
            ? 'Imported from LinkedIn: the date is accurate but the time is a placeholder. Set the actual time to include this post in the posting-time heatmap.'
            : zone !== UAE && f.published_at
              ? `= ${isoToZonedInput(zonedInputToIso(f.published_at, zone), UAE).replace('T', ' ')} UAE`
              : undefined
        }
      >
        <Input
          type="datetime-local"
          required
          value={f.published_at}
          onChange={(e) => {
            setF({ ...f, published_at: e.target.value })
            setTimeKnown(true)
          }}
        />
      </Field>
      <Field label="Format *">
        <SimpleSelect
          value={f.format}
          onChange={(v) => setF({ ...f, format: v as PostFormat })}
          options={FORMATS.map((x) => ({ value: x, label: FORMAT_LABELS[x] }))}
          className="h-8 w-full"
        />
      </Field>
      <Field
        label="Topic"
        hint={initial?.topic_suggested ? 'Topic and CTA were suggested from the caption. Review and save to confirm.' : undefined}
      >
        <Input value={f.topic} onChange={set('topic')} placeholder="e.g. ERP challenges for UAE traders" />
      </Field>
      <Field label="Industry">
        <Input value={f.industry} onChange={set('industry')} placeholder="e.g. Education, Trading, Construction" />
      </Field>
      <Field label="Call to action">
        <Input value={f.cta} onChange={set('cta')} placeholder="e.g. Comment 'ERP' for the checklist" />
      </Field>
      <Field label="Author">
        <Input value={f.author} onChange={set('author')} placeholder="e.g. AVAIBE" />
      </Field>
      <Field label="Hashtags" hint="Space or comma separated">
        <Input value={f.hashtags} onChange={set('hashtags')} placeholder="#erp #uae #smes" />
      </Field>
      <Field label="Keywords" hint="Separate with ; or ,">
        <Input value={f.keywords} onChange={set('keywords')} placeholder="inventory management; VAT" />
      </Field>
      <Field label="Caption" className="md:col-span-2">
        <Textarea rows={5} value={f.caption} onChange={set('caption')} placeholder="Paste the post text. The first line is the hook." />
      </Field>
      <Field label="Notes" className="md:col-span-2">
        <Textarea rows={2} value={f.notes} onChange={set('notes')} placeholder="Notable context, e.g. boosted, reshared by founders, published late" />
      </Field>
      <div className="md:col-span-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}

function Field({ label, hint, className, children }: { label: string; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
