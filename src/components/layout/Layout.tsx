import { Suspense } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { PageLoading } from '@/components/layout/PageLoading'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { TopBar } from '@/components/layout/TopBar'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { useAccount } from '@/context/account'
import { useAuth } from '@/context/auth'

const DEMO = import.meta.env.VITE_DEMO_BANNER === '1'

export function Layout() {
  const auth = useAuth()
  const { pathname } = useLocation()
  const { error } = useAccount()

  if (auth.isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Skeleton className="h-10 w-40" />
      </div>
    )
  }
  if (auth.error) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background p-6">
        <div className="max-w-md rounded-lg border bg-card p-5 text-sm">
          <p className="font-medium">The app can’t load right now.</p>
          <p className="mt-1 text-muted-foreground">Please try again in a minute. If it keeps happening, contact an admin.</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-3 text-sm font-medium underline underline-offset-2">
            Try again
          </button>
          {import.meta.env.DEV && (
            <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">
              Dev only: the API at <code>/api</code> isn’t answering ({auth.error.message}). Start the backend, or run{' '}
              <code>npm run dev</code> to work on the UI with sample data.
            </p>
          )}
        </div>
      </div>
    )
  }
  if (auth.enabled && !auth.signedIn) return <Navigate to="/signin" replace />
  if (!auth.enabled && !auth.demoEmail) return <Navigate to="/signin" replace />

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0">
        {__SAMPLE_DATA__ && <SampleDataBanner />}
        {DEMO && (
          <div className="bg-primary px-4 py-1.5 text-center text-xs font-medium text-primary-foreground">
            Demo data: the numbers on these screens are sample figures for illustration, not AVAIBE’s real results.
          </div>
        )}
        <header className="flex h-14 shrink-0 items-center px-4 md:px-8">
          <SidebarTrigger className="-ml-1 text-muted-foreground" />
          <TopBar />
        </header>
        <div key={pathname} className="page-enter flex-1 px-4 pb-10 md:px-8">
          {error ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
              <p className="font-medium">Couldn't load accounts.</p>
              <p className="mt-1 text-muted-foreground">Please try again in a minute.{import.meta.env.DEV && ` (${error.message})`}</p>
            </div>
          ) : (
            <Suspense fallback={<PageLoading />}>
              <Outlet />
            </Suspense>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

function SampleDataBanner() {
  const reset = async () => {
    const { resetSampleData } = await import('@/sample-data/api')
    resetSampleData()
    window.location.reload()
  }
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-amber-500/15 px-4 py-1.5 text-center text-xs font-medium text-amber-900 dark:text-amber-200">
      <span>Demo with sample data: the numbers are made up, and changes stay in this browser.</span>
      <button type="button" onClick={reset} className="underline underline-offset-2 hover:no-underline">
        Reset sample data
      </button>
    </div>
  )
}
