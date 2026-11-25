import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Send } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Section, SimpleSelect } from '@/components/common'
import { type Invitation, type Role } from '@/lib/api'
import { roleOptionsFor } from './TeamTab'
import { useAuth } from '@/context/auth'
import { useInviteTeamMember } from '@/pages/settings/queries'

/** Invite someone: makes a one-time sign-up link (no account exists until they open it). */
export function AddMember({ companyId, superTeam, onInvited }: { companyId?: number; superTeam: boolean; onInvited: (inv: Invitation) => void }) {
  const auth = useAuth()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>(superTeam ? 'superadmin' : companyId ? 'admin' : 'viewer')
  const [canSwitch, setCanSwitch] = useState(false)
  const invite = useInviteTeamMember()
  const adminLevel = role === 'admin' || role === 'superadmin'

  const submit = (e: FormEvent) => {
    e.preventDefault()
    invite.mutate(
      { companyId, body: { email: email.trim(), role, can_switch_accounts: canSwitch } },
      {
        onSuccess: (inv) => {
          toast.success(`Invitation created for ${inv.email}`)
          onInvited(inv)
          setEmail('')
          setCanSwitch(false)
        },
        onError: (e) => toast.error(e.message),
      },
    )
  }

  return (
    <Section
      icon={Send}
      title={superTeam ? 'Invite an owner' : 'Invite a member'}
      description={
        superTeam
          ? 'Owners have full access to all companies. An invitation link will be generated.'
          : 'An invitation link will be generated for you to share. It expires in 7 days.'
      }
    >
      <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
        <div>
          <Label className="mb-1.5 block">Work email *</Label>
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" />
        </div>
        {!superTeam && (
          <SimpleSelect label="Role" value={role} onChange={(v) => setRole(v as Role)} options={roleOptionsFor(auth.user?.role)} />
        )}
        {!superTeam && (
          <label className="flex cursor-pointer items-center gap-2.5 text-sm md:col-span-2">
            <Checkbox checked={canSwitch || adminLevel} disabled={adminLevel} onChange={(e) => setCanSwitch(e.target.checked)} />
            Can switch accounts
          </label>
        )}
        <div className="md:col-span-2">
          <Button type="submit" disabled={invite.isPending}>
            <Send /> Create invitation link
          </Button>
        </div>
      </form>
    </Section>
  )
}
