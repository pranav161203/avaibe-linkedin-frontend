import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Building2, Clock, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Section, SimpleSelect } from '@/components/common'
import { useAccount } from '@/context/account'
import { useTz, ZONES, type ZoneId } from '@/context/timezone'
import type { Account } from '@/lib/api'
import { KIND_LABELS } from '../constants'
import { useCreateAccount } from '@/pages/settings/queries'

export function GeneralTab() {
  const { accounts } = useAccount()
  const tz = useTz()
  const create = useCreateAccount()
  const [name, setName] = useState('')
  const [kind, setKind] = useState<Account['kind']>('company')
  const [url, setUrl] = useState('')
  const [isTest, setIsTest] = useState('no')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    create.mutate(
      { name: name.trim(), kind, linkedin_url: url.trim() || null, is_test: isTest === 'yes' },
      {
        onSuccess: () => {
          toast.success('Account added')
          setName('')
          setUrl('')
        },
        onError: (err) => toast.error(err.message),
      },
    )
  }

  return (
    <div className="space-y-4">
      <Section icon={Clock} title="Time zone" description="Used to display and enter times. Posting-time analysis always uses UAE time.">
        <SimpleSelect
          label="Show times in"
          value={tz.zone}
          onChange={(v) => tz.setZone(v as ZoneId)}
          options={ZONES.map((z) => ({ value: z.id, label: z.long }))}
        />
      </Section>

      <Section icon={Building2} title="Tracked accounts" description="Each account is measured against its own baseline. Company pages and personal profiles are analysed separately.">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>LinkedIn URL</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">
                  {a.name} {a.is_test && <Badge variant="outline">test</Badge>}
                </TableCell>
                <TableCell>{KIND_LABELS[a.kind]}</TableCell>
                <TableCell className="max-w-64 truncate text-xs">
                  {a.linkedin_url ? (
                    <a href={a.linkedin_url} target="_blank" rel="noreferrer" className="underline">
                      {a.linkedin_url}
                    </a>
                  ) : (
                    '—'
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>

      <Section icon={Plus} title="Add account" description="Add a LinkedIn company page or personal profile to track.">
        <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
          <div>
            <Label className="mb-1.5 block">Name *</Label>
            <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Account name" />
          </div>
          <div>
            <Label className="mb-1.5 block">LinkedIn URL</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.linkedin.com/company/…" />
          </div>
          <SimpleSelect
            label="Type"
            value={kind}
            onChange={(v) => setKind(v as Account['kind'])}
            options={(Object.keys(KIND_LABELS) as Account['kind'][]).map((k) => ({ value: k, label: KIND_LABELS[k] }))}
          />
          <SimpleSelect
            label="Test account"
            value={isTest}
            onChange={setIsTest}
            options={[
              { value: 'no', label: 'No' },
              { value: 'yes', label: 'Yes' },
            ]}
          />
          <div className="md:col-span-2">
            <Button type="submit" disabled={create.isPending}>
              Add account
            </Button>
          </div>
        </form>
      </Section>
    </div>
  )
}
