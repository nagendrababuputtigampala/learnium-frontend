import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { itemRequest, localDateTime, selectedItems, useDefinition, useManagedBatches, usePublishDefinition, validMarks, validPublishWindow, validPublishLimits, type Definition, type PublishRequest } from '../../lib/tests'
import TestItemsEditor from './TestItemsEditor'
import ApiFailure from './ApiFailure'
import CopyCode from './CopyCode'

const inputClass = 'mt-1 block w-full rounded-lg border border-card-border bg-white p-2 text-sm'
function PublishForm({ definition, onClose }: { definition: Definition; onClose: () => void }) {
  const [items, setItems] = useState(() => selectedItems(definition.items))
  const [batchId, setBatchId] = useState('')
  const [opensAt, setOpensAt] = useState(() => localDateTime(new Date()))
  const [closesAt, setClosesAt] = useState('')
  const [minutes, setMinutes] = useState('')
  const [attempts, setAttempts] = useState('1')
  const [release, setRelease] = useState<PublishRequest['answerReleasePolicy']>('AFTER_CLOSE')
  const [integrity, setIntegrity] = useState(false)
  const [camera, setCamera] = useState(false)
  const batches = useManagedBatches(); const publish = usePublishDefinition()
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const windowValid = validPublishWindow(opensAt, closesAt)
  const invalid = batchId === '' || !windowValid || items.length === 0 || items.some(item => !validMarks(item.marks, definition.kind)) || !validPublishLimits(minutes, attempts)
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (invalid || publish.isPending) return
    publish.mutate({ id: definition.id, request: { batchId, opensAt: new Date(opensAt).toISOString(), closesAt: new Date(closesAt).toISOString(),
      ...(minutes === '' ? {} : { timeLimitSeconds: Math.round(Number(minutes) * 60) }), maxAttempts: Number(attempts), answerReleasePolicy: release,
      integrityEnabled: integrity, cameraMode: camera ? 'ON' : 'OFF', items: itemRequest(items) } })
  }
  if (publish.isSuccess) return <div className="space-y-5"><h2 className="font-display text-xl font-bold">Test published</h2><p>Share this join code with the assigned students.</p><CopyCode code={publish.data.joinCode} /><div className="flex gap-4"><Link className="font-semibold text-indigo-primary" to={`/instances/${publish.data.id}`}>View published instance</Link><button onClick={onClose}>Done</button></div></div>
  return <form className="space-y-5" onSubmit={submit}>
    <header><h2 className="font-display text-xl font-bold">Publish {definition.name}</h2><p className="mt-2 text-sm text-ink/60">Final review: these question and mark changes apply only to this publish. Your saved definition stays as it is.</p></header>
    {publish.isError && <ApiFailure error={publish.error} fallback="Could not publish this test." />}
    <TestItemsEditor gradeSubjectId={definition.gradeSubjectId} kind={definition.kind} items={items} onChange={setItems} />
    <div className="grid gap-4 rounded-xl bg-paper p-4 md:grid-cols-2">
      <label className="text-sm">Batch<select className={inputClass} value={batchId} onChange={event => setBatchId(event.target.value)}><option value="">Choose a batch you manage</option>{batches.data?.filter(batch => batch.gradeSubjectId === definition.gradeSubjectId).map(batch => <option key={batch.batchId} value={batch.batchId}>{batch.name} · {batch.studentCount} active students</option>)}</select></label>
      <p className="self-center text-sm text-ink/60">Publishing snapshots the batch's active roster. Add late joiners explicitly afterwards.</p>
      <label className="text-sm">Opens at ({timezone})<input aria-label="Opens at" className={inputClass} type="datetime-local" value={opensAt} onChange={event => setOpensAt(event.target.value)} /></label>
      <label className="text-sm">Closes at ({timezone}) · required<input aria-label="Closes at" className={inputClass} type="datetime-local" value={closesAt} onChange={event => setClosesAt(event.target.value)} /></label>
      {!windowValid && <p className="text-sm text-rose-weak">Choose a closing time after opening time.</p>}
      <label className="text-sm">Time limit (minutes, optional)<input className={inputClass} type="number" min="0.01" step="any" value={minutes} onChange={event => setMinutes(event.target.value)} /></label>
      <label className="text-sm">Maximum attempts<input className={inputClass} type="number" min="1" step="1" value={attempts} onChange={event => setAttempts(event.target.value)} /></label>
      <label className="text-sm">Release answers<select className={inputClass} value={release} onChange={event => setRelease(event.target.value as PublishRequest['answerReleasePolicy'])}><option value="AFTER_CLOSE">After close</option><option value="ON_SUBMIT">After submission</option><option value="NEVER">Never</option></select></label>
      <div className="space-y-3 self-center text-sm"><label className="flex gap-2"><input type="checkbox" checked={integrity} onChange={event => setIntegrity(event.target.checked)} />Enable integrity setting</label><label className="flex gap-2"><input type="checkbox" checked={camera} onChange={event => setCamera(event.target.checked)} />Enable camera setting</label></div>
    </div>
    {batches.isError && <ApiFailure error={batches.error} fallback="Could not load managed batches." />}
    <div className="flex gap-4"><button disabled={publish.isPending || invalid} className="rounded-full bg-indigo-primary px-5 py-2 font-semibold text-white disabled:opacity-50">Publish now</button><button type="button" disabled={publish.isPending} onClick={onClose}>Cancel publish</button></div>
  </form>
}

export default function PublishDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const query = useDefinition(id)
  return <div role="dialog" aria-label="Publish test" aria-modal="true" className="fixed inset-0 z-30 overflow-y-auto bg-ink/40 p-4 md:p-8"><div className="mx-auto max-w-6xl rounded-2xl bg-white p-5 shadow-xl md:p-7">
    {query.isPending ? <p>Loading final review…</p> : query.isError ? <><ApiFailure error={query.error} fallback="Could not load the definition for publishing." /><button onClick={onClose}>Close publish dialog</button></> : <PublishForm key={id} definition={query.data} onClose={onClose} />}
  </div></div>
}
