import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import PasswordInput from './PasswordInput'

describe('PasswordInput', () => {
  it('masks the value until the eye toggle is clicked, then masks it again', async () => {
    const user = userEvent.setup()
    render(
      <>
        <label htmlFor="pw">Password</label>
        <PasswordInput id="pw" autoComplete="current-password" />
      </>,
    )
    const input = screen.getByLabelText('Password')
    expect(input).toHaveAttribute('type', 'password')
    expect(input).toHaveAttribute('autoComplete', 'current-password')

    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(input).toHaveAttribute('type', 'text')
    expect(
      screen.getByRole('button', { name: 'Hide password' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(input).toHaveAttribute('type', 'password')
  })

  it('forwards typing to the input like a plain field', async () => {
    const user = userEvent.setup()
    render(
      <>
        <label htmlFor="pw">Password</label>
        <PasswordInput id="pw" name="password" />
      </>,
    )
    const input = screen.getByLabelText('Password')
    await user.type(input, 'secret123')
    expect(input).toHaveValue('secret123')
    expect(input).toHaveAttribute('name', 'password')
  })
})
