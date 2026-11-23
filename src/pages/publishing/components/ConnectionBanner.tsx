import { Link } from 'react-router-dom'
import type { LinkedInConnection } from '@/lib/api'

export function ConnectionBanner({ connection }: { connection?: LinkedInConnection }) {
  if (!connection) {
    return (
      <div className="rounded-lg border border-warn/50 bg-warn/10 px-4 py-3 text-sm">
        No LinkedIn profile is connected to this account, so nothing can be published yet. You can still draft posts.{' '}
        <Link to="/linkedin" className="underline">Connect LinkedIn</Link>
      </div>
    )
  }
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border px-4 py-3 text-sm">
      {connection.picture_url && <img src={connection.picture_url} alt="" className="size-6 rounded-full" />}
      Posts publish to <b>{connection.name}</b>'s personal LinkedIn profile.
      {connection.expired ? (
        <span className="text-bad-fg">
          Connection expired. <Link to="/linkedin" className="underline">Reconnect</Link>
        </span>
      ) : (
        <span className="text-muted-foreground">Connection valid for {connection.days_left} more days.</span>
      )}
    </div>
  )
}
