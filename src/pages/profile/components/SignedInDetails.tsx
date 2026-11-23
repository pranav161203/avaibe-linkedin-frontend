import { ROLE_HELP, ROLE_LABELS, useAuth } from '@/context/auth'
import { DetailRow, DetailsCard, TimeZoneSelect } from './DetailsCard'

export function SignedInDetails() {
  const u = useAuth().user!
  return (
    <DetailsCard>
      <DetailRow label="Name">{u.name ?? '—'}</DetailRow>
      <DetailRow label="Work email">{u.email}</DetailRow>
      <DetailRow label="Role" hint="Ask an admin to change it">
        {ROLE_LABELS[u.role]} <span className="text-muted-foreground">· {ROLE_HELP[u.role]}</span>
      </DetailRow>
      <DetailRow label="Accounts">{u.can_switch_accounts ? 'Can switch between all accounts' : 'Company page only'}</DetailRow>
      <DetailRow label="Show times in" hint="Dates and times across the app">
        <TimeZoneSelect />
      </DetailRow>
    </DetailsCard>
  )
}
