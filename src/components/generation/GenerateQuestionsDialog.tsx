import { useState, type FormEvent } from 'react'
import {
  getApiErrorMessage,
  type GenerationDifficulty,
  type MaterialDetailDto,
  type QuestionTypeCode,
} from '../../lib/api'
import {
  MAX_QUESTIONS_PER_JOB,
  QUESTION_TYPE_ORDER,
  useCreateGenerationJob,
  useTopics,
} from '../../lib/generation'
import GenerationJobView from './GenerationJobView'
import QuestionTypeChip from './QuestionTypeChip'

const inputClassName =
  'w-full rounded-lg border border-card-border px-3 py-2 text-sm outline-none focus:border-indigo-bright focus:ring-2 focus:ring-indigo-bright/30'

const DIFFICULTY_OPTIONS: { value: GenerationDifficulty; label: string }[] = [
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
]

const ZERO_COUNTS: Record<QuestionTypeCode, number> = {
  MCQ: 0,
  FILL_BLANK: 0,
  FLASHCARD: 0,
  NUMERIC: 0,
  WRITTEN: 0,
}

export default function GenerateQuestionsDialog({
  material,
  onClose,
  onViewDrafts,
}: {
  material: MaterialDetailDto
  onClose: () => void
  onViewDrafts: () => void
}) {
  const [topicId, setTopicId] = useState('')
  const [counts, setCounts] =
    useState<Record<QuestionTypeCode, number>>(ZERO_COUNTS)
  const [difficulty, setDifficulty] =
    useState<GenerationDifficulty>('MEDIUM')
  const [jobId, setJobId] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const topicsQuery = useTopics(material.gradeSubjectId)
  const createJob = useCreateGenerationJob()

  const topics = topicsQuery.data ?? []
  const total = QUESTION_TYPE_ORDER.reduce(
    (sum, type) => sum + counts[type],
    0,
  )

  const validationMessage =
    topicId === ''
      ? 'Choose the topic these questions are about.'
      : total === 0
        ? 'Request at least one question.'
        : total > MAX_QUESTIONS_PER_JOB
          ? `That is ${total} questions — one job can generate at most ${MAX_QUESTIONS_PER_JOB}. Reduce the counts.`
          : null

  const onCountChange = (type: QuestionTypeCode, raw: string) => {
    const parsed = Number.parseInt(raw, 10)
    const next = Number.isNaN(parsed)
      ? 0
      : Math.min(MAX_QUESTIONS_PER_JOB, Math.max(0, parsed))
    setCounts((current) => ({ ...current, [type]: next }))
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    setSubmitError(null)
    const requested: Partial<Record<QuestionTypeCode, number>> = {}
    for (const type of QUESTION_TYPE_ORDER) {
      if (counts[type] > 0) {
        requested[type] = counts[type]
      }
    }
    createJob.mutate(
      {
        materialId: material.materialId,
        request: { topicId, counts: requested, difficulty },
      },
      {
        onSuccess: (job) => {
          setJobId(job.id)
        },
        onError: (error) => {
          setSubmitError(
            getApiErrorMessage(error, 'Could not start generation.'),
          )
        },
      },
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Generate questions"
        className="max-h-full w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold">
              Generate questions
            </h2>
            <p className="mt-1 text-sm text-ink/60">
              Draft questions from “{material.title}”, written only from
              this chapter’s text.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-full border border-card-border px-3 py-1 text-sm font-semibold hover:bg-paper"
          >
            ✕
          </button>
        </div>

        {jobId !== null ? (
          <>
            <GenerationJobView jobId={jobId} onViewDrafts={onViewDrafts} />
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-card-border px-5 py-2.5 text-sm font-semibold hover:bg-paper"
              >
                Done
              </button>
            </div>
          </>
        ) : (
          <form noValidate onSubmit={onSubmit}>
            {topicsQuery.isError && (
              <p
                role="alert"
                className="mb-4 rounded-lg bg-rose-weak/10 px-3 py-2 text-sm text-rose-weak"
              >
                {getApiErrorMessage(
                  topicsQuery.error,
                  'Could not load the topics.',
                )}
              </p>
            )}
            {submitError !== null && (
              <p
                role="alert"
                className="mb-4 rounded-lg bg-rose-weak/10 px-3 py-2 text-sm text-rose-weak"
              >
                {submitError}
              </p>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="generate-topic"
                  className="mb-1 block text-sm font-medium"
                >
                  Topic
                </label>
                <select
                  id="generate-topic"
                  className={inputClassName}
                  value={topicId}
                  disabled={topicsQuery.isPending}
                  onChange={(event) => setTopicId(event.target.value)}
                >
                  <option value="">
                    {topicsQuery.isPending
                      ? 'Loading topics…'
                      : 'Select a topic'}
                  </option>
                  {topics.map((topic) => (
                    <option key={topic.topicId} value={topic.topicId}>
                      {topic.name}
                    </option>
                  ))}
                </select>
                {topicsQuery.isSuccess && topics.length === 0 && (
                  <p className="mt-1 text-sm text-ink/60">
                    There are no topics for this grade and subject yet.
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="generate-difficulty"
                  className="mb-1 block text-sm font-medium"
                >
                  Difficulty
                </label>
                <select
                  id="generate-difficulty"
                  className={inputClassName}
                  value={difficulty}
                  onChange={(event) =>
                    setDifficulty(
                      event.target.value as GenerationDifficulty,
                    )
                  }
                >
                  {DIFFICULTY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <fieldset className="mt-5">
              <legend className="text-sm font-medium">
                How many of each type?
              </legend>
              <div className="mt-2 space-y-2">
                {QUESTION_TYPE_ORDER.map((type) => (
                  <div
                    key={type}
                    className="flex items-center justify-between gap-3"
                  >
                    <QuestionTypeChip type={type} />
                    <input
                      id={`count-${type}`}
                      aria-label={`${type} count`}
                      type="number"
                      min={0}
                      max={MAX_QUESTIONS_PER_JOB}
                      className="w-24 rounded-lg border border-card-border px-3 py-1.5 text-sm outline-none focus:border-indigo-bright focus:ring-2 focus:ring-indigo-bright/30"
                      value={counts[type]}
                      onChange={(event) =>
                        onCountChange(type, event.target.value)
                      }
                    />
                  </div>
                ))}
              </div>
            </fieldset>

            <p className="mt-4 text-sm">
              Total: {total} of {MAX_QUESTIONS_PER_JOB} questions
            </p>
            {validationMessage !== null && (
              <p role="alert" className="mt-1 text-sm text-rose-weak">
                {validationMessage}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-card-border px-5 py-2.5 text-sm font-semibold hover:bg-paper"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  validationMessage !== null || createJob.isPending
                }
                className="rounded-full bg-marigold px-5 py-2.5 text-sm font-semibold text-ink transition hover:brightness-95 disabled:opacity-50"
              >
                Generate questions
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
