import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchSnapshotObjectUrl,
  recordIntegrityEvents,
  submitCameraCheck,
  uploadSnapshot,
  useAttemptSnapshots,
  useAttemptTimeline,
  useInstanceAttempts,
  useInvalidateAttempt,
} from './proctor'

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
vi.mock('./api', () => ({ apiClient: { get: mocks.get, post: mocks.post } }))

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}
function client() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
}

beforeEach(() => {
  mocks.get.mockReset()
  mocks.post.mockReset()
})

describe('student proctor calls', () => {
  it('posts integrity event batches', async () => {
    mocks.post.mockResolvedValue({ data: { recorded: 1 } })
    await recordIntegrityEvents('attempt-1', [{ type: 'TAB_HIDDEN', occurredAt: '2026-11-03T18:00:00Z' }])
    expect(mocks.post).toHaveBeenCalledWith('/student/attempts/attempt-1/integrity-events', {
      events: [{ type: 'TAB_HIDDEN', occurredAt: '2026-11-03T18:00:00Z' }],
    })
  })

  it('uploads the camera check frame as form data and returns the token', async () => {
    mocks.post.mockResolvedValue({ data: { checkToken: 'tok', expiresAt: '2026-11-03T18:10:00Z' } })
    const result = await submitCameraCheck('instance-1', new Blob(['x'], { type: 'image/jpeg' }))
    expect(result.checkToken).toBe('tok')
    const [, form] = mocks.post.mock.calls[0] as [string, FormData]
    expect(form.get('file')).toBeInstanceOf(Blob)
    expect(mocks.post.mock.calls[0][0]).toBe('/student/tests/instance-1/camera-check')
  })

  it('uploads in-attempt snapshots with their reason', async () => {
    mocks.post.mockResolvedValue({ data: {} })
    await uploadSnapshot('attempt-1', new Blob(['x']), 'EVENT')
    const [url, form] = mocks.post.mock.calls[0] as [string, FormData]
    expect(url).toBe('/student/attempts/attempt-1/snapshots')
    expect(form.get('reason')).toBe('EVENT')
  })

  it('fetches a snapshot image as an object url', async () => {
    const blob = new Blob(['img'], { type: 'image/jpeg' })
    mocks.get.mockResolvedValue({ data: blob })
    const create = vi.fn(() => 'blob:mock-url')
    URL.createObjectURL = create
    await expect(fetchSnapshotObjectUrl('attempt-1', 'snap-1')).resolves.toBe('blob:mock-url')
    expect(mocks.get).toHaveBeenCalledWith('/attempts/attempt-1/snapshots/snap-1', { responseType: 'blob' })
    expect(create).toHaveBeenCalledWith(blob)
  })
})

describe('teacher proctor hooks', () => {
  it('loads instance attempts only with an id', async () => {
    mocks.get.mockResolvedValue({ data: [] })
    const qc = client()
    const disabled = renderHook(() => useInstanceAttempts(''), { wrapper: wrapper(qc) })
    expect(disabled.result.current.fetchStatus).toBe('idle')
    const enabled = renderHook(() => useInstanceAttempts('inst-1'), { wrapper: wrapper(qc) })
    await waitFor(() => expect(enabled.result.current.isSuccess).toBe(true))
    expect(mocks.get).toHaveBeenCalledWith('/instances/inst-1/attempts')
  })

  it('gates the timeline and snapshot queries on the enabled flag', async () => {
    mocks.get.mockResolvedValue({ data: [] })
    const qc = client()
    const off = renderHook(() => useAttemptTimeline('a-1', false), { wrapper: wrapper(qc) })
    expect(off.result.current.fetchStatus).toBe('idle')
    const noId = renderHook(() => useAttemptSnapshots('', true), { wrapper: wrapper(qc) })
    expect(noId.result.current.fetchStatus).toBe('idle')
    const on = renderHook(() => useAttemptTimeline('a-1', true), { wrapper: wrapper(qc) })
    await waitFor(() => expect(on.result.current.isSuccess).toBe(true))
    const snaps = renderHook(() => useAttemptSnapshots('a-1', true), { wrapper: wrapper(qc) })
    await waitFor(() => expect(snaps.result.current.isSuccess).toBe(true))
    expect(mocks.get).toHaveBeenCalledWith('/attempts/a-1/integrity-events')
    expect(mocks.get).toHaveBeenCalledWith('/attempts/a-1/snapshots')
  })

  it('invalidates an attempt and refreshes the instance list', async () => {
    mocks.post.mockResolvedValue({ data: { attemptId: 'a-1', status: 'INVALIDATED' } })
    const qc = client()
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useInvalidateAttempt('inst-1'), { wrapper: wrapper(qc) })
    await act(async () => {
      await result.current.mutateAsync('a-1')
    })
    expect(mocks.post).toHaveBeenCalledWith('/attempts/a-1/invalidate')
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['instance-attempts', 'inst-1'] })
  })
})
