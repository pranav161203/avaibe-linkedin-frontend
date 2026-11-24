import { useRef } from 'react'
import { toast } from 'sonner'
import { Camera, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { UserAvatar } from '@/components/layout/UserAvatar'
import { removeProfilePhoto, saveProfilePhoto, useMe } from '@/lib/me'

// Photo, name, email and role. Sign out lives in the top-right menu only.
export function ProfileCard() {
  const me = useMe()
  const file = useRef<HTMLInputElement>(null)
  return (
    <Card className="items-center px-6 py-7 text-center">
      <div className="relative">
        <UserAvatar className="size-24 text-2xl ring-4 ring-background" />
        <button
          type="button"
          onClick={() => file.current?.click()}
          aria-label={me.photo ? 'Change photo' : 'Upload photo'}
          title={me.photo ? 'Change photo' : 'Upload photo'}
          className="absolute right-0 bottom-0 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-2 ring-card transition-transform hover:scale-105"
        >
          <Camera className="size-4" />
        </button>
      </div>
      <div className="mt-4 w-full min-w-0">
        <div className="truncate text-lg font-semibold">{me.name}</div>
        {me.email && <div className="truncate text-sm text-muted-foreground">{me.email}</div>}
        <span className="mt-2 inline-block rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">{me.role ?? 'Local mode'}</span>
      </div>
      <div className="mt-5 flex w-full flex-col gap-2 border-t pt-5">
        <Button variant="outline" size="sm" onClick={() => file.current?.click()}>
          <Camera /> {me.photo ? 'Change photo' : 'Upload photo'}
        </Button>
        {me.photo && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              removeProfilePhoto()
              toast.success('Photo removed')
            }}
          >
            <Trash2 /> Remove photo
          </Button>
        )}
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">JPG, PNG or WebP, up to 10 MB</p>
      <input
        ref={file}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (!f) return
          try {
            await saveProfilePhoto(f)
            toast.success('Photo updated')
          } catch (err) {
            toast.error((err as Error).message)
          }
        }}
      />
    </Card>
  )
}
