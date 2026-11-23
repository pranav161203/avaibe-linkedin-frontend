import { CalendarClock, Type } from 'lucide-react'
import { useTz } from '@/context/timezone'
import type { AnalysePart } from '@/lib/api'
import { FORMAT_ICON, VISUAL_LABEL } from '../constants'
import type { Draft, Visual } from '../types'

export function useParts(draft: Draft, visual: Visual) {
  const tz = useTz()
  const parts: { value: AnalysePart; label: string; icon: typeof Type; detail: string }[] = [
    {
      value: 'text',
      label: 'Post text',
      icon: Type,
      detail: draft.caption.trim() ? `${draft.caption.length.toLocaleString()} characters: hook, clarity, call to action, hashtags` : 'Nothing written yet',
    },
  ]
  const visualLabel = VISUAL_LABEL[draft.format]
  if (visualLabel)
    parts.push({
      value: 'visual',
      label: visualLabel,
      icon: FORMAT_ICON[draft.format],
      detail: !visual
        ? 'Nothing attached yet: suggests what to make, with a prompt'
        : visual.kind === 'video'
          ? `${visual.name}: the AI can’t watch videos, so it suggests from the text`
          : `${visual.name}: the AI looks at it`,
    })
  parts.push({
    value: 'timing',
    label: 'Posting time',
    icon: CalendarClock,
    detail: draft.scheduledAt
      ? `${tz.weekday(draft.scheduledAt)} ${tz.dual(draft.scheduledAt)}: checked against your past posts`
      : 'Not set: suggests a time from your past posts',
  })
  if (draft.format === 'poll')
    parts.push({
      value: 'poll',
      label: 'Poll question & options',
      icon: FORMAT_ICON.poll,
      detail: draft.details?.question ? `${(draft.details.options ?? []).filter((o) => o.trim()).length} options` : 'No question yet',
    })
  return parts
}
