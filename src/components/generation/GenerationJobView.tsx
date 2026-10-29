import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import {
  getApiErrorMessage,
  type GenerationJobDetailDto,
  type GenerationTypeResult,
  type QuestionTypeCode,
} from '../../lib/api'
import { useAuth } from '../../lib/auth'
import {
  MAX_GENERATION_ATTEMPTS,
  QUESTION_TYPE_ORDER,
  dropReasonLabel,
  failureKindInfo,
  generationJobPhase,
  useGenerationJob,
} from '../../lib/generation'
import QuestionTypeChip from './QuestionTypeChip'

function droppedCell(result: GenerationTypeResult) {
  const reasons = Object.entries(result.dropReasons)
  if (result.dropped === 0 || reasons.length === 0) {
    return <>{result.dropped}</>
  }
  const detail = reasons
    .map(([code, count]) => `${dropReasonLabel(code)} ×${count}`)
    .join(', ')
  return (
    <>
      {result.dropped}{' '}
      <span className="text-ink/60">({detail})</span>
    </>
  )
}

function ResultCountsTable({ job }: { job: GenerationJobDetailDto }) {
  const resultCounts = job.resultCounts
  if (resultCounts === null) {
    return null
  }
  const rows = QUESTION_TYPE_ORDER.filter((type) => {
    const result = resultCounts[type]
    return (
      result !== undefined && (result.requested > 0 || result.received > 0)
    )
  })
  if (rows.length === 0) {
    return null
  }
  return (
    <table className="mt-4 w-full text-left text-sm">
      <thead>
        <tr className="border-b border-card-border text-ink/60">
          <th scope="col" className="py-1.5 pr-2 font-medium">
            Type
          </th>
          <th scope="col" className="py-1.5 pr-2 font-medium">
            Requested
          </th>
          <th scope="col" className="py-1.5 pr-2 font-medium">
            Received
          </th>
          <th scope="col" className="py-1.5 pr-2 font-medium">
            Accepted
          </th>
          <th scope="col" className="py-1.5 font-medium">
            Dropped
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((type) => {
          const result = resultCounts[type] as GenerationTypeResult
          return (
            <tr key={type} className="border-b border-card-border/60">
              <td className="py-1.5 pr-2">
                <QuestionTypeChip type={type} />
              </td>
              <td className="py-1.5 pr-2">{result.requested}</td>
              <td className="py-1.5 pr-2">{result.received}</td>
              <td className="py-1.5 pr-2">{result.accepted}</td>
              <td className="py-1.5">{droppedCell(result)}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function UsageLine({ job }: { job: GenerationJobDetailDto }) {
  const parts: string[] = []
  if (job.usageInputTokens !== null) {
    parts.push(`${job.usageInputTokens.toLocaleString()} input tokens`)
  }
  if (job.usageOutputTokens !== null) {
    parts.push(`${job.usageOutputTokens.toLocaleString()} output tokens`)
  }
  if (job.usageThinkingTokens !== null) {
    parts.push(`${job.usageThinkingTokens.toLocaleString()} thinking tokens`)
  }
  if (parts.length === 0) {
    return null
  }
  return <p className="mt-3 text-xs text-ink/60">Token usage: {parts.join(' · ')}</p>
}

export default function GenerationJobView({
  jobId,
  onViewDrafts,
}: {
  jobId: string
  onViewDrafts: () => void
}) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const jobQuery = useGenerationJob(jobId)
  const job = jobQuery.data

  // A finished job may have added drafts: refresh the preview list.
  useEffect(() => {
    if (job?.status === 'SUCCEEDED') {
      void queryClient.invalidateQueries({
        queryKey: ['materials', user?.centreId, 'questions', job.materialId],
      })
    }
  }, [job?.status, job?.materialId, user?.centreId, queryClient])

  if (job === undefined) {
    return jobQuery.isError ? (
      <p role="alert" className="text-sm text-rose-weak">
        {getApiErrorMessage(
          jobQuery.error,
          'Could not load the generation status.',
        )}
      </p>
    ) : (
      <p className="text-sm text-ink/60">Checking generation status…</p>
    )
  }

  const phase = generationJobPhase(job)
  const counts = job.resultCounts
  const totalAccepted =
    counts === null
      ? null
      : QUESTION_TYPE_ORDER.reduce(
          (sum, type: QuestionTypeCode) =>
            sum + (counts[type]?.accepted ?? 0),
          0,
        )
  const totalRequested =
    counts === null
      ? null
      : QUESTION_TYPE_ORDER.reduce(
          (sum, type: QuestionTypeCode) =>
            sum + (counts[type]?.requested ?? 0),
          0,
        )

  return (
    <div>
      {phase === 'queued' && (
        <p className="rounded-lg bg-paper px-3 py-2 text-sm">
          Queued — generation will start shortly.
        </p>
      )}

      {phase === 'running' && (
        <div className="rounded-lg bg-paper px-3 py-2 text-sm">
          <p>Generating questions from this chapter…</p>
          {job.attempts >= 1 && (
            <p className="mt-1 text-ink/60">
              Attempt {job.attempts} of {MAX_GENERATION_ATTEMPTS}
            </p>
          )}
        </div>
      )}

      {phase === 'retrying' && (
        <div className="rounded-lg bg-marigold/15 px-3 py-2 text-sm">
          <p className="font-semibold">One attempt didn’t work</p>
          <p className="mt-1">
            {failureKindInfo(job.failureKind).headline}.{' '}
            {failureKindInfo(job.failureKind).explanation}
          </p>
          <p className="mt-1 text-ink/60">
            {job.status === 'RUNNING'
              ? `Retrying now — attempt ${job.attempts} of ${MAX_GENERATION_ATTEMPTS}.`
              : 'It will retry automatically.'}
          </p>
        </div>
      )}

      {phase === 'succeeded' && (
        <div className="rounded-lg bg-emerald-progress/10 px-3 py-2 text-sm">
          <p className="font-semibold text-emerald-progress">
            Generation complete
          </p>
          <p className="mt-1">
            {totalAccepted !== null && totalRequested !== null
              ? `${totalAccepted} of ${totalRequested} requested questions are ready as drafts.`
              : 'The new drafts are ready below.'}
          </p>
          <button
            type="button"
            onClick={onViewDrafts}
            className="mt-3 rounded-full bg-marigold px-4 py-1.5 text-sm font-semibold text-ink transition hover:brightness-95"
          >
            View drafts
          </button>
        </div>
      )}

      {phase === 'failed' && (
        <div className="rounded-lg bg-rose-weak/10 px-3 py-2 text-sm text-rose-weak">
          <p className="font-semibold">
            {failureKindInfo(job.failureKind).headline}
          </p>
          <p className="mt-1">
            {failureKindInfo(job.failureKind).explanation}
          </p>
        </div>
      )}

      <ResultCountsTable job={job} />
      <UsageLine job={job} />
    </div>
  )
}
