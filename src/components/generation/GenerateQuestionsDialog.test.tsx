import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  generationJobCreated,
  jobDetailRunning,
  materialDetailOk,
  topics,
} from '../../test/fixtures'
import { renderWithProviders } from '../../test/renderWithProviders'
import GenerateQuestionsDialog from './GenerateQuestionsDialog'

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

const TOPICS_URL = '/master/grade-subjects/gs-1/topics'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  mock.get.mockReset()
  mock.post.mockReset()
  mock.refreshAccessToken.mockReset()
})

function serveTopics(data: unknown = topics) {
  mock.get.mockImplementation((url: string) => {
    if (url === TOPICS_URL) {
      return Promise.resolve({ data })
    }
    return Promise.reject(new Error(`Unexpected GET ${url}`))
  })
}

function renderDialog(
  overrides: {
    onClose?: () => void
    onViewDrafts?: () => void
  } = {},
) {
  const onClose = overrides.onClose ?? vi.fn()
  const onViewDrafts = overrides.onViewDrafts ?? vi.fn()
  const utils = renderWithProviders(
    <GenerateQuestionsDialog
      material={materialDetailOk}
      onClose={onClose}
      onViewDrafts={onViewDrafts}
    />,
  )
  return { onClose, onViewDrafts, ...utils }
}

function generateButton() {
  return screen.getByRole('button', { name: 'Generate questions' })
}

async function chooseTopic() {
  await screen.findByRole('option', { name: 'Fractions' })
  await userEvent.selectOptions(screen.getByLabelText('Topic'), 'topic-1')
}

function setCount(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), {
    target: { value },
  })
}

describe('GenerateQuestionsDialog', () => {
  it('renders the form with topic, difficulty, counts and a zero total', async () => {
    serveTopics()
    renderDialog()
    expect(
      screen.getByRole('dialog', { name: 'Generate questions' }),
    ).toBeTruthy()
    const topicSelect = await screen.findByLabelText('Topic')
    expect(
      await screen.findByRole('option', { name: 'Fractions' }),
    ).toBeTruthy()
    expect(screen.getByRole('option', { name: 'Decimals' })).toBeTruthy()
    expect(topicSelect).toBeTruthy()
    expect(
      (screen.getByLabelText('Difficulty') as HTMLSelectElement).value,
    ).toBe('MEDIUM')
    expect(screen.getByText('Total: 0 of 40 questions')).toBeTruthy()
    expect(
      screen.getByText('Choose the topic these questions are about.'),
    ).toBeTruthy()
    expect((generateButton() as HTMLButtonElement).disabled).toBe(true)
  })

  it('requires at least one question once a topic is chosen', async () => {
    serveTopics()
    renderDialog()
    await chooseTopic()
    expect(
      screen.getByText('Request at least one question.'),
    ).toBeTruthy()
    expect((generateButton() as HTMLButtonElement).disabled).toBe(true)
    setCount('MCQ count', '5')
    expect(screen.queryByText('Request at least one question.')).toBeNull()
    expect(screen.getByText('Total: 5 of 40 questions')).toBeTruthy()
    expect((generateButton() as HTMLButtonElement).disabled).toBe(false)
  })

  it('blocks totals above the per-job cap', async () => {
    serveTopics()
    renderDialog()
    await chooseTopic()
    setCount('MCQ count', '40')
    setCount('FLASHCARD count', '1')
    expect(screen.getByText('Total: 41 of 40 questions')).toBeTruthy()
    expect(
      screen.getByText(
        'That is 41 questions — one job can generate at most 40. Reduce the counts.',
      ),
    ).toBeTruthy()
    expect((generateButton() as HTMLButtonElement).disabled).toBe(true)
    setCount('FLASHCARD count', '0')
    expect((generateButton() as HTMLButtonElement).disabled).toBe(false)
  })

  it('clamps counts into the 0–40 range', async () => {
    serveTopics()
    renderDialog()
    await chooseTopic()
    const input = screen.getByLabelText(
      'MCQ count',
    ) as HTMLInputElement
    setCount('MCQ count', '99')
    expect(input.value).toBe('40')
    setCount('MCQ count', '-3')
    expect(input.value).toBe('0')
    setCount('MCQ count', '')
    expect(input.value).toBe('0')
    setCount('MCQ count', '7')
    expect(input.value).toBe('7')
  })

  it('disables the topic select while topics load', async () => {
    mock.get.mockImplementation((url: string) => {
      if (url === TOPICS_URL) {
        return new Promise(() => {})
      }
      return Promise.reject(new Error(`Unexpected GET ${url}`))
    })
    renderDialog()
    const topicSelect = screen.getByLabelText(
      'Topic',
    ) as HTMLSelectElement
    expect(topicSelect.disabled).toBe(true)
    expect(screen.getByRole('option', { name: 'Loading topics…' })).toBeTruthy()
  })

  it('surfaces the backend message when topics fail to load', async () => {
    mock.get.mockImplementation((url: string) => {
      if (url === TOPICS_URL) {
        return Promise.reject({
          response: { data: { message: 'Topics are unavailable' } },
        })
      }
      return Promise.reject(new Error(`Unexpected GET ${url}`))
    })
    renderDialog()
    expect(await screen.findByText('Topics are unavailable')).toBeTruthy()
  })

  it('uses a fallback message for a non-envelope topics failure', async () => {
    mock.get.mockImplementation((url: string) => {
      if (url === TOPICS_URL) {
        return Promise.reject(new Error('network down'))
      }
      return Promise.reject(new Error(`Unexpected GET ${url}`))
    })
    renderDialog()
    expect(await screen.findByText('Could not load the topics.')).toBeTruthy()
  })

  it('notes when the grade and subject has no topics yet', async () => {
    serveTopics([])
    renderDialog()
    expect(
      await screen.findByText(
        'There are no topics for this grade and subject yet.',
      ),
    ).toBeTruthy()
  })

  it('creates the job and transitions to the job view', async () => {
    serveTopics()
    mock.get.mockImplementation((url: string) => {
      if (url === TOPICS_URL) {
        return Promise.resolve({ data: topics })
      }
      if (url === '/generation-jobs/job-1') {
        return Promise.resolve({ data: jobDetailRunning })
      }
      return Promise.reject(new Error(`Unexpected GET ${url}`))
    })
    mock.post.mockResolvedValue({ data: generationJobCreated })
    const onClose = vi.fn()
    renderDialog({ onClose })

    await chooseTopic()
    setCount('MCQ count', '5')
    setCount('WRITTEN count', '2')
    await userEvent.selectOptions(
      screen.getByLabelText('Difficulty'),
      'HARD',
    )
    await userEvent.click(generateButton())

    await waitFor(() =>
      expect(mock.post).toHaveBeenCalledWith('/materials/mat-1/generate', {
        topicId: 'topic-1',
        counts: { MCQ: 5, WRITTEN: 2 },
        difficulty: 'HARD',
      }),
    )
    expect(
      await screen.findByText('Generating questions from this chapter…'),
    ).toBeTruthy()
    expect(screen.queryByLabelText('Topic')).toBeNull()

    await userEvent.click(screen.getByRole('button', { name: 'Done' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('surfaces the backend message when job creation fails', async () => {
    serveTopics()
    mock.post.mockRejectedValue({
      response: {
        data: {
          code: 'LRN-GEN-004',
          message: 'You have reached the daily generation limit.',
        },
      },
    })
    renderDialog()
    await chooseTopic()
    setCount('MCQ count', '3')
    await userEvent.click(generateButton())
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toBe(
      'You have reached the daily generation limit.',
    )
    expect(screen.getByLabelText('Topic')).toBeTruthy()
  })

  it('closes from the header and cancel buttons without submitting', async () => {
    serveTopics()
    const onClose = vi.fn()
    renderDialog({ onClose })
    await screen.findByLabelText('Topic')
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(2)
    expect(mock.post).not.toHaveBeenCalled()
  })
})
