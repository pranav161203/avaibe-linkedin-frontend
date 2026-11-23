import { useEffect, useState } from 'react'

export function useMinutesLeft(iso: string | null): number | null {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!iso) return
    const t = setInterval(() => setNow(Date.now()), 15_000)
    return () => clearInterval(t)
  }, [iso])
  if (!iso) return null
  const ms = new Date(iso).getTime() - now
  return ms > 0 ? Math.max(1, Math.ceil(ms / 60_000)) : null
}
