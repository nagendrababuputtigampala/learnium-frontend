import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { studentUser } from '../test/fixtures'
import StudentHomePage from './StudentHomePage'

const mocks = vi.hoisted(() => ({ get: vi.fn(), logout: vi.fn() }))
vi.mock('../lib/api', async () => ({ apiClient: { get: mocks.get }, getApiErrorMessage: (error: { response?: { data?: { message?: string } } }, fallback: string) => error.response?.data?.message ?? fallback }))
vi.mock('../lib/auth', () => ({ useAuth: () => ({ user: studentUser, logout: mocks.logout }) }))

function Location() { return <p data-testid="location">{useLocation().pathname}</p> }
function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/student']}><Routes><Route path="/student" element={<StudentHomePage />} /><Route path="*" element={<Location />} /></Routes></MemoryRouter></QueryClientProvider>)
}

const tests = [
  { instanceId: 'a', definitionName: 'Fractions Sprint', kind: 'SCORED_TEST', batchName: 'Grade 8 Math', opensAt: '2026-11-01T00:00:00Z', closesAt: '2026-11-10T00:00:00Z', maxAttempts: 2, attemptsUsed: 1, latestAttemptId: 'attempt-a', latestAttemptStatus: 'IN_PROGRESS', state: 'AVAILABLE', totalSoFar: null, markingPending: false },
  { instanceId: 'b', definitionName: 'Algebra Check', kind: 'SCORED_TEST', batchName: 'Grade 8 Math', opensAt: '2026-12-01T00:00:00Z', closesAt: '2026-12-10T00:00:00Z', maxAttempts: 1, attemptsUsed: 0, latestAttemptId: null, latestAttemptStatus: null, state: 'UPCOMING', totalSoFar: null, markingPending: false },
  { instanceId: 'c', definitionName: 'Geometry Review', kind: 'SCORED_TEST', batchName: 'Grade 8 Math', opensAt: '2026-10-01T00:00:00Z', closesAt: '2026-10-10T00:00:00Z', maxAttempts: 1, attemptsUsed: 1, latestAttemptId: 'attempt-c', latestAttemptStatus: 'SUBMITTED', state: 'COMPLETED', totalSoFar: 8, markingPending: true },
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

  it.each([
    [{ ...tests[0], latestAttemptStatus: null }, 'Start test', '/student/tests/a'],
    [tests[0], 'Resume test', '/student/tests/a'],
    [tests[2], 'View results', '/student/attempts/attempt-c/result'],
    [{ ...tests[0], instanceId: 'cards', kind: 'FLASHCARD_PRACTICE' }, 'Practise cards', '/student/tests/cards/practice'],
  ])('routes each actionable card to its player or result', async (test, label, expected) => {
    mocks.get.mockResolvedValue({ data: [test] })
    const user = userEvent.setup(); renderPage()
    if (test.state === 'COMPLETED') await user.click(await screen.findByRole('tab', { name: 'Completed (1)' }))
    await user.click(await screen.findByRole('button', { name: label }))
    expect(screen.getByTestId('location')).toHaveTextContent(expected)
  })
})
