import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import StudentDashboard from './StudentDashboard'

const mocks = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('../../lib/api', () => ({ apiClient: { get: mocks.get }, getApiErrorMessage: (error: { response?: { data?: { message?: string } } }, fallback: string) => error.response?.data?.message ?? fallback }))
function renderDashboard() { const client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); return render(<QueryClientProvider client={client}><StudentDashboard /></QueryClientProvider>) }
const topic = (id: string, name: string, scorePercent: number, band: 'STRONG' | 'DEVELOPING' | 'FOCUS' | null, confirmedItemCount = 3) => ({ topicId: id, topicName: name, confirmedItemCount, earnedMarks: scorePercent, availableMarks: 100, scorePercent, band })
beforeEach(() => mocks.get.mockReset())

describe('StudentDashboard', () => {
  it('renders every band, comparisons, recent results and pending coverage', async () => {
    const strong = topic('s', 'Fractions', 120, 'STRONG', 1)
    const developing = topic('d', 'Algebra', 60, 'DEVELOPING')
    const focus = topic('f', 'Geometry', -5, 'FOCUS')
    const insufficient = topic('i', 'Probability', 75, null, 2)
    mocks.get.mockResolvedValue({ data: { topics: [strong, developing, focus, insufficient], strongAreas: [strong], areasToImprove: [focus], pendingItemCount: 2, comparisons: [{ batchId: 'b', batchName: 'Grade 8', topicId: 's', topicName: 'Fractions', studentCount: 8, batchAveragePercent: 52, percentile: 100 }], recentResults: [
      { attemptId: 'a', testName: 'Topic check', batchName: 'Grade 8', submittedAt: '2026-11-03T20:00:00Z', earnedMarks: 8, availableMarks: 10, markingPending: true },
      { attemptId: 'b', testName: 'Quick quiz', batchName: 'Grade 8', submittedAt: '2026-11-02T20:00:00Z', earnedMarks: 6, availableMarks: 10, markingPending: false },
    ] } })
    renderDashboard()
    expect(await screen.findByRole('heading', { name: 'Topic progress' })).toBeInTheDocument()
    for (const label of ['Strong', 'Developing', 'Focus', 'Insufficient data']) expect(screen.getByText(label)).toBeInTheDocument()
    expect(screen.getByText(/2 written answers are awaiting marking/)).toBeInTheDocument()
    expect(screen.getByText('100th percentile')).toBeInTheDocument(); expect(screen.getByText('Batch average 52%')).toBeInTheDocument()
    expect(screen.getByText('Awaiting marking')).toBeInTheDocument(); expect(screen.getByText('Quick quiz')).toBeInTheDocument()
    expect(screen.getByLabelText('Fractions 120 percent')).toHaveStyle({ width: '100%' })
    expect(screen.getByLabelText('Geometry -5 percent')).toHaveStyle({ width: '0%' })
  })

  it('omits comparison and renders empty strong/focus guidance with singular pending copy', async () => {
    mocks.get.mockResolvedValue({ data: { topics: [topic('i', 'Probability', 50, null)], strongAreas: [], areasToImprove: [], pendingItemCount: 1, comparisons: [], recentResults: [{ attemptId: 'a', testName: 'Check', batchName: 'Batch', submittedAt: '', earnedMarks: 0, availableMarks: 1, markingPending: false }] } })
    renderDashboard(); expect(await screen.findByText(/1 written answer is awaiting marking/)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Batch comparison' })).toBeNull()
    expect(screen.getByText(/strong areas will appear/)).toBeInTheDocument(); expect(screen.getByText('No focus areas yet.')).toBeInTheDocument()
  })

  it('renders new-student empty states with and without pending work', async () => {
    mocks.get.mockResolvedValueOnce({ data: { topics: [], strongAreas: [], areasToImprove: [], pendingItemCount: 0, comparisons: [], recentResults: [] } })
    const first = renderDashboard(); expect(await screen.findByRole('heading', { name: 'Your progress will appear here' })).toBeInTheDocument(); expect(screen.queryByText(/awaiting marking/)).toBeNull(); first.unmount()
    mocks.get.mockResolvedValueOnce({ data: { topics: [], strongAreas: [], areasToImprove: [], pendingItemCount: 2, comparisons: [], recentResults: [] } })
    const second = renderDashboard(); expect(await screen.findByText('2 written answers are awaiting marking.')).toBeInTheDocument(); second.unmount()
    mocks.get.mockResolvedValueOnce({ data: { topics: [], strongAreas: [], areasToImprove: [], pendingItemCount: 1, comparisons: [], recentResults: [] } })
    renderDashboard(); expect(await screen.findByText('1 written answer is awaiting marking.')).toBeInTheDocument()
  })

  it('shows loading and API errors', async () => {
    let resolve: (value: unknown) => void = () => undefined
    mocks.get.mockImplementationOnce(() => new Promise(done => { resolve = done })); const first = renderDashboard(); expect(screen.getByText('Loading your progress…')).toBeInTheDocument(); first.unmount(); resolve({ data: {} })
    mocks.get.mockRejectedValueOnce({ response: { data: { message: 'Progress unavailable' } } }); renderDashboard(); expect(await screen.findByRole('alert')).toHaveTextContent('Progress unavailable')
  })
})
