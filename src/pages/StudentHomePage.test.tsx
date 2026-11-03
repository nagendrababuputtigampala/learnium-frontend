import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { studentUser } from '../test/fixtures'
import StudentHomePage from './StudentHomePage'

const mocks = vi.hoisted(() => ({ get: vi.fn(), logout: vi.fn() }))
vi.mock('../lib/api', async () => ({ apiClient: { get: mocks.get }, getApiErrorMessage: (error: { response?: { data?: { message?: string } } }, fallback: string) => error.response?.data?.message ?? fallback }))
vi.mock('../lib/auth', () => ({ useAuth: () => ({ user: studentUser, logout: mocks.logout }) }))

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}><MemoryRouter><StudentHomePage /></MemoryRouter></QueryClientProvider>)
}

const tests = [
  { instanceId: 'a', definitionName: 'Fractions Sprint', kind: 'QUIZ', batchName: 'Grade 8 Math', opensAt: '2026-11-01T00:00:00Z', closesAt: '2026-11-10T00:00:00Z', maxAttempts: 2, attemptsUsed: 1, latestAttemptStatus: 'STARTED', state: 'AVAILABLE', totalSoFar: null, markingPending: false },
  { instanceId: 'b', definitionName: 'Algebra Check', kind: 'TEST', batchName: 'Grade 8 Math', opensAt: '2026-12-01T00:00:00Z', closesAt: '2026-12-10T00:00:00Z', maxAttempts: 1, attemptsUsed: 0, latestAttemptStatus: null, state: 'UPCOMING', totalSoFar: null, markingPending: false },
  { instanceId: 'c', definitionName: 'Geometry Review', kind: 'QUIZ', batchName: 'Grade 8 Math', opensAt: '2026-10-01T00:00:00Z', closesAt: '2026-10-10T00:00:00Z', maxAttempts: 1, attemptsUsed: 1, latestAttemptStatus: 'SUBMITTED', state: 'COMPLETED', totalSoFar: 8, markingPending: true },
]

beforeEach(() => { mocks.get.mockReset(); mocks.logout.mockReset() })

describe('StudentHomePage', () => {
  it('shows loading and empty states', async () => {
    let resolveTests: (value: { data: unknown[] }) => void = () => undefined
    mocks.get.mockImplementation(() => new Promise((resolve) => { resolveTests = resolve }))
    renderPage()
    expect(screen.getByText('Loading your tests…')).toBeInTheDocument()
    resolveTests({ data: [] })
    expect(await screen.findByText('No available tests right now.')).toBeInTheDocument()
  })

  it('loads assignment-scoped tests and switches tabs', async () => {
    mocks.get.mockResolvedValue({ data: tests })
    const user = userEvent.setup(); renderPage()
    expect(await screen.findByText('Fractions Sprint')).toBeInTheDocument()
    expect(mocks.get).toHaveBeenCalledWith('/student/tests')
    await user.click(screen.getByRole('tab', { name: 'Upcoming (1)' }))
    expect(screen.getByText('Algebra Check')).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Completed (1)' }))
    expect(screen.getByText('Geometry Review')).toBeInTheDocument()
    expect(screen.getByText('Score 8')).toBeInTheDocument()
    expect(screen.getByText('Marking pending')).toBeInTheDocument()
  })

  it('shows API errors and signs out', async () => {
    mocks.get.mockRejectedValue({ response: { data: { message: 'Tests unavailable' } } })
    const user = userEvent.setup(); renderPage()
    expect(await screen.findByRole('alert')).toHaveTextContent('Tests unavailable')
    await user.click(screen.getByRole('button', { name: 'Sign out' }))
    expect(mocks.logout).toHaveBeenCalled()
  })
})
