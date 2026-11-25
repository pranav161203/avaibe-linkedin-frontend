import { ROLE_HELP, ROLE_LABELS, useAuth } from '@/context/auth'
import { DetailRow, DetailsCard, TimeZoneSelect } from './DetailsCard'

export function SignedInDetails() {
  const u = useAuth().user!
  return (
    <DetailsCard>
      <DetailRow label="Name">{u.name ?? '—'}</DetailRow>
      <DetailRow label="Work email">{u.email}</DetailRow>
      <DetailRow label="Company">{u.company?.name ?? 'All companies'}</DetailRow>
      <DetailRow label="Role" hint="Managed by an admin">
        {ROLE_LABELS[u.role]} <span className="text-muted-foreground">· {ROLE_HELP[u.role]}</span>
      </DetailRow>
      <DetailRow label="Accounts">{u.can_switch_accounts ? 'All company accounts' : 'Default account only'}</DetailRow>
      <DetailRow label="Show times in" hint="Applies to all dates and times">
        <TimeZoneSelect />
      </DetailRow>
    </DetailsCard>
  )
}
