import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function GridHeading({ cols, children }: { cols: number; children: ReactNode }) {
  return (
    <div className="border-t bg-muted/40 px-4 py-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase" style={{ gridColumn: `1 / span ${cols + 1}` }}>
      {children}
    </div>
  )
}

export function GridRow({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <>
      <div className="sticky left-0 z-10 border-t bg-card px-4 py-2.5 text-[13px] font-medium" title={hint}>
        {label}
        {hint && <div className="text-[11px] font-normal text-muted-foreground">{hint}</div>}
      </div>
      {children}
    </>
  )
}

export function GridCell({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('border-t border-l px-4 py-2.5 text-sm', className)}>{children}</div>
}
