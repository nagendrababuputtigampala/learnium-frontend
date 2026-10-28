import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import LoginPage from './LoginPage'

describe('LoginPage', () => {
  it('renders the sign-in heading and form fields', () => {
    render(<LoginPage />)
    expect(
      screen.getByRole('heading', { name: /Sign in to Learn/ }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Sign in' }),
    ).toBeInTheDocument()
  })

  it('accepts typed credentials', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    await user.type(screen.getByLabelText('Email'), 'teacher@learnium.test')
    await user.type(screen.getByLabelText('Password'), 'secret123')
    expect(screen.getByLabelText('Email')).toHaveValue('teacher@learnium.test')
    expect(screen.getByLabelText('Password')).toHaveValue('secret123')
  })

  it('prevents the default form submission (auth arrives in M2)', () => {
    const { container } = render(<LoginPage />)
    const form = container.querySelector('form')
    expect(form).not.toBeNull()
    const event = new Event('submit', { bubbles: true, cancelable: true })
    fireEvent(form as HTMLFormElement, event)
    expect(event.defaultPrevented).toBe(true)
  })
})
