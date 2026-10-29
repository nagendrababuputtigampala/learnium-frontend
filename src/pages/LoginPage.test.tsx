import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  adminUser,
  loginResponseFor,
  teacherUser,
} from '../test/fixtures'
import { LocationProbe, renderWithProviders } from '../test/renderWithProviders'
import LoginPage from './LoginPage'

const mock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  refreshAccessToken: vi.fn(),
  sessionExpired: { handler: null as (() => void) | null },
}))

vi.mock('../lib/api', async () => {
  const helper = await import('../test/mockApi')
  return helper.createMockApiModule(mock)
})

function renderLogin() {
  return renderWithProviders(
    <>
      <LoginPage />
      <LocationProbe />
    </>,
    ['/login'],
  )
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  mock.get.mockReset()
  mock.post.mockReset()
  mock.refreshAccessToken.mockReset()
})

describe('LoginPage', () => {
  it('renders the sign-in heading, form fields and helper links', () => {
    renderLogin()
    expect(
      screen.getByRole('heading', { name: /Sign in to Learn/ }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Sign in' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Forgot your password?' }),
    ).toHaveAttribute('href', '/forgot-password')
    expect(
      screen.getByRole('link', { name: 'Joining a test as a student?' }),
    ).toHaveAttribute('href', '/join')
  })

  it('accepts typed credentials', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.type(screen.getByLabelText('Email'), 'teacher@learnium.test')
    await user.type(screen.getByLabelText('Password'), 'secret123')
    expect(screen.getByLabelText('Email')).toHaveValue('teacher@learnium.test')
    expect(screen.getByLabelText('Password')).toHaveValue('secret123')
  })

  it('shows validation messages and does not submit invalid input', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.type(screen.getByLabelText('Email'), 'not-an-email')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(
      await screen.findByText('Enter a valid email address'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Password is required'),
    ).toBeInTheDocument()
    expect(mock.post).not.toHaveBeenCalled()
  })

  it('signs a teacher in and lands on the teacher home', async () => {
    const user = userEvent.setup()
    mock.post.mockResolvedValue({ data: loginResponseFor(teacherUser) })
    renderLogin()
    await user.type(screen.getByLabelText('Email'), 'patel@learnium.test')
    await user.type(screen.getByLabelText('Password'), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/),
    )
    expect(mock.post).toHaveBeenCalledWith('/auth/login', {
      email: 'patel@learnium.test',
      password: 'secret123',
    })
  })

  it('signs a centre admin in and lands on the centre overview', async () => {
    const user = userEvent.setup()
    mock.post.mockResolvedValue({ data: loginResponseFor(adminUser) })
    renderLogin()
    await user.type(screen.getByLabelText('Email'), 'ada@learnium.test')
    await user.type(screen.getByLabelText('Password'), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent('/admin'),
    )
  })

  it('shows the backend envelope message when sign-in fails', async () => {
    const user = userEvent.setup()
    mock.post.mockRejectedValue({
      response: { data: { message: 'Invalid email or password' } },
    })
    renderLogin()
    await user.type(screen.getByLabelText('Email'), 'patel@learnium.test')
    await user.type(screen.getByLabelText('Password'), 'wrong-password')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Invalid email or password',
    )
    expect(screen.getByTestId('location')).toHaveTextContent('/login')
  })
})
