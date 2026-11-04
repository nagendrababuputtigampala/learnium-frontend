import { act, fireEvent, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useIntegrityMonitor } from './useIntegrityMonitor'

const mocks = vi.hoisted(() => ({ record: vi.fn() }))
vi.mock('../../lib/proctor', () => ({ recordIntegrityEvents: mocks.record }))

function setHidden(hidden: boolean) {
  Object.defineProperty(document, 'hidden', { value: hidden, configurable: true })
  fireEvent(document, new Event('visibilitychange'))
}

beforeEach(() => {
  mocks.record.mockReset()
  mocks.record.mockResolvedValue(undefined)
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
  setHidden(false)
})

describe('useIntegrityMonitor', () => {
  it('does nothing while disabled or without an attempt', async () => {
    const disabled = renderHook(() => useIntegrityMonitor('a-1', false))
    act(() => disabled.result.current.report('TAB_HIDDEN'))
    await act(async () => disabled.result.current.flush())
    const noAttempt = renderHook(() => useIntegrityMonitor(undefined, true))
    act(() => noAttempt.result.current.report('TAB_HIDDEN'))
    expect(mocks.record).not.toHaveBeenCalled()
    expect(disabled.result.current.warning).toBe(false)
  })

  it('buffers listener events, warns, and flushes on the interval', async () => {
    const { result, unmount } = renderHook(() => useIntegrityMonitor('a-1', true))
    setHidden(true)
    fireEvent(window, new Event('blur'))
    fireEvent(document.documentElement, new Event('mouseleave'))
    expect(result.current.warning).toBe(true)
    expect(result.current.eventSeq).toBe(3)
    expect(mocks.record).not.toHaveBeenCalled()
    await act(async () => {
      vi.advanceTimersByTime(10_000)
    })
    expect(mocks.record).toHaveBeenCalledTimes(1)
    const [, events] = mocks.record.mock.calls[0]
    expect(events.map((event: { type: string }) => event.type)).toEqual(['TAB_HIDDEN', 'FOCUS_LOST', 'MOUSE_LEFT'])
    unmount()
  })

  it('ignores a visible tab and a fullscreen state that is still active', () => {
    renderHook(() => useIntegrityMonitor('a-1', true))
    setHidden(false)
    Object.defineProperty(document, 'fullscreenElement', { value: document.documentElement, configurable: true })
    fireEvent(document, new Event('fullscreenchange'))
    act(() => {
      vi.advanceTimersByTime(10_000)
    })
    expect(mocks.record).not.toHaveBeenCalled()
  })

  it('reports fullscreen exit and clears the warning after four seconds', () => {
    const { result } = renderHook(() => useIntegrityMonitor('a-1', true))
    Object.defineProperty(document, 'fullscreenElement', { value: null, configurable: true })
    fireEvent(document, new Event('fullscreenchange'))
    expect(result.current.warning).toBe(true)
    act(() => {
      vi.advanceTimersByTime(4000)
    })
    expect(result.current.warning).toBe(false)
  })

  it('requests fullscreen when the browser allows it and tolerates refusal', async () => {
    Object.defineProperty(document, 'fullscreenEnabled', { value: true, configurable: true })
    Object.defineProperty(document, 'fullscreenElement', { value: null, configurable: true })
    const request = vi.fn().mockRejectedValue(new Error('needs a gesture'))
    Object.defineProperty(document.documentElement, 'requestFullscreen', { value: request, configurable: true })
    renderHook(() => useIntegrityMonitor('a-1', true))
    expect(request).toHaveBeenCalled()
    Object.defineProperty(document, 'fullscreenEnabled', { value: false, configurable: true })
  })

  it('flushes immediately at twenty buffered events and requeues failures', async () => {
    const { result } = renderHook(() => useIntegrityMonitor('a-1', true))
    mocks.record.mockRejectedValueOnce(new Error('offline'))
    await act(async () => {
      for (let i = 0; i < 20; i++) result.current.report('FOCUS_LOST')
    })
    expect(mocks.record).toHaveBeenCalledTimes(1)
    await act(async () => result.current.flush())
    expect(mocks.record).toHaveBeenCalledTimes(2)
    expect(mocks.record.mock.calls[1][1]).toHaveLength(20)
  })

  it('flushes what remains on unmount', async () => {
    const { result, unmount } = renderHook(() => useIntegrityMonitor('a-1', true))
    act(() => result.current.report('TAB_HIDDEN'))
    unmount()
    expect(mocks.record).toHaveBeenCalledTimes(1)
  })
})
