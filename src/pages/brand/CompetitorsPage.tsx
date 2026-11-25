import { useState } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, PageHeader } from '@/components/common'
import { useAccount } from '@/context/account'
import { useAuth } from '@/context/auth'
import type { Competitor } from '@/lib/api'
import { CompetitorCard } from './components/CompetitorCard'
import { CompetitorDialog } from './components/CompetitorDialog'
import { useGetAccountDoc, useSaveAccountDoc } from '@/pages/brand/queries'

export function CompetitorsPage() {
  const { account } = useAccount()
  const auth = useAuth()
  const { data: doc, isLoading } = useGetAccountDoc(account?.id, 'competitors')
  const save = useSaveAccountDoc(account?.id ?? 0, 'competitors')
  const [editing, setEditing] = useState<Competitor | 'new' | null>(null)
  const list = doc?.data.competitors ?? []
  const canEdit = auth.can('editor')

  const store = (next: Competitor[], msg: string) =>
    save.mutate({ competitors: next }, { onSuccess: () => toast.success(msg), onError: (e) => toast.error(e.message) })

  return (
    <div className="mx-auto max-w-page">
      <PageHeader
        eyebrow="Brand"
        title="Competitors"
        description="Public activity of competing UAE software, ERP, education technology and IT companies, and opportunities to differentiate. Use public information only."
        actions={
          canEdit ? (
            <Button size="sm" onClick={() => setEditing('new')}>
              <Plus /> Add competitor
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : list.length === 0 ? (
        <EmptyState>
          No competitors added. Competitor names are shared with Claude to inform positioning in suggestions.
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((c) => (
            <CompetitorCard
              key={c.id}
              c={c}
              canEdit={canEdit}
              onEdit={() => setEditing(c)}
              onDelete={() => store(list.filter((x) => x.id !== c.id), `${c.name} removed`)}
            />
          ))}
        </div>
      )}

      {editing && (
        <CompetitorDialog
          initial={editing === 'new' ? undefined : editing}
          saving={save.isPending}
          onClose={() => setEditing(null)}
          onSave={(c) => {
            const next = editing === 'new' ? [...list, c] : list.map((x) => (x.id === c.id ? c : x))
            store(next, editing === 'new' ? `${c.name} added` : 'Changes saved')
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}
