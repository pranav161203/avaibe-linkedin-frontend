import { useMutation, useQuery } from '@tanstack/react-query'
import { disconnectLinkedIn, getLinkedInAuthUrl, getLinkedInConfig, getLinkedInConnections } from '@/lib/api'
import { queryClient } from '@/providers'

export const useGetLinkedInConfig = () => {
  return useQuery({
    queryKey: ['linkedin', 'config'],
    queryFn: getLinkedInConfig,
  })
}

export const useGetLinkedInConnections = () => {
  return useQuery({
    queryKey: ['linkedin', 'connections'],
    queryFn: getLinkedInConnections,
  })
}

export const useConnectLinkedIn = () => {
  return useMutation({
    mutationFn: getLinkedInAuthUrl,
  })
}

export const useDisconnectLinkedIn = () => {
  return useMutation({
    mutationFn: disconnectLinkedIn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['linkedin', 'connections'] }),
  })
}
