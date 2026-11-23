import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { CalendarClock, CheckCircle2, Copy, ExternalLink, Hourglass, Link2, Pencil, Send, Trash2, Undo2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PostRef } from '@/components/common'
import { useAuth } from '@/context/auth'
import { useTz } from '@/context/timezone'
import { getPlannedImageUrl, ApiError, type LinkedInConnection, type PlannedPost, POST_GOALS } from '@/lib/api'
import { dueByHand, PLANNED_FORMAT_LABELS } from '@/lib/publishing'
import { cn } from '@/lib/utils'
import { ApproveDialog } from './ApproveDialog'
import { FormatSummary } from './FormatSummary'
import { MarkPostedDialog } from './MarkPostedDialog'
import { STATUS } from '../constants'
import { useMinutesLeft } from '../hooks/useMinutesLeft'
import { plural, copyText } from '../utils'
import { useDeletePlannedPost, usePlannedPostAction, useSchedulePlannedPost } from '@/pages/publishing/queries'

export function PlannedCard({
  p,
  accountId,
  accountName,
  connection,
  showFormat,
  onEdit,
}: {
  p: PlannedPost
  accountId: number
  accountName: string
  connection?: LinkedInConnection
  showFormat: boolean
  onEdit: () => void
}) {
  const tz = useTz()
  const [confirmPublish, setConfirmPublish] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [markPosted, setMarkPosted] = useState(false)
  const action = usePlannedPostAction(accountId, p.id)
  const remove = useDeletePlannedPost(accountId, p.id)
  const schedule = useSchedulePlannedPost(accountId, p.id)
  const unpublished = p.status === 'draft' || p.status === 'failed' || p.status === 'missed'
  const editable = unpublished || p.status === 'approved'
  const auth = useAuth()
  const waitMins = useMinutesLeft(p.retry_at)
  const waiting = waitMins !== null
  const autoRetry = waiting && p.status === 'approved'

  const run = (a: 'approve' | 'unapprove' | 'publish') =>
    action.mutate(a, {
      onSuccess: (res) => {
        const r = res as PlannedPost
        if (a === 'publish') {
          if (r.status === 'published') toast.success('Published to LinkedIn')
          else if (r.retry_at) {
            const mins = Math.max(1, Math.ceil((new Date(r.retry_at).getTime() - Date.now()) / 60_000))
            toast.info(
              r.status === 'approved'
                ? `LinkedIn is busy right now, so nothing was posted. The app will try again automatically in about ${plural(mins)}.`
                : `LinkedIn didn't respond in time. Please wait about ${plural(mins)}, then check the profile before trying again.`,
              { duration: 8000 },
            )
          } else toast.error(r.error ?? 'Publishing failed')
        }
        setConfirmPublish(false)
      },
      onError: (e) => {
        if (e instanceof ApiError && e.status === 409 && e.message.startsWith('LinkedIn is busy')) toast.info(e.message)
        else toast.error(e.message)
        setConfirmPublish(false)
      },
    })

  const badge = autoRetry
    ? { label: 'Waiting for LinkedIn', cls: 'bg-warn/15 text-warn-fg border-warn/40' }
    : waiting && p.status === 'failed'
      ? { label: 'Try again later', cls: 'bg-warn/15 text-warn-fg border-warn/40' }
      : STATUS[p.status]

  return (
    <div className="rounded-[1.8rem] bg-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-sm">
          <PostRef id={p.ref} />
          {showFormat && <Badge variant="outline">{PLANNED_FORMAT_LABELS[p.format]}</Badge>}
          <Badge variant="outline" className={badge.cls}>
            {p.status === 'approved' && p.by_hand ? (dueByHand(p) ? 'Due: post it by hand' : 'Scheduled: post by hand') : badge.label}
          </Badge>
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <CalendarClock className="size-4" />
            {p.status === 'published' && p.published_at
              ? `Published ${tz.weekday(p.published_at)} ${tz.dual(p.published_at)}`
              : p.scheduled_at
                ? `${p.manual ? 'Planned for ' : ''}${tz.weekday(p.scheduled_at)} ${tz.dual(p.scheduled_at)} · UAE slot ${p.scheduled_slot_uae}`
                : p.manual
                  ? 'No date planned'
                  : 'Not scheduled: publish manually'}
          </span>
          {p.visibility === 'CONNECTIONS' && <Badge variant="secondary">Connections only</Badge>}
          {p.goal && <Badge variant="secondary">{POST_GOALS.find((g) => g.value === p.goal)?.label}</Badge>}
          {p.topic && <Badge variant="secondary">{p.topic}</Badge>}
        </div>
        <div className="flex shrink-0 flex-wrap gap-1.5 sm:max-w-[55%] sm:justify-end">
          {editable && auth.can('editor') && (
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Pencil /> Edit
            </Button>
          )}
          {unpublished && auth.can('approver') && (
            <Button size="sm" onClick={() => setReviewing(true)} disabled={action.isPending}>
              <CheckCircle2 /> Approve
            </Button>
          )}
          {p.status === 'approved' && auth.can('approver') && (
            <>
              {!dueByHand(p) && (
                <Button size="sm" variant="outline" onClick={() => run('unapprove')} disabled={action.isPending}>
                  <Undo2 /> Unschedule
                </Button>
              )}
              {p.by_hand ? (
                <>
                  <Button size="sm" variant="outline" onClick={() => copyText(p.caption)}>
                    <Copy /> Copy text
                  </Button>
                  <Button size="sm" onClick={() => setMarkPosted(true)}>
                    <Link2 /> Mark as posted
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={() => setConfirmPublish(true)} disabled={!connection || connection.expired || action.isPending || waiting}>
                  <Send /> {waiting ? `Wait ${waitMins} min` : 'Publish now'}
                </Button>
              )}
            </>
          )}
          {p.status === 'published' && (
            <>
              {p.post_id && (
                <Link to={`/posts/${p.post_id}`} className="inline-flex h-7 items-center gap-1 rounded-md border px-2.5 text-xs hover:bg-muted">
                  View tracking
                </Link>
              )}
              {p.linkedin_urn && (
                <a
                  href={`https://www.linkedin.com/feed/update/${p.linkedin_urn}/`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-7 items-center gap-1 rounded-md border px-2.5 text-xs hover:bg-muted"
                >
                  On LinkedIn <ExternalLink className="size-3" />
                </a>
              )}
            </>
          )}
          {p.status !== 'publishing' && p.status !== 'published' && auth.can('editor') && (
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Delete"
              disabled={remove.isPending}
              onClick={() => remove.mutate(undefined, { onSuccess: () => toast.success('Deleted'), onError: (e) => toast.error(e.message) })}
            >
              <Trash2 />
            </Button>
          )}
        </div>
      </div>

      <div className="mt-3 flex gap-4">
        {p.has_image && (
          <img src={getPlannedImageUrl(p.id, p.approved_at ?? p.id.toString())} alt={p.image_alt ?? ''} className="size-24 shrink-0 rounded-md object-cover ring-1 ring-foreground/10" />
        )}
        <p className="line-clamp-5 text-sm whitespace-pre-wrap">{p.caption}</p>
      </div>
      <FormatSummary p={p} />

      {markPosted && <MarkPostedDialog p={p} accountId={accountId} onClose={() => setMarkPosted(false)} />}

      {waiting ? (
        <div className="mt-3 flex gap-2 rounded-md border border-warn/40 bg-warn/10 px-3 py-2 text-xs">
          <Hourglass className="mt-0.5 size-4 shrink-0 text-warn-fg" />
          <div>
            <p>{p.error}</p>
            <p className="mt-1 font-medium">
              {autoRetry ? 'Next automatic try' : 'You can try again'} in about {plural(waitMins ?? 1)} ({tz.dual(p.retry_at)})
              {autoRetry && p.attempts > 1 && <span className="font-normal text-muted-foreground"> · try {p.attempts + 1}</span>}
            </p>
          </div>
        </div>
      ) : (
        p.error &&
        !(p.status === 'approved') && (
          <p className={cn('mt-3 rounded-md px-3 py-2 text-xs', p.status === 'missed' ? 'bg-serious/10' : 'bg-bad/10 text-bad-fg')}>{p.error}</p>
        )
      )}
      {!waiting && p.status === 'approved' && p.attempts > 0 && (
        <p className="mt-3 flex items-center gap-2 rounded-md border border-warn/40 bg-warn/10 px-3 py-2 text-xs">
          <Hourglass className="size-4 shrink-0 text-warn-fg" /> LinkedIn was busy earlier. Trying again now…
        </p>
      )}

      <ApproveDialog
        open={reviewing}
        onClose={() => setReviewing(false)}
        p={p}
        accountName={accountName}
        connection={connection}
        busy={action.isPending || schedule.isPending}
        waitMins={waitMins}
        onEdit={() => {
          setReviewing(false)
          onEdit()
        }}
        onPublish={(how) =>
          schedule.mutate(how !== 'scheduled', {
            onSuccess: () => {
              setReviewing(false)
              if (how === 'now') run('publish')
              else if (how === 'scheduled')
                toast.success(
                  p.by_hand
                    ? `Scheduled for ${tz.weekday(p.scheduled_at!)} ${tz.dual(p.scheduled_at!)}. At that time you’ll be reminded to post it on LinkedIn by hand.`
                    : `Scheduled: the app will publish it ${tz.weekday(p.scheduled_at!)} ${tz.dual(p.scheduled_at!)}.`,
                  { duration: 8000 },
                )
              else {
                copyText(p.caption)
                toast.success('Copied. Paste it on LinkedIn, then click Mark as posted here.', { duration: 8000 })
              }
            },
            onError: (e) => toast.error(e.message),
          })
        }
      />

      <Dialog open={confirmPublish} onOpenChange={setConfirmPublish}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish to LinkedIn now?</DialogTitle>
            <DialogDescription>
              This posts {p.visibility === 'PUBLIC' ? 'publicly' : 'to connections'} on <b>{connection?.name}</b>'s LinkedIn profile right
              away. To remove it afterwards you'd delete it on LinkedIn itself.
            </DialogDescription>
          </DialogHeader>
          <p className="line-clamp-6 rounded-md bg-muted/50 p-3 text-sm whitespace-pre-wrap">{p.caption}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmPublish(false)}>
              Cancel
            </Button>
            <Button onClick={() => run('publish')} disabled={action.isPending}>
              <Send /> {action.isPending ? 'Publishing…' : 'Publish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
