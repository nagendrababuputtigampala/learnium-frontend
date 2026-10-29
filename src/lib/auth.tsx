import { useQueryClient } from '@tanstack/react-query'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import {
  advanceSessionGeneration,
  apiClient,
  clearTokens,
  getRefreshToken,
  getSessionGeneration,
  isStaleSessionError,
  refreshAccessToken,
  saveStudentSession,
  setAccessToken,
  setRefreshToken,
  setSessionExpiredHandler,
  type AuthUser,
  type LoginResponse,
  type StudentProfile,
  type StudentSessionResponse,
} from './api'

export interface AuthContextValue {
  user: AuthUser | null
  isRestoring: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  logout: () => Promise<void>
  studentSession: (
    batchId: string,
    fullName: string,
    pin: string,
  ) => Promise<StudentProfile>
  restore: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isRestoring, setIsRestoring] = useState(true)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  /**
   * Drops every cached query and mutation (including one-time PIN
   * results). Called on each session transition, before the new
   * session's identity drives any rendering or fetching, so data from
   * a previous account can never leak into the next one.
   */
  const clearCachedData = useCallback(() => {
    void queryClient.cancelQueries()
    queryClient.clear()
  }, [queryClient])

  const restore = useCallback(async () => {
    if (getRefreshToken() === null) {
      setIsRestoring(false)
      return
    }
    // The whole restore is generation-guarded: if a login, logout or
    // student session supersedes it mid-flight, its late results are
    // abandoned instead of overwriting (or clearing) the identity
    // that now owns the session.
    const generation = getSessionGeneration()
    try {
      await refreshAccessToken()
      if (generation !== getSessionGeneration()) {
        return
      }
      const response = await apiClient.get<AuthUser>('/me')
      if (generation !== getSessionGeneration()) {
        return
      }
      setUser(response.data)
    } catch (error) {
      if (
        !isStaleSessionError(error) &&
        generation === getSessionGeneration()
      ) {
        clearTokens()
        clearCachedData()
        setUser(null)
      }
    } finally {
      setIsRestoring(false)
    }
  }, [clearCachedData])

  useEffect(() => {
    void restore()
  }, [restore])

  useEffect(() => {
    setSessionExpiredHandler(() => {
      clearCachedData()
      setUser(null)
      navigate('/login')
    })
    return () => {
      setSessionExpiredHandler(null)
    }
  }, [navigate, clearCachedData])

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await apiClient.post<LoginResponse>('/auth/login', {
        email,
        password,
      })
      advanceSessionGeneration()
      clearCachedData()
      setAccessToken(response.data.accessToken)
      setRefreshToken(response.data.refreshToken)
      setUser(response.data.user)
      return response.data.user
    },
    [clearCachedData],
  )

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken()
    try {
      if (refreshToken !== null) {
        await apiClient.post('/auth/logout', { refreshToken })
      }
    } catch {
      // The local session is cleared regardless of the server response.
    } finally {
      clearTokens()
      clearCachedData()
      setUser(null)
      navigate('/login')
    }
  }, [navigate, clearCachedData])

  const studentSession = useCallback(
    async (batchId: string, fullName: string, pin: string) => {
      const response = await apiClient.post<StudentSessionResponse>(
        '/auth/student-session',
        { batchId, fullName, pin },
      )
      advanceSessionGeneration()
      clearCachedData()
      saveStudentSession(response.data)
      return response.data.student
    },
    [clearCachedData],
  )

  const value: AuthContextValue = {
    user,
    isRestoring,
    login,
    logout,
    studentSession,
    restore,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
