import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { selectedItems, useInstance, useInstanceAction, useInstanceRoster, useInstances, useManagedBatches, type Instance } from '../lib/tests'
import ApiFailure from '../components/tests/ApiFailure'
import CopyCode from '../components/tests/CopyCode'
import QuestionTypeChip from '../components/generation/QuestionTypeChip'

function StudentsDrawer({ instance }: { instance: Instance }) {
  const roster = useInstanceRoster(instance.batchId)
  const action = useInstanceAction()
  const [userId, setUserId] = useState('')
  const eligible = (roster.data ?? []).filter(student => student.status === 'ACTIVE' && !instance.students.some(assigned => assigned.userId === student.userId))
  const closed = instance.status === 'CLOSED'
  return <aside role="dialog" aria-label="Instance students and frozen questions" className="fixed inset-y-0 right-0 z-20 w-full max-w-xl overflow-y-auto border-l border-card-border bg-white p-6 shadow-xl">
    <Link className="font-semibold text-indigo-primary" to="/instances">Close instance details</Link>
    <h2 className="mt-5 font-display text-xl font-bold">{instance.name}</h2><p className="mt-1 text-sm text-ink/60">{instance.batchName} · {{ SCHEDULED: 'Scheduled', OPEN: 'Open', CLOSED: 'Closed' }[instance.status]}</p>
    <div className="mt-4"><CopyCode key={instance.joinCode} code={instance.joinCode} /></div>
    <section className="mt-6 space-y-3"><h3 className="font-display text-lg font-bold">Assigned students ({instance.students.length})</h3>
      <ul className="space-y-2">{instance.students.map(student => <li className="rounded-lg bg-paper p-3 text-sm" key={student.userId}>{student.name}</li>)}</ul>
      {instance.students.length === 0 && <p>No students are assigned to this instance.</p>}
      <label className="block text-sm font-medium">Late joiner<select className="mt-1 block w-full rounded-lg border border-card-border p-2" disabled={closed || roster.isPending} value={userId} onChange={event => setUserId(event.target.value)}><option value="">Choose an active, unassigned roster student</option>{eligible.map(student => <option value={student.userId} key={student.userId}>{student.fullName}</option>)}</select></label>
      {closed ? <p className="text-sm text-ink/60">This instance is closed. Students cannot be added.</p> : roster.isPending ? <p>Loading batch roster…</p> : eligible.length === 0 && <p className="text-sm text-ink/60">No active unassigned students on this batch roster.</p>}
      {roster.isError && <ApiFailure error={roster.error} fallback="Could not load the batch roster." />}
      {action.isError && <ApiFailure error={action.error} fallback="Could not add this student." />}
      <button className="rounded-full bg-indigo-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={closed || userId === '' || action.isPending} onClick={() => action.mutate({ id: instance.id, action: 'students', userId }, { onSuccess: () => setUserId('') })}>Add student to instance</button>
    </section>
    <section className="mt-8 space-y-3"><h3 className="font-display text-lg font-bold">Frozen questions</h3><p className="text-sm text-ink/60">These items and marks belong to this published instance.</p>
      <ol className="space-y-3">{selectedItems(instance.items).map((item, index) => <li className="rounded-xl border border-card-border p-4" key={item.questionId}><QuestionTypeChip type={item.type} /><p className="mt-2 text-sm">{index + 1}. {item.preview}</p><p className="mt-1 text-sm font-semibold">{item.marks} marks</p></li>)}</ol>
    </section>
  </aside>
}

export default function InstancesPage() {
  const { instanceId = '' } = useParams()
  const [batchId, setBatchId] = useState('')
  const [confirm, setConfirm] = useState<{ instance: Instance; action: 'close' | 'regenerate-code' } | null>(null)
  const query = useInstances(batchId); const batches = useManagedBatches(); const detail = useInstance(instanceId); const action = useInstanceAction()
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  return <div className="mx-auto max-w-6xl space-y-6">
    <header><h1 className="font-display text-2xl font-bold">Published instances</h1><p className="mt-2 text-sm text-ink/60">Manage tests for your currently assigned batches. Times shown in {timezone}.</p></header>
    <label className="block max-w-md text-sm font-medium">Filter by batch<select className="mt-1 block w-full rounded-lg border border-card-border bg-white p-2" value={batchId} onChange={event => setBatchId(event.target.value)}><option value="">All managed batches</option>{batches.data?.map(batch => <option key={batch.batchId} value={batch.batchId}>{batch.name}</option>)}</select></label>
    {batches.isError && <ApiFailure error={batches.error} fallback="Could not load managed batches." />}
    {action.isError && <ApiFailure error={action.error} fallback="Could not update this instance." />}
    {query.isPending ? <p>Loading instances…</p> : query.isError ? <ApiFailure error={query.error} fallback="Could not load instances." /> : query.data.length === 0 ? <p className="rounded-xl border border-card-border bg-white p-6">No published instances for these batches.</p> : <div className="grid gap-5 md:grid-cols-2">{query.data.map(instance => <article className="space-y-3 rounded-2xl border border-card-border bg-white p-5 shadow-sm" key={instance.id}>
      <div className="flex items-start justify-between gap-3"><h2 className="font-display text-lg font-bold">{instance.name}</h2><span className="rounded-full bg-paper px-3 py-1 text-xs font-semibold">{{ SCHEDULED: 'Scheduled', OPEN: 'Open', CLOSED: 'Closed' }[instance.status]}</span></div>
      <p className="text-sm font-semibold">{instance.batchName}</p><p className="text-sm text-ink/60"><time dateTime={instance.opensAt}>{new Date(instance.opensAt).toLocaleString()}</time> — <time dateTime={instance.closesAt}>{new Date(instance.closesAt).toLocaleString()}</time></p>
      <CopyCode key={instance.joinCode} code={instance.joinCode} />
      <div className="flex flex-wrap gap-4 text-sm font-semibold text-indigo-primary"><button onClick={() => setConfirm({ instance, action: 'regenerate-code' })}>Regenerate code</button><button disabled={instance.status === 'CLOSED'} onClick={() => setConfirm({ instance, action: 'close' })}>Close early</button><Link to={`/instances/${instance.id}`}>Students and questions</Link></div>
    </article>)}</div>}
    {confirm && <div role="dialog" aria-label="Confirm instance action" className="fixed inset-0 z-30 flex items-center justify-center bg-ink/40 p-4"><div className="max-w-md space-y-4 rounded-2xl bg-white p-6"><h2 className="font-display text-lg font-bold">{confirm.action === 'close' ? 'Close this instance early?' : 'Regenerate the join code?'}</h2><p className="text-sm">{confirm.action === 'close' ? 'Students will no longer be able to start this instance.' : 'The old code will stop working immediately.'}</p><div className="flex gap-4"><button disabled={action.isPending} className="font-semibold text-indigo-primary" onClick={() => action.mutate({ id: confirm.instance.id, action: confirm.action }, { onSuccess: () => setConfirm(null) })}>Confirm action</button><button disabled={action.isPending} onClick={() => setConfirm(null)}>Cancel action</button></div></div></div>}
    {instanceId !== '' && (detail.isPending ? <p>Loading instance details…</p> : detail.isError ? <ApiFailure error={detail.error} fallback="Could not load this instance." /> : <StudentsDrawer key={detail.data.id} instance={detail.data} />)}
  </div>
}
