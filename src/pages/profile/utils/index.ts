
export const PROFILE_NAME_KEY = 'avaibe.profileName'

export function readProfileName(): string {
  try {
    return localStorage.getItem(PROFILE_NAME_KEY) ?? ''
  } catch {
    return ''
  }
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return parts.length ? (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() : ''
}
