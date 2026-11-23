import { useEffect, useState } from 'react'
import { ROLE_LABELS, useAuth } from '@/context/auth'
import { initials, readProfileName } from '@/pages/profile/utils'

export function useMe() {
  const auth = useAuth()
  const [localName, setLocalName] = useState(readProfileName)
  useEffect(() => {
    const update = () => setLocalName(readProfileName())
    window.addEventListener('profile-changed', update)
    return () => window.removeEventListener('profile-changed', update)
  }, [])
  const signedIn = !!auth.user && !auth.user.dev
  const name = signedIn ? (auth.user!.name ?? auth.user!.email) : localName || auth.demoEmail?.split('@')[0] || 'You'
  return {
    name,
    initials: initials(name),
    email: signedIn ? auth.user!.email : auth.demoEmail,
    role: signedIn ? ROLE_LABELS[auth.user!.role] : null,
    signedIn,
  }
}
