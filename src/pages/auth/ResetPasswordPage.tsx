import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { checkPasswordReset, resetPassword } from '@/lib/api'
import { AuthShell, FormError } from './components/AuthShell'
import { PASSWORD_HINT, PasswordInput, passwordProblem } from './components/PasswordInput'

/** Choosing a new password from the emailed link: /reset-password?token=... */
export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const navigate = useNavigate()
  const qc = useQueryClient()
  const link = useQuery({ queryKey: ['password-reset', token], queryFn: () => checkPasswordReset(token), enabled: !!token, retry: 0 })
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!token || link.isError) {
    return (
      <AuthShell title="Invalid reset link">
        <FormError>{link.error instanceof Error ? link.error.message : 'This reset link is incomplete. Open the full link from the email.'}</FormError>
        <Button className="mt-6 h-10 w-full" onClick={() => navigate('/forgot-password')}>
          Request a new link
        </Button>
        <Button className="mt-3 h-10 w-full" variant="ghost" onClick={() => navigate('/signin')}>
          Back to sign in
        </Button>
      </AuthShell>
    )
  }
  if (!link.data) {
    return (
      <AuthShell title="Choose a new password">
        <Skeleton className="mt-6 h-40" />
      </AuthShell>
    )
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const problem = passwordProblem(password)
    if (problem) return setError(problem)
    if (password !== confirm) return setError('Passwords do not match.')
    setBusy(true)
    setError(null)
    try {
      await resetPassword({ token, password })
      // Only who-is-signed-in: refetching this (now used) link would show an error on the way out
      await qc.invalidateQueries({ queryKey: ['auth', 'me'] })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The password could not be reset. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title="Choose a new password" subtitle="You will be signed out of all other devices.">
      <form onSubmit={submit} noValidate className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Work email</Label>
          <Input id="email" type="email" autoComplete="username" value={link.data.email} readOnly className="bg-muted/50" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <PasswordInput id="password" autoComplete="new-password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} />
          <p className="text-xs text-muted-foreground">{PASSWORD_HINT}</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm password</Label>
          <PasswordInput id="confirm" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        {error && <FormError>{error}</FormError>}
        <Button type="submit" className="h-10 w-full" disabled={busy}>
          {busy && <Loader2 className="animate-spin" />} Reset password
        </Button>
      </form>
    </AuthShell>
  )
}
