const API_ENDPOINTS = {
  AUTH: {
    GET_ME: '/auth/me',
    POST_LOGOUT: '/auth/logout',
  },
  TEAM: {
    GET_TEAM: '/team',
    POST_MEMBER: '/team',
    PUT_MEMBER: (id: number) => `/team/${id}`,
    DELETE_MEMBER: (id: number) => `/team/${id}`,
    PUT_DEFAULT_ACCOUNT: '/team/default-account/set',
  },
  ACCOUNTS: {
    GET_ACCOUNTS: '/accounts',
    POST_ACCOUNT: '/accounts',
    PAGE_AUDIENCE: (accountId: number) => `/accounts/${accountId}/page-audience`,
    GET_PAGE_DAILY: (accountId: number) => `/accounts/${accountId}/page-daily`,
    GET_LAST_IMPORTS: (accountId: number) => `/accounts/${accountId}/last-imports`,
    DOC: (accountId: number, kind: string) => `/accounts/${accountId}/docs/${kind}`,
  },
  POSTS: {
    GET_POSTS: '/posts',
    POST_POST: '/posts',
    POST: (id: number) => `/posts/${id}`,
    SNAPSHOT: (postId: number, checkpoint: string) => `/posts/${postId}/snapshots/${checkpoint}`,
    PUT_AUDIENCE: (postId: number) => `/posts/${postId}/audience`,
  },
  ANALYTICS: {
    GET_OVERVIEW: '/analytics/overview',
    GET_SUGGESTIONS: '/analytics/suggestions',
    GET_DUE_SNAPSHOTS: '/analytics/due-snapshots',
    POST_SIMILAR_POSTS: '/analytics/similar-posts',
  },
  CALENDAR: {
    GET_CALENDAR: '/calendar',
    GET_CALENDAR_ITEMS: '/calendar/items',
  },
  LEADS: {
    GET_LEADS: '/leads',
    POST_LEAD: '/leads',
    LEAD: (id: number) => `/leads/${id}`,
    POST_REPLIED: (id: number) => `/leads/${id}/replied`,
  },
  SETTINGS: {
    GET_SETTINGS: '/settings',
    PUT_SECTION: (section: string) => `/settings/${section}`,
    POST_RESET: (section: string) => `/settings/${section}/reset`,
    GET_CLAUDE: '/settings/claude',
  },
  SUGGESTIONS: {
    DECISIONS: '/suggestions/decisions',
  },
  AI: {
    IDEAS: '/ai/ideas',
    TRENDS: '/ai/trends',
    POST_IDEA_TO_DRAFT: (runId: number, index: number) => `/ai/ideas/${runId}/${index}/draft`,
    POST_ASSIST: '/ai/post-assist',
    POST_CHAT: '/ai/post-chat',
    COMPARE_POSTS: '/ai/compare-posts',
  },
  LINKEDIN: {
    GET_CONFIG: '/linkedin/config',
    GET_CONNECTIONS: '/linkedin/connections',
    DELETE_CONNECTION: (accountId: number) => `/linkedin/connections/${accountId}`,
    GET_AUTH_URL: '/linkedin/auth-url',
  },
  PLANNER: {
    GET_PLANNED: '/planner',
    POST_PLANNED: '/planner',
    PLANNED: (id: number) => `/planner/${id}`,
    POST_ACTION: (id: number, action: string) => `/planner/${id}/${action}`,
    IMAGE: (id: number) => `/planner/${id}/image`,
    MEDIA: (id: number) => `/planner/${id}/media`,
    POST_MARK_POSTED: (id: number) => `/planner/${id}/mark-posted`,
    POST_IMPORT: '/planner/import',
    IMPORT_TEMPLATE: '/planner/import/template',
  },
  IMPORT: {
    POST_CSV: '/import/csv',
    POST_LINKEDIN_EXPORT: '/import/linkedin-export',
  },
} as const

export default API_ENDPOINTS
