import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PracticePlayerPage from './PracticePlayerPage'

const mocks = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('../lib/api', () => ({ apiClient: { get: mocks.get }, getApiErrorMessage: (error: { response?: { data?: { message?: string } } }, fallback: string) => error.response?.data?.message ?? fallback }))
function renderPage() { const client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/student/tests/i/practice']}><Routes><Route path="/student/tests/:instanceId/practice" element={<PracticePlayerPage />} /></Routes></MemoryRouter></QueryClientProvider>) }
beforeEach(() => mocks.get.mockReset())
describe('PracticePlayerPage', () => {
  it('flips cards and tracks know/still-learning progress locally', async () => {
    mocks.get.mockResolvedValue({ data: { instanceId: 'i', definitionName: 'Cards', cards: [
      { itemId: '1', order: 0, type: 'FLASHCARD', marks: 0, payload: { front: 'Half', back: 'Two quarters' } },
      { itemId: '2', order: 1, type: 'FLASHCARD', marks: 0, payload: { front: 'Third', back: 'One of three' } },
    ] } })
    const user = userEvent.setup(); renderPage(); const card = await screen.findByRole('button', { name: 'Flip card' })
    expect(card).toHaveTextContent('Half'); await user.click(card); expect(card).toHaveTextContent('Two quarters')
    await user.click(screen.getByRole('button', { name: 'Know it' })); expect(screen.getByText('Third')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Flip card' })); await user.click(screen.getByRole('button', { name: 'Still learning' }))
    expect(screen.getByRole('heading', { name: 'Practice complete' })).toBeInTheDocument(); expect(screen.getByText('You knew 1 of 2 cards.')).toBeInTheDocument()
  })
  it('shows loading, empty completion and errors', async () => {
    let resolve: (value: unknown) => void = () => undefined; mocks.get.mockImplementationOnce(() => new Promise((done) => { resolve = done })); const first = renderPage(); expect(screen.getByText('Loading cards…')).toBeInTheDocument(); first.unmount()
    mocks.get.mockResolvedValueOnce({ data: { instanceId: 'i', definitionName: 'Empty', cards: [] } }); renderPage(); expect(await screen.findByRole('heading', { name: 'Practice complete' })).toBeInTheDocument(); resolve({ data: {} })
    mocks.get.mockRejectedValueOnce({ response: { data: { message: 'Cards unavailable' } } }); renderPage(); expect(await screen.findByRole('alert')).toHaveTextContent('Cards unavailable')
  })
  it('renders empty card faces safely', async () => {
    mocks.get.mockResolvedValue({ data: { instanceId: 'i', definitionName: 'Cards', cards: [
      { itemId: '1', order: 0, type: 'FLASHCARD', marks: 0, payload: {} },
    ] } })
    const user = userEvent.setup(); renderPage(); const card = await screen.findByRole('button', { name: 'Flip card' })
    expect(card).toHaveTextContent(''); await user.click(card); expect(card).toHaveTextContent('')
  })
})
