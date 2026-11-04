import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { BatchTopicReportDto } from '../lib/api'
import BatchTopicReportPage from './BatchTopicReportPage'

const mocks = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('../lib/api', () => ({
  apiClient: { get: mocks.get },
  getApiErrorMessage: (
    error: { response?: { data?: { message?: string } } },
    fallback: string,
  ) => error.response?.data?.message ?? fallback,
}))

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/batches/batch-1/report']}>
        <Routes>
          <Route
            path="/batches/:batchId/report"
            element={<BatchTopicReportPage />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const report: BatchTopicReportDto = {
  batchId: 'batch-1',
  batchName: 'Batch 8',
  topics: [
    {
      topicId: 'topic-weak',
      topicName: 'Algebra',
      confirmedItems: 6,
      pendingItems: 2,
      studentCount: 4,
      earnedMarks: 24,
      availableMarks: 60,
      percentage: 40,
      band: 'FOCUS',
    },
    {
      topicId: 'topic-few',
      topicName: 'Geometry',
      confirmedItems: 1,
      pendingItems: 0,
      studentCount: 1,
      earnedMarks: 9,
      availableMarks: 10,
      percentage: 90,
      band: null,
    },
    {
      topicId: 'topic-none',
      topicName: 'Trigonometry',
      confirmedItems: 0,
      pendingItems: 3,
      studentCount: 0,
      earnedMarks: 0,
      availableMarks: 0,
      percentage: null,
      band: null,
    },
  ],
}

beforeEach(() => {
  mocks.get.mockReset()
})

describe('BatchTopicReportPage', () => {
  it('shows a loading state', () => {
    mocks.get.mockImplementation(() => new Promise(() => undefined))
    renderPage()
    expect(screen.getByText('Loading topic report…')).toBeInTheDocument()
  })

  it('shows the envelope message when loading fails', async () => {
    mocks.get.mockRejectedValue({
      response: { data: { message: 'Batch unavailable' } },
    })
    renderPage()
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Batch unavailable',
    )
  })

  it('renders topics with heat bars, counts and band chips', async () => {
    mocks.get.mockResolvedValue({ data: report })
    renderPage()

    expect(
      await screen.findByText('Batch 8', { exact: false }),
    ).toBeInTheDocument()
    expect(mocks.get).toHaveBeenCalledWith('/batches/batch-1/topic-report')
    expect(screen.getByText('Algebra')).toBeInTheDocument()
    expect(screen.getByText('Focus')).toBeInTheDocument()
    expect(
      screen.getByText('6 confirmed answers · 4 students · 2 awaiting marking'),
    ).toBeInTheDocument()
    expect(screen.getByTestId('bar-topic-weak')).toHaveStyle({ width: '40%' })
    expect(screen.getByText('40.0%')).toBeInTheDocument()

    expect(screen.getByText('Insufficient data')).toBeInTheDocument()
    expect(screen.getByTestId('bar-topic-few')).toHaveStyle({ width: '90%' })
    expect(
      screen.getByText('1 confirmed answer · 1 student'),
    ).toBeInTheDocument()

    expect(screen.getByText('No confirmed results yet.')).toBeInTheDocument()
    expect(screen.queryByTestId('bar-topic-none')).not.toBeInTheDocument()
  })

  it('shows the empty state when the batch has no results', async () => {
    mocks.get.mockResolvedValue({
      data: { batchId: 'batch-1', batchName: 'Batch 8', topics: [] },
    })
    renderPage()
    expect(
      await screen.findByText('No test results yet for this batch.', {
        exact: false,
      }),
    ).toBeInTheDocument()
  })
})
