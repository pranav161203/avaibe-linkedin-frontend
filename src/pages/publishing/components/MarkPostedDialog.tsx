import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { type PlannedPost } from '@/lib/api'
import { PLANNED_FORMAT_LABELS } from '@/lib/publishing'
import { useMarkPlannedPosted } from '@/pages/publishing/queries'

export function MarkPostedDialog({ p, accountId, onClose }: { p: PlannedPost; accountId: number; onClose: () => void }) {
  const [url, setUrl] = useState('')
  const mark = useMarkPlannedPosted(accountId, p.id)
  const submit = () =>
    mark.mutate(url.trim(), {
      onSuccess: () => {
        toast.success('Marked as posted. It now appears in Posts for tracking.')
        onClose()
      },
      onError: (e) => toast.error(e.message),
    })
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark as posted</DialogTitle>
          <DialogDescription>
            After posting this {PLANNED_FORMAT_LABELS[p.format].toLowerCase()} on LinkedIn, open the post there, copy its address and paste
            it here. The app starts tracking it as a {PLANNED_FORMAT_LABELS[p.format].toLowerCase()} post, with its topic and CTA.
          </DialogDescription>
        </DialogHeader>
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.linkedin.com/feed/update/urn:li:activity:…" autoFocus />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={mark.isPending || url.trim().length < 10}>
            {mark.isPending ? 'Saving…' : 'Mark as posted'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

