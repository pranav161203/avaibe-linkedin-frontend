import { toast } from 'sonner'
import { Star, Trash2, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Section, SimpleSelect } from '@/components/common'
import { useAuth, ROLE_HELP, ROLE_LABELS } from '@/context/auth'
import { useAccount } from '@/context/account'
import { useTz } from '@/context/timezone'
import { ROLES, type Role, type TeamMember, type TeamMemberInput } from '@/lib/api'
import { AddMember } from './AddMember'
import { useGetTeam, useRemoveTeamMember, useSetDefaultAccount, useUpdateTeamMember } from '@/pages/settings/queries'

export const ROLE_OPTIONS = ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))

export function TeamTab() {
  const auth = useAuth()
  const tz = useTz()
  const { accounts } = useAccount()
  const { data, isLoading } = useGetTeam()
  const update = useUpdateTeamMember()
  const remove = useRemoveTeamMember()
  const setDefault = useSetDefaultAccount()
  const onError = (e: Error) => toast.error(e.message)

  const patch = (m: TeamMember, changes: Partial<TeamMemberInput>) =>
    update.mutate({
      id: m.id,
      body: { email: m.email, name: m.name, role: m.role, can_switch_accounts: m.can_switch_accounts, active: m.active, ...changes },
    }, { onError })

  if (isLoading || !data) return <Skeleton className="h-64" />

  return (
    <div className="space-y-4">
      {!auth.enabled && (
        <div className="rounded-lg border border-warn/40 bg-warn/10 px-4 py-3 text-sm">
          Microsoft sign-in isn’t set up yet, so these rules aren’t enforced. You can prepare the team list now; it takes
          effect as soon as sign-in is configured.
        </div>
      )}

      <Section icon={Users}
        title="Team"
        description="Only people listed here can sign in, using their AVAIBE Microsoft account. Admins can always switch accounts."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Person</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Can switch accounts</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last sign-in</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.members.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                  No one yet. Add the first people below.
                </TableCell>
              </TableRow>
            )}
            {data.members.map((m) => {
              const isMe = auth.user?.email === m.email
              return (
                <TableRow key={m.id} className={m.active ? '' : 'opacity-60'}>
                  <TableCell>
                    <div className="font-medium">{m.name ?? '—'}</div>
                    <div className="text-xs text-muted-foreground">
                      {m.email} {isMe && <Badge variant="outline">you</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <SimpleSelect value={m.role} onChange={(v) => patch(m, { role: v as Role })} options={ROLE_OPTIONS} />
                  </TableCell>
                  <TableCell>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="size-4 accent-(--primary)"
                        checked={m.can_switch_accounts}
                        disabled={m.role === 'admin'}
                        onChange={(e) => patch(m, { can_switch_accounts: e.target.checked })}
                      />
                      {m.role === 'admin' ? <span className="text-xs text-muted-foreground">always (admin)</span> : m.can_switch_accounts ? 'Yes' : 'No'}
                    </label>
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      className="text-xs underline-offset-2 hover:underline"
                      onClick={() => patch(m, { active: !m.active })}
                      title={m.active ? 'Switch off access (signs them out)' : 'Restore access'}
                    >
                      {m.active ? <span className="text-good-fg">Active</span> : <span className="text-bad-fg">Access off</span>}
                    </button>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{m.last_login_at ? tz.dateTime(m.last_login_at) : 'Never'}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`Remove ${m.email}`}
                      onClick={() => {
                        if (window.confirm(`Remove ${m.email} from the team? They will be signed out.`)) remove.mutate(m.id, { onSuccess: () => toast.success('Removed from the team'), onError })
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        <ul className="mt-4 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
          {ROLES.map((r) => (
            <li key={r}>
              <b className="text-foreground">{ROLE_LABELS[r]}:</b> {ROLE_HELP[r]}
            </li>
          ))}
        </ul>
      </Section>

      <AddMember />

      <Section icon={Star}
        title="Default account"
        description="What people without “Can switch accounts” see. Normally the AVAIBE company page."
      >
        <SimpleSelect
          label="Account"
          value={data.default_account_id ? String(data.default_account_id) : ''}
          onChange={(v) => setDefault.mutate(Number(v), { onSuccess: () => toast.success('Default account saved'), onError })}
          options={accounts.map((a) => ({ value: String(a.id), label: a.name }))}
          className="min-w-56"
        />
      </Section>
    </div>
  )
}
