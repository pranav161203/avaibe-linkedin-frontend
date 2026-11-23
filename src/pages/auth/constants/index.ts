
export const ERRORS: Record<string, string> = {
  not_invited: 'Your AVAIBE account isn’t on the team list yet. Ask an admin to add you, then sign in again.',
  disabled: 'Your access has been switched off. Contact an admin if you think this is a mistake.',
  tenant: 'Please sign in with your AVAIBE work account.',
  expired: 'The sign-in took too long or the link was used already. Please try again.',
  invalid: 'The sign-in couldn’t be verified. Please try again.',
  no_email: 'Microsoft didn’t share an email address for this account.',
  microsoft: 'Microsoft couldn’t complete the sign-in.',
}

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
