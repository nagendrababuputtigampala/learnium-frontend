/** Draws the current frame of a video element to a JPEG blob (a still image — never a recording). */
export function captureVideoFrame(video: HTMLVideoElement): Promise<Blob | null> {
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth || 640
  canvas.height = video.videoHeight || 480
  const context = canvas.getContext('2d')
  if (!context) return Promise.resolve(null)
  context.drawImage(video, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.7))
}
