import { useState } from 'react'
import { toast } from 'sonner'
import { Palette, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Section } from '@/components/common'
import { useAuth } from '@/context/auth'
import type { BrandSettings } from '@/lib/api'
import { useSaveSettings } from '@/pages/settings/queries'

type BrandList = 'services' | 'target_segments' | 'differentiators' | 'proof_points' | 'avoid' | 'languages'

const BRAND_LISTS: { key: BrandList; label: string; hint: string; rows: number }[] = [
  { key: 'services', label: 'Services', hint: 'Services the company offers. Ideas are limited to these.', rows: 5 },
  { key: 'target_segments', label: 'Target audiences', hint: 'Audiences the content should reach.', rows: 4 },
  { key: 'differentiators', label: 'Differentiators', hint: 'Strengths customers would recognise.', rows: 4 },
  { key: 'proof_points', label: 'Proof points', hint: 'Projects, clients and results. Mark items that require permission before naming.', rows: 4 },
  { key: 'avoid', label: 'Avoid', hint: 'Claims, topics or tactics Claude must not suggest.', rows: 4 },
  { key: 'languages', label: 'Languages', hint: 'For example, English and Arabic. Up to 5.', rows: 2 },
]

export function BrandKitForm({ current }: { current: BrandSettings }) {
  const save = useSaveSettings()
  const auth = useAuth()
  const canEdit = auth.can('admin')
  const [summary, setSummary] = useState(current.company_summary)
  const [website, setWebsite] = useState(current.website)
  const [voice, setVoice] = useState(current.voice)
  const [lists, setLists] = useState<Record<BrandList, string>>(
    () => Object.fromEntries(BRAND_LISTS.map((f) => [f.key, current[f.key].join('\n')])) as Record<BrandList, string>,
  )
  const lines = (t: string) => t.split('\n').map((s) => s.trim()).filter(Boolean)

  const submit = () => {
    const body: BrandSettings = {
      ...current,
      company_summary: summary,
      website,
      voice,
      ...(Object.fromEntries(BRAND_LISTS.map((f) => [f.key, lines(lists[f.key])])) as Record<BrandList, string[]>),
    }
    save.mutate({ section: 'brand', body }, { onSuccess: () => toast.success('Brand kit saved'), onError: (e) => toast.error(e.message) })
  }
  const reset = () =>
    save.mutate({ section: 'brand', reset: true }, { onSuccess: () => toast.success('Default brand kit restored'), onError: (e) => toast.error(e.message) })

  return (
    <Section icon={Palette}
      title="Brand kit"
      description="Context Claude uses for every run: services, voice, strengths and restrictions. Do not include passwords, personal data or confidential deal details."
      actions={
        canEdit ? (
          <Button size="sm" variant="ghost" onClick={reset} disabled={save.isPending}>
            <RotateCcw /> Restore defaults
          </Button>
        ) : undefined
      }
    >
      <fieldset disabled={!canEdit} className="space-y-4">
        {!canEdit && <p className="text-xs text-muted-foreground">Only admins can change the brand kit.</p>}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label className="mb-1.5 block">Company summary</Label>
            <Textarea rows={3} maxLength={1500} value={summary} onChange={(e) => setSummary(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block">Website</Label>
            <Input value={website} maxLength={300} onChange={(e) => setWebsite(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block">Brand voice</Label>
            <Textarea rows={2} maxLength={1000} value={voice} onChange={(e) => setVoice(e.target.value)} />
          </div>
          {BRAND_LISTS.map((f) => (
            <div key={f.key}>
              <Label className="mb-1 block">{f.label}</Label>
              <p className="mb-1.5 text-xs text-muted-foreground">{f.hint}</p>
              <Textarea rows={f.rows} value={lists[f.key]} onChange={(e) => setLists({ ...lists, [f.key]: e.target.value })} className="text-xs" />
              <p className="mt-1 text-xs text-muted-foreground">{lines(lists[f.key]).length} entries · One per line</p>
            </div>
          ))}
        </div>
        {lines(lists.services).length === 0 && (
          <p className="rounded-md border border-serious/35 bg-serious/5 px-3 py-2 text-xs">
            <strong>No services listed.</strong> Ideas will be less specific until the company’s services are added.
          </p>
        )}
        {canEdit && (
          <Button onClick={submit} disabled={save.isPending}>
            {save.isPending ? 'Saving…' : 'Save brand kit'}
          </Button>
        )}
      </fieldset>
    </Section>
  )
}
