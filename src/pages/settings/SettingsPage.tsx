import { Navigate, useSearchParams } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/common'
import { TeamTab } from './components/TeamTab'
import { CompanyPicker, OWNERS, useCompanyChoice } from './components/CompanyPicker'
import { SettingsCompany } from './context'
import { CompaniesTab } from './components/CompaniesTab'
import { useAuth } from '@/context/auth'
import { AudienceTab } from './components/AudienceTab'
import { ClaudeTab } from './components/ClaudeTab'
import { GeneralTab } from './components/GeneralTab'
import { PerformanceTab } from './components/PerformanceTab'
import { TABS } from './constants'
import { useGetSettings } from '@/pages/settings/queries'

export function SettingsPage() {
  const [params, setParams] = useSearchParams()
  const tab = TABS.includes(params.get('tab') as (typeof TABS)[number]) ? params.get('tab')! : 'general'
  const auth = useAuth()
  const isOwner = auth.user?.role === 'superadmin'
  // Owners pick the company for the company-specific tabs; everyone else always sees their own
  const choice = useCompanyChoice(isOwner, tab === 'team')
  const companyId = isOwner ? choice.companyId : undefined
  const { data, isLoading } = useGetSettings(companyId)
  const companyTab = ['team', 'audience', 'performance', 'claude'].includes(tab)

  if (params.get('tab') === 'brand') return <Navigate to="/settings?tab=claude" replace />

  if (!auth.can('admin')) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader eyebrow="Workspace" title="Settings" />
        <p className="text-sm text-muted-foreground">Only admins can change settings.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-page">
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Accounts, team access, audience definitions, performance rules and AI configuration."
      />
      <Tabs
        value={tab}
        onValueChange={(v) =>
          setParams(
            (p) => {
              p.set('tab', String(v))
              return p
            },
            { replace: true },
          )
        }
      >
        <TabsList className="flex-wrap">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          {isOwner && <TabsTrigger value="companies">Companies</TabsTrigger>}
          <TabsTrigger value="audience">Audience definitions</TabsTrigger>
          <TabsTrigger value="performance">Performance rules</TabsTrigger>
          <TabsTrigger value="claude">Claude</TabsTrigger>
        </TabsList>
        {isOwner && companyTab && (
          <div className="mt-4">
            <CompanyPicker value={choice.value} options={choice.options} onChange={choice.set} />
          </div>
        )}
        <SettingsCompany.Provider value={companyId}>
          <TabsContent value="general" className="mt-4">
            <GeneralTab />
          </TabsContent>
          <TabsContent value="team" className="mt-4">
            {!isOwner ? (
              <TeamTab />
            ) : choice.loading ? (
              <Skeleton className="h-64" />
            ) : choice.value === OWNERS ? (
              <TeamTab key={OWNERS} />
            ) : (
              <TeamTab key={choice.value} companyId={companyId} />
            )}
          </TabsContent>
          {isOwner && (
            <TabsContent value="companies" className="mt-4">
              <CompaniesTab />
            </TabsContent>
          )}
          <TabsContent value="audience" className="mt-4">
            {isLoading || !data ? (
              <Skeleton className="h-96" />
            ) : (
              <AudienceTab key={JSON.stringify(data.current.segments)} current={data.current.segments} />
            )}
          </TabsContent>
          <TabsContent value="performance" className="mt-4">
            {isLoading || !data ? (
              <Skeleton className="h-96" />
            ) : (
              <PerformanceTab
                key={JSON.stringify(data.current.performance)}
                current={data.current.performance}
                defaults={data.defaults.performance}
              />
            )}
          </TabsContent>
          <TabsContent value="claude" className="mt-4">
            <ClaudeTab />
          </TabsContent>
        </SettingsCompany.Provider>
      </Tabs>
    </div>
  )
}
