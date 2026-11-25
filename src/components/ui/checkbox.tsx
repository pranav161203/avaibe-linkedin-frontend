/**
 * The app's checkbox: a native input (keyboard, labels and forms keep working) drawn as a rounded box that fills
 * with the brand colour and shows a tick when checked. Use inside a <label> with the text next to it.
 */
import type { InputHTMLAttributes } from 'react'
import { Check, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Checkbox({
  className,
  indeterminate,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { indeterminate?: boolean }) {
  return (
    <span className={cn('relative inline-flex size-[18px] shrink-0 items-center justify-center', className)}>
      <input
        type="checkbox"
        {...props}
        className={cn(
          'peer size-[18px] cursor-pointer appearance-none rounded-[6px] border-[1.5px] border-input bg-card shadow-xs transition-all',
          'hover:border-primary/60 checked:border-primary checked:bg-primary',
          'focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-45',
          indeterminate && 'border-primary bg-primary',
        )}
      />
      {indeterminate ? (
        <Minus className="pointer-events-none absolute size-3 text-primary-foreground" strokeWidth={3} />
      ) : (
        <Check
          className="pointer-events-none absolute size-3 scale-50 text-primary-foreground opacity-0 transition-all peer-checked:scale-100 peer-checked:opacity-100"
          strokeWidth={3}
        />
      )}
    </span>
  )
}
