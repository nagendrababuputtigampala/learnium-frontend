import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  apiClient,
  type ExtractionStatus,
  type GradeSubject,
  type MaterialDetailDto,
  type MaterialDto,
  type PageResponse,
} from './api'
import { useAuth } from './auth'

/* ------------------------------------------------------------------ */
/* Extraction status presentation                                      */
/* ------------------------------------------------------------------ */

export interface MaterialStatusInfo {
  /** Short label shown in the status chip. */
  chipLabel: string
  chipClassName: string
  /** Plain-language explanation of the status and what to do next. */
  explanation: string
}

const STATUS_INFO: Record<ExtractionStatus, MaterialStatusInfo> = {
  OK: {
    chipLabel: 'Ready',
    chipClassName: 'bg-emerald-progress/15 text-emerald-progress',
    explanation:
      'The chapter text was read cleanly. This material is ready to use.',
  },
  NO_TEXT: {
    chipLabel: 'No readable text — likely a scanned PDF',
    chipClassName: 'bg-marigold/20 text-ink',
    explanation:
      'We could not find any readable text in this file — it is likely a scanned PDF made of images. Try a text-based PDF, or add the material again by pasting the chapter text.',
  },
  UNUSABLE_TEXT: {
    chipLabel: 'Text too garbled to use',
    chipClassName: 'bg-marigold/20 text-ink',
    explanation:
      'The text we could read from this file is too garbled to use. Try a cleaner PDF export, or add the material again by pasting the chapter text.',
  },
  OVER_LIMIT: {
    chipLabel: 'Chapter too long',
    chipClassName: 'bg-indigo-bright/15 text-indigo-primary',
    explanation:
      'This chapter is longer than the limit for one material. Split it into smaller parts and add each part separately.',
  },
  EXTRACTION_FAILED: {
    chipLabel: "Couldn't read this file",
    chipClassName: 'bg-rose-weak/10 text-rose-weak',
    explanation:
      "We couldn't read this file at all. Check that it opens correctly and is not password-protected, then try adding it again.",
  },
}

export function extractionStatusInfo(
  status: ExtractionStatus,
): MaterialStatusInfo {
  return STATUS_INFO[status]
}

/* ------------------------------------------------------------------ */
/* API functions                                                       */
/* ------------------------------------------------------------------ */

export const MATERIALS_PAGE_SIZE = 10

export interface UploadMaterialInput {
  file: File
  title: string
  gradeSubjectId: string
}

export interface PasteMaterialInput {
  title: string
  gradeSubjectId: string
  text: string
}

export async function fetchMaterials(
  page: number,
  size: number,
): Promise<PageResponse<MaterialDto>> {
  const response = await apiClient.get<PageResponse<MaterialDto>>(
    '/materials',
    { params: { page, size } },
  )
  return response.data
}

export async function fetchMaterial(
  materialId: string,
): Promise<MaterialDetailDto> {
  const response = await apiClient.get<MaterialDetailDto>(
    `/materials/${materialId}`,
  )
  return response.data
}

export async function fetchGradeSubjects(): Promise<GradeSubject[]> {
  const response = await apiClient.get<GradeSubject[]>(
    '/master/grade-subjects',
  )
  return response.data
}

export async function uploadMaterialFile(
  input: UploadMaterialInput,
): Promise<MaterialDto> {
  const formData = new FormData()
  formData.append('file', input.file)
  formData.append('title', input.title)
  formData.append('gradeSubjectId', input.gradeSubjectId)
  const response = await apiClient.post<MaterialDto>('/materials', formData)
  return response.data
}

export async function createMaterialFromText(
  input: PasteMaterialInput,
): Promise<MaterialDto> {
  const response = await apiClient.post<MaterialDto>('/materials/text', input)
  return response.data
}

export async function deleteMaterial(materialId: string): Promise<void> {
  await apiClient.delete(`/materials/${materialId}`)
}

/* ------------------------------------------------------------------ */
/* Query keys (centre-scoped, like the other centre-owned resources)   */
/* ------------------------------------------------------------------ */

export function materialsQueryKey(
  centreId: string | undefined,
  page: number,
): readonly ['materials', string | undefined, number] {
  return ['materials', centreId, page]
}

export function materialDetailQueryKey(
  centreId: string | undefined,
  materialId: string,
): readonly ['materials', string | undefined, 'detail', string] {
  return ['materials', centreId, 'detail', materialId]
}

/* ------------------------------------------------------------------ */
/* Hooks                                                               */
/* ------------------------------------------------------------------ */

export function useMaterials(page: number) {
  const { user } = useAuth()
  return useQuery({
    queryKey: materialsQueryKey(user?.centreId, page),
    queryFn: () => fetchMaterials(page, MATERIALS_PAGE_SIZE),
  })
}

export function useMaterial(materialId: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: materialDetailQueryKey(user?.centreId, materialId),
    queryFn: () => fetchMaterial(materialId),
  })
}

export function useGradeSubjects() {
  return useQuery({
    queryKey: ['grade-subjects'],
    queryFn: fetchGradeSubjects,
  })
}

export function useUploadMaterial() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: uploadMaterialFile,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['materials'] })
    },
  })
}

export function useCreateMaterialFromText() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createMaterialFromText,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['materials'] })
    },
  })
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteMaterial,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['materials'] })
    },
  })
}
