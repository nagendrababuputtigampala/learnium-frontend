import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { StudentReportDto } from '../lib/api'
import { centreDto, teacherUser } from '../test/fixtures'
import { renderWithProviders } from '../test/renderWithProviders'
import StudentReportPage from './StudentReportPage'

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

const existingReport: StudentReportDto = {
  reportId: 'report-1',
  studentId: 'student-1',
  batchId: 'batch-1',
  teacherComment: 'Steady progress.',
  generatedBy: 'teacher-1',
  generatedAt: '2026-11-03T18:30:00Z',
  facts: {
    studentName: 'Simran Kaur',
    username: 'simran.k',
    batchName: 'Batch 8',
    overall: {
      confirmedItems: 9,
      pendingItems: 1,
      earnedMarks: 62,
      availableMarks: 90,
      percentage: 68.89,
      markingCoveragePercent: 90,
    },
    topics: [
      {
        topicId: 't-strong',
        topicName: 'Fractions',
        confirmedItems: 5,
        pendingItems: 0,
        earnedMarks: 45,
        availableMarks: 50,
        percentage: 90,
        band: 'STRONG',
      },
      {
        topicId: 't-focus',
        topicName: 'Algebra',
        confirmedItems: 4,
        pendingItems: 1,
        earnedMarks: 17,
        availableMarks: 40,
        percentage: 42.5,
        band: 'FOCUS',
      },
      {
        topicId: 't-few',
        topicName: 'Geometry',
        confirmedItems: 1,
        pendingItems: 0,
        earnedMarks: 10,
        availableMarks: 10,
        percentage: 100,
        band: null,
      },
    ],
    tests: [
      {
        attemptId: 'a-1',
        testName: 'Fractions Quiz',
        batchName: 'Batch 8',
        submittedAt: '2026-11-01T17:00:00Z',
        earnedMarks: 40,
        availableMarks: 50,
        percentage: 80,
        pendingItems: 0,
      },
      {
        attemptId: 'a-2',
        testName: 'Algebra Test',
        batchName: 'Batch 8',
        submittedAt: '2026-11-03T17:00:00Z',
        earnedMarks: 22,
        availableMarks: 40,
        percentage: 55,
        pendingItems: 1,
      },
    ],
  },
}

URL.createObjectURL = vi.fn(() => 'blob:report')
URL.revokeObjectURL = vi.fn()

function renderPage(entry = '/students/student-1/report?batchId=batch-1') {
  return renderWithProviders(
    <Routes>
      <Route path="/students/:userId/report" element={<StudentReportPage />} />
    </Routes>,
    [entry],
  )
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  mock.get.mockReset()
  mock.post.mockReset()
  mock.refreshAccessToken.mockReset()
  localStorage.setItem('learnium.refreshToken', 'stored-refresh')
  mock.refreshAccessToken.mockResolvedValue('fresh-access')
})

function mockReads(report: StudentReportDto | 'missing' | 'error') {
  mock.get.mockImplementation((url: string) => {
    if (url === '/me') return Promise.resolve({ data: teacherUser })
    if (url === '/centre') return Promise.resolve({ data: centreDto })
    if (url === '/students/student-1/report') {
      if (report === 'missing') {
        return Promise.reject({
          response: { status: 404, data: { message: 'Resource not found' } },
        })
      }
      if (report === 'error') {
        return Promise.reject({
          response: { status: 500, data: { message: 'Report service down' } },
        })
      }
      return Promise.resolve({ data: report })
    }
    return Promise.reject(new Error(`Unexpected GET ${url}`))
  })
}

describe('StudentReportPage', () => {
  it('renders an existing snapshot with overall, topics and history', async () => {
    mockReads(existingReport)
    renderPage()

    expect(await screen.findByText('Simran Kaur')).toBeInTheDocument()
    expect(screen.getByText('simran.k@dtc', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('68.9%')).toBeInTheDocument()
    expect(
      screen.getByText('62.00 of 90.00 marks · 9 confirmed answers · 1 awaiting marking'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === 'BLOCKQUOTE' &&
          element.textContent === 'Teacher comment: Steady progress.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Strong areas')).toBeInTheDocument()
    expect(screen.getByText('Fractions · 90.0%')).toBeInTheDocument()
    expect(screen.getByText('Algebra · 42.5%')).toBeInTheDocument()
    expect(screen.getByText('Insufficient data')).toBeInTheDocument()
    expect(screen.getByText('Fractions Quiz')).toBeInTheDocument()
    expect(screen.getByText('marking pending', { exact: false })).toBeInTheDocument()
    expect(screen.getByLabelText('Teacher comment (goes on the report)')).toHaveValue(
      'Steady progress.',
    )
    expect(mock.get).toHaveBeenCalledWith('/students/student-1/report', {
      params: { batchId: 'batch-1' },
    })
  })

  it('generates the first report from the empty state', async () => {
    mockReads('missing')
    mock.post.mockResolvedValue({ data: existingReport })
    const user = userEvent.setup()
    renderPage()

    expect(
      await screen.findByText('No report generated yet.', { exact: false }),
    ).toBeInTheDocument()
    await user.type(
      screen.getByLabelText('Teacher comment (goes on the report)'),
      'Well done.',
    )
    await user.click(screen.getByRole('button', { name: 'Generate report' }))
    expect(await screen.findByText('Simran Kaur')).toBeInTheDocument()
    expect(mock.post).toHaveBeenCalledWith('/students/student-1/report', {
      batchId: 'batch-1',
      teacherComment: 'Well done.',
    })
    expect(
      screen.getByRole('button', { name: 'Regenerate report' }),
    ).toBeInTheDocument()
  })

  it('downloads the PDF of the current snapshot', async () => {
    mockReads(existingReport)
    const reads = mock.get.getMockImplementation()
    mock.get.mockImplementation((url: string, config?: unknown) =>
      url === '/students/student-1/report.pdf'
        ? Promise.resolve({ data: new Blob(['pdf']) })
        : reads!(url, config),
    )
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Download PDF' }))
    expect(mock.get).toHaveBeenCalledWith('/students/student-1/report.pdf', {
      params: { batchId: 'batch-1' },
      responseType: 'blob',
    })
  })

  it('shows an error when the PDF download fails', async () => {
    mockReads(existingReport)
    const reads = mock.get.getMockImplementation()
    mock.get.mockImplementation((url: string, config?: unknown) =>
      url === '/students/student-1/report.pdf'
        ? Promise.reject(new Error('down'))
        : reads!(url, config),
    )
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Download PDF' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not download the PDF.',
    )
  })

  it('shows a load error that is not a missing report', async () => {
    mockReads('error')
    renderPage()
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Report service down',
    )
  })

  it('surfaces a generation failure', async () => {
    mockReads('missing')
    mock.post.mockRejectedValue({
      response: { data: { message: 'Student not in this batch' } },
    })
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('No report generated yet.', { exact: false })
    await user.click(screen.getByRole('button', { name: 'Generate report' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Student not in this batch',
    )
    expect(mock.post).toHaveBeenCalledWith('/students/student-1/report', {
      batchId: 'batch-1',
      teacherComment: null,
    })
  })
})
