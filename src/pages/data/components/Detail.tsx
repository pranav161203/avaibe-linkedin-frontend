
export function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{children ?? <span className="text-muted-foreground">—</span>}</dd>
    </div>
  )
}
