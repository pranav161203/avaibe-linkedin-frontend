import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { ROLE_LABELS, useAuth } from '@/context/auth'
import { getInvitation, signup } from '@/lib/api'
import API_ENDPOINTS from '@/lib/apiConfig'
import { AuthShell, FormError, OrDivider } from './components/AuthShell'
import { MicrosoftLogo } from './components/MicrosoftLogo'
import { PASSWORD_HINT, PasswordInput, passwordProblem } from './components/PasswordInput'

/** Accepting an invitation: /signup?token=... from the link an admin shared. */
export function SignUpPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { me } = useAuth()
  const invite = useQuery({ queryKey: ['invitation', token], queryFn: () => getInvitation(token), enabled: !!token, retry: 0 })
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!token || invite.isError) {
    return (
      <AuthShell title="Invalid invitation">
        <FormError>{invite.error instanceof Error ? invite.error.message : 'This invitation link is incomplete. Open the full link from your invitation.'}</FormError>
        <Button className="mt-6 h-10 w-full" variant="outline" onClick={() => navigate('/signin')}>
          Go to sign in
        </Button>
      </AuthShell>
    )
  }
  if (!invite.data) {
    return (
      <AuthShell title="Accept invitation">
        <Skeleton className="mt-6 h-48" />
      </AuthShell>
    )
  }

  const inv = invite.data
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setError('Enter your name.')
    const problem = passwordProblem(password)
    if (problem) return setError(problem)
    if (password !== confirm) return setError('Passwords do not match.')
    setBusy(true)
    setError(null)
    try {
      await signup({ token, name: name.trim(), password })
      // Only who-is-signed-in: refetching this (now used) invitation would show an error on the way out
      await qc.invalidateQueries({ queryKey: ['auth', 'me'] })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Account could not be created. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title={inv.company ? `Join ${inv.company}` : 'Join as an owner'}
      subtitle={
        <>
          You have been invited as <b className="text-foreground">{ROLE_LABELS[inv.role]}</b>. Set up your account to continue.
        </>
      }
    >
      <form onSubmit={submit} noValidate className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Work email</Label>
          <Input id="email" type="email" autoComplete="username" value={inv.email} readOnly className="bg-muted/50" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="name">Your name</Label>
          <Input id="name" autoComplete="name" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <PasswordInput id="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <p className="text-xs text-muted-foreground">{PASSWORD_HINT}</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm password</Label>
          <PasswordInput id="confirm" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        {error && <FormError>{error}</FormError>}
        <Button type="submit" className="h-10 w-full" disabled={busy}>
          {busy && <Loader2 className="animate-spin" />} Create account
        </Button>
      </form>
      {me?.methods?.microsoft && (
        <>
          <OrDivider />
          <Button variant="outline" className="h-10 w-full" onClick={() => (window.location.href = API_ENDPOINTS.AUTH.MICROSOFT_URL)}>
            <MicrosoftLogo /> Continue with Microsoft
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">Use the Microsoft account for {inv.email}.</p>
        </>
      )}
    </AuthShell>
  )
}
