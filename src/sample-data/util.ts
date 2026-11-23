export function rng(seed: number) {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    pick: <T>(arr: readonly T[]): T => arr[Math.floor(next() * arr.length)],
    weighted: <T>(items: readonly [T, number][]): T => {
      const total = items.reduce((s, [, w]) => s + w, 0)
      let r = next() * total
      for (const [v, w] of items) {
        r -= w
        if (r <= 0) return v
      }
      return items[items.length - 1][0]
    },
    chance: (p: number) => next() < p,
    noise: (spread = 0.45) => {
      const u = Math.max(next(), 1e-9)
      const v = next()
      const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
      return Math.exp(z * spread)
    },
  }
}
export type Rng = ReturnType<typeof rng>

export const DAY = 86_400_000
export const HOUR = 3_600_000
const UAE_OFFSET = 4 * HOUR
const IST_OFFSET = 5.5 * HOUR

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const
export const HEAT_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export const SLOTS = ['8-10 AM', '10 AM-12 PM', '12-2 PM', '2-4 PM', '4-6 PM', '6-8 PM'] as const
export const OUTSIDE_SLOT = 'Outside 8 AM-8 PM'

const pad = (n: number) => String(n).padStart(2, '0')

function wall(ts: number, offset: number, suffix: string) {
  const d = new Date(ts + offset)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:00${suffix}`
}

export const uaeIso = (ts: number) => wall(ts, UAE_OFFSET, '+04:00')
export const istIso = (ts: number) => wall(ts, IST_OFFSET, '+05:30')
export const uaeDate = (ts: number) => uaeIso(ts).slice(0, 10)
export const uaeTime = (ts: number) => uaeIso(ts).slice(11, 16)
export const uaeHour = (ts: number) => new Date(ts + UAE_OFFSET).getUTCHours()
export const uaeWeekday = (ts: number) => WEEKDAYS[new Date(ts + UAE_OFFSET).getUTCDay()]

export const uaeMidnight = (date: string) => Date.parse(`${date}T00:00:00+04:00`)

export function slotOf(hour: number): string {
  if (hour < 8 || hour >= 20) return OUTSIDE_SLOT
  return SLOTS[Math.floor((hour - 8) / 2)]
}

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export function median(values: (number | null | undefined)[]): number | null {
  const v = values.filter((x): x is number => typeof x === 'number' && Number.isFinite(x)).sort((a, b) => a - b)
  if (!v.length) return null
  const m = Math.floor(v.length / 2)
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2
}

export function sum(values: (number | null | undefined)[]): number | null {
  const v = values.filter((x): x is number => typeof x === 'number')
  return v.length ? v.reduce((a, b) => a + b, 0) : null
}

export const round = (n: number, digits = 4) => Math.round(n * 10 ** digits) / 10 ** digits
