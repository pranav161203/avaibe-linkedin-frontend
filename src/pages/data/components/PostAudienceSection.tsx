import { useState } from 'react'
import { toast } from 'sonner'
import { Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AudienceEditor, parseNum, toEditorRows, type EditorRow } from '@/pages/data/components/AudienceEditor'
import { Section, ShareSummary } from '@/components/common'
import { useAuth } from '@/context/auth'
import { useTz } from '@/context/timezone'
import type { Post } from '@/lib/api'
import { useSavePostAudience } from '@/pages/data/queries'

export function AudienceSection({ post }: { post: Post }) {
  const tz = useTz()
  const canEdit = useAuth().can('editor')
  const [rows, setRows] = useState<EditorRow[]>(() => toEditorRows(post.audience))
  const save = useSavePostAudience(post.id, post.account_id)
  // Prefer the 7d snapshot for estimates (closest to the post's final audience), else the latest one
  const snap = post.snapshots.find((s) => s.checkpoint === '7d') ?? post.snapshots[post.snapshots.length - 1]

  const submit = () => {
    const bad = rows.find((r) => !r.value.trim() || parseNum(r.pct) === null || Number.isNaN(parseNum(r.pct)))
    if (bad) {
      toast.error('Every row needs a value and a percentage')
      return
    }
    save.mutate(
      rows.map((r) => ({ dimension: r.dimension, value: r.value.trim(), pct: parseNum(r.pct)! })),
      { onSuccess: () => toast.success('Audience saved'), onError: (e) => toast.error(e.message) },
    )
  }

  return (
    <Section icon={Users}
      className="mt-4"
      title="Who saw this post"
      description={
        <>
          Copy the audience breakdown from LinkedIn's post analytics (location, industry, seniority…), ideally at 7 days. LinkedIn
          lists only top values, so shares are minimums (≥).
          {post.audience_captured_at && <> Last saved {tz.dateTime(post.audience_captured_at)} {tz.label}.</>}
        </>
      }
    >
      <div className="space-y-4">
        <ShareSummary shares={post.shares} impressions={snap?.impressions} />
        {snap?.impressions != null && (
          <p className="text-xs text-muted-foreground">Estimates use {snap.checkpoint} impressions × share.</p>
        )}
        {canEdit && (
          <>
            <AudienceEditor rows={rows} onChange={setRows} />
            <Button onClick={submit} disabled={save.isPending}>
              {save.isPending ? 'Saving…' : 'Save audience'}
            </Button>
          </>
        )}
      </div>
    </Section>
  )
}
