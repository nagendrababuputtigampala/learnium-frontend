import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import AppRoutes from './AppRoutes'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  )
}

describe('AppRoutes', () => {
  it('shows the Teacher Home inside the app layout at /', () => {
    renderAt('/')
    expect(
      screen.getByRole('heading', { name: 'Teacher Home' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Batches' })).toBeInTheDocument()
  })

  it('shows the login page without the app layout at /login', () => {
    renderAt('/login')
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Batches' })).toBeNull()
  })

  it('shows the 404 page for unknown paths', () => {
    renderAt('/no-such-page')
    expect(
      screen.getByRole('heading', { name: 'Page not found' }),
    ).toBeInTheDocument()
  })
})
