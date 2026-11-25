import { Clock } from 'lucide-react'
import type { CalendarData } from '@/lib/api'

export function TimingNote({ data }: { data: CalendarData }) {
  const t = data.timing
  const text = !t.ready
    ? `Best-time hints: ${t.reason}`
    : t.backtest.verdict === 'helps'
      ? `Best-time hints appear where past performance shows a clear best slot. ${t.backtest.text}`
      : `No reliable best time yet, so hints are not shown. ${t.backtest.text ?? t.backtest.reason ?? ''}`
  return (
    <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
      <Clock className="mt-px size-3.5 shrink-0" /> <span>{text}</span>
    </p>
  )
}
