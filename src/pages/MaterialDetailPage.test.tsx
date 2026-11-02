import { QueryClientProvider } from '@tanstack/react-query'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthUser, MaterialDetailDto } from '../lib/api'
import { AuthProvider } from '../lib/auth'
import {
  generationJobCreated,
  jobDetailSucceeded,
  materialDetailLegacy,
  materialDetailNoText,
  materialDetailOk,
  questionMcq,
  teacherUser,
  topics,
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
    if (url === `/materials/${detail.materialId}/questions`) {
      return Promise.resolve({
        data: { content: [], page: 0, size: 10, totalElements: 0, totalPages: 0 },
      })
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

  it('renders a legacy material with no extraction status or text', async () => {
    renderDetail(materialDetailLegacy)
    expect(
      await screen.findByRole('heading', { name: 'Legacy chapter' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Not extracted')).toBeInTheDocument()
    expect(
      screen.getByText(/before text extraction was available/),
    ).toBeInTheDocument()
    expect(
      screen.getByText('No extracted text is available for this material.'),
    ).toBeInTheDocument()
    expect(screen.getByText(/No extracted text ·/)).toBeInTheDocument()
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

describe('MaterialDetailPage generation', () => {
  it('offers generation for a Ready material and shows the empty drafts state', async () => {
    renderDetail(materialDetailOk)
    expect(
      await screen.findByRole('heading', { name: 'Fractions chapter' }),
    ).toBeInTheDocument()
    const button = screen.getByRole('button', {
      name: 'Generate questions',
    }) as HTMLButtonElement
    expect(button.disabled).toBe(false)
    expect(
      screen.queryByText(/once the chapter text reads as Ready/),
    ).toBeNull()
    expect(
      await screen.findByText(
        'No drafts yet — generate questions from this chapter.',
      ),
    ).toBeInTheDocument()
  })

  it('disables generation with a reason when the text is not Ready', async () => {
    renderDetail(materialDetailNoText)
    expect(
      await screen.findByRole('heading', { name: 'Scanned worksheet' }),
    ).toBeInTheDocument()
    const button = screen.getByRole('button', {
      name: 'Generate questions',
    }) as HTMLButtonElement
    expect(button.disabled).toBe(true)
    expect(
      screen.getByText(
        'Questions can be generated once the chapter text reads as Ready.',
      ),
    ).toBeInTheDocument()
  })

  it('disables generation for a legacy material with no status', async () => {
    renderDetail(materialDetailLegacy)
    expect(
      await screen.findByRole('heading', { name: 'Legacy chapter' }),
    ).toBeInTheDocument()
    const button = screen.getByRole('button', {
      name: 'Generate questions',
    }) as HTMLButtonElement
    expect(button.disabled).toBe(true)
    expect(
      screen.getByText(/once the chapter text reads as Ready/),
    ).toBeInTheDocument()
  })

  it('opens the generate dialog and closes it again with Cancel', async () => {
    localStorage.setItem('learnium.refreshToken', 'stored-refresh')
    mock.refreshAccessToken.mockResolvedValue('fresh-access')
    mock.get.mockImplementation((url: string) => {
      if (url === '/me') {
        return Promise.resolve({ data: teacherUser })
      }
      if (url === '/materials/mat-1') {
        return Promise.resolve({ data: materialDetailOk })
      }
      if (url === '/materials/mat-1/questions') {
        return Promise.resolve({
          data: {
            content: [],
            page: 0,
            size: 10,
            totalElements: 0,
            totalPages: 0,
          },
        })
      }
      if (url === '/master/grade-subjects/gs-1/topics') {
        return Promise.resolve({ data: topics })
      }
      return Promise.reject(new Error(`Unexpected GET ${url}`))
    })
    renderWithProviders(detailRoutes(), ['/materials/mat-1'])
    expect(
      await screen.findByRole('heading', { name: 'Fractions chapter' }),
    ).toBeInTheDocument()
    const user = userEvent.setup()
    await user.click(
      screen.getByRole('button', { name: 'Generate questions' }),
    )
    const dialog = await screen.findByRole('dialog', {
      name: 'Generate questions',
    })
    await user.click(
      within(dialog).getByRole('button', { name: 'Cancel' }),
    )
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(mock.post).not.toHaveBeenCalled()
  })

  it('generates questions and jumps to the new drafts', async () => {
    localStorage.setItem('learnium.refreshToken', 'stored-refresh')
    mock.refreshAccessToken.mockResolvedValue('fresh-access')
    let questionsCalls = 0
    mock.get.mockImplementation((url: string) => {
      if (url === '/me') {
        return Promise.resolve({ data: teacherUser })
      }
      if (url === '/materials/mat-1') {
        return Promise.resolve({ data: materialDetailOk })
      }
      if (url === '/materials/mat-1/questions') {
        questionsCalls += 1
        return Promise.resolve({
          data:
            questionsCalls === 1
              ? {
                  content: [],
                  page: 0,
                  size: 10,
                  totalElements: 0,
                  totalPages: 0,
                }
              : {
                  content: [questionMcq],
                  page: 0,
                  size: 10,
                  totalElements: 1,
                  totalPages: 1,
                },
        })
      }
      if (url === '/master/grade-subjects/gs-1/topics') {
        return Promise.resolve({ data: topics })
      }
      if (url === '/generation-jobs/job-1') {
        return Promise.resolve({ data: jobDetailSucceeded })
      }
      return Promise.reject(new Error(`Unexpected GET ${url}`))
    })
    mock.post.mockResolvedValue({ data: generationJobCreated })
    const scrollSpy = vi.fn()
    window.HTMLElement.prototype.scrollIntoView = scrollSpy

    renderWithProviders(detailRoutes(), ['/materials/mat-1'])
    expect(
      await screen.findByRole('heading', { name: 'Fractions chapter' }),
    ).toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(
      screen.getByRole('button', { name: 'Generate questions' }),
    )
    const dialog = await screen.findByRole('dialog', {
      name: 'Generate questions',
    })
    await within(dialog).findByRole('option', { name: 'Fractions' })
    await user.selectOptions(within(dialog).getByLabelText('Topic'), 'topic-1')
    fireEvent.change(within(dialog).getByLabelText('MCQ count'), {
      target: { value: '5' },
    })
    await user.click(
      within(dialog).getByRole('button', { name: 'Generate questions' }),
    )

    expect(
      await within(dialog).findByText('Generation complete'),
    ).toBeInTheDocument()
    await user.click(
      within(dialog).getByRole('button', { name: 'View drafts' }),
    )
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(scrollSpy).toHaveBeenCalled()
    expect(
      await screen.findByText('What is 1/2 + 1/4?'),
    ).toBeInTheDocument()
  })
})
