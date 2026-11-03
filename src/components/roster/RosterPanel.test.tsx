import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { teacherUser, rosterStudentActive, rosterStudentInactive, rosterStudentLocked } from '../../test/fixtures'
import RosterPanel from './RosterPanel'

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }))
vi.mock('../../lib/api', () => ({
  apiClient: { get: mocks.get, post: mocks.post, put: mocks.put, delete: mocks.delete },
  getApiErrorMessage: (error: { response?: { data?: { message?: string } } }, fallback: string) => error.response?.data?.message ?? fallback,
}))
vi.mock('../../lib/auth', () => ({ useAuth: () => ({ user: teacherUser }) }))

function renderPanel() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(<QueryClientProvider client={client}><RosterPanel batchId="batch-1" /></QueryClientProvider>)
}

function getDefaults(roster: unknown[] = []) {
  mocks.get.mockImplementation((url: string) => {
    if (url === '/batches/batch-1/students') return Promise.resolve({ data: roster })
    if (url === '/centre/students?size=100') return Promise.resolve({ data: { content: [{ id: 'existing-1', displayName: 'Priya Shah', username: 'priya.s' }] } })
    if (url.startsWith('/centre/username-check')) return Promise.resolve({ data: { available: true } })
    return Promise.reject(new Error(`Unexpected GET ${url}`))
  })
}

beforeEach(() => { mocks.get.mockReset(); mocks.post.mockReset(); mocks.put.mockReset(); mocks.delete.mockReset() })

describe('RosterPanel', () => {
  it('shows roster loading and failure states', async () => {
    mocks.get.mockImplementation((url: string) => {
      if (url === '/centre/students?size=100') return Promise.resolve({ data: { content: [] } })
      return new Promise(() => undefined)
    })
    const first = renderPanel()
    expect(screen.getByText('Loading roster…')).toBeInTheDocument()
    first.unmount()

    mocks.get.mockImplementation((url: string) => url === '/centre/students?size=100' ? Promise.resolve({ data: { content: [] } }) : Promise.reject({ response: { data: { message: 'Roster unavailable' } } }))
    renderPanel()
    expect(await screen.findByRole('alert')).toHaveTextContent('Roster unavailable')
  })

  it('renders usernames and invite status without any PIN controls', async () => {
    getDefaults([rosterStudentActive, rosterStudentLocked, rosterStudentInactive])
    renderPanel()
    expect(await screen.findByText('simran@dtc')).toBeInTheDocument()
    expect(screen.getByText('NOT SENT')).toBeInTheDocument()
    expect(screen.getByText('PENDING')).toBeInTheDocument()
    expect(screen.queryByText(/PIN/i)).toBeNull()
    expect(screen.getByRole('button', { name: 'Resend invite' })).toBeInTheDocument()
  })

  it('suggests, checks and submits a new student username with contact email', async () => {
    getDefaults([])
    mocks.post.mockResolvedValue({ data: { userId: 'new-1', displayName: 'Simran Kaur', username: 'simran.k', inviteStatus: 'SENT' } })
    const user = userEvent.setup(); renderPanel()
    await screen.findByText('No students on the roster yet.')
    await user.type(screen.getByLabelText('Student name'), 'Simran Kaur')
    expect(await screen.findByText('Username is available')).toBeInTheDocument()
    expect(screen.getByLabelText('Username')).toHaveValue('simran.k')
    await user.type(screen.getByLabelText('Contact email (optional)'), 'parent@example.test')
    await user.click(screen.getByRole('button', { name: 'Add student' }))
    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith('/batches/batch-1/students', { displayName: 'Simran Kaur', contactEmail: 'parent@example.test', username: 'simran.k' }))
    expect(await screen.findByRole('status')).toHaveTextContent('simran.k@dtc')
  })

  it('supports selecting an existing centre student', async () => {
    getDefaults([]); mocks.post.mockResolvedValue({ data: { displayName: 'Priya Shah', username: 'priya.s', inviteStatus: 'ACCEPTED' } })
    const user = userEvent.setup(); renderPanel()
    await screen.findByRole('option', { name: 'Priya Shah (priya.s)' })
    fireEvent.change(screen.getByLabelText('Use an existing student'), { target: { value: 'missing' } })
    await user.selectOptions(screen.getByLabelText('Use an existing student'), 'existing-1')
    await user.click(screen.getByRole('button', { name: 'Add student' }))
    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith('/batches/batch-1/students', { displayName: 'Priya Shah', userId: 'existing-1' }))
  })

  it('renames a username and resends a pending invite', async () => {
    getDefaults([rosterStudentInactive]); mocks.put.mockResolvedValue({ data: {} }); mocks.post.mockResolvedValue({ data: {} })
    const user = userEvent.setup(); renderPanel()
    const row = (await screen.findByText('Meera')).closest('li') as HTMLElement
    await user.click(within(row).getByRole('button', { name: 'Edit username' }))
    const field = within(row).getByLabelText('Username for Meera')
    await user.clear(field); await user.type(field, 'meera.k')
    await user.click(within(row).getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(mocks.put).toHaveBeenCalledWith('/batches/batch-1/students/user-student-3/username', { username: 'meera.k' }))
    await user.click(within(row).getByRole('button', { name: 'Resend invite' }))
    expect(mocks.post).toHaveBeenCalledWith('/batches/batch-1/students/user-student-3/resend-invite')
  })

  it('bulk adds names and reports API errors', async () => {
    getDefaults([]); mocks.post.mockRejectedValue({ response: { data: { message: 'Bulk unavailable' } } })
    const user = userEvent.setup(); renderPanel()
    await user.type(screen.getByLabelText('Student names (one per line)'), 'Asha\nBala')
    await user.click(screen.getByRole('button', { name: 'Add students' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Bulk unavailable')
    expect(mocks.post).toHaveBeenCalledWith('/batches/batch-1/students/bulk', { fullNames: ['Asha', 'Bala'] })
  })

  it('reports add, rename, resend and deactivate failures', async () => {
    getDefaults([rosterStudentInactive])
    mocks.post.mockRejectedValue({ response: { data: { message: 'Action failed' } } })
    mocks.put.mockRejectedValue({ response: { data: { message: 'Rename failed' } } })
    mocks.delete.mockRejectedValue({ response: { data: { message: 'Deactivate failed' } } })
    const user = userEvent.setup(); renderPanel()
    await user.type(screen.getByLabelText('Student name'), 'New Student')
    await screen.findByText('Username is available')
    await user.click(screen.getByRole('button', { name: 'Add student' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Action failed')

    const row = (await screen.findByText('Meera')).closest('li') as HTMLElement
    await user.click(within(row).getByRole('button', { name: 'Edit username' }))
    await user.click(within(row).getByRole('button', { name: 'Save' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Rename failed')
    await user.click(within(row).getByRole('button', { name: 'Resend invite' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Action failed')
    await user.click(within(row).getByRole('button', { name: 'Deactivate' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Deactivate failed')
  })

  it('shows unavailable and validation states and completes bulk/deactivate success paths', async () => {
    mocks.get.mockImplementation((url: string) => {
      if (url === '/batches/batch-1/students') return Promise.resolve({ data: [rosterStudentActive] })
      if (url === '/centre/students?size=100') return Promise.resolve({ data: { content: [] } })
      if (url.startsWith('/centre/username-check')) return Promise.resolve({ data: { available: false } })
      return Promise.reject(new Error(url))
    })
    mocks.post.mockResolvedValue({ data: [{ displayName: 'Asha', username: 'asha', inviteStatus: 'NOT_SENT' }] })
    mocks.delete.mockResolvedValue({ data: undefined })
    const user = userEvent.setup(); renderPanel()
    await user.type(screen.getByLabelText('Student name'), 'Li')
    expect(await screen.findByText('Username is unavailable')).toBeInTheDocument()
    await user.clear(screen.getByLabelText('Username'))
    await user.type(screen.getByLabelText('Username'), 'custom.li')
    expect(screen.getByRole('button', { name: 'Add student' })).toBeDisabled()
    fireEvent.submit(screen.getByRole('button', { name: 'Add student' }).closest('form') as HTMLFormElement)
    await user.clear(screen.getByLabelText('Student name'))
    fireEvent.submit(screen.getByRole('button', { name: 'Add student' }).closest('form') as HTMLFormElement)
    expect(await screen.findByText('Student name is required')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Add students' }))
    expect(await screen.findByText('Enter at least one student name')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Student names (one per line)'), ' Asha ')
    await user.click(screen.getByRole('button', { name: 'Add students' }))
    expect(await screen.findByRole('status')).toHaveTextContent('1 students added')
    await user.click(screen.getByRole('button', { name: 'Deactivate' }))
    await waitFor(() => expect(mocks.delete).toHaveBeenCalledWith('/batches/batch-1/students/membership-1'))
  })
})
