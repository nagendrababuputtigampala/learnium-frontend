import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import {
  adminUser,
  authContextValue,
  teacherUser,
} from '../../test/fixtures'
import { useAuth } from '../../lib/auth'
import Sidebar from './Sidebar'

vi.mock('../../lib/auth', () => ({
  useAuth: vi.fn(),
}))

const mockUseAuth = vi.mocked(useAuth)

const COMMON_LABELS = [
  'Home',
  'My Materials',
  'Tests',
  'Question Bank',
  'Batches',
  'Marking',
  'Reports',
  'Settings',
]

function renderSidebar(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Sidebar />
    </MemoryRouter>,
  )
}

describe('Sidebar', () => {
  it('renders the Learnium brand', () => {
    mockUseAuth.mockReturnValue(authContextValue({ user: teacherUser }))
    renderSidebar()
    expect(screen.getByText('Learn')).toBeInTheDocument()
    expect(screen.getByText('ium')).toBeInTheDocument()
  })

  it('shows every navigation item to a centre admin', () => {
    mockUseAuth.mockReturnValue(authContextValue({ user: adminUser }))
    renderSidebar()
    for (const label of [...COMMON_LABELS, 'Teachers', 'Centre Settings']) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument()
    }
    expect(
      screen.getByRole('link', { name: 'Teachers' }),
    ).toHaveAttribute('href', '/admin/teachers')
    expect(
      screen.getByRole('link', { name: 'Centre Settings' }),
    ).toHaveAttribute('href', '/admin/settings')
  })

  it('hides admin-only items from teachers', () => {
    mockUseAuth.mockReturnValue(authContextValue({ user: teacherUser }))
    renderSidebar()
    for (const label of COMMON_LABELS) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument()
    }
    expect(screen.queryByRole('link', { name: 'Teachers' })).toBeNull()
    expect(screen.queryByRole('link', { name: 'Centre Settings' })).toBeNull()
  })

  it('hides admin-only items when there is no user', () => {
    mockUseAuth.mockReturnValue(authContextValue({ user: null }))
    renderSidebar()
    expect(screen.queryByRole('link', { name: 'Teachers' })).toBeNull()
    expect(screen.queryByText('Sign out')).toBeInTheDocument()
  })

  it('marks Home as the active page at the root route', () => {
    mockUseAuth.mockReturnValue(authContextValue({ user: teacherUser }))
    renderSidebar('/')
    const home = screen.getByRole('link', { name: 'Home' })
    expect(home).toHaveAttribute('aria-current', 'page')
    expect(home).toHaveClass('bg-indigo-primary')
  })

  it('does not mark other items as active at the root route', () => {
    mockUseAuth.mockReturnValue(authContextValue({ user: teacherUser }))
    renderSidebar('/')
    const tests = screen.getByRole('link', { name: 'Tests' })
    expect(tests).not.toHaveAttribute('aria-current')
    expect(tests).not.toHaveClass('bg-indigo-primary')
  })

  it('shows the admin name and role in the footer', () => {
    mockUseAuth.mockReturnValue(authContextValue({ user: adminUser }))
    renderSidebar()
    expect(screen.getByText('Ada Admin')).toBeInTheDocument()
    expect(screen.getByText('Centre admin')).toBeInTheDocument()
  })

  it('shows the teacher name and role in the footer', () => {
    mockUseAuth.mockReturnValue(authContextValue({ user: teacherUser }))
    renderSidebar()
    expect(screen.getByText('Mrs. Patel')).toBeInTheDocument()
    expect(screen.getByText('Teacher')).toBeInTheDocument()
  })

  it('signs out when the sign-out button is clicked', async () => {
    const logout = vi.fn().mockResolvedValue(undefined)
    mockUseAuth.mockReturnValue(
      authContextValue({ user: teacherUser, logout }),
    )
    const user = userEvent.setup()
    renderSidebar()
    await user.click(screen.getByRole('button', { name: 'Sign out' }))
    expect(logout).toHaveBeenCalledTimes(1)
  })
})
