import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  adminUser,
  loginResponseFor,
  studentProfile,
  teacherUser,
} from '../test/fixtures'
import { LocationProbe, renderWithProviders } from '../test/renderWithProviders'
import {
  advanceSessionGeneration,
  getAccessToken,
  getApiErrorMessage,
  getStudent,
  StaleSessionError,
  type AuthUser,
} from './api'
import { useAuth } from './auth'

const mock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  refreshAccessToken: vi.fn(),
  sessionExpired: { handler: null as (() => void) | null },
}))

vi.mock('./api', async () => {
  const helper = await import('../test/mockApi')
  return helper.createMockApiModule(mock)
})

function Probe() {
  const auth = useAuth()
  const [actionError, setActionError] = useState('')
  return (
    <div>
      <p data-testid="user-email">
        {auth.user === null ? 'none' : auth.user.email}
      </p>
      <p data-testid="restoring">{String(auth.isRestoring)}</p>
      <p data-testid="action-error">{actionError}</p>
      <button
        type="button"
        onClick={() => {
          auth
            .login('patel@learnium.test', 'secret123')
            .catch((error: unknown) => {
              setActionError(getApiErrorMessage(error, 'Login failed'))
            })
        }}
      >
        Log in
      </button>
      <button
        type="button"
        onClick={() => {
          void auth.logout()
        }}
      >
        Log out
      </button>
      <button
        type="button"
        onClick={() => {
          auth
            .studentSession('batch-1', 'Simran', '1234')
            .catch((error: unknown) => {
              setActionError(getApiErrorMessage(error, 'Join failed'))
            })
        }}
      >
        Join as student
      </button>
      <LocationProbe />
    </div>
  )
}

async function renderProbe() {
  const utils = renderWithProviders(
    <>
      <Probe />
    </>,
    ['/'],
  )
  await waitFor(() =>
    expect(screen.getByTestId('restoring')).toHaveTextContent('false'),
  )
  return utils
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  mock.get.mockReset()
  mock.post.mockReset()
  mock.put.mockReset()
  mock.delete.mockReset()
  mock.refreshAccessToken.mockReset()
  mock.sessionExpired.handler = null
})

describe('AuthProvider restore', () => {
  it('finishes restoring with no user when no refresh token exists', async () => {
    await renderProbe()
    expect(screen.getByTestId('user-email')).toHaveTextContent('none')
    expect(mock.refreshAccessToken).not.toHaveBeenCalled()
  })

  it('restores the user from a stored refresh token', async () => {
    localStorage.setItem('learnium.refreshToken', 'stored-refresh')
    mock.refreshAccessToken.mockResolvedValue('fresh-access')
    mock.get.mockResolvedValue({ data: teacherUser })
    await renderProbe()
    expect(screen.getByTestId('user-email')).toHaveTextContent(
      'patel@learnium.test',
    )
    expect(mock.get).toHaveBeenCalledWith('/me')
  })

  it('clears the session when the refresh fails', async () => {
    localStorage.setItem('learnium.refreshToken', 'stored-refresh')
    mock.refreshAccessToken.mockRejectedValue(new Error('expired'))
    await renderProbe()
    expect(screen.getByTestId('user-email')).toHaveTextContent('none')
    expect(localStorage.getItem('learnium.refreshToken')).toBeNull()
  })

  it('clears the session when loading the profile fails', async () => {
    localStorage.setItem('learnium.refreshToken', 'stored-refresh')
    mock.refreshAccessToken.mockResolvedValue('fresh-access')
    mock.get.mockRejectedValue(new Error('server down'))
    await renderProbe()
    expect(screen.getByTestId('user-email')).toHaveTextContent('none')
    expect(localStorage.getItem('learnium.refreshToken')).toBeNull()
  })

  it('keeps the stored session when the restore refresh went stale', async () => {
    localStorage.setItem('learnium.refreshToken', 'stored-refresh')
    mock.refreshAccessToken.mockRejectedValue(new StaleSessionError())
    await renderProbe()
    // A newer session owns the auth state: nothing is cleared here.
    expect(localStorage.getItem('learnium.refreshToken')).toBe(
      'stored-refresh',
    )
    expect(screen.getByTestId('user-email')).toHaveTextContent('none')
  })
})

describe('AuthProvider restore generation guard', () => {
  /** Deferred /me response the test settles when it chooses. */
  function deferredMe() {
    let resolveMe: (value: { data: AuthUser }) => void = () => undefined
    let rejectMe: (error: unknown) => void = () => undefined
    mock.get.mockImplementation(
      () =>
        new Promise<{ data: AuthUser }>((resolve, reject) => {
          resolveMe = resolve
          rejectMe = reject
        }),
    )
    return {
      resolve: (user: AuthUser) => resolveMe({ data: user }),
      reject: (error: unknown) => rejectMe(error),
    }
  }

  function mockLoginAsAdmin() {
    mock.post.mockImplementation((url: string) => {
      if (url === '/auth/login') {
        return Promise.resolve({ data: loginResponseFor(adminUser) })
      }
      return Promise.resolve({ data: undefined })
    })
  }

  it('a late /me cannot overwrite a fresher login with the old identity', async () => {
    const user = userEvent.setup()
    localStorage.setItem('learnium.refreshToken', 'stored-refresh')
    mock.refreshAccessToken.mockResolvedValue('fresh-access')
    const me = deferredMe()
    mockLoginAsAdmin()
    renderWithProviders(<Probe />, ['/'])
    await waitFor(() => expect(mock.get).toHaveBeenCalledWith('/me'))
    // The fresh login completes while the restore's /me is in flight.
    await user.click(screen.getByRole('button', { name: 'Log in' }))
    await waitFor(() =>
      expect(screen.getByTestId('user-email')).toHaveTextContent(
        'ada@learnium.test',
      ),
    )
    // The stale restore now resolves with the PREVIOUS identity.
    me.resolve(teacherUser)
    await waitFor(() =>
      expect(screen.getByTestId('restoring')).toHaveTextContent('false'),
    )
    expect(screen.getByTestId('user-email')).toHaveTextContent(
      'ada@learnium.test',
    )
  })

  it('a late /me cannot resurrect the identity after a logout', async () => {
    const user = userEvent.setup()
    localStorage.setItem('learnium.refreshToken', 'stored-refresh')
    mock.refreshAccessToken.mockResolvedValue('fresh-access')
    const me = deferredMe()
    mock.post.mockResolvedValue({ data: undefined })
    renderWithProviders(<Probe />, ['/'])
    await waitFor(() => expect(mock.get).toHaveBeenCalledWith('/me'))
    await user.click(screen.getByRole('button', { name: 'Log out' }))
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent('/login'),
    )
    // The stale restore resolves after the logout completed.
    me.resolve(teacherUser)
    await waitFor(() =>
      expect(screen.getByTestId('restoring')).toHaveTextContent('false'),
    )
    expect(screen.getByTestId('user-email')).toHaveTextContent('none')
    expect(localStorage.getItem('learnium.refreshToken')).toBeNull()
  })

  it('abandons the restore before /me when the generation moved during refresh', async () => {
    localStorage.setItem('learnium.refreshToken', 'stored-refresh')
    let resolveRefresh: (value: string) => void = () => undefined
    mock.refreshAccessToken.mockImplementation(
      () =>
        new Promise<string>((resolve) => {
          resolveRefresh = resolve
        }),
    )
    renderWithProviders(<Probe />, ['/'])
    await waitFor(() => expect(mock.refreshAccessToken).toHaveBeenCalled())
    resolveRefresh('fresh-access')
    // A session change lands before the restore continuation runs.
    advanceSessionGeneration()
    await waitFor(() =>
      expect(screen.getByTestId('restoring')).toHaveTextContent('false'),
    )
    expect(mock.get).not.toHaveBeenCalled()
    expect(screen.getByTestId('user-email')).toHaveTextContent('none')
    // The other session owns storage: restore cleared nothing.
    expect(localStorage.getItem('learnium.refreshToken')).toBe(
      'stored-refresh',
    )
  })

  it('a late /me failure does not clear a fresher login', async () => {
    const user = userEvent.setup()
    localStorage.setItem('learnium.refreshToken', 'stored-refresh')
    mock.refreshAccessToken.mockResolvedValue('fresh-access')
    const me = deferredMe()
    mockLoginAsAdmin()
    renderWithProviders(<Probe />, ['/'])
    await waitFor(() => expect(mock.get).toHaveBeenCalledWith('/me'))
    await user.click(screen.getByRole('button', { name: 'Log in' }))
    await waitFor(() =>
      expect(screen.getByTestId('user-email')).toHaveTextContent(
        'ada@learnium.test',
      ),
    )
    // The stale restore's /me now fails: the error belongs to the old
    // session, so the new login's identity and tokens stay put.
    me.reject(new Error('server down'))
    await waitFor(() =>
      expect(screen.getByTestId('restoring')).toHaveTextContent('false'),
    )
    expect(screen.getByTestId('user-email')).toHaveTextContent(
      'ada@learnium.test',
    )
    expect(getAccessToken()).toBe('access-token')
    expect(localStorage.getItem('learnium.refreshToken')).toBe(
      'refresh-token',
    )
  })
})

describe('AuthProvider actions', () => {
  it('login stores the token pair and exposes the user', async () => {
    const user = userEvent.setup()
    mock.post.mockResolvedValue({ data: loginResponseFor(teacherUser) })
    await renderProbe()
    await user.click(screen.getByRole('button', { name: 'Log in' }))
    await waitFor(() =>
      expect(screen.getByTestId('user-email')).toHaveTextContent(
        'patel@learnium.test',
      ),
    )
    expect(mock.post).toHaveBeenCalledWith('/auth/login', {
      email: 'patel@learnium.test',
      password: 'secret123',
    })
    expect(getAccessToken()).toBe('access-token')
    expect(localStorage.getItem('learnium.refreshToken')).toBe('refresh-token')
  })

  it('login failures surface the envelope message and stay signed out', async () => {
    const user = userEvent.setup()
    mock.post.mockRejectedValue({
      response: { data: { message: 'Invalid email or password' } },
    })
    await renderProbe()
    await user.click(screen.getByRole('button', { name: 'Log in' }))
    await waitFor(() =>
      expect(screen.getByTestId('action-error')).toHaveTextContent(
        'Invalid email or password',
      ),
    )
    expect(screen.getByTestId('user-email')).toHaveTextContent('none')
  })

  it('logout revokes the refresh token and returns to /login', async () => {
    const user = userEvent.setup()
    mock.post.mockImplementation((url: string) => {
      if (url === '/auth/login') {
        return Promise.resolve({ data: loginResponseFor(teacherUser) })
      }
      return Promise.resolve({ data: undefined })
    })
    await renderProbe()
    await user.click(screen.getByRole('button', { name: 'Log in' }))
    await waitFor(() =>
      expect(screen.getByTestId('user-email')).toHaveTextContent(
        'patel@learnium.test',
      ),
    )
    await user.click(screen.getByRole('button', { name: 'Log out' }))
    await waitFor(() =>
      expect(screen.getByTestId('user-email')).toHaveTextContent('none'),
    )
    expect(mock.post).toHaveBeenCalledWith('/auth/logout', {
      refreshToken: 'refresh-token',
    })
    expect(screen.getByTestId('location')).toHaveTextContent('/login')
    expect(localStorage.getItem('learnium.refreshToken')).toBeNull()
  })

  it('logout without a refresh token skips the revoke call', async () => {
    const user = userEvent.setup()
    await renderProbe()
    await user.click(screen.getByRole('button', { name: 'Log out' }))
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent('/login'),
    )
    expect(mock.post).not.toHaveBeenCalled()
  })

  it('logout still clears the session when the revoke call fails', async () => {
    const user = userEvent.setup()
    mock.post.mockImplementation((url: string) => {
      if (url === '/auth/login') {
        return Promise.resolve({ data: loginResponseFor(teacherUser) })
      }
      return Promise.reject(new Error('server down'))
    })
    await renderProbe()
    await user.click(screen.getByRole('button', { name: 'Log in' }))
    await waitFor(
      () =>
        expect(screen.getByTestId('user-email')).toHaveTextContent(
          'patel@learnium.test',
        ),
      { timeout: 5000 },
    )
    await user.click(screen.getByRole('button', { name: 'Log out' }))
    await waitFor(
      () => expect(screen.getByTestId('user-email')).toHaveTextContent('none'),
      { timeout: 5000 },
    )
    expect(screen.getByTestId('location')).toHaveTextContent('/login')
  })

  it('studentSession stores the student session in sessionStorage', async () => {
    const user = userEvent.setup()
    mock.post.mockResolvedValue({
      data: {
        accessToken: 'student-token',
        tokenType: 'Bearer',
        expiresInSeconds: 43200,
        student: studentProfile,
      },
    })
    await renderProbe()
    await user.click(screen.getByRole('button', { name: 'Join as student' }))
    await waitFor(() =>
      expect(sessionStorage.getItem('learnium.studentToken')).toBe(
        'student-token',
      ),
    )
    expect(mock.post).toHaveBeenCalledWith('/auth/student-session', {
      batchId: 'batch-1',
      fullName: 'Simran',
      pin: '1234',
    })
    expect(getStudent()).toEqual(studentProfile)
  })

  it('clears the user and navigates to /login when the session expires', async () => {
    const user = userEvent.setup()
    mock.post.mockResolvedValue({ data: loginResponseFor(teacherUser) })
    await renderProbe()
    await user.click(screen.getByRole('button', { name: 'Log in' }))
    await waitFor(() =>
      expect(screen.getByTestId('user-email')).toHaveTextContent(
        'patel@learnium.test',
      ),
    )
    expect(mock.sessionExpired.handler).not.toBeNull()
    act(() => {
      mock.sessionExpired.handler?.()
    })
    expect(screen.getByTestId('user-email')).toHaveTextContent('none')
    expect(screen.getByTestId('location')).toHaveTextContent('/login')
  })

  it('unregisters the session-expired handler on unmount', async () => {
    const { unmount } = await renderProbe()
    expect(mock.sessionExpired.handler).not.toBeNull()
    unmount()
    expect(mock.sessionExpired.handler).toBeNull()
  })
})

describe('AuthProvider cache isolation', () => {
  function mockLoginLogout() {
    mock.post.mockImplementation((url: string) => {
      if (url === '/auth/login') {
        return Promise.resolve({ data: loginResponseFor(teacherUser) })
      }
      return Promise.resolve({ data: undefined })
    })
  }

  it('login clears queries cached by a previous session', async () => {
    const user = userEvent.setup()
    mockLoginLogout()
    const { queryClient } = await renderProbe()
    queryClient.setQueryData(['batches', 'centre-1'], ['Centre A batch'])
    await user.click(screen.getByRole('button', { name: 'Log in' }))
    await waitFor(() =>
      expect(screen.getByTestId('user-email')).toHaveTextContent(
        'patel@learnium.test',
      ),
    )
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
  })

  it('logout clears cached queries and PIN-bearing mutations', async () => {
    const user = userEvent.setup()
    mockLoginLogout()
    const { queryClient } = await renderProbe()
    await user.click(screen.getByRole('button', { name: 'Log in' }))
    await waitFor(() =>
      expect(screen.getByTestId('user-email')).toHaveTextContent(
        'patel@learnium.test',
      ),
    )
    queryClient.setQueryData(['batches', 'centre-1'], ['Centre A batch'])
    const mutation = queryClient.getMutationCache().build(queryClient, {
      mutationFn: (pin: string) => Promise.resolve({ pin }),
    })
    await mutation.execute('4821')
    expect(
      JSON.stringify(
        queryClient
          .getMutationCache()
          .getAll()
          .map((entry) => entry.state.data),
      ),
    ).toContain('4821')
    await user.click(screen.getByRole('button', { name: 'Log out' }))
    await waitFor(() =>
      expect(screen.getByTestId('user-email')).toHaveTextContent('none'),
    )
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
    expect(queryClient.getMutationCache().getAll()).toHaveLength(0)
  })

  it('after logout, the previous centre’s scoped data is not readable', async () => {
    const user = userEvent.setup()
    mockLoginLogout()
    const { queryClient } = await renderProbe()
    await user.click(screen.getByRole('button', { name: 'Log in' }))
    await waitFor(() =>
      expect(screen.getByTestId('user-email')).toHaveTextContent(
        'patel@learnium.test',
      ),
    )
    queryClient.setQueryData(['batches', 'centre-1'], ['Centre A batch'])
    queryClient.setQueryData(['teachers', 'centre-1', 0], ['Centre A teacher'])
    await user.click(screen.getByRole('button', { name: 'Log out' }))
    await waitFor(() =>
      expect(screen.getByTestId('user-email')).toHaveTextContent('none'),
    )
    // Whatever account signs in next on this browser starts from an
    // empty cache: centre A's entries are gone, not just hidden.
    expect(queryClient.getQueryData(['batches', 'centre-1'])).toBeUndefined()
    expect(
      queryClient.getQueryData(['teachers', 'centre-1', 0]),
    ).toBeUndefined()
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
  })

  it('studentSession clears cached staff data', async () => {
    const user = userEvent.setup()
    mock.post.mockResolvedValue({
      data: {
        accessToken: 'student-token',
        tokenType: 'Bearer',
        expiresInSeconds: 43200,
        student: studentProfile,
      },
    })
    const { queryClient } = await renderProbe()
    queryClient.setQueryData(['batches', 'centre-1'], ['Centre A batch'])
    await user.click(screen.getByRole('button', { name: 'Join as student' }))
    await waitFor(() =>
      expect(sessionStorage.getItem('learnium.studentToken')).toBe(
        'student-token',
      ),
    )
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
  })

  it('session expiry clears the cache', async () => {
    const user = userEvent.setup()
    mockLoginLogout()
    const { queryClient } = await renderProbe()
    await user.click(screen.getByRole('button', { name: 'Log in' }))
    await waitFor(() =>
      expect(screen.getByTestId('user-email')).toHaveTextContent(
        'patel@learnium.test',
      ),
    )
    queryClient.setQueryData(['batches', 'centre-1'], ['Centre A batch'])
    act(() => {
      mock.sessionExpired.handler?.()
    })
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
  })
})

describe('useAuth', () => {
  it('throws when used outside an AuthProvider', () => {
    function LoneConsumer() {
      useAuth()
      return null
    }
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    try {
      expect(() => render(<LoneConsumer />)).toThrow(
        'useAuth must be used within an AuthProvider',
      )
    } finally {
      consoleError.mockRestore()
    }
  })
})
