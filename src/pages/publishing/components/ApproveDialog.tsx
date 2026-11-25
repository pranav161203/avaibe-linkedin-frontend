import { CalendarClock, Pencil, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useTz } from '@/context/timezone'
import { getPlannedImageUrl, type LinkedInConnection, type PlannedPost } from '@/lib/api'
import { FeedPreview } from '@/pages/create-post/components/FeedPreview'

export function ApproveDialog({
  open,
  onClose,
  p,
  accountName,
  connection,
  busy,
  waitMins,
  onEdit,
  onPublish,
}: {
  open: boolean
  onClose: () => void
  p: PlannedPost
  accountName: string
  connection?: LinkedInConnection
  busy: boolean
  waitMins: number | null
  onEdit: () => void
  onPublish: (how: 'now' | 'scheduled' | 'copy') => void
}) {
  const tz = useTz()
  const byApp = !p.by_hand && !!connection && !connection.expired
  const later = !!p.scheduled_at && new Date(p.scheduled_at).getTime() > Date.now()
  const when = later
    ? new Date(p.scheduled_at!).toLocaleString('en-GB', { timeZone: 'Asia/Dubai', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : ''
  const where = byApp ? `${p.visibility === 'PUBLIC' ? 'publicly' : 'to connections'} on ${connection!.name}’s LinkedIn` : ''
  const byHandWhy = p.manual ? 'This format is posted manually' : 'Automatic publishing is not yet available for this account'
  const note = p.by_hand
    ? later
      ? `${byHandWhy}. Schedule it and you’ll be reminded at that time to copy the text and post it; Publish now copies the text straight away.`
      : `${byHandWhy}: Publish copies the text for you to paste on LinkedIn, then you mark it as posted.`
    : !connection
      ? 'This account is not connected to LinkedIn.'
      : connection.expired
        ? 'The LinkedIn connection has expired. Reconnect it under LinkedIn connections in the profile menu.'
        : waitMins !== null
          ? `LinkedIn rate limit reached. Publishing is available again in about ${waitMins} min.`
          : later
            ? `Publishes ${where} (UAE time${tz.zone !== 'Asia/Dubai' ? `; ${tz.dual(p.scheduled_at!)}` : ''}). It can be edited or unscheduled until then.`
            : `Publishes ${where} immediately. Once published, it can only be removed on LinkedIn.`
  const blocked = !p.by_hand && !!connection && (connection.expired || waitMins !== null)
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-x-hidden overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Preview</DialogTitle>
          <DialogDescription>
            Review the post as it will appear on LinkedIn.
          </DialogDescription>
        </DialogHeader>
        <FeedPreview
          accountName={accountName}
          caption={p.caption}
          format={p.format}
          details={p.details ?? {}}
          imageSrc={p.has_image ? getPlannedImageUrl(p.id, p.approved_at ?? p.id.toString()) : null}
        />
        <p className="rounded-xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">{note}</p>
        <DialogFooter className="flex-wrap gap-2">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="outline" onClick={onEdit} disabled={busy}>
            <Pencil /> Edit
          </Button>
          {later ? (
            <>
              <Button variant="outline" onClick={() => onPublish(byApp ? 'now' : 'copy')} disabled={busy || blocked}>
                <Send /> Publish now
              </Button>
              <Button onClick={() => onPublish('scheduled')} disabled={busy}>
                <CalendarClock /> {busy ? 'Saving…' : `Schedule ${when}`}
              </Button>
            </>
          ) : (
            <Button onClick={() => onPublish(byApp ? 'now' : 'copy')} disabled={busy || blocked}>
              <Send /> {busy ? 'Publishing…' : 'Publish'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
