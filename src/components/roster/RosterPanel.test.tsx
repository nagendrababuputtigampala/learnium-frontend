import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { RosterStudent } from '../../lib/api'
import {
  rosterStudentActive,
  rosterStudentInactive,
  rosterStudentLocked,
} from '../../test/fixtures'
import { renderWithProviders } from '../../test/renderWithProviders'
import RosterPanel from './RosterPanel'

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

const ROSTER_URL = '/batches/batch-1/students'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  mock.get.mockReset()
  mock.post.mockReset()
  mock.delete.mockReset()
  mock.refreshAccessToken.mockReset()
})

function rowFor(name: string): HTMLElement {
  const row = screen.getByText(name).closest('li')
  if (row === null) {
    throw new Error(`No row for ${name}`)
  }
  return row
}

describe('RosterPanel list states', () => {
  it('shows a loading state', () => {
    mock.get.mockImplementation(() => new Promise(() => undefined))
    renderWithProviders(<RosterPanel batchId="batch-1" />)
    expect(screen.getByText('Loading roster…')).toBeInTheDocument()
  })

  it('shows the envelope message when the roster fails to load', async () => {
    mock.get.mockRejectedValue({
      response: { data: { message: 'Roster unavailable' } },
    })
    renderWithProviders(<RosterPanel batchId="batch-1" />)
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Roster unavailable',
    )
  })

  it('shows the empty state', async () => {
    mock.get.mockResolvedValue({ data: [] })
    renderWithProviders(<RosterPanel batchId="batch-1" />)
    expect(
      await screen.findByText('No students on the roster yet.'),
    ).toBeInTheDocument()
  })

  it('renders students with status and PIN-lock badges and actions', async () => {
    mock.get.mockResolvedValue({
      data: [rosterStudentActive, rosterStudentLocked, rosterStudentInactive],
    })
    renderWithProviders(<RosterPanel batchId="batch-1" />)
    expect(await screen.findByText('Simran')).toBeInTheDocument()
    expect(screen.getByText('Arjun')).toBeInTheDocument()
    expect(screen.getByText('Meera')).toBeInTheDocument()
    expect(screen.getAllByText('Active')).toHaveLength(2)
    expect(screen.getByText('Inactive')).toBeInTheDocument()
    expect(screen.getByText('PIN locked')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Reset PIN' })).toHaveLength(
      2,
    )
    expect(screen.getAllByRole('button', { name: 'Deactivate' })).toHaveLength(
      2,
    )
    expect(
      within(rowFor('Meera')).queryByRole('button', { name: 'Reset PIN' }),
    ).toBeNull()
  })
})

describe('RosterPanel PIN cache hygiene', () => {
  it('drops the PIN from the mutation cache when the notice is dismissed', async () => {
    mock.get.mockResolvedValue({ data: [] })
    mock.post.mockResolvedValue({
      data: {
        membershipId: 'membership-9',
        userId: 'user-student-9',
        fullName: 'New Kid',
        pin: '4821',
      },
    })
    const user = userEvent.setup()
    const { queryClient } = renderWithProviders(
      <RosterPanel batchId="batch-1" />,
    )
    const cachedMutationData = () =>
      JSON.stringify(
        queryClient
          .getMutationCache()
          .getAll()
          .map((entry) => entry.state.data ?? null),
      )
    expect(
      await screen.findByText('No students on the roster yet.'),
    ).toBeInTheDocument()
    await user.type(screen.getByLabelText('Student name'), 'New Kid')
    await user.click(screen.getByRole('button', { name: 'Add student' }))
    expect(await screen.findByText('4821')).toBeInTheDocument()
    expect(cachedMutationData()).toContain('4821')
    await user.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(screen.queryByText('4821')).toBeNull()
    expect(cachedMutationData()).not.toContain('4821')
  })
})

describe('RosterPanel add student', () => {
  it('adds a student and shows the one-time PIN with copy support', async () => {
    mock.get.mockResolvedValue({ data: [rosterStudentActive] })
    mock.post.mockResolvedValue({
      data: {
        membershipId: 'membership-9',
        userId: 'user-student-9',
        fullName: 'New Kid',
        pin: '4821',
      },
    })
    const user = userEvent.setup()
    // Stub the clipboard after userEvent.setup(): setup installs its own
    // clipboard stub on navigator, which would shadow ours.
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(window.navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })
    renderWithProviders(<RosterPanel batchId="batch-1" />)
    await screen.findByText('Simran')
    await user.type(screen.getByLabelText('Student name'), 'New Kid')
    await user.click(screen.getByRole('button', { name: 'Add student' }))
    expect(
      await screen.findByText('Student PINs — save these now'),
    ).toBeInTheDocument()
    expect(screen.getByText('New Kid')).toBeInTheDocument()
    expect(screen.getByText('4821')).toBeInTheDocument()
    expect(mock.post).toHaveBeenCalledWith(ROSTER_URL, {
      fullName: 'New Kid',
    })
    expect(screen.getByLabelText('Student name')).toHaveValue('')

    await user.click(screen.getByRole('button', { name: 'Copy PIN' }))
    expect(writeText).toHaveBeenCalledWith('4821')
    expect(
      await screen.findByRole('button', { name: 'Copied' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Dismiss' }))
    await waitFor(() =>
      expect(screen.queryByText('Student PINs — save these now')).toBeNull(),
    )
  })

  it('requires a student name', async () => {
    mock.get.mockResolvedValue({ data: [] })
    const user = userEvent.setup()
    renderWithProviders(<RosterPanel batchId="batch-1" />)
    await screen.findByText('No students on the roster yet.')
    await user.click(screen.getByRole('button', { name: 'Add student' }))
    expect(
      await screen.findByText('Student name is required'),
    ).toBeInTheDocument()
    expect(mock.post).not.toHaveBeenCalled()
  })

  it('shows the envelope message when adding fails', async () => {
    mock.get.mockResolvedValue({ data: [] })
    mock.post.mockRejectedValue({
      response: { data: { message: 'Name already on the roster' } },
    })
    const user = userEvent.setup()
    renderWithProviders(<RosterPanel batchId="batch-1" />)
    await screen.findByText('No students on the roster yet.')
    await user.type(screen.getByLabelText('Student name'), 'Simran')
    await user.click(screen.getByRole('button', { name: 'Add student' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Name already on the roster',
    )
  })
})

describe('RosterPanel bulk add', () => {
  it('adds many students, trimming blanks, and lists every PIN once', async () => {
    mock.get.mockResolvedValue({ data: [] })
    mock.post.mockResolvedValue({
      data: [
        {
          membershipId: 'membership-10',
          userId: 'user-student-10',
          fullName: 'Asha',
          pin: '1111',
        },
        {
          membershipId: 'membership-11',
          userId: 'user-student-11',
          fullName: 'Bala',
          pin: '2222',
        },
      ],
    })
    const user = userEvent.setup()
    renderWithProviders(<RosterPanel batchId="batch-1" />)
    await screen.findByText('No students on the roster yet.')
    await user.type(
      screen.getByLabelText('Student names (one per line)'),
      'Asha\n\n  Bala  ',
    )
    await user.click(screen.getByRole('button', { name: 'Add students' }))
    expect(
      await screen.findByText('Student PINs — save these now'),
    ).toBeInTheDocument()
    expect(mock.post).toHaveBeenCalledWith(`${ROSTER_URL}/bulk`, {
      fullNames: ['Asha', 'Bala'],
    })
    expect(screen.getByText('1111')).toBeInTheDocument()
    expect(screen.getByText('2222')).toBeInTheDocument()
  })

  it('rejects a bulk entry that is only whitespace', async () => {
    mock.get.mockResolvedValue({ data: [] })
    const user = userEvent.setup()
    renderWithProviders(<RosterPanel batchId="batch-1" />)
    await screen.findByText('No students on the roster yet.')
    await user.type(
      screen.getByLabelText('Student names (one per line)'),
      '   ',
    )
    await user.click(screen.getByRole('button', { name: 'Add students' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Enter at least one student name.',
    )
    expect(mock.post).not.toHaveBeenCalled()
  })

  it('requires some bulk input', async () => {
    mock.get.mockResolvedValue({ data: [] })
    const user = userEvent.setup()
    renderWithProviders(<RosterPanel batchId="batch-1" />)
    await screen.findByText('No students on the roster yet.')
    await user.click(screen.getByRole('button', { name: 'Add students' }))
    expect(
      await screen.findByText('Enter at least one student name'),
    ).toBeInTheDocument()
    expect(mock.post).not.toHaveBeenCalled()
  })

  it('shows the envelope message when the bulk add fails', async () => {
    mock.get.mockResolvedValue({ data: [] })
    mock.post.mockRejectedValue({
      response: { data: { message: 'Bulk add failed' } },
    })
    const user = userEvent.setup()
    renderWithProviders(<RosterPanel batchId="batch-1" />)
    await screen.findByText('No students on the roster yet.')
    await user.type(
      screen.getByLabelText('Student names (one per line)'),
      'Asha',
    )
    await user.click(screen.getByRole('button', { name: 'Add students' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Bulk add failed',
    )
  })
})

describe('RosterPanel PIN reset and deactivate', () => {
  it('resets a PIN and shows the new one once', async () => {
    mock.get.mockResolvedValue({ data: [rosterStudentActive] })
    mock.post.mockResolvedValue({ data: { pin: '9753' } })
    const user = userEvent.setup()
    renderWithProviders(<RosterPanel batchId="batch-1" />)
    await screen.findByText('Simran')
    await user.click(
      within(rowFor('Simran')).getByRole('button', { name: 'Reset PIN' }),
    )
    expect(
      await screen.findByText('Student PINs — save these now'),
    ).toBeInTheDocument()
    expect(screen.getByText('9753')).toBeInTheDocument()
    expect(mock.post).toHaveBeenCalledWith(
      `${ROSTER_URL}/membership-1/reset-pin`,
    )
  })

  it('shows the envelope message when a PIN reset fails', async () => {
    mock.get.mockResolvedValue({ data: [rosterStudentActive] })
    mock.post.mockRejectedValue({
      response: { data: { message: 'Reset failed' } },
    })
    const user = userEvent.setup()
    renderWithProviders(<RosterPanel batchId="batch-1" />)
    await screen.findByText('Simran')
    await user.click(
      within(rowFor('Simran')).getByRole('button', { name: 'Reset PIN' }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent('Reset failed')
  })

  it('deactivates a student after inline confirmation', async () => {
    let roster: RosterStudent[] = [
      rosterStudentActive,
      rosterStudentLocked,
    ]
    mock.get.mockImplementation(() => Promise.resolve({ data: roster }))
    mock.delete.mockImplementation(() => {
      roster = roster.filter((s) => s.membershipId !== 'membership-2')
      return Promise.resolve({ data: undefined })
    })
    const user = userEvent.setup()
    renderWithProviders(<RosterPanel batchId="batch-1" />)
    await screen.findByText('Arjun')

    await user.click(
      within(rowFor('Arjun')).getByRole('button', { name: 'Deactivate' }),
    )
    expect(
      within(rowFor('Arjun')).getByRole('button', {
        name: 'Confirm deactivate',
      }),
    ).toBeInTheDocument()
    await user.click(
      within(rowFor('Arjun')).getByRole('button', { name: 'Cancel' }),
    )
    expect(
      within(rowFor('Arjun')).getByRole('button', { name: 'Deactivate' }),
    ).toBeInTheDocument()
    expect(mock.delete).not.toHaveBeenCalled()

    await user.click(
      within(rowFor('Arjun')).getByRole('button', { name: 'Deactivate' }),
    )
    await user.click(
      within(rowFor('Arjun')).getByRole('button', {
        name: 'Confirm deactivate',
      }),
    )
    await waitFor(() => expect(screen.queryByText('Arjun')).toBeNull())
    expect(mock.delete).toHaveBeenCalledWith(
      `${ROSTER_URL}/membership-2`,
    )
  })

  it('shows the envelope message when deactivation fails', async () => {
    mock.get.mockResolvedValue({ data: [rosterStudentActive] })
    mock.delete.mockRejectedValue({
      response: { data: { message: 'Deactivate blocked' } },
    })
    const user = userEvent.setup()
    renderWithProviders(<RosterPanel batchId="batch-1" />)
    await screen.findByText('Simran')
    await user.click(
      within(rowFor('Simran')).getByRole('button', { name: 'Deactivate' }),
    )
    await user.click(
      within(rowFor('Simran')).getByRole('button', {
        name: 'Confirm deactivate',
      }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Deactivate blocked',
    )
  })
})
