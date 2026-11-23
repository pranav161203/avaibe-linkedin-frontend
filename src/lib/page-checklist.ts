import type { Suggestion } from '@/lib/api'

export const PAGE_CHECKLIST: { id: string; label: string; why: string; priority: Suggestion['priority'] }[] = [
  { id: 'tagline', label: 'Make the tagline say what you do, for whom and where', why: 'e.g. “Custom software, ERP and school systems for UAE businesses”. Visitors decide in seconds.', priority: 'high' },
  { id: 'button', label: 'Set the page’s custom button (Visit website or Contact us)', why: 'Turns a page visit into a website visit or an enquiry.', priority: 'high' },
  { id: 'about', label: 'Name your services, industries and the UAE in the About section', why: 'Helps LinkedIn search and tells UAE visitors they are in the right place.', priority: 'high' },
  { id: 'location', label: 'Add the UAE office as the primary location', why: 'Signals a local presence to UAE visitors, who are much more likely to visit than to follow today.', priority: 'high' },
  { id: 'featured', label: 'Pin a post that points to a UAE-relevant offer or example', why: 'The first post visitors see should speak to UAE decision-makers.', priority: 'medium' },
  { id: 'proof', label: 'Show at least one client example or case study (with permission)', why: 'Proof beats claims for buyers comparing suppliers.', priority: 'medium' },
  { id: 'logo_banner', label: 'Refresh the logo and banner with one clear message', why: 'The banner is the largest space on the page.', priority: 'medium' },
  { id: 'services', label: 'Fill in the Services section on LinkedIn', why: 'Lets people find AVAIBE when they search for a service.', priority: 'medium' },
  { id: 'industry_size', label: 'Check the page’s industry and company size', why: 'Used in LinkedIn search filters and in how the page is shown.', priority: 'low' },
  { id: 'employees', label: 'Ask the founders and team to list AVAIBE as their current employer', why: 'Their profiles link to the page and introduce it to their networks.', priority: 'low' },
]

const SHARED = {
  who: 'UAE decision-makers who visit the company page',
  boost: 'More of the people who visit the page follow it or get in touch.',
  risk: 'None for reach. It takes a few minutes on LinkedIn.',
  confidence: { level: 'medium' as const, reason: 'Common LinkedIn page practice; not yet measured on this page.' },
  measure: { metric: 'New followers per 100 page visitors', period: '30 days after the change', target: 'Higher than the 30 days before' },
  action: null,
  progress: null,
}

export function checklistSuggestion(item: (typeof PAGE_CHECKLIST)[number]): Suggestion {
  return {
    id: `page:${item.id}`,
    category: 'page',
    priority: item.priority,
    title: item.label,
    when: 'Once, on the LinkedIn page. Mark it Done here when it’s in place.',
    why: [item.why],
    ...SHARED,
  }
}

export function inactiveSuggestion(lastPost: string | undefined): Suggestion {
  return {
    id: 'page:active',
    category: 'page',
    priority: 'high',
    title: 'Post on the page this week',
    when: 'In the next few working days',
    why: [lastPost ? `The last tracked post was on ${lastPost.slice(0, 10)}, more than 7 days ago.` : 'No posts are tracked for this page yet.', 'An active page is more likely to be followed.'],
    ...SHARED,
    boost: 'Visitors see a page that is alive, and followers see you in their feed again.',
    measure: { metric: 'Impressions and new followers', period: 'The next 7 days', target: 'Back to the page’s usual level' },
  }
}
