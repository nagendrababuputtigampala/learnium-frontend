import axios, {
  AxiosHeaders,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios'

/**
 * Base URL for the Learnium backend API.
 * Override at build/serve time with the VITE_API_BASE_URL env var;
 * defaults to the same-origin path proxied to the backend.
 */
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

/* ------------------------------------------------------------------ */
/* API contract types                                                  */
/* ------------------------------------------------------------------ */

export type Role = 'CENTRE_ADMIN' | 'TEACHER'

export interface AuthUser {
  userId: string
  displayName: string
  email: string
  role: Role
  centreId: string
  centreName: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresInSeconds: number
  user: AuthUser
}

export interface StudentProfile {
  userId: string
  displayName: string
  membershipId: string
  batchId: string
  batchName: string
  centreId: string
}

export interface StudentSessionResponse {
  accessToken: string
  tokenType: string
  expiresInSeconds: number
  student: StudentProfile
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface TeacherDto {
  userId: string
  email: string
  displayName: string
  active: boolean
  /** True while the teacher has been invited but not yet set a password. */
  invited: boolean
  createdAt: string
}

export interface BatchDto {
  batchId: string
  name: string
  gradeSubjectId: string
  gradeLabel: string
  teacherUserId: string | null
  teacherName: string | null
  studentCount: number
}

export interface GradeSubject {
  gradeSubjectId: string
  gradeCode: string
  gradeName: string
  subjectId: string
  subjectName: string
  label: string
}

export interface RosterStudent {
  membershipId: string
  userId: string
  fullName: string
  status: string
  pinLocked: boolean
}

export interface CreatedStudent {
  membershipId: string
  userId: string
  fullName: string
  pin: string
}

export interface CentreDto {
  centreId: string
  name: string
  logoUrl: string
  contactEmail: string
}

export interface PublicCentre {
  centreId: string
  name: string
}

export interface PublicBatch {
  batchId: string
  name: string
}

export interface ApiErrorBody {
  code: string
  message: string
  traceId: string
  timestamp: string
  fieldErrors?: Record<string, string>
}

/* ------------------------------------------------------------------ */
/* Token storage                                                       */
/* ------------------------------------------------------------------ */

export const REFRESH_TOKEN_KEY = 'learnium.refreshToken'
export const STUDENT_TOKEN_KEY = 'learnium.studentToken'
export const STUDENT_KEY = 'learnium.student'

let accessToken: string | null = null

/** The in-memory staff access token (never persisted). */
export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setRefreshToken(token: string | null): void {
  if (token === null) {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  } else {
    localStorage.setItem(REFRESH_TOKEN_KEY, token)
  }
}

export function clearTokens(): void {
  accessToken = null
  setRefreshToken(null)
  advanceSessionGeneration()
}

/** Persists a student join session (token + profile) in sessionStorage. */
export function saveStudentSession(session: StudentSessionResponse): void {
  sessionStorage.setItem(STUDENT_TOKEN_KEY, session.accessToken)
  sessionStorage.setItem(STUDENT_KEY, JSON.stringify(session.student))
}

export function getStudent(): StudentProfile | null {
  const raw = sessionStorage.getItem(STUDENT_KEY)
  return raw === null ? null : (JSON.parse(raw) as StudentProfile)
}

export function clearStudentSession(): void {
  sessionStorage.removeItem(STUDENT_TOKEN_KEY)
  sessionStorage.removeItem(STUDENT_KEY)
}

/* ------------------------------------------------------------------ */
/* Session-expiry hook (registered by the auth provider)               */
/* ------------------------------------------------------------------ */

let sessionExpiredHandler: (() => void) | null = null

export function setSessionExpiredHandler(handler: (() => void) | null): void {
  sessionExpiredHandler = handler
}

/* ------------------------------------------------------------------ */
/* Session generation (stale-refresh guard)                            */
/* ------------------------------------------------------------------ */

let sessionGeneration = 0

/**
 * Raised when a token refresh resolves after the session it belonged
 * to has ended (logout, session clear or a newer login). The refreshed
 * tokens are discarded so they can never resurrect the old session or
 * overwrite the current one.
 */
export class StaleSessionError extends Error {
  constructor() {
    super('Session changed while a token refresh was in flight')
    this.name = 'StaleSessionError'
  }
}

export function isStaleSessionError(error: unknown): boolean {
  return error instanceof StaleSessionError
}

/** The current session generation; it advances on every session change. */
export function getSessionGeneration(): number {
  return sessionGeneration
}

/**
 * Advances the session generation. A refresh still in flight from the
 * previous generation is discarded when it resolves, and the next
 * refresh call starts a fresh request instead of joining the old one.
 */
export function advanceSessionGeneration(): void {
  sessionGeneration += 1
  refreshPromise = null
}

/* ------------------------------------------------------------------ */
/* Refresh (single-flight)                                             */
/* ------------------------------------------------------------------ */

let refreshPromise: Promise<string> | null = null

/**
 * Exchanges the stored refresh token for a fresh token pair.
 * Concurrent callers within one session generation share one in-flight
 * request; the rotated refresh token replaces the stored one. If the
 * session generation advances while the request is in flight, the
 * result is discarded with a StaleSessionError instead of being stored.
 */
export function refreshAccessToken(): Promise<string> {
  if (refreshPromise !== null) {
    return refreshPromise
  }
  const refreshToken = getRefreshToken()
  if (refreshToken === null) {
    return Promise.reject(new Error('No refresh token available'))
  }
  const generation = sessionGeneration
  const promise = axios
    .post<LoginResponse>(`${API_BASE_URL}/auth/refresh`, { refreshToken })
    .then((response) => {
      if (generation !== sessionGeneration) {
        throw new StaleSessionError()
      }
      setAccessToken(response.data.accessToken)
      setRefreshToken(response.data.refreshToken)
      return response.data.accessToken
    })
    .finally(() => {
      if (refreshPromise === promise) {
        refreshPromise = null
      }
    })
  refreshPromise = promise
  return promise
}

/* ------------------------------------------------------------------ */
/* Error helper                                                        */
/* ------------------------------------------------------------------ */

/** Extracts the backend envelope message from an error, else the fallback. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const message = error.response?.data?.message
    if (message) {
      return message
    }
  }
  return fallback
}

/* ------------------------------------------------------------------ */
/* HTTP client                                                         */
/* ------------------------------------------------------------------ */

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
}

const NO_REFRESH_PATHS = ['/auth/login', '/auth/refresh', '/auth/student-session']

function isNoRefreshPath(url: string | undefined): boolean {
  return url !== undefined && NO_REFRESH_PATHS.some((path) => url.includes(path))
}

/** Creates an axios client bound to the given API base URL. */
export function createApiClient(baseURL: string): AxiosInstance {
  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  client.interceptors.request.use((config) => {
    const token = getAccessToken()
    if (token !== null) {
      config.headers.set('Authorization', `Bearer ${token}`)
    }
    return config
  })

  client.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      if (!axios.isAxiosError(error)) {
        return Promise.reject(error)
      }
      const config = error.config as RetriableRequestConfig | undefined
      if (
        error.response?.status !== 401 ||
        config === undefined ||
        config._retry === true ||
        isNoRefreshPath(config.url)
      ) {
        return Promise.reject(error)
      }
      config._retry = true
      try {
        const token = await refreshAccessToken()
        config.headers = AxiosHeaders.from(config.headers)
        config.headers.set('Authorization', `Bearer ${token}`)
        return client(config)
      } catch (refreshError) {
        if (isStaleSessionError(refreshError)) {
          // The refresh belonged to a session that has already been
          // replaced; the current session's tokens are not ours to clear.
          return Promise.reject(error)
        }
        clearTokens()
        sessionExpiredHandler?.()
        return Promise.reject(error)
      }
    },
  )

  return client
}

/** Shared API client used across the app. */
export const apiClient: AxiosInstance = createApiClient(API_BASE_URL)
