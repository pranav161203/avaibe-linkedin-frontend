import type { Item } from '@/hooks/suggestion-items'
import { ItemCard } from './ItemCard'

export function ItemList({
  title,
  items,
  accountId,
  highlight,
  muted,
  showArea,
  children,
}: {
  title?: string
  items: Item[]
  accountId: number
  highlight?: boolean
  muted?: boolean
  showArea?: boolean
  children?: React.ReactNode
}) {
  return (
    <section className="space-y-2">
      {title && <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{title}</h2>}
      {items.map((it) => (
        <ItemCard key={it.key} item={it} accountId={accountId} highlight={highlight} muted={muted} showArea={showArea} />
      ))}
      {children}
    </section>
  )
}
