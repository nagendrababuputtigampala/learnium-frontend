import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PageResponse, MaterialDto } from './api'
import { useAuth } from './auth'
import {
  authContextValue,
  gradeSubjects,
  materialDetailOk,
  materialOk,
  teacherUser,
} from '../test/fixtures'
import {
  createMaterialFromText,
  deleteMaterial,
  extractionStatusInfo,
  fetchGradeSubjects,
  fetchMaterial,
  fetchMaterials,
  materialDetailQueryKey,
  materialsQueryKey,
  uploadMaterialFile,
  useCreateMaterialFromText,
  useDeleteMaterial,
  useGradeSubjects,
  useMaterial,
  useMaterials,
  useUploadMaterial,
} from './materials'

const mock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  refreshAccessToken: vi.fn(),
  sessionExpired: { handler: null as (() => void) | null },
}))

vi.mock('./api', async () => {
  const helper = await import('../test/mockApi')
  return helper.createMockApiModule(mock)
})

vi.mock('./auth', () => ({
  useAuth: vi.fn(),
}))

const mockUseAuth = vi.mocked(useAuth)

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  mock.get.mockReset()
  mock.post.mockReset()
  mock.delete.mockReset()
  mockUseAuth.mockReturnValue(authContextValue({ user: teacherUser }))
})

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { queryClient, wrapper }
}

function pageOf(content: MaterialDto[]): PageResponse<MaterialDto> {
  return {
    content,
    page: 0,
    size: 10,
    totalElements: content.length,
    totalPages: 1,
  }
}

describe('extractionStatusInfo', () => {
  it('gives plain-language labels and explanations for every status', () => {
    expect(extractionStatusInfo('OK').chipLabel).toBe('Ready')
    expect(extractionStatusInfo('NO_TEXT').chipLabel).toBe(
      'No readable text — likely a scanned PDF',
    )
    expect(extractionStatusInfo('UNUSABLE_TEXT').chipLabel).toBe(
      'Text too garbled to use',
    )
    expect(extractionStatusInfo('OVER_LIMIT').chipLabel).toBe(
      'Chapter too long',
    )
    expect(extractionStatusInfo('EXTRACTION_FAILED').chipLabel).toBe(
      "Couldn't read this file",
    )
    for (const status of [
      'OK',
      'NO_TEXT',
      'UNUSABLE_TEXT',
      'OVER_LIMIT',
      'EXTRACTION_FAILED',
    ] as const) {
      expect(extractionStatusInfo(status).explanation.length).toBeGreaterThan(0)
      expect(extractionStatusInfo(status).chipClassName.length).toBeGreaterThan(0)
    }
  })

  it('returns an honest fallback for a legacy material with no status', () => {
    const info = extractionStatusInfo(null)
    expect(info.chipLabel).toBe('Not extracted')
    expect(info.chipClassName.length).toBeGreaterThan(0)
    expect(info.explanation).toMatch(/before text extraction was available/)
    expect(info.explanation).toMatch(/no extracted text/)
  })
})

describe('query keys', () => {
  it('scopes material keys by centre', () => {
    expect(materialsQueryKey('centre-1', 2)).toEqual(['materials', 'centre-1', 2])
    expect(materialDetailQueryKey('centre-1', 'mat-1')).toEqual([
      'materials',
      'centre-1',
      'detail',
      'mat-1',
    ])
  })
})

describe('materials API functions', () => {
  it('fetches a page of materials', async () => {
    mock.get.mockResolvedValue({ data: pageOf([materialOk]) })
    await expect(fetchMaterials(1, 10)).resolves.toEqual(pageOf([materialOk]))
    expect(mock.get).toHaveBeenCalledWith('/materials', {
      params: { page: 1, size: 10 },
    })
  })

  it('fetches one material detail', async () => {
    mock.get.mockResolvedValue({ data: materialDetailOk })
    await expect(fetchMaterial('mat-1')).resolves.toEqual(materialDetailOk)
    expect(mock.get).toHaveBeenCalledWith('/materials/mat-1')
  })

  it('fetches the grade-subject list', async () => {
    mock.get.mockResolvedValue({ data: gradeSubjects })
    await expect(fetchGradeSubjects()).resolves.toEqual(gradeSubjects)
    expect(mock.get).toHaveBeenCalledWith('/master/grade-subjects')
  })

  it('uploads a PDF as multipart form data', async () => {
    mock.post.mockResolvedValue({ data: materialOk })
    const file = new File(['%PDF-1.4 fake'], 'chapter.pdf', {
      type: 'application/pdf',
    })
    await expect(
      uploadMaterialFile({ file, title: 'Fractions', gradeSubjectId: 'gs-1' }),
    ).resolves.toEqual(materialOk)
    expect(mock.post).toHaveBeenCalledTimes(1)
    const [url, body] = mock.post.mock.calls[0] as [string, FormData]
    expect(url).toBe('/materials')
    expect(body).toBeInstanceOf(FormData)
    expect(body.get('title')).toBe('Fractions')
    expect(body.get('gradeSubjectId')).toBe('gs-1')
    const sentFile = body.get('file')
    expect(sentFile).toBeInstanceOf(File)
    expect((sentFile as File).name).toBe('chapter.pdf')
  })

  it('creates a material from pasted text', async () => {
    mock.post.mockResolvedValue({ data: materialOk })
    const input = { title: 'Notes', gradeSubjectId: 'gs-2', text: 'Some text' }
    await expect(createMaterialFromText(input)).resolves.toEqual(materialOk)
    expect(mock.post).toHaveBeenCalledWith('/materials/text', input)
  })

  it('deletes a material', async () => {
    mock.delete.mockResolvedValue({ data: undefined })
    await expect(deleteMaterial('mat-1')).resolves.toBeUndefined()
    expect(mock.delete).toHaveBeenCalledWith('/materials/mat-1')
  })
})

describe('materials hooks', () => {
  it('loads the materials page for the signed-in teacher', async () => {
    mock.get.mockResolvedValue({ data: pageOf([materialOk]) })
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useMaterials(0), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.content).toEqual([materialOk])
    expect(mock.get).toHaveBeenCalledWith('/materials', {
      params: { page: 0, size: 10 },
    })
  })

  it('still loads materials before the session user is known', async () => {
    mockUseAuth.mockReturnValue(authContextValue({ user: null }))
    mock.get.mockResolvedValue({ data: pageOf([]) })
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useMaterials(3), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mock.get).toHaveBeenCalledWith('/materials', {
      params: { page: 3, size: 10 },
    })
  })

  it('loads one material detail', async () => {
    mock.get.mockResolvedValue({ data: materialDetailOk })
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useMaterial('mat-1'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(materialDetailOk)
    expect(mock.get).toHaveBeenCalledWith('/materials/mat-1')
  })

  it('loads grade subjects', async () => {
    mock.get.mockResolvedValue({ data: gradeSubjects })
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useGradeSubjects(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(gradeSubjects)
  })

  it('uploads a file and invalidates the materials cache', async () => {
    mock.post.mockResolvedValue({ data: materialOk })
    const { queryClient, wrapper } = createWrapper()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useUploadMaterial(), { wrapper })
    const file = new File(['%PDF'], 'chapter.pdf', { type: 'application/pdf' })
    await result.current.mutateAsync({
      file,
      title: 'Fractions',
      gradeSubjectId: 'gs-1',
    })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['materials'] })
  })

  it('creates from text and invalidates the materials cache', async () => {
    mock.post.mockResolvedValue({ data: materialOk })
    const { queryClient, wrapper } = createWrapper()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useCreateMaterialFromText(), {
      wrapper,
    })
    await result.current.mutateAsync({
      title: 'Notes',
      gradeSubjectId: 'gs-2',
      text: 'Some text',
    })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['materials'] })
  })

  it('deletes a material and invalidates the materials cache', async () => {
    mock.delete.mockResolvedValue({ data: undefined })
    const { queryClient, wrapper } = createWrapper()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useDeleteMaterial(), { wrapper })
    await result.current.mutateAsync('mat-1')
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['materials'] })
  })
})
