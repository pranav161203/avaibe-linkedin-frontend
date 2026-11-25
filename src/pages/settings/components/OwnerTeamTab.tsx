import { useSearchParams } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { SimpleSelect } from '@/components/common'
import { useAccount } from '@/context/account'
import { useGetCompanies } from '@/pages/settings/queries'
import { TeamTab } from './TeamTab'

const PLATFORM = 'platform'

/**
 * Team tab for owners: opens on the company of the account you're looking at, so inviting someone to it is one step.
 * The same switcher reaches other companies and the platform team (the owners themselves).
 */
export function OwnerTeamTab() {
  const { account } = useAccount()
  const { data, isLoading } = useGetCompanies()
  const [params, setParams] = useSearchParams()
  const picked = params.get('company')
  const setPicked = (v: string) => setParams({ tab: 'team', company: v }, { replace: true })

  if (isLoading || !data) return <Skeleton className="h-64" />

  const companies = data.companies
  const fallback = account?.company_id ?? companies[0]?.id
  const known = picked === PLATFORM || companies.some((c) => String(c.id) === picked)
  const value = picked && known ? picked : fallback ? String(fallback) : PLATFORM
  const options = [
    ...companies.map((c) => ({ value: String(c.id), label: c.is_active ? c.name : `${c.name} (suspended)` })),
    { value: PLATFORM, label: 'Owners' },
  ]

  return (
    <div className="space-y-4">
      {options.length > 1 && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Company</span>
          <SimpleSelect value={value} onChange={setPicked} options={options} className="min-w-56" />
        </div>
      )}
      {value === PLATFORM ? <TeamTab key={PLATFORM} /> : <TeamTab key={value} companyId={Number(value)} />}
    </div>
  )
}
