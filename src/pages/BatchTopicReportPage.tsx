import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import {
  apiClient,
  getApiErrorMessage,
  type BatchTopicDto,
  type BatchTopicReportDto,
  type TopicBand,
} from '../lib/api'

const bandLabel: Record<Exclude<TopicBand, null>, string> = {
  STRONG: 'Strong',
  DEVELOPING: 'Developing',
  FOCUS: 'Focus',
}

const bandBar: Record<Exclude<TopicBand, null>, string> = {
  STRONG: 'bg-emerald-progress',
  DEVELOPING: 'bg-marigold',
  FOCUS: 'bg-rose-weak',
}

const bandChip: Record<Exclude<TopicBand, null>, string> = {
  STRONG: 'bg-emerald-progress/15 text-emerald-700',
  DEVELOPING: 'bg-marigold/20 text-amber-800',
  FOCUS: 'bg-rose-weak/10 text-rose-weak',
}

function TopicRow({ topic }: { topic: BatchTopicDto }) {
  return (
    <li className="rounded-2xl border border-card-border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display font-bold">{topic.topicName}</p>
          <p className="mt-1 text-sm text-ink/60">
            {topic.confirmedItems} confirmed{' '}
            {topic.confirmedItems === 1 ? 'answer' : 'answers'} ·{' '}
            {topic.studentCount}{' '}
            {topic.studentCount === 1 ? 'student' : 'students'}
            {topic.pendingItems > 0 &&
              ` · ${topic.pendingItems} awaiting marking`}
          </p>
        </div>
        {topic.percentage !== null &&
          (topic.band === null ? (
            <span className="rounded-full bg-paper px-3 py-1 text-xs font-semibold text-ink/60">
              Insufficient data
            </span>
          ) : (
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${bandChip[topic.band]}`}
            >
              {bandLabel[topic.band]}
            </span>
          ))}
      </div>
      {topic.percentage === null ? (
        <p className="mt-3 text-sm text-ink/60">No confirmed results yet.</p>
      ) : (
        <div className="mt-3 flex items-center gap-3">
          <div
            className="h-3 flex-1 overflow-hidden rounded-full bg-paper"
            role="img"
            aria-label={`${topic.topicName}: ${topic.percentage.toFixed(1)} percent`}
          >
            <div
              data-testid={`bar-${topic.topicId}`}
              className={`h-full rounded-full ${topic.band === null ? 'bg-indigo-bright' : bandBar[topic.band]}`}
              style={{ width: `${topic.percentage}%` }}
            />
          </div>
          <span className="text-sm font-semibold">
            {topic.percentage.toFixed(1)}%
          </span>
        </div>
      )}
    </li>
  )
}

export default function BatchTopicReportPage() {
  const { batchId } = useParams<{ batchId: string }>()
  const reportQuery = useQuery({
    queryKey: ['batch-topic-report', batchId],
    queryFn: async () => {
      const response = await apiClient.get<BatchTopicReportDto>(
        `/batches/${batchId}/topic-report`,
      )
      return response.data
    },
  })

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <Link
          to="/batches"
          className="text-sm font-semibold text-indigo-primary hover:underline"
        >
          ← Back to batches
        </Link>
        <h1 className="mt-2 font-display text-2xl font-bold">Topic report</h1>
        {reportQuery.data && (
          <p className="mt-1 text-sm text-ink/60">
            {reportQuery.data.batchName} · weakest topics first, from confirmed
            results only
          </p>
        )}
      </header>
      {reportQuery.isPending ? (
        <p className="text-sm text-ink/60">Loading topic report…</p>
      ) : reportQuery.isError ? (
        <p role="alert" className="text-sm text-rose-weak">
          {getApiErrorMessage(reportQuery.error, 'Could not load the report.')}
        </p>
      ) : reportQuery.data.topics.length === 0 ? (
        <p className="text-sm text-ink/60">
          No test results yet for this batch. Topic performance appears here
          once students finish tests and marking is confirmed.
        </p>
      ) : (
        <ul className="space-y-4">
          {reportQuery.data.topics.map((topic) => (
            <TopicRow key={topic.topicId} topic={topic} />
          ))}
        </ul>
      )}
    </div>
  )
}
