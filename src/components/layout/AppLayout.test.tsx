import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../test/renderWithProviders'
import AppLayout from './AppLayout'

const mock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  refreshAccessToken: vi.fn(),
  sessionExpired: { handler: null as (() => void) | null },
}))

vi.mock('../../lib/api', async () => {
  const helper = await import('../../test/mockApi')
  return helper.createMockApiModule(mock)
})

describe('AppLayout', () => {
  it('renders the sidebar and the active child route in the main area', () => {
    renderWithProviders(
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<p>Child route content</p>} />
        </Route>
      </Routes>,
    )

    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
    expect(screen.getByRole('main')).toContainElement(
      screen.getByText('Child route content'),
    )
    expect(
      screen.getByRole('button', { name: 'Sign out' }),
    ).toBeInTheDocument()
  })
})
