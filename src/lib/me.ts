import { useEffect, useState } from 'react'
import { ROLE_LABELS, useAuth } from '@/context/auth'
import { initials, readProfileName } from '@/pages/profile/utils'

// The profile photo is kept in this browser only; nothing is uploaded
const PHOTO_KEY = 'avaibe.profilePhoto'
const PHOTO_SIZE = 160

export function readProfilePhoto(): string | null {
  try {
    return localStorage.getItem(PHOTO_KEY)
  } catch {
    return null
  }
}

/** Crop to a centred square, shrink, and keep in this browser */
export async function saveProfilePhoto(file: File): Promise<void> {
  if (!file.type.startsWith('image/')) throw new Error('Select an image file (JPG, PNG or WebP).')
  if (file.size > 10 * 1024 * 1024) throw new Error('Images must be 10 MB or smaller.')
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = () => reject(new Error('The image could not be read.'))
      i.src = url
    })
    const side = Math.min(img.naturalWidth, img.naturalHeight)
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = PHOTO_SIZE
    canvas.getContext('2d')!.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, PHOTO_SIZE, PHOTO_SIZE)
    localStorage.setItem(PHOTO_KEY, canvas.toDataURL('image/jpeg', 0.85))
  } catch (e) {
    if (e instanceof DOMException) throw new Error('The photo could not be saved because browser storage is blocked.')
    throw e
  } finally {
    URL.revokeObjectURL(url)
  }
  window.dispatchEvent(new Event('profile-changed'))
}

export function removeProfilePhoto() {
  try {
    localStorage.removeItem(PHOTO_KEY)
  } catch {
    /* nothing stored */
  }
  window.dispatchEvent(new Event('profile-changed'))
}

export function useMe() {
  const auth = useAuth()
  const [local, setLocal] = useState(() => ({ name: readProfileName(), photo: readProfilePhoto() }))
  useEffect(() => {
    const update = () => setLocal({ name: readProfileName(), photo: readProfilePhoto() })
    window.addEventListener('profile-changed', update)
    return () => window.removeEventListener('profile-changed', update)
  }, [])
  const signedIn = !!auth.user && !auth.user.dev
  const name = signedIn ? (auth.user!.name ?? auth.user!.email) : local.name || auth.demoEmail?.split('@')[0] || 'You'
  return {
    name,
    initials: initials(name),
    photo: local.photo,
    email: signedIn ? auth.user!.email : auth.demoEmail,
    role: signedIn ? ROLE_LABELS[auth.user!.role] : null,
    signedIn,
  }
}
