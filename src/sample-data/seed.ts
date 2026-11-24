import type {
  Account,
  AccountDoc,
  AccountDocs,
  AppSettings,
  AudienceRow,
  BrandSettings,
  Checkpoint,
  Decision,
  IdeasRun,
  LastImports,
  Lead,
  LinkedInConnection,
  PageAudienceSnapshot,
  PageDay,
  PerformanceSettings,
  PlannedPost,
  PostFormat,
  PostSummary,
  SegmentSettings,
  Shares,
  Snapshot,
  TeamMember,
} from '@/types/api'
import { DAY, HOUR, istIso, rng, slotOf, uaeDate, uaeHour, uaeIso, uaeMidnight, uaeWeekday, type Rng } from './util'

export interface StoredPost extends PostSummary {
  snapshots: Snapshot[]
  audience: AudienceRow[]
  audience_captured_at: string | null
}

export interface MockDb {
  version: number
  seededAt: string
  nextId: number
  nextRef: number
  accounts: Account[]
  posts: StoredPost[]
  planned: PlannedPost[]
  leads: Lead[]
  team: TeamMember[]
  defaultAccountId: number
  settings: AppSettings['current']
  pageDaily: Record<number, PageDay[]>
  pageAudience: Record<number, PageAudienceSnapshot[]>
  docs: Record<string, AccountDoc<keyof AccountDocs>>
  decisions: Record<number, Decision[]>
  ideaRuns: IdeasRun[]
  connections: LinkedInConnection[]
  lastImports: Record<number, LastImports>
  aiRunsToday: number
}

export const DB_VERSION = 1

export const DEFAULT_SEGMENTS: SegmentSettings = {
  uae_country: ['United Arab Emirates'],
  uae_cities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Al Ain'],
  education_industry: ['Primary and Secondary Education', 'Education Administration Programs', 'Higher Education', 'E-Learning Providers'],
  decision_seniority: ['Owner', 'Partner', 'CXO', 'VP', 'Director'],
  decision_titles: ['Principal', 'Head of School', 'Founder', 'Managing Director', 'IT Manager'],
  tech_functions: ['Information Technology', 'Engineering'],
  partner_functions: ['Business Development', 'Sales'],
}

export const DEFAULT_PERFORMANCE: PerformanceSettings = {
  min_history: 8,
  min_slot_posts: 3,
  cut_high: 90,
  cut_above: 70,
  cut_average: 30,
  cut_below: 10,
  trend_threshold: 10,
}

export const DEFAULT_BRAND: BrandSettings = {
  company_summary:
    'AVAIBE builds custom software, ERP and school management systems for businesses and schools in the UAE, with a delivery team in India.',
  website: 'https://avaibe.example',
  services: ['Custom software', 'ERP', 'School management system', 'AI automation', 'Mobile apps'],
  target_segments: ['UAE private schools', 'UAE SMEs', 'Education groups'],
  differentiators: ['Built for UAE schools and regulations', 'One team from design to support', 'Fixed-scope pilots in 6 weeks'],
  proof_points: ['40+ projects delivered', 'Schools serving 25,000+ students', '98% of clients renew support'],
  voice: 'Clear, practical and warm. Short sentences. No hype.',
  avoid: ['Revolutionary', 'Game-changer', 'Synergy'],
  competitors: ['Generic ERP vendors', 'Offshore agencies'],
  languages: ['English', 'Arabic'],
}

const TOPICS = [
  'School ERP',
  'AI in education',
  'Case study',
  'Product update',
  'Thought leadership',
  'UAE market',
  'Team & culture',
  'Event',
] as const

const CTAS = ['Book a demo', 'Comment', 'Visit website', 'Follow the page', 'Send a DM'] as const
const INDUSTRIES = ['Education', 'Technology', 'Retail', 'Healthcare', 'Real estate'] as const

const HOOKS: Record<(typeof TOPICS)[number], string[]> = {
  'School ERP': [
    'Most UAE schools still run fee collection on spreadsheets.',
    'One login for parents, teachers and the finance office.',
    'What a school ERP should do in its first 30 days.',
  ],
  'AI in education': [
    'AI won’t replace teachers. It will give them back their Sundays.',
    'Three AI tools UAE schools can use this term, safely.',
    'We asked 20 principals how they use AI. Here’s what they said.',
  ],
  'Case study': [
    'How a Dubai school cut admission time from 3 weeks to 4 days.',
    'From 7 systems to 1: an Abu Dhabi education group’s story.',
    'A retailer in Sharjah automated 80% of its stock reports.',
  ],
  'Product update': [
    'New: parents can now pay fees in Apple Pay from the school app.',
    'Arabic-first report cards are live.',
    'Attendance now syncs with the ministry portal automatically.',
  ],
  'Thought leadership': [
    'Custom software is cheaper than you think. Bad software is more expensive.',
    'The real cost of “we’ll just use Excel for now”.',
    'Why we start every project with a 6-week pilot.',
  ],
  'UAE market': [
    'The UAE has 600+ private schools. Most share the same five problems.',
    'What the new data-protection rules mean for UAE schools.',
    'UAE SMEs are digitising fast. Here’s where they start.',
  ],
  'Team & culture': [
    'Meet the people who answer when a school calls us at 7 AM.',
    'Our team spent Friday building a tool for a local charity.',
    'We’re hiring: senior React developer (Dubai / remote).',
  ],
  Event: [
    'See you at GITEX: stand H7, live demos all week.',
    'Join our free webinar: “ERP for schools in 45 minutes”.',
    'Thank you to everyone who came to our Dubai breakfast session.',
  ],
}

const BODIES = [
  'We see it every week: good teams held back by tools that don’t talk to each other.',
  'The fix is rarely more software. It’s the right software, set up for how you actually work.',
  'Here’s what changed, in plain numbers, after the first term.',
  'If this sounds familiar, you’re not alone. Most of our clients started exactly here.',
  'Small changes, done properly, add up quickly.',
]

const CTA_LINES: Record<string, string> = {
  'Book a demo': 'Want to see it on your own data? Book a 20-minute demo (link in comments).',
  Comment: 'What would you add? Tell us in the comments.',
  'Visit website': 'Read the full story on our website.',
  'Follow the page': 'Follow AVAIBE for practical tips every week.',
  'Send a DM': 'Send us a message and we’ll share the checklist.',
}

const HASHTAGS = ['#UAE', '#EdTech', '#SchoolERP', '#Dubai', '#AbuDhabi', '#AI', '#DigitalTransformation', '#Education', '#SME']

function caption(r: Rng, topic: (typeof TOPICS)[number], cta: string | null, tags: string[]) {
  const lines = [r.pick(HOOKS[topic]), '', r.pick(BODIES)]
  if (r.chance(0.5)) lines.push('', r.pick(BODIES))
  if (cta) lines.push('', CTA_LINES[cta])
  if (tags.length) lines.push('', tags.join(' '))
  return lines.join('\n')
}

const FORMAT_LIFT: Record<PostFormat, number> = {
  image: 1,
  carousel: 1.45,
  video: 1.2,
  poll: 1.05,
  newsletter: 0.8,
  text: 0.75,
  untagged: 0.9,
}
const SLOT_LIFT: Record<string, number> = {
  '8-10 AM': 1.15,
  '10 AM-12 PM': 1.3,
  '12-2 PM': 1.0,
  '2-4 PM': 0.9,
  '4-6 PM': 0.85,
  '6-8 PM': 0.8,
}
const DAY_LIFT: Record<string, number> = { Monday: 1.1, Tuesday: 1.2, Wednesday: 1.1, Thursday: 1.0, Friday: 0.8, Saturday: 0.6, Sunday: 0.7 }

export const CHECKPOINT_HOURS: Record<Checkpoint, number> = { '1h': 1, '6h': 6, '24h': 24, '48h': 48, '7d': 168 }
const CHECKPOINT_SHARE: Record<Checkpoint, number> = { '1h': 0.1, '6h': 0.38, '24h': 0.72, '48h': 0.88, '7d': 1 }

export function buildSnapshot(
  id: number,
  postId: number,
  checkpoint: Checkpoint,
  publishedTs: number,
  totals: Record<string, number>,
  format: PostFormat,
): Snapshot {
  const share = CHECKPOINT_SHARE[checkpoint]
  const n = (k: string) => (totals[k] != null ? Math.round(totals[k] * share) : null)
  const impressions = n('impressions')!
  const clicks = n('clicks')!
  const reactions = n('reactions')!
  const comments = n('comments')!
  const reposts = n('reposts')!
  const engagements = clicks + reactions + comments + reposts
  return {
    id,
    post_id: postId,
    checkpoint,
    captured_at: new Date(publishedTs + CHECKPOINT_HOURS[checkpoint] * HOUR + 20 * 60_000).toISOString(),
    notes: null,
    impressions,
    members_reached: n('members_reached'),
    clicks,
    reactions,
    comments,
    reposts,
    video_views: format === 'video' ? n('video_views') : null,
    poll_votes: format === 'poll' ? n('poll_votes') : null,
    newsletter_views: format === 'newsletter' ? n('newsletter_views') : null,
    newsletter_subscribers: format === 'newsletter' ? n('newsletter_subscribers') : null,
    followers_gained: n('followers_gained'),
    engagements,
    engagement_rate: impressions ? engagements / impressions : null,
    click_rate: impressions ? clicks / impressions : null,
  }
}

export function computeShares(rows: AudienceRow[] | { dimension: string; value: string; pct: number | null }[], seg: SegmentSettings): Shares {
  const total = (dim: string, match: (v: string) => boolean) => {
    const rs = rows.filter((r) => r.dimension === dim)
    if (!rs.length) return null
    return Math.min(1, rs.filter((r) => match(r.value)).reduce((s, r) => s + (r.pct ?? 0), 0) / 100)
  }
  const inList = (list: string[]) => (v: string) => list.some((x) => v.toLowerCase().includes(x.toLowerCase()))
  return {
    uae_share: total('location', inList([...seg.uae_country, ...seg.uae_cities])),
    education_share: total('industry', inList(seg.education_industry)),
    decision_maker_share: total('seniority', inList(seg.decision_seniority)),
    tech_share: total('job_function', inList(seg.tech_functions)),
    partner_share: total('job_function', inList(seg.partner_functions)),
  }
}

function audienceRows(r: Rng, uaeBias: number): AudienceRow[] {
  const uae = Math.round((22 + r.next() * 25) * uaeBias)
  const dubai = Math.round(uae * 0.55)
  return [
    { dimension: 'location', value: 'United Arab Emirates', pct: uae },
    { dimension: 'location', value: 'Dubai', pct: dubai },
    { dimension: 'location', value: 'India', pct: Math.round(30 + r.next() * 20) },
    { dimension: 'location', value: 'Saudi Arabia', pct: Math.round(3 + r.next() * 5) },
    { dimension: 'industry', value: 'Primary and Secondary Education', pct: Math.round(8 + r.next() * 14) },
    { dimension: 'industry', value: 'IT Services and IT Consulting', pct: Math.round(18 + r.next() * 15) },
    { dimension: 'industry', value: 'Software Development', pct: Math.round(8 + r.next() * 8) },
    { dimension: 'seniority', value: 'Senior', pct: Math.round(20 + r.next() * 10) },
    { dimension: 'seniority', value: 'Director', pct: Math.round(5 + r.next() * 6) },
    { dimension: 'seniority', value: 'Owner', pct: Math.round(3 + r.next() * 5) },
    { dimension: 'seniority', value: 'CXO', pct: Math.round(2 + r.next() * 4) },
    { dimension: 'job_function', value: 'Information Technology', pct: Math.round(15 + r.next() * 10) },
    { dimension: 'job_function', value: 'Business Development', pct: Math.round(6 + r.next() * 6) },
    { dimension: 'job_function', value: 'Education', pct: Math.round(6 + r.next() * 8) },
  ]
}

export function createSeed(now = Date.now()): MockDb {
  const r = rng(20261123)
  let nextId = 1
  let nextRef = 1
  const id = () => nextId++
  const ref = () => `P-${String(nextRef++).padStart(4, '0')}`

  const accounts: Account[] = [
    { id: 1, name: 'AVAIBE', kind: 'company', linkedin_url: 'https://www.linkedin.com/company/example-avaibe', is_test: false, parent_id: null },
    { id: 2, name: 'Rania Haddad (CEO)', kind: 'founder', linkedin_url: 'https://www.linkedin.com/in/example-rania', is_test: false, parent_id: 1 },
    { id: 3, name: 'Karan Mehta (CTO)', kind: 'founder', linkedin_url: 'https://www.linkedin.com/in/example-karan', is_test: false, parent_id: 1 },
    { id: 4, name: 'AVAIBE Test page', kind: 'company', linkedin_url: null, is_test: true, parent_id: null },
  ]
  nextId = 10

  const settings = { segments: DEFAULT_SEGMENTS, performance: DEFAULT_PERFORMANCE, brand: DEFAULT_BRAND }

  const posts: StoredPost[] = []
  const plan: { accountId: number; count: number; base: number; days: number; author: string }[] = [
    { accountId: 1, count: 64, base: 1400, days: 210, author: 'AVAIBE' },
    { accountId: 2, count: 34, base: 2100, days: 180, author: 'Rania Haddad' },
    { accountId: 3, count: 22, base: 1100, days: 160, author: 'Karan Mehta' },
    { accountId: 4, count: 4, base: 120, days: 40, author: 'AVAIBE Test page' },
  ]
  for (const p of plan) {
    for (let i = 0; i < p.count; i++) {
      const daysAgo = 1.2 + (i / p.count) * p.days + r.next() * 2
      let ts = now - daysAgo * DAY
      let wd = uaeWeekday(ts)
      if ((wd === 'Saturday' || wd === 'Sunday') && r.chance(0.8)) {
        ts -= (wd === 'Saturday' ? 1 : 2) * DAY
        wd = uaeWeekday(ts)
      }
      const hour = r.weighted<number>([[8, 3], [9, 4], [10, 5], [11, 4], [12, 3], [13, 2], [14, 2], [15, 2], [16, 1], [17, 1], [18, 1], [19, 1], [21, 0.4]])
      ts = uaeMidnight(uaeDate(ts)) + hour * HOUR + r.int(0, 3) * 15 * 60_000
      const old = daysAgo > 140
      const timeKnown = !(old && r.chance(0.6))
      const format: PostFormat =
        p.accountId === 1
          ? r.weighted<PostFormat>([['image', 5], ['carousel', 3], ['video', 2], ['poll', 1], ['text', 1], ['newsletter', 0.5], ['untagged', old ? 2 : 0]])
          : r.weighted<PostFormat>([['text', 5], ['image', 3], ['carousel', 1], ['video', 1], ['poll', 1]])
      const topic = r.pick(TOPICS)
      const cta = r.chance(0.75) ? r.pick(CTAS) : null
      const tags = r.chance(0.8) ? [...new Set([r.pick(HASHTAGS), r.pick(HASHTAGS), r.pick(HASHTAGS)])] : []
      const slot = slotOf(uaeHour(ts))
      const growth = 1 + (1 - daysAgo / p.days) * 0.5
      const impressions = Math.round(
        p.base * FORMAT_LIFT[format] * (SLOT_LIFT[slot] ?? 0.7) * (DAY_LIFT[uaeWeekday(ts)] ?? 1) * growth * r.noise(0.4),
      )
      const totals: Record<string, number> = {
        impressions,
        members_reached: impressions * (0.62 + r.next() * 0.15),
        clicks: impressions * (0.006 + r.next() * 0.025),
        reactions: impressions * (0.012 + r.next() * 0.03),
        comments: impressions * (0.001 + r.next() * 0.006),
        reposts: impressions * (0.0005 + r.next() * 0.003),
        video_views: impressions * (0.3 + r.next() * 0.3),
        poll_votes: impressions * (0.03 + r.next() * 0.04),
        newsletter_views: impressions * (0.4 + r.next() * 0.2),
        newsletter_subscribers: 3 + r.next() * 20,
        followers_gained: impressions * (0.001 + r.next() * 0.004),
      }
      const postId = id()
      const snapshots: Snapshot[] = []
      const checkpoints: Checkpoint[] = timeKnown ? ['1h', '6h', '24h', '48h', '7d'] : ['7d']
      for (const cp of checkpoints) {
        const due = ts + CHECKPOINT_HOURS[cp] * HOUR
        if (due > now) continue
        if (daysAgo < 9 && (cp === '48h' || cp === '7d') && r.chance(0.45)) continue
        if (cp === '1h' && r.chance(0.35)) continue
        snapshots.push(buildSnapshot(id(), postId, cp, ts, totals, format))
      }
      const withAudience = timeKnown && r.chance(0.55)
      const audience = withAudience ? audienceRows(r, p.accountId === 1 ? 1 : 0.85) : []
      const suggested = !timeKnown && r.chance(0.5)
      posts.push({
        id: postId,
        ref: old ? null : ref(),
        account_id: p.accountId,
        post_url: `https://www.linkedin.com/feed/update/urn:li:activity:${7200000000000000000 + postId * 7919}`,
        linkedin_post_id: `urn:li:activity:${7200000000000000000 + postId * 7919}`,
        author: p.author,
        published_at: new Date(ts).toISOString(),
        published_at_uae: uaeIso(ts),
        published_at_ist: istIso(ts),
        day_uae: uaeWeekday(ts),
        slot_uae: timeKnown ? slot : null,
        time_known: timeKnown,
        targeted: timeKnown ? r.chance(0.15) : null,
        format,
        topic: format === 'untagged' && r.chance(0.5) ? null : topic,
        topic_suggested: suggested,
        industry: r.chance(0.7) ? r.pick(INDUSTRIES) : null,
        keywords: [topic.toLowerCase()],
        cta,
        hashtags: tags,
        caption: caption(r, topic, cta, tags),
        notes: r.chance(0.1) ? 'Boosted with a small budget on day 2.' : null,
        snapshots,
        audience,
        audience_captured_at: withAudience ? new Date(ts + 3 * DAY).toISOString() : null,
      })
    }
  }

  const planned: PlannedPost[] = []
  const at = (daysFromNow: number, hour: number) => uaeMidnight(uaeDate(now + daysFromNow * DAY)) + hour * HOUR
  const mkPlanned = (
    o: Partial<PlannedPost> & Pick<PlannedPost, 'format' | 'caption' | 'status'> & { when: number | null; account_id?: number },
  ): PlannedPost => {
    const manual = ['carousel', 'video', 'article', 'poll'].includes(o.format)
    const when = o.when
    const pid = id()
    const p: PlannedPost = {
      id: pid,
      ref: ref(),
      account_id: o.account_id ?? 1,
      format: o.format,
      goal: o.goal ?? 'brand',
      manual,
      by_hand: manual || (o.account_id ?? 1) === 1 || (o.account_id ?? 1) === 4,
      details: o.details ?? {},
      has_media: o.has_media ?? false,
      media_name: o.media_name ?? null,
      caption: o.caption,
      has_image: o.has_image ?? false,
      image_alt: o.image_alt ?? null,
      visibility: 'PUBLIC',
      scheduled_at: when != null ? new Date(when).toISOString() : null,
      scheduled_at_uae: when != null ? uaeIso(when) : null,
      scheduled_day_uae: when != null ? uaeWeekday(when) : null,
      scheduled_slot_uae: when != null ? slotOf(uaeHour(when)) : null,
      status: o.status,
      topic: o.topic ?? null,
      industry: o.industry ?? null,
      cta: o.cta ?? null,
      keywords: [],
      approved_at: o.status !== 'draft' ? new Date(now - 2 * DAY).toISOString() : null,
      published_at: o.published_at ?? null,
      linkedin_urn: o.linkedin_urn ?? null,
      post_id: o.post_id ?? null,
      error: o.error ?? null,
      retry_at: null,
      attempts: o.status === 'failed' ? 3 : 0,
    }
    return p
  }
  planned.push(
    mkPlanned({
      format: 'image',
      status: 'draft',
      when: at(2, 10),
      goal: 'sales',
      topic: 'School ERP',
      cta: 'Book a demo',
      caption: caption(r, 'School ERP', 'Book a demo', ['#UAE', '#SchoolERP']),
      has_image: true,
      image_alt: 'Dashboard of the school app on a laptop',
    }),
    mkPlanned({
      format: 'carousel',
      status: 'draft',
      when: at(4, 9),
      goal: 'brand',
      topic: 'Thought leadership',
      caption: caption(r, 'Thought leadership', 'Follow the page', ['#DigitalTransformation']),
      details: {
        document_title: '5 signs your school has outgrown spreadsheets',
        slides: [
          { headline: '5 signs your school has outgrown spreadsheets', body: 'A 60-second check for principals and bursars.' },
          { headline: 'Fees are chased by phone', body: 'Parents want to pay in two taps, not wait for a call.' },
          { headline: 'Reports take a week', body: 'Board packs should come out of the system, not a weekend.' },
          { headline: 'Three logins per teacher', body: 'Every extra login is time away from students.' },
          { headline: 'Ready for one system?', body: 'Book a 20-minute walkthrough.' },
        ],
        carousel_theme: 'brand',
      },
    }),
    mkPlanned({
      format: 'text',
      status: 'approved',
      when: at(1, 11),
      goal: 'engagement',
      topic: 'AI in education',
      cta: 'Comment',
      caption: caption(r, 'AI in education', 'Comment', ['#AI', '#Education']),
    }),
    mkPlanned({
      format: 'text',
      status: 'approved',
      account_id: 2,
      when: at(3, 9),
      goal: 'brand',
      topic: 'UAE market',
      caption: caption(r, 'UAE market', null, ['#UAE']),
    }),
    mkPlanned({
      format: 'poll',
      status: 'approved',
      when: at(-0.2, 10),
      goal: 'engagement',
      topic: 'AI in education',
      caption: 'Quick poll for school leaders in the UAE 👇',
      details: { question: 'Where would AI help your school most this year?', options: ['Admissions', 'Timetabling', 'Parent communication', 'Reports'], duration: '1w' },
    }),
    mkPlanned({
      format: 'image',
      status: 'failed',
      account_id: 2,
      when: at(-1, 9),
      goal: 'sales',
      topic: 'Case study',
      caption: caption(r, 'Case study', 'Send a DM', ['#EdTech']),
      has_image: true,
      error: 'LinkedIn said the access token has expired. Reconnect the profile on the LinkedIn page, then publish again.',
    }),
    mkPlanned({
      format: 'video',
      status: 'missed',
      when: at(-3, 12),
      goal: 'brand',
      topic: 'Team & culture',
      caption: caption(r, 'Team & culture', null, []),
      has_media: true,
      media_name: 'team-day.mp4',
      details: { title: 'A day at AVAIBE', subtitles: true },
    }),
  )
  for (const post of posts.filter((p) => p.account_id === 1 && p.ref).slice(0, 2)) {
    planned.push(
      mkPlanned({
        format: post.format === 'carousel' ? 'carousel' : post.format === 'video' ? 'video' : 'image',
        status: 'published',
        when: Date.parse(post.published_at),
        caption: post.caption ?? '',
        topic: post.topic,
        cta: post.cta,
        published_at: post.published_at,
        linkedin_urn: post.linkedin_post_id,
        post_id: post.id,
      }),
    )
    planned[planned.length - 1].ref = post.ref
  }

  const companies = [
    ['Al Noor International School', 'Education', 'Principal', true, 'School management system'],
    ['Desert Bloom Academy', 'Education', 'Head of IT', false, 'School management system'],
    ['Gulf Retail Co.', 'Retail', 'Operations Director', true, 'ERP'],
    ['Palm Clinics', 'Healthcare', 'Practice Manager', false, 'Custom software'],
    ['Crescent Education Group', 'Education', 'CEO', true, 'ERP'],
    ['Marina Properties', 'Real estate', 'Managing Director', true, 'Custom software'],
    ['Oasis Kindergarten', 'Education', 'Owner', true, 'School management system'],
    ['Skyline Logistics', 'Logistics', 'IT Manager', false, 'AI automation'],
    ['Falcon British School', 'Education', 'Bursar', false, 'School management system'],
    ['Pearl Hospitality', 'Hospitality', 'GM', true, 'Mobile apps'],
    ['Bright Minds Nursery', 'Education', 'Founder', true, 'School management system'],
    ['Jumeirah Tutors', 'Education', 'Director', true, 'Custom software'],
    ['NorthStar Trading', 'Retail', 'Finance Manager', false, 'ERP'],
    ['Mumbai Learning Labs', 'Education', 'Founder', true, 'AI automation'],
  ] as const
  const sources = ['company_post', 'founder_post', 'company_page', 'founder_profile', 'website', 'referral', 'event'] as const
  const stages = ['new', 'new', 'talking', 'talking', 'proposal', 'won', 'lost'] as const
  const leads: Lead[] = companies.map(([company, industry, role, dm, service], i) => {
    const source = sources[i % sources.length]
    const viaFounder = source === 'founder_post' || source === 'founder_profile'
    const linkedPost =
      source === 'company_post' || source === 'founder_post'
        ? posts.filter((p) => p.account_id === (source === 'company_post' ? 1 : 2))[i % 6]
        : undefined
    const received = uaeDate(now - (3 + i * 9) * DAY)
    const stage = stages[i % stages.length]
    const inUae = !company.startsWith('Mumbai')
    return {
      id: id(),
      account_id: 1,
      received_on: received,
      source,
      post_id: linkedPost?.id ?? null,
      via_account_id: viaFounder ? 2 : null,
      company,
      industry,
      in_uae: inUae,
      role,
      decision_maker: dm,
      service,
      stage,
      value_aed: stage === 'proposal' || stage === 'won' || stage === 'lost' ? r.int(4, 30) * 5000 : null,
      closed_on: stage === 'won' || stage === 'lost' ? uaeDate(now - i * 3 * DAY) : null,
      notes: i % 3 === 0 ? 'Asked for a demo with their finance team.' : null,
      how_heard: i % 4 === 0 ? 'Saw a post about fee collection' : null,
      utm_source: source === 'website' ? 'linkedin' : null,
      utm_medium: source === 'website' ? 'social' : null,
      utm_campaign: source === 'website' ? 'school-erp' : null,
      replied_at: stage === 'new' && i % 2 === 0 ? null : new Date(Date.parse(`${received}T09:00:00+04:00`) + r.int(2, 30) * HOUR).toISOString(),
      qualified: null,
      is_qualified: inUae && dm ? true : dm === false ? false : null,
      post_title: null,
      post_topic: null,
      post_format: null,
      post_date: null,
      via_account_name: null,
      updated_at: new Date(now - i * 2 * DAY).toISOString(),
    }
  })

  const team: TeamMember[] = [
    { id: id(), email: 'rania@avaibe.example', name: 'Rania Haddad', role: 'superadmin', can_switch_accounts: true, active: true, last_login_at: new Date(now - 2 * HOUR).toISOString() },
    { id: id(), email: 'karan@avaibe.example', name: 'Karan Mehta', role: 'admin', can_switch_accounts: true, active: true, last_login_at: new Date(now - DAY).toISOString() },
    { id: id(), email: 'maya@avaibe.example', name: 'Maya Fernandes', role: 'editor', can_switch_accounts: true, active: true, last_login_at: new Date(now - 3 * DAY).toISOString() },
    { id: id(), email: 'yusuf@avaibe.example', name: 'Yusuf Ali', role: 'editor', can_switch_accounts: false, active: true, last_login_at: null },
    { id: id(), email: 'intern@avaibe.example', name: null, role: 'viewer', can_switch_accounts: false, active: false, last_login_at: new Date(now - 40 * DAY).toISOString() },
  ]

  const pageDaily: Record<number, PageDay[]> = {}
  for (const a of accounts) {
    const days: PageDay[] = []
    const base = a.id === 1 ? 900 : a.id === 4 ? 25 : a.id === 2 ? 1300 : 600
    for (let d = 200; d >= 2; d--) {
      const ts = now - d * DAY
      const date = uaeDate(ts)
      const wd = uaeWeekday(ts)
      const weekend = wd === 'Saturday' || wd === 'Sunday'
      const trend = 1 + (200 - d) / 400
      const imp = Math.round(base * trend * (weekend ? 0.55 : 1) * r.noise(0.3))
      days.push({
        date,
        impressions: imp,
        unique_impressions: Math.round(imp * 0.68),
        clicks: Math.round(imp * (0.01 + r.next() * 0.015)),
        reactions: Math.round(imp * (0.015 + r.next() * 0.02)),
        comments: Math.round(imp * 0.003 * r.noise(0.6)),
        reposts: Math.round(imp * 0.0015 * r.noise(0.6)),
        page_views: a.kind === 'company' ? Math.round(imp * 0.06 * r.noise(0.4)) : null,
        unique_visitors: a.kind === 'company' ? Math.round(imp * 0.035 * r.noise(0.4)) : null,
        new_followers: Math.max(0, Math.round(imp * 0.004 * r.noise(0.5))),
      })
    }
    pageDaily[a.id] = days
  }

  const audSnap = (asOf: string, audience: 'followers' | 'visitors', total: number, uae: number): PageAudienceSnapshot => {
    const rows = [
      { dimension: 'location' as const, value: 'United Arab Emirates', count: Math.round(total * uae), pct: Math.round(uae * 1000) / 10 },
      { dimension: 'location' as const, value: 'Dubai', count: Math.round(total * uae * 0.55), pct: Math.round(uae * 550) / 10 },
      { dimension: 'location' as const, value: 'India', count: Math.round(total * 0.41), pct: 41 },
      { dimension: 'location' as const, value: 'Saudi Arabia', count: Math.round(total * 0.05), pct: 5 },
      { dimension: 'industry' as const, value: 'IT Services and IT Consulting', count: Math.round(total * 0.29), pct: 29 },
      { dimension: 'industry' as const, value: 'Primary and Secondary Education', count: Math.round(total * 0.14), pct: 14 },
      { dimension: 'industry' as const, value: 'Software Development', count: Math.round(total * 0.11), pct: 11 },
      { dimension: 'seniority' as const, value: 'Senior', count: Math.round(total * 0.27), pct: 27 },
      { dimension: 'seniority' as const, value: 'Director', count: Math.round(total * 0.08), pct: 8 },
      { dimension: 'seniority' as const, value: 'Owner', count: Math.round(total * 0.05), pct: 5 },
      { dimension: 'seniority' as const, value: 'CXO', count: Math.round(total * 0.03), pct: 3 },
      { dimension: 'job_function' as const, value: 'Information Technology', count: Math.round(total * 0.24), pct: 24 },
      { dimension: 'job_function' as const, value: 'Business Development', count: Math.round(total * 0.09), pct: 9 },
      { dimension: 'company_size' as const, value: '11-50 employees', count: Math.round(total * 0.22), pct: 22 },
      { dimension: 'company_size' as const, value: '51-200 employees', count: Math.round(total * 0.18), pct: 18 },
    ]
    return { as_of: asOf, audience, total, rows, shares: computeShares(rows, DEFAULT_SEGMENTS) }
  }
  const pageAudience: Record<number, PageAudienceSnapshot[]> = {
    1: [
      audSnap(uaeDate(now - 95 * DAY), 'followers', 3120, 0.27),
      audSnap(uaeDate(now - 35 * DAY), 'followers', 3480, 0.3),
      audSnap(uaeDate(now - 5 * DAY), 'followers', 3710, 0.32),
      audSnap(uaeDate(now - 5 * DAY), 'visitors', 640, 0.46),
    ],
  }

  const docs: Record<string, AccountDoc<keyof AccountDocs>> = {}
  const doc = <K extends keyof AccountDocs>(accountId: number, kind: K, data: AccountDocs[K]) => {
    docs[`${accountId}:${kind}`] = { kind, data, updated_by: 'rania@avaibe.example', updated_at: new Date(now - 6 * DAY).toISOString() }
  }
  doc(1, 'page_checklist', { items: { tagline: { done: true }, button: { done: true }, about: { done: false, note: 'Draft in shared drive' } } })
  doc(1, 'competitors', {
    competitors: [
      { id: 'c1', name: 'EduSuite Gulf', segment: 'erp', website: 'https://edusuite.example', followers: 12400, posts_per_week: 4, topics: 'Product features, awards', positioning: 'All-in-one school ERP for the GCC', strengths: 'Big client logos', opportunity: 'Rarely shows real outcomes or local faces', checked_on: uaeDate(now - 20 * DAY) },
      { id: 'c2', name: 'ClassCloud', segment: 'edtech', website: 'https://classcloud.example', followers: 8300, posts_per_week: 6, topics: 'Teacher tips, webinars', positioning: 'Teacher-first learning platform', strengths: 'Very active community', opportunity: 'No admin / finance angle', checked_on: uaeDate(now - 20 * DAY) },
      { id: 'c3', name: 'Bytewise Studio', segment: 'agency', followers: 2100, posts_per_week: 2, topics: 'Portfolio, hiring', positioning: 'Dubai app agency', strengths: 'Strong design', opportunity: 'Not focused on education', checked_on: uaeDate(now - 50 * DAY) },
    ],
  })
  doc(1, 'member_totals', { as_of: null, followers: null, totals: {} })
  for (const [aid, followers] of [[2, 8650], [3, 3120]] as const) {
    doc(aid, 'member_totals', {
      as_of: uaeDate(now - DAY),
      followers,
      totals: {
        IMPRESSION: followers * 31,
        MEMBERS_REACHED: followers * 19,
        REACTION: followers * 0.9,
        COMMENT: followers * 0.12,
        RESHARE: followers * 0.05,
        POST_SAVE: followers * 0.04,
        POST_SEND: followers * 0.03,
        LINK_CLICKS: followers * 0.2,
        FOLLOWER_GAINED_FROM_CONTENT: Math.round(followers * 0.06),
        PROFILE_VIEW_FROM_CONTENT: Math.round(followers * 0.3),
      },
    })
    doc(aid, 'page_checklist', { items: {} })
    doc(aid, 'competitors', { competitors: [] })
  }

  const connections: LinkedInConnection[] = [
    { account_id: 2, name: 'Rania Haddad', email: 'rania@avaibe.example', picture_url: null, expires_at: new Date(now + 42 * DAY).toISOString(), expired: false, days_left: 42, connected_at: new Date(now - 18 * DAY).toISOString() },
  ]

  const lastImports: Record<number, LastImports> = {
    1: {
      content: { at: new Date(now - 2 * DAY).toISOString(), exported_on: uaeDate(now - 2 * DAY), file: 'avaibe_content_export.xls' },
      followers: { at: new Date(now - 5 * DAY).toISOString(), exported_on: uaeDate(now - 5 * DAY), file: 'avaibe_followers.xls' },
      visitors: { at: new Date(now - 5 * DAY).toISOString(), exported_on: uaeDate(now - 5 * DAY), file: 'avaibe_visitors.xls' },
    },
  }

  return {
    version: DB_VERSION,
    seededAt: new Date(now).toISOString(),
    nextId,
    nextRef,
    accounts,
    posts,
    planned,
    leads,
    team,
    defaultAccountId: 1,
    settings,
    pageDaily,
    pageAudience,
    docs,
    decisions: { 1: [] },
    ideaRuns: [],
    connections,
    lastImports,
    aiRunsToday: 2,
  }
}

