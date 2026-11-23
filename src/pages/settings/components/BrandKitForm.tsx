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
  { key: 'services', label: 'Services', hint: 'What AVAIBE actually sells, one per line. Claude only suggests ideas around these.', rows: 5 },
  { key: 'target_segments', label: 'Target audiences', hint: 'Who the ideas should reach.', rows: 4 },
  { key: 'differentiators', label: 'What makes AVAIBE different', hint: 'Real strengths a customer would recognise.', rows: 4 },
  { key: 'proof_points', label: 'Proof points', hint: 'Projects, clients, results. Mark anything that needs permission before naming it.', rows: 4 },
  { key: 'avoid', label: 'Avoid', hint: 'Claims, topics or tactics Claude must never suggest.', rows: 4 },
  { key: 'languages', label: 'Languages', hint: 'e.g. English, Arabic. Max 5.', rows: 2 },
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
    save.mutate({ section: 'brand', body }, { onSuccess: () => toast.success('Brand kit saved. Claude uses it from the next run.'), onError: (e) => toast.error(e.message) })
  }
  const reset = () =>
    save.mutate({ section: 'brand', reset: true }, { onSuccess: () => toast.success('Restored the starting brand notes'), onError: (e) => toast.error(e.message) })

  return (
    <Section icon={Palette}
      title="What Claude should know about the brand"
      description="Only what LinkedIn doesn’t hold: services, voice, strengths and what to avoid. Set once; Claude reads it with every idea run. Don’t put passwords, personal data or confidential deal details here."
      actions={
        canEdit ? (
          <Button size="sm" variant="ghost" onClick={reset} disabled={save.isPending}>
            <RotateCcw /> Restore starting notes
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
              <p className="mt-1 text-xs text-muted-foreground">{lines(lists[f.key]).length} entries · one per line</p>
            </div>
          ))}
        </div>
        {lines(lists.services).length === 0 && (
          <p className="rounded-md border border-serious/35 bg-serious/5 px-3 py-2 text-xs">
            <strong>Services is empty.</strong> Without it suggestions have to guess what AVAIBE sells, and ideas will be more generic. Ask the
            team for the official service list.
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
