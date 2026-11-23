import { Link, useParams } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { useAccount } from '@/context/account'
import { Editor } from './components/Editor'
import { useGetPlannedPosts } from '@/pages/publishing/queries'

export function CreatePostPage() {
  const { id } = useParams()
  const { account } = useAccount()
  const { data: planned, isLoading } = useGetPlannedPosts(account?.id)
  const editing = id ? planned?.find((p) => p.id === Number(id)) : undefined

  if (!account) return null
  if (id && isLoading) return <Skeleton className="h-[70vh] rounded-2xl" />
  if (id && !editing) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center text-sm text-muted-foreground">
        This post isn’t in {account.name}’s queue. It may belong to another account or have been deleted.{' '}
        <Link to="/publishing" className="underline">
          Back to Publishing
        </Link>
      </div>
    )
  }
  return <Editor key={editing?.id ?? 'new'} accountId={account.id} accountName={account.name} initial={editing} />
}
