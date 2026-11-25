import { useState } from 'react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { ChevronDown } from 'lucide-react'
import { SimpleSelect } from '@/components/common'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { todayUae } from '@/components/period'
import { useAccount } from '@/context/account'
import { isoToZonedInput, UAE, zonedInputToIso } from '@/context/timezone'
import type { Lead, LeadInput, LeadSource, LeadStage } from '@/lib/api'
import { cn } from '@/lib/utils'
import { SOURCE_LABEL, STAGE_LABEL, STAGES } from '../constants'
import { toInput } from '../utils'
import { useGetPosts } from '@/pages/data/queries'
import { useSaveLead } from '@/pages/leads/queries'

export function LeadDialog({ accountId, initial, onClose }: { accountId: number; initial?: Lead; onClose: () => void }) {
  const { accounts, account } = useAccount()
  const { data: posts = [] } = useGetPosts(accountId)
  const save = useSaveLead(accountId)
  const root = account?.parent_id ?? account?.id
  const profiles = accounts.filter((a) => a.id === root || a.parent_id === root)
  const [f, setF] = useState<LeadInput>(
    initial
      ? toInput(initial)
      : {
          account_id: accountId,
          received_on: todayUae(),
          source: 'company_post',
          post_id: null,
          via_account_id: null,
          company: '',
          industry: null,
          in_uae: null,
          role: null,
          decision_maker: null,
          service: null,
          stage: 'new',
          value_aed: null,
          closed_on: null,
          notes: null,
          how_heard: null,
          utm_source: null,
          utm_medium: null,
          utm_campaign: null,
          replied_at: null,
          qualified: null,
        },
  )
  const [more, setMore] = useState(!!initial)
  const set = <K extends keyof LeadInput>(k: K, v: LeadInput[K]) => setF((x) => ({ ...x, [k]: v }))
  const text = (v: string) => (v.trim() ? v : null)
  const tri = (v: boolean | null) => (v == null ? 'unknown' : v ? 'yes' : 'no')
  const fromTri = (v: string) => (v === 'unknown' ? null : v === 'yes')
  const postish = f.source === 'company_post' || f.source === 'founder_post'
  const recent = posts.slice(0, 60)

  const submit = () => {
    if (!f.company.trim()) return toast.error('Enter a company name')
    save.mutate(
      { id: initial?.id, body: { ...f, company: f.company.trim(), post_id: postish ? f.post_id : null } },
      {
        onSuccess: () => {
          toast.success(initial ? 'Lead updated' : 'Lead added')
          onClose()
        },
      },
    )
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit lead' : 'Add lead'}</DialogTitle>
          <DialogDescription>Business details only. Do not enter personal names, email addresses or phone numbers.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="l-company">Company</Label>
            <Input id="l-company" autoFocus value={f.company} onChange={(e) => set('company', e.target.value)} placeholder="Company or school name" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="l-date">Received on</Label>
            <Input id="l-date" type="date" value={f.received_on} max={todayUae()} onChange={(e) => set('received_on', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Came from</Label>
            <SimpleSelect value={f.source} onChange={(v) => set('source', v as LeadSource)} options={Object.entries(SOURCE_LABEL).map(([value, label]) => ({ value, label }))} />
          </div>
          {postish && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Post (optional)</Label>
              <SimpleSelect
                value={String(f.post_id ?? '')}
                onChange={(v) => set('post_id', v ? Number(v) : null)}
                options={[
                  { value: '', label: 'Not sure' },
                  ...recent.map((p) => ({
                    value: String(p.id),
                    label: `${format(parseISO(p.published_at), 'd MMM')} · ${(p.caption ?? '').split('\n').find((x) => x.trim())?.slice(0, 70) ?? 'Post'}`,
                  })),
                ]}
              />
            </div>
          )}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="l-heard">How they heard about us</Label>
            <Input
              id="l-heard"
              value={f.how_heard ?? ''}
              maxLength={300}
              onChange={(e) => set('how_heard', text(e.target.value))}
              placeholder="For example: Followed the founder’s posts on school systems"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Based in the UAE?</Label>
            <SimpleSelect value={tri(f.in_uae)} onChange={(v) => set('in_uae', fromTri(v))} options={[{ value: 'unknown', label: 'Not sure' }, { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
          </div>
          <div className="space-y-1.5">
            <Label>Decision-maker?</Label>
            <SimpleSelect value={tri(f.decision_maker)} onChange={(v) => set('decision_maker', fromTri(v))} options={[{ value: 'unknown', label: 'Not sure' }, { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
          </div>
        </div>

        <button type="button" onClick={() => setMore(!more)} className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground" aria-expanded={more}>
          <ChevronDown className={cn('size-4 transition-transform', more && 'rotate-180')} /> More details
        </button>
        {more && (
          <div className="grid gap-3 sm:grid-cols-2">
            {profiles.length > 1 && (
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Page or profile</Label>
                <SimpleSelect
                  value={String(f.via_account_id ?? '')}
                  onChange={(v) => set('via_account_id', v ? Number(v) : null)}
                  options={[{ value: '', label: 'Not sure' }, ...profiles.map((a) => ({ value: String(a.id), label: a.name }))]}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="l-industry">Industry</Label>
              <Input id="l-industry" value={f.industry ?? ''} onChange={(e) => set('industry', text(e.target.value))} placeholder="For example: Education" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="l-role">Role</Label>
              <Input id="l-role" value={f.role ?? ''} onChange={(e) => set('role', text(e.target.value))} placeholder="For example: Principal, CTO" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="l-service">Service of interest</Label>
              <Input id="l-service" value={f.service ?? ''} onChange={(e) => set('service', text(e.target.value))} placeholder="For example: LMS, ERP, website" />
            </div>
            <div className="space-y-1.5">
              <Label>Qualified?</Label>
              <SimpleSelect
                value={f.qualified == null ? 'auto' : f.qualified ? 'yes' : 'no'}
                onChange={(v) => set('qualified', v === 'auto' ? null : v === 'yes')}
                options={[
                  { value: 'auto', label: 'Automatic (UAE-based decision-maker)' },
                  { value: 'yes', label: 'Yes (manual)' },
                  { value: 'no', label: 'No (manual)' },
                ]}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="l-replied">First reply</Label>
              <Input
                id="l-replied"
                type="datetime-local"
                value={f.replied_at ? isoToZonedInput(f.replied_at, UAE) : ''}
                onChange={(e) => set('replied_at', e.target.value ? zonedInputToIso(e.target.value, UAE) : null)}
              />
              <p className="text-[11px] text-muted-foreground">UAE time</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="l-value">Expected value (AED)</Label>
              <Input
                id="l-value"
                type="number"
                min={0}
                value={f.value_aed ?? ''}
                onChange={(e) => set('value_aed', e.target.value === '' ? null : Math.max(0, Number(e.target.value)))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Stage</Label>
              <SimpleSelect value={f.stage} onChange={(v) => set('stage', v as LeadStage)} options={STAGES.map((x) => ({ value: x, label: STAGE_LABEL[x] }))} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>UTM parameters (if the lead came from a tagged website link)</Label>
              <div className="grid grid-cols-3 gap-2">
                <Input aria-label="utm_source" value={f.utm_source ?? ''} onChange={(e) => set('utm_source', text(e.target.value))} placeholder="Source, e.g. linkedin" />
                <Input aria-label="utm_medium" value={f.utm_medium ?? ''} onChange={(e) => set('utm_medium', text(e.target.value))} placeholder="Medium, e.g. company_post" />
                <Input aria-label="utm_campaign" value={f.utm_campaign ?? ''} onChange={(e) => set('utm_campaign', text(e.target.value))} placeholder="Campaign or post" />
              </div>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="l-notes">Notes</Label>
              <Textarea id="l-notes" rows={3} value={f.notes ?? ''} onChange={(e) => set('notes', text(e.target.value))} placeholder="Enquiry details and next steps" />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={save.isPending}>
            {initial ? 'Save' : 'Add lead'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
