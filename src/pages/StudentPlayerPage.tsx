/* oxlint-disable react/set-state-in-effect -- hydrate resumable server state when the query resolves. */
import { useMutation, useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import CameraCheck from '../components/student/CameraCheck'
import { useCameraCapture } from '../components/student/useCameraCapture'
import { useIntegrityMonitor } from '../components/student/useIntegrityMonitor'
import { apiClient, getApiErrorMessage, type AttemptItem, type StudentAttempt } from '../lib/api'

type Answer = { optionId?: string; text?: string; number?: number }
const text = (value: unknown) => typeof value === 'string' ? value : ''
const object = (value: unknown): Record<string, unknown> => typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}

function Question({ item, answer, change, blur }: { item: AttemptItem; answer: Answer; change: (value: Answer) => void; blur: () => void }) {
  const payload = object(item.payload)
  if (item.type === 'MCQ') {
    const options = Array.isArray(payload.options) ? payload.options.map(object) : []
    return <div className="space-y-3">{options.map((option) => <label key={text(option.id)} className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${answer.optionId === option.id ? 'border-indigo-primary bg-indigo-primary/5' : 'border-card-border'}`}><input type="radio" name={item.itemId} checked={answer.optionId === option.id} onChange={() => change({ optionId: text(option.id) })} /><span>{text(option.text)}</span></label>)}</div>
  }
  if (item.type === 'NUMERIC') return <input aria-label="Numeric answer" type="number" value={answer.number ?? ''} onChange={(event) => change(event.target.value === '' ? {} : { number: Number(event.target.value) })} onBlur={blur} className="w-full rounded-xl border border-card-border p-3" />
  return <textarea aria-label="Written answer" rows={item.type === 'WRITTEN' ? 8 : 3} value={answer.text ?? ''} onChange={(event) => change({ text: event.target.value })} onBlur={blur} className="w-full rounded-xl border border-card-border p-3" />
}

export default function StudentPlayerPage() {
  const { instanceId = '' } = useParams(); const navigate = useNavigate()
  const [index, setIndex] = useState(0); const [review, setReview] = useState(false)
  const [answers, setAnswers] = useState<Record<string, Answer>>({}); const [seconds, setSeconds] = useState(0)
  const [checkToken, setCheckToken] = useState<string | null>(null); const [needsCheck, setNeedsCheck] = useState(false)
  const attempt = useQuery({ queryKey: ['student-attempt', instanceId, checkToken], retry: false, queryFn: async () => (await apiClient.post<StudentAttempt>(`/student/tests/${instanceId}/attempts`, { cameraCheckToken: checkToken })).data })
  useEffect(() => {
    const code = (attempt.error as { response?: { data?: { code?: string } } } | null)?.response?.data?.code
    if (code === 'LRN-ATT-004') { setCheckToken(null); setNeedsCheck(true) }
  }, [attempt.error])
  const monitor = useIntegrityMonitor(attempt.data?.attemptId, attempt.data?.integritySignalsOn === true)
  const reportCameraLost = monitor.report
  const onCameraLost = useCallback(() => reportCameraLost('CAMERA_LOST'), [reportCameraLost])
  const camera = useCameraCapture(attempt.data?.attemptId, attempt.data !== undefined && attempt.data.cameraMode !== 'OFF', onCameraLost)
  useEffect(() => { if (monitor.eventSeq > 0) void camera.capture('EVENT') }, [monitor.eventSeq, camera.capture])
  useEffect(() => { if (!attempt.data) return; setAnswers(Object.fromEntries(attempt.data.answers.map((saved) => [saved.itemId, saved.answer]))); setSeconds(Math.max(0, Math.floor((new Date(attempt.data.deadlineAt).getTime() - Date.now()) / 1000))) }, [attempt.data])
  useEffect(() => { const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000); return () => window.clearInterval(timer) }, [])
  const save = useMutation({ mutationFn: async ({ itemId, answer }: { itemId: string; answer: Answer }) => apiClient.put(`/student/attempts/${attempt.data?.attemptId}/answers/${itemId}`, { answer }) })
  const submit = useMutation({ mutationFn: async () => (await apiClient.post<{ attemptId: string }>(`/student/attempts/${attempt.data?.attemptId}/submit`)).data, onSuccess: (result) => navigate(`/student/attempts/${result.attemptId}/result`, { replace: true }) })
  const answered = useMemo(() => new Set(Object.entries(answers).filter(([, value]) => value.optionId || value.text?.trim() || value.number !== undefined).map(([id]) => id)), [answers])
  if (needsCheck) return <Shell><CameraCheck instanceId={instanceId} onPassed={(token) => { setNeedsCheck(false); setCheckToken(token) }} /></Shell>
  if (attempt.isPending) return <Shell><p>Preparing your test…</p></Shell>
  if (attempt.isError || !attempt.data) return <Shell><p role="alert" className="text-rose-weak">{getApiErrorMessage(attempt.error, 'Could not start this test.')}</p></Shell>
  const items = attempt.data.items; const item = items[index]
  const persist = (target = item) => { const value = answers[target.itemId]; if (value && (value.optionId || value.text !== undefined || value.number !== undefined)) save.mutate({ itemId: target.itemId, answer: value }) }
  const next = () => { persist(); if (index === items.length - 1) setReview(true); else setIndex(index + 1) }
  const heading = item ? text(item.payload.stem ?? item.payload.stemWithBlank) : ''
  return <Shell>
    <header className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-bold text-indigo-primary">Attempt {attempt.data.attemptNo}</p><h1 className="font-display text-2xl font-bold">{attempt.data.definitionName}</h1></div><div aria-label="Time remaining" className="rounded-full bg-marigold/25 px-4 py-2 font-mono font-bold">{String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</div></header>
    <p role="status" className="mt-3 text-sm text-ink/60">{save.isPending ? 'Saving…' : save.isError ? 'Autosave failed' : save.isSuccess ? 'Saved' : 'Answers save as you continue'}</p>
    {monitor.warning && <p role="alert" className="mt-3 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">This was flagged to your teacher.</p>}
    {review ? <section className="mt-8"><h2 className="font-display text-xl font-bold">Review your answers</h2><p className="mt-2 text-ink/60">Check unanswered questions before submitting.</p><ul className="mt-4 space-y-2">{items.map((question, position) => <li key={question.itemId}><button type="button" onClick={() => { setIndex(position); setReview(false) }} className={`w-full rounded-xl border p-3 text-left ${answered.has(question.itemId) ? 'border-emerald-progress/40' : 'border-amber-500 bg-amber-50'}`}>Question {position + 1} — {answered.has(question.itemId) ? 'Answered' : 'Unanswered'}</button></li>)}</ul><button type="button" disabled={submit.isPending} onClick={async () => { await monitor.flush(); submit.mutate() }} className="mt-6 rounded-full bg-indigo-primary px-6 py-3 font-bold text-white disabled:opacity-50">{submit.isPending ? 'Submitting…' : 'Submit test'}</button>{submit.isError && <p role="alert" className="mt-3 text-rose-weak">{getApiErrorMessage(submit.error, 'Could not submit the test.')}</p>}</section> : item && <section className="mt-8"><div className="flex gap-2 overflow-auto pb-3" aria-label="Question navigator">{items.map((question, position) => <button key={question.itemId} type="button" aria-label={`Question ${position + 1}${answered.has(question.itemId) ? ', answered' : ''}`} onClick={() => { persist(); setIndex(position) }} className={`h-10 w-10 shrink-0 rounded-full font-bold ${position === index ? 'bg-indigo-primary text-white' : answered.has(question.itemId) ? 'bg-emerald-progress/20 text-emerald-800' : 'bg-paper'}`}>{position + 1}</button>)}</div><p className="mt-5 text-sm font-bold uppercase tracking-wide text-indigo-primary">Question {index + 1} of {items.length} · {item.marks} marks</p><h2 className="mt-2 font-display text-xl font-bold">{heading}</h2><div className="mt-5"><Question item={item} answer={answers[item.itemId] ?? {}} change={(value) => { setAnswers((current) => ({ ...current, [item.itemId]: value })); if (item.type === 'MCQ') save.mutate({ itemId: item.itemId, answer: value }) }} blur={() => persist()} /></div><button type="button" onClick={next} className="mt-6 rounded-full bg-indigo-primary px-6 py-3 font-bold text-white">{index === items.length - 1 ? 'Save and review' : 'Save and next'}</button></section>}
  </Shell>
}

function Shell({ children }: { children: React.ReactNode }) { return <div className="min-h-screen bg-gradient-to-br from-indigo-primary to-violet-500 p-4 md:p-8"><main className="mx-auto max-w-4xl rounded-3xl bg-white p-6 shadow-xl md:p-9">{children}</main></div> }
