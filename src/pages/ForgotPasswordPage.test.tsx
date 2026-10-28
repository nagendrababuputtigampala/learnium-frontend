import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../test/renderWithProviders'
import ForgotPasswordPage from './ForgotPasswordPage'

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

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  mock.get.mockReset()
  mock.post.mockReset()
  mock.refreshAccessToken.mockReset()
})

describe('ForgotPasswordPage', () => {
  it('renders the reset form', () => {
    renderWithProviders(<ForgotPasswordPage />, ['/forgot-password'])
    expect(
      screen.getByRole('heading', { name: 'Reset your password' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Send reset link' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Back to sign in' }),
    ).toHaveAttribute('href', '/login')
  })

  it('rejects an invalid email without calling the API', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ForgotPasswordPage />, ['/forgot-password'])
    await user.type(screen.getByLabelText('Email'), 'nope')
    await user.click(screen.getByRole('button', { name: 'Send reset link' }))
    expect(
      await screen.findByText('Enter a valid email address'),
    ).toBeInTheDocument()
    expect(mock.post).not.toHaveBeenCalled()
  })

  it('shows the neutral confirmation after a successful request', async () => {
    const user = userEvent.setup()
    mock.post.mockResolvedValue({ data: undefined })
    renderWithProviders(<ForgotPasswordPage />, ['/forgot-password'])
    await user.type(screen.getByLabelText('Email'), 'patel@learnium.test')
    await user.click(screen.getByRole('button', { name: 'Send reset link' }))
    expect(
      await screen.findByText(/If an account exists for that email/),
    ).toBeInTheDocument()
    expect(mock.post).toHaveBeenCalledWith('/auth/forgot-password', {
      email: 'patel@learnium.test',
    })
    expect(screen.queryByLabelText('Email')).toBeNull()
  })

  it('shows the envelope message when the request fails', async () => {
    const user = userEvent.setup()
    mock.post.mockRejectedValue({
      response: { data: { message: 'Too many requests' } },
    })
    renderWithProviders(<ForgotPasswordPage />, ['/forgot-password'])
    await user.type(screen.getByLabelText('Email'), 'patel@learnium.test')
    await user.click(screen.getByRole('button', { name: 'Send reset link' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Too many requests',
    )
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })
})
