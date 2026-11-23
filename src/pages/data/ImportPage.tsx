import { PageHeader } from '@/components/common'
import { useAccount } from '@/context/account'
import { CsvSection } from './components/CsvSection'
import { LinkedInExportSection } from './components/LinkedInExportSection'

export function ImportPage() {
  const { account } = useAccount()
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader
        eyebrow="Data"
        back="/data?tab=posts"
        title="Import"
        description="Bring in history: LinkedIn's own page-analytics export, or the app's CSV template."
      />
      <LinkedInExportSection accountId={account?.id} accountName={account?.name} accountKind={account?.kind} />
      <CsvSection accountId={account?.id} accountName={account?.name} />
    </div>
  )
}
