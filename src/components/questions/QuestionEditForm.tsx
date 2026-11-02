import { useId, useState, type FormEvent } from 'react'
import type { Question, QuestionEdit } from '../../lib/questions'
import { useCreateTopic, useTopics } from '../../lib/generation'
import { getApiErrorMessage } from '../../lib/api'
import { rubricTotal, validateQuestionContent, type Criterion, type QuestionFieldErrors } from '../../lib/questionValidation'

const inputClass = 'mt-1 block w-full rounded-lg border border-card-border p-2 text-sm focus:border-indigo-primary'

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
  if (question.type === 'NUMERIC') {
    content.tolerance ??= 0
    content.unit ??= ''
  }
  if (question.type === 'FILL_BLANK' && !content.stemWithBlank) content.stemWithBlank = content.stem
  return content
}

export default function QuestionEditForm({ question, pending, dirty, serverErrors = {}, onSave, onDirty, onApprove }: {
  question: Question; pending: boolean; dirty: boolean; serverErrors?: QuestionFieldErrors
  onSave: (edit: QuestionEdit) => void; onDirty: (dirty: boolean) => void; onApprove: () => void
}) {
  const [content, setContent] = useState(() => initialContent(question))
  const [topicId, setTopicId] = useState(question.topicId)
  const [difficulty, setDifficulty] = useState(question.difficulty)
  const [newTopic, setNewTopic] = useState('')
  const [addedTopic, setAddedTopic] = useState<{ topicId: string; name: string } | null>(null)
  const topics = useTopics(question.gradeSubjectId)
  const createTopic = useCreateTopic()
  const formId = useId()
  const clientErrors = validateQuestionContent(question.type, content)
  const errors = { ...clientErrors, ...serverErrors }
  const hasErrors = Object.keys(errors).length > 0
  const set = (field: string, value: unknown) => { onDirty(true); setContent(old => ({ ...old, [field]: value, ...(field === 'rubric' ? { maxScore: rubricTotal(value as Criterion[]) } : {}) })) }
  const errorId = (field: string) => `${formId}-${field}`
  const error = (field: string) => errors[field] && <span id={errorId(field)} className="mt-1 block text-sm text-rose-weak">{errors[field]}</span>
  const fieldProps = (field: string) => ({ 'aria-invalid': Boolean(errors[field]), 'aria-describedby': errorId(field) })
  const text = (field: string, label: string, multiline = true) => (
    <label className="block text-sm font-medium" key={field}>
      {label}
      {multiline
        ? <textarea aria-label={label} {...fieldProps(`content.${field}`)} className={inputClass} value={String(content[field] ?? '')} onChange={event => set(field, event.target.value)} rows={3} />
        : <input aria-label={label} {...fieldProps(`content.${field}`)} className={inputClass} value={String(content[field] ?? '')} onChange={event => set(field, event.target.value)} />}
      {error(`content.${field}`)}
    </label>
  )
  const numeric = (field: string, label: string) => (
    <label className="block text-sm font-medium">{label}
      <input aria-label={label} {...fieldProps(`content.${field}`)} className={inputClass} type="number" step="any" value={String(content[field] ?? '')} onChange={event => set(field, event.target.value === '' ? null : Number(event.target.value))} />
      {error(`content.${field}`)}
    </label>
  )
  const rubric = content.rubric as Criterion[]
  const options = content.options as { id: string; text: string }[]
  const submit = (event: FormEvent) => {
    event.preventDefault()
    const savedContent = question.type === 'WRITTEN' ? { ...content, maxScore: rubricTotal(rubric) } : content
    onSave({ revision: question.revision, topicId, difficulty, content: savedContent })
  }
  const topicOptions = [...(topics.data ?? []), ...(addedTopic ? [addedTopic] : [])]
  const uniqueTopics = [...new Map(topicOptions.map(topic => [topic.topicId, topic])).values()]
  return (
    <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border border-card-border bg-white p-6">
      <p className="text-sm text-ink/60">{question.gradeName} · {question.subjectName} · Question type is fixed.</p>
      <label className="block text-sm font-medium">Topic
        <select aria-label="Topic" {...fieldProps('topicId')} className={inputClass} value={topicId} onChange={event => { onDirty(true); setTopicId(event.target.value) }}>
          <option value={question.topicId}>{question.topicName}</option>
          {uniqueTopics.filter(topic => topic.topicId !== question.topicId).map(topic => <option key={topic.topicId} value={topic.topicId}>{topic.name}</option>)}
        </select>{error('topicId')}
      </label>
      {topics.isError && <p role="alert">Other topics could not be loaded. You can keep the current topic.</p>}
      <div className="rounded-lg bg-paper p-3">
        <label className="block text-sm">New topic<input className={inputClass} value={newTopic} onChange={event => setNewTopic(event.target.value)} maxLength={200} /></label>
        <button type="button" disabled={newTopic.trim() === '' || createTopic.isPending} onClick={() => createTopic.mutate({ gradeSubjectId: question.gradeSubjectId, name: newTopic.trim() }, { onSuccess: topic => { setAddedTopic(topic); setTopicId(topic.topicId); setNewTopic(''); onDirty(true) } })}>Add topic</button>
        {createTopic.isError && <p role="alert">{getApiErrorMessage(createTopic.error, 'Could not add the topic.')}</p>}
      </div>
      <label className="block text-sm font-medium">Difficulty
        <select aria-label="Difficulty" {...fieldProps('difficulty')} className={inputClass} value={difficulty} onChange={event => { onDirty(true); setDifficulty(Number(event.target.value)) }}>
          {[1, 2, 3, 4, 5].map(value => <option key={value} value={value}>{value}</option>)}
        </select>{error('difficulty')}
      </label>
      {['MCQ', 'NUMERIC', 'WRITTEN'].includes(question.type) && text('stem', 'Question')}
      {question.type === 'MCQ' && <fieldset aria-describedby={errorId('content.options')}>
        <legend className="font-semibold">Options and correct answer</legend>
        {options.map((option, index) => <div key={option.id} className="mt-3">
          <label className="block text-sm font-medium">Option {index + 1}
            <input {...fieldProps('content.options')} className={inputClass} value={option.text} onChange={event => set('options', options.map((old, i) => i === index ? { ...old, text: event.target.value } : old))} />
          </label>
          <label className="mt-1 flex items-center gap-2 text-sm"><input {...fieldProps('content.correctIndex')} type="radio" name={`${formId}-correct`} checked={content.correctIndex === index} onChange={() => set('correctIndex', index)} />Option {index + 1} is correct</label>
        </div>)}
        {error('content.options')}{error('content.correctIndex')}
      </fieldset>}
      {question.type === 'FILL_BLANK' && <>{text('stemWithBlank', 'Question with one _____ blank')}{text('answer', 'Answer', false)}</>}
      {question.type === 'FLASHCARD' && <>{text('front', 'Front')}{text('back', 'Back')}</>}
      {question.type === 'NUMERIC' && <>{numeric('answerValue', 'Numeric answer')}{numeric('tolerance', 'Absolute tolerance')}{text('unit', 'Unit', false)}{text('workedSolution', 'Worked solution')}</>}
      {question.type === 'WRITTEN' && <>
        {text('modelAnswer', 'Model answer')}
        <fieldset className="space-y-3" aria-describedby={errorId('content.rubric')}><legend className="font-semibold">Marking rubric (3–5 criteria)</legend>
          {rubric.map((entry, index) => <div className="rounded-lg border border-card-border p-3" key={index}>
            <label className="block text-sm">Criterion {index + 1}<textarea {...fieldProps('content.rubric')} className={inputClass} value={entry.criterion} onChange={event => set('rubric', rubric.map((old, i) => i === index ? { ...old, criterion: event.target.value } : old))} /></label>
            <label className="block text-sm">Maximum score {index + 1}<input {...fieldProps('content.rubric')} className={inputClass} type="number" step="any" value={entry.maxScore} onChange={event => set('rubric', rubric.map((old, i) => i === index ? { ...old, maxScore: Number(event.target.value) } : old))} /></label>
            <button type="button" className="mt-2 text-sm text-rose-weak" disabled={rubric.length <= 3} onClick={() => set('rubric', rubric.filter((_, i) => i !== index))}>Remove criterion {index + 1}</button>
          </div>)}
          <button type="button" disabled={rubric.length >= 5} onClick={() => set('rubric', [...rubric, { criterion: '', maxScore: 1 }])}>Add criterion</button>
          <p aria-live="polite">Rubric total: {rubricTotal(rubric)} / 100 points</p>{error('content.rubric')}{error('content.maxScore')}
        </fieldset>
      </>}
      {error('content')}
      <div className="flex flex-wrap gap-3">
        <button className="rounded-full bg-indigo-primary px-5 py-2 font-semibold text-white disabled:opacity-50" disabled={pending}>Save draft</button>
        <button type="button" disabled={pending || dirty || hasErrors} aria-describedby={`${formId}-approve-hint`} className="rounded-full bg-emerald-progress px-5 py-2 font-semibold text-white disabled:opacity-50" onClick={onApprove}>Approve saved draft</button>
      </div>
      <p id={`${formId}-approve-hint`} className="text-sm text-ink/60">{hasErrors ? 'Fix the highlighted fields and save before approving.' : dirty ? 'Save your changes before approving.' : 'The saved draft is ready for approval.'}</p>
    </form>
  )
}
