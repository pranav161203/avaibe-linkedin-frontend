import { useState } from 'react'
import { toast } from 'sonner'
import { Clock, RefreshCw, Star, Trash2, Users, X } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Section, SimpleSelect } from '@/components/common'
import { canManageRole, useAuth, ROLE_HELP, ROLE_LABELS } from '@/context/auth'
import { useAccount } from '@/context/account'
import { useTz } from '@/context/timezone'
import { ROLES, type Invitation, type Role, type TeamMember, type TeamMemberInput } from '@/lib/api'
import { AddMember } from './AddMember'
import { InviteLink } from './InviteLink'
import {
  useGetTeam,
  useRemoveTeamMember,
  useRenewInvitation,
  useRevokeInvitation,
  useSetDefaultAccount,
  useUpdateTeamMember,
} from '@/pages/settings/queries'

/** The roles this person may give inside a company (super admins don't belong to one) */
export const roleOptionsFor = (myRole: Role | undefined) =>
  ROLES.filter((r) => r !== 'superadmin' && canManageRole(myRole, r)).map((r) => ({ value: r, label: ROLE_LABELS[r] }))
const isAdminLevel = (r: Role) => r === 'admin' || r === 'superadmin'

/**
 * A company's people and pending invitations.
 * companyId: a super admin managing one company (from the Companies tab). Without it: your own company, or for a
 * super admin, the super admins themselves.
 */
export function TeamTab({ companyId }: { companyId?: number }) {
  const auth = useAuth()
  const tz = useTz()
  const { accounts } = useAccount()
  const { data, isLoading } = useGetTeam(companyId)
  const update = useUpdateTeamMember()
  const remove = useRemoveTeamMember()
  const setDefault = useSetDefaultAccount()
  const revoke = useRevokeInvitation()
  const renew = useRenewInvitation()
  const [shown, setShown] = useState<Invitation | null>(null)
  const onError = (e: Error) => toast.error(e.message)
  const myRole = auth.user?.role
  const options = roleOptionsFor(myRole)

  const patch = (m: TeamMember, changes: Partial<TeamMemberInput>) =>
    update.mutate(
      {
        id: m.id,
        body: { email: m.email, name: m.name, role: m.role, can_switch_accounts: m.can_switch_accounts, active: m.active, ...changes },
      },
      { onError },
    )

  if (isLoading || !data) return <Skeleton className="h-64" />

  const superTeam = !data.company // the super admins (platform team)
  const companyAccounts = data.company ? accounts.filter((a) => a.company_id == null || a.company_id === data.company!.id) : []

  return (
    <div className="space-y-4">
      {!auth.enabled && (
        <div className="rounded-lg border border-warn/40 bg-warn/10 px-4 py-3 text-sm">
          Sign-in is disabled on this server. Access rules will apply once sign-in is enabled.
        </div>
      )}

      <Section
        icon={Users}
        title={superTeam ? 'Owners' : 'Members'}
        description={
          superTeam
            ? 'Owners manage all companies and their members.'
            : 'Members can sign in and access this company’s accounts only.'
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Person</TableHead>
              <TableHead>Role</TableHead>
              {!superTeam && <TableHead>Can switch accounts</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead>Last sign-in</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.members.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                  No members yet.
                </TableCell>
              </TableRow>
            )}
            {data.members.map((m) => {
              const isMe = auth.user?.email === m.email
              // Locked: your own row, or someone above what you may manage (the server refuses these too)
              const locked = isMe || !canManageRole(myRole, m.role)
              const why = isMe ? 'You cannot change your own access' : 'Requires the Owner role'
              return (
                <TableRow key={m.id} className={m.active ? '' : 'opacity-60'}>
                  <TableCell>
                    <div className="font-medium">{m.name ?? '—'}</div>
                    <div className="text-xs text-muted-foreground">
                      {m.email} {isMe && <Badge variant="outline">you</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {locked || superTeam ? (
                      <span title={locked ? why : undefined} className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                        {ROLE_LABELS[m.role]}
                      </span>
                    ) : (
                      <SimpleSelect value={m.role} onChange={(v) => patch(m, { role: v as Role })} options={m.role === 'superadmin' ? [...options, { value: 'superadmin', label: ROLE_LABELS.superadmin }] : options} />
                    )}
                  </TableCell>
                  {!superTeam && (
                    <TableCell>
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={m.can_switch_accounts}
                          disabled={locked || isAdminLevel(m.role)}
                          onChange={(e) => patch(m, { can_switch_accounts: e.target.checked })}
                        />
                        {isAdminLevel(m.role) ? <span className="text-xs text-muted-foreground">Always</span> : m.can_switch_accounts ? 'Yes' : 'No'}
                      </label>
                    </TableCell>
                  )}
                  <TableCell>
                    <button
                      type="button"
                      className="text-xs underline-offset-2 enabled:hover:underline disabled:cursor-not-allowed"
                      disabled={locked}
                      onClick={() => patch(m, { active: !m.active })}
                      title={locked ? why : m.active ? 'Deactivate' : 'Restore access'}
                    >
                      {m.active ? <span className="text-good-fg">Active</span> : <span className="text-bad-fg">Inactive</span>}
                    </button>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{m.last_login_at ? tz.dateTime(m.last_login_at) : 'Never'}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      disabled={locked}
                      title={locked ? why : undefined}
                      aria-label={`Remove ${m.email}`}
                      onClick={() => {
                        if (window.confirm(`Remove ${m.email}? They will be signed out of all sessions.`))
                          remove.mutate(m.id, { onSuccess: () => toast.success('Member removed'), onError })
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

        {data.invitations.length > 0 && (
          <div className="mt-5">
            <div className="mb-2 flex items-center gap-1.5 text-sm font-medium">
              <Clock className="size-4 text-muted-foreground" /> Pending invitations
            </div>
            <ul className="divide-y rounded-lg border">
              {data.invitations.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm">
                  <span className="font-medium">{i.email}</span>
                  <Badge variant="outline">{ROLE_LABELS[i.role]}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {i.invited_by && <>by {i.invited_by} · </>}link valid until {i.expires_at ? tz.dateTime(i.expires_at) : '—'}
                  </span>
                  <span className="ml-auto flex gap-1">
                    <Button
                      size="xs"
                      variant="ghost"
                      disabled={!canManageRole(myRole, i.role)}
                      onClick={() => renew.mutate(i.id, { onSuccess: (inv) => setShown(inv), onError })}
                      title="Generate a new link. The current link will stop working."
                    >
                      <RefreshCw /> Regenerate link
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      disabled={!canManageRole(myRole, i.role)}
                      onClick={() => revoke.mutate(i.id, { onSuccess: () => toast.success('Invitation revoked'), onError })}
                    >
                      <X /> Revoke
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!superTeam && (
          <ul className="mt-4 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
            {ROLES.filter((r) => r !== 'superadmin').map((r) => (
              <li key={r}>
                <b className="text-foreground">{ROLE_LABELS[r]}:</b> {ROLE_HELP[r]}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {shown?.token && <InviteLink invitation={shown} onClose={() => setShown(null)} />}
      <AddMember companyId={companyId} superTeam={superTeam} onInvited={setShown} />

      {data.company && (
        <Section icon={Star} title="Default account" description="Shown to members who cannot switch accounts.">
          <SimpleSelect
            label="Account"
            value={data.default_account_id ? String(data.default_account_id) : ''}
            onChange={(v) =>
              setDefault.mutate({ accountId: Number(v), companyId }, { onSuccess: () => toast.success('Default account saved'), onError })
            }
            options={companyAccounts.map((a) => ({ value: String(a.id), label: a.name }))}
            className="min-w-56"
          />
          {companyAccounts.length === 0 && <p className="mt-2 text-xs text-muted-foreground">No LinkedIn accounts are connected to this company.</p>}
        </Section>
      )}
    </div>
  )
}
