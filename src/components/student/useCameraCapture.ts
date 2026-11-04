import { useCallback, useEffect, useRef } from 'react'
import { captureVideoFrame } from '../../lib/camera'
import { uploadSnapshot } from '../../lib/proctor'

/**
 * Keeps the camera open during a camera-ON attempt and uploads a still frame
 * about every 45 seconds (jittered) plus on demand via the returned capture
 * (used for integrity-event frames). If the stream ends or cannot be opened,
 * onLost fires exactly once so the attempt can be flagged CAMERA_LOST — the
 * test itself always continues.
 */
export function useCameraCapture(attemptId: string | undefined, enabled: boolean, onLost: () => void) {
  const streamRef = useRef<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const lostRef = useRef(false)
  const onLostRef = useRef(onLost)
  useEffect(() => {
    onLostRef.current = onLost
  }, [onLost])

  const capture = useCallback(
    async (reason: 'PERIODIC' | 'EVENT') => {
      const stream = streamRef.current
      const video = videoRef.current
      if (!attemptId || !stream || !video) return
      const blob = await captureVideoFrame(video)
      if (!blob) return
      try {
        await uploadSnapshot(attemptId, blob, reason)
      } catch {
        // A failed frame is not fatal; the next cadence or event tries again.
      }
    },
    [attemptId],
  )

  useEffect(() => {
    if (!enabled || !attemptId) return
    let cancelled = false
    let timer = 0
    const markLost = () => {
      if (lostRef.current) return
      lostRef.current = true
      onLostRef.current()
    }
    const schedule = () => {
      timer = window.setTimeout(
        () => {
          void capture('PERIODIC').then(schedule)
        },
        45_000 + Math.floor(Math.random() * 10_000) - 5_000,
      )
    }
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        const video = document.createElement('video')
        video.muted = true
        video.playsInline = true
        video.srcObject = stream
        videoRef.current = video
        const played = video.play() as unknown
        if (played && typeof (played as Promise<void>).catch === 'function') {
          ;(played as Promise<void>).catch(() => undefined)
        }
        stream.getVideoTracks().forEach((track) => track.addEventListener('ended', markLost))
        schedule()
      } catch {
        markLost()
      }
    }
    void start()
    return () => {
      cancelled = true
      window.clearTimeout(timer)
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      videoRef.current = null
    }
  }, [attemptId, enabled, capture])

  return { capture }
}
