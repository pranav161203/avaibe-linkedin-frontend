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
    gives: 'Publish to the connected member’s personal profile',
  },
  {
    name: 'Sign In with LinkedIn (OpenID Connect)',
    status: 'active' as const,
    gives: 'Identify the connected member (name, email, photo)',
  },
  {
    name: 'Community Management API',
    status: 'pending' as const,
    gives: 'Publish as the company page and read page analytics, post analytics and follower demographics. Requires approval using AVAIBE’s registered company details.',
  },
]
