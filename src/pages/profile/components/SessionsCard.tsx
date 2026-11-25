import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { LaptopMinimal, LogOut, MonitorSmartphone, Smartphone } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Section } from '@/components/common'
import { useTz } from '@/context/timezone'
import { getSessions, signOutOtherSessions, signOutSession, type SignedInDevice } from '@/lib/api'

export const SESSIONS_KEY = ['auth', 'sessions'] as const

const METHOD_LABELS: Record<SignedInDevice['method'], string> = {
  password: 'Email and password',
  microsoft: 'Microsoft',
}
const isPhone = (device: string) => /iPhone|Android/.test(device)

/** Where you are signed in. Sign out a lost or shared device without changing your password. */
export function SessionsCard() {
  const tz = useTz()
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: SESSIONS_KEY,
    queryFn: getSessions,
  })
  const refresh = () => qc.invalidateQueries({ queryKey: SESSIONS_KEY })
  const one = useMutation({
    mutationFn: signOutSession,
    onSuccess: () => (toast.success('Device signed out'), refresh()),
    onError: (e) => toast.error(e.message),
  })
  const others = useMutation({
    mutationFn: signOutOtherSessions,
    onSuccess: (r) => (toast.success(r.signed_out === 1 ? '1 device signed out' : `${r.signed_out} devices signed out`), refresh()),
    onError: (e) => toast.error(e.message),
  })
  const otherCount = data?.filter((s) => !s.current).length ?? 0

  return (
    <Section
      icon={MonitorSmartphone}
      title="Signed-in devices"
      description="Devices currently signed in to your account. Signing out a device ends its access immediately."
      actions={
        otherCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            disabled={others.isPending}
            onClick={() => window.confirm('Sign out all other devices?') && others.mutate()}
          >
            <LogOut /> Sign out other devices
          </Button>
        )
      }
    >
      {isLoading || !data ? (
        <Skeleton className="h-24" />
      ) : (
        <ul className="divide-y rounded-lg border">
          {data.map((s) => {
            const Icon = isPhone(s.device) ? Smartphone : LaptopMinimal
            return (
              <li key={s.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 text-sm">
                <Icon className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 font-medium">
                    {s.device} {s.current && <Badge variant="outline">This device</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {METHOD_LABELS[s.method]} · Signed in {tz.dateTime(s.created_at)} · Last active {tz.dateTime(s.last_used_at)}
                  </div>
                </div>
                {!s.current && (
                  <Button size="xs" variant="ghost" disabled={one.isPending} onClick={() => one.mutate(s.id)}>
                    <LogOut /> Sign out
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Section>
  )
}
