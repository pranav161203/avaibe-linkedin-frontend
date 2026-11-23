import type { ChartConfig } from '@/components/ui/chart'

export type AudienceType = 'followers' | 'visitors'

export const chartConfig = {
  uae: { label: 'UAE', color: 'var(--chart-1)' },
  education: { label: 'Education', color: 'var(--chart-2)' },
  decision: { label: 'Decision-makers', color: 'var(--chart-3)' },
} satisfies ChartConfig

export const SERIES = ['uae', 'education', 'decision'] as const
