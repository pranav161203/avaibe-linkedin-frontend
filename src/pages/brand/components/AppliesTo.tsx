/** "Applies to" for a knowledge source: every account (company-wide facts) or only the accounts ticked. */
import { Check } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { useAccount } from '@/context/account'
import { cn } from '@/lib/utils'

export function AppliesTo({ value, onChange }: { value: number[]; onChange: (ids: number[]) => void }) {
  const { accounts } = useAccount()
  const all = value.length === 0
  const toggle = (id: number) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id])
  if (accounts.length < 2) return null // one account: nothing to choose

  return (
    <div className="space-y-1.5">
      <Label>Applies to</Label>
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-secondary p-1">
        {(
          [
            [true, 'All accounts'],
            [false, 'Selected accounts'],
          ] as const
        ).map(([isAll, label]) => (
          <button
            key={label}
            type="button"
            aria-pressed={all === isAll}
            onClick={() => onChange(isAll ? [] : value.length ? value : accounts.slice(0, 1).map((a) => a.id))}
            className={cn(
              'rounded-md py-1.5 text-xs font-medium transition-colors',
              all === isAll ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {all ? (
        <p className="text-xs text-muted-foreground">Applies to every company page and profile.</p>
      ) : (
        <ul className="space-y-1">
          {accounts.map((a) => {
            const on = value.includes(a.id)
            return (
              <li key={a.id}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => toggle(a.id)}
                  className={cn('flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm ring-1 transition-colors', on ? 'bg-primary/5 ring-primary/40' : 'ring-border hover:bg-accent')}
                >
                  <span className={cn('flex size-4 items-center justify-center rounded border', on ? 'border-primary bg-primary text-primary-foreground' : 'border-input')}>
                    {on && <Check className="size-3" />}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{a.name}</span>
                  <span className="text-[11px] text-muted-foreground">{a.kind === 'company' ? 'Page' : 'Profile'}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/** The tag shown on a source: "All accounts" or the account names */
export function appliesLabel(ids: number[], accounts: { id: number; name: string }[]) {
  if (!ids.length) return 'All accounts'
  const names = ids.map((id) => accounts.find((a) => a.id === id)?.name ?? 'another account')
  return names.length > 2 ? `${names.slice(0, 2).join(', ')} +${names.length - 2}` : names.join(', ')
}
