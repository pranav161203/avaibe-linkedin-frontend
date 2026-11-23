import type { Account } from '@/lib/api'

export const KIND_LABELS: Record<Account['kind'], string> = {
  company: 'Company page',
  founder: 'Founder profile',
  personal: 'Personal profile',
}

export const PRODUCTS = [
  {
    name: 'Share on LinkedIn',
    status: 'active' as const,
    gives: 'Post to the connected person’s personal profile',
  },
  {
    name: 'Sign In with LinkedIn (OpenID Connect)',
    status: 'active' as const,
    gives: 'Identify the connected person (name, email, photo)',
  },
  {
    name: 'Community Management API',
    status: 'pending' as const,
    gives: 'Post as the company page, read page and post analytics, follower demographics. Needs approval with AVAIBE’s registered company details.',
  },
]
