import { lazy } from 'react'

export const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })))
export const DataPage = lazy(() => import('@/pages/data/DataPage').then((m) => ({ default: m.DataPage })))
export const ImportPage = lazy(() => import('@/pages/data/ImportPage').then((m) => ({ default: m.ImportPage })))
export const NewPostPage = lazy(() => import('@/pages/data/NewPostPage').then((m) => ({ default: m.NewPostPage })))
export const PostDetailPage = lazy(() => import('@/pages/data/PostDetailPage').then((m) => ({ default: m.PostDetailPage })))
export const ComparePostsPage = lazy(() => import('@/pages/compare/ComparePostsPage').then((m) => ({ default: m.ComparePostsPage })))
export const ComparePeriodsPage = lazy(() => import('@/pages/compare/ComparePeriodsPage').then((m) => ({ default: m.ComparePeriodsPage })))

export const SuggestionsPage = lazy(() => import('@/pages/suggestions/SuggestionsPage').then((m) => ({ default: m.SuggestionsPage })))
export const CalendarPage = lazy(() => import('@/pages/calendar/CalendarPage').then((m) => ({ default: m.CalendarPage })))
export const PublishingPage = lazy(() => import('@/pages/publishing/PublishingPage').then((m) => ({ default: m.PublishingPage })))
export const CreatePostPage = lazy(() => import('@/pages/create-post/CreatePostPage').then((m) => ({ default: m.CreatePostPage })))

export const BrandSuggestionsPage = lazy(() => import('@/pages/brand/BrandSuggestionsPage').then((m) => ({ default: m.BrandSuggestionsPage })))
export const CompetitorsPage = lazy(() => import('@/pages/brand/CompetitorsPage').then((m) => ({ default: m.CompetitorsPage })))

export const LeadSuggestionsPage = lazy(() => import('@/pages/leads/LeadSuggestionsPage').then((m) => ({ default: m.LeadSuggestionsPage })))
export const LeadsLogPage = lazy(() => import('@/pages/leads/LeadsLogPage').then((m) => ({ default: m.LeadsLogPage })))
export const PipelinePage = lazy(() => import('@/pages/leads/PipelinePage').then((m) => ({ default: m.PipelinePage })))
export const LeadResultsPage = lazy(() => import('@/pages/leads/ResultsPage').then((m) => ({ default: m.ResultsPage })))

export const LinkedInPage = lazy(() => import('@/pages/linkedin/LinkedInPage').then((m) => ({ default: m.LinkedInPage })))
export const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })))
export const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage').then((m) => ({ default: m.ProfilePage })))
export const SignInPage = lazy(() => import('@/pages/auth/SignInPage').then((m) => ({ default: m.SignInPage })))
