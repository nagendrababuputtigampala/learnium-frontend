import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { centreDto } from '../test/fixtures'
import { renderWithProviders } from '../test/renderWithProviders'
import CentreSettingsPage from './CentreSettingsPage'

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
  mock.put.mockReset()
  mock.refreshAccessToken.mockReset()
})

describe('CentreSettingsPage', () => {
  it('shows a loading state', () => {
    mock.get.mockImplementation(() => new Promise(() => undefined))
    renderWithProviders(<CentreSettingsPage />, ['/admin/settings'])
    expect(screen.getByText('Loading centre settings…')).toBeInTheDocument()
  })

  it('shows the envelope message when loading fails', async () => {
    mock.get.mockRejectedValue({
      response: { data: { message: 'Centre unavailable' } },
    })
    renderWithProviders(<CentreSettingsPage />, ['/admin/settings'])
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Centre unavailable',
    )
  })

  it('loads the centre into the form and saves changes', async () => {
    mock.get.mockResolvedValue({ data: centreDto })
    mock.put.mockResolvedValue({
      data: { ...centreDto, name: 'Renamed Centre' },
    })
    const user = userEvent.setup()
    renderWithProviders(<CentreSettingsPage />, ['/admin/settings'])
    expect(await screen.findByLabelText('Centre name')).toHaveValue(
      'Demo Tutoring Centre',
    )
    expect(screen.getByLabelText('Logo URL')).toHaveValue(
      'https://example.test/logo.png',
    )
    expect(screen.getByLabelText('Contact email')).toHaveValue(
      'hello@demo.test',
    )
    await user.clear(screen.getByLabelText('Centre name'))
    await user.type(screen.getByLabelText('Centre name'), 'Renamed Centre')
    await user.click(screen.getByRole('button', { name: 'Save settings' }))
    expect(await screen.findByText('Settings saved.')).toBeInTheDocument()
    expect(mock.put).toHaveBeenCalledWith('/centre', {
      name: 'Renamed Centre',
      logoUrl: 'https://example.test/logo.png',
      contactEmail: 'hello@demo.test',
    })
  })

  it('validates the form before saving', async () => {
    mock.get.mockResolvedValue({ data: centreDto })
    const user = userEvent.setup()
    renderWithProviders(<CentreSettingsPage />, ['/admin/settings'])
    await screen.findByLabelText('Centre name')
    await user.clear(screen.getByLabelText('Centre name'))
    await user.clear(screen.getByLabelText('Contact email'))
    await user.type(screen.getByLabelText('Contact email'), 'not-an-email')
    await user.click(screen.getByRole('button', { name: 'Save settings' }))
    expect(
      await screen.findByText('Centre name is required'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Enter a valid email address'),
    ).toBeInTheDocument()
    expect(mock.put).not.toHaveBeenCalled()
  })

  it('shows the envelope message when saving fails', async () => {
    mock.get.mockResolvedValue({ data: centreDto })
    mock.put.mockRejectedValue({
      response: { data: { message: 'Save failed' } },
    })
    const user = userEvent.setup()
    renderWithProviders(<CentreSettingsPage />, ['/admin/settings'])
    await screen.findByLabelText('Centre name')
    await user.click(screen.getByRole('button', { name: 'Save settings' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Save failed')
  })
})
