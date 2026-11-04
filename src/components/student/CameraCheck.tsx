import { useCallback, useEffect, useRef, useState } from 'react'
import { getApiErrorMessage } from '../../lib/api'
import { captureVideoFrame } from '../../lib/camera'
import { submitCameraCheck } from '../../lib/proctor'

type Phase = 'starting' | 'ready' | 'captured' | 'uploading' | 'denied'

/**
 * Pre-test camera check for camera-ON tests: live preview, one captured
 * frame, retake, then the frame is uploaded and the returned check token
 * unlocks the start. The stream is stopped as soon as the check completes.
 */
export default function CameraCheck({ instanceId, onPassed }: { instanceId: string; onPassed: (checkToken: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const frameRef = useRef<Blob | null>(null)
  const [phase, setPhase] = useState<Phase>('starting')
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState('')

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const startCamera = useCallback(async () => {
    setPhase('starting')
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setPhase('ready')
    } catch {
      setPhase('denied')
    }
  }, [])

  useEffect(() => {
    void startCamera()
    return stopStream
  }, [startCamera, stopStream])

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const takePhoto = async () => {
    // The preview video is mounted in every phase that shows this button.
    const blob = await captureVideoFrame(videoRef.current as HTMLVideoElement)
    if (!blob) {
      setError('Could not capture a photo. Please try again.')
      return
    }
    frameRef.current = blob
    setPreview(URL.createObjectURL(blob))
    setPhase('captured')
  }

  const retake = () => {
    frameRef.current = null
    setPreview(null)
    setError('')
    setPhase('ready')
  }

  const confirm = async () => {
    // The confirm button only renders in the captured phase, which is only
    // reachable after a frame has been stored.
    const frame = frameRef.current as Blob
    setPhase('uploading')
    setError('')
    try {
      const result = await submitCameraCheck(instanceId, frame)
      stopStream()
      onPassed(result.checkToken)
    } catch (uploadError) {
      setError(getApiErrorMessage(uploadError, 'Could not save the camera check. Please try again.'))
      setPhase('captured')
    }
  }

  return (
    <section aria-label="Camera check" className="mx-auto max-w-xl">
      <h1 className="font-display text-2xl font-bold">Camera check</h1>
      <p className="mt-3 rounded-xl bg-indigo-primary/5 p-4 text-sm text-ink/75">
        Your teacher turned camera checks on for this test. Snapshots are taken periodically and deleted after 30 days.
      </p>
      {phase === 'denied' ? (
        <div className="mt-6">
          <p role="alert" className="text-rose-weak">Camera access was blocked. Allow camera access in your browser, then try again.</p>
          <button type="button" onClick={() => void startCamera()} className="mt-4 rounded-full bg-indigo-primary px-6 py-3 font-bold text-white">Try again</button>
        </div>
      ) : (
        <>
          <div className="mt-6 overflow-hidden rounded-2xl bg-ink">
            {phase === 'captured' && preview ? (
              <img src={preview} alt="Your captured camera frame" className="aspect-video w-full object-cover" />
            ) : (
              <video ref={videoRef} aria-label="Camera preview" autoPlay playsInline muted className="aspect-video w-full object-cover" />
            )}
          </div>
          {error && <p role="alert" className="mt-3 text-rose-weak">{error}</p>}
          <div className="mt-5 flex gap-3">
            {phase === 'ready' && (
              <button type="button" onClick={() => void takePhoto()} className="rounded-full bg-indigo-primary px-6 py-3 font-bold text-white">Take photo</button>
            )}
            {phase === 'starting' && <p className="text-sm text-ink/60">Starting your camera…</p>}
            {(phase === 'captured' || phase === 'uploading') && (
              <>
                <button type="button" disabled={phase === 'uploading'} onClick={() => void confirm()} className="rounded-full bg-indigo-primary px-6 py-3 font-bold text-white disabled:opacity-50">
                  {phase === 'uploading' ? 'Checking…' : 'Use this photo and start'}
                </button>
                <button type="button" disabled={phase === 'uploading'} onClick={retake} className="rounded-full border border-card-border px-6 py-3 font-bold disabled:opacity-50">Retake</button>
              </>
            )}
          </div>
        </>
      )}
    </section>
  )
}
