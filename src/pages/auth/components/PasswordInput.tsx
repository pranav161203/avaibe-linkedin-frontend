import { useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'

/** A password box with a show/hide button. */
export function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input {...props} type={show ? 'text' : 'password'} className="pr-10" />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}

/** The server's rules, so people see them before submitting: at least 10 characters, not a common password,
 * not only numbers, not like the email. The server checks again and has the final word. */
export const PASSWORD_HINT = 'Minimum 10 characters. Must not be a common password, entirely numeric, or similar to your email.'

export function passwordProblem(pw: string): string | null {
  if (pw.length < 10) return 'Password must be at least 10 characters.'
  if (/^\d+$/.test(pw)) return 'Password cannot be entirely numeric.'
  if (pw.length > 128) return 'Password must be 128 characters or fewer.'
  return null
}
