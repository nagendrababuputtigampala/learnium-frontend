import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PublicBatch } from '../lib/api'
import { studentProfile } from '../test/fixtures'
import { LocationProbe, renderWithProviders } from '../test/renderWithProviders'
import JoinPage from './JoinPage'

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

const CENTRES = [
  { centreId: 'centre-1', name: 'Demo Tutoring Centre' },
  { centreId: 'centre-2', name: 'Other Centre' },
]

const BATCHES: Record<string, PublicBatch[]> = {
  'centre-1': [{ batchId: 'batch-1', name: 'Grade 8 Math — Batch B' }],
  'centre-2': [{ batchId: 'batch-2', name: 'Grade 7 Science — Batch A' }],
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  mock.get.mockReset()
  mock.post.mockReset()
  mock.refreshAccessToken.mockReset()
  mock.get.mockImplementation((url: string) => {
    if (url === '/public/centres') {
      return Promise.resolve({ data: CENTRES })
    }
    const match = /^\/public\/centres\/(.+)\/batches$/.exec(url)
    if (match !== null) {
      return Promise.resolve({ data: BATCHES[match[1]] ?? [] })
    }
    return Promise.reject(new Error(`Unexpected GET ${url}`))
  })
})

function renderJoin(path = '/join') {
  return renderWithProviders(
    <>
      <JoinPage />
      <LocationProbe />
    </>,
    [path],
  )
}

async function chooseCentreAndBatch(
  user: ReturnType<typeof userEvent.setup>,
  centreId: string,
  batchId: string,
  batchName: string,
) {
  await screen.findByRole('option', { name: 'Demo Tutoring Centre' })
  await user.selectOptions(screen.getByLabelText('Centre'), centreId)
  await screen.findByRole('option', { name: batchName })
  await user.selectOptions(screen.getByLabelText('Batch'), batchId)
}

describe('JoinPage', () => {
  it('shows a back-to-sign-in link that navigates to /login', async () => {
    const user = userEvent.setup()
    renderJoin()
    const backLink = screen.getByRole('link', { name: 'Back to sign in' })
    expect(backLink).toHaveAttribute('href', '/login')
    await user.click(backLink)
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent('/login'),
    )
  })

  it('renders the centre list and keeps the batch select disabled', async () => {
    renderJoin()
    expect(
      screen.getByRole('heading', { name: 'Join your test' }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('option', { name: 'Demo Tutoring Centre' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('option', { name: 'Other Centre' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Batch')).toBeDisabled()
  })

  it('joins with centre, batch, name and PIN and lands on /student', async () => {
    mock.post.mockResolvedValue({
      data: {
        accessToken: 'student-token',
        tokenType: 'Bearer',
        expiresInSeconds: 43200,
        student: studentProfile,
      },
    })
    const user = userEvent.setup()
    renderJoin()
    await chooseCentreAndBatch(user, 'centre-1', 'batch-1', 'Grade 8 Math — Batch B')
    await user.type(screen.getByLabelText('Full name'), 'Simran')
    await user.type(screen.getByLabelText('PIN'), '1234')
    await user.click(screen.getByRole('button', { name: 'Join test' }))
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent('/student'),
    )
    expect(mock.post).toHaveBeenCalledWith('/auth/student-session', {
      batchId: 'batch-1',
      fullName: 'Simran',
      pin: '1234',
    })
    expect(sessionStorage.getItem('learnium.studentToken')).toBe(
      'student-token',
    )
  })

  it('requires a batch before joining', async () => {
    const user = userEvent.setup()
    renderJoin()
    await user.type(screen.getByLabelText('Full name'), 'Simran')
    await user.type(screen.getByLabelText('PIN'), '1234')
    await user.click(screen.getByRole('button', { name: 'Join test' }))
    expect(
      await screen.findByText('Choose your batch to continue.'),
    ).toBeInTheDocument()
    expect(mock.post).not.toHaveBeenCalled()
  })

  it('validates the name and PIN fields', async () => {
    const user = userEvent.setup()
    renderJoin()
    await chooseCentreAndBatch(user, 'centre-1', 'batch-1', 'Grade 8 Math — Batch B')
    await user.click(screen.getByRole('button', { name: 'Join test' }))
    expect(
      await screen.findByText('Enter your full name'),
    ).toBeInTheDocument()
    expect(screen.getByText('Enter your PIN')).toBeInTheDocument()
    expect(mock.post).not.toHaveBeenCalled()
  })

  it('shows the envelope message when the join is rejected', async () => {
    mock.post.mockRejectedValue({
      response: { data: { message: 'Invalid PIN' } },
    })
    const user = userEvent.setup()
    renderJoin()
    await chooseCentreAndBatch(user, 'centre-1', 'batch-1', 'Grade 8 Math — Batch B')
    await user.type(screen.getByLabelText('Full name'), 'Simran')
    await user.type(screen.getByLabelText('PIN'), '9999')
    await user.click(screen.getByRole('button', { name: 'Join test' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid PIN')
    expect(screen.getByTestId('location')).toHaveTextContent('/join')
  })

  it('shows the envelope message when the centre list fails to load', async () => {
    mock.get.mockImplementation((url: string) => {
      if (url === '/public/centres') {
        return Promise.reject({
          response: { data: { message: 'Directory unavailable' } },
        })
      }
      return Promise.reject(new Error(`Unexpected GET ${url}`))
    })
    renderJoin()
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Directory unavailable',
    )
  })

  it('preselects the centre and batch from a ?batch= link', async () => {
    renderJoin('/join?batch=batch-2')
    await waitFor(() =>
      expect(screen.getByLabelText('Centre')).toHaveValue('centre-2'),
    )
    await waitFor(() =>
      expect(screen.getByLabelText('Batch')).toHaveValue('batch-2'),
    )
    expect(mock.get).toHaveBeenCalledWith(
      '/public/centres/centre-1/batches',
    )
    expect(mock.get).toHaveBeenCalledWith(
      '/public/centres/centre-2/batches',
    )
  })

  it('leaves the selects empty when the ?batch= id is unknown', async () => {
    renderJoin('/join?batch=missing')
    await waitFor(() =>
      expect(mock.get).toHaveBeenCalledWith(
        '/public/centres/centre-2/batches',
      ),
    )
    expect(screen.getByLabelText('Centre')).toHaveValue('')
    expect(screen.getByLabelText('Batch')).toHaveValue('')
  })

  it('resets the chosen batch when the centre changes', async () => {
    const user = userEvent.setup()
    renderJoin()
    await chooseCentreAndBatch(user, 'centre-1', 'batch-1', 'Grade 8 Math — Batch B')
    expect(screen.getByLabelText('Batch')).toHaveValue('batch-1')
    await user.selectOptions(screen.getByLabelText('Centre'), 'centre-2')
    expect(screen.getByLabelText('Batch')).toHaveValue('')
    await screen.findByRole('option', {
      name: 'Grade 7 Science — Batch A',
    })
  })
})
