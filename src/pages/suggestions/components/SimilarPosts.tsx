import { Link } from 'react-router-dom'
import type { SimilarResult } from '@/lib/api'
import { fmtNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import { VERDICT } from '../constants'

export function SimilarLine({ s, baseline }: { s: SimilarResult; baseline: number | null }) {
  if (s.count === 0) {
    return (
      <span className="mt-1 block text-xs text-muted-foreground">
        New ground: no past posts on {s.topic ? `“${s.topic}”` : 'this topic'} yet.
      </span>
    )
  }
  const v = s.verdict ? VERDICT[s.verdict] : null
  return (
    <span className="mt-1 block text-xs text-muted-foreground">
      Done before: {s.count} past post{s.count === 1 ? '' : 's'} on “{s.topic}”
      {s.median_impressions != null && (
        <>
          {' '}
          · median {fmtNumber(s.median_impressions)} impressions
          {v && baseline != null && (
            <span className={cn('font-medium', v.cls)}>
              {' '}
              ({v.text}, {fmtNumber(baseline)})
            </span>
          )}
        </>
      )}
    </span>
  )
}

export function SimilarList({ s }: { s: SimilarResult }) {
  if (!s.posts.length) return null
  return (
    <div className="rounded-lg border p-3">
      <div className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Closest past posts on “{s.topic}”
      </div>
      <ul className="space-y-1">
        {s.posts.map((p) => (
          <li key={p.id}>
            <Link to={`/posts/${p.id}`} className="flex items-center gap-3 rounded px-1 py-0.5 text-sm hover:bg-muted">
              <span className="w-20 shrink-0 text-xs text-muted-foreground tabular-nums">{p.published}</span>
              <span className="min-w-0 flex-1 truncate">{p.hook}</span>
              <span className="text-xs text-muted-foreground tabular-nums">{p.impressions != null ? fmtNumber(p.impressions) : '—'}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-1.5 text-xs text-muted-foreground">Topics for imported posts are inferred from captions and can be corrected in Posts.</p>
    </div>
  )
}
