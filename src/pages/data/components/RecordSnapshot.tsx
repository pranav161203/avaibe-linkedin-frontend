import { useState } from 'react'
import { toast } from 'sonner'
import { ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AudienceEditor, parseNum, type EditorRow } from '@/pages/data/components/AudienceEditor'
import { Section, SimpleSelect } from '@/components/common'
import { useTz } from '@/context/timezone'
import type { AudienceType } from '../constants/audience'
import { todayIn } from '../utils/audience'
import { useSavePageAudience } from '@/pages/data/queries'

export function RecordSnapshot({ accountId, defaultType }: { accountId: number; defaultType: AudienceType }) {
  const tz = useTz()
  const [asOf, setAsOf] = useState(() => todayIn(tz.zone))
  const [type, setType] = useState<AudienceType>(defaultType)
  const [total, setTotal] = useState('')
  const [rows, setRows] = useState<EditorRow[]>([])
  const save = useSavePageAudience(accountId)

  const submit = () => {
    if (!rows.length) return toast.error('Add at least one row')
    const parsed = rows.map((r) => ({ dimension: r.dimension, value: r.value.trim(), count: parseNum(r.count), pct: parseNum(r.pct) }))
    if (parsed.some((r) => !r.value || (r.count === null && r.pct === null) || Number.isNaN(r.count) || Number.isNaN(r.pct))) {
      return toast.error('Each row requires a value and a count or percentage')
    }
    save.mutate(
      { as_of: asOf, audience: type, total: parseNum(total), rows: parsed },
      {
        onSuccess: () => {
          toast.success(`Saved ${type} snapshot for ${asOf}`)
          setRows([])
          setTotal('')
        },
        onError: (e) => toast.error(e.message),
      },
    )
  }

  return (
    <Section icon={ClipboardList}
      title="Record a snapshot"
      description="In the page admin view, go to Analytics → Followers (or Visitors) and enter the location, industry and seniority breakdowns. Use counts where LinkedIn provides them. Saving the same date replaces the existing snapshot."
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <Label className="mb-1.5 block">Date</Label>
            <Input type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} className="w-40" />
          </div>
          <SimpleSelect
            label="Audience"
            value={type}
            onChange={(v) => setType(v as AudienceType)}
            options={[
              { value: 'followers', label: 'Followers' },
              { value: 'visitors', label: 'Page visitors' },
            ]}
          />
          <div>
            <Label className="mb-1.5 block">Total {type}</Label>
            <Input inputMode="numeric" value={total} onChange={(e) => setTotal(e.target.value)} className="w-32" placeholder="e.g. 240" />
          </div>
        </div>
        <AudienceEditor rows={rows} onChange={setRows} withCount />
        <Button onClick={submit} disabled={save.isPending}>
          {save.isPending ? 'Saving…' : 'Save snapshot'}
        </Button>
      </div>
    </Section>
  )
}
