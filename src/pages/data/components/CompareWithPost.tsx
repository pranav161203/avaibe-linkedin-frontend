import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GitCompareArrows, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { PostRef } from '@/components/common'
import { useTz } from '@/context/timezone'
import type { Post } from '@/lib/api'
import { FORMAT_LABELS, fmtNumber } from '@/lib/format'
import { useGetPosts } from '@/pages/data/queries'

const firstLine = (p: Post) => (p.caption ?? '').split('\n').find((l) => l.trim())?.trim() || p.topic || p.ref || `Post ${p.id}`
const newestFirst = (a: Post, b: Post) => b.published_at.localeCompare(a.published_at)

export function CompareWithPost({ post }: { post: Post }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <GitCompareArrows /> Compare with…
      </Button>
      {open && <Picker post={post} onClose={() => setOpen(false)} />}
    </>
  )
}

function Picker({ post, onClose }: { post: Post; onClose: () => void }) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const { data: all = [], isLoading } = useGetPosts(post.account_id)
  const others = all.filter((p) => p.id !== post.id)

  const groups: { title: string; posts: Post[] }[] = []
  const used = new Set<number>()
  const take = (list: Post[], n: number) => {
    const out = list.filter((p) => !used.has(p.id)).slice(0, n)
    out.forEach((p) => used.add(p.id))
    return out
  }
  const needle = q.trim().toLowerCase()
  if (needle) {
    const hits = others.filter((p) => [p.ref, p.caption, p.topic].some((v) => (v ?? '').toLowerCase().includes(needle))).sort(newestFirst)
    groups.push({ title: `Matching “${q.trim()}”`, posts: hits.slice(0, 10) })
  } else {
    if (post.topic) {
      const sameTopic = take(others.filter((p) => (p.topic ?? '').toLowerCase() === post.topic!.toLowerCase()).sort(newestFirst), 5)
      if (sameTopic.length) groups.push({ title: `Same topic: ${post.topic}`, posts: sameTopic })
    }
    if (post.format !== 'untagged') {
      const sameFormat = take(others.filter((p) => p.format === post.format).sort(newestFirst), 4)
      if (sameFormat.length) groups.push({ title: `Same format: ${FORMAT_LABELS[post.format]}`, posts: sameFormat })
    }
    const before = take(others.filter((p) => p.published_at < post.published_at).sort(newestFirst), 1)
    if (before.length) groups.push({ title: 'Previous post', posts: before })
  }

  const pick = (other: Post) => navigate(`/compare?ids=${post.id},${other.id}`)

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-x-hidden overflow-y-auto sm:max-w-lg [&>*]:min-w-0">
        <DialogHeader>
          <DialogTitle>Compare with…</DialogTitle>
          <DialogDescription>
            Pick a post to compare with <span className="font-medium text-foreground">{post.ref ?? 'this post'}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search posts by ID or text" className="h-10 rounded-xl pl-9" />
        </div>

        {isLoading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Loading posts…</p>
        ) : groups.every((g) => !g.posts.length) ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{needle ? `No other post matches “${q.trim()}”.` : 'No other posts available.'}</p>
        ) : (
          <div className="space-y-4">
            {groups
              .filter((g) => g.posts.length)
              .map((g) => (
                <section key={g.title}>
                  <h3 className="mb-1.5 text-xs font-semibold text-muted-foreground">{g.title}</h3>
                  <ul className="space-y-1">
                    {g.posts.map((p) => (
                      <PostChoice key={p.id} p={p} onPick={() => pick(p)} />
                    ))}
                  </ul>
                </section>
              ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function PostChoice({ p, onPick }: { p: Post; onPick: () => void }) {
  const tz = useTz()
  const imp = p.snapshots[p.snapshots.length - 1]?.impressions
  return (
    <li>
      <button type="button" onClick={onPick} className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left ring-1 ring-border transition-colors hover:bg-muted hover:ring-primary/40">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{firstLine(p)}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
            <PostRef id={p.ref} />
            <span>{p.time_known ? tz.dateTime(p.published_at) : p.published_at_uae.slice(0, 10)}</span>
            <span>· {FORMAT_LABELS[p.format]}</span>
          </div>
        </div>
        {imp != null && (
          <span className="shrink-0 text-right text-xs text-muted-foreground tabular-nums">
            <span className="block text-sm font-medium text-foreground">{fmtNumber(imp)}</span>
            impressions
          </span>
        )}
      </button>
    </li>
  )
}
