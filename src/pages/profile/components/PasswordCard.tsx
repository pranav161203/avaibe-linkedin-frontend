import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Section } from '@/components/common'
import { useAuth } from '@/context/auth'
import { changePassword } from '@/lib/api'
import { PASSWORD_HINT, PasswordInput, passwordProblem } from '@/pages/auth/components/PasswordInput'
import { useQueryClient } from '@tanstack/react-query'

/** Change (or, for Microsoft-only accounts, set) your password. Other devices are signed out. */
export function PasswordCard() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const hasPassword = !!user?.has_password
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const problem = passwordProblem(next)
    if (problem) return toast.error(problem)
    if (next !== confirm) return toast.error('Passwords do not match.')
    setBusy(true)
    try {
      await changePassword({ current, new: next })
      toast.success('Password updated. Other sessions have been signed out.')
      setCurrent('')
      setNext('')
      setConfirm('')
      qc.invalidateQueries({ queryKey: ['auth', 'me'] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Password could not be updated')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Section
      icon={KeyRound}
      title={hasPassword ? 'Password' : 'Add a password'}
      description={hasPassword ? 'Changing your password signs you out of all other sessions.' : 'Add a password to sign in with your email address as well as Microsoft.'}
    >
      <form onSubmit={submit} className="grid max-w-md gap-3">
        {hasPassword && (
          <div className="space-y-1.5">
            <Label htmlFor="pw-current">Current password</Label>
            <PasswordInput id="pw-current" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="pw-new">New password</Label>
          <PasswordInput id="pw-new" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
          <p className="text-xs text-muted-foreground">{PASSWORD_HINT}</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pw-confirm">New password again</Label>
          <PasswordInput id="pw-confirm" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        <div>
          <Button type="submit" disabled={busy || !next}>
            Save password
          </Button>
        </div>
      </form>
    </Section>
  )
}
