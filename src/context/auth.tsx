import { createContext, useContext, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { logout, ROLES, type Me, type Role } from '@/lib/api'
import { readDemoEmail, writeDemoEmail } from '@/lib/demo-session'
import { useGetMe } from '@/pages/auth/queries'

interface AuthCtx {
  me: Me | undefined
  isLoading: boolean
  error: Error | null
  user: NonNullable<Me['user']> | null
  enabled: boolean
  signedIn: boolean
  can: (role: Role) => boolean
  canSwitch: boolean
  signOut: () => Promise<void>
  demoEmail: string | null
  demoSignIn: (email: string) => void
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient()
  const { data: me, isLoading, error } = useGetMe()
  const user = me?.user ?? null
  const [demoEmail, setDemoEmail] = useState<string | null>(readDemoEmail)
  const enabled = !!me?.enabled

  const value: AuthCtx = {
    me,
    isLoading,
    error: error as Error | null,
    user,
    enabled,
    signedIn: !!user,
    can: (role) => !!user && ROLES.indexOf(user.role) >= ROLES.indexOf(role),
    canSwitch: !!user?.can_switch_accounts,
    signOut: async () => {
      if (enabled) await logout()
      writeDemoEmail(null)
      setDemoEmail(null)
      qc.clear()
      window.location.href = '/signin?signed_out=1'
    },
    demoEmail: enabled ? null : demoEmail,
    demoSignIn: (email) => {
      writeDemoEmail(email)
      setDemoEmail(email)
    },
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export const ROLE_LABELS: Record<Role, string> = {
  viewer: 'Viewer',
  editor: 'Editor',
  admin: 'Admin',
  superadmin: 'Super admin',
}

export const ROLE_HELP: Record<Role, string> = {
  viewer: 'Sees dashboards and posts',
  editor: 'Also writes, schedules and publishes posts, adds numbers and leads',
  admin: 'Also manages accounts and settings, and viewers and editors',
  superadmin: 'Also manages admins and other super admins',
}

/** Who may manage whom (the server enforces the same): admins manage viewers and editors, super admins everyone */
export function canManageRole(myRole: Role | undefined, target: Role): boolean {
  if (myRole === 'superadmin') return true
  return myRole === 'admin' && ROLES.indexOf(target) < ROLES.indexOf('admin')
}
