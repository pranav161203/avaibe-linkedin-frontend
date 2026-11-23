import type { totals } from '@/components/period'

export type Totals = ReturnType<typeof totals>

export const median = (v: number[]) => {
  if (!v.length) return null
  const s = [...v].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/** The date in UAE time, as a local Date at midnight (for week maths) */
export const uaeDay = (iso: string) => {
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai' }).format(new Date(iso))
  return new Date(`${ymd}T00:00:00`)
}

export const WEEKS = 12
