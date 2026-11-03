import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ApiFailure from '../components/tests/ApiFailure'
import type { MarkingCriterion, MarkingDetail } from '../lib/api'
import { useConfirmMarking, useMarkingDetail, useRerunMarking } from '../lib/marking'

function rubricFrom(payload: Record<string, unknown>): MarkingCriterion[] {
  if (!Array.isArray(payload.rubric)) return []
  return payload.rubric.filter((value): value is MarkingCriterion => {
    if (typeof value !== 'object' || value === null) return false
    const item = value as Record<string, unknown>
    return typeof item.id === 'string' && typeof item.criterion === 'string' && typeof item.maxScore === 'number'
  })
}

function suggestedScores(value: unknown): Record<string, string> {
  if (typeof value !== 'object' || value === null) return {}
  const criteria = (value as Record<string, unknown>).criteria
  if (Array.isArray(criteria)) return Object.fromEntries(criteria.flatMap(entry => {
    if (typeof entry !== 'object' || entry === null) return []
    const item = entry as Record<string, unknown>
    return typeof item.criterionId === 'string' && typeof item.score === 'number' ? [[item.criterionId, String(item.score)]] : []
  }))
  if (typeof criteria !== 'object' || criteria === null) return {}
  return Object.fromEntries(Object.entries(criteria).flatMap(([id, entry]) => {
    if (typeof entry !== 'object' || entry === null) return []
    const score = (entry as Record<string, unknown>).score
    return typeof score === 'number' ? [[id, String(score)]] : []
  }))
}

export default function MarkingDetailPage() {
  const { questionAttemptId = '' } = useParams()
  const detail = useMarkingDetail(questionAttemptId)
  const confirm = useConfirmMarking(questionAttemptId)
  const rerun = useRerunMarking(questionAttemptId)
  if (detail.isPending) return <p>Loading written answer…</p>
  if (detail.isError) return <ApiFailure error={detail.error} fallback="Could not load this written answer." />
  const item = detail.data
  if (item.confirmedScore !== null) return <div className="mx-auto max-w-4xl space-y-5"><Link className="font-semibold text-indigo-primary" to="/marking">Back to marking queue</Link><h1 className="font-display text-2xl font-bold">Mark confirmed</h1><p className="rounded-2xl border border-card-border bg-white p-6">{item.studentName} received <strong>{item.confirmedScore.toFixed(2)} / {item.marks.toFixed(2)}</strong>.</p></div>
  return <MarkingForm key={`${item.questionAttemptId}-${item.suggestionState}-${JSON.stringify(item.aiBreakdown)}`} item={item} confirm={confirm} rerun={rerun} />
}

function MarkingForm({ item, confirm, rerun }: {
  item: MarkingDetail
  confirm: ReturnType<typeof useConfirmMarking>
  rerun: ReturnType<typeof useRerunMarking>
}) {
  const rubric = useMemo(() => rubricFrom(item.payload), [item.payload])
  const [scores, setScores] = useState<Record<string, string>>(() => suggestedScores(item.aiBreakdown))
  const [feedback, setFeedback] = useState(item.aiFeedback ?? '')
  const values = rubric.map(item => Number(scores[item.id]))
  const valid = rubric.length > 0 && values.every((score, index) => Number.isFinite(score) && score >= 0 && score <= rubric[index].maxScore) && feedback.length <= 4000
  const rubricTotal = rubric.reduce((total, item) => total + item.maxScore, 0)
  const criterionTotal = valid ? values.reduce((total, score) => total + score, 0) : 0
  const scaled = rubricTotal === 0 ? 0 : criterionTotal * item.marks / rubricTotal
  const displayedScore = Math.round((scaled + Number.EPSILON) * 100) / 100
  return <div className="mx-auto max-w-4xl space-y-6">
    <Link className="font-semibold text-indigo-primary" to="/marking">Back to marking queue</Link>
    <header><h1 className="font-display text-2xl font-bold">Mark {item.studentName}'s answer</h1><p className="mt-2 text-sm text-ink/60">{item.testName} · {item.batchName} · {item.marks.toFixed(2)} marks</p></header>
    <section className="space-y-4 rounded-2xl border border-card-border bg-white p-6"><div><h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">Question</h2><p className="mt-2">{typeof item.payload.stem === 'string' ? item.payload.stem : 'Written response'}</p></div><div><h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">Student answer</h2><p className="mt-2 whitespace-pre-wrap">{typeof item.answer.text === 'string' ? item.answer.text : 'No written answer.'}</p></div></section>
    {item.suggestionState === 'READY' && <p className="rounded-xl bg-indigo-tint p-4 text-sm"><strong>AI suggestion ready.</strong> Review every criterion before confirming. {item.aiFeedback}</p>}
    {item.suggestionState === 'MARKING' && <p className="rounded-xl bg-indigo-tint p-4 text-sm">AI marking is still in progress. You can enter marks manually now.</p>}
    {item.suggestionState === 'NONE' && <p className="rounded-xl bg-paper p-4 text-sm">No AI suggestion is available. Enter marks manually.</p>}
    {item.suggestionState === 'FAILED' && <div className="flex items-center justify-between gap-4 rounded-xl bg-rose-50 p-4 text-sm"><span>AI marking failed. You can mark manually or request another run.</span><button className="font-semibold text-indigo-primary disabled:opacity-50" disabled={rerun.isPending} onClick={() => rerun.mutate()}>Run AI marking again</button></div>}
    <form className="space-y-5 rounded-2xl border border-card-border bg-white p-6" onSubmit={event => { event.preventDefault(); if (valid) confirm.mutate({ criteria: rubric.map((criterion, index) => ({ criterionId: criterion.id, score: values[index] })), feedback }) }}>
      <h2 className="font-display text-lg font-bold">Rubric</h2>
      {rubric.map(criterion => <label className="grid gap-2 sm:grid-cols-[1fr_10rem] sm:items-center" key={criterion.id}><span>{criterion.criterion} <span className="text-sm text-ink/50">(max {criterion.maxScore})</span></span><input aria-label={`${criterion.criterion} score`} className="rounded-lg border border-card-border p-2" type="number" min="0" max={criterion.maxScore} step="0.01" value={scores[criterion.id] ?? ''} onChange={event => setScores(current => ({ ...current, [criterion.id]: event.target.value }))} /></label>)}
      <label className="block">Feedback<textarea className="mt-2 block min-h-28 w-full rounded-lg border border-card-border p-3" maxLength={4000} value={feedback} onChange={event => setFeedback(event.target.value)} /></label>
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-card-border pt-5"><p className="font-display text-lg font-bold">Final mark: {displayedScore.toFixed(2)} / {item.marks.toFixed(2)}</p><button className="rounded-full bg-indigo-primary px-5 py-2 font-semibold text-white disabled:opacity-50" disabled={!valid || confirm.isPending} type="submit">Confirm mark</button></div>
      {confirm.isError && <ApiFailure error={confirm.error} fallback="Could not confirm this mark." />}
      {rerun.isError && <ApiFailure error={rerun.error} fallback="Could not rerun AI marking." />}
    </form>
  </div>
}
