import { useState } from 'react'
import { toast } from 'sonner'
import { RotateCcw, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Section } from '@/components/common'
import type { SegmentSettings } from '@/lib/api'
import { SEGMENT_FIELDS } from '../constants'
import { toText, toList } from '../utils'
import { useSaveSettings } from '@/pages/settings/queries'

export function AudienceTab({ current }: { current: SegmentSettings }) {
  const save = useSaveSettings()
  const [draft, setDraft] = useState<Record<keyof SegmentSettings, string>>(() => {
    const out = {} as Record<keyof SegmentSettings, string>
    for (const f of SEGMENT_FIELDS) out[f.key] = toText(current[f.key])
    return out
  })

  const submit = () => {
    const body = Object.fromEntries(SEGMENT_FIELDS.map((f) => [f.key, toList(draft[f.key])])) as unknown as SegmentSettings
    save.mutate(
      { section: 'segments', body },
      { onSuccess: () => toast.success('Audience definitions saved'), onError: (e) => toast.error(e.message) },
    )
  }
  const reset = () =>
    save.mutate(
      { section: 'segments', reset: true },
      { onSuccess: () => toast.success('Default definitions restored'), onError: (e) => toast.error(e.message) },
    )

  return (
    <Section icon={Target}
      title="Target audience definitions"
      description="These keywords determine the UAE, education and decision-maker shares across the app. Matching is case-insensitive and partial: “dubai” matches “Dubai, United Arab Emirates”. Enter one keyword per line."
      actions={
        <Button size="sm" variant="ghost" onClick={reset} disabled={save.isPending}>
          <RotateCcw /> Restore defaults
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        {SEGMENT_FIELDS.map((f) => (
          <div key={f.key}>
            <Label className="mb-1 block">{f.label}</Label>
            <p className="mb-1.5 text-xs text-muted-foreground">{f.hint}</p>
            <Textarea rows={6} value={draft[f.key]} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} className="font-mono text-xs" />
            <p className="mt-1 text-xs text-muted-foreground">{toList(draft[f.key]).length} entries</p>
          </div>
        ))}
      </div>
      <p className="mt-4 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        Changes apply to all existing posts immediately. Shares and estimates are recalculated from stored data.
      </p>
      <Button className="mt-4" onClick={submit} disabled={save.isPending}>
        {save.isPending ? 'Saving…' : 'Save definitions'}
      </Button>
    </Section>
  )
}
