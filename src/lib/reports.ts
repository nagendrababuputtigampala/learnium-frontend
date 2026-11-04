import { useQuery } from '@tanstack/react-query'
import { apiClient, type StudentReportDto } from './api'

/** The student's own latest report snapshot (any scope), when a teacher has generated one. */
export function useOwnReport() {
  return useQuery({
    queryKey: ['student-own-report'],
    queryFn: async () =>
      (await apiClient.get<StudentReportDto>('/student/report')).data,
  })
}

/** Downloads a report PDF through the authenticated client and saves it under the given name. */
export async function downloadReportPdf(
  path: string,
  params: Record<string, string> | undefined,
  filename: string,
): Promise<void> {
  const response = await apiClient.get<Blob>(path, {
    params,
    responseType: 'blob',
  })
  const objectUrl = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename
  link.click()
  URL.revokeObjectURL(objectUrl)
}
