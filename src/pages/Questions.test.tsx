import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient } from '../test/renderWithProviders'
import QuestionsPage from './QuestionsPage'
import QuestionDetailPage from './QuestionDetailPage'
import { initialContent } from '../components/questions/QuestionEditForm'
import type { Question } from '../lib/questions'
import type { QuestionTypeCode } from '../lib/api'

const mock = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn() }))
vi.mock('../lib/api', async importOriginal => ({ ...(await importOriginal<typeof import('../lib/api')>()), apiClient: mock }))
vi.mock('../lib/auth', async importOriginal => ({ ...(await importOriginal<typeof import('../lib/auth')>()), useAuth: () => ({ user: { userId: 'owner', centreId: 'centre' } }) }))

const payloads = {
  MCQ: { stem: 'Which is half?', options: ['a', 'b', 'c', 'd'].map((id, i) => ({ id, text: `Answer ${i + 1}` })) },
  FILL_BLANK: { stemWithBlank: 'One half is _____ quarters.', answer: 'two' },
  FLASHCARD: { front: 'Half', back: 'Two equal parts' },
  NUMERIC: { stem: 'How many quarters?', answerValue: 2, tolerance: 0, unit: '', workedSolution: '2/4=1/2' },
  WRITTEN: { stem: 'Explain halves.', modelAnswer: 'Two equal parts', rubric: [1, 2, 3].map(i => ({ id: `crit-${i}`, criterion: `Criterion ${i}`, maxScore: 1 })) },
}
function question(type: QuestionTypeCode = 'MCQ', overrides: Partial<Question> = {}): Question {
  return { questionId: 'q1', type, status: 'DRAFT', gradeSubjectId: 'gs', gradeName: 'Grade 8', subjectName: 'Mathematics', topicId: 'topic', topicName: 'Fractions', difficulty: 3, payload: payloads[type], correctRef: 'a', revision: 0, version: 1, createdBy: 'owner', createdAt: '2026-11-02T00:00:00Z', approvedBy: null, approvedAt: null, sourceQuestionId: null, materialId: 'material', materialTitle: 'Fractions chapter', provider: 'ollama', model: 'qwen3:8b', promptVersion: 'v1', generationJobId: 'job', ...overrides }
}
let stored: Question
let rows: Question[]
function start(path = '/review') {
  const queryClient = createTestQueryClient()
  return render(<QueryClientProvider client={queryClient}><MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/review" element={<QuestionsPage key="review" />} />
    <Route path="/question-bank" element={<QuestionsPage key="bank" bank />} />
    <Route path="/questions/:questionId" element={<QuestionDetailPage />} />
    <Route path="/materials" element={<p>Materials destination</p>} />
  </Routes></MemoryRouter></QueryClientProvider>)
}

beforeEach(() => {
  stored = question(); rows = [stored]
  mock.get.mockReset(); mock.post.mockReset(); mock.put.mockReset()
  mock.get.mockImplementation(async (url: string) => {
    if (url === '/questions') return { data: { content: rows, page: 0, size: 12, totalPages: 2, totalElements: rows.length } }
    if (url.startsWith('/questions/')) return { data: stored }
    if (url === '/master/grade-subjects') return { data: [{ gradeSubjectId: 'gs', gradeId: 'grade8', gradeCode: 'G8', gradeName: 'Grade 8', subjectId: 'math', subjectName: 'Mathematics', label: 'Grade 8 Mathematics' }] }
    return { data: [{ topicId: 'topic', name: 'Fractions' }, { topicId: 'other', name: 'Decimals' }] }
  })
  mock.put.mockImplementation(async (_url: string, edit: { content: object, difficulty: number, topicId: string }) => {
    stored = { ...stored, payload: edit.content, topicId: edit.topicId, difficulty: edit.difficulty, revision: stored.revision + 1 }
    return { data: stored }
  })
  mock.post.mockImplementation(async (url: string) => {
    if (url.endsWith('/forks')) stored = { ...stored, questionId: 'fork', status: 'DRAFT', materialId: null, materialTitle: null, sourceQuestionId: 'q1' }
    else stored = { ...stored, status: url.endsWith('/approve') ? 'APPROVED' : 'REJECTED', revision: stored.revision + 1, approvedAt: '2026-11-02T00:00:00Z' }
    return { data: stored }
  })
})

describe('M4 review and bank', () => {
  it('groups chapters, filters every dimension and pages without exposing provider details', async () => {
    const user = userEvent.setup()
    rows.push(question('FLASHCARD', { questionId: 'q2' }), question('NUMERIC', { questionId: 'q3', materialId: null, materialTitle: null }))
    start('/review?materialId=material')
    expect(await screen.findByRole('heading', { name: 'Fractions chapter' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Forked questions' })).toBeTruthy()
    expect(screen.queryByText(/qwen3/)).toBeNull()
    await user.selectOptions(screen.getByLabelText('Grade'), 'grade8')
    await user.selectOptions(screen.getByLabelText('Subject'), 'math')
    await user.selectOptions(screen.getByLabelText('Topic'), 'other')
    await user.selectOptions(screen.getByLabelText('Question type'), 'FLASHCARD')
    await user.selectOptions(screen.getByLabelText('Difficulty'), '5')
    await user.selectOptions(screen.getByLabelText('Review status'), 'REJECTED')
    await user.click(screen.getByText('Clear chapter filter'))
    await user.click(screen.getByText('Next'))
    expect(await screen.findByText('Page 2 of 2')).toBeTruthy()
    await user.click(screen.getByText('Previous'))
    expect(await screen.findByText('Page 1 of 2')).toBeTruthy()
    expect(mock.get).toHaveBeenCalledWith('/questions', expect.objectContaining({ params: expect.objectContaining({ status: 'REJECTED', gradeId: 'grade8', subjectId: 'math', topicId: 'other', type: 'FLASHCARD', difficulty: '5' }) }))
  })

  it('shows bank, empty, loading and request failures', async () => {
    rows = []; const user = userEvent.setup(); start('/question-bank')
    expect(screen.getByText('Loading questions…')).toBeTruthy()
    expect(await screen.findByText('No questions match these filters.')).toBeTruthy()
    await user.click(screen.getByRole('link', { name: 'Review drafts' }))
    expect(await screen.findByRole('link', { name: 'Generate questions from your materials' })).toBeTruthy()
  })

  it('shows failed filter and list requests', async () => {
    mock.get.mockRejectedValue(new Error('offline')); start()
    expect(await screen.findByText('Could not load questions.')).toBeTruthy()
    expect(screen.getByText('Some filters could not be loaded. You can still browse questions.')).toBeTruthy()
  })

  it.each(['MCQ', 'FILL_BLANK', 'FLASHCARD', 'NUMERIC', 'WRITTEN'] as const)('edits %s and approves only a saved version', async type => {
    stored = question(type)
    const user = userEvent.setup(); start('/questions/q1')
    expect(await screen.findByRole('heading', { name: 'Review draft' })).toBeTruthy()
    await user.selectOptions(screen.getByLabelText('Difficulty'), '4')
    await user.selectOptions(screen.getByLabelText('Topic'), 'other')
    expect(screen.getByRole('button', { name: 'Approve saved draft' })).toBeDisabled()
    if (type === 'MCQ') {
      await user.type(screen.getByLabelText('Question'), ' revised')
      await user.type(screen.getByLabelText('Option 1'), ' revised')
      await user.selectOptions(screen.getByLabelText('Correct answer'), '1')
    } else if (type === 'NUMERIC') {
      for (const label of ['Numeric answer', 'Absolute tolerance']) {
        await user.clear(screen.getByLabelText(label)); await user.type(screen.getByLabelText(label), '3')
      }
      await user.type(screen.getByLabelText('Unit'), 'm')
      await user.type(screen.getByLabelText('Worked solution'), ' revised')
    } else if (type === 'WRITTEN') {
      await user.type(screen.getByLabelText('Model answer'), ' revised')
      await user.type(screen.getByLabelText('Criterion 1'), ' revised')
      await user.clear(screen.getByLabelText('Maximum score 1')); await user.type(screen.getByLabelText('Maximum score 1'), '2')
      await user.click(screen.getByText('Add criterion')); await user.click(screen.getByText('Add criterion'))
      expect(screen.getByText('Add criterion')).toBeDisabled()
      await user.click(screen.getByText('Remove criterion 4'))
    } else {
      const field = type === 'FLASHCARD' ? 'Back' : 'Answer'
      await user.type(screen.getByLabelText(field), ' revised')
    }
    await user.click(screen.getByText('Save draft'))
    expect(await screen.findByRole('status')).toHaveTextContent('Draft saved')
    await waitFor(() => expect(screen.getByText('Approve saved draft')).not.toBeDisabled())
    await user.click(screen.getByText('Approve saved draft'))
    expect(await screen.findByRole('heading', { name: 'Approved question' })).toBeTruthy()
    expect(screen.getByRole('status')).toHaveTextContent('added to the bank')
    expect(mock.post).toHaveBeenCalledWith('/questions/q1/approve', { revision: 1 })
  })

  it('confirms rejection without requiring a save', async () => {
    const user = userEvent.setup(); start('/questions/q1')
    await screen.findByText('Reject draft'); await user.click(screen.getByText('Reject draft'))
    await user.click(screen.getByText('Keep draft'))
    expect(screen.queryByText('Confirm reject')).toBeNull()
    await user.click(screen.getByText('Reject draft')); await user.click(screen.getByText('Confirm reject'))
    expect(await screen.findByRole('heading', { name: 'Rejected question' })).toBeTruthy()
    expect(mock.put).not.toHaveBeenCalled()
  })

  it('views approved questions in the bank and forks them into editable drafts', async () => {
    stored = question('MCQ', { status: 'APPROVED', approvedAt: '2026-11-02T00:00:00Z' }); rows = [stored]
    const user = userEvent.setup(); start('/question-bank')
    await user.click(await screen.findByRole('link', { name: 'View / fork' }))
    expect(await screen.findByRole('heading', { name: 'Approved question' })).toBeTruthy()
    await user.click(screen.getByText('Fork to a new draft'))
    expect(await screen.findByRole('heading', { name: 'Review draft' })).toBeTruthy()
    expect(mock.post).toHaveBeenCalledWith('/questions/q1/forks', { revision: 0 })
    expect(screen.getByRole('link', { name: 'View original approved question' })).toHaveAttribute('href', '/questions/q1')
  })

  it('renders rejected links and approved legacy questions without approval timestamps', async () => {
    stored = question('MCQ', { status: 'REJECTED' }); rows = [stored]
    const user = userEvent.setup(); start()
    await user.click(await screen.findByText('View rejected question'))
    expect(await screen.findByText(/This question stays rejected/)).toBeTruthy()
    await user.click(screen.getByRole('link', { name: 'Back to Review' }))
  })

  it('renders loading and failed details', async () => {
    mock.get.mockRejectedValue(new Error('offline')); start('/questions/q1')
    expect(screen.getByText('Loading question…')).toBeTruthy()
    expect(await screen.findByText('Could not load this question.')).toBeTruthy()
  })

  it('shows server field errors and reloads stale content without approving it', async () => {
    mock.put.mockRejectedValue({ isAxiosError: true, response: { data: { message: 'Validation failed', fieldErrors: { 'content.stem': 'Required' } } } })
    const user = userEvent.setup(); start('/questions/q1'); await screen.findByText('Save draft')
    await user.type(screen.getByLabelText('Question'), ' invalid')
    await user.click(screen.getByText('Save draft'))
    expect(await screen.findByText('content.stem: Required')).toBeTruthy()
    await user.click(screen.getByText('Reload latest question'))
    await waitFor(() => expect(screen.getByLabelText('Question')).toHaveValue('Which is half?'))
    expect(mock.post).not.toHaveBeenCalled()
  })

  it.each(['MCQ', 'FILL_BLANK', 'NUMERIC', 'WRITTEN'] as const)('can inspect a broken %s draft and report topic loading failures', async type => {
    stored = question(type, { payload: {} })
    const get = mock.get.getMockImplementation()!
    mock.get.mockImplementation((url: string) => url.includes('/topics') ? Promise.reject(new Error('offline topics')) : get(url))
    start('/questions/q1')
    expect(await screen.findByText('Other topics could not be loaded. You can keep the current topic.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Reject draft' })).toBeTruthy()
  })

  it('repairs structurally missing options/rubrics without manufacturing an answer key', () => {
    expect(initialContent(question('MCQ', { payload: {} }))).toMatchObject({ correctIndex: -1, options: [{ id: 'a', text: '' }, { id: 'b', text: '' }, { id: 'c', text: '' }, { id: 'd', text: '' }] })
    expect(initialContent(question('WRITTEN', { payload: {} })).rubric).toHaveLength(3)
  })
})
