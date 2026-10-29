import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import {
  getApiErrorMessage,
  type GenerationDifficulty,
  type MaterialDetailDto,
  type QuestionTypeCode,
} from '../../lib/api'
import {
  MAX_QUESTIONS_PER_JOB,
  MAX_TOPIC_NAME_LENGTH,
  QUESTION_TYPE_ORDER,
  useCreateGenerationJob,
  useCreateTopic,
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
  const [addingTopic, setAddingTopic] = useState(false)
  const [newTopicName, setNewTopicName] = useState('')
  const [addTopicError, setAddTopicError] = useState<string | null>(null)
  // Set once the teacher has made an explicit topic choice (picked
  // from the list or added a new one) so the single-topic shortcut
  // below never overrides it on a later refetch.
  const topicChoiceMadeRef = useRef(false)

  const topicsQuery = useTopics(material.gradeSubjectId)
  const createJob = useCreateGenerationJob()
  const createTopic = useCreateTopic()

  const topics = topicsQuery.data ?? []

  // A grade-subject with exactly one topic leaves nothing to choose:
  // preselect it, unless the teacher has already made a choice.
  useEffect(() => {
    if (
      topics.length === 1 &&
      topicId === '' &&
      !topicChoiceMadeRef.current
    ) {
      topicChoiceMadeRef.current = true
      setTopicId(topics[0].topicId)
    }
  }, [topics, topicId])

  const topicsEmpty = topicsQuery.isSuccess && topics.length === 0
  const showAddTopicForm = addingTopic || topicsEmpty
  const trimmedTopicName = newTopicName.trim()
  const newTopicTooLong = newTopicName.length > MAX_TOPIC_NAME_LENGTH
  const addTopicDisabled =
    trimmedTopicName === '' || newTopicTooLong || createTopic.isPending

  const onAddTopic = () => {
    if (addTopicDisabled) {
      return
    }
    setAddTopicError(null)
    createTopic.mutate(
      { gradeSubjectId: material.gradeSubjectId, name: trimmedTopicName },
      {
        onSuccess: (topic) => {
          topicChoiceMadeRef.current = true
          setTopicId(topic.topicId)
          setAddingTopic(false)
          setNewTopicName('')
        },
        onError: (error) => {
          setAddTopicError(
            getApiErrorMessage(error, 'Could not add the topic.'),
          )
        },
      },
    )
  }

  const onNewTopicKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      // Enter adds the topic; it must not submit the generate form.
      event.preventDefault()
      onAddTopic()
    }
  }
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
                  onChange={(event) => {
                    topicChoiceMadeRef.current = true
                    setTopicId(event.target.value)
                  }}
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
                {topicsEmpty && (
                  <p className="mt-1 text-sm text-ink/60">
                    No topics yet for this grade and subject — add the
                    chapter’s topic.
                  </p>
                )}
                {showAddTopicForm ? (
                  <div className="mt-3">
                    <label
                      htmlFor="generate-new-topic"
                      className="mb-1 block text-sm font-medium"
                    >
                      New topic name
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="generate-new-topic"
                        className={inputClassName}
                        value={newTopicName}
                        placeholder="e.g. Fractions"
                        onChange={(event) =>
                          setNewTopicName(event.target.value)
                        }
                        onKeyDown={onNewTopicKeyDown}
                      />
                      <button
                        type="button"
                        disabled={addTopicDisabled}
                        onClick={onAddTopic}
                        className="shrink-0 rounded-full bg-indigo-primary px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
                      >
                        Add topic
                      </button>
                    </div>
                    {newTopicTooLong && (
                      <p className="mt-1 text-sm text-rose-weak">
                        Topic names are limited to{' '}
                        {MAX_TOPIC_NAME_LENGTH} characters.
                      </p>
                    )}
                    {addTopicError !== null && (
                      <p
                        role="alert"
                        className="mt-1 text-sm text-rose-weak"
                      >
                        {addTopicError}
                      </p>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddingTopic(true)}
                    className="mt-2 text-sm font-semibold text-indigo-primary hover:underline"
                  >
                    + New topic
                  </button>
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
