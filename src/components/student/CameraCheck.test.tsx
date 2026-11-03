import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CameraCheck from './CameraCheck'

const mocks = vi.hoisted(() => ({ submit: vi.fn(), frame: vi.fn() }))
vi.mock('../../lib/proctor', () => ({ submitCameraCheck: mocks.submit }))
vi.mock('../../lib/camera', () => ({ captureVideoFrame: mocks.frame }))
vi.mock('../../lib/api', () => ({
  getApiErrorMessage: (error: { response?: { data?: { message?: string } } }, fallback: string) => error.response?.data?.message ?? fallback,
}))

function fakeStream() {
  const track = { stop: vi.fn() }
  return { stream: { getTracks: () => [track] }, track }
}
let getUserMedia: ReturnType<typeof vi.fn>

beforeEach(() => {
  mocks.submit.mockReset()
  mocks.frame.mockReset()
  mocks.frame.mockResolvedValue(new Blob(['frame'], { type: 'image/jpeg' }))
  getUserMedia = vi.fn()
  Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia }, configurable: true })
  URL.createObjectURL = vi.fn(() => 'blob:preview')
  URL.revokeObjectURL = vi.fn()
})
afterEach(() => vi.restoreAllMocks())

describe('CameraCheck', () => {
  it('captures, retakes, and passes the token from the confirmed frame', async () => {
    const { stream, track } = fakeStream()
    getUserMedia.mockResolvedValue(stream)
    mocks.submit.mockResolvedValue({ checkToken: 'tok-1', expiresAt: '2026-11-03T18:10:00Z' })
    const onPassed = vi.fn()
    const user = userEvent.setup()
    const { unmount } = render(<CameraCheck instanceId="inst-1" onPassed={onPassed} />)
    expect(screen.getByText(/Snapshots are taken periodically and deleted after 30 days/)).toBeInTheDocument()
    await user.click(await screen.findByRole('button', { name: 'Take photo' }))
    expect(await screen.findByAltText('Your captured camera frame')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retake' }))
    expect(screen.getByRole('button', { name: 'Take photo' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Take photo' }))
    await user.click(await screen.findByRole('button', { name: 'Use this photo and start' }))
    await waitFor(() => expect(onPassed).toHaveBeenCalledWith('tok-1'))
    expect(mocks.submit).toHaveBeenCalledWith('inst-1', expect.any(Blob))
    expect(track.stop).toHaveBeenCalled()
    unmount()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview')
  })

  it('explains a blocked camera and retries on request', async () => {
    getUserMedia.mockRejectedValueOnce(new Error('denied'))
    const { stream } = fakeStream()
    getUserMedia.mockResolvedValue(stream)
    const user = userEvent.setup()
    render(<CameraCheck instanceId="inst-1" onPassed={vi.fn()} />)
    expect(await screen.findByRole('alert')).toHaveTextContent(/Camera access was blocked/)
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('button', { name: 'Take photo' })).toBeInTheDocument()
  })

  it('surfaces capture and upload failures without losing the frame', async () => {
    const { stream } = fakeStream()
    getUserMedia.mockResolvedValue(stream)
    mocks.frame.mockResolvedValueOnce(null)
    const user = userEvent.setup()
    render(<CameraCheck instanceId="inst-1" onPassed={vi.fn()} />)
    await user.click(await screen.findByRole('button', { name: 'Take photo' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/Could not capture a photo/)
    await user.click(screen.getByRole('button', { name: 'Take photo' }))
    mocks.submit.mockRejectedValueOnce({ response: { data: { message: 'Camera is not enabled for this test' } } })
    await user.click(await screen.findByRole('button', { name: 'Use this photo and start' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Camera is not enabled for this test')
    expect(screen.getByRole('button', { name: 'Retake' })).toBeInTheDocument()
  })
})
