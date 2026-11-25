import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/auth'
import { EMAIL } from '../constants'

export function DemoSignIn({ signedOut }: { signedOut: boolean }) {
  const { demoSignIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!EMAIL.test(email.trim())) return setError('Enter a valid email address.')
    if (!password) return setError('Enter your password.')
    demoSignIn(email.trim().toLowerCase())
    setPassword('')
    navigate('/', { replace: true })
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-4">
      <div className="app-backdrop" aria-hidden />
      <div className="signin-orb" aria-hidden />
      <form data-slot="card" onSubmit={submit} noValidate className="page-enter relative w-full max-w-sm rounded-2xl p-8">
        <div className="mb-8 flex items-center gap-3">
          <img src="/brand/logo-mark.png" alt="" className="size-9" />
          <div>
            <div className="text-[26px] leading-none tracking-tight">avaibe</div>
            <div className="mt-1 text-[11px] tracking-wide text-muted-foreground uppercase">LinkedIn intelligence</div>
          </div>
        </div>

        <h1 className="text-gradient text-2xl font-semibold">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to your account.</p>

        {signedOut && <p className="mt-4 rounded-md bg-muted px-3 py-2 text-sm">You have been signed out.</p>}

        <div className="mt-6 space-y-4">
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
                setError(null)
              }}
              placeholder="name@company.com"
              aria-invalid={!!error && !EMAIL.test(email.trim())}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError(null)
                }}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                aria-label={show ? 'Hide password' : 'Show password'}
              >
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          {error && (
            <p role="alert" className="text-sm text-bad-fg">
              {error}
            </p>
          )}
          <Button type="submit" className="h-10 w-full">
            Sign in
          </Button>
        </div>

        <p className="mt-5 rounded-md bg-muted/60 px-3 py-2 text-center text-[11px] text-muted-foreground">
          Demo mode: credentials are not verified, stored or transmitted.
        </p>
      </form>
    </div>
  )
}
