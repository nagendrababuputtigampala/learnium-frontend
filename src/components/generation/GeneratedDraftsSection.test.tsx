import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { GeneratedQuestionDto, PageResponse } from '../../lib/api'
import { questionFillBlank, questionMcq } from '../../test/fixtures'
import { renderWithProviders } from '../../test/renderWithProviders'
import GeneratedDraftsSection from './GeneratedDraftsSection'

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

const QUESTIONS_URL = '/materials/mat-1/questions'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  mock.get.mockReset()
  mock.refreshAccessToken.mockReset()
})

function pageOf(
  content: GeneratedQuestionDto[],
  page: number,
  totalPages: number,
  totalElements: number,
): PageResponse<GeneratedQuestionDto> {
  return { content, page, size: 10, totalElements, totalPages }
}

function servePages(pages: Record<number, PageResponse<GeneratedQuestionDto>>) {
  mock.get.mockImplementation((url: string, config?: { params?: { page: number } }) => {
    if (url === QUESTIONS_URL) {
      const page = config?.params?.page ?? 0
      return Promise.resolve({ data: pages[page] })
    }
    return Promise.reject(new Error(`Unexpected GET ${url}`))
  })
}

describe('GeneratedDraftsSection', () => {
  it('anchors the section for scroll-to-drafts and shows a loading note', () => {
    mock.get.mockImplementation(() => new Promise(() => {}))
    const view = renderWithProviders(
      <GeneratedDraftsSection materialId="mat-1" />,
    )
    expect(view.container.querySelector('#generated-drafts')).not.toBeNull()
    expect(screen.getByText('Loading drafts…')).toBeTruthy()
  })

  it('surfaces the backend message when drafts fail to load', async () => {
    mock.get.mockRejectedValue({
      response: { data: { message: 'Drafts are unavailable' } },
    })
    renderWithProviders(<GeneratedDraftsSection materialId="mat-1" />)
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toBe('Drafts are unavailable')
  })

  it('uses a fallback message for a non-envelope load failure', async () => {
    mock.get.mockRejectedValue(new Error('network down'))
    renderWithProviders(<GeneratedDraftsSection materialId="mat-1" />)
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toBe('Could not load the generated drafts.')
  })

  it('shows the empty state with no pagination', async () => {
    servePages({ 0: pageOf([], 0, 0, 0) })
    renderWithProviders(<GeneratedDraftsSection materialId="mat-1" />)
    expect(
      await screen.findByText(
        'No drafts yet — generate questions from this chapter.',
      ),
    ).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull()
  })

  it('renders draft cards for a single page', async () => {
    servePages({ 0: pageOf([questionMcq, questionFillBlank], 0, 1, 2) })
    renderWithProviders(<GeneratedDraftsSection materialId="mat-1" />)
    expect(await screen.findByText('What is 1/2 + 1/4?')).toBeTruthy()
    expect(
      screen.getByText('The fraction _____ is equal to 0.5.'),
    ).toBeTruthy()
    expect(screen.getByText('Page 1 of 1')).toBeTruthy()
    expect(
      (screen.getByRole('button', { name: 'Previous' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
    expect(
      (screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
  })

  it('paginates between pages of drafts', async () => {
    servePages({
      0: pageOf([questionMcq], 0, 2, 2),
      1: pageOf([questionFillBlank], 1, 2, 2),
    })
    renderWithProviders(<GeneratedDraftsSection materialId="mat-1" />)
    expect(await screen.findByText('What is 1/2 + 1/4?')).toBeTruthy()
    expect(screen.getByText('Page 1 of 2')).toBeTruthy()

    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(
      await screen.findByText('The fraction _____ is equal to 0.5.'),
    ).toBeTruthy()
    expect(screen.getByText('Page 2 of 2')).toBeTruthy()
    expect(mock.get).toHaveBeenCalledWith(QUESTIONS_URL, {
      params: { page: 1, size: 10 },
    })

    await userEvent.click(screen.getByRole('button', { name: 'Previous' }))
    expect(await screen.findByText('What is 1/2 + 1/4?')).toBeTruthy()
    expect(screen.getByText('Page 1 of 2')).toBeTruthy()
  })
})
