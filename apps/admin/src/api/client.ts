import type {
  Philosopher,
  CreatePhilosopherInput,
  UpdatePhilosopherInput,
  AuthResponse,
  User,
} from '@philosophy/shared'

const TOKEN_KEY = 'philosophy_jwt_token'

/** 开发环境直连 127.0.0.1:3000；生产环境走同域 Nginx 反代 */
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
}

type AuthHandler = () => void
let onUnauthorized: AuthHandler | null = null

export function setUnauthorizedHandler(handler: AuthHandler) {
  onUnauthorized = handler
}

function apiUrl(path: string) {
  return `${API_BASE}${path}`
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = false,
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  }

  if (auth) {
    const token = getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  let res: Response
  try {
    res = await fetch(apiUrl(path), { ...options, headers })
  } catch {
    throw new Error(
      `无法连接 API（${API_BASE || '同域'}）。请确认 yarn dev:api 已启动在 3000 端口。`,
    )
  }

  if (res.status === 401 && auth) {
    clearAuth()
    onUnauthorized?.()
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `Request failed: ${res.status}`)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  login: (username: string, password: string) =>
    request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  me: () => request<User>('/api/auth/me', {}, true),

  listPhilosophers: () => request<Philosopher[]>('/api/philosophers'),

  getPhilosopher: (id: string) => request<Philosopher>(`/api/philosophers/${id}`),

  createPhilosopher: (data: CreatePhilosopherInput) =>
    request<Philosopher>('/api/philosophers', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true),

  updatePhilosopher: (id: string, data: UpdatePhilosopherInput) =>
    request<Philosopher>(`/api/philosophers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, true),

  deletePhilosopher: (id: string) =>
    request<{ success: boolean }>(`/api/philosophers/${id}`, {
      method: 'DELETE',
    }, true),

  uploadAvatar: (id: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return request<Philosopher>(`/api/philosophers/${id}/avatar`, {
      method: 'POST',
      body: form,
    }, true)
  },
}
