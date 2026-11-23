import { usePeriod } from '@/components/period'
import type { PageDay, Post } from '@/lib/api'

export interface TabProps {
  accountId?: number
  daily: PageDay[]
  win: { from: string; to: string }
  stats: NonNullable<ReturnType<typeof usePeriod>['stats']>
  dates: React.ReactNode
  compareLabel: string
  posts: Post[]
}
