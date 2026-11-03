import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { StudentAttempt } from '../lib/api'
import StudentPlayerPage from './StudentPlayerPage'

const mocks = vi.hoisted(() => ({ post: vi.fn(), put: vi.fn() }))
vi.mock('../lib/api', () => ({ apiClient: { post: mocks.post, put: mocks.put }, getApiErrorMessage: (error: { response?: { data?: { message?: string } } }, fallback: string) => error.response?.data?.message ?? fallback }))
const deadline = new Date(Date.now() + 65_000).toISOString()
const attempt: StudentAttempt = {
  attemptId: 'attempt-1', instanceId: 'instance-1', definitionName: 'Fractions Check', attemptNo: 1,
  status: 'IN_PROGRESS', startedAt: new Date().toISOString(), deadlineAt: deadline, remainingSeconds: 65,
  items: [
    { itemId: 'mcq', order: 0, type: 'MCQ', marks: 2, payload: { stem: 'Choose one', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }] } },
    { itemId: 'fib', order: 1, type: 'FILL_BLANK', marks: 1, payload: { stemWithBlank: 'Half is _____ percent' } },
    { itemId: 'num', order: 2, type: 'NUMERIC', marks: 1, payload: { stem: 'Two plus zero' } },
    { itemId: 'written', order: 3, type: 'WRITTEN', marks: 3, payload: { stem: 'Explain halves' } },
  ], answers: [{ itemId: 'fib', answer: { text: 'Fifty' }, savedAt: new Date().toISOString() }],
}
function Location() { return <p data-testid="location">{useLocation().pathname}</p> }
function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/student/tests/instance-1']}><Routes><Route path="/student/tests/:instanceId" element={<StudentPlayerPage />} /><Route path="*" element={<Location />} /></Routes></MemoryRouter></QueryClientProvider>)
}
beforeEach(() => { mocks.post.mockReset(); mocks.put.mockReset(); mocks.put.mockResolvedValue({ data: {} }) })

describe('StudentPlayerPage', () => {
  it('resumes saved answers, navigates, autosaves, reviews and submits', async () => {
    mocks.post.mockImplementation((url: string) => url.endsWith('/submit') ? Promise.resolve({ data: { attemptId: 'attempt-1' } }) : Promise.resolve({ data: attempt }))
    const user = userEvent.setup(); renderPage()
    expect(await screen.findByRole('heading', { name: 'Fractions Check' })).toBeInTheDocument()
    expect(screen.getByLabelText('Time remaining')).toHaveTextContent(':')
    await user.click(screen.getByText('B'))
    expect(await screen.findByRole('status')).toHaveTextContent('Saved')
    await user.click(screen.getByRole('button', { name: 'Save and next' }))
    expect(screen.getByLabelText('Written answer')).toHaveValue('Fifty')
    await user.clear(screen.getByLabelText('Written answer')); await user.type(screen.getByLabelText('Written answer'), ' fifty ')
    fireEvent.blur(screen.getByLabelText('Written answer')); await user.click(screen.getByRole('button', { name: 'Save and next' }))
    await user.type(screen.getByLabelText('Numeric answer'), '2'); fireEvent.blur(screen.getByLabelText('Numeric answer'))
    await user.click(screen.getByRole('button', { name: 'Save and next' }))
    await user.type(screen.getByLabelText('Written answer'), 'Two equal parts'); fireEvent.blur(screen.getByLabelText('Written answer'))
    await user.click(screen.getByRole('button', { name: 'Save and review' }))
    expect(screen.getByRole('heading', { name: 'Review your answers' })).toBeInTheDocument()
    expect(screen.getAllByText(/Answered/)).toHaveLength(4)
    await user.click(screen.getByText('Question 1 — Answered'))
    expect(screen.getByText('Choose one')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Question 4, answered' }))
    await user.click(screen.getByRole('button', { name: 'Save and review' }))
    await user.click(screen.getByRole('button', { name: 'Submit test' }))
    expect(await screen.findByTestId('location')).toHaveTextContent('/student/attempts/attempt-1/result')
    expect(mocks.put).toHaveBeenCalledWith('/student/attempts/attempt-1/answers/mcq', { answer: { optionId: 'b' } })
  })

  it('shows loading, start errors, empty answers and submit failures', async () => {
    let resolve: (value: { data: StudentAttempt }) => void = () => undefined
    mocks.post.mockImplementationOnce(() => new Promise((done) => { resolve = done }))
    const first = renderPage(); expect(screen.getByText('Preparing your test…')).toBeInTheDocument(); first.unmount()
    mocks.post.mockRejectedValueOnce({ response: { data: { message: 'Window closed' } } }); renderPage()
    expect(await screen.findByRole('alert')).toHaveTextContent('Window closed')
    resolve({ data: attempt })
  })

  it('shows unanswered review state and a submit API error', async () => {
    mocks.post.mockImplementation((url: string) => url.endsWith('/submit') ? Promise.reject({ response: { data: { message: 'Submit failed' } } }) : Promise.resolve({ data: { ...attempt, items: [attempt.items[3]], answers: [] } }))
    const user = userEvent.setup(); renderPage(); await screen.findByText('Explain halves')
    await user.click(screen.getByRole('button', { name: 'Save and review' }))
    expect(screen.getByText('Question 1 — Unanswered')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Submit test' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Submit failed')
  })

  it('handles numeric clearing, autosave failure, and an empty item list', async () => {
    mocks.put.mockRejectedValueOnce({ response: { data: { message: 'Save failed' } } })
    mocks.post.mockResolvedValue({ data: { ...attempt, items: [attempt.items[2]], answers: [] } })
    const user = userEvent.setup(); const page = renderPage()
    const input = await screen.findByLabelText('Numeric answer')
    await user.type(input, '2'); fireEvent.blur(input)
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Autosave failed'))
    await user.clear(input)
    page.unmount()

    mocks.post.mockResolvedValue({ data: { ...attempt, items: [], answers: [] } })
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Fractions Check' })).toBeInTheDocument()
    expect(screen.queryByText(/Question 1 of/)).not.toBeInTheDocument()
  })

  it('tolerates malformed MCQ payload values without exposing implementation details', async () => {
    mocks.post.mockResolvedValue({ data: { ...attempt, items: [
      { ...attempt.items[0], payload: { stem: 4, options: [null, { id: 3, text: 7 }] } },
    ], answers: [] } })
    renderPage()
    expect(await screen.findAllByRole('radio')).toHaveLength(2)
  })

  it('handles an absent options list and disables repeat submit while pending', async () => {
    let resolveSubmit: (value: { data: { attemptId: string } }) => void = () => undefined
    mocks.post.mockImplementation((url: string) => url.endsWith('/submit')
      ? new Promise((resolve) => { resolveSubmit = resolve })
      : Promise.resolve({ data: { ...attempt, items: [{ ...attempt.items[0], payload: { stem: 'No choices yet' } }], answers: [] } }))
    const user = userEvent.setup(); renderPage()
    expect(await screen.findByText('No choices yet')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Save and review' }))
    await user.click(screen.getByRole('button', { name: 'Submit test' }))
    expect(screen.getByRole('button', { name: 'Submitting…' })).toBeDisabled()
    resolveSubmit({ data: { attemptId: 'attempt-1' } })
  })

  it('decrements the server-derived countdown every second', () => {
    vi.useFakeTimers()
    mocks.post.mockReturnValue(new Promise(() => undefined))
    const page = renderPage()
    act(() => vi.advanceTimersByTime(1000))
    page.unmount()
    vi.useRealTimers()
  })
})
