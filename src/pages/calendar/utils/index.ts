import type { CalendarItem } from '@/lib/api'
import { FORMAT_LABELS } from '@/lib/format'
import { PLANNED_FORMAT_LABELS } from '@/lib/publishing'
import { STORE, type Layer } from '../constants'

export function loadHidden(): Set<Layer> {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORE) ?? '[]') as Layer[])
  } catch {
    return new Set()
  }
}

export function saveHidden(s: Set<Layer>) {
  try {
    localStorage.setItem(STORE, JSON.stringify([...s]))
  } catch {}
}

export const covers = (i: CalendarItem, day: string) => i.start <= day && day <= i.end

export const postFormat = (f: string) => (FORMAT_LABELS as Record<string, string>)[f] ?? f

export const plannedFormat = (f: string) => (PLANNED_FORMAT_LABELS as Record<string, string>)[f] ?? f

export const plannedStatus = (s: string) => ({ draft: 'unpublished', approved: 'scheduled', publishing: 'publishing' })[s] ?? s
