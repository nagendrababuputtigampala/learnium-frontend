import { Link } from 'react-router-dom'
import ApiFailure from '../components/tests/ApiFailure'
import { useMarkingQueue } from '../lib/marking'

const stateLabel = {
  READY: 'AI suggestion ready',
  MARKING: 'AI marking in progress',
  FAILED: 'AI marking failed',
  NONE: 'Manual marking',
} as const

export default function MarkingQueuePage() {
  const queue = useMarkingQueue()
  return <div className="mx-auto max-w-6xl space-y-6">
    <header><h1 className="font-display text-2xl font-bold">Marking queue</h1><p className="mt-2 text-sm text-ink/60">Review written answers for your managed batches and confirm the final mark.</p></header>
    {queue.isPending ? <p>Loading marking queue…</p> : queue.isError ? <ApiFailure error={queue.error} fallback="Could not load the marking queue." /> : queue.data.length === 0 ? <p className="rounded-2xl border border-card-border bg-white p-8">Nothing is waiting to be marked.</p> : <div className="space-y-5">
      {queue.data.map(group => <section className="rounded-2xl border border-card-border bg-white p-5 shadow-sm" key={group.instanceId}>
        <h2 className="font-display text-lg font-bold">{group.testName}</h2><p className="mt-1 text-sm text-ink/60">{group.batchName} · {group.items.length} written {group.items.length === 1 ? 'answer' : 'answers'}</p>
        <ul className="mt-4 divide-y divide-card-border">{group.items.map(item => <li className="flex flex-wrap items-center justify-between gap-4 py-4" key={item.questionAttemptId}>
          <div><p className="font-semibold">{item.studentName}</p><p className="mt-1 text-sm text-ink/60">Submitted <time dateTime={item.submittedAt}>{new Date(item.submittedAt).toLocaleString()}</time> · {item.marks.toFixed(2)} marks</p></div>
          <div className="flex items-center gap-4"><span className="rounded-full bg-indigo-tint px-3 py-1 text-xs font-semibold text-indigo-primary">{stateLabel[item.suggestionState]}</span><Link className="font-semibold text-indigo-primary" to={`/marking/${item.questionAttemptId}`}>Review answer</Link></div>
        </li>)}</ul>
      </section>)}
    </div>}
  </div>
}
