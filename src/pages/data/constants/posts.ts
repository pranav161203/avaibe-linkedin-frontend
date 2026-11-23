
export const PAGE_SIZES = ['10', '25', '50']

export const MIN_FOR_TYPICAL = 5 // posts needed at the same age before "vs typical" is shown

/** Default order: latest post first */
export const DEFAULT_SORT = { key: 'date', desc: true } as const

export const SORT_NAMES: Record<string, string> = {
  date: 'post date',
  impressions: 'impressions',
  views: 'views',
  clicks: 'clicks',
  ctr: 'CTR',
  reactions: 'reactions',
  comments: 'comments',
  reposts: 'reposts',
  vs: 'vs typical',
}
