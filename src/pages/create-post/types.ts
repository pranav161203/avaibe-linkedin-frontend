import type { PlannedDetails, PlannedFormat, ChatTurn, PostGoal } from '@/lib/api'

export type Draft = {
  format: PlannedFormat
  caption: string
  topic: string
  industry: string
  cta: string
  goal: PostGoal | null
  scheduledAt?: string | null
  details?: PlannedDetails
}

export type Visual = {
  key: string
  name: string
  kind: 'image' | 'pdf' | 'video'
  load: () => Promise<File>
} | null

export type ChatEntry = { role: 'user'; content: string } | { role: 'assistant'; turn: ChatTurn }
