import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { ApiError } from './api-error'

export const BASE_URL = '/api'

export const axiosAuth = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
})

axiosAuth.interceptors.request.use((config) => {
  if (config.params) {
    config.params = Object.fromEntries(Object.entries(config.params).filter(([, v]) => v !== undefined && v !== null && v !== ''))
  }
  return config
})

/** Pages that work without being signed in: never bounce them to sign-in */
const PUBLIC_PATHS = ['/signin', '/signup', '/forgot-password', '/reset-password']

export const redirectToLogin = () => {
  const path = window.location.pathname
  if (!PUBLIC_PATHS.includes(path)) window.location.href = '/signin'
}

/** Renew the access token with the refresh-token cookie. Calls that arrive together share one request,
 * because each refresh token works once. Resolves false when the session has ended. */
let refreshing: Promise<boolean> | null = null
export function tryRefresh(): Promise<boolean> {
  refreshing ??= axiosAuth
    .post('/auth/refresh')
    .then(
      () => true,
      () => false,
    )
    .finally(() => setTimeout(() => (refreshing = null), 0))
  return refreshing
}

axiosAuth.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ detail?: unknown }>) => {
    const status = error.response?.status ?? 0
    const config = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined
    // An expired access token: renew it once, then repeat the call as if nothing happened
    if (status === 401 && config && !config.url?.startsWith('/auth/') && !config._retried) {
      config._retried = true
      if (await tryRefresh()) return axiosAuth(config)
      redirectToLogin()
    }
    const detail = error.response?.data?.detail
    const message = typeof detail === 'string' ? detail : detail ? JSON.stringify(detail) : error.response?.statusText || error.message
    return Promise.reject(new ApiError(status, message))
  },
)
