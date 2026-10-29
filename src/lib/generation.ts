import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  apiClient,
  type GeneratedQuestionDto,
  type GenerationFailureKind,
  type GenerationJobDetailDto,
  type GenerationJobDto,
  type GenerateJobRequest,
  type PageResponse,
  type QuestionTypeCode,
  type Topic,
} from './api'
import { useAuth } from './auth'

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

/** Hard cap on questions per generation job (matches the backend). */
export const MAX_QUESTIONS_PER_JOB = 40

/** Maximum length of a topic name (matches the backend validation). */
export const MAX_TOPIC_NAME_LENGTH = 200

/** The backend executes a job at most twice (first try + one retry). */
export const MAX_GENERATION_ATTEMPTS = 2

/** How often an in-flight job is re-polled. */
export const JOB_POLL_INTERVAL_MS = 2000

export const QUESTIONS_PAGE_SIZE = 10

export const QUESTION_TYPE_ORDER: QuestionTypeCode[] = [
  'MCQ',
  'FILL_BLANK',
  'FLASHCARD',
  'NUMERIC',
  'WRITTEN',
]

/* ------------------------------------------------------------------ */
/* Presentation helpers                                                */
/* ------------------------------------------------------------------ */

export interface QuestionTypeInfo {
  label: string
  chipClassName: string
}

const QUESTION_TYPE_INFO: Record<QuestionTypeCode, QuestionTypeInfo> = {
  MCQ: {
    label: 'Multiple choice',
    chipClassName: 'bg-indigo-tint text-indigo-primary',
  },
  FILL_BLANK: {
    label: 'Fill in the blank',
    chipClassName: 'bg-teal-fill/10 text-teal-fill',
  },
  FLASHCARD: {
    label: 'Flashcard',
    chipClassName: 'bg-marigold/20 text-ink',
  },
  // No dedicated theme colour exists for numeric questions; the
  // palette's bright indigo keeps it in the MCQ family while staying
  // visually distinct from the deeper primary indigo.
  NUMERIC: {
    label: 'Numeric answer',
    chipClassName: 'bg-indigo-bright/15 text-indigo-bright',
  },
  WRITTEN: {
    label: 'Written answer',
    chipClassName: 'bg-violet-theory/10 text-violet-theory',
  },
}

export function questionTypeInfo(type: QuestionTypeCode): QuestionTypeInfo {
  return QUESTION_TYPE_INFO[type]
}

/**
 * Runtime guard for type codes arriving from the wire — a payload
 * whose type is not one of the five known codes must degrade to a
 * fallback card, never crash a renderer.
 */
export function isQuestionTypeCode(value: string): value is QuestionTypeCode {
  return (QUESTION_TYPE_ORDER as readonly string[]).includes(value)
}

/** Scrolls the generated-drafts section into view (no-op if absent). */
export function scrollToDrafts(): void {
  document
    .getElementById('generated-drafts')
    ?.scrollIntoView({ behavior: 'smooth' })
}

const DROP_REASON_LABELS: Record<string, string> = {
  SCHEMA_INVALID: "didn't match the required format",
  DUPLICATE_STEM: 'duplicate question',
  RUBRIC_INVALID: 'marking rubric incomplete',
  ANSWER_KEY_INVALID: 'answer key problem',
  FIELD_TOO_LONG: 'too long',
  EXCEEDS_REQUESTED: 'more than requested',
}

/** Plain-words rendering of a backend drop-reason code. */
export function dropReasonLabel(code: string): string {
  return DROP_REASON_LABELS[code] ?? 'dropped for another reason'
}

export interface FailureKindInfo {
  headline: string
  explanation: string
  /** Transient kinds are retried by the backend within the attempt budget. */
  retryable: boolean
}

const FAILURE_KIND_INFO: Record<GenerationFailureKind, FailureKindInfo> = {
  MODEL_ERROR: {
    headline: 'The AI service hit a problem',
    explanation:
      'The AI service could not complete the request. This is usually temporary.',
    retryable: true,
  },
  MALFORMED_RESPONSE: {
    headline: "The AI's reply couldn't be used",
    explanation:
      'The AI replied in a shape we could not read, so nothing could be saved from that attempt.',
    retryable: true,
  },
  TRUNCATED: {
    headline: "The AI's reply was cut off",
    explanation:
      'The reply ended before it was complete, so nothing could be saved from that attempt.',
    retryable: true,
  },
  SAFETY_REFUSAL: {
    headline: 'The AI declined this material',
    explanation:
      "The AI's safety filters refused to generate questions from this chapter, so retrying would not help. Try a different chapter or paste an edited version of the text.",
    retryable: false,
  },
  ZERO_VALID: {
    headline: 'No usable questions came back',
    explanation:
      'The AI replied, but none of its questions passed the quality checks. Try again, or ask for a different mix of question types.',
    retryable: false,
  },
  MATERIAL_DELETED: {
    headline: 'The source material is no longer available',
    explanation:
      'This material was removed before generation finished, so the job could not continue.',
    retryable: false,
  },
}

/** Fallback for a failed job whose kind is missing (should not happen). */
const UNKNOWN_FAILURE_INFO: FailureKindInfo = {
  headline: 'Generation failed',
  explanation: 'Something went wrong while generating. Please try again.',
  retryable: false,
}

export function failureKindInfo(
  kind: GenerationFailureKind | null,
): FailureKindInfo {
  return kind === null ? UNKNOWN_FAILURE_INFO : FAILURE_KIND_INFO[kind]
}

export type GenerationJobPhase =
  | 'queued'
  | 'running'
  | 'retrying'
  | 'succeeded'
  | 'failed'

/**
 * Teacher-facing phase of a job. A job that failed an attempt with a
 * retryable kind returns to PENDING (or runs again) with the failure
 * kind still recorded — that is the "retrying" phase, distinct from a
 * fresh queued job.
 */
export function generationJobPhase(
  job: GenerationJobDetailDto,
): GenerationJobPhase {
  if (job.status === 'SUCCEEDED') {
    return 'succeeded'
  }
  if (job.status === 'FAILED') {
    return 'failed'
  }
  if (job.failureKind !== null) {
    return 'retrying'
  }
  return job.status === 'RUNNING' ? 'running' : 'queued'
}

/* ------------------------------------------------------------------ */
/* API functions                                                       */
/* ------------------------------------------------------------------ */

export async function createGenerationJob(
  materialId: string,
  request: GenerateJobRequest,
): Promise<GenerationJobDto> {
  const response = await apiClient.post<GenerationJobDto>(
    `/materials/${materialId}/generate`,
    request,
  )
  return response.data
}

export async function fetchGenerationJob(
  jobId: string,
): Promise<GenerationJobDetailDto> {
  const response = await apiClient.get<GenerationJobDetailDto>(
    `/generation-jobs/${jobId}`,
  )
  return response.data
}

export async function fetchMaterialQuestions(
  materialId: string,
  page: number,
  size: number,
): Promise<PageResponse<GeneratedQuestionDto>> {
  const response = await apiClient.get<
    PageResponse<GeneratedQuestionDto>
  >(`/materials/${materialId}/questions`, { params: { page, size } })
  return response.data
}

export async function fetchTopics(
  gradeSubjectId: string,
): Promise<Topic[]> {
  const response = await apiClient.get<Topic[]>(
    `/master/grade-subjects/${gradeSubjectId}/topics`,
  )
  return response.data
}

/**
 * Creates a topic under a grade-subject, or returns the existing one
 * when the name is already taken — the backend answers 201 for a
 * fresh topic and 200 for an existing one, with the same body either
 * way, so callers can treat both as success.
 */
export async function createTopic(
  gradeSubjectId: string,
  name: string,
): Promise<Topic> {
  const response = await apiClient.post<Topic>(
    `/master/grade-subjects/${gradeSubjectId}/topics`,
    { name },
  )
  return response.data
}

/* ------------------------------------------------------------------ */
/* Query keys (centre-scoped, like the other centre-owned resources)   */
/* ------------------------------------------------------------------ */

export function generationJobQueryKey(
  centreId: string | undefined,
  jobId: string,
): readonly ['generation-jobs', string | undefined, string] {
  return ['generation-jobs', centreId, jobId]
}

export function materialQuestionsQueryKey(
  centreId: string | undefined,
  materialId: string,
  page: number,
): readonly ['materials', string | undefined, 'questions', string, number] {
  return ['materials', centreId, 'questions', materialId, page]
}

export function topicsQueryKey(
  gradeSubjectId: string,
): readonly ['topics', string] {
  return ['topics', gradeSubjectId]
}

/* ------------------------------------------------------------------ */
/* Hooks                                                               */
/* ------------------------------------------------------------------ */

export function useTopics(gradeSubjectId: string) {
  return useQuery({
    queryKey: topicsQueryKey(gradeSubjectId),
    queryFn: () => fetchTopics(gradeSubjectId),
    enabled: gradeSubjectId !== '',
  })
}

export function useGenerationJob(jobId: string | null) {
  const { user } = useAuth()
  return useQuery({
    queryKey: generationJobQueryKey(user?.centreId, jobId ?? ''),
    queryFn: () => fetchGenerationJob(jobId as string),
    enabled: jobId !== null,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === undefined ||
        status === 'PENDING' ||
        status === 'RUNNING'
        ? JOB_POLL_INTERVAL_MS
        : false
    },
  })
}

export function useCreateTopic() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { gradeSubjectId: string; name: string }) =>
      createTopic(input.gradeSubjectId, input.name),
    onSuccess: (_topic, input) => {
      void queryClient.invalidateQueries({
        queryKey: topicsQueryKey(input.gradeSubjectId),
      })
    },
  })
}

export function useCreateGenerationJob() {
  return useMutation({
    mutationFn: (input: { materialId: string; request: GenerateJobRequest }) =>
      createGenerationJob(input.materialId, input.request),
  })
}

export function useMaterialQuestions(materialId: string, page: number) {
  const { user } = useAuth()
  return useQuery({
    queryKey: materialQuestionsQueryKey(user?.centreId, materialId, page),
    queryFn: () =>
      fetchMaterialQuestions(materialId, page, QUESTIONS_PAGE_SIZE),
  })
}
