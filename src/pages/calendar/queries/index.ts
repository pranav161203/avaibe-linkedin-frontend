import { useQuery } from '@tanstack/react-query'
import { getCalendar, getCalendarItems } from '@/lib/api'

export const useGetCalendar = (accountId: number | undefined, from: string, to: string, opts: { staleTime?: number } = {}) => {
  return useQuery({
    queryKey: ['calendar', accountId, from, to],
    queryFn: () => getCalendar({ account_id: accountId!, from, to }),
    enabled: !!accountId,
    ...opts,
  })
}

export const useGetCalendarItems = (from: string, to: string, enabled = true) => {
  return useQuery({
    queryKey: ['calendar-items', from, to],
    queryFn: () => getCalendarItems({ from, to }),
    staleTime: 60 * 60_000,
    enabled,
  })
}
