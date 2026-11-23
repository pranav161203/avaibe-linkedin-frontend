import { AreaPage } from '@/pages/suggestions/components/AreaPage'

export function LeadSuggestionsPage() {
  return (
    <AreaPage
      areaId="leads"
      also={['sales']}
      eyebrow="Leads & sales"
      title="Suggestions"
      description="Bringing in enquiries from the right people (UAE decision-makers, not just likes) and turning them into won business."
    />
  )
}
