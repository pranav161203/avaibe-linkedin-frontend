import { createContext, useContext, useState, type ReactNode } from 'react'
import { isoToZonedInput, pad, partsIn, shiftSlot, zonedInputToIso } from '@/lib/tz'

export { isoToZonedInput, nowZonedInput, zonedInputToIso } from '@/lib/tz'

export const ZONES = [
  { id: 'Asia/Dubai', label: 'UAE', long: 'UAE (GST)' },
  { id: 'Asia/Kolkata', label: 'IST', long: 'India (IST)' },
  { id: 'Europe/London', label: 'London', long: 'London (GMT/BST)' },
] as const
export type ZoneId = (typeof ZONES)[number]['id']
export const UAE: ZoneId = 'Asia/Dubai'

const STORAGE_KEY = 'avaibe.timezone'

function readStored(): ZoneId {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v && ZONES.some((z) => z.id === v)) return v as ZoneId
  } catch {}
  return UAE
}

export function zoneLabel(zone: ZoneId): string {
  return ZONES.find((z) => z.id === zone)?.label ?? zone
}

interface TzCtx {
  zone: ZoneId
  setZone: (z: ZoneId) => void
  label: string
  isUae: boolean
  dateTime: (iso: string | null | undefined) => string
  time: (iso: string | null | undefined) => string
  weekday: (iso: string | null | undefined) => string
  dual: (iso: string | null | undefined) => string
  slotInZone: (uaeSlot: string) => string | null
}

const Ctx = createContext<TzCtx | null>(null)

export function TimezoneProvider({ children }: { children: ReactNode }) {
  const [zone, setZoneState] = useState<ZoneId>(readStored)
  const setZone = (z: ZoneId) => {
    setZoneState(z)
    try {
      localStorage.setItem(STORAGE_KEY, z)
    } catch {}
  }
  const label = zoneLabel(zone)

  const dateTime = (iso: string | null | undefined) => (iso ? isoToZonedInput(iso, zone).replace('T', ' ') : '—')

  const value: TzCtx = {
    zone,
    setZone,
    label,
    isUae: zone === UAE,
    dateTime,
    time: (iso) => (iso ? dateTime(iso).slice(11) : '—'),
    weekday: (iso) => (iso ? partsIn(new Date(iso).getTime(), zone).weekday : '—'),
    dual: (iso) => {
      if (!iso) return '—'
      if (zone === UAE) return `${dateTime(iso)} UAE`
      const u = partsIn(new Date(iso).getTime(), UAE)
      return `${dateTime(iso)} ${label} (${pad(u.hour)}:${pad(u.minute)} UAE)`
    },
    slotInZone: (uaeSlot) => {
      if (zone === UAE) return null
      const s = shiftSlot(uaeSlot, zone)
      return s ? `${s} ${label}` : null
    },
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useTz() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useTz must be used inside TimezoneProvider')
  return ctx
}

export const toIso = zonedInputToIso
