import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthUser, MaterialDetailDto } from '../lib/api'
import { AuthProvider } from '../lib/auth'
import {
  materialDetailNoText,
  materialDetailOk,
  teacherUser,
} from '../test/fixtures'
import {
  createTestQueryClient,
  LocationProbe,
  renderWithProviders,
} from '../test/renderWithProviders'
import MaterialDetailPage from './MaterialDetailPage'

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

function seedSession(user: AuthUser, detail: MaterialDetailDto) {
  localStorage.setItem('learnium.refreshToken', 'stored-refresh')
  mock.refreshAccessToken.mockResolvedValue('fresh-access')
  mock.get.mockImplementation((url: string) => {
    if (url === '/me') {
      return Promise.resolve({ data: user })
    }
    if (url === `/materials/${detail.materialId}`) {
      return Promise.resolve({ data: detail })
    }
    return Promise.reject(new Error(`Unexpected GET ${url}`))
  })
}

function detailRoutes() {
  return (
    <>
      <Routes>
        <Route path="/materials" element={<p>Materials list stub</p>} />
        <Route
          path="/materials/:materialId"
          element={<MaterialDetailPage />}
        />
      </Routes>
      <LocationProbe />
    </>
  )
}

function renderDetail(detail: MaterialDetailDto) {
  seedSession(teacherUser, detail)
  return renderWithProviders(detailRoutes(), [
    `/materials/${detail.materialId}`,
  ])
}

function renderDetailWithState(
  detail: MaterialDetailDto,
  state: unknown,
) {
  seedSession(teacherUser, detail)
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter
        initialEntries={[
          { pathname: `/materials/${detail.materialId}`, state },
        ]}
      >
        <AuthProvider>{detailRoutes()}</AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('MaterialDetailPage', () => {
  it('shows the metadata, status explanation and extracted text', async () => {
    renderDetail(materialDetailOk)
    expect(
      await screen.findByRole('heading', { name: 'Fractions chapter' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Grade 8 · Mathematics')).toBeInTheDocument()
    expect(screen.getByText('Ready')).toBeInTheDocument()
    expect(screen.getByText('PDF')).toBeInTheDocument()
    expect(screen.getByText(/12,340 characters/)).toBeInTheDocument()
    expect(screen.getByText(/Added 2026-10-20/)).toBeInTheDocument()
    expect(
      screen.getByText(
        'The chapter text was read cleanly. This material is ready to use.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText('A fraction is a part of a whole.'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: '← Back to materials' }),
    ).toHaveAttribute('href', '/materials')
    expect(
      screen.queryByText(/You already had this chapter/),
    ).toBeNull()
  })

  it('marks a pasted-text material with the Paste source chip', async () => {
    renderDetail({
      ...materialDetailOk,
      materialId: 'mat-2',
      title: 'Pasted science notes',
      sourceType: 'TEXT',
    })
    expect(
      await screen.findByRole('heading', { name: 'Pasted science notes' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Paste')).toBeInTheDocument()
  })

  it('explains what a scanned PDF means and shows no extracted text', async () => {
    renderDetail(materialDetailNoText)
    expect(
      await screen.findByRole('heading', { name: 'Scanned worksheet' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('No readable text — likely a scanned PDF'),
    ).toBeInTheDocument()
    expect(screen.getByText(/likely a scanned PDF made of images/))
      .toBeInTheDocument()
    expect(
      screen.getByText('No extracted text is available for this material.'),
    ).toBeInTheDocument()
    expect(screen.getByText(/0 characters/)).toBeInTheDocument()
  })

  it('explains every other extraction status in plain language', async () => {
    const cases: Array<{
      status: MaterialDetailDto['extractionStatus']
      chip: string
      explanation: RegExp
    }> = [
      {
        status: 'UNUSABLE_TEXT',
        chip: 'Text too garbled to use',
        explanation: /cleaner PDF export/,
      },
      {
        status: 'OVER_LIMIT',
        chip: 'Chapter too long',
        explanation: /Split it into smaller parts/,
      },
      {
        status: 'EXTRACTION_FAILED',
        chip: "Couldn't read this file",
        explanation: /not password-protected/,
      },
    ]
    for (const testCase of cases) {
      const detail: MaterialDetailDto = {
        ...materialDetailOk,
        extractionStatus: testCase.status,
        extractedChars: null,
        extractedText: 'Some recovered text.',
      }
      const view = renderDetail(detail)
      expect(
        await screen.findByText(testCase.chip),
      ).toBeInTheDocument()
      expect(screen.getByText(testCase.explanation)).toBeInTheDocument()
      expect(screen.getByText(/No extracted text ·/)).toBeInTheDocument()
      view.unmount()
    }
  })

  it('shows the deduplicated notice when arriving from a duplicate add', async () => {
    renderDetailWithState(materialDetailOk, { deduplicated: true })
    expect(
      await screen.findByText(
        'You already had this chapter — opened your existing copy.',
      ),
    ).toBeInTheDocument()
  })

  it('removes the material after a two-step confirm and returns to the list', async () => {
    const user = userEvent.setup()
    mock.delete.mockResolvedValue({ data: undefined })
    renderDetail(materialDetailOk)
    expect(
      await screen.findByRole('heading', { name: 'Fractions chapter' }),
    ).toBeInTheDocument()
    await user.click(
      screen.getByRole('button', { name: 'Remove from your materials' }),
    )
    expect(
      screen.getByText('Remove this material from your materials?'),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(
      screen.queryByText('Remove this material from your materials?'),
    ).toBeNull()
    await user.click(
      screen.getByRole('button', { name: 'Remove from your materials' }),
    )
    await user.click(
      screen.getByRole('button', { name: 'Confirm remove' }),
    )
    expect(mock.delete).toHaveBeenCalledWith('/materials/mat-1')
    expect(
      await screen.findByText('Materials list stub'),
    ).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/materials')
  })

  it('surfaces the backend message when removal fails', async () => {
    const user = userEvent.setup()
    mock.delete.mockRejectedValue({
      response: { data: { message: 'This material is in use.' } },
    })
    renderDetail(materialDetailOk)
    expect(
      await screen.findByRole('heading', { name: 'Fractions chapter' }),
    ).toBeInTheDocument()
    await user.click(
      screen.getByRole('button', { name: 'Remove from your materials' }),
    )
    await user.click(
      screen.getByRole('button', { name: 'Confirm remove' }),
    )
    expect(
      await screen.findByText('This material is in use.'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Fractions chapter' }),
    ).toBeInTheDocument()
  })

  it('falls back to a generic message when removal fails without one', async () => {
    const user = userEvent.setup()
    mock.delete.mockRejectedValue(new Error('network down'))
    renderDetail(materialDetailOk)
    expect(
      await screen.findByRole('heading', { name: 'Fractions chapter' }),
    ).toBeInTheDocument()
    await user.click(
      screen.getByRole('button', { name: 'Remove from your materials' }),
    )
    await user.click(
      screen.getByRole('button', { name: 'Confirm remove' }),
    )
    expect(
      await screen.findByText('Could not remove the material.'),
    ).toBeInTheDocument()
  })

  it('shows a loading state while the material is being fetched', async () => {
    localStorage.setItem('learnium.refreshToken', 'stored-refresh')
    mock.refreshAccessToken.mockResolvedValue('fresh-access')
    mock.get.mockImplementation((url: string) => {
      if (url === '/me') {
        return Promise.resolve({ data: teacherUser })
      }
      return new Promise(() => undefined)
    })
    renderWithProviders(detailRoutes(), ['/materials/mat-1'])
    expect(
      await screen.findByText('Loading material…'),
    ).toBeInTheDocument()
  })

  it('shows the backend message when the material fails to load', async () => {
    localStorage.setItem('learnium.refreshToken', 'stored-refresh')
    mock.refreshAccessToken.mockResolvedValue('fresh-access')
    mock.get.mockImplementation((url: string) => {
      if (url === '/me') {
        return Promise.resolve({ data: teacherUser })
      }
      return Promise.reject({
        response: { data: { message: 'Material not found.' } },
      })
    })
    renderWithProviders(detailRoutes(), ['/materials/mat-1'])
    expect(
      await screen.findByText('Material not found.'),
    ).toBeInTheDocument()
  })

  it('falls back to a generic message when the load fails without one', async () => {
    localStorage.setItem('learnium.refreshToken', 'stored-refresh')
    mock.refreshAccessToken.mockResolvedValue('fresh-access')
    mock.get.mockImplementation((url: string) => {
      if (url === '/me') {
        return Promise.resolve({ data: teacherUser })
      }
      return Promise.reject(new Error('network down'))
    })
    renderWithProviders(detailRoutes(), ['/materials/mat-1'])
    expect(
      await screen.findByText('Could not load the material.'),
    ).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.queryByText('Loading material…')).toBeNull(),
    )
  })
})
