import { Link, useParams } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common'
import { PostDetail } from './components/PostDetail'
import { useGetPost } from '@/pages/data/queries'

export function PostDetailPage() {
  const id = Number(useParams().id)
  const { data: post, isLoading, error } = useGetPost(id)
  if (isLoading) return <Skeleton className="mx-auto h-96 max-w-6xl" />
  if (error || !post) return <EmptyState>Post not found. <Link to="/posts" className="underline">Back to posts</Link></EmptyState>
  return <PostDetail post={post} />
}
