import { useAuth } from '@/context/auth'
import { LocalProfile } from './components/LocalProfile'
import { SignedInProfile } from './components/SignedInProfile'

export function ProfilePage() {
  const auth = useAuth()
  if (auth.user && !auth.user.dev) return <SignedInProfile />
  return <LocalProfile />
}
