import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '@/context/auth'
import type { Account } from '@/lib/api'
import { useGetAccounts } from '@/pages/settings/queries'

interface AccountCtx {
  accounts: Account[]
  account: Account | undefined
  setAccountId: (id: number) => void
  isLoading: boolean
  error: Error | null
}

const Ctx = createContext<AccountCtx | null>(null)
const STORAGE_KEY = 'avaibe.accountId.v2'

function readStored(): number | null {
  const fromLink = new URLSearchParams(window.location.search).get('account')
  if (fromLink && /^\d+$/.test(fromLink)) return Number(fromLink)
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v ? Number(v) : null
  } catch {
    return null
  }
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const { signedIn, me } = useAuth()
  const { data: accounts = [], isLoading, error } = useGetAccounts(signedIn)
  const [accountId, setId] = useState<number | null>(readStored)

  useEffect(() => {
    if (!accounts.length || accounts.some((a) => a.id === accountId)) return
    const fallback =
      accounts.find((a) => a.id === me?.default_account_id) ?? accounts.find((a) => !a.is_test) ?? accounts[0]
    setId(fallback.id)
  }, [accounts, accountId, me?.default_account_id])

  const setAccountId = (id: number) => {
    setId(id)
    try {
      localStorage.setItem(STORAGE_KEY, String(id))
    } catch {}
  }

  const account = accounts.find((a) => a.id === accountId)
  return <Ctx.Provider value={{ accounts, account, setAccountId, isLoading, error }}>{children}</Ctx.Provider>
}

export function useAccount() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAccount must be used inside AccountProvider')
  return ctx
}
