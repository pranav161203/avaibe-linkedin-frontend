import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ExternalLink, FileText, LineChart, Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader, PostRef, Section } from '@/components/common'
import { PostForm } from '@/pages/data/components/PostForm'
import { useAuth } from '@/context/auth'
import { useTz } from '@/context/timezone'
import { CHECKPOINTS, type Checkpoint, type Post } from '@/lib/api'
import { FORMAT_LABELS, fmtNumber, fmtPct, metricLabel } from '@/lib/format'
import { Detail } from './Detail'
import { AudienceSection } from './PostAudienceSection'
import { SnapshotDialog } from './SnapshotDialog'
import { COMMON, EXTRA, CHECKPOINT_HOURS } from '../constants/post-detail'
import { useDeletePost, useSavePost } from '@/pages/data/queries'

export function PostDetail({ post }: { post: Post }) {
  const tz = useTz()
  const canEdit = useAuth().can('editor')
  const [params] = useSearchParams()
  const initialCp = params.get('checkpoint') as Checkpoint | null
  const [editingCp, setEditingCp] = useState<Checkpoint | null>(initialCp && CHECKPOINTS.includes(initialCp) ? initialCp : null)
  const [editPost, setEditPost] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const del = useDeletePost(post.account_id)
  const save = useSavePost(post.id)
  const navigate = useNavigate()
  const fields = [...COMMON, ...(EXTRA[post.format] ?? [])]
  const byCp = new Map(post.snapshots.map((s) => [s.checkpoint, s]))
  const published = new Date(post.published_at).getTime()

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader eyebrow="Data"
        back="/data?tab=posts"
        title={post.topic ?? post.ref ?? `Post ${post.id}`}
        description={
          <>
            {post.ref && <PostRef id={post.ref} className="mr-1.5 align-middle" />}
            {FORMAT_LABELS[post.format]} ·{' '}
            {post.time_known ? (
              <>
                {tz.weekday(post.published_at)} {tz.dual(post.published_at)} · UAE slot {post.slot_uae}
              </>
            ) : (
              <>
                {post.day_uae} {post.published_at_uae.slice(0, 10)} · time unknown (LinkedIn export)
              </>
            )}
            {post.topic_suggested && <> · topic suggested from the caption: edit and save to confirm</>}
          </>
        }
        actions={
          <>
            {post.post_url && (
              <a href={post.post_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm underline">
                Open on LinkedIn <ExternalLink className="size-3.5" />
              </a>
            )}
            {canEdit && (
              <>
                <Button variant="outline" size="sm" onClick={() => setEditPost(true)}>
                  <Pencil /> Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => setConfirmDelete(true)}>
                  <Trash2 /> Delete
                </Button>
              </>
            )}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Section icon={LineChart}
          className="lg:col-span-2"
          title="Performance snapshots"
          description="Record numbers from LinkedIn post analytics at each checkpoint. Leave a field blank if LinkedIn doesn't show it; blank is not zero."
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  {CHECKPOINTS.map((cp) => (
                    <TableHead key={cp} className="text-right">
                      {cp}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((f) => (
                  <TableRow key={f}>
                    <TableCell className="text-muted-foreground">{metricLabel(f)}</TableCell>
                    {CHECKPOINTS.map((cp) => (
                      <TableCell key={cp} className="text-right tabular-nums">
                        {fmtNumber(byCp.get(cp)?.[f])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell className="font-medium">Engagement rate</TableCell>
                  {CHECKPOINTS.map((cp) => (
                    <TableCell key={cp} className="text-right font-medium tabular-nums">
                      {fmtPct(byCp.get(cp)?.engagement_rate)}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Click rate</TableCell>
                  {CHECKPOINTS.map((cp) => (
                    <TableCell key={cp} className="text-right font-medium tabular-nums">
                      {fmtPct(byCp.get(cp)?.click_rate)}
                    </TableCell>
                  ))}
                </TableRow>
                {canEdit && (
                <TableRow>
                  <TableCell />
                  {CHECKPOINTS.map((cp, i) => {
                    // Capture window: from this checkpoint until the next one (7d: +48h)
                    const openAt = published + CHECKPOINT_HOURS[cp] * 3600 * 1000
                    const next = CHECKPOINTS[i + 1]
                    const closeAt = published + (next ? CHECKPOINT_HOURS[next] : CHECKPOINT_HOURS[cp] + 48) * 3600 * 1000
                    const now = Date.now()
                    const has = byCp.has(cp)
                    const isDue = !has && openAt <= now && now < closeAt
                    const missed = !has && now >= closeAt
                    return (
                      <TableCell key={cp} className="text-right">
                        <Button
                          size="xs"
                          variant={isDue ? 'default' : missed ? 'ghost' : 'outline'}
                          title={missed ? 'Window closed: only enter this if you have a record taken at the time' : undefined}
                          onClick={() => setEditingCp(cp)}
                        >
                          {has ? 'Edit' : isDue ? 'Enter (due)' : missed ? 'Missed' : 'Enter'}
                        </Button>
                      </TableCell>
                    )
                  })}
                </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Section>

        <Section icon={FileText} title="Post details">
          <dl className="space-y-3 text-sm">
            <Detail label="CTA">{post.cta}</Detail>
            <Detail label="Industry">{post.industry}</Detail>
            <Detail label="Author">{post.author}</Detail>
            <Detail label="Hashtags">
              {post.hashtags.length ? (
                <span className="flex flex-wrap gap-1">
                  {post.hashtags.map((h) => (
                    <Badge key={h} variant="secondary">
                      {h}
                    </Badge>
                  ))}
                </span>
              ) : null}
            </Detail>
            <Detail label="Keywords">{post.keywords.join(', ') || null}</Detail>
            <Detail label="Caption">{post.caption && <span className="whitespace-pre-wrap">{post.caption}</span>}</Detail>
            <Detail label="Notes">{post.notes}</Detail>
          </dl>
        </Section>
      </div>

      <AudienceSection post={post} />

      {editingCp && (
        <SnapshotDialog post={post} checkpoint={editingCp} fields={fields} onClose={() => setEditingCp(null)} />
      )}

      <Dialog open={editPost} onOpenChange={setEditPost}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit post</DialogTitle>
          </DialogHeader>
          <PostForm
            accountId={post.account_id}
            initial={post}
            submitLabel="Save changes"
            submitting={save.isPending}
            onSubmit={(body) =>
              save.mutate(body, {
                onSuccess: () => {
                  toast.success('Post updated')
                  setEditPost(false)
                },
                onError: (e) => toast.error(e.message),
              })
            }
          />
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this post?</DialogTitle>
            <DialogDescription>The post and all of its snapshots will be removed. This can't be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={del.isPending}
              onClick={() =>
                del.mutate(post.id, {
                  onSuccess: () => {
                    toast.success('Post deleted')
                    navigate('/posts')
                  },
                  onError: (e) => toast.error(e.message),
                })
              }
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
