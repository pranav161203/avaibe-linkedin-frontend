import type { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { SimpleSelect } from '@/components/common'
import { useTz, ZONES, type ZoneId } from '@/context/timezone'

export function DetailRow({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="grid gap-2 border-t px-6 py-4 first:border-t-0 sm:grid-cols-[200px_minmax(0,1fr)] sm:items-center sm:gap-6">
      <div>
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
      </div>
      <div className="min-w-0 text-sm">{children}</div>
    </div>
  )
}

export function DetailsCard({ footer, children }: { footer?: ReactNode; children: ReactNode }) {
  return (
    <Card className="gap-0 py-0">
      <div className="px-6 pt-5 pb-3">
        <h2 className="text-base font-semibold">Personal details</h2>
      </div>
      <div className="border-t">{children}</div>
      {footer && <div className="flex flex-wrap items-center justify-end gap-3 border-t bg-muted/30 px-6 py-3">{footer}</div>}
    </Card>
  )
}

export function TimeZoneSelect() {
  const tz = useTz()
  return <SimpleSelect value={tz.zone} onChange={(v) => tz.setZone(v as ZoneId)} options={ZONES.map((z) => ({ value: z.id, label: z.long }))} />
}
