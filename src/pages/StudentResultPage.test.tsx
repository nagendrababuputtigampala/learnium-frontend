import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import StudentResultPage from './StudentResultPage'

const mocks = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('../lib/api', () => ({ apiClient: { get: mocks.get }, getApiErrorMessage: (error: { response?: { data?: { message?: string } } }, fallback: string) => error.response?.data?.message ?? fallback }))
function renderPage() { const client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/student/attempts/a/result']}><Routes><Route path="/student/attempts/:attemptId/result" element={<StudentResultPage />} /></Routes></MemoryRouter></QueryClientProvider>) }
beforeEach(() => mocks.get.mockReset())
describe('StudentResultPage', () => {
  it('renders every result state, released solutions and feedback', async () => {
    mocks.get.mockResolvedValue({ data: { attemptId: 'a', status: 'AUTO_SUBMITTED', submittedAt: '', score: 4, maximumScore: 7, markingPending: true, answersReleased: true, items: [
      { itemId: '1', order: 0, type: 'MCQ', marks: 2, payload: {}, answer: { optionId: 'a' }, state: 'CORRECT', score: 2, solution: { correctRef: 'a' }, feedback: null },
      { itemId: '2', order: 1, type: 'NUMERIC', marks: 1, payload: {}, answer: { number: 3 }, state: 'INCORRECT', score: 0, solution: null, feedback: null },
      { itemId: '3', order: 2, type: 'WRITTEN', marks: 3, payload: {}, answer: { text: 'x' }, state: 'PENDING_MARKING', score: 0, solution: null, feedback: null },
      { itemId: '4', order: 3, type: 'WRITTEN', marks: 1, payload: {}, answer: { text: 'y' }, state: 'CONFIRMED', score: 1, solution: { modelAnswer: 'y' }, feedback: 'Clear' },
    ] } })
    renderPage(); expect(await screen.findByRole('heading', { name: '4 / 7' })).toBeInTheDocument()
    expect(screen.getByText('Written answers are still being marked.')).toBeInTheDocument()
    expect(screen.getByText('Answers and feedback are available.')).toBeInTheDocument()
    for (const state of ['Correct', 'Incorrect', 'Pending marking', 'Confirmed']) expect(screen.getByText(state)).toBeInTheDocument()
    expect(screen.getByText(/Clear/)).toBeInTheDocument(); expect(screen.getByText(/correctRef/)).toBeInTheDocument()
  })
  it('shows loading, hidden-policy copy and API errors', async () => {
    let resolve: (value: unknown) => void = () => undefined; mocks.get.mockImplementationOnce(() => new Promise((done) => { resolve = done })); const first = renderPage(); expect(screen.getByText('Loading your result…')).toBeInTheDocument(); first.unmount()
    mocks.get.mockResolvedValueOnce({ data: { attemptId: 'a', status: 'SUBMITTED', submittedAt: '', score: 0, maximumScore: 0, markingPending: false, answersReleased: false, items: [] } }); renderPage(); expect(await screen.findByText(/hidden by your teacher/)).toBeInTheDocument()
    resolve({ data: {} })
    mocks.get.mockRejectedValueOnce({ response: { data: { message: 'Result unavailable' } } }); renderPage(); expect(await screen.findByRole('alert')).toHaveTextContent('Result unavailable')
  })
})
