import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthUser, BatchDto } from '../lib/api'
import {
  adminUser,
  batchOne,
  batchTwo,
  gradeSubjects,
  rosterStudentActive,
  teacherOne,
  teacherTwo,
  teacherUser,
} from '../test/fixtures'
import { renderWithProviders } from '../test/renderWithProviders'
import BatchesPage from './BatchesPage'

const mock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  refreshAccessToken: vi.fn(),
  sessionExpired: { handler: null as (() => void) | null },
}))

vi.mock('../lib/api', async () => {
  const helper = await import('../test/mockApi')
  return helper.createMockApiModule(mock)
})

let batchesState: BatchDto[]

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  mock.get.mockReset()
  mock.post.mockReset()
  mock.put.mockReset()
  mock.delete.mockReset()
  mock.refreshAccessToken.mockReset()
  batchesState = [batchOne, batchTwo]
})

function seedSession(user: AuthUser) {
  localStorage.setItem('learnium.refreshToken', 'stored-refresh')
  mock.refreshAccessToken.mockResolvedValue('fresh-access')
  mock.get.mockImplementation((url: string) => {
    if (url === '/me') {
      return Promise.resolve({ data: user })
    }
    if (url === '/batches') {
      return Promise.resolve({ data: batchesState })
    }
    if (url === '/master/grade-subjects') {
      return Promise.resolve({ data: gradeSubjects })
    }
    if (url === '/admin/teachers') {
      return Promise.resolve({
        data: {
          content: [teacherOne, teacherTwo],
          page: 0,
          size: 100,
          totalElements: 2,
          totalPages: 1,
        },
      })
    }
    if (url === '/batches/batch-1/students') {
      return Promise.resolve({ data: [rosterStudentActive] })
    }
    return Promise.reject(new Error(`Unexpected GET ${url}`))
  })
}

function cardFor(name: string): HTMLElement {
  const card = screen.getByText(name).closest('li')
  if (card === null) {
    throw new Error(`No card for ${name}`)
  }
  return card
}

describe('BatchesPage as admin', () => {
  it('lists batches with teacher info and admin controls', async () => {
    seedSession(adminUser)
    renderWithProviders(<BatchesPage />, ['/batches'])
    expect(await screen.findByText('Grade 8 Math — Batch B')).toBeInTheDocument()
    expect(
      within(cardFor('Grade 8 Math — Batch B')).getByText(
        'Grade 8 · Mathematics',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText(/5 students/)).toBeInTheDocument()
    expect(screen.getByText(/Teacher: Mrs\. Patel/)).toBeInTheDocument()
    expect(screen.getByText('Grade 7 Science — Batch A')).toBeInTheDocument()
    expect(screen.getByText(/No teacher assigned/)).toBeInTheDocument()
    expect(screen.getByLabelText('Batch name')).toBeInTheDocument()
    expect(screen.getByLabelText('Grade and subject')).toBeInTheDocument()
    expect(screen.getAllByLabelText('Assign teacher')).toHaveLength(2)
    expect(
      screen.getByRole('button', { name: 'Remove teacher' }),
    ).toBeInTheDocument()
  })

  it('creates a batch and refreshes the list', async () => {
    seedSession(adminUser)
    mock.post.mockImplementation(() => {
      const created: BatchDto = {
        batchId: 'batch-3',
        name: 'Grade 9 Math — Batch C',
        gradeSubjectId: 'gs-1',
        gradeLabel: 'Grade 8 · Mathematics',
        teacherUserId: null,
        teacherName: null,
        studentCount: 0,
      }
      batchesState = [...batchesState, created]
      return Promise.resolve({ data: created })
    })
    const user = userEvent.setup()
    renderWithProviders(<BatchesPage />, ['/batches'])
    await screen.findByText('Grade 8 Math — Batch B')
    await user.type(screen.getByLabelText('Batch name'), 'Grade 9 Math — Batch C')
    await user.selectOptions(
      screen.getByLabelText('Grade and subject'),
      'gs-1',
    )
    await user.click(screen.getByRole('button', { name: 'Create batch' }))
    expect(
      await screen.findByText('Grade 9 Math — Batch C'),
    ).toBeInTheDocument()
    expect(mock.post).toHaveBeenCalledWith('/admin/batches', {
      name: 'Grade 9 Math — Batch C',
      gradeSubjectId: 'gs-1',
    })
    expect(screen.getByLabelText('Batch name')).toHaveValue('')
  })

  it('validates the create form', async () => {
    seedSession(adminUser)
    const user = userEvent.setup()
    renderWithProviders(<BatchesPage />, ['/batches'])
    await screen.findByText('Grade 8 Math — Batch B')
    await user.click(screen.getByRole('button', { name: 'Create batch' }))
    expect(
      await screen.findByText('Batch name is required'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Choose a grade and subject'),
    ).toBeInTheDocument()
    expect(mock.post).not.toHaveBeenCalled()
  })

  it('shows the envelope message when creation fails', async () => {
    seedSession(adminUser)
    mock.post.mockRejectedValue({
      response: { data: { message: 'Batch name already exists' } },
    })
    const user = userEvent.setup()
    renderWithProviders(<BatchesPage />, ['/batches'])
    await screen.findByText('Grade 8 Math — Batch B')
    await user.type(screen.getByLabelText('Batch name'), 'Batch B')
    await user.selectOptions(
      screen.getByLabelText('Grade and subject'),
      'gs-1',
    )
    await user.click(screen.getByRole('button', { name: 'Create batch' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Batch name already exists',
    )
  })

  it('assigns a teacher and ignores the placeholder option', async () => {
    seedSession(adminUser)
    mock.put.mockResolvedValue({ data: batchTwo })
    const user = userEvent.setup()
    renderWithProviders(<BatchesPage />, ['/batches'])
    await screen.findByText('Grade 8 Math — Batch B')

    const firstSelect = within(
      cardFor('Grade 8 Math — Batch B'),
    ).getByLabelText('Assign teacher')
    await user.selectOptions(firstSelect, '')
    expect(mock.put).not.toHaveBeenCalled()

    const secondCard = cardFor('Grade 7 Science — Batch A')
    await within(secondCard).findByRole('option', { name: 'Mrs. Patel' })
    const secondSelect = within(secondCard).getByLabelText('Assign teacher')
    await user.selectOptions(secondSelect, 'user-teacher')
    await waitFor(() =>
      expect(mock.put).toHaveBeenCalledWith(
        '/admin/batches/batch-2/teacher',
        { userId: 'user-teacher' },
      ),
    )
  })

  it('shows the envelope message when assignment fails', async () => {
    seedSession(adminUser)
    mock.put.mockRejectedValue({
      response: { data: { message: 'Teacher is not active' } },
    })
    const user = userEvent.setup()
    renderWithProviders(<BatchesPage />, ['/batches'])
    await screen.findByText('Grade 7 Science — Batch A')
    const card = cardFor('Grade 7 Science — Batch A')
    await within(card).findByRole('option', { name: 'Mrs. Patel' })
    await user.selectOptions(
      within(card).getByLabelText('Assign teacher'),
      'user-teacher',
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Teacher is not active',
    )
  })

  it('removes the assigned teacher', async () => {
    seedSession(adminUser)
    mock.delete.mockImplementation(() => {
      batchesState = batchesState.map((batch) =>
        batch.batchId === 'batch-1'
          ? { ...batch, teacherUserId: null, teacherName: null }
          : batch,
      )
      return Promise.resolve({ data: undefined })
    })
    const user = userEvent.setup()
    renderWithProviders(<BatchesPage />, ['/batches'])
    await screen.findByText('Grade 8 Math — Batch B')
    await user.click(screen.getByRole('button', { name: 'Remove teacher' }))
    await waitFor(() =>
      expect(
        within(cardFor('Grade 8 Math — Batch B')).getByText(
          /No teacher assigned/,
        ),
      ).toBeInTheDocument(),
    )
    expect(mock.delete).toHaveBeenCalledWith(
      '/admin/batches/batch-1/teacher/user-teacher',
    )
  })

  it('shows the envelope message when removing a teacher fails', async () => {
    seedSession(adminUser)
    mock.delete.mockRejectedValue({
      response: { data: { message: 'Remove failed' } },
    })
    const user = userEvent.setup()
    renderWithProviders(<BatchesPage />, ['/batches'])
    await screen.findByText('Grade 8 Math — Batch B')
    await user.click(screen.getByRole('button', { name: 'Remove teacher' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Remove failed',
    )
  })
})

describe('BatchesPage as teacher', () => {
  it('shows batches and roster without admin controls', async () => {
    seedSession(teacherUser)
    const user = userEvent.setup()
    renderWithProviders(<BatchesPage />, ['/batches'])
    expect(await screen.findByText('Grade 8 Math — Batch B')).toBeInTheDocument()
    expect(screen.queryByLabelText('Batch name')).toBeNull()
    expect(screen.queryByLabelText('Assign teacher')).toBeNull()
    expect(
      screen.queryByRole('button', { name: 'Remove teacher' }),
    ).toBeNull()

    await user.click(
      within(cardFor('Grade 8 Math — Batch B')).getByRole('button', {
        name: 'View roster',
      }),
    )
    expect(await screen.findByText('Simran')).toBeInTheDocument()
    await user.click(
      within(cardFor('Grade 8 Math — Batch B')).getByRole('button', {
        name: 'Hide roster',
      }),
    )
    await waitFor(() => expect(screen.queryByText('Simran')).toBeNull())
  })

  it('shows the list without admin controls when signed out', async () => {
    mock.get.mockImplementation((url: string) => {
      if (url === '/batches') {
        return Promise.resolve({ data: batchesState })
      }
      return Promise.reject(new Error(`Unexpected GET ${url}`))
    })
    renderWithProviders(<BatchesPage />, ['/batches'])
    expect(await screen.findByText('Grade 8 Math — Batch B')).toBeInTheDocument()
    expect(screen.queryByLabelText('Batch name')).toBeNull()
  })
})

describe('BatchesPage list states', () => {
  it('shows a loading state', () => {
    mock.get.mockImplementation(() => new Promise(() => undefined))
    renderWithProviders(<BatchesPage />, ['/batches'])
    expect(screen.getByText('Loading batches…')).toBeInTheDocument()
  })

  it('shows the envelope message when loading fails', async () => {
    mock.get.mockRejectedValue({
      response: { data: { message: 'Batches unavailable' } },
    })
    renderWithProviders(<BatchesPage />, ['/batches'])
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Batches unavailable',
    )
  })

  it('shows the empty state', async () => {
    mock.get.mockImplementation((url: string) => {
      if (url === '/batches') {
        return Promise.resolve({ data: [] })
      }
      return Promise.reject(new Error(`Unexpected GET ${url}`))
    })
    renderWithProviders(<BatchesPage />, ['/batches'])
    expect(await screen.findByText('No batches yet.')).toBeInTheDocument()
  })
})
