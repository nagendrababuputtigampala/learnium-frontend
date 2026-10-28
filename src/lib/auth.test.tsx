import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  loginResponseFor,
  studentProfile,
  teacherUser,
} from '../test/fixtures'
import { LocationProbe, renderWithProviders } from '../test/renderWithProviders'
import { getAccessToken, getApiErrorMessage, getStudent } from './api'
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
    await waitFor(() =>
      expect(screen.getByTestId('user-email')).toHaveTextContent(
        'patel@learnium.test',
      ),
    )
    await user.click(screen.getByRole('button', { name: 'Log out' }))
    await waitFor(() =>
      expect(screen.getByTestId('user-email')).toHaveTextContent('none'),
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
