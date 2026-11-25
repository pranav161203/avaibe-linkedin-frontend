export const FORMATS = ['image', 'carousel', 'video', 'poll', 'newsletter', 'text', 'untagged'] as const
export type PostFormat = (typeof FORMATS)[number]

export const CHECKPOINTS = ['1h', '6h', '24h', '48h', '7d'] as const
export type Checkpoint = (typeof CHECKPOINTS)[number]
export type CheckpointQ = Checkpoint | 'latest'

export const METRIC_FIELDS = [
  'impressions',
  'members_reached',
  'clicks',
  'reactions',
  'comments',
  'reposts',
  'video_views',
  'poll_votes',
  'newsletter_views',
  'newsletter_subscribers',
  'followers_gained',
] as const
export type MetricField = (typeof METRIC_FIELDS)[number]

export type Role = 'viewer' | 'editor' | 'admin' | 'superadmin'
export const ROLES: Role[] = ['viewer', 'editor', 'admin', 'superadmin']

export interface Me {
  enabled: boolean
  /** Which sign-in options the server offers */
  /** password_reset: a mail server is configured, so "Forgot password?" works */
  methods?: { password: boolean; microsoft: boolean; password_reset?: boolean }
  user: {
    id?: number | null
    email: string
    name: string | null
    role: Role
    can_switch_accounts: boolean
    dev: boolean
    has_password?: boolean
    /** Empty for super admins, who work across companies */
    company?: { id: number; name: string } | null
  } | null
  allowed_account_ids?: number[]
  default_account_id?: number | null
}

export interface TeamMember {
  id: number
  email: string
  name: string | null
  role: Role
  can_switch_accounts: boolean
  active: boolean
  last_login_at: string | null
  has_password?: boolean
  created_at?: string | null
  /** Email of whoever invited them */
  created_by?: string | null
}

/** A pending invitation. token/link only come back right after creating or renewing it. */
export interface Invitation {
  id: number
  email: string
  role: Role
  can_switch_accounts: boolean
  invited_by: string | null
  created_at: string | null
  expires_at: string | null
  /** When the current link was last emailed; null = shared by hand */
  emailed_at?: string | null
  token?: string
  link?: string
  /** Right after inviting or renewing: whether the email went out */
  email_sent?: boolean
}

export interface InviteInput {
  email: string
  role: Role
  can_switch_accounts: boolean
}

export interface TeamData {
  members: TeamMember[]
  invitations: Invitation[]
  /** The company this list is for; null = the super admins */
  company: { id: number; name: string } | null
  default_account_id: number | null
  /** Invitations are emailed (a mail server is configured); otherwise links are shared by hand */
  email_enabled?: boolean
}

export interface Company {
  id: number
  name: string
  slug: string
  website: string | null
  country: string
  industry: string | null
  is_active: boolean
  default_account_id: number | null
  users: number | null
  accounts: number | null
  pending_invitations: number | null
  created_at: string
  created_by: string | null
  updated_at: string
  updated_by: string | null
}

export interface CompanyInput {
  name: string
  website?: string | null
  country?: string
  industry?: string | null
}

export type CompanyUpdate = Partial<CompanyInput> & { is_active?: boolean; default_account_id?: number | null }

/** One signed-in device (a sign-in session) of the current person */
export interface SignedInDevice {
  id: string
  /** e.g. "Chrome on Windows" */
  device: string
  method: 'password' | 'microsoft'
  created_at: string
  last_used_at: string
  expires_at: string
  /** The device making this request */
  current: boolean
}

export interface InvitationInfo {
  email: string
  role: Role
  company: string | null
}

export interface TeamMemberInput {
  email: string
  name: string | null
  role: Role
  can_switch_accounts: boolean
  active: boolean
}

export interface SegmentSettings {
  uae_country: string[]
  uae_cities: string[]
  education_industry: string[]
  decision_seniority: string[]
  decision_titles: string[]
  tech_functions: string[]
  partner_functions: string[]
}

export interface PerformanceSettings {
  min_history: number
  min_slot_posts: number
  cut_high: number
  cut_above: number
  cut_average: number
  cut_below: number
  trend_threshold: number
}

export interface BrandSettings {
  company_summary: string
  website: string
  services: string[]
  target_segments: string[]
  differentiators: string[]
  proof_points: string[]
  voice: string
  avoid: string[]
  competitors: string[]
  languages: string[]
}

export interface AppSettings {
  /** The company these settings belong to */
  company_id?: number
  current: { segments: SegmentSettings; performance: PerformanceSettings; brand: BrandSettings }
  defaults: { segments: SegmentSettings; performance: PerformanceSettings; brand: BrandSettings }
}

export interface ClaudeUsage {
  month_start_uae: string
  runs: number
  failed_runs: number
  input_tokens: number
  output_tokens: number
  estimated_cost_usd: number
  daily_limit_per_account: number
}

export interface ClaudeStatus {
  configured: boolean
  model: string
  daily_limit_per_account: number
  /** Owners only (null for everyone else) */
  key_hint: string | null
  /** Platform-wide usage and cost: owners only */
  usage: ClaudeUsage | null
}

export type IdeaType = 'post' | 'campaign' | 'outreach' | 'brand' | 'seo_aeo' | 'leads' | 'sales'

export type LeadSource = 'company_post' | 'founder_post' | 'company_page' | 'founder_profile' | 'website' | 'referral' | 'event' | 'other'
export type LeadStage = 'new' | 'talking' | 'proposal' | 'won' | 'lost'

export interface LeadInput {
  account_id: number
  received_on: string
  source: LeadSource
  post_id: number | null
  via_account_id: number | null
  company: string
  industry: string | null
  in_uae: boolean | null
  role: string | null
  decision_maker: boolean | null
  service: string | null
  stage: LeadStage
  value_aed: number | null
  closed_on: string | null
  notes: string | null
  how_heard: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  replied_at: string | null
  qualified: boolean | null
}

export interface Lead extends LeadInput {
  id: number
  is_qualified: boolean | null
  post_title: string | null
  post_topic: string | null
  post_format: string | null
  post_date: string | null
  via_account_name: string | null
  updated_at: string
}
type Level = 'low' | 'medium' | 'high'

export interface Idea {
  type: IdeaType
  title: string
  what: string
  when: string
  who: string
  why: string[]
  novelty: string
  boost: string
  risk: string
  confidence: Level
  /** Claude's own estimate, 0-100 (older runs don't have it) */
  confidence_pct?: number | null
  confidence_reason: string
  effort: Level
  measure: { metric: string; period: string; target: string }
  draft_caption: string | null
}

export interface IdeasRun {
  id: number
  account_id: number
  focus: string | null
  status: 'ok' | 'error'
  model: string
  input_tokens: number
  output_tokens: number
  cost_usd: number
  result: { situation: string; ideas: Idea[]; data_gaps: string[] } | null
  error: string | null
  created_by: string | null
  created_at: string
}

export interface PageChecklistData {
  items: Record<string, { done: boolean; note?: string | null }>
}
export type CompetitorSegment = 'software' | 'erp' | 'edtech' | 'it_services' | 'agency' | 'other'
export interface Competitor {
  id: string
  name: string
  segment: CompetitorSegment
  website?: string | null
  linkedin_url?: string | null
  followers?: number | null
  posts_per_week?: number | null
  topics?: string | null
  positioning?: string | null
  strengths?: string | null
  opportunity?: string | null
  checked_on?: string | null
}
export interface CompetitorsData {
  competitors: Competitor[]
}
export interface MemberTotalsData {
  as_of: string | null
  followers: number | null
  totals: Partial<Record<
    | 'IMPRESSION' | 'MEMBERS_REACHED' | 'REACTION' | 'COMMENT' | 'RESHARE' | 'POST_SAVE' | 'POST_SEND' | 'LINK_CLICKS'
    | 'FOLLOWER_GAINED_FROM_CONTENT' | 'PROFILE_VIEW_FROM_CONTENT',
    number
  >>
}
export interface AccountDocs {
  page_checklist: PageChecklistData
  competitors: CompetitorsData
  member_totals: MemberTotalsData
}
export interface AccountDoc<K extends keyof AccountDocs> {
  kind: K
  data: AccountDocs[K]
  updated_by: string | null
  updated_at: string | null
}

export type DecisionStatus = 'later' | 'dismissed' | 'done'
export interface Decision {
  key: string
  status: DecisionStatus
  until: string | null
  decided_by: string | null
  updated_at: string
}

/** Brand trends from the web (Claude + web search), one run = a few ideas with their sources */
export type TrendType = 'industry' | 'policy' | 'news' | 'linkedin' | 'culture' | 'design' | 'format' | 'calendar' | 'voice'
export interface TrendIdea {
  title: string
  trend_type: TrendType
  trend: string
  angle: string
  service: string
  audiences: ('schools' | 'smes' | 'tech' | 'partners')[]
  avoid_for: string | null
  format: string
  look: string
  image_prompt: string
  voice: 'company page' | 'founder'
  use_by: string
  risks: string[]
  confidence: 'high' | 'medium' | 'low'
  confidence_pct?: number | null
  sources: { title: string; url: string; date: string | null }[]
}
export interface TrendsRun extends Omit<IdeasRun, 'result'> {
  result: { ideas: TrendIdea[]; skipped: string[]; searches: number } | null
}
export interface TrendsState {
  configured: boolean
  latest: TrendsRun | null
  runs_today: number
  daily_limit: number
  running: boolean
}

export interface IdeasState {
  configured: boolean
  latest: IdeasRun | null
  runs_today: number
  daily_limit: number
  running: boolean
}

export interface LinkedInConfig {
  configured: boolean
  missing: string[]
}

export interface LinkedInConnection {
  account_id: number
  name: string | null
  email: string | null
  picture_url: string | null
  expires_at: string
  expired: boolean
  days_left: number
  connected_at: string | null
}

export type PlannedStatus = 'draft' | 'approved' | 'publishing' | 'published' | 'failed' | 'missed'

export const PLANNED_FORMATS = ['text', 'image', 'carousel', 'video', 'article', 'poll'] as const
export type PlannedFormat = (typeof PLANNED_FORMATS)[number]

export interface PlannedDetails {
  document_title?: string
  slides?: { headline: string; body: string }[]
  carousel_theme?: 'brand' | 'dark' | 'light'
  carousel_accent?: string
  subtitles?: boolean
  title?: string
  link?: string
  question?: string
  options?: string[]
  duration?: '1d' | '3d' | '1w' | '2w'
}

export interface PlannedPost {
  id: number
  ref: string | null
  account_id: number
  format: PlannedFormat
  goal: PostGoal | null
  manual: boolean
  by_hand: boolean
  details: PlannedDetails
  has_media: boolean
  media_name: string | null
  caption: string
  has_image: boolean
  image_alt: string | null
  visibility: 'PUBLIC' | 'CONNECTIONS'
  scheduled_at: string | null
  scheduled_at_uae: string | null
  scheduled_day_uae: string | null
  scheduled_slot_uae: string | null
  status: PlannedStatus
  topic: string | null
  industry: string | null
  cta: string | null
  keywords: string[]
  approved_at: string | null
  published_at: string | null
  linkedin_urn: string | null
  post_id: number | null
  error: string | null
  retry_at: string | null
  attempts: number
}

export interface PlannedPostInput {
  account_id: number
  format: PlannedFormat
  details: PlannedDetails
  caption: string
  image_alt: string | null
  visibility: 'PUBLIC' | 'CONNECTIONS'
  scheduled_at: string | null
  goal: PostGoal
  topic: string | null
  industry: string | null
  cta: string | null
  keywords: string[]
}

export type PostGoal = 'brand' | 'sales' | 'engagement'
export const POST_GOALS: { value: PostGoal; label: string; hint: string }[] = [
  { value: 'brand', label: 'Brand', hint: 'Brand awareness: get AVAIBE known to the right people in the UAE' },
  { value: 'sales', label: 'Sales', hint: 'Bring in enquiries (comments, DMs, demo requests) and move people towards a deal' },
  { value: 'engagement', label: 'Engagement', hint: 'Start conversations and grow the community' },
]

export interface Account {
  id: number
  name: string
  kind: 'company' | 'founder' | 'personal'
  linkedin_url: string | null
  is_test: boolean
  parent_id?: number | null
  company_id?: number | null
}

export interface Classification {
  label: string
  baseline: string
  percentile?: number
}

export type Snapshot = {
  id: number
  post_id: number
  checkpoint: Checkpoint
  captured_at: string
  notes: string | null
  engagements: number | null
  engagement_rate: number | null
  click_rate: number | null
  saves?: number | null
  sends?: number | null
  profile_views?: number | null
} & Record<MetricField, number | null>

export interface PostSummary {
  id: number
  ref: string | null
  account_id: number
  post_url: string | null
  linkedin_post_id: string | null
  author: string | null
  published_at: string
  published_at_uae: string
  published_at_ist: string
  day_uae: string
  slot_uae: string | null
  time_known: boolean
  targeted: boolean | null
  format: PostFormat
  topic: string | null
  topic_suggested: boolean
  industry: string | null
  keywords: string[]
  cta: string | null
  hashtags: string[]
  caption: string | null
  notes: string | null
  goal?: PostGoal | null
}

export const DIMENSIONS = ['location', 'industry', 'seniority', 'job_title', 'job_function', 'company_size', 'company'] as const
export type Dimension = (typeof DIMENSIONS)[number]

export interface Shares {
  uae_share: number | null
  education_share: number | null
  decision_maker_share: number | null
  tech_share?: number | null
  partner_share?: number | null
}

export interface AudienceRow {
  dimension: Dimension
  value: string
  pct: number
}

export interface Post extends PostSummary {
  snapshots: Snapshot[]
  audience: AudienceRow[]
  audience_captured_at: string | null
  shares: Shares
  classification?: Classification | null
}

export interface AudienceStats {
  posts_with_audience: number
  median_uae_share: number | null
  median_education_share: number | null
  median_decision_maker_share: number | null
  median_uae_impressions: number | null
  median_education_impressions: number | null
}

export interface PageAudienceRow {
  dimension: Dimension
  value: string
  count: number | null
  pct: number | null
}

export interface PageAudienceSnapshot {
  as_of: string
  audience: 'followers' | 'visitors'
  total: number | null
  rows: PageAudienceRow[]
  shares: Shares
}

export interface PageAudienceInput {
  as_of: string
  audience: 'followers' | 'visitors'
  total: number | null
  rows: PageAudienceRow[]
}

export interface PostInput {
  account_id: number
  post_url: string | null
  author: string | null
  published_at: string
  time_known?: boolean
  format: PostFormat
  topic: string | null
  industry: string | null
  keywords: string[]
  cta: string | null
  hashtags: string[]
  caption: string | null
  notes: string | null
}

export type SnapshotInput = Partial<Record<MetricField, number | null>> & {
  captured_at?: string | null
  notes?: string | null
}

export interface Overview extends AudienceStats {
  checkpoint: string
  suggested_checkpoint: Checkpoint
  posts_total: number
  posts_time_unknown: number
  posts_untagged: number
  posts_topic_suggested: number
  posts_at_checkpoint: number
  median_impressions: number | null
  median_engagement_rate: number | null
  median_click_rate: number | null
  total_clicks: number | null
  total_followers_gained: number | null
}

export interface RankedRow {
  post: PostSummary
  checkpoint: string
  value: number | null
  impressions: number | null
  engagements: number | null
  engagement_rate: number | null
  clicks: number | null
  comments: number | null
  classification: Classification | null
}

export interface Rankings {
  metric: string
  checkpoint: string
  top: RankedRow[]
  bottom: RankedRow[]
  note: string | null
}

export interface FormatRow extends AudienceStats {
  format: PostFormat
  posts: number
  median_impressions: number | null
  median_engagement_rate: number | null
  median_clicks: number | null
  median_comments: number | null
  key_metric: string
  median_key_metric: number | null
  followers_gained: number | null
}

export interface HeatCell {
  day: string
  slot: string
  posts: number
  median: number | null
  low_confidence: boolean
}

export interface SlotSuggestion {
  day: string
  slot: string
  median: number
  posts: number
}

export interface Heatmap {
  metric: string
  checkpoint: string
  format: string | null
  days: string[]
  slots: string[]
  min_posts_per_slot: number
  overall_median?: number | null
  posts_without_time: number
  cells: HeatCell[]
  suggestion: SlotSuggestion | null
}

export interface BestSlot {
  format: PostFormat
  metric: string
  posts: number
  suggestion: SlotSuggestion | null
}

export interface GroupRow extends AudienceStats {
  key: string
  posts: number
  median_impressions: number | null
  median_engagement_rate: number | null
  median_comments: number | null
  median_clicks: number | null
  followers_gained: number | null
}

export interface WindowStats extends AudienceStats {
  posts: number
  total_impressions: number | null
  median_impressions: number | null
  median_engagement_rate: number | null
  total_clicks: number | null
  followers_gained: number | null
}

export type Trend = 'improving' | 'declining' | 'stable' | 'unknown'

export interface Consistency {
  checkpoint: string
  windows: {
    days: number
    current: WindowStats
    previous: WindowStats
    median_impressions_trend: Trend
    engagement_rate_trend: Trend
    followers_trend: Trend
    uae_impressions_trend: Trend
  }[]
  weekly_posts: { week_start: string; posts: number }[]
  weeks_without_posts: number
  format_share_90d: { format: PostFormat; impressions: number; share: number | null }[]
  dominant_format_90d: { format: PostFormat; impressions: number; share: number } | null
}

export interface DueSnapshot {
  post_id: number
  topic: string | null
  format: PostFormat
  checkpoint: Checkpoint
  due_at: string
  due_at_uae: string
  hours_late: number
  closes_at: string
  closes_at_uae: string
}

export interface Suggestion {
  id: string
  category: 'data' | 'timing' | 'format' | 'topic' | 'cta' | 'consistency' | 'trend' | 'page' | 'lead'
  priority: 'high' | 'medium' | 'low'
  title: string
  when: string
  who: string
  why: string[]
  boost: string
  risk: string
  /** pct: measured share of the posts it rests on that back it (only data-based suggestions have one) */
  confidence: { level: 'high' | 'medium' | 'low'; reason: string; pct?: number | null }
  measure: { metric: string; period: string; target: string }
  action: { label: string; to: string } | null
  progress: { done: number; total: number; label: string } | null
  topic?: string | null
}

export interface SimilarResult {
  topic: string | null
  count: number
  with_numbers: number
  median_impressions: number | null
  verdict: 'above' | 'below' | 'similar' | null
  posts: { id: number; hook: string; published: string; impressions: number | null }[]
}
export interface SimilarResponse {
  checkpoint: string
  baseline: number | null
  results: Record<string, SimilarResult>
}

export interface SuggestionsResult {
  metric: string
  metric_label: string
  baseline: number | null
  checkpoint?: string
  generated_at?: string
  suggestions: Suggestion[]
}

/** Company knowledge base (shared by the workspace): sources split into searchable chunks */
export interface KnowledgeSource {
  id: number
  title: string
  kind: 'text' | 'file'
  file_name: string | null
  chars: number
  chunks: number
  /** Empty = applies to every account */
  account_ids: number[]
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
  content?: string
  sections?: number
}
export interface KnowledgeList {
  sources: KnowledgeSource[]
  total_chunks: number
  max_chars: number
}
export interface KnowledgeHit {
  source_id: number
  source_title: string
  heading: string
  text: string
  score: number
}

/** Planning posts from the Excel template: every row checked, ready rows saved as Unpublished on confirm */
export interface PlanImportRow {
  row: number
  status: 'ready' | 'error' | 'duplicate'
  problems: string[]
  format: string | null
  goal: PostGoal | null
  scheduled_at: string | null
  caption: string
}

export interface PlanImportResult {
  rows: PlanImportRow[]
  ready: number
  errors: number
  duplicates: number
  created: number
  refs: string[]
}

export interface ImportResult {
  posts_created: number
  posts_updated: number
  snapshots_saved: number
  errors: { row: number; error: string }[]
}

export interface ExportFileResult {
  file: string
  kind: 'content' | 'followers' | 'visitors' | 'competitors' | null
  exported_on?: string
  errors: string[]
  skipped?: string
  days_saved?: number
  days_new?: number
  days_changed?: number
  days_unchanged?: number
  posts_created?: number
  posts_updated?: number
  posts_unchanged?: number
  snapshots_saved?: number
  snapshots_kept_manual?: number
  posts_too_new?: number
  demographic_rows?: number
  demographic_total?: number
  demographic_status?: 'new' | 'changed' | 'unchanged'
}

export interface CompareExplanation {
  summary: string
  reasons: { reason: string; confidence: 'high' | 'medium' | 'low'; confidence_pct?: number | null }[]
  try_next: string[]
  caveats: string[]
}

export interface VisualPrompt {
  prompt: string
  settings: string[]
  tips: string[]
}
export interface CarouselPrompts {
  document_title: string
  style: string
  slides: { headline: string; body: string; prompt: string }[]
  tips: string[]
}
export type AnalysePart = 'text' | 'visual' | 'timing' | 'poll'

export interface PostAssistResult {
  text: {
    improved_text: string
    what_changed: string[]
    quick_fixes: { kind: 'hashtags' | 'shorter' | 'cta'; title: string; text: string }[]
  } | null
  visual: { notes: string[]; prompt: VisualPrompt | null; slide_prompts: CarouselPrompts | null } | null
  timing: { verdict: string; suggestions: string[]; suggested_time: string | null } | null
  poll: { question: string; options: string[]; notes: string[] } | null
  cautions: string[]
}

export interface PostAssistRun {
  id: number
  status: string
  model: string
  cost_usd: number
  input_tokens: number | null
  output_tokens: number | null
  result: PostAssistResult
  created_at: string
}

export type ComparePostsRun = Omit<PostAssistRun, 'result'> & { result: CompareExplanation }

export interface ChatTurn {
  message: string
  questions: { question: string; options: string[] }[]
  draft_text: string | null
  sources?: { title: string; url: string }[]
  searches?: number
}

export type LastImports = Partial<Record<'content' | 'followers' | 'visitors', { at: string | null; exported_on: string; file: string | null }>>

export interface ExportImportResult {
  account: string
  account_kind: Account['kind']
  files: ExportFileResult[]
}

export interface PageDay {
  date: string
  impressions: number | null
  unique_impressions: number | null
  clicks: number | null
  reactions: number | null
  comments: number | null
  reposts: number | null
  page_views: number | null
  unique_visitors: number | null
  new_followers: number | null
}

export type CalendarKind = 'uae_holiday' | 'india_holiday' | 'period' | 'event' | 'awareness' | 'business'

export interface CalendarItem {
  start: string
  end: string
  title: string
  kind: CalendarKind
  status: 'confirmed' | 'expected'
  note: string
}

export interface CalendarPost {
  id: number
  ref: string | null
  account_id: number
  account_name: string
  account_kind: string
  date: string
  time: string | null
  format: string
  title: string
  impressions: number | null
  checkpoint: string | null
  vs_typical: number | null
}

export interface CalendarPlanned {
  id: number
  ref: string | null
  date: string
  time: string
  slot: string
  format: string
  status: string
  title: string
}

export type EffectVerdict = 'better' | 'worse' | 'no_clear_difference' | 'too_few' | 'untested'

export interface TimingEffect {
  key: string
  label: string
  posts: number
  lift: number
  low: number
  high: number
  verdict: EffectVerdict
}

export interface TimingBacktest {
  ran: boolean
  reason?: string
  train?: number
  test?: number
  improvement_pct?: number
  verdict?: 'helps' | 'no_difference' | 'worse'
  text?: string
}

export interface DateAdvice {
  date: string
  weekday: string
  labels: string[]
  weekend: boolean
  best_slot: string
  best_lift: number
  clear: boolean
  slots: { slot: string; lift: number; posts: number }[]
  date_lift: number
  date_posts: number
  test_slot: string | null
}

export type CalendarTiming =
  | { ready: false; posts_used: number; reason: string }
  | { ready: true; posts_used: number; backtest: TimingBacktest; special: Record<string, TimingEffect>; days: Record<string, DateAdvice> }

export interface CalendarData {
  from: string
  to: string
  accounts: { id: number; name: string; kind: string }[]
  posts: CalendarPost[]
  planned: CalendarPlanned[]
  items: CalendarItem[]
  timing: CalendarTiming
  dates_cover: [number, number]
}

export interface TimingModel {
  metric: string
  metric_label: string
  checkpoint: string
  posts_used: number
  posts_without_time: number
  prior: number
  min_posts: number
  ready: boolean
  reason?: string
  days?: TimingEffect[]
  slots?: TimingEffect[]
  special?: TimingEffect[]
  ramadan_slots?: TimingEffect[]
  formats?: { key: string; posts: number; lift: number }[]
  topics?: { key: string; posts: number; lift: number }[]
  spread?: { day: number | null; slot: number | null; format: number | null; topic: number | null }
  backtest?: TimingBacktest
  upcoming?: DateAdvice[]
}

export type SettingsSection = 'segments' | 'performance' | 'brand'
export type PostAssistBody = {
  account_id: number
  format: string
  caption: string
  topic: string | null
  industry: string | null
  cta: string | null
  goal?: PostGoal | null
  focus: AnalysePart[]
  scheduled_at: string | null
  details: PlannedDetails
  media_attached: boolean
}
export type PostChatBody = {
  account_id: number
  format: string
  caption: string
  topic: string | null
  industry: string | null
  cta: string | null
  goal?: PostGoal | null
  messages: { role: 'user' | 'assistant'; content: string }[]
  web_search?: boolean
}
export type PostChatRun = Omit<PostAssistRun, 'result'> & { result: ChatTurn }
