import type { ReactNode } from 'react'

/** The centred card the sign-in and sign-up screens share. */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children: ReactNode }) {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="app-backdrop" aria-hidden />
      <div className="signin-orb" aria-hidden />
      <div data-slot="card" className="page-enter relative w-full max-w-sm rounded-2xl p-8">
        <div className="mb-8 flex items-center gap-3">
          <img src="/brand/logo-mark.png" alt="" className="size-9" />
          <div>
            <div className="text-[26px] leading-none tracking-tight">avaibe</div>
            <div className="mt-1 text-[11px] tracking-wide text-muted-foreground uppercase">LinkedIn intelligence</div>
          </div>
        </div>
        <h1 className="text-gradient text-2xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        {children}
      </div>
    </div>
  )
}

export function FormError({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="mt-4 rounded-md border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad-fg">
      {children}
    </div>
  )
}

export function OrDivider() {
  return (
    <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      or
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}
