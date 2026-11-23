import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** A tooltip shown while the mark is hovered or focused */
export function Tip({ children, align = 'center' }: { children: ReactNode; align?: 'center' | 'left' }) {
  return (
    <span
      role="tooltip"
      className={cn(
        'pointer-events-none absolute bottom-full z-20 mb-1.5 hidden rounded-lg bg-foreground px-2.5 py-1.5 text-[11px] leading-snug whitespace-nowrap text-background shadow-md group-hover:block group-focus-visible:block',
        align === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-0',
      )}
    >
      {children}
    </span>
  )
}
