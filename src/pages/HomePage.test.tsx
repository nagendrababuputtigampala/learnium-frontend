import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { batchOne, batchTwo, teacherUser } from '../test/fixtures'
import { renderWithProviders } from '../test/renderWithProviders'
import HomePage from './HomePage'

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

function seedTeacherSession() {
  localStorage.setItem('learnium.refreshToken', 'stored-refresh')
  mock.refreshAccessToken.mockResolvedValue('fresh-access')
}

function mockGet(batches: unknown, batchesError?: unknown) {
  mock.get.mockImplementation((url: string) => {
    if (url === '/me') {
      return Promise.resolve({ data: teacherUser })
    }
    if (url === '/batches') {
      return batchesError !== undefined
        ? Promise.reject(batchesError)
        : Promise.resolve({ data: batches })
    }
    return Promise.reject(new Error(`Unexpected GET ${url}`))
  })
}

describe('HomePage', () => {
  it('greets the signed-in teacher and lists their batches', async () => {
    seedTeacherSession()
    mockGet([batchOne, batchTwo])
    renderWithProviders(<HomePage />)
    expect(
      screen.getByRole('heading', { name: 'Teacher Home' }),
    ).toBeInTheDocument()
    expect(
      await screen.findByText(/Welcome back, Mrs\. Patel/),
    ).toBeInTheDocument()
    expect(screen.getByText(/Demo Tutoring Centre/)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Create test from a chapter' }),
    ).toBeInTheDocument()
    expect(
      await screen.findByText('Grade 8 Math — Batch B'),
    ).toBeInTheDocument()
    expect(screen.getByText('Grade 8 · Mathematics')).toBeInTheDocument()
    expect(screen.getByText(/5 students/)).toBeInTheDocument()
    expect(screen.getByText(/Teacher: Mrs\. Patel/)).toBeInTheDocument()
    expect(screen.getByText('Grade 7 Science — Batch A')).toBeInTheDocument()
    expect(screen.getByText(/No teacher assigned/)).toBeInTheDocument()
  })

  it('shows a loading state while batches load', () => {
    mock.get.mockImplementation(() => new Promise(() => undefined))
    renderWithProviders(<HomePage />)
    expect(screen.getByText('Loading batches…')).toBeInTheDocument()
  })

  it('uses greeting fallbacks and the empty state without a session', async () => {
    mockGet([])
    renderWithProviders(<HomePage />)
    expect(
      await screen.findByText(/No batches assigned yet/),
    ).toBeInTheDocument()
    expect(screen.getByText(/Welcome back, teacher/)).toBeInTheDocument()
    expect(screen.getByText(/your centre/)).toBeInTheDocument()
  })

  it('shows the empty state when the teacher has no batches', async () => {
    seedTeacherSession()
    mockGet([])
    renderWithProviders(<HomePage />)
    expect(
      await screen.findByText(/No batches assigned yet/),
    ).toBeInTheDocument()
  })

  it('shows the envelope message when batches fail to load', async () => {
    seedTeacherSession()
    mockGet(undefined, {
      response: { data: { message: 'Batches unavailable' } },
    })
    renderWithProviders(<HomePage />)
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Batches unavailable',
    )
  })
})
