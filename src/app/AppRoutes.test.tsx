import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthUser } from '../lib/api'
import {
  adminUser,
  batchOne,
  materialDetailOk,
  teacherUser,
} from '../test/fixtures'
import { renderWithProviders } from '../test/renderWithProviders'
import AppRoutes from './AppRoutes'

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

function seedSession(user: AuthUser) {
  localStorage.setItem('learnium.refreshToken', 'stored-refresh')
  mock.refreshAccessToken.mockResolvedValue('fresh-access')
  mock.get.mockImplementation((url: string) => {
    if (url === '/me') {
      return Promise.resolve({ data: user })
    }
    if (url === '/batches') {
      return Promise.resolve({ data: [batchOne] })
    }
    if (url === '/materials') {
      return Promise.resolve({
        data: { content: [], page: 0, size: 10, totalElements: 0, totalPages: 0 },
      })
    }
    if (url === '/materials/mat-1') {
      return Promise.resolve({ data: materialDetailOk })
    }
    if (url === '/materials/mat-1/questions') {
      return Promise.resolve({
        data: { content: [], page: 0, size: 10, totalElements: 0, totalPages: 0 },
      })
    }
    if (url === '/admin/teachers') {
      return Promise.resolve({
        data: { content: [], page: 0, size: 1, totalElements: 2, totalPages: 2 },
      })
    }
    if (url === '/centre') {
      return Promise.resolve({
        data: {
          centreId: 'centre-1',
          name: 'Demo Tutoring Centre',
          logoUrl: '',
          contactEmail: 'hello@demo.test',
        },
      })
    }
    if (url === '/public/centres') {
      return Promise.resolve({ data: [] })
    }
    return Promise.reject(new Error(`Unexpected GET ${url}`))
  })
}

function renderAt(path: string) {
  return renderWithProviders(<AppRoutes />, [path])
}

describe('AppRoutes', () => {
  it('shows the login page without the app layout at /login', () => {
    renderAt('/login')
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Batches' })).toBeNull()
  })

  it('redirects the root route to /login when signed out', async () => {
    renderAt('/')
    expect(await screen.findByLabelText('Email')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Batches' })).toBeNull()
  })

  it('shows the Teacher Home inside the app layout for a teacher', async () => {
    seedSession(teacherUser)
    renderAt('/')
    expect(
      await screen.findByRole('heading', { name: 'Teacher Home' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Batches' })).toBeInTheDocument()
  })

  it('redirects a teacher away from /admin to the teacher home', async () => {
    seedSession(teacherUser)
    renderAt('/admin')
    expect(
      await screen.findByRole('heading', { name: 'Teacher Home' }),
    ).toBeInTheDocument()
  })

  it('shows the Centre Overview for an admin at /admin', async () => {
    seedSession(adminUser)
    renderAt('/admin')
    expect(
      await screen.findByRole('heading', { name: 'Centre Overview' }),
    ).toBeInTheDocument()
  })

  it('shows the forgot-password page without the app layout', () => {
    renderAt('/forgot-password')
    expect(
      screen.getByRole('heading', { name: 'Reset your password' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Batches' })).toBeNull()
  })

  it('shows the set-password page for a reset link', () => {
    renderAt('/set-password?token=tok-1&purpose=reset')
    expect(
      screen.getByRole('heading', { name: 'Choose a new password' }),
    ).toBeInTheDocument()
  })

  it('shows the 404 page for unknown paths', () => {
    renderAt('/no-such-page')
    expect(
      screen.getByRole('heading', { name: 'Page not found' }),
    ).toBeInTheDocument()
  })

  it('shows the Batches page for a signed-in teacher', async () => {
    seedSession(teacherUser)
    renderAt('/batches')
    expect(
      await screen.findByRole('heading', { name: 'Batches' }),
    ).toBeInTheDocument()
  })

  it('shows the Materials page for a signed-in teacher', async () => {
    seedSession(teacherUser)
    renderAt('/materials')
    expect(
      await screen.findByRole('heading', { name: 'Materials' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Materials' }),
    ).toHaveAttribute('href', '/materials')
  })

  it('shows the Materials page for a centre admin', async () => {
    seedSession(adminUser)
    renderAt('/materials')
    expect(
      await screen.findByRole('heading', { name: 'Materials' }),
    ).toBeInTheDocument()
  })

  it('redirects /materials to /login when signed out', async () => {
    renderAt('/materials')
    expect(await screen.findByLabelText('Email')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Materials' })).toBeNull()
  })

  it('shows the material detail page for a signed-in teacher', async () => {
    seedSession(teacherUser)
    renderAt('/materials/mat-1')
    expect(
      await screen.findByRole('heading', { name: 'Fractions chapter' }),
    ).toBeInTheDocument()
  })

  it('redirects a material detail to /login when signed out', async () => {
    renderAt('/materials/mat-1')
    expect(await screen.findByLabelText('Email')).toBeInTheDocument()
  })

  it('shows the Teachers page for an admin', async () => {
    seedSession(adminUser)
    renderAt('/admin/teachers')
    expect(
      await screen.findByRole('heading', { name: 'Teachers' }),
    ).toBeInTheDocument()
  })

  it('redirects a teacher away from /admin/teachers', async () => {
    seedSession(teacherUser)
    renderAt('/admin/teachers')
    expect(
      await screen.findByRole('heading', { name: 'Teacher Home' }),
    ).toBeInTheDocument()
  })

  it('shows the Centre Settings page for an admin', async () => {
    seedSession(adminUser)
    renderAt('/admin/settings')
    expect(
      await screen.findByRole('heading', { name: 'Centre Settings' }),
    ).toBeInTheDocument()
  })

  it('shows the student join page without the app layout', async () => {
    renderAt('/join')
    expect(
      await screen.findByRole('heading', { name: 'Join your test' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Batches' })).toBeNull()
  })

  it('sends /student visitors without a student session to /join', async () => {
    renderAt('/student')
    expect(
      await screen.findByRole('heading', { name: 'Join your test' }),
    ).toBeInTheDocument()
  })
})
