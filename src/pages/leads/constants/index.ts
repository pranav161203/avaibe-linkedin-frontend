import type { LeadSource, LeadStage } from '@/lib/api'

export const SOURCE_LABEL: Record<LeadSource, string> = {
  company_post: 'Company page post',
  founder_post: 'Founder’s post',
  company_page: 'Company page (visit / message)',
  founder_profile: 'Founder’s profile / message',
  website: 'Website',
  referral: 'Referral',
  event: 'Event',
  other: 'Other',
}

export const STAGE_LABEL: Record<LeadStage, string> = { new: 'New', talking: 'In talks', proposal: 'Proposal sent', won: 'Won', lost: 'Lost' }

export const STAGES = Object.keys(STAGE_LABEL) as LeadStage[]

export const FROM_LINKEDIN: LeadSource[] = ['company_post', 'founder_post', 'company_page', 'founder_profile']

export const REPLY_TARGET_HOURS = 24

export const STALE_DAYS = 14
