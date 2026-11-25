import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { requestPasswordReset } from '@/lib/api'
import { AuthShell, FormError } from './components/AuthShell'

/** Ask for a reset link. The reply is the same whether or not the email has an account. */
export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.includes('@')) return setError('Enter your work email.')
    setBusy(true)
    setError(null)
    try {
      await requestPasswordReset(email.trim())
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The request could not be sent. Try again.')
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <AuthShell title="Check your email">
        <div className="mt-6 flex gap-3 rounded-lg bg-muted px-4 py-3 text-sm">
          <MailCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p>
            If an account exists for <b>{email.trim()}</b>, a password reset link has been sent. The link expires in 60 minutes.
          </p>
        </div>
        <Button className="mt-6 h-10 w-full" variant="outline" onClick={() => navigate('/signin')}>
          Back to sign in
        </Button>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Reset your password" subtitle="Enter your work email and a reset link will be sent to you.">
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
              setError(null)
            }}
            placeholder="name@company.com"
          />
        </div>
        {error && <FormError>{error}</FormError>}
        <Button type="submit" className="h-10 w-full" disabled={busy}>
          {busy && <Loader2 className="animate-spin" />} Send reset link
        </Button>
      </form>
      <Button variant="ghost" className="mt-3 h-10 w-full" onClick={() => navigate('/signin')}>
        Back to sign in
      </Button>
    </AuthShell>
  )
}
