import type { Lead, Post, Suggestion } from '@/lib/api'

const REPLY_TARGET_HOURS = 24
const MIN_FOR_PATTERN = 5

const hoursWaiting = (l: Lead, now: number) => (now - new Date(`${l.received_on}T00:00:00+04:00`).getTime()) / 3_600_000
const open = (l: Lead) => l.stage !== 'won' && l.stage !== 'lost'
const ids = (ls: Lead[]) => ls.map((l) => l.id).sort((a, b) => a - b).join('-')
const names = (ls: Lead[]) => ls.slice(0, 4).map((l) => l.company).join(', ') + (ls.length > 4 ? ` and ${ls.length - 4} more` : '')

const BASE = {
  who: 'The person who handles enquiries',
  confidence: { level: 'high' as const, reason: 'Derived directly from the Leads log.' },
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
        when: 'Starting with the next enquiry',
        why: [
          'LinkedIn does not report enquiries. A log is required to attribute business to posts.',
          'Record each enquiry on the day it arrives, with its source.',
        ],
        boost: 'Over time, shows which topics, formats and profiles generate qualified UAE leads.',
        risk: 'Requires every enquiry to be logged. Incomplete records produce misleading results.',
        confidence: { level: 'high', reason: 'Lead analysis requires recorded leads.' },
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
      title: `Respond to ${waiting.length} lead${waiting.length === 1 ? '' : 's'} pending over 24 hours`,
      when: 'Today',
      why: [`No reply recorded for: ${names(waiting)}.`, 'Response time affects conversion; delayed enquiries lose momentum.'],
      boost: 'Higher enquiry-to-conversation rate.',
      risk: 'None. If a reply was sent, select “Mark replied” to keep the log accurate.',
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
      title: `Confirm the source for ${unknownSource.length} lead${unknownSource.length === 1 ? '' : 's'}`,
      when: 'At the next contact',
      why: [`Source unknown for: ${names(unknownSource)}.`, 'Leads without a source cannot be attributed to posts or profiles.'],
      boost: 'More accurate lead attribution.',
      risk: 'None. Ask at the next contact, e.g. “How did you hear about us?”',
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
      title: `Complete qualification for ${unknownQual.length} lead${unknownQual.length === 1 ? '' : 's'}`,
      when: 'This week',
      why: [`UAE and decision-maker status missing for: ${names(unknownQual)}.`, 'Qualified UAE leads are the primary measure; unqualified records are excluded.'],
      boost: 'Reliable qualified-lead reporting.',
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
        title: `Increase posts on “${topic}”`,
        when: 'Over the next 30 days',
        who: 'UAE decision-makers interested in this topic',
        why: [
          `${n} of the ${linked.length} qualified leads linked to a post came from “${topic}” posts.`,
          `${onTopic} of ${recent.length} posts in the last 30 days covered this topic.`,
        ],
        boost: 'More content of the type that has generated qualified enquiries.',
        risk: 'Repetition may reduce engagement. Vary the format and angle (case study, checklist, question).',
        confidence: {
          level: linked.length >= 10 ? 'medium' : 'low',
          reason: `Based on ${linked.length} qualified leads linked to posts; small samples may reflect chance.`,
        },
        measure: { metric: 'Qualified leads from this topic', period: 'Next 60 days', target: 'Above the previous 60 days' },
        action: toLog,
      })
    }
  }
  return out
}
