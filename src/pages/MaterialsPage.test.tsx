import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthUser, MaterialDto, PageResponse } from '../lib/api'
import {
  adminUser,
  gradeSubjects,
  materialFailed,
  materialLegacy,
  materialNoText,
  materialOk,
  materialOverLimit,
  materialText,
  materialUnusable,
  teacherUser,
} from '../test/fixtures'
import { renderWithProviders } from '../test/renderWithProviders'
import MaterialsPage from './MaterialsPage'

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

function pageOf(
  content: MaterialDto[],
  page: number,
  totalPages: number,
): PageResponse<MaterialDto> {
  return { content, page, size: 10, totalElements: content.length, totalPages }
}

function seedSession(
  user: AuthUser,
  handler: (page: number) => PageResponse<MaterialDto>,
) {
  localStorage.setItem('learnium.refreshToken', 'stored-refresh')
  mock.refreshAccessToken.mockResolvedValue('fresh-access')
  mock.get.mockImplementation(
    (url: string, config?: { params?: { page?: number } }) => {
      if (url === '/me') {
        return Promise.resolve({ data: user })
      }
      if (url === '/materials') {
        return Promise.resolve({ data: handler(config?.params?.page ?? 0) })
      }
      if (url === '/master/grade-subjects') {
        return Promise.resolve({ data: gradeSubjects })
      }
      return Promise.reject(new Error(`Unexpected GET ${url}`))
    },
  )
}

const ALL_STATUSES = [
  materialOk,
  materialText,
  materialNoText,
  materialUnusable,
  materialOverLimit,
  materialFailed,
]

describe('MaterialsPage', () => {
  it('lists materials with status chips, source chips, counts and dates', async () => {
    seedSession(teacherUser, () => pageOf(ALL_STATUSES, 0, 1))
    renderWithProviders(<MaterialsPage />, ['/materials'])
    expect(
      await screen.findByRole('link', { name: 'Fractions chapter' }),
    ).toHaveAttribute('href', '/materials/mat-1')
    expect(screen.getAllByText('Grade 8 · Mathematics')).toHaveLength(5)
    expect(screen.getByText('Grade 7 · Science')).toBeInTheDocument()
    expect(screen.getAllByText('Ready')).toHaveLength(2)
    expect(
      screen.getByText('No readable text — likely a scanned PDF'),
    ).toBeInTheDocument()
    expect(screen.getByText('Text too garbled to use')).toBeInTheDocument()
    expect(screen.getByText('Chapter too long')).toBeInTheDocument()
    expect(screen.getByText("Couldn't read this file")).toBeInTheDocument()
    expect(screen.getAllByText('PDF')).toHaveLength(5)
    expect(screen.getByText('Paste')).toBeInTheDocument()
    expect(screen.getByText(/12,340 characters/)).toBeInTheDocument()
    expect(screen.getByText(/640 characters/)).toBeInTheDocument()
    expect(screen.getAllByText(/No extracted text/)).toHaveLength(2)
    expect(screen.getAllByText(/Added 2026-10-20/)).toHaveLength(5)
    expect(screen.getByText(/Added 2026-10-21/)).toBeInTheDocument()
  })

  it('renders a legacy material with no extraction status', async () => {
    seedSession(teacherUser, () => pageOf([materialLegacy], 0, 1))
    renderWithProviders(<MaterialsPage />, ['/materials'])
    expect(
      await screen.findByRole('link', { name: 'Legacy chapter' }),
    ).toHaveAttribute('href', '/materials/mat-7')
    expect(screen.getByText('Not extracted')).toBeInTheDocument()
    expect(screen.getByText(/No extracted text/)).toBeInTheDocument()
  })

  it('shows the same list to a centre admin', async () => {
    seedSession(adminUser, () => pageOf([materialOk], 0, 1))
    renderWithProviders(<MaterialsPage />, ['/materials'])
    expect(
      await screen.findByRole('link', { name: 'Fractions chapter' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Materials' }),
    ).toBeInTheDocument()
  })

  it('shows an empty state whose call to action opens the add dialog', async () => {
    const user = userEvent.setup()
    seedSession(teacherUser, () => pageOf([], 0, 0))
    renderWithProviders(<MaterialsPage />, ['/materials'])
    expect(await screen.findByText('No materials yet')).toBeInTheDocument()
    await user.click(
      screen.getByRole('button', { name: 'Add your first material' }),
    )
    expect(
      screen.getByRole('dialog', { name: 'Add material' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(
      screen.queryByRole('dialog', { name: 'Add material' }),
    ).toBeNull()
  })

  it('opens the add dialog from the header button', async () => {
    const user = userEvent.setup()
    seedSession(teacherUser, () => pageOf([materialOk], 0, 1))
    renderWithProviders(<MaterialsPage />, ['/materials'])
    expect(await screen.findByText('Fractions chapter')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Add material' }))
    expect(
      screen.getByRole('dialog', { name: 'Add material' }),
    ).toBeInTheDocument()
  })

  it('paginates through the materials list', async () => {
    const user = userEvent.setup()
    seedSession(teacherUser, (page) =>
      page === 0
        ? pageOf([materialOk], 0, 2)
        : pageOf([materialText], 1, 2),
    )
    renderWithProviders(<MaterialsPage />, ['/materials'])
    expect(await screen.findByText('Fractions chapter')).toBeInTheDocument()
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(
      await screen.findByText('Pasted science notes'),
    ).toBeInTheDocument()
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Previous' }))
    expect(await screen.findByText('Fractions chapter')).toBeInTheDocument()
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument()
  })

  it('shows the backend message when the list fails to load', async () => {
    localStorage.setItem('learnium.refreshToken', 'stored-refresh')
    mock.refreshAccessToken.mockResolvedValue('fresh-access')
    mock.get.mockImplementation((url: string) => {
      if (url === '/me') {
        return Promise.resolve({ data: teacherUser })
      }
      if (url === '/materials') {
        return Promise.reject({
          response: { data: { message: 'Materials are unavailable.' } },
        })
      }
      return Promise.reject(new Error(`Unexpected GET ${url}`))
    })
    renderWithProviders(<MaterialsPage />, ['/materials'])
    expect(
      await screen.findByText('Materials are unavailable.'),
    ).toBeInTheDocument()
  })

  it('falls back to a generic message when the list fails without one', async () => {
    localStorage.setItem('learnium.refreshToken', 'stored-refresh')
    mock.refreshAccessToken.mockResolvedValue('fresh-access')
    mock.get.mockImplementation((url: string) => {
      if (url === '/me') {
        return Promise.resolve({ data: teacherUser })
      }
      if (url === '/materials') {
        return Promise.reject(new Error('network down'))
      }
      return Promise.reject(new Error(`Unexpected GET ${url}`))
    })
    renderWithProviders(<MaterialsPage />, ['/materials'])
    expect(
      await screen.findByText('Could not load materials.'),
    ).toBeInTheDocument()
  })

  it('shows a loading state while the list is being fetched', async () => {
    localStorage.setItem('learnium.refreshToken', 'stored-refresh')
    mock.refreshAccessToken.mockResolvedValue('fresh-access')
    mock.get.mockImplementation((url: string) => {
      if (url === '/me') {
        return Promise.resolve({ data: teacherUser })
      }
      if (url === '/materials') {
        return new Promise(() => undefined)
      }
      return Promise.reject(new Error(`Unexpected GET ${url}`))
    })
    renderWithProviders(<MaterialsPage />, ['/materials'])
    expect(
      await screen.findByText('Loading materials…'),
    ).toBeInTheDocument()
  })
})
