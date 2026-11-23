import { useState } from 'react'
import { toast } from 'sonner'
import { Info, SlidersHorizontal, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader, Section, SimpleSelect } from '@/components/common'
import { useTz, ZONES, type ZoneId } from '@/context/timezone'
import { PROFILE_NAME_KEY, readProfileName } from '../utils'

export function LocalProfile() {
  const tz = useTz()
  const [name, setName] = useState(readProfileName)

  const save = () => {
    try {
      localStorage.setItem(PROFILE_NAME_KEY, name.trim())
      window.dispatchEvent(new Event('profile-changed'))
      toast.success('Profile saved on this device')
    } catch {
      toast.error('This browser is blocking local storage, so the name can’t be saved')
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader eyebrow="Your account" back="/" title="Profile" description="Your details and personal preferences." />

      <div className="flex items-start gap-3 rounded-lg border border-info/30 bg-info/5 px-4 py-3 text-sm">
        <Info className="mt-0.5 size-4 shrink-0 text-info-fg" />
        <span>
          Sign-in isn’t set up yet, so this profile is stored only in this browser. Once Microsoft sign-in is added, your name, email and
          role (Viewer, Editor, Approver or Admin) will come from your AVAIBE work account.
        </span>
      </div>

      <Section icon={UserRound} title="Details">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="mb-1.5 block">Display name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div>
            <Label className="mb-1.5 block">Role</Label>
            <Input value="Available after sign-in is set up" disabled />
          </div>
        </div>
      </Section>

      <Section icon={SlidersHorizontal} title="Preferences">
        <SimpleSelect
          label="Show times in"
          value={tz.zone}
          onChange={(v) => tz.setZone(v as ZoneId)}
          options={ZONES.map((z) => ({ value: z.id, label: z.long }))}
        />
      </Section>

      <Button onClick={save}>Save profile</Button>
    </div>
  )
}
