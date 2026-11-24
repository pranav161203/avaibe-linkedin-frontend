import { axiosAuth, BASE_URL } from './axios'
import API_ENDPOINTS from './apiConfig'
import type {
  Account,
  AccountDoc,
  AccountDocs,
  AppSettings,
  AudienceRow,
  CalendarData,
  CalendarItem,
  Checkpoint,
  CheckpointQ,
  ClaudeStatus,
  Decision,
  DecisionStatus,
  DueSnapshot,
  ExportImportResult,
  IdeasRun,
  IdeasState,
  ImportResult,
  PlanImportResult,
  KnowledgeHit,
  KnowledgeList,
  KnowledgeSource,
  TrendsRun,
  TrendsState,
  LastImports,
  Lead,
  LeadInput,
  LinkedInConfig,
  LinkedInConnection,
  Me,
  Overview,
  PageAudienceInput,
  PageAudienceSnapshot,
  PageDay,
  PlannedPost,
  PlannedPostInput,
  Post,
  PostAssistRun,
  ComparePostsRun,
  PostInput,
  SimilarResponse,
  Snapshot,
  SnapshotInput,
  SuggestionsResult,
  TeamMember,
  TeamMemberInput,
  PostAssistBody,
  PostChatBody,
  PostChatRun,
  SettingsSection,
} from '@/types/api'

export * from '@/types/api'
export { ApiError } from './api-error'

function withAttachment(body: Record<string, unknown>, file: File): FormData {
  const form = new FormData()
  for (const [k, v] of Object.entries(body)) {
    if (v == null) continue
    form.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v))
  }
  form.append('attachment', file)
  return form
}

function fileForm(file: File): FormData {
  const form = new FormData()
  form.append('file', file)
  return form
}

// ---------------------------- Auth & team ------------------------------------------------- //

export async function getMe(): Promise<Me> {
  const res = await axiosAuth.get(API_ENDPOINTS.AUTH.GET_ME)
  return res.data
}

export async function logout(): Promise<{ signed_out: boolean }> {
  const res = await axiosAuth.post(API_ENDPOINTS.AUTH.POST_LOGOUT)
  return res.data
}

export async function getTeam(): Promise<{ members: TeamMember[]; default_account_id: number | null }> {
  const res = await axiosAuth.get(API_ENDPOINTS.TEAM.GET_TEAM)
  return res.data
}

export async function addTeamMember(body: TeamMemberInput): Promise<TeamMember> {
  const res = await axiosAuth.post(API_ENDPOINTS.TEAM.POST_MEMBER, body)
  return res.data
}

export async function updateTeamMember({ id, body }: { id: number; body: TeamMemberInput }): Promise<TeamMember> {
  const res = await axiosAuth.put(API_ENDPOINTS.TEAM.PUT_MEMBER(id), body)
  return res.data
}

export async function removeTeamMember(id: number): Promise<void> {
  await axiosAuth.delete(API_ENDPOINTS.TEAM.DELETE_MEMBER(id))
}

export async function setDefaultAccount(accountId: number): Promise<{ default_account_id: number }> {
  const res = await axiosAuth.put(API_ENDPOINTS.TEAM.PUT_DEFAULT_ACCOUNT, { default_account_id: accountId })
  return res.data
}

// ---------------------------- Accounts ---------------------------------------------------- //

export async function getAccounts(): Promise<Account[]> {
  const res = await axiosAuth.get(API_ENDPOINTS.ACCOUNTS.GET_ACCOUNTS)
  return res.data
}

export async function createAccount(body: Omit<Account, 'id'>): Promise<Account> {
  const res = await axiosAuth.post(API_ENDPOINTS.ACCOUNTS.POST_ACCOUNT, body)
  return res.data
}

export async function getPageAudience(accountId: number): Promise<PageAudienceSnapshot[]> {
  const res = await axiosAuth.get(API_ENDPOINTS.ACCOUNTS.PAGE_AUDIENCE(accountId))
  return res.data
}

export async function savePageAudience({ accountId, body }: { accountId: number; body: PageAudienceInput }): Promise<{ saved: number }> {
  const res = await axiosAuth.put(API_ENDPOINTS.ACCOUNTS.PAGE_AUDIENCE(accountId), body)
  return res.data
}

export async function deletePageAudience({ accountId, as_of, audience }: { accountId: number; as_of: string; audience: string }): Promise<void> {
  await axiosAuth.delete(API_ENDPOINTS.ACCOUNTS.PAGE_AUDIENCE(accountId), { params: { as_of, audience } })
}

export async function getPageDaily(accountId: number): Promise<PageDay[]> {
  const res = await axiosAuth.get(API_ENDPOINTS.ACCOUNTS.GET_PAGE_DAILY(accountId))
  return res.data
}

export async function getLastImports(accountId: number): Promise<LastImports> {
  const res = await axiosAuth.get(API_ENDPOINTS.ACCOUNTS.GET_LAST_IMPORTS(accountId))
  return res.data
}

export async function getAccountDoc<K extends keyof AccountDocs>(accountId: number, kind: K): Promise<AccountDoc<K>> {
  const res = await axiosAuth.get(API_ENDPOINTS.ACCOUNTS.DOC(accountId, kind))
  return res.data
}

export async function saveAccountDoc<K extends keyof AccountDocs>({ accountId, kind, data }: { accountId: number; kind: K; data: AccountDocs[K] }): Promise<AccountDoc<K>> {
  const res = await axiosAuth.put(API_ENDPOINTS.ACCOUNTS.DOC(accountId, kind), data)
  return res.data
}

// ---------------------------- Posts & numbers --------------------------------------------- //

export async function getPosts(params: { account_id?: number; format?: string; checkpoint?: CheckpointQ; metric?: string }): Promise<Post[]> {
  const res = await axiosAuth.get(API_ENDPOINTS.POSTS.GET_POSTS, { params })
  return res.data
}

export async function getPost(id: number): Promise<Post> {
  const res = await axiosAuth.get(API_ENDPOINTS.POSTS.POST(id))
  return res.data
}

export async function createPost(body: PostInput): Promise<Post> {
  const res = await axiosAuth.post(API_ENDPOINTS.POSTS.POST_POST, body)
  return res.data
}

export async function updatePost({ id, body }: { id: number; body: PostInput }): Promise<Post> {
  const res = await axiosAuth.put(API_ENDPOINTS.POSTS.POST(id), body)
  return res.data
}

export async function deletePost(id: number): Promise<void> {
  await axiosAuth.delete(API_ENDPOINTS.POSTS.POST(id))
}

export async function saveSnapshot({ postId, checkpoint, body }: { postId: number; checkpoint: Checkpoint; body: SnapshotInput }): Promise<Snapshot> {
  const res = await axiosAuth.put(API_ENDPOINTS.POSTS.SNAPSHOT(postId, checkpoint), body)
  return res.data
}

export async function deleteSnapshot({ postId, checkpoint }: { postId: number; checkpoint: Checkpoint }): Promise<void> {
  await axiosAuth.delete(API_ENDPOINTS.POSTS.SNAPSHOT(postId, checkpoint))
}

export async function savePostAudience({ postId, rows }: { postId: number; rows: AudienceRow[] }): Promise<Post> {
  const res = await axiosAuth.put(API_ENDPOINTS.POSTS.PUT_AUDIENCE(postId), { rows })
  return res.data
}

export async function getKnowledge(accountId: number): Promise<KnowledgeList> {
  const res = await axiosAuth.get(API_ENDPOINTS.KNOWLEDGE.LIST, { params: { account_id: accountId } })
  return res.data
}

export async function getKnowledgeSource(id: number): Promise<KnowledgeSource> {
  const res = await axiosAuth.get(API_ENDPOINTS.KNOWLEDGE.ONE(id))
  return res.data
}

export async function addKnowledge({ title, content, file, accountIds }: { title: string; content?: string; file?: File; accountIds: number[] }): Promise<KnowledgeSource> {
  if (file) {
    const form = fileForm(file)
    if (title) form.append('title', title)
    form.append('account_ids', accountIds.join(','))
    const res = await axiosAuth.post(API_ENDPOINTS.KNOWLEDGE.LIST, form)
    return res.data
  }
  const res = await axiosAuth.post(API_ENDPOINTS.KNOWLEDGE.LIST, { title, content, account_ids: accountIds })
  return res.data
}

export async function updateKnowledge({ id, title, content, accountIds }: { id: number; title: string; content: string; accountIds: number[] }): Promise<KnowledgeSource> {
  const res = await axiosAuth.put(API_ENDPOINTS.KNOWLEDGE.ONE(id), { title, content, account_ids: accountIds })
  return res.data
}

export async function deleteKnowledge(id: number): Promise<void> {
  await axiosAuth.delete(API_ENDPOINTS.KNOWLEDGE.ONE(id))
}

export async function searchKnowledge(q: string, accountId: number): Promise<{ query: string; results: KnowledgeHit[] }> {
  const res = await axiosAuth.get(API_ENDPOINTS.KNOWLEDGE.SEARCH, { params: { q, account_id: accountId } })
  return res.data
}

export const PLAN_TEMPLATE_URL = `${BASE_URL}${API_ENDPOINTS.PLANNER.IMPORT_TEMPLATE}`

export async function importPlan({ accountId, file, confirm }: { accountId: number; file: File; confirm: boolean }): Promise<PlanImportResult> {
  const res = await axiosAuth.post(API_ENDPOINTS.PLANNER.POST_IMPORT, fileForm(file), { params: { account_id: accountId, confirm: confirm ? 1 : 0 } })
  return res.data
}

export async function importCsv({ accountId, file }: { accountId: number; file: File }): Promise<ImportResult> {
  const res = await axiosAuth.post(API_ENDPOINTS.IMPORT.POST_CSV, fileForm(file), { params: { account_id: accountId } })
  return res.data
}

export async function importLinkedInExport({
  accountId,
  files,
  exportedOn,
  confirmProfile = false,
}: {
  accountId: number
  files: File[]
  exportedOn: string | null
  confirmProfile?: boolean
}): Promise<ExportImportResult> {
  const form = new FormData()
  files.forEach((f) => form.append('files', f))
  if (exportedOn) form.append('exported_on', exportedOn)
  if (confirmProfile) form.append('confirm_profile', '1')
  const res = await axiosAuth.post(API_ENDPOINTS.IMPORT.POST_LINKEDIN_EXPORT, form, { params: { account_id: accountId } })
  return res.data
}

// ---------------------------- Analytics & calendar ---------------------------------------- //

export async function getOverview(params: { account_id: number; checkpoint: CheckpointQ }): Promise<Overview> {
  const res = await axiosAuth.get(API_ENDPOINTS.ANALYTICS.GET_OVERVIEW, { params })
  return res.data
}

export async function getSuggestions(params: { account_id: number }): Promise<SuggestionsResult> {
  const res = await axiosAuth.get(API_ENDPOINTS.ANALYTICS.GET_SUGGESTIONS, { params })
  return res.data
}

export async function getDueSnapshots(params: { account_id: number }): Promise<DueSnapshot[]> {
  const res = await axiosAuth.get(API_ENDPOINTS.ANALYTICS.GET_DUE_SNAPSHOTS, { params })
  return res.data
}

export async function getSimilarPosts(body: { account_id: number; queries: { key: string; text: string; topic?: string | null }[] }): Promise<SimilarResponse> {
  const res = await axiosAuth.post(API_ENDPOINTS.ANALYTICS.POST_SIMILAR_POSTS, body)
  return res.data
}

export async function getCalendar(params: { account_id: number; from: string; to: string }): Promise<CalendarData> {
  const res = await axiosAuth.get(API_ENDPOINTS.CALENDAR.GET_CALENDAR, { params })
  return res.data
}

export async function getCalendarItems(params: { from: string; to: string }): Promise<{ from: string; to: string; items: CalendarItem[] }> {
  const res = await axiosAuth.get(API_ENDPOINTS.CALENDAR.GET_CALENDAR_ITEMS, { params })
  return res.data
}

// ---------------------------- Leads ------------------------------------------------------- //

export async function getLeads(accountId: number): Promise<Lead[]> {
  const res = await axiosAuth.get(API_ENDPOINTS.LEADS.GET_LEADS, { params: { account_id: accountId } })
  return res.data
}

export async function createLead(body: LeadInput): Promise<Lead> {
  const res = await axiosAuth.post(API_ENDPOINTS.LEADS.POST_LEAD, body)
  return res.data
}

export async function updateLead({ id, body }: { id: number; body: LeadInput }): Promise<Lead> {
  const res = await axiosAuth.put(API_ENDPOINTS.LEADS.LEAD(id), body)
  return res.data
}

export async function deleteLead(id: number): Promise<void> {
  await axiosAuth.delete(API_ENDPOINTS.LEADS.LEAD(id))
}

export async function markLeadReplied(id: number): Promise<Lead> {
  const res = await axiosAuth.post(API_ENDPOINTS.LEADS.POST_REPLIED(id))
  return res.data
}

// ---------------------------- Settings ---------------------------------------------------- //

export async function getSettings(): Promise<AppSettings> {
  const res = await axiosAuth.get(API_ENDPOINTS.SETTINGS.GET_SETTINGS)
  return res.data
}

export async function saveSettings<K extends SettingsSection>({ section, body }: { section: K; body: AppSettings['current'][K] }): Promise<AppSettings['current'][K]> {
  const res = await axiosAuth.put(API_ENDPOINTS.SETTINGS.PUT_SECTION(section), body)
  return res.data
}

export async function resetSettings(section: SettingsSection): Promise<unknown> {
  const res = await axiosAuth.post(API_ENDPOINTS.SETTINGS.POST_RESET(section))
  return res.data
}

export async function getClaudeStatus(): Promise<ClaudeStatus> {
  const res = await axiosAuth.get(API_ENDPOINTS.SETTINGS.GET_CLAUDE)
  return res.data
}

// ---------------------------- Suggestions & AI -------------------------------------------- //

export async function getDecisions(accountId: number): Promise<Decision[]> {
  const res = await axiosAuth.get(API_ENDPOINTS.SUGGESTIONS.DECISIONS, { params: { account_id: accountId } })
  return res.data
}

export async function saveDecision(body: { account_id: number; key: string; status: DecisionStatus | null }): Promise<{ key: string; status: DecisionStatus | null }> {
  const res = await axiosAuth.put(API_ENDPOINTS.SUGGESTIONS.DECISIONS, body)
  return res.data
}

export async function getTrends(accountId: number): Promise<TrendsState> {
  const res = await axiosAuth.get(API_ENDPOINTS.AI.TRENDS, { params: { account_id: accountId } })
  return res.data
}

export async function findTrends(accountId: number): Promise<TrendsRun> {
  const res = await axiosAuth.post(API_ENDPOINTS.AI.TRENDS, { account_id: accountId })
  return res.data
}

export async function getIdeas(accountId: number): Promise<IdeasState> {
  const res = await axiosAuth.get(API_ENDPOINTS.AI.IDEAS, { params: { account_id: accountId } })
  return res.data
}

export async function generateIdeas(body: { account_id: number; focus: string | null }): Promise<IdeasRun> {
  const res = await axiosAuth.post(API_ENDPOINTS.AI.IDEAS, body)
  return res.data
}

export async function createDraftFromIdea({ runId, index }: { runId: number; index: number }): Promise<{ planned_id: number }> {
  const res = await axiosAuth.post(API_ENDPOINTS.AI.POST_IDEA_TO_DRAFT(runId, index))
  return res.data
}

export async function getPostAssistStatus(accountId: number): Promise<{ configured: boolean; runs_today: number; daily_limit: number }> {
  const res = await axiosAuth.get(API_ENDPOINTS.AI.POST_ASSIST, { params: { account_id: accountId } })
  return res.data
}

export async function analysePost({ body, attachment }: { body: PostAssistBody; attachment?: File | null }): Promise<PostAssistRun> {
  const res = await axiosAuth.post(API_ENDPOINTS.AI.POST_ASSIST, attachment ? withAttachment(body, attachment) : body)
  return res.data
}

export async function comparePosts(body: { account_id: number; post_ids: number[]; checkpoint: Checkpoint }): Promise<ComparePostsRun> {
  const res = await axiosAuth.post(API_ENDPOINTS.AI.COMPARE_POSTS, body)
  return res.data
}

export async function getPostChatStatus(accountId: number): Promise<{ configured: boolean; messages_today: number; daily_limit: number; session_limit: number }> {
  const res = await axiosAuth.get(API_ENDPOINTS.AI.POST_CHAT, { params: { account_id: accountId } })
  return res.data
}

export async function sendPostChat({ body, attachment }: { body: PostChatBody; attachment?: File | null }): Promise<PostChatRun> {
  const res = await axiosAuth.post(API_ENDPOINTS.AI.POST_CHAT, attachment ? withAttachment(body, attachment) : body)
  return res.data
}

// ---------------------------- LinkedIn ---------------------------------------------------- //

export async function getLinkedInConfig(): Promise<LinkedInConfig> {
  const res = await axiosAuth.get(API_ENDPOINTS.LINKEDIN.GET_CONFIG)
  return res.data
}

export async function getLinkedInConnections(): Promise<LinkedInConnection[]> {
  const res = await axiosAuth.get(API_ENDPOINTS.LINKEDIN.GET_CONNECTIONS)
  return res.data
}

export async function getLinkedInAuthUrl(accountId: number): Promise<{ url: string }> {
  const res = await axiosAuth.get(API_ENDPOINTS.LINKEDIN.GET_AUTH_URL, { params: { account_id: accountId } })
  return res.data
}

export async function disconnectLinkedIn(accountId: number): Promise<void> {
  await axiosAuth.delete(API_ENDPOINTS.LINKEDIN.DELETE_CONNECTION(accountId))
}

// ---------------------------- Publishing -------------------------------------------------- //

export async function getPlannedPosts(accountId: number): Promise<PlannedPost[]> {
  const res = await axiosAuth.get(API_ENDPOINTS.PLANNER.GET_PLANNED, { params: { account_id: accountId } })
  return res.data
}

export async function createPlannedPost(body: PlannedPostInput): Promise<PlannedPost> {
  const res = await axiosAuth.post(API_ENDPOINTS.PLANNER.POST_PLANNED, body)
  return res.data
}

export async function updatePlannedPost({ id, body }: { id: number; body: PlannedPostInput }): Promise<PlannedPost> {
  const res = await axiosAuth.put(API_ENDPOINTS.PLANNER.PLANNED(id), body)
  return res.data
}

export async function deletePlannedPost(id: number): Promise<void> {
  await axiosAuth.delete(API_ENDPOINTS.PLANNER.PLANNED(id))
}

export async function plannedPostAction({ id, action, now }: { id: number; action: 'approve' | 'unapprove' | 'publish'; now?: boolean }): Promise<PlannedPost> {
  const res = await axiosAuth.post(API_ENDPOINTS.PLANNER.POST_ACTION(id, action), now === undefined ? undefined : { now })
  return res.data
}

export async function markPlannedPosted({ id, postUrl }: { id: number; postUrl: string }): Promise<PlannedPost> {
  const res = await axiosAuth.post(API_ENDPOINTS.PLANNER.POST_MARK_POSTED(id), { post_url: postUrl })
  return res.data
}

export async function uploadPlannedImage({ id, file }: { id: number; file: File }): Promise<PlannedPost> {
  const res = await axiosAuth.post(API_ENDPOINTS.PLANNER.IMAGE(id), fileForm(file))
  return res.data
}

export async function removePlannedImage(id: number): Promise<PlannedPost> {
  const res = await axiosAuth.delete(API_ENDPOINTS.PLANNER.IMAGE(id))
  return res.data
}

export async function uploadPlannedMedia({ id, file }: { id: number; file: File }): Promise<PlannedPost> {
  const res = await axiosAuth.post(API_ENDPOINTS.PLANNER.MEDIA(id), fileForm(file))
  return res.data
}

export function getPlannedImageUrl(id: number, bust?: string): string {
  return `${BASE_URL}${API_ENDPOINTS.PLANNER.IMAGE(id)}${bust ? `?v=${encodeURIComponent(bust)}` : ''}`
}

export function getPlannedMediaUrl(id: number): string {
  return `${BASE_URL}${API_ENDPOINTS.PLANNER.MEDIA(id)}`
}

