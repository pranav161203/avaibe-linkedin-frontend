import { nowZonedInput } from '@/context/timezone'

export function todayIn(zone: string): string {
  return nowZonedInput(zone).slice(0, 10)
}
