import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/auth'
import { login } from '@/lib/api'
import API_ENDPOINTS from '@/lib/apiConfig'
import { AuthShell, FormError, OrDivider } from './components/AuthShell'
import { DemoSignIn } from './components/DemoSignIn'
import { MicrosoftLogo } from './components/MicrosoftLogo'
import { PasswordInput } from './components/PasswordInput'
import { EMAIL, ERRORS } from './constants'

export function SignInPage() {
  const { signedIn, enabled, isLoading, demoEmail, me } = useAuth()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const error = params.get('error')
  const detail = params.get('message')

  if (!isLoading && (enabled ? signedIn : !!demoEmail) && !params.get('signed_out')) return <Navigate to="/" replace />
  if (!isLoading && !enabled) return <DemoSignIn signedOut={!!params.get('signed_out')} />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!EMAIL.test(email.trim())) return setFormError('Enter a valid email address.')
    if (!password) return setFormError('Enter your password.')
    setBusy(true)
    setFormError(null)
    try {
      await login({ email: email.trim(), password })
      setPassword('')
      await qc.invalidateQueries()
      navigate('/', { replace: true })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Sign-in failed. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your account.">
      {params.get('signed_out') && !error && <p className="mt-4 rounded-md bg-muted px-3 py-2 text-sm">You have been signed out.</p>}
      {error && (
        <FormError>
          {ERRORS[error] ?? 'Sign-in failed. Try again.'}
          {detail && <div className="mt-1 text-xs opacity-80">{detail}</div>}
        </FormError>
      )}

      <form onSubmit={submit} noValidate className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="username"
            autoFocus
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setFormError(null)
            }}
            placeholder="name@company.com"
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <Label htmlFor="password">Password</Label>
            {me?.methods?.password_reset && (
              <button type="button" className="text-xs text-muted-foreground underline-offset-2 hover:underline" onClick={() => navigate('/forgot-password')}>
                Forgot password?
              </button>
            )}
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setFormError(null)
            }}
          />
        </div>
        {formError && <FormError>{formError}</FormError>}
        <Button type="submit" className="h-10 w-full" disabled={busy}>
          {busy && <Loader2 className="animate-spin" />} Sign in
        </Button>
      </form>

      {me?.methods?.microsoft && (
        <>
          <OrDivider />
          <Button variant="outline" className="h-10 w-full" onClick={() => (window.location.href = API_ENDPOINTS.AUTH.MICROSOFT_URL)}>
            <MicrosoftLogo /> Sign in with Microsoft
          </Button>
        </>
      )}
      <p className="mt-5 text-center text-xs text-muted-foreground">
        Access is by invitation only. To join, use the invitation link from your administrator.
      </p>
    </AuthShell>
  )
}
