import { format, parseISO } from 'date-fns'
import { Demographics } from '@/pages/data/components/Demographics'
import { Highlights } from '@/pages/data/components/Highlights'
import { MetricsChart } from '@/pages/data/components/MetricsChart'
import { FOLLOWER_METRICS } from '../constants'
import { useSnapshots } from '../hooks/useSnapshots'
import type { TabProps } from '../types'

export function FollowersTab({ accountId, daily, win, stats, dates, compareLabel, posts }: TabProps) {
  const { latest, before } = useSnapshots(accountId, 'followers')
  const uaeNow = latest?.total != null && latest.shares.uae_share != null ? Math.round(latest.total * latest.shares.uae_share) : null
  const uaeBefore = before?.total != null && before.shares.uae_share != null ? Math.round(before.total * before.shares.uae_share) : null
  const asOf = latest ? `As of ${format(parseISO(latest.as_of), 'd MMM')}` : 'Import or record follower demographics'

  return (
    <div className="space-y-4">
      <Highlights
        dates={dates}
        compareLabel={compareLabel}
        items={[
          { label: 'Total followers', value: latest?.total ?? null, prev: before?.total ?? null, hint: asOf },
          { label: 'New followers', value: stats.cur.new_followers, prev: stats.prev?.new_followers },
          { label: 'UAE followers (est.)', value: uaeNow, prev: uaeBefore, hint: latest ? 'Total × UAE share' : undefined },
          {
            label: 'Decision-makers',
            value: latest?.shares.decision_maker_share ?? null,
            prev: before?.shares.decision_maker_share ?? null,
            pct: true,
            hint: 'Share of followers',
          },
        ]}
      />
      <MetricsChart daily={daily} from={win.from} to={win.to} metrics={FOLLOWER_METRICS} posts={posts} param="fm" title="Follower growth" />
      <Demographics snapshot={latest} noun="followers" />
    </div>
  )
}
