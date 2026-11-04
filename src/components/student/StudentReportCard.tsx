import { FileText } from 'lucide-react'
import { useState } from 'react'
import { downloadReportPdf, useOwnReport } from '../../lib/reports'

/**
 * The student's (and parent's) entry to the teacher-generated progress
 * report. Renders nothing until a report exists — the dashboard must never
 * break over an optional artefact.
 */
export default function StudentReportCard() {
  const report = useOwnReport()
  const [error, setError] = useState<string | null>(null)
  if (!report.data?.facts) return null
  const data = report.data

  const onDownload = async () => {
    setError(null)
    try {
      await downloadReportPdf(
        '/student/report.pdf',
        undefined,
        `report-${data.facts.username ?? 'student'}.pdf`,
      )
    } catch {
      setError('Could not download the report. Please try again.')
    }
  }

  return (
    <section className="rounded-2xl border border-card-border bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-indigo-tint p-2 text-indigo-primary">
            <FileText size={22} />
          </span>
          <div>
            <h3 className="font-display text-lg font-bold">Progress report</h3>
            <p className="text-sm text-ink/55">
              Shared by your teacher on{' '}
              {new Date(data.generatedAt).toLocaleDateString()} · Overall{' '}
              {data.facts.overall.percentage.toFixed(0)}%
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDownload}
          className="rounded-full bg-marigold px-4 py-2 text-sm font-semibold text-ink transition hover:brightness-95"
        >
          Download PDF
        </button>
      </div>
      {data.teacherComment !== null && data.teacherComment !== '' && (
        <p className="mt-3 rounded-lg bg-paper px-4 py-3 text-sm">
          <span className="font-semibold">Teacher comment: </span>
          {data.teacherComment}
        </p>
      )}
      {error !== null && (
        <p role="alert" className="mt-3 text-sm text-rose-weak">
          {error}
        </p>
      )}
    </section>
  )
}
