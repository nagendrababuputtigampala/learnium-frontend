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
  apiClient,
  clearTokens,
  getRefreshToken,
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

  const restore = useCallback(async () => {
    if (getRefreshToken() === null) {
      setIsRestoring(false)
      return
    }
    try {
      await refreshAccessToken()
      const response = await apiClient.get<AuthUser>('/me')
      setUser(response.data)
    } catch {
      clearTokens()
      setUser(null)
    } finally {
      setIsRestoring(false)
    }
  }, [])

  useEffect(() => {
    void restore()
  }, [restore])

  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null)
      navigate('/login')
    })
    return () => {
      setSessionExpiredHandler(null)
    }
  }, [navigate])

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await apiClient.post<LoginResponse>('/auth/login', {
        email,
        password,
      })
      setAccessToken(response.data.accessToken)
      setRefreshToken(response.data.refreshToken)
      setUser(response.data.user)
      return response.data.user
    },
    [],
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
      setUser(null)
      navigate('/login')
    }
  }, [navigate])

  const studentSession = useCallback(
    async (batchId: string, fullName: string, pin: string) => {
      const response = await apiClient.post<StudentSessionResponse>(
        '/auth/student-session',
        { batchId, fullName, pin },
      )
      saveStudentSession(response.data)
      return response.data.student
    },
    [],
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
