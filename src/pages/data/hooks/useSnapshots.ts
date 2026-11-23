import { useMemo } from 'react'
import type { PageAudienceSnapshot } from '@/lib/api'
import { useGetPageAudience } from '@/pages/data/queries'

/** The latest snapshot of one audience, and the one before it (for "change since") */
export function useSnapshots(accountId: number | undefined, kind: 'followers' | 'visitors') {
  const { data = [] } = useGetPageAudience(accountId)
  return useMemo(() => {
    const list = data.filter((d) => d.audience === kind).sort((a, b) => a.as_of.localeCompare(b.as_of))
    return { latest: list.at(-1) as PageAudienceSnapshot | undefined, before: list.at(-2) as PageAudienceSnapshot | undefined }
  }, [data, kind])
}
