import { useQuery } from '@tanstack/react-query'
import { getMe } from '@/lib/api'

export const useGetMe = () => {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getMe,
    staleTime: 5 * 60_000,
    retry: 0,
  })
}
