import { Copy, Type } from 'lucide-react'
import { IconTile } from './IconTile'
import { copy } from '../utils'

export function Block({
  icon,
  title,
  subtitle,
  action,
  children,
}: {
  icon: typeof Type
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl p-4 ring-1 ring-border">
      <div className="mb-3 flex items-start gap-3">
        <IconTile icon={icon} />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">{title}</div>
          {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

export function TextBox({ text }: { text: string }) {
  return (
    <div className="relative rounded-lg bg-muted/40 px-4 py-3 pr-11 text-sm leading-relaxed whitespace-pre-wrap ring-1 ring-border">
      {text}
      <button
        type="button"
        onClick={() => copy(text)}
        aria-label="Copy"
        className="absolute top-2.5 right-2.5 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Copy className="size-4" />
      </button>
    </div>
  )
}
