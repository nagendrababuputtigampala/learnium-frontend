import { QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient } from '../test/renderWithProviders'
import TestsPage from './TestsPage'
import TestBuilderPage from './TestBuilderPage'
import InstancesPage from './InstancesPage'
import CopyCode from '../components/tests/CopyCode'
import ApiFailure from '../components/tests/ApiFailure'
import { useInstanceRoster, type Definition, type DefinitionRequest, type Instance, type PublishRequest, type TestItem, type TestKind } from '../lib/tests'

const mock = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), user: null as { userId: string; centreId: string } | null }))
vi.mock('../lib/api', async importOriginal => ({ ...(await importOriginal<typeof import('../lib/api')>()), apiClient: mock }))
vi.mock('../lib/auth', async importOriginal => ({ ...(await importOriginal<typeof import('../lib/auth')>()), useAuth: () => ({ user: mock.user }) }))

const catalogue = [
  { gradeSubjectId: 'gs1', gradeId: 'g8', subjectId: 'math', gradeCode: 'G8', gradeName: 'Grade 8', subjectName: 'Mathematics', label: 'Grade 8 Mathematics' },
  { gradeSubjectId: 'gs2', gradeId: 'g9', subjectId: 'math', gradeCode: 'G9', gradeName: 'Grade 9', subjectName: 'Mathematics', label: 'Grade 9 Mathematics' },
]
const allItems: TestItem[] = [
  { questionId: 'q1', type: 'MCQ', topicName: 'Fractions', marks: 2.5, displayOrder: 0, payload: { stem: 'Which fraction?' }, correctRef: 'a' },
  { questionId: 'q2', type: 'WRITTEN', topicName: 'Fractions', marks: 0.75, displayOrder: 1, payload: { stem: 'Explain halves' }, correctRef: 'modelAnswer' },
  { questionId: 'q3', type: 'FLASHCARD', topicName: 'Fractions', marks: 0, displayOrder: 2, payload: { front: 'Half card', back: 'Two quarters' }, correctRef: 'back' },
  { questionId: 'q4', type: 'FILL_BLANK', topicName: 'Fractions', marks: 1, displayOrder: 3, payload: { stemWithBlank: 'One _____ blank' }, correctRef: 'two' },
  { questionId: 'q5', type: 'NUMERIC', topicName: 'Fractions', marks: 1, displayOrder: 4, payload: { stem: 'Calculate halves' }, correctRef: '{}' },
]
const bankRows = allItems.map(item => ({ ...item, stemPreview: String(item.payload.stem ?? item.payload.stemWithBlank ?? item.payload.front), gradeSubjectId: 'gs1', status: 'APPROVED' }))
const batches = [{ batchId: 'b1', name: 'Batch 8', gradeSubjectId: 'gs1', studentCount: 1 }, { batchId: 'b2', name: 'Batch 9', gradeSubjectId: 'gs2', studentCount: 0 }]
const roster = [{ userId: 's1', fullName: 'Assigned Student', status: 'ACTIVE' }, { userId: 's2', fullName: 'Late Student', status: 'ACTIVE' }, { userId: 's3', fullName: 'Inactive Student', status: 'INACTIVE' }]
function definition(kind: TestKind = 'SCORED_TEST', overrides: Partial<Definition> = {}): Definition {
  return { id: 't1', name: 'Fractions check', kind, gradeSubjectId: 'gs1', gradeName: 'Grade 8', subjectName: 'Mathematics', createdBy: 'owner', questionCount: kind === 'SCORED_TEST' ? 2 : 1, totalMarks: kind === 'SCORED_TEST' ? 3.25 : 0, publishedInstanceCount: 0, items: kind === 'SCORED_TEST' ? allItems.slice(0, 2) : [allItems[2]], ...overrides }
}
function instance(overrides: Partial<Instance> = {}): Instance {
  return { id: 'i1', testId: 't1', name: 'Fractions check', kind: 'SCORED_TEST', batchId: 'b1', batchName: 'Batch 8', joinCode: 'ABCDEFGH', status: 'OPEN', opensAt: new Date(Date.now() - 3600000).toISOString(), closesAt: new Date(Date.now() + 7200000).toISOString(), closedAt: null, timeLimitSeconds: null, maxAttempts: 1, answerReleasePolicy: 'AFTER_CLOSE', integrityEnabled: false, cameraMode: 'OFF', items: allItems.slice(0, 2), students: [{ userId: 's1', name: 'Assigned Student', addedBy: 'owner', addedAt: new Date().toISOString() }], ...overrides }
}
let definitions: Definition[]
let instances: Instance[]
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T
function start(path = '/tests') {
  const cache = createTestQueryClient()
  render(<QueryClientProvider client={cache}><MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/tests" element={<TestsPage />} /><Route path="/tests/new" element={<TestBuilderPage />} /><Route path="/tests/:testId" element={<TestBuilderPage />} />
    <Route path="/instances" element={<InstancesPage />} /><Route path="/instances/:instanceId" element={<InstancesPage />} />
  </Routes></MemoryRouter></QueryClientProvider>)
  return cache
}
function enrich(items: DefinitionRequest['items']): TestItem[] { return items.map((item, index) => ({ ...allItems.find(q => q.questionId === item.questionId)!, marks: item.marks, displayOrder: index })) }
function selectedCard(name = 'Fractions check') { return screen.getByRole('heading', { name }).closest('article')! }

beforeEach(() => {
  definitions = [definition()]; instances = [instance()]; mock.user = { userId: 'owner', centreId: 'centre' }
  mock.get.mockReset(); mock.post.mockReset(); mock.put.mockReset(); mock.delete.mockReset()
  mock.get.mockImplementation(async (url: string, config?: { params?: Record<string, string | number> }) => {
    if (url === '/tests') return { data: clone(definitions.map(d => ({ ...d, items: [] }))) }
    if (url.startsWith('/tests/')) return { data: clone(definitions.find(d => d.id === url.split('/').pop())!) }
    if (url === '/master/grade-subjects') return { data: catalogue }
    if (url === '/questions') return { data: { content: config?.params?.page === 1 ? [] : bankRows.filter(q => !config?.params?.type || q.type === config.params.type), page: config?.params?.page, size: 12, totalPages: 2, totalElements: bankRows.length } }
    if (url === '/batches') return { data: batches }
    if (url.includes('/students')) return { data: roster }
    if (url === '/instances') return { data: clone(instances.filter(i => !config?.params?.batchId || i.batchId === config.params.batchId).map(i => ({ ...i, items: [], students: [] }))) }
    if (url.startsWith('/instances/')) return { data: clone(instances.find(i => i.id === url.split('/').pop())!) }
    throw new Error('Unexpected request')
  })
  mock.post.mockImplementation(async (url: string, request: DefinitionRequest & PublishRequest & { userId?: string }) => {
    if (url === '/tests') {
      const made = definition(request.kind, { ...request, id: 'created', items: enrich(request.items), questionCount: request.items.length, totalMarks: request.items.reduce((sum, item) => sum + item.marks, 0) })
      definitions = [...definitions, made]; return { data: clone(made) }
    }
    if (url.endsWith('/publish')) {
      const source = definitions.find(d => d.id === url.split('/')[2])!
      const made = instance({ id: 'published', name: source.name, kind: source.kind, items: enrich(request.items), opensAt: request.opensAt, closesAt: request.closesAt, maxAttempts: request.maxAttempts, answerReleasePolicy: request.answerReleasePolicy, integrityEnabled: request.integrityEnabled, cameraMode: request.cameraMode, timeLimitSeconds: request.timeLimitSeconds ?? null })
      instances = [...instances, made]; definitions = definitions.map(d => d.id === source.id ? { ...d, publishedInstanceCount: d.publishedInstanceCount + 1 } : d)
      return { data: clone(made) }
    }
    const id = url.split('/')[2]; const current = instances.find(i => i.id === id)!
    const next = url.endsWith('/close') ? { ...current, status: 'CLOSED' as const, closedAt: new Date().toISOString() } : url.endsWith('/regenerate-code') ? { ...current, joinCode: 'NEWCODE8' } : { ...current, students: [...current.students, { userId: request.userId!, name: roster.find(s => s.userId === request.userId)!.fullName, addedBy: 'owner', addedAt: new Date().toISOString() }] }
    instances = instances.map(i => i.id === id ? next : i); return { data: clone(next) }
  })
  mock.put.mockImplementation(async (url: string, request: DefinitionRequest) => {
    const old = definitions.find(d => d.id === url.split('/')[2])!
    const next = { ...old, ...request, items: enrich(request.items), questionCount: request.items.length, totalMarks: request.items.reduce((sum, item) => sum + item.marks, 0) }
    definitions = definitions.map(d => d.id === old.id ? next : d); return { data: clone(next) }
  })
  mock.delete.mockImplementation(async (url: string) => { definitions = definitions.filter(d => d.id !== url.split('/')[2]); return {} })
})

describe('M4 definitions and publishing', () => {
  it('shows both owned kinds with their summaries and handles empty lists', async () => {
    definitions.push(definition('FLASHCARD_PRACTICE', { id: 'practice', name: 'Flashcard revision' }))
    const user = userEvent.setup(); start()
    expect(screen.getByText('Loading test definitions…')).toBeTruthy()
    expect(await screen.findByText('Scored test')).toBeTruthy(); expect(screen.getByText('Flashcard practice')).toBeTruthy()
    expect(screen.getByText('2 questions · 3.25 marks · 0 published instances')).toBeTruthy()
    await user.click(screen.getByRole('link', { name: 'Build a test' })); expect(await screen.findByText('Choose a grade and subject to browse compatible bank questions.')).toBeTruthy()
  })
  it('shows an empty definition list', async () => {
    definitions = []; start(); expect(await screen.findByText(/No test definitions yet/)).toBeTruthy()
  })
  it('builds a scored test with locked bank filters, ordering, removal and decimal marks', async () => {
    const user = userEvent.setup(); start('/tests/new')
    expect(screen.getByText('Save definition')).toBeDisabled()
    await user.type(screen.getByLabelText('Test name'), 'New fractions')
    await user.selectOptions(screen.getByLabelText('Grade and subject'), 'gs1')
    await user.click(await screen.findByRole('button', { name: 'Add question: Which fraction?' }))
    expect(screen.queryByRole('button', { name: 'Add question: Half card' })).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Add question: Explain halves' }))
    await user.click(screen.getByRole('button', { name: 'Move question 2 up' })); await user.click(screen.getByRole('button', { name: 'Move question 1 down' }))
    await user.clear(screen.getByLabelText('Marks for question 1')); await user.type(screen.getByLabelText('Marks for question 1'), '2.50')
    await user.clear(screen.getByLabelText('Marks for question 2')); await user.type(screen.getByLabelText('Marks for question 2'), '0.75')
    expect(screen.getByText('Total marks: 3.25')).toBeTruthy()
    await user.selectOptions(screen.getByLabelText('Bank question type'), 'NUMERIC')
    await user.click(await screen.findByRole('button', { name: 'Add question: Calculate halves' }))
    await user.click(screen.getByRole('button', { name: 'Remove question 3' }))
    await user.click(screen.getByText('Next bank page')); expect(await screen.findByText('No compatible questions on this page.')).toBeTruthy()
    await user.click(screen.getByText('Previous bank page'))
    expect(mock.get).toHaveBeenCalledWith('/questions', expect.objectContaining({ params: expect.objectContaining({ gradeSubjectId: 'gs1', status: 'APPROVED' }) }))
    await user.click(screen.getByText('Save definition')); expect(await screen.findByRole('heading', { name: 'My Tests' })).toBeTruthy()
    expect(mock.post).toHaveBeenCalledWith('/tests', { name: 'New fractions', gradeSubjectId: 'gs1', kind: 'SCORED_TEST', items: [{ questionId: 'q1', marks: 2.5 }, { questionId: 'q2', marks: 0.75 }] })
  })
  it('builds unscored flashcard practice and clears incompatible selections', async () => {
    const user = userEvent.setup(); start('/tests/new')
    await user.type(screen.getByLabelText('Test name'), 'Flashcard set')
    await user.selectOptions(screen.getByLabelText('Grade and subject'), 'gs1')
    await user.click(await screen.findByRole('button', { name: 'Add question: Which fraction?' }))
    await user.selectOptions(screen.getByLabelText('Test kind'), 'FLASHCARD_PRACTICE')
    expect(screen.getByText('Selected questions (0)')).toBeTruthy()
    await user.click(await screen.findByRole('button', { name: 'Add question: Half card' }))
    expect(screen.getByText('Unscored practice')).toBeTruthy(); expect(screen.queryByLabelText('Marks for question 1')).toBeNull()
    await user.selectOptions(screen.getByLabelText('Grade and subject'), 'gs2'); expect(screen.getByText('Selected questions (0)')).toBeTruthy()
    await user.click(await screen.findByRole('button', { name: 'Add question: Half card' }))
    await user.click(screen.getByText('Save definition')); await screen.findByRole('heading', { name: 'My Tests' })
    expect(mock.post).toHaveBeenCalledWith('/tests', expect.objectContaining({ kind: 'FLASHCARD_PRACTICE', items: [{ questionId: 'q3', marks: 0 }] }))
  })
  it('edits an existing definition and blocks publish until saved', async () => {
    const user = userEvent.setup(); start('/tests/t1')
    expect(screen.getByText('Loading test definition…')).toBeTruthy()
    await user.type(await screen.findByLabelText('Test name'), ' revised')
    expect(screen.getByText('Publish saved definition')).toBeDisabled(); expect(screen.getByText('Save changes before publishing.')).toBeTruthy()
    await user.clear(screen.getByLabelText('Marks for question 1')); await user.type(screen.getByLabelText('Marks for question 1'), '0.001')
    expect(screen.getByText('Save definition')).toBeDisabled()
    await user.clear(screen.getByLabelText('Marks for question 1')); await user.type(screen.getByLabelText('Marks for question 1'), '0.75')
    await user.click(screen.getByText('Save definition')); await screen.findByRole('heading', { name: 'My Tests' })
    expect(mock.put).toHaveBeenCalledWith('/tests/t1', expect.objectContaining({ name: 'Fractions check revised' }))
  })
  it('confirms deletion, preserves a cancelled definition and disables deletion after publishing', async () => {
    const user = userEvent.setup(); start('/tests/t1')
    await user.click(await screen.findByText('Delete definition')); await user.click(screen.getByText('Keep definition'))
    expect(mock.delete).not.toHaveBeenCalled()
    await user.click(screen.getByText('Delete definition')); await user.click(screen.getByText('Confirm delete'))
    expect(await screen.findByText(/No test definitions yet/)).toBeTruthy()
  })
  it('explains why a published definition cannot be deleted and opens saved publish review', async () => {
    definitions = [definition('SCORED_TEST', { publishedInstanceCount: 1 })]
    const user = userEvent.setup(); start('/tests/t1')
    expect(await screen.findByText('Delete definition')).toBeDisabled(); expect(screen.getByText(/Published definitions cannot be deleted/)).toBeTruthy()
    await user.click(screen.getByText('Publish saved definition')); expect(await screen.findByRole('dialog', { name: 'Publish test' })).toBeTruthy()
    await user.click(screen.getByText('Cancel publish')); expect(screen.queryByRole('dialog')).toBeNull()
  })
  it('publishes an independent final review with order, selection, fractional marks and settings', async () => {
    const user = userEvent.setup(); start()
    await user.click(await screen.findByText('Publish test')); const dialog = await screen.findByRole('dialog', { name: 'Publish test' })
    await within(dialog).findByText('Publish Fractions check')
    expect(within(dialog).getByText('Publish now')).toBeDisabled()
    await user.click(within(dialog).getByRole('button', { name: 'Move question 2 up' }))
    await user.click(within(dialog).getByRole('button', { name: 'Remove question 2' }))
    await user.click(within(dialog).getByRole('button', { name: 'Add question: Calculate halves' }))
    await user.clear(within(dialog).getByLabelText('Marks for question 1')); await user.type(within(dialog).getByLabelText('Marks for question 1'), '2.5')
    await user.selectOptions(within(dialog).getByLabelText('Batch'), 'b1')
    fireEvent.change(within(dialog).getByLabelText('Opens at'), { target: { value: '2026-11-10T10:00' } })
    fireEvent.change(within(dialog).getByLabelText('Closes at'), { target: { value: '2026-11-10T11:00' } })
    await user.type(within(dialog).getByLabelText('Time limit (minutes, optional)'), '20')
    await user.clear(within(dialog).getByLabelText('Maximum attempts')); await user.type(within(dialog).getByLabelText('Maximum attempts'), '3')
    await user.selectOptions(within(dialog).getByLabelText('Release answers'), 'ON_SUBMIT')
    await user.click(within(dialog).getByLabelText('Enable integrity setting')); await user.click(within(dialog).getByLabelText('Enable camera setting'))
    await user.click(within(dialog).getByText('Publish now')); expect(await screen.findByText('Test published')).toBeTruthy()
    expect(mock.post).toHaveBeenCalledWith('/tests/t1/publish', expect.objectContaining({ maxAttempts: 3, answerReleasePolicy: 'ON_SUBMIT', timeLimitSeconds: 1200, cameraMode: 'ON', integrityEnabled: true, items: [{ questionId: 'q2', marks: 2.5 }, { questionId: 'q5', marks: 1 }] }))
    expect(mock.put).not.toHaveBeenCalled()
    await user.click(screen.getByText('Copy join code')); expect(await screen.findByText('Join code copied.')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'View published instance' })).toHaveAttribute('href', '/instances/published')
    await user.click(screen.getByText('Done')); expect(screen.queryByRole('dialog')).toBeNull()
  })
  it('validates the publish window and defaults without time limit, then navigates to the instance', async () => {
    const user = userEvent.setup(); start(); await user.click(await screen.findByText('Publish test'))
    await screen.findByText('Publish Fractions check'); await user.selectOptions(screen.getByLabelText('Batch'), 'b1')
    fireEvent.change(screen.getByLabelText('Opens at'), { target: { value: '' } }); expect(screen.getByText('Publish now')).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Opens at'), { target: { value: '2026-11-10T10:00' } }); fireEvent.change(screen.getByLabelText('Closes at'), { target: { value: '2026-11-10T09:00' } }); expect(screen.getByText('Publish now')).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Closes at'), { target: { value: '2026-11-10T11:00' } })
    await user.clear(screen.getByLabelText('Maximum attempts')); await user.type(screen.getByLabelText('Maximum attempts'), '0'); expect(screen.getByText('Publish now')).toBeDisabled()
    await user.clear(screen.getByLabelText('Maximum attempts')); await user.type(screen.getByLabelText('Maximum attempts'), '1.5'); expect(screen.getByText('Publish now')).toBeDisabled()
    await user.clear(screen.getByLabelText('Maximum attempts')); await user.type(screen.getByLabelText('Maximum attempts'), '1')
    await user.type(screen.getByLabelText('Time limit (minutes, optional)'), '0'); expect(screen.getByText('Publish now')).toBeDisabled()
    await user.clear(screen.getByLabelText('Time limit (minutes, optional)'))
    await user.click(screen.getByText('Publish now')); await screen.findByText('Test published')
    expect(mock.post).toHaveBeenCalledWith('/tests/t1/publish', expect.objectContaining({ maxAttempts: 1, answerReleasePolicy: 'AFTER_CLOSE', cameraMode: 'OFF', integrityEnabled: false }))
    const sent = mock.post.mock.calls.at(-1)![1]; expect(sent).not.toHaveProperty('timeLimitSeconds')
    await user.click(screen.getByText('View published instance')); expect(await screen.findByRole('heading', { name: 'Published instances' })).toBeTruthy()
  })
})

describe('M4 instance controls', () => {
  it('shows all derived statuses and filters by manageable batch', async () => {
    instances.push(instance({ id: 'scheduled', name: 'Later test', status: 'SCHEDULED' }), instance({ id: 'closed', name: 'Old test', status: 'CLOSED', batchId: 'b2' }))
    const user = userEvent.setup(); start('/instances')
    expect(screen.getByText('Loading instances…')).toBeTruthy(); expect(await screen.findByText('Open')).toBeTruthy(); expect(screen.getByText('Scheduled')).toBeTruthy(); expect(screen.getByText('Closed')).toBeTruthy()
    expect(within(selectedCard('Old test')).getByText('Close early')).toBeDisabled()
    await user.selectOptions(screen.getByLabelText('Filter by batch'), 'b1')
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Old test' })).toBeNull())
    expect(mock.get).toHaveBeenCalledWith('/instances', { params: { batchId: 'b1' } })
  })
  it('confirms code regeneration and early close, including a cancelled action', async () => {
    const user = userEvent.setup(); start('/instances'); await screen.findByText('Fractions check')
    await user.click(screen.getByText('Regenerate code')); await user.click(screen.getByText('Cancel action')); expect(mock.post).not.toHaveBeenCalled()
    await user.click(screen.getByText('Regenerate code')); await user.click(screen.getByText('Confirm action'))
    expect(await screen.findByText('NEWCODE8')).toBeTruthy()
    await user.click(screen.getByText('Close early')); expect(screen.getByText('Close this instance early?')).toBeTruthy(); await user.click(screen.getByText('Confirm action'))
    expect(await screen.findByText('Closed')).toBeTruthy(); expect(screen.getByText('Close early')).toBeDisabled()
  })
  it('shows frozen questions and assigned students and adds only an active unassigned roster member', async () => {
    const user = userEvent.setup(); start('/instances'); await user.click(await screen.findByText('Students and questions'))
    const drawer = await screen.findByRole('dialog', { name: 'Instance students and frozen questions' })
    expect(within(drawer).getByText('Assigned Student')).toBeTruthy(); expect(within(drawer).getByText('Frozen questions')).toBeTruthy()
    expect(within(drawer).queryByRole('option', { name: 'Inactive Student' })).toBeNull()
    expect(within(drawer).queryByRole('option', { name: 'Assigned Student' })).toBeNull()
    await within(drawer).findByRole('option', { name: 'Late Student' })
    await user.selectOptions(within(drawer).getByLabelText('Late joiner'), 's2'); await user.click(within(drawer).getByText('Add student to instance'))
    expect(await within(drawer).findByText('Assigned students (2)')).toBeTruthy(); expect(within(drawer).getByText('Late Student')).toBeTruthy()
    expect(within(drawer).getByText('Add student to instance')).toBeDisabled(); expect(within(drawer).getByText('No active unassigned students on this batch roster.')).toBeTruthy()
    expect(mock.post).toHaveBeenCalledWith('/instances/i1/students', { userId: 's2' })
    await user.click(within(drawer).getByText('Close instance details')); expect(screen.queryByRole('dialog')).toBeNull()
  })
  it('blocks late adds for a closed instance and renders an empty assigned snapshot', async () => {
    instances = [instance({ status: 'CLOSED', students: [] })]; start('/instances/i1')
    const drawer = await screen.findByRole('dialog', { name: 'Instance students and frozen questions' })
    expect(within(drawer).getByText('No students are assigned to this instance.')).toBeTruthy()
    expect(within(drawer).getByText('This instance is closed. Students cannot be added.')).toBeTruthy()
    expect(within(drawer).getByLabelText('Late joiner')).toBeDisabled(); expect(within(drawer).getByText('Add student to instance')).toBeDisabled()
  })
  it('shows an empty instance list', async () => { instances = []; start('/instances'); expect(await screen.findByText('No published instances for these batches.')).toBeTruthy() })
})

describe('publishing failures and in-flight state', () => {
  it('shows list failures safely after a session disappears', async () => {
    mock.user = null; mock.get.mockRejectedValue(new Error('offline')); start()
    expect(await screen.findByText('Could not load test definitions.')).toBeTruthy()
  })
  it('shows failed detail, catalogue and bank queries', async () => {
    const get = mock.get.getMockImplementation()!
    mock.get.mockImplementation((url: string, config: object) => url.startsWith('/tests/') ? get(url, config) : Promise.reject(new Error('offline')))
    start('/tests/t1')
    expect(await screen.findByText('Could not load grades and subjects.')).toBeTruthy(); expect(await screen.findByText('Could not load bank questions.')).toBeTruthy()
  })
  it('handles a missing definition', async () => {
    mock.get.mockRejectedValue(new Error('missing')); start('/tests/t1'); expect(await screen.findByText('Could not load this definition.')).toBeTruthy()
  })
  it('maps server validation reasons without losing unsaved values', async () => {
    mock.put.mockRejectedValueOnce({ isAxiosError: true, response: { data: { message: 'Invalid test definition', fieldErrors: { 'items[0].marks': 'Use up to two decimal places.' } } } })
    const user = userEvent.setup(); start('/tests/t1')
    await user.click(await screen.findByText('Save definition')); expect(await screen.findByText('Use up to two decimal places.')).toBeTruthy()
    expect(screen.getByLabelText('Marks for question 1')).toHaveValue(2.5)
    await user.click(screen.getByText('Save definition')); expect(await screen.findByRole('heading', { name: 'My Tests' })).toBeTruthy()
  })
  it('keeps a failed delete reviewable', async () => {
    mock.delete.mockRejectedValue(new Error('offline')); const user = userEvent.setup(); start('/tests/t1')
    await user.click(await screen.findByText('Delete definition')); await user.click(screen.getByText('Confirm delete'))
    expect(await screen.findByText('Could not delete the definition.')).toBeTruthy()
    await user.click(screen.getByText('Keep definition')); expect(screen.queryByRole('dialog')).toBeNull()
  })
  it('blocks duplicate saves while a request is in flight', async () => {
    let finish!: (result: { data: Definition }) => void
    mock.put.mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
    const user = userEvent.setup(); start('/tests/t1'); await user.click(await screen.findByText('Save definition'))
    expect(screen.getByText('Save definition')).toBeDisabled(); expect(screen.getByText('Delete definition')).toBeDisabled()
    fireEvent.submit(screen.getByText('Save definition').closest('form')!); expect(mock.put).toHaveBeenCalledTimes(1)
    finish({ data: definitions[0] }); expect(await screen.findByRole('heading', { name: 'My Tests' })).toBeTruthy()
  })
  it('closes a failed final-review load without changing a definition', async () => {
    const get = mock.get.getMockImplementation()!
    mock.get.mockImplementation((url: string, config: object) => url.startsWith('/tests/') ? Promise.reject(new Error('missing')) : get(url, config))
    const user = userEvent.setup(); start(); await user.click(await screen.findByText('Publish test'))
    expect(await screen.findByText('Could not load the definition for publishing.')).toBeTruthy()
    await user.click(screen.getByText('Close publish dialog')); expect(screen.queryByRole('dialog')).toBeNull()
  })
  it('reports an empty-roster publish failure and permits a corrected retry', async () => {
    mock.post.mockRejectedValueOnce({ isAxiosError: true, response: { data: { message: 'Invalid publish settings', fieldErrors: { batchId: 'Add an active student before publishing.' } } } })
    const user = userEvent.setup(); start(); await user.click(await screen.findByText('Publish test')); await screen.findByText('Publish Fractions check')
    await user.selectOptions(screen.getByLabelText('Batch'), 'b1')
    fireEvent.change(screen.getByLabelText('Opens at'), { target: { value: '2026-11-10T10:00' } }); fireEvent.change(screen.getByLabelText('Closes at'), { target: { value: '2026-11-10T11:00' } })
    await user.click(screen.getByText('Publish now')); expect(await screen.findByText('Add an active student before publishing.')).toBeTruthy()
    await user.click(screen.getByText('Publish now')); expect(await screen.findByText('Test published')).toBeTruthy()
  })
  it('shows managed-batch failures in the publish dialog', async () => {
    const get = mock.get.getMockImplementation()!
    mock.get.mockImplementation((url: string, config: object) => url === '/batches' ? Promise.reject(new Error('offline')) : get(url, config))
    const user = userEvent.setup(); start(); await user.click(await screen.findByText('Publish test'))
    expect(await screen.findByText('Could not load managed batches.')).toBeTruthy(); await user.click(screen.getByText('Cancel publish'))
  })
  it('blocks empty or invalid publish selections', async () => {
    const user = userEvent.setup(); start(); await user.click(await screen.findByText('Publish test')); await screen.findByText('Publish Fractions check')
    await user.selectOptions(screen.getByLabelText('Batch'), 'b1')
    fireEvent.change(screen.getByLabelText('Opens at'), { target: { value: '2026-11-10T10:00' } }); fireEvent.change(screen.getByLabelText('Closes at'), { target: { value: '2026-11-10T11:00' } })
    await user.clear(screen.getByLabelText('Marks for question 1')); expect(screen.getByText('Publish now')).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Remove question 2' })); await user.click(screen.getByRole('button', { name: 'Remove question 1' }))
    expect(screen.getByText('Publish now')).toBeDisabled()
  })
  it('shows instance and batch failures', async () => {
    mock.get.mockRejectedValue(new Error('offline')); start('/instances')
    expect(await screen.findByText('Could not load instances.')).toBeTruthy(); expect(screen.getByText('Could not load managed batches.')).toBeTruthy()
  })
  it('shows a failed instance detail request', async () => {
    const get = mock.get.getMockImplementation()!
    mock.get.mockImplementation((url: string, config: object) => url.startsWith('/instances/') ? Promise.reject(new Error('not found')) : get(url, config))
    start('/instances/i1'); expect(screen.getByText('Loading instance details…')).toBeTruthy(); expect(await screen.findByText('Could not load this instance.')).toBeTruthy()
  })
  it('shows failed roster and instance-action requests', async () => {
    const get = mock.get.getMockImplementation()!
    mock.get.mockImplementation((url: string, config: object) => url.includes('/students') ? Promise.reject(new Error('offline')) : get(url, config))
    start('/instances/i1'); expect(await screen.findByText('Could not load the batch roster.')).toBeTruthy()
  })
  it('keeps a failed code rotation confirmable', async () => {
    mock.post.mockRejectedValue(new Error('offline')); const user = userEvent.setup(); start('/instances'); await user.click(await screen.findByText('Regenerate code')); await user.click(screen.getByText('Confirm action'))
    expect(await screen.findByText('Could not update this instance.')).toBeTruthy(); await user.click(screen.getByText('Cancel action'))
  })
  it('shows a failed late add without altering the snapshot', async () => {
    mock.post.mockRejectedValue(new Error('offline')); const user = userEvent.setup(); start('/instances/i1')
    const drawer = await screen.findByRole('dialog', { name: 'Instance students and frozen questions' })
    await within(drawer).findByRole('option', { name: 'Late Student' })
    await user.selectOptions(within(drawer).getByLabelText('Late joiner'), 's2'); await user.click(within(drawer).getByText('Add student to instance'))
    expect(await within(drawer).findByText('Could not add this student.')).toBeTruthy(); expect(within(drawer).getByText('Assigned students (1)')).toBeTruthy()
  })
  it('makes clipboard failure recoverable and handles envelopes without response data', async () => {
    const user = userEvent.setup(); vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(new Error('blocked'))
    render(<><CopyCode code="ABCDEFGH" /><ApiFailure error={{ isAxiosError: true }} fallback="Network unavailable" /><ApiFailure error={{ isAxiosError: true, response: {} }} fallback="No response body" /></>)
    await user.click(screen.getByText('Copy join code')); expect(await screen.findByText('Could not copy. Select and copy the join code above.')).toBeTruthy()
    expect(screen.getByText('Network unavailable')).toBeTruthy(); expect(screen.getByText('No response body')).toBeTruthy()
  })
})


describe('publishing boundaries', () => {
  it('does not request an empty batch roster before an instance is ready', () => {
    const cache = createTestQueryClient()
    renderHook(() => useInstanceRoster(''), { wrapper: ({ children }) => <QueryClientProvider client={cache}>{children}</QueryClientProvider> })
    expect(mock.get).not.toHaveBeenCalled()
  })
  it('prevents adding more than 200 selected questions', async () => {
    definitions = [definition('SCORED_TEST', { items: Array.from({ length: 200 }, (_, i) => ({ ...allItems[0], questionId: `limit-${i}`, payload: { stem: `Selected ${i + 1}` } })) })]
    start('/tests/t1')
    expect(await screen.findByText('Selected questions (200)')).toBeTruthy()
    expect(await screen.findByRole('button', { name: 'Add question: Which fraction?' })).toBeDisabled()
  })
})


describe('implicit form submission guards', () => {
  it('does not send an invalid definition through an implicit submit', () => {
    start('/tests/new'); fireEvent.submit(screen.getByText('Save definition').closest('form')!)
    expect(mock.post).not.toHaveBeenCalled()
  })
  it('does not convert or send an invalid publish window through an implicit submit', async () => {
    const user = userEvent.setup(); start(); await user.click(await screen.findByText('Publish test')); await screen.findByText('Publish Fractions check')
    fireEvent.submit(screen.getByText('Publish now').closest('form')!); expect(mock.post).not.toHaveBeenCalled()
  })
  it('does not send a second publish while a valid request is pending', async () => {
    let finish!: (result: { data: Instance }) => void
    mock.post.mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
    const user = userEvent.setup(); start(); await user.click(await screen.findByText('Publish test')); await screen.findByText('Publish Fractions check')
    await user.selectOptions(screen.getByLabelText('Batch'), 'b1')
    fireEvent.change(screen.getByLabelText('Opens at'), { target: { value: '2026-11-10T10:00' } }); fireEvent.change(screen.getByLabelText('Closes at'), { target: { value: '2026-11-10T11:00' } })
    await user.click(screen.getByText('Publish now')); expect(screen.getByText('Publish now')).toBeDisabled()
    fireEvent.submit(screen.getByText('Publish now').closest('form')!); expect(mock.post).toHaveBeenCalledTimes(1)
    finish({ data: instance({ id: 'published' }) }); expect(await screen.findByText('Test published')).toBeTruthy()
  })
})
