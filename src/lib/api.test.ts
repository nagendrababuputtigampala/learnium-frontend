import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  API_BASE_URL,
  apiClient,
  clearStudentSession,
  clearTokens,
  createApiClient,
  getAccessToken,
  getApiErrorMessage,
  getRefreshToken,
  getStudent,
  refreshAccessToken,
  saveStudentSession,
  setAccessToken,
  setRefreshToken,
  setSessionExpiredHandler,
} from './api'
import {
  loginResponseFor,
  studentProfile,
  teacherUser,
} from '../test/fixtures'

describe('api client', () => {
  it('defaults the base URL to /api/v1 when no env override is set', () => {
    expect(API_BASE_URL).toBe('/api/v1')
  })

  it('creates a client with the given base URL and JSON content type', () => {
    const client = createApiClient('https://example.test/api/v9')
    expect(client.defaults.baseURL).toBe('https://example.test/api/v9')
    const headers = AxiosHeaders.from(client.defaults.headers)
    expect(headers.get('Content-Type')).toBe('application/json')
  })

  it('exposes a shared client bound to the module base URL', () => {
    expect(apiClient.defaults.baseURL).toBe(API_BASE_URL)
  })

  it('uses the VITE_API_BASE_URL env override when set', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test/v2')
    vi.resetModules()
    try {
      const mod = await import('./api')
      expect(mod.API_BASE_URL).toBe('https://api.example.test/v2')
      expect(mod.apiClient.defaults.baseURL).toBe(
        'https://api.example.test/v2',
      )
    } finally {
      vi.unstubAllEnvs()
      vi.resetModules()
    }
  })
})

describe('token storage', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    setAccessToken(null)
    setSessionExpiredHandler(null)
  })

  it('stores the access token in memory only', () => {
    expect(getAccessToken()).toBeNull()
    setAccessToken('access-1')
    expect(getAccessToken()).toBe('access-1')
    expect(localStorage.getItem('learnium.accessToken')).toBeNull()
    setAccessToken(null)
    expect(getAccessToken()).toBeNull()
  })

  it('persists the refresh token in localStorage', () => {
    expect(getRefreshToken()).toBeNull()
    setRefreshToken('refresh-1')
    expect(getRefreshToken()).toBe('refresh-1')
    expect(localStorage.getItem('learnium.refreshToken')).toBe('refresh-1')
    setRefreshToken(null)
    expect(getRefreshToken()).toBeNull()
  })

  it('clearTokens removes both tokens', () => {
    setAccessToken('access-1')
    setRefreshToken('refresh-1')
    clearTokens()
    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
  })

  it('round-trips a student session through sessionStorage', () => {
    expect(getStudent()).toBeNull()
    saveStudentSession({
      accessToken: 'student-token',
      tokenType: 'Bearer',
      expiresInSeconds: 43200,
      student: studentProfile,
    })
    expect(sessionStorage.getItem('learnium.studentToken')).toBe(
      'student-token',
    )
    expect(getStudent()).toEqual(studentProfile)
    clearStudentSession()
    expect(getStudent()).toBeNull()
    expect(sessionStorage.getItem('learnium.studentToken')).toBeNull()
  })
})

describe('getApiErrorMessage', () => {
  it('returns the backend envelope message when present', () => {
    const error = new AxiosError('Request failed')
    error.response = {
      data: {
        code: 'LRN-AUTH-001',
        message: 'Invalid email or password',
        traceId: 'trace-1',
        timestamp: '2026-10-28T00:00:00Z',
      },
      status: 401,
      statusText: 'Unauthorized',
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    }
    expect(getApiErrorMessage(error, 'fallback')).toBe(
      'Invalid email or password',
    )
  })

  it('falls back when the axios error has no response body message', () => {
    const noResponse = new AxiosError('Network Error')
    expect(getApiErrorMessage(noResponse, 'fallback')).toBe('fallback')

    const emptyMessage = new AxiosError('Request failed')
    emptyMessage.response = {
      data: { message: '' },
      status: 500,
      statusText: 'Server Error',
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    }
    expect(getApiErrorMessage(emptyMessage, 'fallback')).toBe('fallback')
  })

  it('falls back for non-axios errors', () => {
    expect(getApiErrorMessage(new Error('boom'), 'fallback')).toBe('fallback')
    expect(getApiErrorMessage('nope', 'fallback')).toBe('fallback')
  })
})

describe('refreshAccessToken', () => {
  beforeEach(() => {
    localStorage.clear()
    setAccessToken(null)
    setRefreshToken(null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('rejects when no refresh token is stored', async () => {
    const post = vi.spyOn(axios, 'post')
    await expect(refreshAccessToken()).rejects.toThrow(
      'No refresh token available',
    )
    expect(post).not.toHaveBeenCalled()
  })

  it('exchanges the refresh token and stores the rotated pair', async () => {
    setRefreshToken('old-refresh')
    const post = vi
      .spyOn(axios, 'post')
      .mockResolvedValue({
        data: loginResponseFor(teacherUser),
      } as AxiosResponse)
    await expect(refreshAccessToken()).resolves.toBe('access-token')
    expect(post).toHaveBeenCalledWith('/api/v1/auth/refresh', {
      refreshToken: 'old-refresh',
    })
    expect(getAccessToken()).toBe('access-token')
    expect(getRefreshToken()).toBe('refresh-token')
  })

  it('shares one in-flight request between concurrent callers', async () => {
    setRefreshToken('old-refresh')
    let resolvePost: (value: AxiosResponse) => void = () => undefined
    const post = vi.spyOn(axios, 'post').mockImplementation(
      () =>
        new Promise<AxiosResponse>((resolve) => {
          resolvePost = resolve
        }),
    )
    const first = refreshAccessToken()
    const second = refreshAccessToken()
    expect(post).toHaveBeenCalledTimes(1)
    resolvePost({ data: loginResponseFor(teacherUser) } as AxiosResponse)
    await expect(first).resolves.toBe('access-token')
    await expect(second).resolves.toBe('access-token')

    post.mockResolvedValue({
      data: loginResponseFor(teacherUser),
    } as AxiosResponse)
    await refreshAccessToken()
    expect(post).toHaveBeenCalledTimes(2)
  })

  it('propagates refresh failures and resets the in-flight slot', async () => {
    setRefreshToken('old-refresh')
    const post = vi
      .spyOn(axios, 'post')
      .mockRejectedValue(new Error('refresh failed'))
    await expect(refreshAccessToken()).rejects.toThrow('refresh failed')
    post.mockResolvedValue({
      data: loginResponseFor(teacherUser),
    } as AxiosResponse)
    await expect(refreshAccessToken()).resolves.toBe('access-token')
    expect(post).toHaveBeenCalledTimes(2)
  })
})

const okResponse = (config: InternalAxiosRequestConfig): AxiosResponse => ({
  data: { ok: true },
  status: 200,
  statusText: 'OK',
  headers: {},
  config,
})

function unauthorizedError(config: InternalAxiosRequestConfig): AxiosError {
  const response: AxiosResponse = {
    data: {},
    status: 401,
    statusText: 'Unauthorized',
    headers: {},
    config,
  }
  return new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, {}, response)
}

describe('auth interceptors', () => {
  beforeEach(() => {
    localStorage.clear()
    setAccessToken(null)
    setRefreshToken(null)
    setSessionExpiredHandler(null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function clientWith(adapter: AxiosAdapter) {
    const client = createApiClient('/api/v1')
    client.defaults.adapter = adapter
    return client
  }

  it('attaches the access token to outgoing requests', async () => {
    setAccessToken('access-1')
    let seen: unknown
    const client = clientWith((config) => {
      seen = AxiosHeaders.from(config.headers).get('Authorization')
      return Promise.resolve(okResponse(config))
    })
    await client.get('/me')
    expect(seen).toBe('Bearer access-1')
  })

  it('sends no Authorization header when there is no token', async () => {
    let seen: unknown = 'unset'
    const client = clientWith((config) => {
      seen = AxiosHeaders.from(config.headers).get('Authorization')
      return Promise.resolve(okResponse(config))
    })
    await client.get('/me')
    expect(seen).toBeUndefined()
  })

  it('refreshes once on a 401 and retries the original request', async () => {
    setRefreshToken('old-refresh')
    vi.spyOn(axios, 'post').mockResolvedValue({
      data: loginResponseFor(teacherUser),
    } as AxiosResponse)
    const authorizations: unknown[] = []
    let calls = 0
    const client = clientWith((config) => {
      calls += 1
      authorizations.push(
        AxiosHeaders.from(config.headers).get('Authorization'),
      )
      if (calls === 1) {
        return Promise.reject(unauthorizedError(config))
      }
      return Promise.resolve(okResponse(config))
    })
    const response = await client.get('/me')
    expect(response.data).toEqual({ ok: true })
    expect(calls).toBe(2)
    expect(authorizations[1]).toBe('Bearer access-token')
  })

  it('does not attempt a refresh for auth endpoints', async () => {
    const post = vi.spyOn(axios, 'post')
    const client = clientWith((config) =>
      Promise.reject(unauthorizedError(config)),
    )
    await expect(
      client.post('/auth/login', { email: 'a@b.c', password: 'x' }),
    ).rejects.toThrow('Unauthorized')
    await expect(
      client.post('/auth/student-session', { batchId: 'b' }),
    ).rejects.toThrow('Unauthorized')
    expect(post).not.toHaveBeenCalled()
  })

  it('does not retry a request that already failed after a refresh', async () => {
    setRefreshToken('old-refresh')
    vi.spyOn(axios, 'post').mockResolvedValue({
      data: loginResponseFor(teacherUser),
    } as AxiosResponse)
    let calls = 0
    const client = clientWith((config) => {
      calls += 1
      return Promise.reject(unauthorizedError(config))
    })
    await expect(client.get('/me')).rejects.toThrow('Unauthorized')
    expect(calls).toBe(2)
  })

  it('clears the session and notifies the handler when refresh fails', async () => {
    setAccessToken('stale-access')
    setRefreshToken('old-refresh')
    const handler = vi.fn()
    setSessionExpiredHandler(handler)
    vi.spyOn(axios, 'post').mockRejectedValue(new Error('refresh failed'))
    const client = clientWith((config) =>
      Promise.reject(unauthorizedError(config)),
    )
    await expect(client.get('/me')).rejects.toThrow('Unauthorized')
    expect(handler).toHaveBeenCalledTimes(1)
    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
  })

  it('still rejects cleanly when no session-expired handler is registered', async () => {
    setRefreshToken('old-refresh')
    vi.spyOn(axios, 'post').mockRejectedValue(new Error('refresh failed'))
    const client = clientWith((config) =>
      Promise.reject(unauthorizedError(config)),
    )
    await expect(client.get('/me')).rejects.toThrow('Unauthorized')
    expect(getRefreshToken()).toBeNull()
  })

  it('passes through non-401 errors without refreshing', async () => {
    const post = vi.spyOn(axios, 'post')
    const client = clientWith((config) => {
      const response: AxiosResponse = {
        data: {},
        status: 500,
        statusText: 'Server Error',
        headers: {},
        config,
      }
      return Promise.reject(
        new AxiosError('Server Error', 'ERR_BAD_RESPONSE', config, {}, response),
      )
    })
    await expect(client.get('/me')).rejects.toThrow('Server Error')
    expect(post).not.toHaveBeenCalled()
  })

  it('passes through axios errors that carry no response', async () => {
    const client = clientWith(() =>
      Promise.reject(new AxiosError('Network Error', 'ERR_NETWORK')),
    )
    await expect(client.get('/me')).rejects.toThrow('Network Error')
  })

  it('rejects a 401 whose error has no request config', async () => {
    const post = vi.spyOn(axios, 'post')
    const client = clientWith((config) => {
      const response: AxiosResponse = {
        data: {},
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config,
      }
      return Promise.reject(
        new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', undefined, {}, response),
      )
    })
    await expect(client.get('/me')).rejects.toThrow('Unauthorized')
    expect(post).not.toHaveBeenCalled()
  })

  it('passes through non-axios errors untouched', async () => {
    const client = clientWith(() => Promise.reject(new Error('boom')))
    await expect(client.get('/me')).rejects.toThrow('boom')
  })

  it('treats a 401 without a URL as refreshable', async () => {
    setRefreshToken('old-refresh')
    vi.spyOn(axios, 'post').mockResolvedValue({
      data: loginResponseFor(teacherUser),
    } as AxiosResponse)
    let calls = 0
    const client = clientWith((config) => {
      calls += 1
      if (calls === 1) {
        config.url = undefined
        return Promise.reject(unauthorizedError(config))
      }
      return Promise.resolve(okResponse(config))
    })
    const response = await client.get('/me')
    expect(response.data).toEqual({ ok: true })
    expect(calls).toBe(2)
  })
})
