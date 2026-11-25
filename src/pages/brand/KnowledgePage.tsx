/**
 * Brand → Knowledge base: what Claude should know about AVAIBE (services, projects, case studies, policies).
 * Shared by the whole workspace. Each source is split into short passages ("chunks"); a Claude feature
 * (Analyse, Chat, Ideas, Trends) is given only the few passages that match its task.
 */
import { useState } from 'react'
import { toast } from 'sonner'
import { BookOpen, Eye, FileText, FileUp, Pencil, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, PageHeader } from '@/components/common'
import { useAccount } from '@/context/account'
import { useAuth } from '@/context/auth'
import { useTz } from '@/context/timezone'
import { fmtNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { KnowledgeSource } from '@/lib/api'
import { AddKnowledge } from './components/AddKnowledge'
import { appliesLabel } from './components/AppliesTo'
import { ConfirmDelete, SourceDialog } from './components/SourceDialog'
import { useDeleteKnowledge, useGetKnowledge, useSearchKnowledge } from './queries'

export function KnowledgePage() {
  const auth = useAuth()
  const tz = useTz()
  const { account, accounts } = useAccount()
  const { data, isLoading } = useGetKnowledge(account?.id)
  const del = useDeleteKnowledge()
  const [open, setOpen] = useState<{ id: number; edit: boolean } | null>(null)
  const [deleting, setDeleting] = useState<KnowledgeSource | null>(null)
  const sources = data?.sources ?? []

  return (
    <div className="mx-auto max-w-page">
      <PageHeader
        eyebrow="Brand"
        title="Knowledge base"
        description="Company services, projects, case studies and policies for Claude to reference. Sources are split into passages, and only relevant passages are used for each task."
      />

      <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-[1.4rem] bg-card px-5 py-3 text-sm">
        <span className="inline-flex items-center gap-2 font-medium">
          <BookOpen className="size-4 text-primary" />
          <span className="tabular-nums">{fmtNumber(sources.length)}</span> source{sources.length === 1 ? '' : 's'} ·{' '}
          <span className="tabular-nums">{fmtNumber(data?.total_chunks ?? 0)}</span> searchable passages
        </span>
        <span className="text-xs text-muted-foreground">
          {account?.name ?? 'This account'}: company-wide and account-specific sources · Used by Analyse, Chat, Ideas and Trends
        </span>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="space-y-5">
          {auth.can('editor') && account && <AddKnowledge key={account.id} maxChars={data?.max_chars ?? 200_000} />}
          <TryQuestion accountId={account?.id} accountName={account?.name} />
        </div>

        <section className="rounded-[1.8rem] bg-card p-5">
          <h2 className="mb-3 text-base font-semibold">Sources</h2>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-14 rounded-xl" />
              <Skeleton className="h-14 rounded-xl" />
            </div>
          ) : sources.length === 0 ? (
            <EmptyState icon={BookOpen}>
              No sources added. Add a company profile, services, case studies or FAQs to ground Claude’s output.
            </EmptyState>
          ) : (
            <ul className="divide-y">
              {sources.map((s) => (
                <li key={s.id} className="flex items-center gap-3 py-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {s.kind === 'file' ? <FileUp className="size-4" /> : <FileText className="size-4" />}
                  </span>
                  <button type="button" onClick={() => setOpen({ id: s.id, edit: false })} className="min-w-0 flex-1 text-left">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{s.title}</span>
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium',
                          s.account_ids.length ? 'bg-primary/10 text-brand-fg' : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {appliesLabel(s.account_ids, accounts)}
                      </span>
                    </span>
                    <span className="block truncate text-xs text-muted-foreground tabular-nums">
                      {s.kind === 'file' ? s.file_name : 'Text'} · {fmtNumber(s.chars)} characters · {fmtNumber(s.chunks)} passage{s.chunks === 1 ? '' : 's'} · Updated{' '}
                      {tz.dateTime(s.updated_at).split(' ')[0]}
                      {s.updated_by && ` by ${s.updated_by}`}
                    </span>
                  </button>
                  <div className="flex shrink-0 items-center">
                    <Button size="icon-sm" variant="ghost" aria-label={`View ${s.title}`} title="View" onClick={() => setOpen({ id: s.id, edit: false })}>
                      <Eye />
                    </Button>
                    {auth.can('editor') && (
                      <>
                        <Button size="icon-sm" variant="ghost" aria-label={`Edit ${s.title}`} title="Edit" onClick={() => setOpen({ id: s.id, edit: true })}>
                          <Pencil />
                        </Button>
                        <Button size="icon-sm" variant="ghost" aria-label={`Delete ${s.title}`} title="Delete" onClick={() => setDeleting(s)}>
                          <Trash2 />
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {open && <SourceDialog id={open.id} startEditing={open.edit} onClose={() => setOpen(null)} />}
      {deleting && (
        <ConfirmDelete
          title={deleting.title}
          busy={del.isPending}
          onCancel={() => setDeleting(null)}
          onConfirm={() =>
            del.mutate(deleting.id, {
              onSuccess: () => {
                toast.success('Source deleted')
                setDeleting(null)
              },
              onError: (e) => toast.error(e.message),
            })
          }
        />
      )}
    </div>
  )
}

/** Type a question and see which passages Claude would be given */
function TryQuestion({ accountId, accountName }: { accountId?: number; accountName?: string }) {
  const [text, setText] = useState('')
  const [q, setQ] = useState('')
  const { data, isFetching } = useSearchKnowledge(q, accountId)
  return (
    <section className="rounded-[1.8rem] bg-card p-5">
      <h2 className="text-base font-semibold">Test retrieval</h2>
      <p className="mt-0.5 mb-3 text-xs text-muted-foreground">Preview the passages Claude would receive for {accountName ?? 'this account'}. Matching is keyword-based.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          setQ(text.trim())
        }}
        className="flex gap-2"
      >
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="For example: Which schools use our LMS?" maxLength={300} />
        <Button type="submit" size="sm" variant="outline" disabled={text.trim().length < 2} aria-label="Search">
          <Search />
        </Button>
      </form>
      {q && !isFetching && data && (
        <div className="mt-3 space-y-2">
          {data.results.length === 0 ? (
            <p className="text-sm text-muted-foreground">No matching passages.</p>
          ) : (
            data.results.map((h, i) => (
              <div key={i} className="rounded-xl bg-muted/50 p-3">
                <div className="mb-1 truncate text-xs font-medium">
                  {h.source_title}
                  {h.heading && <span className="text-muted-foreground"> · {h.heading}</span>}
                </div>
                <p className="line-clamp-4 text-xs whitespace-pre-line text-muted-foreground">{h.text}</p>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  )
}
