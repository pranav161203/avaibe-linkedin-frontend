import { useState } from 'react'
import { Check, Copy, Link2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTz } from '@/context/timezone'
import type { Invitation } from '@/lib/api'

/** The one-time sign-up link, shown once right after inviting (or renewing). Built on this site's address, so it
 * works on whichever copy of the app you're using. */
export function InviteLink({ invitation, onClose }: { invitation: Invitation; onClose: () => void }) {
  const tz = useTz()
  const [copied, setCopied] = useState(false)
  const link = `${window.location.origin}/signup?token=${invitation.token}`
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked: the box is selectable */
    }
  }
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Link2 className="size-4 text-primary" /> Invitation link for {invitation.email}
        </div>
        <Button size="icon-sm" variant="ghost" aria-label="Close" onClick={onClose}>
          <X />
        </Button>
      </div>
      <div className="mt-3 flex gap-2">
        <Input readOnly value={link} onFocus={(e) => e.target.select()} className="font-mono text-xs" />
        <Button onClick={copy} variant={copied ? 'outline' : 'default'}>
          {copied ? <Check /> : <Copy />} {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Single-use link{invitation.expires_at && <>, valid until {tz.dateTime(invitation.expires_at)}</>}. It will not be shown again.
      </p>
    </div>
  )
}
