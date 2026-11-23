import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { UserAvatar } from '@/components/layout/UserAvatar'
import { useAuth } from '@/context/auth'
import { useMe } from '@/lib/me'

export function ProfileCard() {
  const me = useMe()
  const auth = useAuth()
  const canSignOut = auth.enabled || !!auth.demoEmail
  return (
    <Card className="items-center px-6 py-7 text-center">
      <UserAvatar className="size-24 text-2xl ring-4 ring-background" />
      <div className="mt-4 w-full min-w-0">
        <div className="truncate text-lg font-semibold">{me.name}</div>
        {me.email && <div className="truncate text-sm text-muted-foreground">{me.email}</div>}
        <span className="mt-2 inline-block rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">{me.role ?? 'Local mode'}</span>
      </div>
      {canSignOut && (
        <div className="mt-5 flex w-full flex-col gap-2 border-t pt-5">
          <Button variant="outline" size="sm" onClick={() => auth.signOut()}>
            <LogOut /> Sign out
          </Button>
        </div>
      )}
    </Card>
  )
}
