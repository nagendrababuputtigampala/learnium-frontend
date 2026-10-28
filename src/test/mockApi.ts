import type { Mock } from 'vitest'

/**
 * Test double for the `src/lib/api` module.
 *
 * Test files wire it up with (the handles must be built inline —
 * `vi.hoisted` callbacks cannot reference imported functions):
 *
 *   const mock = vi.hoisted(() => ({
 *     get: vi.fn(),
 *     post: vi.fn(),
 *     put: vi.fn(),
 *     delete: vi.fn(),
 *     refreshAccessToken: vi.fn(),
 *     sessionExpired: { handler: null as (() => void) | null },
 *   }))
 *   vi.mock('../lib/api', async () => {
 *     const helper = await import('../test/mockApi')
 *     return helper.createMockApiModule(mock)
 *   })
 *
 * HTTP verbs and the refresh function are plain `vi.fn()`s the test
 * drives; token storage mirrors the real module (in-memory access
 * token, localStorage refresh token, sessionStorage student session).
 */

export interface MockHandles {
  get: Mock
  post: Mock
  put: Mock
  delete: Mock
  refreshAccessToken: Mock
  sessionExpired: { handler: (() => void) | null }
}

export function createMockApiModule(handles: MockHandles) {
  let accessToken: string | null = null
  const http = {
    get: handles.get,
    post: handles.post,
    put: handles.put,
    delete: handles.delete,
  }
  return {
    API_BASE_URL: '/api/v1',
    REFRESH_TOKEN_KEY: 'learnium.refreshToken',
    STUDENT_TOKEN_KEY: 'learnium.studentToken',
    STUDENT_KEY: 'learnium.student',
    createApiClient: () => http,
    apiClient: http,
    getAccessToken: () => accessToken,
    setAccessToken: (token: string | null) => {
      accessToken = token
    },
    getRefreshToken: () => localStorage.getItem('learnium.refreshToken'),
    setRefreshToken: (token: string | null) => {
      if (token === null) {
        localStorage.removeItem('learnium.refreshToken')
      } else {
        localStorage.setItem('learnium.refreshToken', token)
      }
    },
    clearTokens: () => {
      accessToken = null
      localStorage.removeItem('learnium.refreshToken')
    },
    saveStudentSession: (session: {
      accessToken: string
      student: unknown
    }) => {
      sessionStorage.setItem('learnium.studentToken', session.accessToken)
      sessionStorage.setItem(
        'learnium.student',
        JSON.stringify(session.student),
      )
    },
    getStudent: () => {
      const raw = sessionStorage.getItem('learnium.student')
      return raw === null ? null : JSON.parse(raw)
    },
    clearStudentSession: () => {
      sessionStorage.removeItem('learnium.studentToken')
      sessionStorage.removeItem('learnium.student')
    },
    setSessionExpiredHandler: (handler: (() => void) | null) => {
      handles.sessionExpired.handler = handler
    },
    refreshAccessToken: handles.refreshAccessToken,
    getApiErrorMessage: (error: unknown, fallback: string) => {
      const message = (
        error as { response?: { data?: { message?: unknown } } } | null
      )?.response?.data?.message
      return typeof message === 'string' && message !== '' ? message : fallback
    },
  }
}
