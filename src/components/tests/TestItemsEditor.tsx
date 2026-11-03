import { useState } from 'react'
import QuestionTypeChip from '../generation/QuestionTypeChip'
import { QUESTION_TYPE_ORDER, questionTypeInfo } from '../../lib/generation'
import { useQuestions } from '../../lib/questions'
import { totalMarks, validMarks, type SelectedItem, type TestKind } from '../../lib/tests'
import ApiFailure from './ApiFailure'

export default function TestItemsEditor({ gradeSubjectId, kind, items, onChange }: {
  gradeSubjectId: string; kind: TestKind; items: SelectedItem[]; onChange: (items: SelectedItem[]) => void
}) {
  const [page, setPage] = useState(0)
  const [type, setType] = useState('')
  const bank = useQuestions({ status: 'APPROVED', gradeSubjectId, gradeId: '', subjectId: '', topicId: '', type, difficulty: '', materialId: '' }, page)
  const compatible = QUESTION_TYPE_ORDER.filter(code => kind === 'FLASHCARD_PRACTICE' ? code === 'FLASHCARD' : code !== 'FLASHCARD')
  const rows = (bank.data?.content ?? []).filter(q => compatible.includes(q.type))
  const move = (index: number, delta: number) => { const next = [...items]; [next[index], next[index + delta]] = [next[index + delta], next[index]]; onChange(next) }
  return <div className="grid gap-6 lg:grid-cols-2">
    <section className="space-y-3 rounded-2xl border border-card-border bg-paper p-5" aria-label="Approved bank picker">
      <h2 className="font-display text-lg font-bold">Add from the bank</h2>
      <p className="text-sm text-ink/60">Approved questions for the selected grade, subject and kind.</p>
      <label className="block text-sm">Bank question type<select className="mt-1 block w-full rounded-lg border border-card-border bg-white p-2" value={type} onChange={event => { setType(event.target.value); setPage(0) }}>
        <option value="">All compatible types</option>{compatible.map(code => <option key={code} value={code}>{questionTypeInfo(code).label}</option>)}
      </select></label>
      {bank.isPending ? <p>Loading bank questions…</p> : bank.isError ? <ApiFailure error={bank.error} fallback="Could not load bank questions." /> : <>
        {rows.length === 0 && <p>No compatible questions on this page.</p>}
        {rows.map(q => <article key={q.questionId} className="rounded-xl border border-card-border bg-white p-3">
          <QuestionTypeChip type={q.type} /><p className="my-2 text-sm">{q.stemPreview}</p>
          <button type="button" className="text-sm font-semibold text-indigo-primary" disabled={items.some(item => item.questionId === q.questionId) || items.length >= 200} onClick={() => onChange([...items, { questionId: q.questionId, type: q.type, preview: q.stemPreview, marks: kind === 'SCORED_TEST' ? '1.00' : '0.00' }])}>Add question: {q.stemPreview}</button>
        </article>)}
        <nav className="flex items-center gap-3 text-sm" aria-label="Bank picker pages"><button type="button" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous bank page</button><span>Bank page {page + 1}</span><button type="button" disabled={page + 1 >= bank.data.totalPages} onClick={() => setPage(page + 1)}>Next bank page</button></nav>
      </>}
    </section>
    <section className="space-y-3" aria-label="Selected questions">
      <h2 className="font-display text-lg font-bold">Selected questions ({items.length})</h2>
      {items.length === 0 && <p className="text-sm text-ink/60">Add questions to start building your test.</p>}
      <ol className="space-y-3">{items.map((item, index) => <li key={item.questionId} className="rounded-xl border border-card-border bg-white p-4">
        <QuestionTypeChip type={item.type} /><p className="my-2 text-sm font-medium">{index + 1}. {item.preview}</p>
        {kind === 'SCORED_TEST' ? <label className="block text-sm">Marks for question {index + 1}<input aria-label={`Marks for question ${index + 1}`} aria-invalid={!validMarks(item.marks, kind)} className="ml-3 w-28 rounded-lg border border-card-border p-2" type="number" min="0.01" max="9999.99" step="0.01" value={item.marks} onChange={event => onChange(items.map((old, i) => i === index ? { ...old, marks: event.target.value } : old))} />
          {!validMarks(item.marks, kind) && <span className="mt-1 block text-rose-weak">Use positive marks with up to two decimal places.</span>}
        </label> : <p className="text-sm text-ink/60">Unscored practice</p>}
        <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-indigo-primary">
          <button type="button" aria-label={`Move question ${index + 1} up`} disabled={index === 0} onClick={() => move(index, -1)}>Move up</button>
          <button type="button" aria-label={`Move question ${index + 1} down`} disabled={index === items.length - 1} onClick={() => move(index, 1)}>Move down</button>
          <button type="button" aria-label={`Remove question ${index + 1}`} onClick={() => onChange(items.filter((_, i) => i !== index))}>Remove</button>
        </div>
      </li>)}</ol>
      <p className="font-semibold" aria-live="polite">Total marks: {totalMarks(items).toFixed(2)}</p>
    </section>
  </div>
}
