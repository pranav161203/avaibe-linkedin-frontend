import axios, { AxiosError } from 'axios'
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

export const redirectToLogin = () => {
  if (window.location.pathname !== '/signin') window.location.href = '/signin'
}

axiosAuth.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: unknown }>) => {
    const status = error.response?.status ?? 0
    if (status === 401 && !error.config?.url?.startsWith('/auth/')) redirectToLogin()
    const detail = error.response?.data?.detail
    const message = typeof detail === 'string' ? detail : detail ? JSON.stringify(detail) : error.response?.statusText || error.message
    return Promise.reject(new ApiError(status, message))
  },
)
