import { useMutation, useQuery } from '@tanstack/react-query'
import {
  addTeamMember,
  createAccount,
  getAccounts,
  getClaudeStatus,
  getSettings,
  getTeam,
  removeTeamMember,
  resetSettings,
  saveSettings,
  setDefaultAccount,
  updateTeamMember,
  type AppSettings,
  type SettingsSection,
} from '@/lib/api'
import { queryClient } from '@/providers'

export const useGetAccounts = (enabled = true) => {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: getAccounts,
    enabled,
  })
}

export const useCreateAccount = () => {
  return useMutation({
    mutationFn: createAccount,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
  })
}

export const useGetSettings = () => {
  return useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  })
}

export const useGetClaudeStatus = () => {
  return useQuery({
    queryKey: ['settings', 'claude'],
    queryFn: getClaudeStatus,
  })
}

type SaveSettingsArgs =
  | { section: 'segments'; body: AppSettings['current']['segments'] }
  | { section: 'performance'; body: AppSettings['current']['performance'] }
  | { section: 'brand'; body: AppSettings['current']['brand'] }
  | { section: SettingsSection; reset: true }

export const useSaveSettings = () => {
  return useMutation({
    mutationFn: (args: SaveSettingsArgs) => ('reset' in args ? resetSettings(args.section) : saveSettings(args as { section: SettingsSection; body: never })),
    onSuccess: () => queryClient.invalidateQueries(),
  })
}

const invalidateTeam = () => {
  queryClient.invalidateQueries({ queryKey: ['team'] })
  queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
}

export const useGetTeam = () => {
  return useQuery({
    queryKey: ['team'],
    queryFn: getTeam,
  })
}

export const useAddTeamMember = () => {
  return useMutation({
    mutationFn: addTeamMember,
    onSuccess: invalidateTeam,
  })
}

export const useUpdateTeamMember = () => {
  return useMutation({
    mutationFn: updateTeamMember,
    onSuccess: invalidateTeam,
  })
}

export const useRemoveTeamMember = () => {
  return useMutation({
    mutationFn: removeTeamMember,
    onSuccess: invalidateTeam,
  })
}

export const useSetDefaultAccount = () => {
  return useMutation({
    mutationFn: setDefaultAccount,
    onSuccess: invalidateTeam,
  })
}
