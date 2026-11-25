import type { Suggestion } from '@/lib/api'

export const PAGE_CHECKLIST: { id: string; label: string; why: string; priority: Suggestion['priority'] }[] = [
  { id: 'tagline', label: 'State the offering, audience and location in the tagline', why: 'Example: “Custom software, ERP and school systems for UAE businesses”. The tagline is the first text visitors read.', priority: 'high' },
  { id: 'button', label: 'Configure the custom button (Visit website or Contact us)', why: 'Converts page visits into website visits or enquiries.', priority: 'high' },
  { id: 'about', label: 'List services, industries and UAE presence in the About section', why: 'Improves LinkedIn search visibility and relevance for UAE visitors.', priority: 'high' },
  { id: 'location', label: 'Set the UAE office as the primary location', why: 'Establishes a local presence for UAE visitors.', priority: 'high' },
  { id: 'featured', label: 'Feature a post with a UAE-relevant offer or example', why: 'The featured post is the first content visitors see.', priority: 'medium' },
  { id: 'proof', label: 'Publish at least one client case study (with permission)', why: 'Evidence of delivered work supports supplier evaluation.', priority: 'medium' },
  { id: 'logo_banner', label: 'Update the logo and banner with a single clear message', why: 'The banner is the most prominent element on the page.', priority: 'medium' },
  { id: 'services', label: 'Complete the Services section', why: 'Makes the company discoverable in service searches.', priority: 'medium' },
  { id: 'industry_size', label: 'Verify the industry and company size', why: 'Used in LinkedIn search filters and page display.', priority: 'low' },
  { id: 'employees', label: 'Ensure founders and staff list the company as their current employer', why: 'Employee profiles link to the page and extend its reach.', priority: 'low' },
]

const SHARED = {
  who: 'UAE decision-makers who visit the company page',
  boost: 'Higher follow and enquiry rates from page visitors.',
  risk: 'None. Requires a few minutes on LinkedIn.',
  confidence: { level: 'medium' as const, reason: 'Standard LinkedIn page practice; not yet measured on this page.' },
  measure: { metric: 'New followers per 100 page visitors', period: '30 days after the change', target: 'Above the previous 30 days' },
  action: null,
  progress: null,
}

export function checklistSuggestion(item: (typeof PAGE_CHECKLIST)[number]): Suggestion {
  return {
    id: `page:${item.id}`,
    category: 'page',
    priority: item.priority,
    title: item.label,
    when: 'One-time change on LinkedIn. Mark as done once complete.',
    why: [item.why],
    ...SHARED,
  }
}

export function inactiveSuggestion(lastPost: string | undefined): Suggestion {
  return {
    id: 'page:active',
    category: 'page',
    priority: 'high',
    title: 'Publish a post this week',
    when: 'In the next few working days',
    why: [lastPost ? `Last tracked post: ${lastPost.slice(0, 10)} (more than 7 days ago).` : 'No posts tracked for this page.', 'Active pages attract more followers.'],
    ...SHARED,
    boost: 'Restores feed visibility with followers and signals an active page to visitors.',
    measure: { metric: 'Impressions and new followers', period: 'The next 7 days', target: 'Return to the page’s typical level' },
  }
}
