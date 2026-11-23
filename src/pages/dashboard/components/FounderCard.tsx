import { UserRound } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { CardHeading } from '@/components/common'
import { Mini, totals } from '@/components/period'
import type { Account } from '@/lib/api'
import { fmtNumber } from '@/lib/format'
import { useGetAccountDoc } from '@/pages/brand/queries'
import { useGetPageDaily } from '@/pages/data/queries'

export function FounderCard({ founder, from, to }: { founder: Account; from: string; to: string }) {
  const { data: daily = [] } = useGetPageDaily(founder.id)
  const { data: doc } = useGetAccountDoc(founder.id, 'member_totals')
  const t = totals(daily.filter((d) => d.date >= from && d.date <= to))
  const all = doc?.data.totals ?? {}
  const eng = t.impressions ? ((t.reactions ?? 0) + (t.comments ?? 0) + (t.reposts ?? 0)) / t.impressions : null
  return (
    <Card>
      <CardHeader>
        <CardHeading icon={UserRound} title={founder.name} sub={doc?.data.followers != null ? `${fmtNumber(doc.data.followers)} followers` : undefined} />
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid grid-cols-3 gap-x-4 gap-y-3">
          <Mini label="Impressions" v={t.impressions} />
          <Mini label="Reactions" v={t.reactions} />
          <Mini label="Comments" v={t.comments} />
          <Mini label="Reposts" v={t.reposts} />
          <Mini label="Engagement" v={eng} pct />
          <Mini label="New followers" v={t.new_followers} />
        </dl>
        {doc?.data.as_of && (
          <div className="rounded-md bg-muted/60 p-3">
            <div className="mb-2 text-xs text-muted-foreground">All time, all posts (LinkedIn gives these only as totals)</div>
            <dl className="grid grid-cols-3 gap-x-4 gap-y-3">
              <Mini label="People reached" v={all.MEMBERS_REACHED ?? null} />
              <Mini label="Followers from posts" v={all.FOLLOWER_GAINED_FROM_CONTENT ?? null} />
              <Mini label="Profile views from posts" v={all.PROFILE_VIEW_FROM_CONTENT ?? null} />
              <Mini label="Saves" v={all.POST_SAVE ?? null} />
              <Mini label="Sends" v={all.POST_SEND ?? null} />
              <Mini label="Link clicks" v={all.LINK_CLICKS ?? null} />
            </dl>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
