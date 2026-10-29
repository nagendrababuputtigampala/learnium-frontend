import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { gradeSubjects, materialOk } from '../../test/fixtures'
import {
  LocationProbe,
  renderWithProviders,
} from '../../test/renderWithProviders'
import AddMaterialDialog from './AddMaterialDialog'

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

function StateProbe() {
  const location = useLocation()
  return (
    <div data-testid="state">
      {JSON.stringify(location.state ?? null)}
    </div>
  )
}

const onClose = vi.fn()

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  mock.get.mockReset()
  mock.post.mockReset()
  mock.refreshAccessToken.mockReset()
  onClose.mockReset()
  mock.get.mockImplementation((url: string) => {
    if (url === '/master/grade-subjects') {
      return Promise.resolve({ data: gradeSubjects })
    }
    return Promise.reject(new Error(`Unexpected GET ${url}`))
  })
})

function renderDialog() {
  return renderWithProviders(
    <>
      <AddMaterialDialog onClose={onClose} />
      <LocationProbe />
      <StateProbe />
    </>,
    ['/materials'],
  )
}

function pdfFile(name = 'chapter.pdf', content = '%PDF-1.4 fake') {
  return new File([content], name, { type: 'application/pdf' })
}

async function fillSharedFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Title'), 'Fractions chapter')
  await user.selectOptions(
    screen.getByLabelText('Grade and subject'),
    'gs-1',
  )
}

describe('AddMaterialDialog', () => {
  it('shows the upload tab first with the shared fields and grade options', async () => {
    renderDialog()
    expect(
      screen.getByRole('dialog', { name: 'Add material' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Upload PDF' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByLabelText('Chapter PDF')).toBeInTheDocument()
    expect(screen.getByLabelText('Title')).toBeInTheDocument()
    expect(
      await screen.findByRole('option', { name: 'Grade 8 · Mathematics' }),
    ).toBeInTheDocument()
  })

  it('switches to the paste tab and counts characters as you type', async () => {
    const user = userEvent.setup()
    renderDialog()
    await user.click(screen.getByRole('tab', { name: 'Paste text' }))
    expect(screen.getByRole('tab', { name: 'Paste text' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.queryByLabelText('Chapter PDF')).toBeNull()
    const textarea = screen.getByLabelText('Chapter text')
    expect(screen.getByText('0 characters')).toBeInTheDocument()
    await user.type(textarea, 'Hello')
    expect(screen.getByText('5 characters')).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Upload PDF' }))
    expect(screen.getByRole('tab', { name: 'Upload PDF' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByLabelText('Chapter PDF')).toBeInTheDocument()
    expect(screen.queryByLabelText('Chapter text')).toBeNull()
  })

  it('calls onClose from the close and cancel buttons', async () => {
    const user = userEvent.setup()
    renderDialog()
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('requires a file, a title and a grade-subject for an upload', async () => {
    const user = userEvent.setup()
    renderDialog()
    await user.click(screen.getByRole('button', { name: 'Add material' }))
    expect(await screen.findByText('Choose a PDF file')).toBeInTheDocument()
    expect(screen.getByText('Title is required')).toBeInTheDocument()
    expect(
      screen.getByText('Choose a grade and subject'),
    ).toBeInTheDocument()
    expect(mock.post).not.toHaveBeenCalled()
  })

  it('requires pasted text on the paste tab', async () => {
    const user = userEvent.setup()
    renderDialog()
    await user.click(screen.getByRole('tab', { name: 'Paste text' }))
    await fillSharedFields(user)
    await user.click(screen.getByRole('button', { name: 'Add material' }))
    expect(
      await screen.findByText('Paste the chapter text'),
    ).toBeInTheDocument()
    expect(mock.post).not.toHaveBeenCalled()
  })

  it('warns before submitting when the file is over 20 MB', async () => {
    const user = userEvent.setup()
    renderDialog()
    const big = pdfFile('big.pdf')
    Object.defineProperty(big, 'size', { value: 21 * 1024 * 1024 })
    await user.upload(screen.getByLabelText('Chapter PDF'), big)
    expect(
      await screen.findByText(/larger than the 20 MB limit/),
    ).toBeInTheDocument()
    await fillSharedFields(user)
    await user.click(screen.getByRole('button', { name: 'Add material' }))
    expect(mock.post).not.toHaveBeenCalled()
  })

  it('clears the chosen file when the input is emptied', async () => {
    const user = userEvent.setup()
    renderDialog()
    const input = screen.getByLabelText('Chapter PDF')
    await user.upload(input, pdfFile())
    fireEvent.change(input, { target: { files: [] } })
    await fillSharedFields(user)
    await user.click(screen.getByRole('button', { name: 'Add material' }))
    expect(await screen.findByText('Choose a PDF file')).toBeInTheDocument()
    expect(mock.post).not.toHaveBeenCalled()
  })

  it('uploads the PDF as form data and opens the new material', async () => {
    const user = userEvent.setup()
    mock.post.mockResolvedValue({ data: materialOk })
    renderDialog()
    await user.upload(screen.getByLabelText('Chapter PDF'), pdfFile())
    await fillSharedFields(user)
    await user.click(screen.getByRole('button', { name: 'Add material' }))
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/materials/mat-1',
      ),
    )
    const [url, body] = mock.post.mock.calls[0] as [string, FormData]
    expect(url).toBe('/materials')
    expect(body.get('title')).toBe('Fractions chapter')
    expect(body.get('gradeSubjectId')).toBe('gs-1')
    expect((body.get('file') as File).name).toBe('chapter.pdf')
    expect(screen.getByTestId('state')).toHaveTextContent('null')
  })

  it('flags the navigation as deduplicated when the chapter already existed', async () => {
    const user = userEvent.setup()
    mock.post.mockResolvedValue({
      data: { ...materialOk, deduplicated: true },
    })
    renderDialog()
    await user.upload(screen.getByLabelText('Chapter PDF'), pdfFile())
    await fillSharedFields(user)
    await user.click(screen.getByRole('button', { name: 'Add material' }))
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/materials/mat-1',
      ),
    )
    expect(screen.getByTestId('state')).toHaveTextContent(
      '{"deduplicated":true}',
    )
  })

  it('creates a material from pasted text and opens it', async () => {
    const user = userEvent.setup()
    mock.post.mockResolvedValue({ data: materialOk })
    renderDialog()
    await user.click(screen.getByRole('tab', { name: 'Paste text' }))
    await fillSharedFields(user)
    await user.type(
      screen.getByLabelText('Chapter text'),
      'A fraction is part of a whole.',
    )
    await user.click(screen.getByRole('button', { name: 'Add material' }))
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/materials/mat-1',
      ),
    )
    expect(mock.post).toHaveBeenCalledWith('/materials/text', {
      title: 'Fractions chapter',
      gradeSubjectId: 'gs-1',
      text: 'A fraction is part of a whole.',
    })
  })

  it('surfaces the backend message when the file is not a PDF', async () => {
    const user = userEvent.setup()
    mock.post.mockRejectedValue({
      response: {
        data: { code: 'LRN-MAT-001', message: 'The uploaded file is not a PDF.' },
      },
    })
    renderDialog()
    await user.upload(screen.getByLabelText('Chapter PDF'), pdfFile())
    await fillSharedFields(user)
    await user.click(screen.getByRole('button', { name: 'Add material' }))
    expect(
      await screen.findByText('The uploaded file is not a PDF.'),
    ).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/materials')
  })

  it('surfaces the backend message when the chapter is too large', async () => {
    const user = userEvent.setup()
    mock.post.mockRejectedValue({
      response: {
        data: { code: 'LRN-MAT-003', message: 'The material is too large.' },
      },
    })
    renderDialog()
    await user.click(screen.getByRole('tab', { name: 'Paste text' }))
    await fillSharedFields(user)
    await user.type(screen.getByLabelText('Chapter text'), 'Huge chapter')
    await user.click(screen.getByRole('button', { name: 'Add material' }))
    expect(
      await screen.findByText('The material is too large.'),
    ).toBeInTheDocument()
  })

  it('falls back to a generic message for an unexpected failure', async () => {
    const user = userEvent.setup()
    mock.post.mockRejectedValue(new Error('network down'))
    renderDialog()
    await user.upload(screen.getByLabelText('Chapter PDF'), pdfFile())
    await fillSharedFields(user)
    await user.click(screen.getByRole('button', { name: 'Add material' }))
    expect(
      await screen.findByText('Could not add the material.'),
    ).toBeInTheDocument()
  })

  it('disables the submit button while a create is in flight', async () => {
    const user = userEvent.setup()
    let resolvePost: (value: { data: typeof materialOk }) => void =
      () => undefined
    mock.post.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePost = resolve
        }),
    )
    renderDialog()
    await user.upload(screen.getByLabelText('Chapter PDF'), pdfFile())
    await fillSharedFields(user)
    await user.click(screen.getByRole('button', { name: 'Add material' }))
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Add material' }),
      ).toBeDisabled(),
    )
    resolvePost({ data: materialOk })
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/materials/mat-1',
      ),
    )
  })
})
