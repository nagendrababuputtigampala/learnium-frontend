import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { InstanceAttempt } from '../lib/proctor'
import InstanceAttemptsPage from './InstanceAttemptsPage'

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
vi.mock('../lib/api', () => ({
  apiClient: { get: mocks.get, post: mocks.post },
  getApiErrorMessage: (error: { response?: { data?: { message?: string } } }, fallback: string) => error.response?.data?.message ?? fallback,
}))

const submitted: InstanceAttempt = {
  attemptId: 'a-1', studentId: 's-1', displayName: 'Simran Kaur', username: 'simran.k', attemptNo: 1,
  status: 'SUBMITTED', startedAt: '2026-11-03T18:00:00Z', submittedAt: '2026-11-03T18:20:00Z',
  score: 7.5, maxScore: 10, markingPending: true, flags: { TAB_HIDDEN: 2, WEIRD: 1 }, flagTotal: 3,
}
const inProgress: InstanceAttempt = {
  attemptId: 'a-2', studentId: 's-2', displayName: 'Arjun Mehta', username: null, attemptNo: 2,
  status: 'IN_PROGRESS', startedAt: '2026-11-03T18:05:00Z', submittedAt: null,
  score: null, maxScore: 10, markingPending: false, flags: {}, flagTotal: 0,
}
const singleFlag: InstanceAttempt = {
  attemptId: 'a-3', studentId: 's-3', displayName: 'Priya Nair', username: 'priya.n', attemptNo: 1,
  status: 'SUBMITTED', startedAt: '2026-11-03T18:10:00Z', submittedAt: '2026-11-03T18:30:00Z',
  score: 9, maxScore: 10, markingPending: false, flags: { FOCUS_LOST: 1 }, flagTotal: 1,
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/instances/inst-1/attempts']}>
        <Routes><Route path="/instances/:instanceId/attempts" element={<InstanceAttemptsPage />} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function mockReads() {
  mocks.get.mockImplementation((url: string) => {
    if (url === '/instances/inst-1/attempts') return Promise.resolve({ data: [submitted, inProgress, singleFlag] })
    if (url === '/attempts/a-1/integrity-events') return Promise.resolve({ data: [
      { eventId: 'e-1', type: 'TAB_HIDDEN', occurredAt: '2026-11-03T18:01:00Z' },
      { eventId: 'e-2', type: 'MYSTERY', occurredAt: '2026-11-03T18:02:00Z' },
    ] })
    if (url === '/attempts/a-1/snapshots') return Promise.resolve({ data: [
      { snapshotId: 'snap-1', reason: 'PERIODIC', capturedAt: '2026-11-03T18:03:00Z' },
      { snapshotId: 'snap-2', reason: 'PRE_TEST', capturedAt: '2026-11-03T17:59:00Z' },
    ] })
    if (url === '/attempts/a-1/snapshots/snap-1') return Promise.resolve({ data: new Blob(['img']) })
    if (url === '/attempts/a-1/snapshots/snap-2') return Promise.reject(new Error('gone'))
    if (url === '/attempts/a-2/integrity-events') return Promise.resolve({ data: [] })
    if (url === '/attempts/a-2/snapshots') return Promise.resolve({ data: [] })
    return Promise.reject(new Error(`unexpected ${url}`))
  })
}

beforeEach(() => {
  mocks.get.mockReset()
  mocks.post.mockReset()
  URL.createObjectURL = vi.fn(() => 'blob:img')
  URL.revokeObjectURL = vi.fn()
})

describe('InstanceAttemptsPage', () => {
  it('renders scores and flags, expands details, views a snapshot, and invalidates', async () => {
    mockReads()
    mocks.post.mockResolvedValue({ data: { ...inProgress, status: 'INVALIDATED' } })
    const user = userEvent.setup()
    renderPage()
    expect(await screen.findByText('Simran Kaur')).toBeInTheDocument()
    expect(screen.getByText('Score 7.5 / 10')).toBeInTheDocument()
    expect(screen.getByText('Marking pending')).toBeInTheDocument()
    expect(screen.getByText(/3 flags: Tab hidden ×2, WEIRD ×1/)).toBeInTheDocument()
    expect(screen.getByText('Not submitted')).toBeInTheDocument()
    expect(screen.getByText('No flags')).toBeInTheDocument()
    expect(screen.getByText(/1 flag: Focus lost ×1/)).toBeInTheDocument()

    const detailButtons = screen.getAllByRole('button', { name: 'Flags & snapshots' })
    await user.click(detailButtons[0])
    expect(await screen.findByText('Tab hidden')).toBeInTheDocument()
    expect(screen.getByText('MYSTERY')).toBeInTheDocument()
    expect(await screen.findByAltText('PERIODIC snapshot')).toBeInTheDocument()
    expect(await screen.findByText('Snapshot unavailable')).toBeInTheDocument()
    await user.click(screen.getByAltText('PERIODIC snapshot'))
    expect(await screen.findByRole('dialog', { name: 'Snapshot viewer' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Snapshot viewer' })).not.toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'Hide details' }))

    await user.click(detailButtons[1])
    expect(await screen.findByText('No integrity flags recorded.')).toBeInTheDocument()
    expect(screen.getByText('No snapshots for this attempt.')).toBeInTheDocument()

    const invalidateButtons = screen.getAllByRole('button', { name: 'Invalidate' })
    await user.click(invalidateButtons[1])
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await user.click(screen.getAllByRole('button', { name: 'Invalidate' })[1])
    await user.click(screen.getByRole('button', { name: 'Confirm invalidate' }))
    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith('/attempts/a-2/invalidate'))
  })

  it('shows loading, error and empty states for the attempt list', async () => {
    let resolve: (value: { data: InstanceAttempt[] }) => void = () => undefined
    mocks.get.mockImplementationOnce(() => new Promise((done) => { resolve = done }))
    const first = renderPage()
    expect(screen.getByText('Loading attempts…')).toBeInTheDocument()
    resolve({ data: [] })
    expect(await screen.findByText('No student has started this test yet.')).toBeInTheDocument()
    first.unmount()
    mocks.get.mockRejectedValueOnce({ response: { data: { message: 'Instance gone' } } })
    renderPage()
    expect(await screen.findByRole('alert')).toHaveTextContent('Instance gone')
  })

  it('shows detail errors and an invalidate failure', async () => {
    mocks.get.mockImplementation((url: string) => {
      if (url === '/instances/inst-1/attempts') return Promise.resolve({ data: [submitted] })
      return Promise.reject({ response: { data: { message: 'Detail failed' } } })
    })
    mocks.post.mockRejectedValue({ response: { data: { message: 'Cannot invalidate' } } })
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Flags & snapshots' }))
    expect((await screen.findAllByRole('alert')).length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: 'Invalidate' }))
    await user.click(screen.getByRole('button', { name: 'Confirm invalidate' }))
    expect(await screen.findByText('Cannot invalidate')).toBeInTheDocument()
  })

  it('closes the lightbox from the backdrop and revokes late object urls', async () => {
    type Settler = { resolve: (value: { data: Blob }) => void; reject: (error: Error) => void }
    const pending = new Map<string, Settler[]>()
    const deferredFor = (url: string) => new Promise<{ data: Blob }>((resolve, reject) => {
      const list = pending.get(url) ?? []
      list.push({ resolve, reject })
      pending.set(url, list)
    })
    mocks.get.mockImplementation((url: string) => {
      if (url === '/instances/inst-1/attempts') return Promise.resolve({ data: [submitted] })
      if (url === '/attempts/a-1/integrity-events') return Promise.resolve({ data: [] })
      if (url === '/attempts/a-1/snapshots') return Promise.resolve({ data: [
        { snapshotId: 'snap-9', reason: 'EVENT', capturedAt: '2026-11-03T18:03:00Z' },
        { snapshotId: 'snap-10', reason: 'PERIODIC', capturedAt: '2026-11-03T18:04:00Z' },
        { snapshotId: 'snap-11', reason: 'PRE_TEST', capturedAt: '2026-11-03T17:59:00Z' },
      ] })
      if (url.startsWith('/attempts/a-1/snapshots/')) return deferredFor(url)
      return Promise.reject(new Error(url))
    })
    const user = userEvent.setup()
    const view = renderPage()
    await user.click(await screen.findByRole('button', { name: 'Flags & snapshots' }))
    expect((await screen.findAllByText('Loading snapshot…')).length).toBeGreaterThan(0)
    await act(async () => {
      pending.get('/attempts/a-1/snapshots/snap-9')?.[0].resolve({ data: new Blob(['img']) })
    })
    const thumb = await screen.findByAltText('EVENT snapshot')
    await user.click(thumb)
    const dialog = await screen.findByRole('dialog', { name: 'Snapshot viewer' })
    await act(async () => {
      pending.get('/attempts/a-1/snapshots/snap-9')?.[1].reject(new Error('gone'))
    })
    expect(within(dialog).getByText('Loading snapshot…')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Snapshot viewer' })).not.toBeInTheDocument())

    await user.click(screen.getByAltText('EVENT snapshot'))
    const dialog2 = await screen.findByRole('dialog', { name: 'Snapshot viewer' })
    await act(async () => {
      pending.get('/attempts/a-1/snapshots/snap-9')?.[2].resolve({ data: new Blob(['img']) })
    })
    expect(await within(dialog2).findByAltText('EVENT snapshot')).toBeInTheDocument()
    await user.click(dialog2)
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Snapshot viewer' })).not.toBeInTheDocument())

    await user.click(screen.getByAltText('EVENT snapshot'))
    expect(await screen.findByRole('dialog', { name: 'Snapshot viewer' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Close' }))
    await act(async () => {
      pending.get('/attempts/a-1/snapshots/snap-9')?.[3].resolve({ data: new Blob(['img']) })
    })
    view.unmount()
    await act(async () => {
      pending.get('/attempts/a-1/snapshots/snap-10')?.[0].resolve({ data: new Blob(['img']) })
      pending.get('/attempts/a-1/snapshots/snap-11')?.[0].reject(new Error('gone'))
    })
    expect(URL.revokeObjectURL).toHaveBeenCalled()
  })
})
