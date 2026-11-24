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

            <Route path="suggestions" element={<P.SuggestionsPage />} />
            <Route path="suggestions/:area" element={<P.SuggestionsPage />} />
            <Route path="calendar" element={<P.CalendarPage />} />
            <Route path="publishing" element={<P.PublishingPage />} />
            <Route path="create" element={<P.CreatePostPage />} />
            <Route path="create/:id" element={<P.CreatePostPage />} />

            <Route path="brand/suggestions" element={<Navigate to="/suggestions?area=brand" replace />} />
            <Route path="brand/competitors" element={<P.CompetitorsPage />} />
            <Route path="brand/knowledge" element={<P.KnowledgePage />} />

            <Route path="leads/suggestions" element={<Navigate to="/suggestions?area=leads" replace />} />
            <Route path="leads/log" element={<P.LeadsLogPage />} />
            <Route path="leads/pipeline" element={<P.PipelinePage />} />
            <Route path="leads/results" element={<P.LeadResultsPage />} />

            <Route path="linkedin" element={<P.LinkedInPage />} />
            <Route path="settings" element={<P.SettingsPage />} />
            <Route path="profile" element={<P.ProfilePage />} />

            <Route path="posts" element={<Navigate to="/data?tab=posts" replace />} />
            <Route path="audience" element={<Navigate to="/data?tab=audience" replace />} />
            <Route path="brand" element={<Navigate to="/brand/competitors" replace />} />
            <Route path="brand/kit" element={<Navigate to="/settings?tab=claude" replace />} />
            <Route path="brand/checklist" element={<Navigate to="/suggestions?area=brand" replace />} />
            <Route path="leads" element={<Navigate to="/leads/log" replace />} />
            <Route path="sales" element={<Navigate to="/leads/pipeline" replace />} />
            <Route path="sales/suggestions" element={<Navigate to="/suggestions?area=leads" replace />} />
            <Route path="sales/pipeline" element={<Navigate to="/leads/pipeline" replace />} />
            <Route path="accounts" element={<Navigate to="/settings?tab=general" replace />} />
            <Route path="assistant" element={<Navigate to="/suggestions" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
