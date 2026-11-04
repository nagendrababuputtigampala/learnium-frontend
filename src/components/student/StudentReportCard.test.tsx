import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { StudentReportDto } from '../../lib/api'
import StudentReportCard from './StudentReportCard'

const mocks = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('../../lib/api', () => ({ apiClient: { get: mocks.get } }))

URL.createObjectURL = vi.fn(() => 'blob:report')
URL.revokeObjectURL = vi.fn()

const report: StudentReportDto = {
  reportId: 'r1',
  studentId: 'u1',
  batchId: null,
  teacherComment: 'Great progress.',
  generatedBy: 'teacher-1',
  generatedAt: '2026-11-03T19:30:00Z',
  facts: {
    studentName: 'Simran Kaur',
    username: 'simran.k',
    batchName: null,
    overall: {
      confirmedItems: 9,
      pendingItems: 1,
      earnedMarks: 62,
      availableMarks: 90,
      percentage: 68.9,
      markingCoveragePercent: 90,
    },
    topics: [],
    tests: [],
  },
}

function renderCard() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const view = render(
    <QueryClientProvider client={client}>
      <StudentReportCard />
    </QueryClientProvider>,
  )
  return { client, ...view }
}

describe('StudentReportCard', () => {
  it('renders nothing when no report exists', async () => {
    mocks.get.mockRejectedValue({ response: { status: 404 } })
    const { client, container } = renderCard()
    // Wait until the query settles so the rejection is fully processed
    // while the card is still mounted.
    await waitFor(() =>
      expect(client.getQueryState(['student-own-report'])?.status).toBe(
        'error',
      ),
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing for a shapeless response', async () => {
    mocks.get.mockResolvedValue({ data: {} })
    const { container } = renderCard()
    await waitFor(() => expect(container).toBeEmptyDOMElement())
  })

  it('shows the summary and downloads the PDF', async () => {
    mocks.get.mockImplementation((url: string) =>
      url === '/student/report'
        ? Promise.resolve({ data: report })
        : Promise.resolve({ data: new Blob(['pdf']) }),
    )
    renderCard()
    expect(
      await screen.findByRole('heading', { name: 'Progress report' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Overall 69%/)).toBeInTheDocument()
    expect(screen.getByText('Great progress.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Download PDF' }))
    await waitFor(() =>
      expect(mocks.get).toHaveBeenCalledWith(
        '/student/report.pdf',
        expect.objectContaining({ responseType: 'blob' }),
      ),
    )
  })

  it('shows an error when the download fails and handles a missing comment and username', async () => {
    const bare: StudentReportDto = {
      ...report,
      teacherComment: null,
      facts: { ...report.facts, username: null },
    }
    mocks.get.mockImplementation((url: string) =>
      url === '/student/report'
        ? Promise.resolve({ data: bare })
        : Promise.reject(new Error('down')),
    )
    renderCard()
    expect(
      await screen.findByRole('heading', { name: 'Progress report' }),
    ).toBeInTheDocument()
    expect(screen.queryByText(/Teacher comment/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Download PDF' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not download the report.',
    )
  })
})
