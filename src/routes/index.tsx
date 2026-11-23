import { Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { PageLoading } from '@/components/layout/PageLoading'
import * as P from './pages'

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route path="signin" element={<P.SignInPage />} />
          <Route element={<Layout />}>
            <Route index element={<P.DashboardPage />} />
            <Route path="data" element={<P.DataPage />} />
            <Route path="posts/new" element={<P.NewPostPage />} />
            <Route path="posts/:id" element={<P.PostDetailPage />} />
            <Route path="compare" element={<P.ComparePostsPage />} />
            <Route path="compare/periods" element={<P.ComparePeriodsPage />} />
            <Route path="import" element={<P.ImportPage />} />

            <Route path="suggestions/:area" element={<P.SuggestionsPage />} />
            <Route path="calendar" element={<P.CalendarPage />} />
            <Route path="publishing" element={<P.PublishingPage />} />
            <Route path="create" element={<P.CreatePostPage />} />
            <Route path="create/:id" element={<P.CreatePostPage />} />

            <Route path="brand/suggestions" element={<P.BrandSuggestionsPage />} />
            <Route path="brand/competitors" element={<P.CompetitorsPage />} />

            <Route path="leads/suggestions" element={<P.LeadSuggestionsPage />} />
            <Route path="leads/log" element={<P.LeadsLogPage />} />
            <Route path="leads/pipeline" element={<P.PipelinePage />} />
            <Route path="leads/results" element={<P.LeadResultsPage />} />

            <Route path="linkedin" element={<P.LinkedInPage />} />
            <Route path="settings" element={<P.SettingsPage />} />
            <Route path="profile" element={<P.ProfilePage />} />

            <Route path="posts" element={<Navigate to="/data?tab=posts" replace />} />
            <Route path="audience" element={<Navigate to="/data?tab=audience" replace />} />
            <Route path="suggestions" element={<Navigate to="/suggestions/content" replace />} />
            <Route path="brand" element={<Navigate to="/brand/suggestions" replace />} />
            <Route path="brand/kit" element={<Navigate to="/settings?tab=claude" replace />} />
            <Route path="brand/checklist" element={<Navigate to="/brand/suggestions" replace />} />
            <Route path="leads" element={<Navigate to="/leads/log" replace />} />
            <Route path="sales" element={<Navigate to="/leads/pipeline" replace />} />
            <Route path="sales/suggestions" element={<Navigate to="/leads/suggestions" replace />} />
            <Route path="sales/pipeline" element={<Navigate to="/leads/pipeline" replace />} />
            <Route path="accounts" element={<Navigate to="/settings?tab=general" replace />} />
            <Route path="assistant" element={<Navigate to="/suggestions" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
