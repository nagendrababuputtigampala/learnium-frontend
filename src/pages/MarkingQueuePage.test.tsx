import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MarkingQueuePage from './MarkingQueuePage'

const mocks = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('../lib/api', () => ({ apiClient: { get: mocks.get }, getApiErrorMessage: (error: { response?: { data?: { message?: string } } }, fallback: string) => error.response?.data?.message ?? fallback }))
function renderPage() { const client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); return render(<QueryClientProvider client={client}><MemoryRouter><MarkingQueuePage /></MemoryRouter></QueryClientProvider>) }
beforeEach(() => mocks.get.mockReset())

describe('MarkingQueuePage', () => {
  it('groups written answers and renders every suggestion state', async () => {
    mocks.get.mockResolvedValue({ data: [{ instanceId: 'instance-1', testName: 'Fractions check', batchName: 'Grade 8', items: [
      { questionAttemptId: 'a1', studentId: 's1', studentName: 'Asha', testName: 'Fractions check', submittedAt: '2026-11-03T20:00:00Z', marks: 4, suggestionState: 'READY' },
      { questionAttemptId: 'a2', studentId: 's2', studentName: 'Ben', testName: 'Fractions check', submittedAt: '2026-11-03T20:00:00Z', marks: 3, suggestionState: 'MARKING' },
      { questionAttemptId: 'a3', studentId: 's3', studentName: 'Cara', testName: 'Fractions check', submittedAt: '2026-11-03T20:00:00Z', marks: 2, suggestionState: 'FAILED' },
      { questionAttemptId: 'a4', studentId: 's4', studentName: 'Dev', testName: 'Fractions check', submittedAt: '2026-11-03T20:00:00Z', marks: 1, suggestionState: 'NONE' },
    ] }] })
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Fractions check' })).toBeInTheDocument()
    expect(screen.getByText('Grade 8 · 4 written answers')).toBeInTheDocument()
    for (const label of ['AI suggestion ready', 'AI marking in progress', 'AI marking failed', 'Manual marking']) expect(screen.getByText(label)).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Review answer' })[0]).toHaveAttribute('href', '/marking/a1')
  })

  it('shows loading, empty and API error states', async () => {
    let resolve: (value: unknown) => void = () => undefined
    mocks.get.mockImplementationOnce(() => new Promise(done => { resolve = done })); const loading = renderPage(); expect(screen.getByText('Loading marking queue…')).toBeInTheDocument(); loading.unmount(); resolve({ data: [] })
    mocks.get.mockResolvedValueOnce({ data: [] }); renderPage(); expect(await screen.findByText('Nothing is waiting to be marked.')).toBeInTheDocument()
    mocks.get.mockRejectedValueOnce({ response: { data: { message: 'Queue unavailable' } } }); renderPage(); expect(await screen.findByRole('alert')).toHaveTextContent('Queue unavailable')
  })

  it('uses the singular written-answer label', async () => {
    mocks.get.mockResolvedValue({ data: [{ instanceId: 'i', testName: 'Test', batchName: 'Batch', items: [{ questionAttemptId: 'a', studentId: 's', studentName: 'Student', testName: 'Test', submittedAt: '2026-11-03T20:00:00Z', marks: 1, suggestionState: 'NONE' }] }] })
    renderPage(); expect(await screen.findByText('Batch · 1 written answer')).toBeInTheDocument()
  })
})
