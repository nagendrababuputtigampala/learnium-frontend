import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type {
  GeneratedQuestionDto,
  GenerationFailureKind,
  PageResponse,
} from './api'
import { useAuth } from './auth'
import {
  authContextValue,
  generationJobCreated,
  jobDetailFailedSafety,
  jobDetailQueued,
  jobDetailRetrying,
  jobDetailRunning,
  jobDetailSucceeded,
  questionMcq,
  teacherUser,
  topics,
} from '../test/fixtures'
import {
  createGenerationJob,
  dropReasonLabel,
  failureKindInfo,
  fetchGenerationJob,
  fetchMaterialQuestions,
  fetchTopics,
  generationJobPhase,
  generationJobQueryKey,
  materialQuestionsQueryKey,
  questionTypeInfo,
  topicsQueryKey,
  useCreateGenerationJob,
  useGenerationJob,
  useMaterialQuestions,
  useTopics,
} from './generation'

const mock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  refreshAccessToken: vi.fn(),
  sessionExpired: { handler: null as (() => void) | null },
}))

vi.mock('./api', async () => {
  const helper = await import('../test/mockApi')
  return helper.createMockApiModule(mock)
})

vi.mock('./auth', () => ({
  useAuth: vi.fn(),
}))

const mockUseAuth = vi.mocked(useAuth)

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  mock.get.mockReset()
  mock.post.mockReset()
  mockUseAuth.mockReturnValue(authContextValue({ user: teacherUser }))
})

afterEach(() => {
  vi.useRealTimers()
})

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { queryClient, wrapper }
}

function pageOf(
  content: GeneratedQuestionDto[],
): PageResponse<GeneratedQuestionDto> {
  return {
    content,
    page: 0,
    size: 10,
    totalElements: content.length,
    totalPages: 1,
  }
}

describe('questionTypeInfo', () => {
  it('labels every question type with a themed chip class', () => {
    expect(questionTypeInfo('MCQ').label).toBe('Multiple choice')
    expect(questionTypeInfo('FILL_BLANK').label).toBe('Fill in the blank')
    expect(questionTypeInfo('FLASHCARD').label).toBe('Flashcard')
    expect(questionTypeInfo('NUMERIC').label).toBe('Numeric answer')
    expect(questionTypeInfo('WRITTEN').label).toBe('Written answer')
    for (const type of [
      'MCQ',
      'FILL_BLANK',
      'FLASHCARD',
      'NUMERIC',
      'WRITTEN',
    ] as const) {
      expect(questionTypeInfo(type).chipClassName.length).toBeGreaterThan(0)
    }
  })
})

describe('dropReasonLabel', () => {
  it('renders every backend code in plain words', () => {
    expect(dropReasonLabel('SCHEMA_INVALID')).toBe(
      "didn't match the required format",
    )
    expect(dropReasonLabel('DUPLICATE_STEM')).toBe('duplicate question')
    expect(dropReasonLabel('RUBRIC_INVALID')).toBe(
      'marking rubric incomplete',
    )
    expect(dropReasonLabel('ANSWER_KEY_INVALID')).toBe('answer key problem')
    expect(dropReasonLabel('FIELD_TOO_LONG')).toBe('too long')
    expect(dropReasonLabel('EXCEEDS_REQUESTED')).toBe('more than requested')
  })

  it('falls back gracefully for an unknown code', () => {
    expect(dropReasonLabel('SOMETHING_NEW')).toBe(
      'dropped for another reason',
    )
  })
})

describe('failureKindInfo', () => {
  it('marks the transient kinds retryable and the rest terminal', () => {
    const retryable: GenerationFailureKind[] = [
      'MODEL_ERROR',
      'MALFORMED_RESPONSE',
      'TRUNCATED',
    ]
    const terminal: GenerationFailureKind[] = [
      'SAFETY_REFUSAL',
      'ZERO_VALID',
      'MATERIAL_DELETED',
    ]
    for (const kind of retryable) {
      expect(failureKindInfo(kind).retryable).toBe(true)
      expect(failureKindInfo(kind).headline.length).toBeGreaterThan(0)
      expect(failureKindInfo(kind).explanation.length).toBeGreaterThan(0)
    }
    for (const kind of terminal) {
      expect(failureKindInfo(kind).retryable).toBe(false)
      expect(failureKindInfo(kind).headline.length).toBeGreaterThan(0)
      expect(failureKindInfo(kind).explanation.length).toBeGreaterThan(0)
    }
  })

  it('falls back to a generic failure for a missing kind', () => {
    expect(failureKindInfo(null).headline).toBe('Generation failed')
    expect(failureKindInfo(null).retryable).toBe(false)
  })
})

describe('generationJobPhase', () => {
  it('maps job states to teacher-facing phases', () => {
    expect(generationJobPhase(jobDetailQueued)).toBe('queued')
    expect(generationJobPhase(jobDetailRunning)).toBe('running')
    expect(generationJobPhase(jobDetailRetrying)).toBe('retrying')
    expect(
      generationJobPhase({ ...jobDetailRunning, failureKind: 'TRUNCATED' }),
    ).toBe('retrying')
    expect(generationJobPhase(jobDetailSucceeded)).toBe('succeeded')
    expect(generationJobPhase(jobDetailFailedSafety)).toBe('failed')
  })
})

describe('query keys', () => {
  it('scopes job and question keys by centre', () => {
    expect(generationJobQueryKey('centre-1', 'job-1')).toEqual([
      'generation-jobs',
      'centre-1',
      'job-1',
    ])
    expect(materialQuestionsQueryKey('centre-1', 'mat-1', 2)).toEqual([
      'materials',
      'centre-1',
      'questions',
      'mat-1',
      2,
    ])
    expect(topicsQueryKey('gs-1')).toEqual(['topics', 'gs-1'])
  })
})

describe('generation API functions', () => {
  it('creates a job for a material', async () => {
    mock.post.mockResolvedValue({ data: generationJobCreated })
    const request = {
      topicId: 'topic-1',
      counts: { MCQ: 5, WRITTEN: 2 },
      difficulty: 'MEDIUM' as const,
    }
    await expect(createGenerationJob('mat-1', request)).resolves.toEqual(
      generationJobCreated,
    )
    expect(mock.post).toHaveBeenCalledWith('/materials/mat-1/generate', request)
  })

  it('fetches one generation job', async () => {
    mock.get.mockResolvedValue({ data: jobDetailQueued })
    await expect(fetchGenerationJob('job-1')).resolves.toEqual(jobDetailQueued)
    expect(mock.get).toHaveBeenCalledWith('/generation-jobs/job-1')
  })

  it('fetches a page of generated questions', async () => {
    mock.get.mockResolvedValue({ data: pageOf([questionMcq]) })
    await expect(fetchMaterialQuestions('mat-1', 0, 10)).resolves.toEqual(
      pageOf([questionMcq]),
    )
    expect(mock.get).toHaveBeenCalledWith('/materials/mat-1/questions', {
      params: { page: 0, size: 10 },
    })
  })

  it('fetches the topics of a grade-subject', async () => {
    mock.get.mockResolvedValue({ data: topics })
    await expect(fetchTopics('gs-1')).resolves.toEqual(topics)
    expect(mock.get).toHaveBeenCalledWith('/master/grade-subjects/gs-1/topics')
  })
})

describe('generation hooks', () => {
  it('loads topics for a grade-subject', async () => {
    mock.get.mockResolvedValue({ data: topics })
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useTopics('gs-1'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(topics)
  })

  it('does not fetch topics without a grade-subject', async () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useTopics(''), { wrapper })
    await act(async () => {
      await Promise.resolve()
    })
    expect(result.current.fetchStatus).toBe('idle')
    expect(mock.get).not.toHaveBeenCalled()
  })

  it('stays idle without a job id', async () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useGenerationJob(null), { wrapper })
    await act(async () => {
      await Promise.resolve()
    })
    expect(result.current.fetchStatus).toBe('idle')
    expect(mock.get).not.toHaveBeenCalled()
  })

  // Note on the polling tests: under fake timers the query cache is
  // the source of truth — React notifications lag one cycle behind
  // the fetches, so these assert fetch counts per interval and read
  // the final status after a settling advance.
  it('polls a job through its phases and stops at success', async () => {
    vi.useFakeTimers()
    const states = [jobDetailQueued, jobDetailRunning, jobDetailSucceeded]
    let calls = 0
    mock.get.mockImplementation((url: string) => {
      if (url === '/generation-jobs/job-1') {
        const data = states[Math.min(calls, states.length - 1)]
        calls += 1
        return Promise.resolve({ data })
      }
      return Promise.reject(new Error(`Unexpected GET ${url}`))
    })
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useGenerationJob('job-1'), { wrapper })

    await vi.advanceTimersByTimeAsync(0)
    expect(result.current.data?.status).toBe('PENDING')
    expect(calls).toBe(1)

    await vi.advanceTimersByTimeAsync(2000)
    expect(calls).toBe(2)

    await vi.advanceTimersByTimeAsync(2000)
    expect(calls).toBe(3)

    await vi.advanceTimersByTimeAsync(10000)
    expect(calls).toBe(3)
    expect(result.current.data?.status).toBe('SUCCEEDED')
  })

  it('stops polling at a terminal failure', async () => {
    vi.useFakeTimers()
    let calls = 0
    mock.get.mockImplementation((url: string) => {
      if (url === '/generation-jobs/job-1') {
        calls += 1
        return Promise.resolve({
          data: calls === 1 ? jobDetailRunning : jobDetailFailedSafety,
        })
      }
      return Promise.reject(new Error(`Unexpected GET ${url}`))
    })
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useGenerationJob('job-1'), { wrapper })

    await vi.advanceTimersByTimeAsync(0)
    expect(result.current.data?.status).toBe('RUNNING')

    await vi.advanceTimersByTimeAsync(2000)
    expect(calls).toBe(2)

    await vi.advanceTimersByTimeAsync(10000)
    expect(calls).toBe(2)
    expect(result.current.data?.status).toBe('FAILED')
  })

  it('creates a job through the mutation hook', async () => {
    mock.post.mockResolvedValue({ data: generationJobCreated })
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useCreateGenerationJob(), { wrapper })
    const request = {
      topicId: 'topic-1',
      counts: { MCQ: 5 },
      difficulty: 'EASY' as const,
    }
    let created: unknown
    await act(async () => {
      created = await result.current.mutateAsync({
        materialId: 'mat-1',
        request,
      })
    })
    expect(created).toEqual(generationJobCreated)
    expect(mock.post).toHaveBeenCalledWith('/materials/mat-1/generate', request)
  })

  it('loads a page of material questions', async () => {
    mock.get.mockResolvedValue({ data: pageOf([questionMcq]) })
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useMaterialQuestions('mat-1', 0), {
      wrapper,
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.content).toEqual([questionMcq])
    expect(mock.get).toHaveBeenCalledWith('/materials/mat-1/questions', {
      params: { page: 0, size: 10 },
    })
  })
})
