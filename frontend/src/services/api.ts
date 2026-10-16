import axios, { isAxiosError } from 'axios'

// Shared Axios instance for the ASP.NET Core Web API.
// In development Vite forwards /api to the backend, so the session cookie is a normal first-party cookie.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
  timeout: 15000,
})

// The error body the backend sends for rule and validation errors (see ServiceErrorFilter.cs)
export interface ApiErrorBody {
  code?: string
  messageKey?: string
}

export function apiErrorBody(error: unknown): ApiErrorBody | null {
  return isAxiosError<ApiErrorBody>(error) && error.response?.data && typeof error.response.data === 'object'
    ? error.response.data
    : null
}

export function apiStatus(error: unknown): number | null {
  return isAxiosError(error) ? (error.response?.status ?? null) : null
}

export default api
