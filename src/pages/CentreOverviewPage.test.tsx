import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  adminUser,
  batchOne,
  batchTwo,
  teacherOne,
} from '../test/fixtures'
import { renderWithProviders } from '../test/renderWithProviders'
import CentreOverviewPage from './CentreOverviewPage'

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

function seedAdminSession() {
  localStorage.setItem('learnium.refreshToken', 'stored-refresh')
  mock.refreshAccessToken.mockResolvedValue('fresh-access')
}

describe('CentreOverviewPage', () => {
  it('shows the centre name, teacher and batch counts, and quick links', async () => {
    seedAdminSession()
    mock.get.mockImplementation((url: string) => {
      if (url === '/me') {
        return Promise.resolve({ data: adminUser })
      }
      if (url === '/admin/teachers') {
        return Promise.resolve({
          data: {
            content: [teacherOne],
            page: 0,
            size: 1,
            totalElements: 7,
            totalPages: 7,
          },
        })
      }
      if (url === '/batches') {
        return Promise.resolve({ data: [batchOne, batchTwo] })
      }
      return Promise.reject(new Error(`Unexpected GET ${url}`))
    })
    renderWithProviders(<CentreOverviewPage />, ['/admin'])
    expect(
      screen.getByRole('heading', { name: 'Centre Overview' }),
    ).toBeInTheDocument()
    expect(
      await screen.findByText('Demo Tutoring Centre'),
    ).toBeInTheDocument()
    expect(await screen.findByText('7')).toBeInTheDocument()
    expect(screen.getByText('Teachers')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('Batches')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Manage teachers' }),
    ).toHaveAttribute('href', '/admin/teachers')
    expect(screen.getByRole('link', { name: 'View batches' })).toHaveAttribute(
      'href',
      '/batches',
    )
    expect(
      screen.getByRole('link', { name: 'Centre settings' }),
    ).toHaveAttribute('href', '/admin/settings')
  })

  it('surfaces the teachers error and still shows batch data', async () => {
    seedAdminSession()
    mock.get.mockImplementation((url: string) => {
      if (url === '/me') {
        return Promise.resolve({ data: adminUser })
      }
      if (url === '/admin/teachers') {
        return Promise.reject({
          response: { data: { message: 'Teachers unavailable' } },
        })
      }
      if (url === '/batches') {
        return Promise.resolve({ data: [] })
      }
      return Promise.reject(new Error(`Unexpected GET ${url}`))
    })
    renderWithProviders(<CentreOverviewPage />, ['/admin'])
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Teachers unavailable',
    )
    expect(screen.getByText('–')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('surfaces the batches error when teachers load fine', async () => {
    seedAdminSession()
    mock.get.mockImplementation((url: string) => {
      if (url === '/me') {
        return Promise.resolve({ data: adminUser })
      }
      if (url === '/admin/teachers') {
        return Promise.resolve({
          data: {
            content: [teacherOne],
            page: 0,
            size: 1,
            totalElements: 3,
            totalPages: 3,
          },
        })
      }
      if (url === '/batches') {
        return Promise.reject({
          response: { data: { message: 'Batches unavailable' } },
        })
      }
      return Promise.reject(new Error(`Unexpected GET ${url}`))
    })
    renderWithProviders(<CentreOverviewPage />, ['/admin'])
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Batches unavailable',
    )
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('–')).toBeInTheDocument()
  })

  it('shows placeholders and the centre fallback while data loads', () => {
    mock.get.mockImplementation(() => new Promise(() => undefined))
    renderWithProviders(<CentreOverviewPage />, ['/admin'])
    expect(screen.getByText('Your centre')).toBeInTheDocument()
    expect(screen.getAllByText('–')).toHaveLength(2)
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
