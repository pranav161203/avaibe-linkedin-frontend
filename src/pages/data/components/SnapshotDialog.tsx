import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { METRIC_FIELDS, type Checkpoint, type MetricField, type Post } from '@/lib/api'
import { metricLabel } from '@/lib/format'
import { useDeleteSnapshot, useSaveSnapshot } from '@/pages/data/queries'

export function SnapshotDialog({ post, checkpoint, fields, onClose }: {
  post: Post
  checkpoint: Checkpoint
  fields: MetricField[]
  onClose: () => void
}) {
  const existing = post.snapshots.find((s) => s.checkpoint === checkpoint)
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(METRIC_FIELDS.map((f) => [f, existing?.[f] != null ? String(existing[f]) : ''])),
  )
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const save = useSaveSnapshot(post.id, post.account_id)
  const remove = useDeleteSnapshot(post.id, post.account_id)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const body: Record<string, number | string | null> = { notes: notes.trim() || null }
    for (const f of METRIC_FIELDS) {
      const v = values[f].replace(/,/g, '').trim()
      body[f] = v === '' ? null : Number(v)
    }
    save.mutate(
      { checkpoint, body },
      {
        onSuccess: () => {
          toast.success(`${checkpoint} snapshot saved`)
          onClose()
        },
        onError: (err) => toast.error(err.message),
      },
    )
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{checkpoint} snapshot</DialogTitle>
          <DialogDescription>
            Figures as shown on LinkedIn {checkpoint} after publishing. The capture time is recorded automatically.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {fields.map((f) => (
              <div key={f}>
                <Label className="mb-1 block text-xs">{metricLabel(f)}</Label>
                <Input
                  inputMode="numeric"
                  pattern="[0-9,]*"
                  value={values[f]}
                  onChange={(e) => setValues({ ...values, [f]: e.target.value })}
                />
              </div>
            ))}
          </div>
          <div>
            <Label className="mb-1 block text-xs">Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. captured 2h late" />
          </div>
          <DialogFooter>
            {existing && (
              <Button
                type="button"
                variant="outline"
                className="mr-auto"
                disabled={remove.isPending}
                onClick={() => remove.mutate(checkpoint, { onSuccess: onClose, onError: (e) => toast.error(e.message) })}
              >
                Remove snapshot
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
