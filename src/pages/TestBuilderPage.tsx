import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useGradeSubjects } from '../lib/materials'
import { itemRequest, selectedItems, useDefinition, useDeleteDefinition, useSaveDefinition, validMarks, type Definition, type SelectedItem, type TestKind } from '../lib/tests'
import TestItemsEditor from '../components/tests/TestItemsEditor'
import ApiFailure from '../components/tests/ApiFailure'
import PublishDialog from '../components/tests/PublishDialog'

const inputClass = 'mt-1 block w-full rounded-lg border border-card-border bg-white p-2'
function DefinitionForm({ definition }: { definition?: Definition }) {
  const [name, setName] = useState(definition?.name ?? '')
  const [gradeSubjectId, setPairing] = useState(definition?.gradeSubjectId ?? '')
  const [kind, setKind] = useState<TestKind>(definition?.kind ?? 'SCORED_TEST')
  const [items, setItems] = useState<SelectedItem[]>(selectedItems(definition?.items ?? []))
  const [dirty, setDirty] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const catalogue = useGradeSubjects()
  const save = useSaveDefinition(); const remove = useDeleteDefinition(); const navigate = useNavigate()
  const invalid = name.trim() === '' || gradeSubjectId === '' || items.length === 0 || items.some(item => !validMarks(item.marks, kind))
  const pending = save.isPending || remove.isPending
  return <>
    <form className="space-y-6" onSubmit={event => { event.preventDefault(); save.mutate({ id: definition?.id ?? '', request: { name: name.trim(), gradeSubjectId, kind, items: itemRequest(items) } }, { onSuccess: () => navigate('/tests') }) }}>
      {save.isError && <ApiFailure error={save.error} fallback="Could not save the definition." />}
      {remove.isError && <ApiFailure error={remove.error} fallback="Could not delete the definition." />}
      <div className="grid gap-4 rounded-2xl border border-card-border bg-white p-5 md:grid-cols-3">
        <label className="text-sm font-medium">Test name<input aria-label="Test name" className={inputClass} maxLength={120} value={name} onChange={event => { setName(event.target.value); setDirty(true) }} /></label>
        <label className="text-sm font-medium">Grade and subject<select aria-label="Grade and subject" className={inputClass} value={gradeSubjectId} onChange={event => { setPairing(event.target.value); setItems([]); setDirty(true) }}>
          <option value="">Choose grade and subject</option>{catalogue.data?.map(row => <option key={row.gradeSubjectId} value={row.gradeSubjectId}>{row.label}</option>)}
        </select></label>
        <label className="text-sm font-medium">Test kind<select className={inputClass} value={kind} onChange={event => { setKind(event.target.value as TestKind); setItems([]); setDirty(true) }}><option value="SCORED_TEST">Scored test</option><option value="FLASHCARD_PRACTICE">Flashcard practice</option></select></label>
      </div>
      {catalogue.isError && <ApiFailure error={catalogue.error} fallback="Could not load grades and subjects." />}
      {gradeSubjectId !== '' ? <TestItemsEditor key={`${gradeSubjectId}:${kind}`} gradeSubjectId={gradeSubjectId} kind={kind} items={items} onChange={next => { setItems(next); setDirty(true) }} /> : <p className="text-sm text-ink/60">Choose a grade and subject to browse compatible bank questions.</p>}
      <div className="flex flex-wrap gap-3">
        <button disabled={pending || invalid} className="rounded-full bg-indigo-primary px-5 py-2 font-semibold text-white disabled:opacity-50">Save definition</button>
        {definition && <><button type="button" disabled={pending || dirty} className="rounded-full border border-indigo-primary px-5 py-2 font-semibold text-indigo-primary disabled:opacity-50" onClick={() => setPublishing(true)}>Publish saved definition</button>
          <button type="button" disabled={pending || definition.publishedInstanceCount > 0} className="rounded-full border border-rose-weak px-5 py-2 text-rose-weak disabled:opacity-50" onClick={() => setConfirmDelete(true)}>Delete definition</button></>}
      </div>
      {dirty && definition && <p className="text-sm text-ink/60">Save changes before publishing.</p>}
      {definition && definition.publishedInstanceCount > 0 && <p className="text-sm text-ink/60">Published definitions cannot be deleted. You can edit and publish them again; earlier instances stay frozen.</p>}
    </form>
    {confirmDelete && <div role="dialog" aria-label="Delete definition confirmation" className="mt-4 rounded-xl border border-rose-weak bg-white p-5"><p>Delete this unpublished definition?</p><div className="mt-3 flex gap-4"><button disabled={pending} onClick={() => remove.mutate(definition!.id, { onSuccess: () => navigate('/tests') })}>Confirm delete</button><button onClick={() => setConfirmDelete(false)}>Keep definition</button></div></div>}
    {publishing && <PublishDialog id={definition!.id} onClose={() => setPublishing(false)} />}
  </>
}

export default function TestBuilderPage() {
  const { testId = '' } = useParams()
  const query = useDefinition(testId)
  return <div className="mx-auto max-w-6xl space-y-5"><Link className="font-semibold text-indigo-primary" to="/tests">Back to My Tests</Link><h1 className="font-display text-2xl font-bold">{testId === '' ? 'Build a test' : 'Edit test definition'}</h1>
    {testId !== '' && query.isPending ? <p>Loading test definition…</p> : testId !== '' && query.isError ? <ApiFailure error={query.error} fallback="Could not load this definition." /> : <DefinitionForm key={testId} definition={query.data} />}
  </div>
}
