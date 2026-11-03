import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCameraCapture } from './useCameraCapture'

const mocks = vi.hoisted(() => ({ upload: vi.fn(), frame: vi.fn() }))
vi.mock('../../lib/proctor', () => ({ uploadSnapshot: mocks.upload }))
vi.mock('../../lib/camera', () => ({ captureVideoFrame: mocks.frame }))

interface FakeTrack extends EventTarget {
  stop: ReturnType<typeof vi.fn>
  kind: string
}
function fakeStream() {
  const track = new EventTarget() as FakeTrack
  track.stop = vi.fn()
  track.kind = 'video'
  return {
    stream: { getTracks: () => [track], getVideoTracks: () => [track] },
    track,
  }
}

let getUserMedia: ReturnType<typeof vi.fn>
beforeEach(() => {
  mocks.upload.mockReset()
  mocks.upload.mockResolvedValue(undefined)
  mocks.frame.mockReset()
  mocks.frame.mockResolvedValue(new Blob(['frame'], { type: 'image/jpeg' }))
  getUserMedia = vi.fn()
  Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia }, configurable: true })
  vi.spyOn(HTMLVideoElement.prototype, 'play').mockResolvedValue(undefined)
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('useCameraCapture', () => {
  it('does nothing while disabled', async () => {
    renderHook(() => useCameraCapture('a-1', false, vi.fn()))
    renderHook(() => useCameraCapture(undefined, true, vi.fn()))
    await act(async () => undefined)
    expect(getUserMedia).not.toHaveBeenCalled()
  })

  it('captures periodically on a jittered cadence and stops the stream on unmount', async () => {
    const { stream, track } = fakeStream()
    getUserMedia.mockResolvedValue(stream)
    const { unmount } = renderHook(() => useCameraCapture('a-1', true, vi.fn()))
    await act(async () => undefined)
    expect(getUserMedia).toHaveBeenCalledWith({ video: true })
    await act(async () => {
      vi.advanceTimersByTime(50_000)
    })
    expect(mocks.frame).toHaveBeenCalled()
    expect(mocks.upload).toHaveBeenCalledWith('a-1', expect.any(Blob), 'PERIODIC')
    unmount()
    expect(track.stop).toHaveBeenCalled()
  })

  it('captures event frames on demand and tolerates failed frames and uploads', async () => {
    const { stream } = fakeStream()
    getUserMedia.mockResolvedValue(stream)
    const { result } = renderHook(() => useCameraCapture('a-1', true, vi.fn()))
    await act(async () => undefined)
    await act(async () => result.current.capture('EVENT'))
    expect(mocks.upload).toHaveBeenCalledWith('a-1', expect.any(Blob), 'EVENT')
    mocks.frame.mockResolvedValueOnce(null)
    await act(async () => result.current.capture('EVENT'))
    expect(mocks.upload).toHaveBeenCalledTimes(1)
    mocks.upload.mockRejectedValueOnce(new Error('network'))
    await act(async () => result.current.capture('EVENT'))
    expect(mocks.upload).toHaveBeenCalledTimes(2)
  })

  it('capture before the stream is ready is a no-op', async () => {
    getUserMedia.mockReturnValue(new Promise(() => undefined))
    const { result } = renderHook(() => useCameraCapture('a-1', true, vi.fn()))
    await act(async () => result.current.capture('PERIODIC'))
    expect(mocks.frame).not.toHaveBeenCalled()
  })

  it('reports the loss exactly once when the track ends', async () => {
    const { stream, track } = fakeStream()
    getUserMedia.mockResolvedValue(stream)
    const onLost = vi.fn()
    renderHook(() => useCameraCapture('a-1', true, onLost))
    await act(async () => undefined)
    act(() => {
      track.dispatchEvent(new Event('ended'))
      track.dispatchEvent(new Event('ended'))
    })
    expect(onLost).toHaveBeenCalledTimes(1)
  })

  it('reports the loss when the camera cannot be opened', async () => {
    getUserMedia.mockRejectedValue(new Error('denied'))
    const onLost = vi.fn()
    renderHook(() => useCameraCapture('a-1', true, onLost))
    await act(async () => undefined)
    expect(onLost).toHaveBeenCalledTimes(1)
  })

  it('stops a stream that arrives after unmount', async () => {
    let resolveStream: (value: unknown) => void = () => undefined
    getUserMedia.mockReturnValue(new Promise((resolve) => { resolveStream = resolve }))
    const { stream, track } = fakeStream()
    const { unmount } = renderHook(() => useCameraCapture('a-1', true, vi.fn()))
    unmount()
    await act(async () => {
      resolveStream(stream)
    })
    expect(track.stop).toHaveBeenCalled()
  })

  it('tolerates a video element whose play() returns nothing', async () => {
    vi.spyOn(HTMLVideoElement.prototype, 'play').mockReturnValue(undefined as unknown as Promise<void>)
    const { stream } = fakeStream()
    getUserMedia.mockResolvedValue(stream)
    renderHook(() => useCameraCapture('a-1', true, vi.fn()))
    await act(async () => undefined)
    await act(async () => {
      vi.advanceTimersByTime(50_000)
    })
    expect(mocks.upload).toHaveBeenCalled()
  })
})
