import { useState, type FormEvent } from 'react'
import type { Question, QuestionEdit } from '../../lib/questions'
import { useTopics } from '../../lib/generation'

const inputClass = 'mt-1 block w-full rounded-lg border border-card-border p-2 text-sm focus:border-indigo-primary'
interface Criterion { id?: string; criterion: string; maxScore: number }

export function initialContent(question: Question): Record<string, unknown> {
  const content = { ...(question.payload as Record<string, unknown>) }
  if (question.type === 'MCQ') {
    const options = Array.isArray(content.options) ? content.options as { id: string; text: string }[] : []
    content.correctIndex = options.findIndex(option => option.id === question.correctRef)
    content.options = ['a', 'b', 'c', 'd'].map((id, index) => ({ id, text: options[index]?.text ?? '' }))
  }
  if (question.type === 'WRITTEN' && !Array.isArray(content.rubric)) {
    content.rubric = Array.from({ length: 3 }, () => ({ criterion: '', maxScore: 1 }))
  }
  return content
}

export default function QuestionEditForm({ question, pending, onSave, onDirty }: {
  question: Question; pending: boolean; onSave: (edit: QuestionEdit) => void; onDirty: (dirty: boolean) => void
}) {
  const [content, setContent] = useState(() => initialContent(question))
  const [topicId, setTopicId] = useState(question.topicId)
  const [difficulty, setDifficulty] = useState(question.difficulty)
  const topics = useTopics(question.gradeSubjectId)
  const set = (field: string, value: unknown) => { onDirty(true); setContent(old => ({ ...old, [field]: value })) }
  const text = (field: string, label: string, multiline = true) => (
    <label className="block text-sm font-medium" key={field}>
      {label}
      {multiline
        ? <textarea className={inputClass} value={String(content[field] ?? '')} onChange={event => set(field, event.target.value)} rows={3} />
        : <input className={inputClass} value={String(content[field] ?? '')} onChange={event => set(field, event.target.value)} />}
    </label>
  )
  const numeric = (field: string, label: string) => (
    <label className="block text-sm font-medium">{label}
      <input className={inputClass} type="number" step="any" value={String(content[field] ?? '')} onChange={event => set(field, event.target.value === '' ? null : Number(event.target.value))} />
    </label>
  )
  const rubric = content.rubric as Criterion[]
  const options = content.options as { id: string; text: string }[]
  const submit = (event: FormEvent) => {
    event.preventDefault()
    onSave({ revision: question.revision, topicId, difficulty, content })
  }
  return (
    <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border border-card-border bg-white p-6">
      <p className="text-sm text-ink/60">{question.gradeName} · {question.subjectName} · Question type is fixed. The server validates every save.</p>
      <label className="block text-sm font-medium">Topic
        <select className={inputClass} value={topicId} onChange={event => { onDirty(true); setTopicId(event.target.value) }}>
          <option value={question.topicId}>{question.topicName}</option>
          {topics.data?.filter(topic => topic.topicId !== question.topicId).map(topic => <option key={topic.topicId} value={topic.topicId}>{topic.name}</option>)}
        </select>
      </label>
      {topics.isError && <p role="alert">Other topics could not be loaded. You can keep the current topic.</p>}
      <label className="block text-sm font-medium">Difficulty
        <select className={inputClass} value={difficulty} onChange={event => { onDirty(true); setDifficulty(Number(event.target.value)) }}>
          {[1, 2, 3, 4, 5].map(value => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
      {['MCQ', 'NUMERIC', 'WRITTEN'].includes(question.type) && text('stem', 'Question')}
      {question.type === 'MCQ' && <>
        {options.map((option, index) => <label className="block text-sm font-medium" key={option.id}>Option {index + 1}
          <input className={inputClass} value={option.text} onChange={event => set('options', options.map((old, i) => i === index ? { ...old, text: event.target.value } : old))} />
        </label>)}
        <label className="block text-sm font-medium">Correct answer
          <select className={inputClass} value={Number(content.correctIndex)} onChange={event => set('correctIndex', Number(event.target.value))}>
            <option value={-1}>Choose the correct option</option>
            {options.map((option, index) => <option key={option.id} value={index}>Option {index + 1}</option>)}
          </select>
        </label>
      </>}
      {question.type === 'FILL_BLANK' && <>{text('stemWithBlank', 'Question with one _____ blank')}{text('answer', 'Answer', false)}</>}
      {question.type === 'FLASHCARD' && <>{text('front', 'Front')}{text('back', 'Back')}</>}
      {question.type === 'NUMERIC' && <>{numeric('answerValue', 'Numeric answer')}{numeric('tolerance', 'Absolute tolerance')}{text('unit', 'Unit', false)}{text('workedSolution', 'Worked solution')}</>}
      {question.type === 'WRITTEN' && <>
        {text('modelAnswer', 'Model answer')}
        <fieldset className="space-y-3"><legend className="font-semibold">Marking rubric (3–5 criteria)</legend>
          {rubric.map((entry, index) => <div className="rounded-lg border border-card-border p-3" key={index}>
            <label className="block text-sm">Criterion {index + 1}<textarea className={inputClass} value={entry.criterion} onChange={event => set('rubric', rubric.map((old, i) => i === index ? { ...old, criterion: event.target.value } : old))} /></label>
            <label className="block text-sm">Maximum score {index + 1}<input className={inputClass} type="number" step="any" value={entry.maxScore} onChange={event => set('rubric', rubric.map((old, i) => i === index ? { ...old, maxScore: Number(event.target.value) } : old))} /></label>
            <button type="button" className="mt-2 text-sm text-rose-weak" disabled={rubric.length <= 3} onClick={() => set('rubric', rubric.filter((_, i) => i !== index))}>Remove criterion {index + 1}</button>
          </div>)}
          <button type="button" disabled={rubric.length >= 5} onClick={() => set('rubric', [...rubric, { criterion: '', maxScore: 1 }])}>Add criterion</button>
        </fieldset>
      </>}
      <button className="rounded-full bg-indigo-primary px-5 py-2 font-semibold text-white disabled:opacity-50" disabled={pending}>Save draft</button>
    </form>
  )
}
