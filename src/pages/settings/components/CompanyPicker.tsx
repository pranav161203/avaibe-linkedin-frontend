import { useSearchParams } from 'react-router-dom'
import { SimpleSelect } from '@/components/common'
import { useAccount } from '@/context/account'
import { useGetCompanies } from '@/pages/settings/queries'

export const OWNERS = 'owners'

/**
 * Owners manage every company: which one the company-specific tabs (Team, Audience, Performance, Claude) show.
 * Kept in ?company= so it survives switching tabs. Defaults to the company of the account being viewed.
 * withOwners: the Team tab can also show the owners themselves.
 */
export function useCompanyChoice(enabled: boolean, withOwners: boolean) {
  const { account } = useAccount()
  const { data } = useGetCompanies(enabled)
  const [params, setParams] = useSearchParams()
  const companies = data?.companies ?? []
  const picked = params.get('company')
  const fallback = account?.company_id ?? companies[0]?.id
  const known = (withOwners && picked === OWNERS) || companies.some((c) => String(c.id) === picked)
  const value = picked && known ? picked : fallback ? String(fallback) : withOwners ? OWNERS : ''
  const options = [
    ...companies.map((c) => ({
      value: String(c.id),
      label: c.is_active ? c.name : `${c.name} (suspended)`,
    })),
    ...(withOwners ? [{ value: OWNERS, label: 'Owners' }] : []),
  ]
  const set = (v: string) => setParams({ tab: params.get('tab') ?? 'general', company: v }, { replace: true })
  return {
    loading: enabled && !data,
    value,
    options,
    set,
    companyId: value && value !== OWNERS ? Number(value) : undefined,
  }
}

export function CompanyPicker({
  value,
  options,
  onChange,
}: {
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  if (options.length < 2) return null
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">Company</span>
      <SimpleSelect value={value} onChange={onChange} options={options} className="min-w-56" />
    </div>
  )
}
