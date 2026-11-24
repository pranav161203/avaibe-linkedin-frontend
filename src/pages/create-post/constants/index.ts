import { AlignLeft, BarChart3, FileText, Handshake, Hash, Image as ImageIcon, Layers, Megaphone, MessagesSquare, MousePointerClick, PlayCircle, Sparkles, Type } from 'lucide-react'
import type { PlannedDetails, PlannedFormat, PostGoal } from '@/lib/api'

export const MAX_CHARS = 3000

export const DURATION_LABELS: Record<NonNullable<PlannedDetails['duration']>, string> = { '1d': '1 day', '3d': '3 days', '1w': '1 week', '2w': '2 weeks' }

export const GOAL_ICON: Record<PostGoal, typeof Type> = {
  brand: Megaphone,
  sales: Handshake,
  engagement: MessagesSquare,
}

export const FORMAT_ICON: Record<PlannedFormat, typeof Type> = {
  text: Type,
  image: ImageIcon,
  carousel: Layers,
  video: PlayCircle,
  article: FileText,
  poll: BarChart3,
}

export const FIX_ICON = {
  hashtags: Hash,
  shorter: AlignLeft,
  cta: MousePointerClick,
} as const

export const VISUAL_LABEL: Partial<Record<PlannedFormat, string>> = { image: 'Image', video: 'Video', carousel: 'Carousel slides' }

export const MODES = [
  { value: 'analyse', label: 'Analyse', icon: Sparkles },
  { value: 'chat', label: 'Chat with AI', icon: MessagesSquare },
] as const
