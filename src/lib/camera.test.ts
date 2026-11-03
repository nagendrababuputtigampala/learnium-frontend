import { afterEach, describe, expect, it, vi } from 'vitest'
import { captureVideoFrame } from './camera'

function stubCanvas(context: unknown, blob: Blob | null = new Blob(['jpeg'], { type: 'image/jpeg' })) {
  const drawImage = vi.fn()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    context === null ? null : ({ drawImage } as unknown as CanvasRenderingContext2D),
  )
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => callback(blob))
  return drawImage
}

function video(width: number, height: number) {
  const element = document.createElement('video')
  Object.defineProperty(element, 'videoWidth', { value: width })
  Object.defineProperty(element, 'videoHeight', { value: height })
  return element
}

afterEach(() => vi.restoreAllMocks())

describe('captureVideoFrame', () => {
  it('draws the frame at the video size and returns the jpeg blob', async () => {
    const drawImage = stubCanvas({})
    const blob = await captureVideoFrame(video(320, 240))
    expect(blob?.type).toBe('image/jpeg')
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 320, 240)
  })

  it('falls back to 640x480 before the stream knows its size', async () => {
    const drawImage = stubCanvas({})
    await captureVideoFrame(video(0, 0))
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 640, 480)
  })

  it('returns null when no 2d context is available', async () => {
    stubCanvas(null)
    await expect(captureVideoFrame(video(10, 10))).resolves.toBeNull()
  })
})
