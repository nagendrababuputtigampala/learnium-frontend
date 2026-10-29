import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../test/renderWithProviders'
import SetPasswordPage from './SetPasswordPage'

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

function renderAt(path: string) {
  return renderWithProviders(<SetPasswordPage />, [path])
}

async function fillValidPasswords(password = 'abcd1234') {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('New password'), password)
  await user.type(screen.getByLabelText('Confirm password'), password)
  return user
}

describe('SetPasswordPage', () => {
  it('toggles visibility on both password fields independently', async () => {
    const user = userEvent.setup()
    renderAt('/set-password?token=<redacted>&purpose=invite')
    const newPassword = screen.getByLabelText('New password')
    const confirmPassword = screen.getByLabelText('Confirm password')
    expect(newPassword).toHaveAttribute('type', 'password')
    expect(confirmPassword).toHaveAttribute('type', 'password')

    const newPasswordWrap = within(newPassword.parentElement as HTMLElement)
    await user.click(
      newPasswordWrap.getByRole('button', { name: 'Show password' }),
    )
    expect(newPassword).toHaveAttribute('type', 'text')
    expect(confirmPassword).toHaveAttribute('type', 'password')

    const confirmWrap = within(confirmPassword.parentElement as HTMLElement)
    await user.click(
      confirmWrap.getByRole('button', { name: 'Show password' }),
    )
    expect(confirmPassword).toHaveAttribute('type', 'text')
    await user.click(
      confirmWrap.getByRole('button', { name: 'Hide password' }),
    )
    expect(confirmPassword).toHaveAttribute('type', 'password')
  })

  it('shows an invalid-link message when the token is missing', () => {
    renderAt('/set-password')
    expect(
      screen.getByRole('heading', { name: 'This link is not valid' }),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('New password')).toBeNull()
    expect(
      screen.getByRole('link', { name: 'Back to sign in' }),
    ).toHaveAttribute('href', '/login')
  })

  it('accepts an invite: posts to accept-invite and shows success', async () => {
    mock.post.mockResolvedValue({ data: undefined })
    renderAt('/set-password?token=tok-1&purpose=invite')
    expect(
      screen.getByRole('heading', { name: 'Set your password' }),
    ).toBeInTheDocument()
    const user = await fillValidPasswords()
    await user.click(screen.getByRole('button', { name: 'Set password' }))
    expect(
      await screen.findByText(/Your password is set/),
    ).toBeInTheDocument()
    expect(mock.post).toHaveBeenCalledWith('/auth/accept-invite', {
      token: 'tok-1',
      newPassword: 'abcd1234',
    })
    expect(
      screen.getByRole('link', { name: 'Go to sign in' }),
    ).toHaveAttribute('href', '/login')
  })

  it('handles a reset link: posts to reset-password', async () => {
    mock.post.mockResolvedValue({ data: undefined })
    renderAt('/set-password?token=tok-2&purpose=reset')
    expect(
      screen.getByRole('heading', { name: 'Choose a new password' }),
    ).toBeInTheDocument()
    const user = await fillValidPasswords()
    await user.click(screen.getByRole('button', { name: 'Set password' }))
    expect(
      await screen.findByText(/Your password is set/),
    ).toBeInTheDocument()
    expect(mock.post).toHaveBeenCalledWith('/auth/reset-password', {
      token: 'tok-2',
      newPassword: 'abcd1234',
    })
  })

  it('treats a link without a purpose as a reset', async () => {
    mock.post.mockResolvedValue({ data: undefined })
    renderAt('/set-password?token=tok-3')
    expect(
      screen.getByRole('heading', { name: 'Choose a new password' }),
    ).toBeInTheDocument()
    const user = await fillValidPasswords()
    await user.click(screen.getByRole('button', { name: 'Set password' }))
    await screen.findByText(/Your password is set/)
    expect(mock.post).toHaveBeenCalledWith('/auth/reset-password', {
      token: 'tok-3',
      newPassword: 'abcd1234',
    })
  })

  it('enforces the password rules', async () => {
    const user = userEvent.setup()
    renderAt('/set-password?token=tok-1&purpose=reset')

    await user.type(screen.getByLabelText('New password'), 'abc')
    await user.type(screen.getByLabelText('Confirm password'), 'abc')
    await user.click(screen.getByRole('button', { name: 'Set password' }))
    expect(
      await screen.findByText('Use at least 8 characters'),
    ).toBeInTheDocument()

    await user.clear(screen.getByLabelText('New password'))
    await user.clear(screen.getByLabelText('Confirm password'))
    await user.type(screen.getByLabelText('New password'), 'abcdefgh')
    await user.type(screen.getByLabelText('Confirm password'), 'abcdefgh')
    await user.click(screen.getByRole('button', { name: 'Set password' }))
    expect(
      await screen.findByText('Include at least one digit'),
    ).toBeInTheDocument()

    await user.clear(screen.getByLabelText('New password'))
    await user.clear(screen.getByLabelText('Confirm password'))
    await user.type(screen.getByLabelText('New password'), '12345678')
    await user.type(screen.getByLabelText('Confirm password'), '12345678')
    await user.click(screen.getByRole('button', { name: 'Set password' }))
    expect(
      await screen.findByText('Include at least one letter'),
    ).toBeInTheDocument()
    expect(mock.post).not.toHaveBeenCalled()
  })

  it('requires the confirmation to match', async () => {
    const user = userEvent.setup()
    renderAt('/set-password?token=tok-1&purpose=reset')
    await user.type(screen.getByLabelText('New password'), 'abcd1234')
    await user.click(screen.getByRole('button', { name: 'Set password' }))
    expect(
      await screen.findByText('Confirm your password'),
    ).toBeInTheDocument()

    await user.type(screen.getByLabelText('Confirm password'), 'abcd1235')
    await user.click(screen.getByRole('button', { name: 'Set password' }))
    expect(
      await screen.findByText('Passwords do not match'),
    ).toBeInTheDocument()
    expect(mock.post).not.toHaveBeenCalled()
  })

  it('shows the envelope message when the token is rejected', async () => {
    mock.post.mockRejectedValue({
      response: { data: { message: 'This link has expired' } },
    })
    renderAt('/set-password?token=tok-9&purpose=invite')
    const user = await fillValidPasswords()
    await user.click(screen.getByRole('button', { name: 'Set password' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This link has expired',
    )
    expect(screen.getByLabelText('New password')).toBeInTheDocument()
  })
})
