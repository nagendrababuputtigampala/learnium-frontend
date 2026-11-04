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

/**
 * Builds the one-tap WhatsApp share link for a report snapshot. The text is
 * a summary only — the parent receives the PDF as an attachment the teacher
 * adds in WhatsApp (no public link exists by design).
 */
export function whatsAppShareUrl(
  centreName: string,
  report: StudentReportDto,
): string {
  const facts = report.facts
  const firstName = facts.studentName.split(' ')[0]
  const strongest = facts.topics
    .filter((topic) => topic.band === 'STRONG')
    .sort((a, b) => b.percentage - a.percentage)[0]
  const lines = [
    `${centreName} — ${firstName}'s progress report`,
    `Overall: ${facts.overall.percentage.toFixed(0)}%`,
  ]
  if (strongest) {
    lines.push(
      `Strongest topic: ${strongest.topicName} (${strongest.percentage.toFixed(0)}%)`,
    )
  }
  lines.push('The full report is attached as a PDF.')
  return `https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`
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
