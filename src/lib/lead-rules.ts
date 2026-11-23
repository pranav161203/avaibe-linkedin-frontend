import type { Lead, Post, Suggestion } from '@/lib/api'

const REPLY_TARGET_HOURS = 24
const MIN_FOR_PATTERN = 5

const hoursWaiting = (l: Lead, now: number) => (now - new Date(`${l.received_on}T00:00:00+04:00`).getTime()) / 3_600_000
const open = (l: Lead) => l.stage !== 'won' && l.stage !== 'lost'
const ids = (ls: Lead[]) => ls.map((l) => l.id).sort((a, b) => a - b).join('-')
const names = (ls: Lead[]) => ls.slice(0, 4).map((l) => l.company).join(', ') + (ls.length > 4 ? ` and ${ls.length - 4} more` : '')

const BASE = {
  who: 'The person who handles enquiries',
  confidence: { level: 'high' as const, reason: 'Worked out directly from the Leads log.' },
  progress: null,
}

export function leadSuggestions(leads: Lead[], posts: Post[], isCompany: boolean, now = Date.now()): Suggestion[] {
  const out: Suggestion[] = []
  const toLog = { label: 'Open the Leads log', to: '/leads/log' }

  if (leads.length === 0) {
    if (isCompany) {
      out.push({
        ...BASE,
        id: 'lead:start',
        category: 'lead',
        priority: 'high',
        title: 'Start recording enquiries in the Leads log',
        when: 'From the next enquiry onwards',
        why: [
          'LinkedIn doesn’t share enquiries, so without a log there’s no way to tell which posts bring business.',
          'Record each enquiry the same day, with where it came from and how they heard about you.',
        ],
        boost: 'After a few months you can see which topics, formats and profiles bring qualified UAE leads, not just likes.',
        risk: 'Only works if every enquiry is logged. A half-filled log gives a misleading picture.',
        confidence: { level: 'high', reason: 'Without leads recorded, none of the lead analysis can run.' },
        measure: { metric: 'Share of enquiries logged', period: 'Each month', target: 'Every enquiry' },
        action: toLog,
      })
    }
    return out
  }

  const waiting = leads.filter((l) => open(l) && !l.replied_at && hoursWaiting(l, now) > REPLY_TARGET_HOURS)
  if (waiting.length) {
    out.push({
      ...BASE,
      id: `lead:reply:${ids(waiting)}`,
      category: 'lead',
      priority: 'high',
      title: `Reply to ${waiting.length} lead${waiting.length === 1 ? '' : 's'} waiting over a day`,
      when: 'Today',
      why: [`No reply recorded for: ${names(waiting)}.`, 'Enquiries that wait go cold; a quick first reply keeps the conversation going.'],
      boost: 'More enquiries turn into conversations.',
      risk: 'None. If you already replied, click “Mark replied” so the log is right.',
      measure: { metric: 'Median first reply', period: 'Next 30 days', target: `Under ${REPLY_TARGET_HOURS} hours` },
      action: toLog,
    })
  }

  const unknownSource = leads.filter((l) => l.source === 'other' && !l.how_heard)
  if (unknownSource.length) {
    out.push({
      ...BASE,
      id: `lead:source:${ids(unknownSource)}`,
      category: 'lead',
      priority: 'medium',
      title: `Ask ${unknownSource.length} lead${unknownSource.length === 1 ? '' : 's'} how they heard about you`,
      when: 'At the next contact',
      why: [`Source unknown for: ${names(unknownSource)}.`, 'Leads with no source can’t show which posts or profiles work.'],
      boost: 'A clearer picture of what brings enquiries.',
      risk: 'None. Ask naturally, e.g. “What made you get in touch?”',
      measure: { metric: 'Leads with a known source', period: 'Each month', target: 'Over 80%' },
      action: toLog,
    })
  }

  const unknownQual = leads.filter((l) => l.is_qualified == null)
  if (unknownQual.length) {
    out.push({
      ...BASE,
      id: `lead:qual:${ids(unknownQual)}`,
      category: 'lead',
      priority: 'medium',
      title: `Fill in UAE and decision-maker for ${unknownQual.length} lead${unknownQual.length === 1 ? '' : 's'}`,
      when: 'This week',
      why: [`Not known yet for: ${names(unknownQual)}.`, 'Qualified UAE leads are the main measure; unknowns can’t be counted.'],
      boost: 'The qualified-lead count becomes reliable.',
      risk: 'None.',
      measure: { metric: 'Leads with qualification known', period: 'Each month', target: 'All leads' },
      action: toLog,
    })
  }

  const linked = leads.filter((l) => l.is_qualified && l.post_topic)
  if (linked.length >= MIN_FOR_PATTERN) {
    const byTopic = new Map<string, number>()
    for (const l of linked) byTopic.set(l.post_topic!, (byTopic.get(l.post_topic!) ?? 0) + 1)
    const [topic, n] = [...byTopic.entries()].sort((a, b) => b[1] - a[1])[0]
    const recent = posts.filter((p) => now - new Date(p.published_at).getTime() < 30 * 86_400_000)
    const onTopic = recent.filter((p) => p.topic === topic).length
    const leadShare = n / linked.length
    const postShare = recent.length ? onTopic / recent.length : 0
    if (leadShare >= 0.4 && postShare < leadShare / 2) {
      out.push({
        ...BASE,
        id: `lead:topic:${topic}:${n}`,
        category: 'lead',
        priority: 'medium',
        title: `Post more on “${topic}”: it brings qualified leads`,
        when: 'Over the next 30 days',
        who: 'UAE decision-makers interested in this topic',
        why: [
          `${n} of the ${linked.length} qualified leads linked to a post came from “${topic}” posts.`,
          `Only ${onTopic} of your ${recent.length} posts in the last 30 days were on this topic.`,
        ],
        boost: 'More of the content that has brought real enquiries.',
        risk: 'Repeating one angle can tire followers: vary the format and angle (case study, checklist, question).',
        confidence: {
          level: linked.length >= 10 ? 'medium' : 'low',
          reason: `Based on ${linked.length} qualified leads linked to posts; small numbers can be chance.`,
        },
        measure: { metric: 'Qualified leads from this topic', period: 'Next 60 days', target: 'More than the 60 days before' },
        action: toLog,
      })
    }
  }
  return out
}
