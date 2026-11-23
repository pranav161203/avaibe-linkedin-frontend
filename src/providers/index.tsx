import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AccountProvider } from '@/context/account'
import { AuthProvider } from '@/context/auth'
import { ThemeProvider, useTheme } from '@/context/theme'
import { TimezoneProvider } from '@/context/timezone'
import { queryClient } from './query-client'

export { queryClient }

function ThemedToaster() {
  const { resolved } = useTheme()
  return <Toaster richColors position="top-right" theme={resolved} />
}

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <TimezoneProvider>
            <AuthProvider>
              <AccountProvider>{children}</AccountProvider>
            </AuthProvider>
          </TimezoneProvider>
          <ThemedToaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
