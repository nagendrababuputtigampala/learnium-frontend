import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../../lib/auth'
import type { GenerationJobDetailDto } from '../../lib/api'
import {
  jobDetailFailedSafety,
  jobDetailFailedZeroValid,
  jobDetailQueued,
  jobDetailRetrying,
  jobDetailRunning,
  jobDetailSucceeded,
} from '../../test/fixtures'
import {
  createTestQueryClient,
  renderWithProviders,
} from '../../test/renderWithProviders'
import GenerationJobView from './GenerationJobView'

const mock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  refreshAccessToken: vi.fn(),
  sessionExpired: { handler: null as (() => void) | null },
}))

vi.mock('../../lib/api', async () => {
  const helper = await import('../../test/mockApi')
  return helper.createMockApiModule(mock)
})

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  mock.get.mockReset()
  mock.post.mockReset()
  mock.refreshAccessToken.mockReset()
})

function serveJob(job: GenerationJobDetailDto) {
  mock.get.mockImplementation((url: string) => {
    if (url === `/generation-jobs/${job.id}`) {
      return Promise.resolve({ data: job })
    }
    return Promise.reject(new Error(`Unexpected GET ${url}`))
  })
}

function renderView(onViewDrafts: () => void = () => {}) {
  return renderWithProviders(
    <GenerationJobView jobId="job-1" onViewDrafts={onViewDrafts} />,
  )
}

describe('GenerationJobView', () => {
  it('shows a loading note while the first poll is in flight', () => {
    mock.get.mockImplementation(() => new Promise(() => {}))
    renderView()
    expect(screen.getByText('Checking generation status…')).toBeTruthy()
  })

  it('surfaces a load error', async () => {
    mock.get.mockRejectedValue(new Error('network down'))
    renderView()
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toBe('Could not load the generation status.')
  })

  it('shows the queued state', async () => {
    serveJob(jobDetailQueued)
    renderView()
    expect(
      await screen.findByText('Queued — generation will start shortly.'),
    ).toBeTruthy()
    expect(screen.queryByRole('table')).toBeNull()
    expect(screen.queryByText(/Token usage/)).toBeNull()
  })

  it('shows progress with the attempt indicator while running', async () => {
    serveJob(jobDetailRunning)
    renderView()
    expect(
      await screen.findByText('Generating questions from this chapter…'),
    ).toBeTruthy()
    expect(screen.getByText('Attempt 1 of 2')).toBeTruthy()
  })

  it('explains a rescheduled attempt that will retry on its own', async () => {
    serveJob(jobDetailRetrying)
    renderView()
    expect(await screen.findByText('One attempt didn’t work')).toBeTruthy()
    expect(
      screen.getByText(/The AI service hit a problem/),
    ).toBeTruthy()
    expect(screen.getByText('It will retry automatically.')).toBeTruthy()
  })

  it('explains a retry that is already running again', async () => {
    serveJob({
      ...jobDetailRunning,
      attempts: 2,
      failureKind: 'TRUNCATED',
    })
    renderView()
    expect(await screen.findByText('One attempt didn’t work')).toBeTruthy()
    expect(screen.getByText(/reply was cut off/)).toBeTruthy()
    expect(
      screen.getByText('Retrying now — attempt 2 of 2.'),
    ).toBeTruthy()
  })

  it('shows per-type results, drop reasons and token usage on success', async () => {
    serveJob(jobDetailSucceeded)
    renderView()
    expect(await screen.findByText('Generation complete')).toBeTruthy()
    expect(
      screen.getByText(
        '6 of 7 requested questions are ready as drafts.',
      ),
    ).toBeTruthy()
    expect(screen.getByText('Multiple choice')).toBeTruthy()
    expect(screen.getByText('Written answer')).toBeTruthy()
    expect(screen.getByText(/duplicate question ×1/)).toBeTruthy()
    expect(screen.getByText(/marking rubric incomplete ×1/)).toBeTruthy()
    expect(
      screen.getByText(
        'Token usage: 4,200 input tokens · 1,800 output tokens · 300 thinking tokens',
      ),
    ).toBeTruthy()
  })

  it('calls onViewDrafts from the success action', async () => {
    const onViewDrafts = vi.fn()
    serveJob(jobDetailSucceeded)
    renderView(onViewDrafts)
    await userEvent.click(
      await screen.findByRole('button', { name: 'View drafts' }),
    )
    expect(onViewDrafts).toHaveBeenCalledTimes(1)
  })

  it('invalidates the material questions when the job succeeds', async () => {
    serveJob(jobDetailSucceeded)
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(
      ['materials', undefined, 'questions', 'mat-1', 0],
      { content: [], page: 0, size: 10, totalElements: 0, totalPages: 0 },
    )
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AuthProvider>
            <GenerationJobView jobId="job-1" onViewDrafts={() => {}} />
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    )
    await screen.findByText('Generation complete')
    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['materials', undefined, 'questions', 'mat-1'],
      }),
    )
  })

  it('handles success without tallies or usage', async () => {
    serveJob({
      ...jobDetailSucceeded,
      resultCounts: null,
      usageInputTokens: null,
      usageOutputTokens: null,
      usageThinkingTokens: null,
    })
    renderView()
    expect(await screen.findByText('Generation complete')).toBeTruthy()
    expect(screen.getByText('The new drafts are ready below.')).toBeTruthy()
    expect(screen.queryByRole('table')).toBeNull()
    expect(screen.queryByText(/Token usage/)).toBeNull()
  })

  it('renders no table when the tallies hold no requested or received type', async () => {
    serveJob({ ...jobDetailSucceeded, resultCounts: {} })
    renderView()
    expect(await screen.findByText('Generation complete')).toBeTruthy()
    expect(
      screen.getByText(
        '0 of 0 requested questions are ready as drafts.',
      ),
    ).toBeTruthy()
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('shows a received-but-unrequested type and a bare dropped count', async () => {
    serveJob({
      ...jobDetailSucceeded,
      resultCounts: {
        MCQ: {
          requested: 0,
          received: 0,
          accepted: 0,
          dropped: 0,
          dropReasons: {},
        },
        NUMERIC: {
          requested: 0,
          received: 3,
          accepted: 0,
          dropped: 3,
          dropReasons: { EXCEEDS_REQUESTED: 3 },
        },
        FLASHCARD: {
          requested: 2,
          received: 2,
          accepted: 1,
          dropped: 1,
          dropReasons: {},
        },
      },
    })
    renderView()
    expect(await screen.findByText('Numeric answer')).toBeTruthy()
    expect(screen.getByText(/more than requested ×3/)).toBeTruthy()
    expect(screen.getByText('Flashcard')).toBeTruthy()
    expect(screen.queryByText('Multiple choice')).toBeNull()
    const flashcardRow = screen.getByText('Flashcard').closest('tr')
    expect(flashcardRow?.textContent).toContain('1')
    expect(flashcardRow?.textContent).not.toContain('(')
  })

  it('shows only the usage parts that were recorded', async () => {
    serveJob({
      ...jobDetailSucceeded,
      usageOutputTokens: null,
      usageThinkingTokens: null,
    })
    renderView()
    expect(
      await screen.findByText('Token usage: 4,200 input tokens'),
    ).toBeTruthy()
  })

  it('explains a terminal safety refusal with no retry promise', async () => {
    serveJob(jobDetailFailedSafety)
    renderView()
    expect(
      await screen.findByText('The AI declined this material'),
    ).toBeTruthy()
    expect(screen.getByText(/safety filters refused/)).toBeTruthy()
    expect(screen.queryByText(/retry automatically/)).toBeNull()
    expect(
      screen.queryByRole('button', { name: 'View drafts' }),
    ).toBeNull()
  })

  it('shows zero-valid tallies and usage without thinking tokens', async () => {
    serveJob(jobDetailFailedZeroValid)
    renderView()
    expect(
      await screen.findByText('No usable questions came back'),
    ).toBeTruthy()
    expect(
      screen.getByText(/match the required format ×3, too long ×2/),
    ).toBeTruthy()
    expect(
      screen.getByText('Token usage: 4,000 input tokens · 1,500 output tokens'),
    ).toBeTruthy()
  })

  it('falls back to a generic message when a failed job has no kind', async () => {
    serveJob({ ...jobDetailFailedSafety, failureKind: null })
    renderView()
    expect(await screen.findByText('Generation failed')).toBeTruthy()
    expect(
      screen.getByText(
        'Something went wrong while generating. Please try again.',
      ),
    ).toBeTruthy()
  })
})
