import { Navigate, useParams } from 'react-router-dom'
import { AREAS, areaPath, OWN_SECTION, type AreaId } from '@/hooks/suggestion-items'
import { AreaPage } from './components/AreaPage'

export function SuggestionsPage() {
  const { area } = useParams()
  if (area && OWN_SECTION[area as AreaId]) return <Navigate to={areaPath(area as AreaId)} replace />
  const def = AREAS.find((a) => a.id === area)
  if (!def) return <Navigate to="/suggestions/content" replace />
  if (def.id === 'content') return <AreaPage key={def.id} areaId="content" eyebrow="Content" title="Suggestions" />
  return <AreaPage key={def.id} areaId={def.id} />
}
