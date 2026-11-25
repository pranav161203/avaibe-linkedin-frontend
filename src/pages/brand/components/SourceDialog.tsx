import { Fragment, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { FileText, FileUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/context/auth'
import { useTz } from '@/context/timezone'
import { fmtNumber } from '@/lib/format'
import { useAccount } from '@/context/account'
import { useGetKnowledgeSource, useUpdateKnowledge } from '../queries'
import { AppliesTo, appliesLabel } from './AppliesTo'

/** One source: read it (headings shown as headings), or edit its title and text. Saving rebuilds its passages. */
export function SourceDialog({ id, startEditing, onClose }: { id: number; startEditing: boolean; onClose: () => void }) {
  const auth = useAuth()
  const tz = useTz()
  const { data: s, isLoading } = useGetKnowledgeSource(id)
  const update = useUpdateKnowledge()
  const [editing, setEditing] = useState(startEditing && auth.can('editor'))
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [accountIds, setAccountIds] = useState<number[]>([])
  const { accounts } = useAccount()
  useEffect(() => {
    if (s) {
      setTitle(s.title)
      setContent(s.content ?? '')
      setAccountIds(s.account_ids)
    }
  }, [s])

  const save = () =>
    update.mutate(
      { id, title, content, accountIds },
      {
        onSuccess: (r) => {
          toast.success(`Source saved · ${r.chunks} passage${r.chunks === 1 ? '' : 's'}`)
          setEditing(false)
        },
        onError: (e) => toast.error(e.message),
      },
    )

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[88vh] flex-col overflow-hidden sm:max-w-2xl [&>*]:min-w-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {s?.kind === 'file' ? <FileUp className="size-4 text-primary" /> : <FileText className="size-4 text-primary" />}
            {editing ? 'Edit source' : (s?.title ?? 'Source')}
          </DialogTitle>
          {s && (
            <DialogDescription className="tabular-nums">
              {s.kind === 'file' ? s.file_name : 'Text'} · {fmtNumber(s.chars)} characters · {fmtNumber(s.chunks)} passages · {s.sections ?? 0} sections · {appliesLabel(s.account_ids, accounts)} · Updated{' '}
              {tz.dateTime(s.updated_at)}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {isLoading || !s ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : editing ? (
            <div className="space-y-3">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} aria-label="Title" />
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={16} className="font-mono text-xs" aria-label="Content" />
              <AppliesTo value={accountIds} onChange={setAccountIds} />
              <p className="text-xs text-muted-foreground">Changes take effect when saved.</p>
            </div>
          ) : (
            <Rendered text={s.content ?? ''} />
          )}
        </div>

        <DialogFooter>
          {editing ? (
            <>
              <Button variant="ghost" onClick={() => (startEditing ? onClose() : setEditing(false))}>
                Cancel
              </Button>
              <Button onClick={save} disabled={update.isPending || !title.trim() || !content.trim()}>
                {update.isPending ? 'Saving…' : 'Save'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
              {auth.can('editor') && <Button onClick={() => setEditing(true)}>Edit</Button>}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Rendered({ text }: { text: string }) {
  return (
    <div className="rounded-xl bg-muted/40 p-4 text-sm leading-relaxed">
      {text.split('\n').map((line, i) => {
        const m = /^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line)
        if (m) return <h3 key={i} className="mt-4 mb-1 text-sm font-semibold first:mt-0">{m[2]}</h3>
        return <Fragment key={i}>{line ? <p className="whitespace-pre-wrap">{line}</p> : <div className="h-2" />}</Fragment>
      })}
    </div>
  )
}

export function ConfirmDelete({ title, busy, onCancel, onConfirm }: { title: string; busy: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <Dialog open onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete “{title}”?</DialogTitle>
          <DialogDescription>Claude will stop using this source immediately. This cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={busy}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
