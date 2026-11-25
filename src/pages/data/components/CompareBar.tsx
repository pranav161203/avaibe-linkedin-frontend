import { useNavigate } from 'react-router-dom'
import { GitCompareArrows } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MAX_COMPARE } from '../constants/posts'

export function CompareBar({ picked, onClear }: { picked: number[]; onClear: () => void }) {
  const navigate = useNavigate()
  if (!picked.length) return null
  return (
    <div
      role="region"
      aria-label="Compare selected posts"
      className="fixed inset-x-0 bottom-6 z-40 mx-auto flex w-fit max-w-[calc(100vw-2rem)] flex-wrap items-center gap-3 rounded-full bg-foreground py-2 pr-2 pl-5 text-sm text-background shadow-xl"
    >
      <span className="font-medium">
        {picked.length} selected
        <span className="ml-1.5 font-normal opacity-70">{picked.length < 2 ? '· select at least one more' : picked.length >= MAX_COMPARE ? '· maximum reached' : `· up to ${MAX_COMPARE}`}</span>
      </span>
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" onClick={onClear} className="text-background hover:bg-background/15 hover:text-background">
          Clear
        </Button>
        <Button size="sm" disabled={picked.length < 2} onClick={() => navigate(`/compare?ids=${picked.join(',')}`)}>
          <GitCompareArrows /> Compare
        </Button>
      </div>
    </div>
  )
}
