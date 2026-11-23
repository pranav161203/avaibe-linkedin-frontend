import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SimpleSelect } from '@/components/common'
import type { Competitor, CompetitorSegment } from '@/lib/api'
import { SEGMENTS } from '../constants'

export function CompetitorDialog({
  initial,
  saving,
  onClose,
  onSave,
}: {
  initial?: Competitor
  saving: boolean
  onClose: () => void
  onSave: (c: Competitor) => void
}) {
  const [c, setC] = useState<Competitor>(
    initial ?? { id: Math.random().toString(36).slice(2, 12), name: '', segment: 'software' },
  )
  const set = <K extends keyof Competitor>(k: K, v: Competitor[K]) => setC((x) => ({ ...x, [k]: v }))
  const text = (k: keyof Competitor) => (e: { target: { value: string } }) => set(k, (e.target.value || null) as never)
  const num = (k: 'followers' | 'posts_per_week') => (e: { target: { value: string } }) =>
    set(k, e.target.value === '' ? null : Number(e.target.value))

  const submit = () => {
    if (!c.name.trim()) return toast.error('Give the competitor a name')
    for (const k of ['website', 'linkedin_url'] as const) {
      const v = c[k]
      if (v && !/^https?:\/\/\S+$/.test(v)) return toast.error(`${k === 'website' ? 'Website' : 'LinkedIn'} must be a full link starting with https://`)
    }
    onSave({ ...c, name: c.name.trim() })
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initial ? `Edit ${initial.name}` : 'Add competitor'}</DialogTitle>
          <DialogDescription>Keep what you observed publicly apart from your own interpretation.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block">Name *</Label>
              <Input value={c.name} maxLength={120} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 block">Type</Label>
              <SimpleSelect
                value={c.segment}
                onChange={(v) => set('segment', v as CompetitorSegment)}
                options={Object.entries(SEGMENTS).map(([value, label]) => ({ value, label }))}
                className="h-8 w-full"
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Website</Label>
              <Input value={c.website ?? ''} onChange={text('website')} placeholder="https://…" />
            </div>
            <div>
              <Label className="mb-1.5 block">LinkedIn page</Label>
              <Input value={c.linkedin_url ?? ''} onChange={text('linkedin_url')} placeholder="https://www.linkedin.com/company/…" />
            </div>
          </div>

          <div>
            <div className="mb-2 text-sm font-medium">Observed (public)</div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label className="mb-1.5 block text-xs">Followers</Label>
                <Input type="number" min={0} value={c.followers ?? ''} onChange={num('followers')} />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs">Posts per week (approx.)</Label>
                <Input type="number" min={0} step="0.5" value={c.posts_per_week ?? ''} onChange={num('posts_per_week')} />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs">Checked on</Label>
                <Input type="date" value={c.checked_on ?? ''} onChange={text('checked_on')} />
              </div>
              <div className="sm:col-span-3">
                <Label className="mb-1.5 block text-xs">Main topics they post about</Label>
                <Input value={c.topics ?? ''} maxLength={400} onChange={text('topics')} placeholder="e.g. ERP case studies, VAT, hiring" />
              </div>
              <div className="sm:col-span-3">
                <Label className="mb-1.5 block text-xs">How they describe themselves (their tagline or About)</Label>
                <Textarea rows={2} value={c.positioning ?? ''} maxLength={600} onChange={text('positioning')} />
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 text-sm font-medium">Our view (interpretation)</div>
            <div className="grid gap-3">
              <div>
                <Label className="mb-1.5 block text-xs">What they do well</Label>
                <Textarea rows={2} value={c.strengths ?? ''} maxLength={600} onChange={text('strengths')} />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs">Where AVAIBE can be different</Label>
                <Textarea rows={2} value={c.opportunity ?? ''} maxLength={600} onChange={text('opportunity')} />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {initial ? 'Save' : 'Add competitor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
