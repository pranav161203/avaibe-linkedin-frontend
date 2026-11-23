import { Skeleton } from '@/components/ui/skeleton'

export function PageLoading() {
  return (
    <div className="mx-auto max-w-page space-y-3 pt-2">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-4 w-96 max-w-full" />
      <Skeleton className="mt-6 h-64 rounded-xl" />
    </div>
  )
}
