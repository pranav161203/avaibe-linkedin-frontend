import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Section, SimpleSelect } from '@/components/common'
import { type Role } from '@/lib/api'
import { ROLE_OPTIONS } from './TeamTab'
import { useAddTeamMember } from '@/pages/settings/queries'

export function AddMember() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<Role>('viewer')
  const [canSwitch, setCanSwitch] = useState(false)
  const add = useAddTeamMember()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    add.mutate(
      { email: email.trim(), name: name.trim() || null, role, can_switch_accounts: canSwitch, active: true },
      {
        onSuccess: (m) => {
          toast.success(`${m.email} can now sign in`)
          setEmail('')
          setName('')
          setRole('viewer')
          setCanSwitch(false)
        },
        onError: (e) => toast.error(e.message),
      },
    )
  }

  return (
    <Section icon={UserPlus} title="Add a person" description="They sign in with this exact Microsoft work email.">
      <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
        <div>
          <Label className="mb-1.5 block">Work email *</Label>
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" />
        </div>
        <div>
          <Label className="mb-1.5 block">Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Filled in from Microsoft on first sign-in" />
        </div>
        <SimpleSelect label="Role" value={role} onChange={(v) => setRole(v as Role)} options={ROLE_OPTIONS} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-4 accent-(--primary)" checked={canSwitch || role === 'admin'} disabled={role === 'admin'} onChange={(e) => setCanSwitch(e.target.checked)} />
          Can switch accounts (founders, digital marketing executive)
        </label>
        <div className="md:col-span-2">
          <Button type="submit" disabled={add.isPending}>
            <UserPlus /> Add to team
          </Button>
        </div>
      </form>
    </Section>
  )
}
