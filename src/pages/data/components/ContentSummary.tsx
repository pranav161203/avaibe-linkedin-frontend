import { Link } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import type { Post } from '@/lib/api'
import { FORMAT_LABELS, fmtNumber } from '@/lib/format'
import { postDate, postImpressions, median } from '../utils'

export function ContentSummary({ periodPosts, allPosts }: { periodPosts: Post[]; allPosts: Post[] }) {
  const typical = median(allPosts.map(postImpressions).filter((v): v is number => v != null))
  const ranked = periodPosts.filter((p) => postImpressions(p) != null).sort((a, b) => (postImpressions(b) ?? 0) - (postImpressions(a) ?? 0))
  if (!periodPosts.length) return <>No posts were published in this period. These figures reflect continued activity on earlier posts.</>
  const best = ranked[0]
  const title = best && (best.caption?.split('\n').find((l) => l.trim())?.trim() || best.topic || best.ref || `Post ${best.id}`)
  const ratio = best && typical ? (postImpressions(best) ?? 0) / typical : null
  return (
    <>
      <span className="font-medium">{periodPosts.length} post{periodPosts.length === 1 ? '' : 's'}</span> published in this period.
      {best && (
        <>
          {' '}The top performer was{' '}
          <Link to={`/posts/${best.id}`} className="underline underline-offset-2">
            “{title!.length > 60 ? `${title!.slice(0, 60)}…` : title}”
          </Link>{' '}
          ({FORMAT_LABELS[best.format]}, {format(parseISO(postDate(best)), 'd MMM')}) with {fmtNumber(postImpressions(best))} impressions
          {ratio != null && ratio >= 1.2 ? `, ${ratio.toFixed(1)}× the typical post` : ''}.
        </>
      )}
      {ranked.length < 5 && <span className="text-muted-foreground"> With fewer than 5 posts, patterns are indicative only.</span>}
    </>
  )
}
