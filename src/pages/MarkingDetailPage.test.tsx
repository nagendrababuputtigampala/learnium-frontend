import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MarkingDetailPage from './MarkingDetailPage'

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
vi.mock('../lib/api', () => ({ apiClient: { get: mocks.get, post: mocks.post }, getApiErrorMessage: (error: { response?: { data?: { message?: string } } }, fallback: string) => error.response?.data?.message ?? fallback }))
const base = {
  questionAttemptId: 'answer-1', instanceId: 'instance-1', testName: 'Fractions', batchName: 'Grade 8', studentId: 'student-1', studentName: 'Asha', submittedAt: '2026-11-03T20:00:00Z', marks: 10,
  payload: { stem: 'Explain equivalent fractions', rubric: [{ id: 'reasoning', criterion: 'Reasoning', maxScore: 10 }, { id: 'clarity', criterion: 'Clarity', maxScore: 5 }, { id: 'evidence', criterion: 'Evidence', maxScore: 5 }] },
  answer: { text: 'They have the same value.' }, aiBreakdown: null, aiFeedback: null, suggestionState: 'NONE', confirmedBreakdown: null, confirmedScore: null, markerFeedback: null,
}
function renderPage() { const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }); return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/marking/answer-1']}><Routes><Route path="/marking/:questionAttemptId" element={<MarkingDetailPage />} /></Routes></MemoryRouter></QueryClientProvider>) }
beforeEach(() => { mocks.get.mockReset(); mocks.post.mockReset() })

describe('MarkingDetailPage', () => {
  it('prefills an array AI suggestion, rescales live and confirms', async () => {
    const suggested = { ...base, suggestionState: 'READY', aiFeedback: 'Good structure', aiBreakdown: { criteria: [{ criterionId: 'reasoning', score: 3.33 }, { criterionId: 'clarity', score: 1.67 }, { criterionId: 'evidence', score: 1.67 }] } }
    const confirmed = { ...suggested, confirmedScore: 3.34 }
    mocks.get.mockResolvedValue({ data: suggested }); mocks.post.mockResolvedValue({ data: confirmed })
    const user = userEvent.setup(); renderPage()
    expect(await screen.findByDisplayValue('3.33')).toBeInTheDocument(); expect(screen.getByDisplayValue('Good structure')).toBeInTheDocument()
    expect(screen.getByText('Final mark: 3.34 / 10.00')).toBeInTheDocument()
    await user.clear(screen.getByLabelText('Reasoning score')); await user.type(screen.getByLabelText('Reasoning score'), '10')
    expect(screen.getByText('Final mark: 6.67 / 10.00')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Confirm mark' }))
    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith('/marking-queue/answer-1/confirm', { criteria: [{ criterionId: 'reasoning', score: 10 }, { criterionId: 'clarity', score: 1.67 }, { criterionId: 'evidence', score: 1.67 }], feedback: 'Good structure' }))
    expect(await screen.findByRole('heading', { name: 'Mark confirmed' })).toBeInTheDocument()
  })

  it('prefills object-shaped suggestions and renders frozen facts safely', async () => {
    mocks.get.mockResolvedValue({ data: { ...base, payload: { ...base.payload, stem: 7 }, answer: {}, suggestionState: 'READY', aiBreakdown: { criteria: { reasoning: { score: 8 }, clarity: { score: 4 }, evidence: { score: 3 } } } } })
    renderPage(); expect(await screen.findByDisplayValue('8')).toBeInTheDocument(); expect(screen.getByText('Written response')).toBeInTheDocument(); expect(screen.getByText('No written answer.')).toBeInTheDocument()
  })

  it('supports manual marking and guards incomplete or out-of-range scores', async () => {
    mocks.get.mockResolvedValue({ data: base }); renderPage(); const confirm = await screen.findByRole('button', { name: 'Confirm mark' })
    expect(screen.getByText('No AI suggestion is available. Enter marks manually.')).toBeInTheDocument(); expect(confirm).toBeDisabled()
    const user = userEvent.setup(); await user.type(screen.getByLabelText('Reasoning score'), '11'); await user.type(screen.getByLabelText('Clarity score'), '2'); await user.type(screen.getByLabelText('Evidence score'), '2'); await user.type(screen.getByRole('textbox', { name: 'Feedback' }), 'Manual feedback'); expect(confirm).toBeDisabled()
    fireEvent.submit(confirm.closest('form')!)
    await user.clear(screen.getByLabelText('Reasoning score')); await user.type(screen.getByLabelText('Reasoning score'), '5'); expect(confirm).toBeEnabled()
  })

  it('reruns failed AI marking and shows the in-progress state', async () => {
    mocks.get.mockResolvedValue({ data: { ...base, suggestionState: 'FAILED' } }); mocks.post.mockResolvedValue({ data: { ...base, suggestionState: 'MARKING' } })
    const user = userEvent.setup(); renderPage(); await user.click(await screen.findByRole('button', { name: 'Run AI marking again' }))
    expect(mocks.post).toHaveBeenCalledWith('/marking-queue/answer-1/rerun'); expect(await screen.findByText(/still in progress/)).toBeInTheDocument()
  })

  it('renders marking, loading and API failures', async () => {
    let resolve: (value: unknown) => void = () => undefined
    mocks.get.mockImplementationOnce(() => new Promise(done => { resolve = done })); const loading = renderPage(); expect(screen.getByText('Loading written answer…')).toBeInTheDocument(); loading.unmount(); resolve({ data: base })
    mocks.get.mockResolvedValueOnce({ data: { ...base, suggestionState: 'MARKING' } }); renderPage(); expect(await screen.findByText(/still in progress/)).toBeInTheDocument()
    mocks.get.mockRejectedValueOnce({ response: { data: { message: 'Answer unavailable' } } }); renderPage(); expect(await screen.findByRole('alert')).toHaveTextContent('Answer unavailable')
  })

  it('shows confirmation and rerun API failures', async () => {
    mocks.get.mockResolvedValue({ data: base }); mocks.post.mockRejectedValue({ response: { data: { message: 'Action failed' } } })
    const user = userEvent.setup(); const first = renderPage(); await user.type(await screen.findByLabelText('Reasoning score'), '5'); await user.type(screen.getByLabelText('Clarity score'), '2'); await user.type(screen.getByLabelText('Evidence score'), '2'); await user.click(screen.getByRole('button', { name: 'Confirm mark' })); expect(await screen.findByRole('alert')).toHaveTextContent('Action failed'); first.unmount()
    mocks.get.mockResolvedValue({ data: { ...base, suggestionState: 'FAILED' } }); renderPage(); await user.click(await screen.findByRole('button', { name: 'Run AI marking again' })); expect(await screen.findByText('Action failed')).toBeInTheDocument()
  })

  it('handles malformed rubrics and suggestion entries', async () => {
    mocks.get.mockResolvedValue({ data: { ...base, payload: { rubric: [null, { id: 2 }, { id: 'x', criterion: 'X', maxScore: 'bad' }] }, aiBreakdown: { criteria: [null, { criterionId: 2, score: 1 }, { criterionId: 'x', score: 'bad' }] } } })
    const first = renderPage(); expect(await screen.findByRole('button', { name: 'Confirm mark' })).toBeDisabled(); first.unmount()
    mocks.get.mockResolvedValue({ data: { ...base, aiBreakdown: { criteria: 'bad' } } }); const second = renderPage(); expect(await screen.findByRole('button', { name: 'Confirm mark' })).toBeDisabled(); second.unmount()
    mocks.get.mockResolvedValue({ data: { ...base, payload: {}, aiBreakdown: null } }); const third = renderPage(); expect(await screen.findByRole('button', { name: 'Confirm mark' })).toBeDisabled(); third.unmount()
    mocks.get.mockResolvedValue({ data: { ...base, aiBreakdown: { criteria: { empty: null, bad: { score: 'no' }, reasoning: { score: 4 } } } } }); renderPage(); expect(await screen.findByDisplayValue('4')).toBeInTheDocument()
  })
})
