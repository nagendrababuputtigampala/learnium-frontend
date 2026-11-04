import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  apiClient,
  getApiErrorMessage,
  type CentreDto,
  type StudentReportDto,
  type TopicBand,
} from '../lib/api'
import { useAuth } from '../lib/auth'
import { downloadReportPdf } from '../lib/reports'

const bandLabel: Record<Exclude<TopicBand, null>, string> = {
  STRONG: 'Strong',
  DEVELOPING: 'Developing',
  FOCUS: 'Focus',
}

const bandChip: Record<Exclude<TopicBand, null>, string> = {
  STRONG: 'bg-emerald-progress/15 text-emerald-700',
  DEVELOPING: 'bg-marigold/20 text-amber-800',
  FOCUS: 'bg-rose-weak/10 text-rose-weak',
}

function isNotFound(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    (error as { response?: { status?: number } }).response?.status === 404
  )
}

function formatWhen(iso: string, timezone: string | undefined): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}

function ReportView({
  report,
  timezone,
}: {
  report: StudentReportDto
  timezone: string | undefined
}) {
  const { facts } = report
  const strong = facts.topics.filter((topic) => topic.band === 'STRONG')
  const focus = facts.topics.filter((topic) => topic.band === 'FOCUS')
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-card-border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-ink/60">Overall score</p>
            <p className="font-display text-4xl font-bold">
              {facts.overall.percentage.toFixed(1)}%
            </p>
            <p className="mt-1 text-sm text-ink/60">
              {facts.overall.earnedMarks.toFixed(2)} of{' '}
              {facts.overall.availableMarks.toFixed(2)} marks ·{' '}
              {facts.overall.confirmedItems} confirmed answers
              {facts.overall.pendingItems > 0 &&
                ` · ${facts.overall.pendingItems} awaiting marking`}
            </p>
          </div>
          <p className="text-sm text-ink/60">
            Generated {formatWhen(report.generatedAt, timezone)}
            {facts.batchName !== null && ` · ${facts.batchName} only`}
          </p>
        </div>
        {report.teacherComment !== null && report.teacherComment !== '' && (
          <blockquote className="mt-4 rounded-lg bg-paper px-4 py-3 text-sm">
            <span className="font-semibold">Teacher comment: </span>
            {report.teacherComment}
          </blockquote>
        )}
      </section>

      {(strong.length > 0 || focus.length > 0) && (
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-card-border bg-white p-5 shadow-sm">
            <h2 className="font-display text-base font-bold">Strong areas</h2>
            {strong.length === 0 ? (
              <p className="mt-2 text-sm text-ink/60">None yet.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
                {strong.map((topic) => (
                  <li key={topic.topicId}>
                    {topic.topicName} · {topic.percentage.toFixed(1)}%
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-2xl border border-card-border bg-white p-5 shadow-sm">
            <h2 className="font-display text-base font-bold">
              Areas to improve
            </h2>
            {focus.length === 0 ? (
              <p className="mt-2 text-sm text-ink/60">None yet.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
                {focus.map((topic) => (
                  <li key={topic.topicId}>
                    {topic.topicName} · {topic.percentage.toFixed(1)}%
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-card-border bg-white p-5 shadow-sm">
        <h2 className="font-display text-base font-bold">Topics</h2>
        {facts.topics.length === 0 ? (
          <p className="mt-2 text-sm text-ink/60">
            No confirmed topic results yet.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-card-border">
            {facts.topics.map((topic) => (
              <li
                key={topic.topicId}
                className="flex flex-wrap items-center gap-3 py-2 text-sm"
              >
                <span className="min-w-40 font-semibold">{topic.topicName}</span>
                <span>
                  {topic.percentage.toFixed(1)}% · {topic.confirmedItems}{' '}
                  confirmed
                  {topic.pendingItems > 0 &&
                    ` · ${topic.pendingItems} awaiting marking`}
                </span>
                {topic.band === null ? (
                  <span className="ml-auto rounded-full bg-paper px-3 py-1 text-xs font-semibold text-ink/60">
                    Insufficient data
                  </span>
                ) : (
                  <span
                    className={`ml-auto rounded-full px-3 py-1 text-xs font-bold ${bandChip[topic.band]}`}
                  >
                    {bandLabel[topic.band]}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-card-border bg-white p-5 shadow-sm">
        <h2 className="font-display text-base font-bold">Test history</h2>
        {facts.tests.length === 0 ? (
          <p className="mt-2 text-sm text-ink/60">No completed tests yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-card-border">
            {facts.tests.map((test) => (
              <li key={test.attemptId} className="py-2 text-sm">
                <span className="font-semibold">{test.testName}</span>{' '}
                <span className="text-ink/60">
                  · {test.batchName} · {formatWhen(test.submittedAt, timezone)}{' '}
                  · {test.percentage.toFixed(1)}%
                  {test.pendingItems > 0 && ' · marking pending'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default function StudentReportPage() {
  const { userId } = useParams<{ userId: string }>()
  const [searchParams] = useSearchParams()
  const batchId = searchParams.get('batchId')
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [comment, setComment] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const centreQuery = useQuery({
    queryKey: ['centre', user?.centreId],
    queryFn: async () => {
      const response = await apiClient.get<CentreDto>('/centre')
      return response.data
    },
  })

  const reportKey = ['student-report', userId, batchId]
  const reportQuery = useQuery({
    queryKey: reportKey,
    queryFn: async () => {
      const response = await apiClient.get<StudentReportDto>(
        `/students/${userId}/report`,
        { params: batchId === null ? {} : { batchId } },
      )
      return response.data
    },
  })
  const report = reportQuery.data ?? null
  const noReportYet = reportQuery.isError && isNotFound(reportQuery.error)

  const generateMutation = useMutation({
    mutationFn: async (teacherComment: string) => {
      const response = await apiClient.post<StudentReportDto>(
        `/students/${userId}/report`,
        { batchId, teacherComment: teacherComment === '' ? null : teacherComment },
      )
      return response.data
    },
    onSuccess: (data) => {
      setErrorMessage(null)
      setComment(data.teacherComment ?? '')
      queryClient.setQueryData(reportKey, data)
    },
    onError: (error) => {
      setErrorMessage(getApiErrorMessage(error, 'Could not generate the report.'))
    },
  })

  const commentValue = comment ?? report?.teacherComment ?? ''

  const [downloading, setDownloading] = useState(false)
  const onDownloadPdf = async (current: StudentReportDto) => {
    setDownloading(true)
    try {
      await downloadReportPdf(
        `/students/${userId}/report.pdf`,
        batchId === null ? undefined : { batchId },
        `report-${current.facts.username ?? userId}.pdf`,
      )
    } catch {
      setErrorMessage('Could not download the PDF.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <Link
          to="/batches"
          className="text-sm font-semibold text-indigo-primary hover:underline"
        >
          ← Back to batches
        </Link>
        <h1 className="mt-2 font-display text-2xl font-bold">
          {report === null ? 'Student report' : report.facts.studentName}
        </h1>
        {report !== null && report.facts.username !== null && (
          <p className="mt-1 text-sm text-ink/60">
            {report.facts.username}
            {user?.centreCode ? `@${user.centreCode}` : ''}
            {report.facts.batchName !== null &&
              ` · Report scoped to ${report.facts.batchName}`}
          </p>
        )}
      </header>

      <section className="mb-4 rounded-2xl border border-card-border bg-white p-5 shadow-sm">
        <label
          htmlFor="teacher-comment"
          className="mb-1 block text-sm font-medium"
        >
          Teacher comment (goes on the report)
        </label>
        <textarea
          id="teacher-comment"
          className="w-full rounded-lg border border-card-border px-3 py-2 text-sm outline-none focus:border-indigo-bright focus:ring-2 focus:ring-indigo-bright/30"
          rows={3}
          maxLength={2000}
          value={commentValue}
          onChange={(event) => setComment(event.target.value)}
          placeholder="e.g. Steady progress this month — fractions are now secure. Next step: word problems."
        />
        {errorMessage !== null && (
          <p role="alert" className="mt-2 text-sm text-rose-weak">
            {errorMessage}
          </p>
        )}
        <button
          type="button"
          disabled={generateMutation.isPending}
          onClick={() => generateMutation.mutate(commentValue)}
          className="mt-3 rounded-full bg-marigold px-5 py-2.5 text-sm font-semibold text-ink transition hover:brightness-95 disabled:opacity-60"
        >
          {report === null ? 'Generate report' : 'Regenerate report'}
        </button>
        {report !== null && (
          <button
            type="button"
            disabled={downloading}
            onClick={() => void onDownloadPdf(report)}
            className="mt-3 ml-3 rounded-full border border-indigo-primary px-5 py-2.5 text-sm font-semibold text-indigo-primary transition hover:bg-indigo-tint disabled:opacity-60"
          >
            Download PDF
          </button>
        )}
        <p className="mt-2 text-xs text-ink/50">
          A report is a frozen snapshot of confirmed results. Regenerate after
          new marking is confirmed to refresh it.
        </p>
      </section>

      {reportQuery.isPending ? (
        <p className="text-sm text-ink/60">Loading report…</p>
      ) : noReportYet ? (
        <p className="text-sm text-ink/60">
          No report generated yet. Add a comment and generate the first one.
        </p>
      ) : reportQuery.isError ? (
        <p role="alert" className="text-sm text-rose-weak">
          {getApiErrorMessage(reportQuery.error, 'Could not load the report.')}
        </p>
      ) : (
        report !== null && (
          <ReportView report={report} timezone={centreQuery.data?.timezone} />
        )
      )}
    </div>
  )
}
