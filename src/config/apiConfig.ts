import { safeGetItem } from '../lib/storage';

/**
 * Resolve the API base URL for the current environment.
 */
export function getApiBaseUrl(): string {
  return ''
}

/**
 * Make an authenticated API request.
 * Includes Authorization header if token is in sessionStorage.
 */
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}${endpoint}`

  const token = safeGetItem('cb_api_token')
  const headers = new Headers(options.headers || {})

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(url, {
    ...options,
    headers
  })

  if (!res.ok) {
    let errorMessage = res.statusText
    try {
      const data = await res.json()
      errorMessage = data.error || data.message || errorMessage
    } catch (e) {
      // not json
    }
    throw new Error(errorMessage || 'API fetch failed')
  }

  return res
}
