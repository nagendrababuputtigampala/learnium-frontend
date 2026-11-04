import { useCallback, useEffect, useRef, useState } from 'react'
import { recordIntegrityEvents, type IntegrityEventType } from '../../lib/proctor'

/**
 * Watches the exam-integrity signals while an attempt runs: buffers events,
 * flushes them to the server every 10 seconds (and on unmount / submit via
 * the returned flush), and surfaces a transient warning for the student.
 * Events are flags for the teacher — nothing here blocks or submits the test.
 */
export function useIntegrityMonitor(attemptId: string | undefined, enabled: boolean) {
  const buffer = useRef<{ type: IntegrityEventType; occurredAt: string }[]>([])
  const [warning, setWarning] = useState(false)
  const [eventSeq, setEventSeq] = useState(0)

  const flush = useCallback(async () => {
    if (!attemptId || buffer.current.length === 0) return
    const events = buffer.current.splice(0, buffer.current.length)
    try {
      await recordIntegrityEvents(attemptId, events)
    } catch {
      buffer.current.unshift(...events)
    }
  }, [attemptId])

  const report = useCallback(
    (type: IntegrityEventType) => {
      if (!enabled || !attemptId) return
      buffer.current.push({ type, occurredAt: new Date().toISOString() })
      setWarning(true)
      setEventSeq((seq) => seq + 1)
      if (buffer.current.length >= 20) void flush()
    },
    [attemptId, enabled, flush],
  )

  useEffect(() => {
    if (!warning) return
    const timer = window.setTimeout(() => setWarning(false), 4000)
    return () => window.clearTimeout(timer)
  }, [warning])

  useEffect(() => {
    if (!enabled || !attemptId) return
    if (document.fullscreenEnabled && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => undefined)
    }
    const onVisibility = () => {
      if (document.hidden) report('TAB_HIDDEN')
    }
    const onBlur = () => report('FOCUS_LOST')
    const onMouseLeave = () => report('MOUSE_LEFT')
    const onFullscreen = () => {
      if (!document.fullscreenElement) report('FULLSCREEN_EXIT')
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', onBlur)
    document.documentElement.addEventListener('mouseleave', onMouseLeave)
    document.addEventListener('fullscreenchange', onFullscreen)
    const interval = window.setInterval(() => {
      void flush()
    }, 10_000)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', onBlur)
      document.documentElement.removeEventListener('mouseleave', onMouseLeave)
      document.removeEventListener('fullscreenchange', onFullscreen)
      window.clearInterval(interval)
      void flush()
    }
  }, [attemptId, enabled, report, flush])

  return { report, flush, warning, eventSeq }
}
