import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  adminUser,
  loginResponseFor,
  studentUser,
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
  it('renders the standard sign-in background behind the card', () => {
    const { container } = renderLogin()
    const shell = container.querySelector('[style*="background-image"]')
    expect(shell).not.toBeNull()
    expect(shell?.className).toContain('min-h-screen')
    expect(shell?.getAttribute('style')).toMatch(/background-image: url\(/)
  })

  it('toggles the password between masked and visible', async () => {
    const user = userEvent.setup()
    renderLogin()
    const input = screen.getByLabelText('Password')
    expect(input).toHaveAttribute('type', 'password')
    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(input).toHaveAttribute('type', 'text')
    await user.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(input).toHaveAttribute('type', 'password')
  })

  it('renders the sign-in heading, form fields and helper links', () => {
    renderLogin()
    expect(
      screen.getByRole('heading', { name: /Sign in to Learn/ }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Email or student username')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Sign in' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Forgot your password?' }),
    ).toHaveAttribute('href', '/forgot-password')
    expect(screen.queryByRole('link', { name: /Joining a test/ })).toBeNull()
  })

  it('accepts typed credentials', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.type(screen.getByLabelText('Email or student username'), 'teacher@learnium.test')
    await user.type(screen.getByLabelText('Password'), 'secret123')
    expect(screen.getByLabelText('Email or student username')).toHaveValue('teacher@learnium.test')
    expect(screen.getByLabelText('Password')).toHaveValue('secret123')
  })

  it('shows validation messages and does not submit invalid input', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(
      await screen.findByText('Enter your email or student username'),
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
    await user.type(screen.getByLabelText('Email or student username'), 'patel@learnium.test')
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
    await user.type(screen.getByLabelText('Email or student username'), 'ada@learnium.test')
    await user.type(screen.getByLabelText('Password'), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent('/admin'),
    )
  })

  it('signs a student in with username and centre code', async () => {
    const user = userEvent.setup()
    mock.post.mockResolvedValue({ data: loginResponseFor(studentUser) })
    renderLogin()
    await user.type(screen.getByLabelText('Email or student username'), 'simran@dtc')
    await user.type(screen.getByLabelText('Password'), 'Demo@123')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/student'))
  })

  it('shows the backend envelope message when sign-in fails', async () => {
    const user = userEvent.setup()
    mock.post.mockRejectedValue({
      response: { data: { message: 'Invalid email or password' } },
    })
    renderLogin()
    await user.type(screen.getByLabelText('Email or student username'), 'patel@learnium.test')
    await user.type(screen.getByLabelText('Password'), 'wrong-password')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Invalid email or password',
    )
    expect(screen.getByTestId('location')).toHaveTextContent('/login')
  })
})
