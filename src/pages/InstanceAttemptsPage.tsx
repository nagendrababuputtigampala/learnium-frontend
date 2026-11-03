import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ApiFailure from '../components/tests/ApiFailure'
import {
  fetchSnapshotObjectUrl,
  useAttemptSnapshots,
  useAttemptTimeline,
  useInstanceAttempts,
  useInvalidateAttempt,
  type InstanceAttempt,
  type SnapshotItem,
} from '../lib/proctor'

const FLAG_LABELS: Record<string, string> = {
  TAB_HIDDEN: 'Tab hidden',
  FOCUS_LOST: 'Focus lost',
  MOUSE_LEFT: 'Mouse left',
  FULLSCREEN_EXIT: 'Fullscreen exit',
  CAMERA_LOST: 'Camera lost',
}

function SnapshotThumb({ attemptId, snapshot, onSelect }: { attemptId: string; snapshot: SnapshotItem; onSelect: () => void }) {
  const [url, setUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let live = true
    let objectUrl: string | null = null
    fetchSnapshotObjectUrl(attemptId, snapshot.snapshotId)
      .then((result) => {
        objectUrl = result
        if (live) setUrl(result)
        else URL.revokeObjectURL(result)
      })
      .catch(() => {
        if (live) setFailed(true)
      })
    return () => {
      live = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [attemptId, snapshot.snapshotId])
  if (failed) return <p className="text-xs text-rose-weak">Snapshot unavailable</p>
  if (!url) return <p className="text-xs text-ink/55">Loading snapshot…</p>
  return (
    <button type="button" onClick={onSelect} className="block overflow-hidden rounded-lg border border-card-border">
      <img src={url} alt={`${snapshot.reason} snapshot`} className="h-20 w-32 object-cover" />
    </button>
  )
}

function SnapshotLightbox({ attemptId, snapshot, onClose }: { attemptId: string; snapshot: SnapshotItem; onClose: () => void }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let live = true
    let objectUrl: string | null = null
    fetchSnapshotObjectUrl(attemptId, snapshot.snapshotId)
      .then((result) => {
        objectUrl = result
        if (live) setUrl(result)
        else URL.revokeObjectURL(result)
      })
      .catch(() => undefined)
    return () => {
      live = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [attemptId, snapshot.snapshotId])
  return (
    <div role="dialog" aria-label="Snapshot viewer" className="fixed inset-0 z-30 flex items-center justify-center bg-ink/50 p-4" onClick={onClose}>
      <div className="max-w-2xl rounded-2xl bg-white p-5" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between gap-4">
          <h3 className="font-display text-lg font-bold">{snapshot.reason} · {new Date(snapshot.capturedAt).toLocaleString()}</h3>
          <button type="button" onClick={onClose} className="font-semibold text-indigo-primary">Close</button>
        </div>
        {url ? <img src={url} alt={`${snapshot.reason} snapshot`} className="mt-4 w-full rounded-xl" /> : <p className="mt-4 text-sm text-ink/60">Loading snapshot…</p>}
      </div>
    </div>
  )
}

function AttemptDetail({ attempt }: { attempt: InstanceAttempt }) {
  const timeline = useAttemptTimeline(attempt.attemptId, true)
  const snapshots = useAttemptSnapshots(attempt.attemptId, true)
  const [selected, setSelected] = useState<SnapshotItem | null>(null)
  return (
    <div className="mt-4 grid gap-6 md:grid-cols-2">
      <section>
        <h4 className="font-display font-bold">Integrity timeline</h4>
        {timeline.isPending ? <p className="mt-2 text-sm text-ink/60">Loading timeline…</p> : timeline.isError ? <ApiFailure error={timeline.error} fallback="Could not load the timeline." /> : timeline.data.length === 0 ? <p className="mt-2 text-sm text-ink/60">No integrity flags recorded.</p> : (
          <ul className="mt-2 space-y-1 text-sm">
            {timeline.data.map((event) => (
              <li key={event.eventId} className="flex justify-between gap-3 rounded-lg bg-paper px-3 py-2">
                <span className="font-semibold">{FLAG_LABELS[event.type] ?? event.type}</span>
                <time dateTime={event.occurredAt}>{new Date(event.occurredAt).toLocaleString()}</time>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h4 className="font-display font-bold">Camera snapshots</h4>
        {snapshots.isPending ? <p className="mt-2 text-sm text-ink/60">Loading snapshots…</p> : snapshots.isError ? <ApiFailure error={snapshots.error} fallback="Could not load snapshots." /> : snapshots.data.length === 0 ? <p className="mt-2 text-sm text-ink/60">No snapshots for this attempt.</p> : (
          <>
            <p className="mt-1 text-xs text-ink/55">Snapshots are deleted automatically after 30 days.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {snapshots.data.map((snapshot) => (
                <div key={snapshot.snapshotId}>
                  <SnapshotThumb attemptId={attempt.attemptId} snapshot={snapshot} onSelect={() => setSelected(snapshot)} />
                  <p className="mt-1 text-center text-xs text-ink/55">{snapshot.reason}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
      {selected && <SnapshotLightbox attemptId={attempt.attemptId} snapshot={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

export default function InstanceAttemptsPage() {
  const { instanceId = '' } = useParams()
  const attempts = useInstanceAttempts(instanceId)
  const invalidate = useInvalidateAttempt(instanceId)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <Link className="font-semibold text-indigo-primary" to="/instances">Back to instances</Link>
        <h1 className="mt-2 font-display text-2xl font-bold">Attempts</h1>
        <p className="mt-1 text-sm text-ink/60">Scores, integrity flags and camera snapshots for this published test. Invalidating an attempt removes it from results, dashboards and the marking queue.</p>
      </header>
      {invalidate.isError && <ApiFailure error={invalidate.error} fallback="Could not invalidate this attempt." />}
      {attempts.isPending ? <p>Loading attempts…</p> : attempts.isError ? <ApiFailure error={attempts.error} fallback="Could not load attempts for this instance." /> : attempts.data.length === 0 ? <p className="rounded-xl border border-card-border bg-white p-6">No student has started this test yet.</p> : (
        <ul className="space-y-4">
          {attempts.data.map((attempt) => (
            <li key={attempt.attemptId} className="rounded-2xl border border-card-border bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-44">
                  <p className="font-semibold">{attempt.displayName}</p>
                  <p className="text-xs text-ink/55">{attempt.username ?? ''} · Attempt {attempt.attemptNo}</p>
                </div>
                <span className="rounded-full bg-paper px-3 py-1 text-xs font-semibold">{attempt.status.replace('_', ' ')}</span>
                <span className="text-sm font-semibold">{attempt.score === null ? 'Not submitted' : `Score ${attempt.score} / ${attempt.maxScore}`}</span>
                {attempt.markingPending && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">Marking pending</span>}
                {attempt.flagTotal > 0 ? (
                  <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-800">{attempt.flagTotal} flag{attempt.flagTotal === 1 ? '' : 's'}: {Object.entries(attempt.flags).map(([type, count]) => `${FLAG_LABELS[type] ?? type} ×${count}`).join(', ')}</span>
                ) : (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">No flags</span>
                )}
                <span className="ml-auto flex gap-3 text-sm font-semibold text-indigo-primary">
                  <button type="button" onClick={() => setExpandedId(expandedId === attempt.attemptId ? null : attempt.attemptId)}>{expandedId === attempt.attemptId ? 'Hide details' : 'Flags & snapshots'}</button>
                  {attempt.status !== 'INVALIDATED' && (confirmId === attempt.attemptId ? (
                    <>
                      <button type="button" disabled={invalidate.isPending} onClick={() => invalidate.mutate(attempt.attemptId, { onSuccess: () => setConfirmId(null) })} className="text-rose-700">Confirm invalidate</button>
                      <button type="button" onClick={() => setConfirmId(null)}>Cancel</button>
                    </>
                  ) : (
                    <button type="button" onClick={() => setConfirmId(attempt.attemptId)} className="text-rose-700">Invalidate</button>
                  ))}
                </span>
              </div>
              {expandedId === attempt.attemptId && <AttemptDetail attempt={attempt} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
