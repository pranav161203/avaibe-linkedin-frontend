import { useMemo } from 'react'
import { Briefcase, ClipboardList, Handshake, Magnet, Megaphone, Palette, SearchCheck, type LucideIcon } from 'lucide-react'
import { useAccount } from '@/context/account'
import type { Decision, DecisionStatus, Idea, IdeaType, Suggestion } from '@/lib/api'
import { checklistSuggestion, inactiveSuggestion, PAGE_CHECKLIST } from '@/lib/page-checklist'
import { leadSuggestions } from '@/lib/lead-rules'
import { useGetAccountDoc } from '@/pages/brand/queries'
import { useGetPosts } from '@/pages/data/queries'
import { useGetLeads } from '@/pages/leads/queries'
import { useGetDecisions, useGetIdeas, useGetSimilarPosts, useGetSuggestions } from '@/pages/suggestions/queries'

export type AreaId = 'content' | 'brand' | 'leads' | 'sales' | 'outreach' | 'seo' | 'data'

export const AREAS: { id: AreaId; label: string; icon: LucideIcon; intro: string; empty: string }[] = [
  {
    id: 'content',
    label: 'Content',
    icon: Megaphone,
    intro: 'What to post next: topics, formats, timing, calls to action and post series.',
    empty: 'No content suggestions right now. They appear as new posts and numbers come in, and when Claude generates ideas.',
  },
  {
    id: 'brand',
    label: 'Brand',
    icon: Palette,
    intro: 'How AVAIBE’s page and name come across to UAE decision-makers.',
    empty: 'No brand ideas right now. Brand ideas come from Claude: they appear here after “Generate ideas” (needs the Claude API key).',
  },
  {
    id: 'leads',
    label: 'Leads',
    icon: Magnet,
    intro: 'Bringing in enquiries from the right people: UAE decision-makers, not just likes.',
    empty: 'No lead ideas yet. They come from Claude (needs the API key) and, as the Leads log fills up, from which posts and profiles bring real enquiries.',
  },
  {
    id: 'sales',
    label: 'Sales',
    icon: Briefcase,
    intro: 'Turning enquiries and conversations into won business.',
    empty: 'No sales ideas yet. They come from Claude (needs the API key) and, as the Pipeline fills up, from leads that stall or go quiet.',
  },
  {
    id: 'outreach',
    label: 'Outreach & activities',
    icon: Handshake,
    intro: 'Respectful engagement: founder activity, comments, partners and communities.',
    empty: 'No outreach ideas right now. They come from Claude, and later from activity tracking (comments, founder shares, messages).',
  },
  {
    id: 'seo',
    label: 'SEO / AEO',
    icon: SearchCheck,
    intro: 'Being found on Google and named in AI answers (ChatGPT, Gemini, Claude).',
    empty: 'No SEO / AEO ideas yet. They come from Claude (needs the API key).',
  },
  {
    id: 'data',
    label: 'Data fixes',
    icon: ClipboardList,
    intro: 'Missing or unchecked data. Fixing these makes every other suggestion more reliable.',
    empty: 'No data fixes needed right now.',
  },
]

export const OWN_SECTION: Partial<Record<AreaId, string>> = { brand: '/brand', leads: '/leads', sales: '/leads' }

export function areaPath(area: AreaId): string {
  return OWN_SECTION[area] ? `${OWN_SECTION[area]}/suggestions` : `/suggestions/${area}`
}

export const SUGGESTION_AREAS = AREAS.filter((a) => !OWN_SECTION[a.id])

const IDEA_AREA: Record<IdeaType, AreaId> = {
  post: 'content',
  campaign: 'content',
  brand: 'brand',
  sales: 'sales',
  outreach: 'outreach',
  seo_aeo: 'seo',
  leads: 'leads',
}

const LEVEL_RANK = { high: 0, medium: 1, low: 2 } as const

export interface Item {
  key: string
  area: AreaId
  title: string
  summary: string
  rank: number
  rule?: Suggestion
  idea?: { idea: Idea; runId: number; index: number }
  decision?: Decision
}

export type ItemState = 'open' | 'doing' | 'later' | 'closed'

export function itemState(status: DecisionStatus | undefined): ItemState {
  if (!status) return 'open'
  if (status === 'doing') return 'doing'
  if (status === 'later') return 'later'
  return 'closed'
}

function similarQuery(it: Item): { key: string; text: string; topic?: string | null } | null {
  if (it.rule?.topic) return { key: it.key, text: it.rule.title, topic: it.rule.topic }
  const idea = it.idea?.idea
  if (idea && (idea.type === 'post' || idea.type === 'campaign')) {
    return { key: it.key, text: `${idea.title}. ${idea.what}` }
  }
  return null
}

export function useSimilarPosts(accountId: number | undefined, items: Item[]) {
  const queries = items.map(similarQuery).filter((q): q is NonNullable<typeof q> => q !== null)
  return useGetSimilarPosts(accountId, queries)
}

export function useSuggestionItems(accountId: number | undefined) {
  const sugg = useGetSuggestions(accountId)
  const ideas = useGetIdeas(accountId)
  const decisions = useGetDecisions(accountId)
  const { accounts } = useAccount()
  const isCompany = accounts.find((a) => a.id === accountId)?.kind === 'company'
  const checklist = useGetAccountDoc(isCompany ? accountId : undefined, 'page_checklist')
  const posts = useGetPosts(accountId)
  const leads = useGetLeads(accountId)

  const items = useMemo(() => {
    const byKey = new Map((decisions.data ?? []).map((d) => [d.key, d]))
    const out: Item[] = []
    if (isCompany) {
      const ticked = checklist.data?.data.items ?? {}
      const pageRules: Suggestion[] = PAGE_CHECKLIST.filter((c) => !ticked[c.id]?.done).map(checklistSuggestion)
      const lastPost = (posts.data ?? []).map((p) => p.published_at).sort().at(-1)
      if (posts.data && (!lastPost || Date.now() - new Date(lastPost).getTime() > 7 * 86_400_000)) pageRules.push(inactiveSuggestion(lastPost))
      for (const s of pageRules) {
        const key = `rule:${s.id}`
        out.push({ key, area: 'brand', title: s.title, summary: s.why[0] ?? '', rank: LEVEL_RANK[s.priority], rule: s, decision: byKey.get(key) })
      }
    }
    if (leads.data) {
      for (const s of leadSuggestions(leads.data, posts.data ?? [], isCompany)) {
        const key = `rule:${s.id}`
        out.push({ key, area: 'leads', title: s.title, summary: s.why[0] ?? '', rank: LEVEL_RANK[s.priority], rule: s, decision: byKey.get(key) })
      }
    }
    for (const s of sugg.data?.suggestions ?? []) {
      const key = `rule:${s.id}`
      out.push({
        key,
        area: s.category === 'data' ? 'data' : 'content',
        title: s.title,
        summary: s.why[0] ?? '',
        rank: LEVEL_RANK[s.priority],
        rule: s,
        decision: byKey.get(key),
      })
    }
    const run = ideas.data?.latest
    run?.result?.ideas.forEach((idea, index) => {
      const key = `ai:${run.id}:${index}`
      out.push({
        key,
        area: IDEA_AREA[idea.type] ?? 'content',
        title: idea.title,
        summary: idea.why.find((w) => !/^assumption:/i.test(w.trim())) ?? idea.what,
        rank: LEVEL_RANK[idea.confidence] + 0.5 + index * 0.01,
        idea: { idea, runId: run.id, index },
        decision: byKey.get(key),
      })
    })
    return out.sort((a, b) => a.rank - b.rank)
  }, [sugg.data, ideas.data, decisions.data, isCompany, checklist.data, posts.data, leads.data])

  const counts = useMemo(() => {
    const c = Object.fromEntries(AREAS.map((a) => [a.id, 0])) as Record<AreaId, number>
    for (const it of items) {
      const st = itemState(it.decision?.status)
      if (st === 'open' || st === 'doing') c[it.area] += 1
    }
    return c
  }, [items])

  return {
    items,
    counts,
    suggestions: sugg.data,
    ideas: ideas.data,
    isLoading: sugg.isLoading || ideas.isLoading || decisions.isLoading || checklist.isLoading,
  }
}
