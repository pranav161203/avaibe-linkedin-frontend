
export const ERRORS: Record<string, string> = {
  not_invited: 'This Microsoft account has not been invited. Contact your administrator for an invitation.',
  disabled: 'Your account has been deactivated. Contact your administrator for assistance.',
  company_disabled: 'Your company’s access has been suspended. Contact your administrator.',
  microsoft_off: 'Microsoft sign-in is not available. Sign in with your email and password.',
  tenant: 'Sign in with your work Microsoft account.',
  expired: 'The sign-in request expired or was already used. Try again.',
  invalid: 'The sign-in could not be verified. Try again.',
  no_email: 'Microsoft did not provide an email address for this account.',
  microsoft: 'Microsoft could not complete the sign-in.',
}

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
