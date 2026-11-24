import { UserRound } from 'lucide-react'
import { useMe } from '@/lib/me'
import { cn } from '@/lib/utils'

export function UserAvatar({ className }: { className?: string }) {
  const me = useMe()
  return (
    <span className={cn('flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-semibold', className)}>
      {me.photo ? <img src={me.photo} alt="" className="size-full object-cover" /> : me.initials || <UserRound className="size-4" />}
    </span>
  )
}
