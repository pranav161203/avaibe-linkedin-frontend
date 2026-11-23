import { LogOut, SlidersHorizontal, UserRound } from 'lucide-react'
import { ROLE_HELP, ROLE_LABELS, useAuth } from '@/context/auth'
import { Button } from '@/components/ui/button'
import { PageHeader, Section, SimpleSelect } from '@/components/common'
import { useTz, ZONES, type ZoneId } from '@/context/timezone'

export function SignedInProfile() {
  const auth = useAuth()
  const tz = useTz()
  const u = auth.user!
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader eyebrow="Your account" back="/" title="Profile" description="Your details come from your AVAIBE Microsoft account." />
      <Section icon={UserRound} title="Details">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Name</dt>
            <dd className="mt-1">{u.name ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Work email</dt>
            <dd className="mt-1">{u.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Role</dt>
            <dd className="mt-1">
              {ROLE_LABELS[u.role]} <span className="text-muted-foreground">· {ROLE_HELP[u.role]}</span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Accounts</dt>
            <dd className="mt-1">{u.can_switch_accounts ? 'Can switch between all accounts' : 'Company page only'}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-muted-foreground">To change your role or access, ask an admin.</p>
      </Section>
      <Section icon={SlidersHorizontal} title="Preferences">
        <SimpleSelect
          label="Show times in"
          value={tz.zone}
          onChange={(v) => tz.setZone(v as ZoneId)}
          options={ZONES.map((z) => ({ value: z.id, label: z.long }))}
        />
      </Section>
      <Button variant="outline" onClick={() => auth.signOut()}>
        <LogOut /> Sign out
      </Button>
    </div>
  )
}
