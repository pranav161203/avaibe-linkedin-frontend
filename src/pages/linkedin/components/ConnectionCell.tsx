import { toast } from 'sonner'
import { Link2, Unlink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { type Account, type LinkedInConnection } from '@/lib/api'
import { useConnectLinkedIn, useDisconnectLinkedIn } from '@/pages/linkedin/queries'

export function ConnectionCell({ account, connection, configured }: { account: Account; connection?: LinkedInConnection; configured: boolean }) {
  const disconnect = useDisconnectLinkedIn()
  const connectLinkedIn = useConnectLinkedIn()

  if (account.kind === 'company') {
    return <span className="text-xs text-muted-foreground">Manual tracking (needs Community Management API)</span>
  }

  const connect = () =>
    connectLinkedIn.mutate(account.id, {
      onSuccess: ({ url }) => {
        window.location.href = url
      },
      onError: (e) => toast.error(e.message),
    })
  const busy = connectLinkedIn.isPending || connectLinkedIn.isSuccess

  if (!connection) {
    return (
      <Button size="sm" variant="outline" disabled={!configured || busy} onClick={connect}>
        <Link2 /> {busy ? 'Opening LinkedIn…' : 'Connect LinkedIn'}
      </Button>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {connection.picture_url && <img src={connection.picture_url} alt="" className="size-6 rounded-full" />}
      <span className="text-sm">{connection.name ?? 'Connected'}</span>
      {connection.expired ? (
        <Badge variant="outline" className="border-bad/40 text-bad-fg">expired</Badge>
      ) : connection.days_left <= 7 ? (
        <Badge variant="outline" className="border-serious/40 text-serious-fg">expires in {connection.days_left}d</Badge>
      ) : (
        <span className="text-xs text-muted-foreground">valid {connection.days_left} more days</span>
      )}
      {(connection.expired || connection.days_left <= 7) && (
        <Button size="xs" variant="outline" disabled={busy} onClick={connect}>
          Reconnect
        </Button>
      )}
      <Button
        size="xs"
        variant="ghost"
        disabled={disconnect.isPending}
        onClick={() => disconnect.mutate(account.id, { onSuccess: () => toast.success('Disconnected'), onError: (e) => toast.error(e.message) })}
      >
        <Unlink /> Disconnect
      </Button>
    </div>
  )
}
