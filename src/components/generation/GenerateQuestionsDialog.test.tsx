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

/** Serves whatever getData returns at fetch time, so a test can change
 * the topic list between the initial load and a later refetch. */
function serveTopicsDynamic(getData: () => unknown) {
  mock.get.mockImplementation((url: string) => {
    if (url === TOPICS_URL) {
      return Promise.resolve({ data: getData() })
    }
    return Promise.reject(new Error(`Unexpected GET ${url}`))
  })
}

function topicSelect() {
  return screen.getByLabelText('Topic') as HTMLSelectElement
}

function addTopicButton() {
  return screen.getByRole('button', {
    name: 'Add topic',
  }) as HTMLButtonElement
}

async function openAddTopicForm() {
  await userEvent.click(
    screen.getByRole('button', { name: '+ New topic' }),
  )
  return screen.getByLabelText('New topic name') as HTMLInputElement
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

  it('invites adding a topic when the grade and subject has none', async () => {
    serveTopics([])
    renderDialog()
    expect(
      await screen.findByText(
        'No topics yet for this grade and subject — add the chapter’s topic.',
      ),
    ).toBeTruthy()
    // The add input is available directly, with no toggle to open first.
    expect(screen.getByLabelText('New topic name')).toBeTruthy()
    expect(screen.queryByRole('button', { name: '+ New topic' })).toBeNull()
    expect(addTopicButton().disabled).toBe(true)
  })

  it('adds a topic from the empty state and selects it', async () => {
    const created = { topicId: 'topic-9', name: 'Fractions' }
    let served: unknown = []
    serveTopicsDynamic(() => served)
    mock.post.mockImplementation((url: string) => {
      if (url === TOPICS_URL) {
        served = [created]
        return Promise.resolve({ data: created })
      }
      return Promise.reject(new Error(`Unexpected POST ${url}`))
    })
    renderDialog()
    const nameInput = await screen.findByLabelText('New topic name')
    await userEvent.type(nameInput, 'Fractions')
    await userEvent.click(addTopicButton())
    await waitFor(() =>
      expect(mock.post).toHaveBeenCalledWith(TOPICS_URL, {
        name: 'Fractions',
      }),
    )
    await waitFor(() => expect(topicSelect().value).toBe('topic-9'))
    expect(screen.queryByLabelText('New topic name')).toBeNull()
  })

  it('adds a topic alongside existing topics and refetches the list', async () => {
    const created = { topicId: 'topic-3', name: 'Geometry' }
    let served: unknown = topics
    let topicFetches = 0
    mock.get.mockImplementation((url: string) => {
      if (url === TOPICS_URL) {
        topicFetches += 1
        return Promise.resolve({ data: served })
      }
      return Promise.reject(new Error(`Unexpected GET ${url}`))
    })
    mock.post.mockImplementation((url: string) => {
      if (url === TOPICS_URL) {
        served = [...topics, created]
        return Promise.resolve({ data: created })
      }
      return Promise.reject(new Error(`Unexpected POST ${url}`))
    })
    renderDialog()
    await screen.findByRole('option', { name: 'Fractions' })
    expect(topicFetches).toBe(1)

    const nameInput = await openAddTopicForm()
    await userEvent.type(nameInput, 'Geometry')
    await userEvent.click(addTopicButton())

    await waitFor(() =>
      expect(mock.post).toHaveBeenCalledWith(TOPICS_URL, {
        name: 'Geometry',
      }),
    )
    // The created topic is selected, the list was refetched so the
    // select offers it, and the add input has collapsed.
    await waitFor(() => expect(topicSelect().value).toBe('topic-3'))
    expect(topicFetches).toBeGreaterThan(1)
    expect(screen.getByRole('option', { name: 'Geometry' })).toBeTruthy()
    expect(screen.queryByLabelText('New topic name')).toBeNull()
  })

  it('adds a topic when Enter is pressed in the name input', async () => {
    const created = { topicId: 'topic-3', name: 'Geometry' }
    let served: unknown = topics
    serveTopicsDynamic(() => served)
    mock.post.mockImplementation((url: string) => {
      if (url === TOPICS_URL) {
        served = [...topics, created]
        return Promise.resolve({ data: created })
      }
      return Promise.reject(new Error(`Unexpected POST ${url}`))
    })
    renderDialog()
    const nameInput = await openAddTopicForm()
    await userEvent.type(nameInput, 'Geometry{enter}')
    await waitFor(() =>
      expect(mock.post).toHaveBeenCalledWith(TOPICS_URL, {
        name: 'Geometry',
      }),
    )
    // Enter added the topic instead of submitting the generate form.
    expect(mock.post).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(topicSelect().value).toBe('topic-3'))
  })

  it('selects the existing topic when the name is already taken', async () => {
    serveTopics()
    // The backend answers 200 with the already-existing topic; the
    // client treats it exactly like a creation.
    mock.post.mockResolvedValue({ data: topics[0] })
    renderDialog()
    const nameInput = await openAddTopicForm()
    await userEvent.type(nameInput, 'Fractions')
    await userEvent.click(addTopicButton())
    await waitFor(() => expect(topicSelect().value).toBe('topic-1'))
    expect(screen.queryByLabelText('New topic name')).toBeNull()
  })

  it('keeps the typed name and shows the message when adding fails', async () => {
    serveTopics()
    mock.post.mockRejectedValue({
      response: {
        data: { message: 'A topic with this name already exists.' },
      },
    })
    renderDialog()
    const nameInput = await openAddTopicForm()
    await userEvent.type(nameInput, 'Fractions')
    await userEvent.click(addTopicButton())
    expect(
      await screen.findByText('A topic with this name already exists.'),
    ).toBeTruthy()
    const input = screen.getByLabelText(
      'New topic name',
    ) as HTMLInputElement
    expect(input.value).toBe('Fractions')
    expect(topicSelect().value).toBe('')
  })

  it('cannot submit a blank topic name', async () => {
    serveTopics()
    renderDialog()
    const nameInput = await openAddTopicForm()
    expect(addTopicButton().disabled).toBe(true)
    await userEvent.type(nameInput, '   {enter}')
    expect(addTopicButton().disabled).toBe(true)
    expect(mock.post).not.toHaveBeenCalled()
  })

  it('blocks topic names over 200 characters with a hint', async () => {
    serveTopics()
    renderDialog()
    const nameInput = await openAddTopicForm()
    fireEvent.change(nameInput, { target: { value: 'x'.repeat(201) } })
    expect(
      screen.getByText('Topic names are limited to 200 characters.'),
    ).toBeTruthy()
    expect(addTopicButton().disabled).toBe(true)
    fireEvent.change(nameInput, { target: { value: 'x'.repeat(200) } })
    expect(
      screen.queryByText('Topic names are limited to 200 characters.'),
    ).toBeNull()
    expect(addTopicButton().disabled).toBe(false)
  })

  it('disables the add button while the topic is being created', async () => {
    serveTopics()
    mock.post.mockImplementation(() => new Promise(() => {}))
    renderDialog()
    const nameInput = await openAddTopicForm()
    await userEvent.type(nameInput, 'Geometry')
    await userEvent.click(addTopicButton())
    await waitFor(() => expect(addTopicButton().disabled).toBe(true))
  })

  it('preselects the topic when the grade and subject has only one', async () => {
    serveTopics([topics[0]])
    renderDialog()
    await screen.findByRole('option', { name: 'Fractions' })
    await waitFor(() => expect(topicSelect().value).toBe('topic-1'))
    expect(
      screen.getByText('Request at least one question.'),
    ).toBeTruthy()
  })

  it('does not override a manual topic change when the list refetches', async () => {
    let served: unknown = [topics[0]]
    serveTopicsDynamic(() => served)
    const { queryClient } = renderDialog()
    await screen.findByRole('option', { name: 'Fractions' })
    await waitFor(() => expect(topicSelect().value).toBe('topic-1'))

    // The teacher clears the preselection, making their own choice.
    await userEvent.selectOptions(topicSelect(), '')
    expect(topicSelect().value).toBe('')

    // The list refetches (now holding a different single topic); the
    // cleared selection must not be overridden by the shortcut.
    served = [topics[1]]
    await queryClient.invalidateQueries({
      queryKey: ['topics', 'gs-1'],
    })
    await screen.findByRole('option', { name: 'Decimals' })
    expect(topicSelect().value).toBe('')
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
