import { Navigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/auth'
import { DemoSignIn } from './components/DemoSignIn'
import { MicrosoftLogo } from './components/MicrosoftLogo'
import { ERRORS } from './constants'

export function SignInPage() {
  const { signedIn, enabled, isLoading, demoEmail } = useAuth()
  const [params] = useSearchParams()
  const error = params.get('error')
  const detail = params.get('message')

  if (!isLoading && (enabled ? signedIn : !!demoEmail) && !params.get('signed_out')) return <Navigate to="/" replace />
  if (!isLoading && !enabled) return <DemoSignIn signedOut={!!params.get('signed_out')} />

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-4">
      <div className="app-backdrop" aria-hidden />
      <div className="signin-orb" aria-hidden />
      <div
        data-slot="card"
        className="page-enter relative w-full max-w-sm rounded-2xl p-8"
      >
        <div className="mb-8 flex items-center gap-3">
          <img src="/brand/logo-mark.png" alt="" className="size-9" />
          <div>
            <div className="text-[26px] leading-none tracking-tight">avaibe</div>
            <div className="mt-1 text-[11px] tracking-wide text-muted-foreground uppercase">LinkedIn intelligence</div>
          </div>
        </div>

        <h1 className="text-gradient text-2xl font-semibold">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">Use your AVAIBE Microsoft work account.</p>

        {params.get('signed_out') && !error && (
          <p className="mt-4 rounded-md bg-muted px-3 py-2 text-sm">You’ve been signed out.</p>
        )}
        {error && (
          <div className="mt-4 rounded-md border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad-fg">
            {ERRORS[error] ?? 'Sign-in failed. Please try again.'}
            {detail && <div className="mt-1 text-xs opacity-80">{detail}</div>}
          </div>
        )}

        <Button className="mt-6 h-10 w-full" onClick={() => (window.location.href = '/api/auth/login')}>
          <MicrosoftLogo /> Sign in with Microsoft
        </Button>
        <p className="mt-4 text-center text-xs text-muted-foreground">Access is by invitation. Ask an admin if you need it.</p>
      </div>
    </div>
  )
}
