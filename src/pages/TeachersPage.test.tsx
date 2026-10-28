import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PageResponse, TeacherDto } from '../lib/api'
import { teacherInvited, teacherOne, teacherTwo } from '../test/fixtures'
import { renderWithProviders } from '../test/renderWithProviders'
import TeachersPage from './TeachersPage'

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

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  mock.get.mockReset()
  mock.post.mockReset()
  mock.delete.mockReset()
  mock.refreshAccessToken.mockReset()
})

function pageOf(
  content: TeacherDto[],
  page: number,
  totalPages: number,
): PageResponse<TeacherDto> {
  return { content, page, size: 10, totalElements: content.length, totalPages }
}

function mockTeachers(handler: (page: number) => PageResponse<TeacherDto>) {
  mock.get.mockImplementation(
    (url: string, config?: { params?: { page?: number } }) => {
      if (url === '/admin/teachers') {
        return Promise.resolve({ data: handler(config?.params?.page ?? 0) })
      }
      return Promise.reject(new Error(`Unexpected GET ${url}`))
    },
  )
}

function rowFor(name: string): HTMLElement {
  const row = screen.getByText(name).closest('tr')
  if (row === null) {
    throw new Error(`No row for ${name}`)
  }
  return row
}

describe('TeachersPage resend invite', () => {
  it('offers resend only to invited teachers, with an Invited badge', async () => {
    mockTeachers(() =>
      pageOf([teacherOne, teacherTwo, teacherInvited], 0, 1),
    )
    renderWithProviders(<TeachersPage />, ['/admin/teachers'])
    expect(await screen.findByText('New Teacher')).toBeInTheDocument()
    expect(screen.getByText('Invited')).toBeInTheDocument()
    expect(
      screen.getAllByRole('button', { name: 'Resend invite' }),
    ).toHaveLength(1)
    expect(
      within(rowFor('Mrs. Patel')).queryByRole('button', {
        name: 'Resend invite',
      }),
    ).toBeNull()
    expect(
      within(rowFor('Mr. Lee')).queryByRole('button', {
        name: 'Resend invite',
      }),
    ).toBeNull()
    expect(
      within(rowFor('New Teacher')).getByRole('button', {
        name: 'Resend invite',
      }),
    ).toBeInTheDocument()
  })

  it('resends the invite and confirms with a notice', async () => {
    mockTeachers(() => pageOf([teacherInvited], 0, 1))
    mock.post.mockResolvedValue({ data: undefined })
    const user = userEvent.setup()
    renderWithProviders(<TeachersPage />, ['/admin/teachers'])
    expect(await screen.findByText('New Teacher')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Resend invite' }))
    expect(
      await screen.findByText('Invitation re-sent to new@learnium.test'),
    ).toBeInTheDocument()
    expect(mock.post).toHaveBeenCalledWith(
      '/admin/teachers/user-teacher-3/resend-invite',
    )
  })

  it('surfaces the envelope message when resending fails', async () => {
    mockTeachers(() => pageOf([teacherInvited], 0, 1))
    mock.post.mockRejectedValue({
      response: {
        data: { message: 'This teacher has already set a password.' },
      },
    })
    const user = userEvent.setup()
    renderWithProviders(<TeachersPage />, ['/admin/teachers'])
    expect(await screen.findByText('New Teacher')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Resend invite' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This teacher has already set a password.',
    )
  })
})

describe('TeachersPage list', () => {
  it('renders teachers with status badges and join dates', async () => {
    mockTeachers(() => pageOf([teacherOne, teacherTwo], 0, 1))
    renderWithProviders(<TeachersPage />, ['/admin/teachers'])
    expect(await screen.findByText('Mrs. Patel')).toBeInTheDocument()
    expect(screen.getByText('patel@learnium.test')).toBeInTheDocument()
    expect(screen.getByText('Mr. Lee')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Inactive')).toBeInTheDocument()
    expect(screen.getByText('2026-10-01')).toBeInTheDocument()
    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
    expect(
      screen.getAllByRole('button', { name: 'Deactivate' }),
    ).toHaveLength(1)
    expect(mock.get).toHaveBeenCalledWith('/admin/teachers', {
      params: { page: 0, size: 10 },
    })
  })

  it('paginates through the teacher list', async () => {
    mockTeachers((page) =>
      page === 0 ? pageOf([teacherOne], 0, 2) : pageOf([teacherTwo], 1, 2),
    )
    const user = userEvent.setup()
    renderWithProviders(<TeachersPage />, ['/admin/teachers'])
    expect(await screen.findByText('Mrs. Patel')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(await screen.findByText('Mr. Lee')).toBeInTheDocument()
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument()
    expect(mock.get).toHaveBeenCalledWith('/admin/teachers', {
      params: { page: 1, size: 10 },
    })
    await user.click(screen.getByRole('button', { name: 'Previous' }))
    expect(await screen.findByText('Mrs. Patel')).toBeInTheDocument()
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument()
  })

  it('shows a loading state', () => {
    mock.get.mockImplementation(() => new Promise(() => undefined))
    renderWithProviders(<TeachersPage />, ['/admin/teachers'])
    expect(screen.getByText('Loading teachers…')).toBeInTheDocument()
  })

  it('shows the envelope message when loading fails', async () => {
    mock.get.mockRejectedValue({
      response: { data: { message: 'Teachers unavailable' } },
    })
    renderWithProviders(<TeachersPage />, ['/admin/teachers'])
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Teachers unavailable',
    )
  })

  it('shows the empty state and no pagination', async () => {
    mockTeachers(() => pageOf([], 0, 0))
    renderWithProviders(<TeachersPage />, ['/admin/teachers'])
    expect(await screen.findByText('No teachers yet.')).toBeInTheDocument()
    expect(screen.queryByText(/Page \d+ of/)).toBeNull()
  })
})

describe('TeachersPage invite', () => {
  it('invites a teacher, shows a notice and clears the form', async () => {
    mockTeachers(() => pageOf([teacherOne], 0, 1))
    mock.post.mockResolvedValue({ data: teacherTwo })
    const user = userEvent.setup()
    renderWithProviders(<TeachersPage />, ['/admin/teachers'])
    await screen.findByText('Mrs. Patel')
    await user.type(screen.getByLabelText('Display name'), 'New Teacher')
    await user.type(screen.getByLabelText('Email'), 'new@learnium.test')
    await user.click(screen.getByRole('button', { name: 'Send invite' }))
    expect(
      await screen.findByText('Invitation sent to new@learnium.test'),
    ).toBeInTheDocument()
    expect(mock.post).toHaveBeenCalledWith('/admin/teachers', {
      displayName: 'New Teacher',
      email: 'new@learnium.test',
    })
    expect(screen.getByLabelText('Display name')).toHaveValue('')
    expect(screen.getByLabelText('Email')).toHaveValue('')
  })

  it('validates the invite form', async () => {
    mockTeachers(() => pageOf([], 0, 0))
    const user = userEvent.setup()
    renderWithProviders(<TeachersPage />, ['/admin/teachers'])
    await screen.findByText('No teachers yet.')
    await user.type(screen.getByLabelText('Email'), 'not-an-email')
    await user.click(screen.getByRole('button', { name: 'Send invite' }))
    expect(
      await screen.findByText('Display name is required'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Enter a valid email address'),
    ).toBeInTheDocument()
    expect(mock.post).not.toHaveBeenCalled()
  })

  it('shows the envelope message when the invite fails', async () => {
    mockTeachers(() => pageOf([], 0, 0))
    mock.post.mockRejectedValue({
      response: { data: { message: 'Email already registered' } },
    })
    const user = userEvent.setup()
    renderWithProviders(<TeachersPage />, ['/admin/teachers'])
    await screen.findByText('No teachers yet.')
    await user.type(screen.getByLabelText('Display name'), 'New Teacher')
    await user.type(screen.getByLabelText('Email'), 'new@learnium.test')
    await user.click(screen.getByRole('button', { name: 'Send invite' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Email already registered',
    )
  })
})

describe('TeachersPage deactivate', () => {
  it('deactivates after inline confirmation and refreshes the row', async () => {
    let teachers = [teacherOne]
    mockTeachers(() => pageOf(teachers, 0, 1))
    mock.delete.mockImplementation(() => {
      teachers = [{ ...teacherOne, active: false }]
      return Promise.resolve({ data: undefined })
    })
    const user = userEvent.setup()
    renderWithProviders(<TeachersPage />, ['/admin/teachers'])
    await screen.findByText('Mrs. Patel')

    await user.click(
      within(rowFor('Mrs. Patel')).getByRole('button', {
        name: 'Deactivate',
      }),
    )
    expect(
      within(rowFor('Mrs. Patel')).getByRole('button', {
        name: 'Confirm deactivate',
      }),
    ).toBeInTheDocument()
    await user.click(
      within(rowFor('Mrs. Patel')).getByRole('button', { name: 'Cancel' }),
    )
    expect(mock.delete).not.toHaveBeenCalled()
    expect(
      within(rowFor('Mrs. Patel')).getByRole('button', {
        name: 'Deactivate',
      }),
    ).toBeInTheDocument()

    await user.click(
      within(rowFor('Mrs. Patel')).getByRole('button', {
        name: 'Deactivate',
      }),
    )
    await user.click(
      within(rowFor('Mrs. Patel')).getByRole('button', {
        name: 'Confirm deactivate',
      }),
    )
    await waitFor(() =>
      expect(
        within(rowFor('Mrs. Patel')).getByText('Inactive'),
      ).toBeInTheDocument(),
    )
    expect(mock.delete).toHaveBeenCalledWith('/admin/teachers/user-teacher')
    expect(
      within(rowFor('Mrs. Patel')).queryByRole('button', {
        name: 'Deactivate',
      }),
    ).toBeNull()
  })

  it('shows the envelope message when deactivation fails', async () => {
    mockTeachers(() => pageOf([teacherOne], 0, 1))
    mock.delete.mockRejectedValue({
      response: { data: { message: 'Deactivation failed' } },
    })
    const user = userEvent.setup()
    renderWithProviders(<TeachersPage />, ['/admin/teachers'])
    await screen.findByText('Mrs. Patel')
    await user.click(
      within(rowFor('Mrs. Patel')).getByRole('button', {
        name: 'Deactivate',
      }),
    )
    await user.click(
      within(rowFor('Mrs. Patel')).getByRole('button', {
        name: 'Confirm deactivate',
      }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Deactivation failed',
    )
  })
})
