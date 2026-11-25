import { useState } from 'react'
import { toast } from 'sonner'
import { Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PROFILE_NAME_KEY, readProfileName } from '../utils'
import { DetailRow, DetailsCard, TimeZoneSelect } from './DetailsCard'

export function LocalDetails() {
  const [saved, setSaved] = useState(readProfileName)
  const [name, setName] = useState(saved)
  const changed = name.trim() !== saved

  const save = () => {
    try {
      localStorage.setItem(PROFILE_NAME_KEY, name.trim())
      setSaved(name.trim())
      window.dispatchEvent(new Event('profile-changed'))
      toast.success('Changes saved')
    } catch {
      toast.error('Name could not be saved. Browser storage is blocked.')
    }
  }

  return (
    <div className="space-y-3">
      <DetailsCard
        footer={
          <>
            {changed && (
              <Button variant="ghost" onClick={() => setName(saved)}>
                Cancel
              </Button>
            )}
            <Button onClick={save} disabled={!changed}>
              Save changes
            </Button>
          </>
        }
      >
        <DetailRow label="Display name" hint="Shown in the header">
          <Input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && changed && save()} placeholder="Your name" className="max-w-sm" />
        </DetailRow>
        <DetailRow label="Role">
          <span className="text-muted-foreground">Assigned once sign-in is enabled</span>
        </DetailRow>
        <DetailRow label="Show times in" hint="Applies to all dates and times">
          <TimeZoneSelect />
        </DetailRow>
      </DetailsCard>
      <p className="flex items-start gap-1.5 px-1 text-xs text-muted-foreground">
        <Info className="mt-px size-3.5 shrink-0" />
        Sign-in is disabled, so your name and photo are stored in this browser only.
      </p>
    </div>
  )
}
