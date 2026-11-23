const KEY = 'app.demoSignIn'

export function readDemoEmail(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function writeDemoEmail(email: string | null) {
  try {
    if (email) localStorage.setItem(KEY, email)
    else localStorage.removeItem(KEY)
  } catch {}
}
