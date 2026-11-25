import { PageHeader } from '@/components/common'
import { useAuth } from '@/context/auth'
import { LocalDetails } from './components/LocalDetails'
import { ProfileCard } from './components/ProfileCard'
import { SignedInDetails } from './components/SignedInDetails'
import { PasswordCard } from './components/PasswordCard'

export function ProfilePage() {
  const auth = useAuth()
  const signedIn = !!auth.user && !auth.user.dev
  return (
    <div className="mx-auto max-w-page">
      <PageHeader eyebrow="Your account" back="/" title="Profile" description="Personal details and preferences." />
      <div className="grid items-start gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <ProfileCard />
        {signedIn ? (
          <div className="space-y-4">
            <SignedInDetails />
            <PasswordCard />
          </div>
        ) : (
          <LocalDetails />
        )}
      </div>
    </div>
  )
}
