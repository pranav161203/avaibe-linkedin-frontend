import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { ArrowLeft, ArrowRight, Building2, Pause, Play, Plus, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Section } from '@/components/common'
import { useTz } from '@/context/timezone'
import type { Company, CompanyInput } from '@/lib/api'
import { useCreateCompany, useGetCompanies, useUpdateCompany } from '@/pages/settings/queries'
import { useSearchParams } from 'react-router-dom'

/** Super admins: the companies on the platform. Open one to edit it and manage its people. */
export function CompaniesTab() {
  const { data, isLoading } = useGetCompanies()
  const [openId, setOpenId] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)
  const tz = useTz()

  if (isLoading || !data) return <Skeleton className="h-64" />
  const open = data.companies.find((c) => c.id === openId)
  if (open) return <CompanyDetail company={open} onBack={() => setOpenId(null)} />

  return (
    <div className="space-y-4">
      <Section
        icon={Building2}
        title="Companies"
        description="Each company’s data is isolated. Invite members from the Team tab."
        actions={
          !adding && (
            <Button size="sm" onClick={() => setAdding(true)}>
              <Plus /> New company
            </Button>
          )
        }
      >
        {adding && (
          <CompanyForm
            submitLabel="Create company"
            onCancel={() => setAdding(false)}
            onDone={(c) => {
              setAdding(false)
              setOpenId(c.id)
            }}
          />
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead className="text-right">People</TableHead>
              <TableHead className="text-right">Accounts</TableHead>
              <TableHead className="text-right">Invited</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.companies.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                  No companies yet.
                </TableCell>
              </TableRow>
            )}
            {data.companies.map((c) => (
              <TableRow key={c.id} className="cursor-pointer" onClick={() => setOpenId(c.id)}>
                <TableCell>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{[c.industry, c.country].filter(Boolean).join(' · ')}</div>
                </TableCell>
                <TableCell className="text-right tabular-nums">{c.users ?? 0}</TableCell>
                <TableCell className="text-right tabular-nums">{c.accounts ?? 0}</TableCell>
                <TableCell className="text-right tabular-nums">{c.pending_invitations || '—'}</TableCell>
                <TableCell>{c.is_active ? <span className="text-xs text-good-fg">Active</span> : <Badge variant="outline">Suspended</Badge>}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {tz.dateTime(c.created_at)}
                  {c.created_by && <div>by {c.created_by}</div>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>
    </div>
  )
}

function CompanyDetail({ company, onBack }: { company: Company; onBack: () => void }) {
  const update = useUpdateCompany()
  const tz = useTz()
  const [, setParams] = useSearchParams()
  const toggle = () => {
    const pausing = company.is_active
    if (pausing && !window.confirm(`Suspend ${company.name}? All members will be signed out and unable to sign in until access is restored. Data is retained.`)) return
    update.mutate(
      { id: company.id, body: { is_active: !pausing } },
      { onSuccess: () => toast.success(pausing ? 'Company suspended' : 'Access restored'), onError: (e) => toast.error(e.message) },
    )
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="ghost" onClick={onBack}>
          <ArrowLeft /> All companies
        </Button>
        <h2 className="text-lg font-semibold">{company.name}</h2>
        {!company.is_active && <Badge variant="outline">Suspended</Badge>}
        <Button size="sm" variant="outline" className="ml-auto" onClick={toggle} disabled={update.isPending}>
          {company.is_active ? <Pause /> : <Play />} {company.is_active ? 'Suspend access' : 'Restore access'}
        </Button>
      </div>
      <Section
        icon={Building2}
        title="Details"
        description={`Last updated ${tz.dateTime(company.updated_at)}${company.updated_by ? ` by ${company.updated_by}` : ''}.`}
      >
        <CompanyForm company={company} submitLabel="Save" />
      </Section>
      <Section icon={Users} title="Members" description={`${company.users ?? 0} members, ${company.pending_invitations ?? 0} pending invitations`}>
        <Button size="sm" variant="outline" onClick={() => setParams({ tab: 'team', company: String(company.id) }, { replace: true })}>
          Manage members <ArrowRight />
        </Button>
      </Section>
    </div>
  )
}

function CompanyForm({
  company,
  submitLabel,
  onCancel,
  onDone,
}: {
  company?: Company
  submitLabel: string
  onCancel?: () => void
  onDone?: (c: Company) => void
}) {
  const [form, setForm] = useState<CompanyInput>({
    name: company?.name ?? '',
    website: company?.website ?? '',
    country: company?.country ?? 'AE',
    industry: company?.industry ?? '',
  })
  const create = useCreateCompany()
  const update = useUpdateCompany()
  const set = (k: keyof CompanyInput) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const body = {
      name: form.name.trim(),
      website: form.website?.trim() || null,
      country: (form.country || 'AE').trim().toUpperCase(),
      industry: form.industry?.trim() || null,
    }
    const done = { onSuccess: (c: Company) => (toast.success(company ? 'Saved' : `${c.name} created`), onDone?.(c)), onError: (e: Error) => toast.error(e.message) }
    if (company) update.mutate({ id: company.id, body }, done)
    else create.mutate(body, done)
  }

  return (
    <form onSubmit={submit} className="mb-4 grid gap-3 md:grid-cols-2">
      <div>
        <Label className="mb-1.5 block">Name *</Label>
        <Input required minLength={2} value={form.name} onChange={set('name')} placeholder="e.g. Gulf Schools Group" />
      </div>
      <div>
        <Label className="mb-1.5 block">Website</Label>
        <Input type="url" value={form.website ?? ''} onChange={set('website')} placeholder="https://" />
      </div>
      <div>
        <Label className="mb-1.5 block">Industry</Label>
        <Input value={form.industry ?? ''} onChange={set('industry')} placeholder="e.g. Education" />
      </div>
      <div>
        <Label className="mb-1.5 block">Country code</Label>
        <Input value={form.country ?? ''} onChange={set('country')} maxLength={2} placeholder="AE" className="w-24 uppercase" />
      </div>
      <div className="flex gap-2 md:col-span-2">
        <Button type="submit" disabled={create.isPending || update.isPending}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
