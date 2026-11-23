import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/common'
import { PostForm } from '@/pages/data/components/PostForm'
import { useAccount } from '@/context/account'
import { useSavePost } from '@/pages/data/queries'

export function NewPostPage() {
  const { account } = useAccount()
  const save = useSavePost()
  const navigate = useNavigate()
  if (!account) return null

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Data"
        back="/data?tab=posts"
        title="Log post"
        description={
          <>
            Already posted on LinkedIn? Record it here to track its numbers on {account.name}. To write a new post, use{' '}
            <Link to="/create" className="underline underline-offset-2">
              Create post
            </Link>
            .
          </>
        }
      />
      <Card>
        <CardContent>
          <PostForm
            accountId={account.id}
            submitLabel="Save post"
            submitting={save.isPending}
            onSubmit={(body) =>
              save.mutate(body, {
                onSuccess: (p) => {
                  toast.success('Post saved')
                  navigate(`/posts/${p.id}`)
                },
                onError: (e) => toast.error(e.message),
              })
            }
          />
        </CardContent>
      </Card>
    </div>
  )
}
