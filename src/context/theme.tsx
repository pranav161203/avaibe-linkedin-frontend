import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Theme = 'light' | 'dark' | 'system'
const KEY = 'app.look'

export const ACCENTS = [
  { value: 'indigo', label: 'Indigo', swatch: '#4f46e5' },
  { value: 'blue', label: 'Blue', swatch: '#2563eb' },
  { value: 'teal', label: 'Teal', swatch: '#0d9488' },
  { value: 'violet', label: 'Violet', swatch: '#7c3aed' },
  { value: 'rose', label: 'Rose', swatch: '#e11d48' },
] as const
export type Accent = (typeof ACCENTS)[number]['value']
const ACCENT_KEY = 'app.accent'

function readAccent(): Accent {
  try {
    const v = localStorage.getItem(ACCENT_KEY)
    return (ACCENTS.find((a) => a.value === v)?.value ?? 'indigo') as Accent
  } catch {
    return 'indigo'
  }
}
const media = () => window.matchMedia('(prefers-color-scheme: dark)')

function readTheme(): Theme {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'dark' || v === 'system' ? v : 'light'
  } catch {
    return 'light'
  }
}

const Ctx = createContext<{
  theme: Theme
  resolved: 'light' | 'dark'
  setTheme: (t: Theme) => void
  accent: Accent
  setAccent: (a: Accent) => void
} | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readTheme)
  const [systemDark, setSystemDark] = useState(() => media().matches)
  const resolved: 'light' | 'dark' = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme

  useEffect(() => {
    const m = media()
    const onChange = () => setSystemDark(m.matches)
    m.addEventListener('change', onChange)
    return () => m.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolved === 'dark')
  }, [resolved])

  const setTheme = (t: Theme) => {
    setThemeState(t)
    try {
      localStorage.setItem(KEY, t)
    } catch {}
  }

  const [accent, setAccentState] = useState<Accent>(readAccent)
  useEffect(() => {
    document.documentElement.dataset.accent = accent
  }, [accent])
  const setAccent = (a: Accent) => {
    setAccentState(a)
    try {
      localStorage.setItem(ACCENT_KEY, a)
    } catch {}
  }

  return <Ctx.Provider value={{ theme, resolved, setTheme, accent, setAccent }}>{children}</Ctx.Provider>
}

export function useTheme() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
