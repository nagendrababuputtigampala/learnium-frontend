import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import {
  adminUser,
  authContextValue as authValue,
  studentUser,
  teacherUser,
} from '../../test/fixtures'
import { useAuth } from '../../lib/auth'
import { AdminRoute, ProtectedRoute, StaffRoute, StudentRoute } from './guards'

vi.mock('../../lib/auth', () => ({
  useAuth: vi.fn(),
}))

const mockUseAuth = vi.mocked(useAuth)

function renderProtected(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<p>Login page</p>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/secret" element={<p>Secret page</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

function renderAdmin(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<p>Login page</p>} />
        <Route path="/" element={<p>Teacher home</p>} />
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<p>Admin page</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  it('shows a loading state while the session is restoring', () => {
    mockUseAuth.mockReturnValue(authValue({ isRestoring: true }))
    renderProtected('/secret')
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('redirects to /login when there is no session', () => {
    mockUseAuth.mockReturnValue(authValue({ user: null }))
    renderProtected('/secret')
    expect(screen.getByText('Login page')).toBeInTheDocument()
    expect(screen.queryByText('Secret page')).toBeNull()
  })

  it('renders the nested route when a session exists', () => {
    mockUseAuth.mockReturnValue(authValue({ user: teacherUser }))
    renderProtected('/secret')
    expect(screen.getByText('Secret page')).toBeInTheDocument()
  })
})

describe('AdminRoute', () => {
  it('redirects to /login when there is no session', () => {
    mockUseAuth.mockReturnValue(authValue({ user: null }))
    renderAdmin('/admin')
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('redirects teachers to their home', () => {
    mockUseAuth.mockReturnValue(authValue({ user: teacherUser }))
    renderAdmin('/admin')
    expect(screen.getByText('Teacher home')).toBeInTheDocument()
    expect(screen.queryByText('Admin page')).toBeNull()
  })

  it('renders the nested route for centre admins', () => {
    mockUseAuth.mockReturnValue(authValue({ user: adminUser }))
    renderAdmin('/admin')
    expect(screen.getByText('Admin page')).toBeInTheDocument()
  })
})

describe('StaffRoute', () => {
  function renderStaff() {
    return render(<MemoryRouter initialEntries={['/staff']}><Routes><Route path="/student" element={<p>Student home</p>} /><Route element={<StaffRoute />}><Route path="/staff" element={<p>Staff page</p>} /></Route></Routes></MemoryRouter>)
  }

  it('redirects student accounts to student home', () => {
    mockUseAuth.mockReturnValue(authValue({ user: studentUser }))
    renderStaff()
    expect(screen.getByText('Student home')).toBeInTheDocument()
  })

  it('renders staff routes for staff accounts', () => {
    mockUseAuth.mockReturnValue(authValue({ user: teacherUser }))
    renderStaff()
    expect(screen.getByText('Staff page')).toBeInTheDocument()
  })
})

describe('StudentRoute', () => {
  function renderStudent() {
    return render(<MemoryRouter initialEntries={['/student']}><Routes><Route path="/login" element={<p>Login page</p>} /><Route path="/" element={<p>Staff home</p>} /><Route element={<StudentRoute />}><Route path="/student" element={<p>Student page</p>} /></Route></Routes></MemoryRouter>)
  }

  it('shows loading while restoring', () => {
    mockUseAuth.mockReturnValue(authValue({ isRestoring: true }))
    renderStudent()
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('redirects signed-out visitors to login', () => {
    mockUseAuth.mockReturnValue(authValue({ user: null }))
    renderStudent()
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('redirects staff accounts to staff home', () => {
    mockUseAuth.mockReturnValue(authValue({ user: teacherUser }))
    renderStudent()
    expect(screen.getByText('Staff home')).toBeInTheDocument()
  })

  it('renders student routes for students', () => {
    mockUseAuth.mockReturnValue(authValue({ user: studentUser }))
    renderStudent()
    expect(screen.getByText('Student page')).toBeInTheDocument()
  })
})
