import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getApiErrorMessage } from '../lib/api'
import { QUESTION_TYPE_ORDER } from '../lib/generation'
import { useGradeSubjects } from '../lib/materials'
import { useTopics, questionTypeInfo } from '../lib/generation'
import { useQuestionAction, useQuestions, type Question, type QuestionFilters, type QuestionSummary } from '../lib/questions'
import DraftQuestionCard from '../components/generation/DraftQuestionCard'
import QuestionTypeChip from '../components/generation/QuestionTypeChip'

export function QuestionPreview({ question }: { question: Question }) {
  return <DraftQuestionCard question={{ ...question, provider: String(question.provider), model: String(question.model), promptVersion: String(question.promptVersion) }} showProvenance={false} />
}

export default function QuestionsPage({ bank = false }: { bank?: boolean }) {
  const [search] = useSearchParams()
  const navigate = useNavigate()
  const action = useQuestionAction()
  const [filters, setFilters] = useState<QuestionFilters>({ status: bank ? 'APPROVED' : 'DRAFT', gradeId: '', subjectId: '', topicId: '', type: '', difficulty: '', materialId: search.get('materialId') ?? '' })
  const [page, setPage] = useState(0)
  const query = useQuestions(filters, page)
  const grades = useGradeSubjects()
  const pairingId = grades.data?.find(row => row.gradeId === filters.gradeId && row.subjectId === filters.subjectId)?.gradeSubjectId ?? ''
  const topics = useTopics(pairingId)
  const gradeOptions = [...new Map((grades.data ?? []).map(row => [row.gradeId, row.gradeName] as const))]
  const subjectOptions = [...new Map((grades.data ?? []).map(row => [row.subjectId, row.subjectName] as const))]
  const update = (key: keyof QuestionFilters, value: string) => {
    setFilters(old => ({ ...old, [key]: value, ...(key === 'gradeId' || key === 'subjectId' ? { topicId: '' } : {}) }))
    setPage(0)
  }
  const rows = query.data?.content ?? []
  const groups = new Map<string, QuestionSummary[]>()
  for (const question of rows) {
    const key = bank ? 'bank' : question.materialId ?? 'forks'
    groups.set(key, [...(groups.get(key) ?? []), question])
  }
  const selectClass = 'block mt-1 rounded-lg border border-card-border bg-white p-2 text-sm'
  return <div className="mx-auto max-w-6xl space-y-6">
    <header><h1 className="font-display text-2xl font-bold">{bank ? 'Question Bank' : 'Review questions'}</h1>
      <p className="mt-2 text-sm text-ink/60">{bank ? 'Approved questions shared with staff in your centre. Fork a question to change it.' : 'Review your drafts by chapter. Centre admins can review every draft in their centre.'}</p>
      <Link to={bank ? '/review' : '/question-bank'} className="mt-2 inline-block font-semibold text-indigo-primary">{bank ? 'Review drafts' : 'Browse approved bank'}</Link>
    </header>
    <div className="flex flex-wrap gap-4 rounded-xl bg-paper p-4">
      {!bank && <fieldset><legend className="text-sm">Review status</legend><div className="mt-1 flex flex-wrap gap-2">
        {(['DRAFT', 'APPROVED', 'REJECTED'] as const).map(status => <button key={status} aria-pressed={filters.status === status} className="rounded-full border border-card-border px-3 py-2 text-sm aria-pressed:bg-indigo-primary aria-pressed:text-white" onClick={() => update('status', status)}>{{ DRAFT: 'Draft', APPROVED: 'Approved', REJECTED: 'Rejected' }[status]}</button>)}
      </div></fieldset>}
      <label className="text-sm">Grade<select className={selectClass} value={filters.gradeId} onChange={event => update('gradeId', event.target.value)}><option value="">All grades</option>{gradeOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
      <label className="text-sm">Subject<select className={selectClass} value={filters.subjectId} onChange={event => update('subjectId', event.target.value)}><option value="">All subjects</option>{subjectOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
      <label className="text-sm">Topic<select className={selectClass} disabled={!pairingId} value={filters.topicId} onChange={event => update('topicId', event.target.value)}><option value="">All topics</option>{topics.data?.map(topic => <option key={topic.topicId} value={topic.topicId}>{topic.name}</option>)}</select></label>
      <label className="text-sm">Question type<select className={selectClass} value={filters.type} onChange={event => update('type', event.target.value)}><option value="">All types</option>{QUESTION_TYPE_ORDER.map(type => <option key={type} value={type}>{questionTypeInfo(type).label}</option>)}</select></label>
      <label className="text-sm">Difficulty<select className={selectClass} value={filters.difficulty} onChange={event => update('difficulty', event.target.value)}><option value="">All difficulties</option>{[1,2,3,4,5].map(value => <option key={value}>{value}</option>)}</select></label>
      {filters.materialId && <button onClick={() => update('materialId', '')}>Clear chapter filter</button>}
    </div>
    {action.isError && <p role="alert">{getApiErrorMessage(action.error, 'Could not fork this question.')}</p>}
    {(grades.isError || topics.isError) && <p role="alert">Some filters could not be loaded. You can still browse questions.</p>}
    {query.isPending ? <p>Loading questions…</p> : query.isError ? <p role="alert">{getApiErrorMessage(query.error, 'Could not load questions.')}</p> : rows.length === 0 ? <div className="rounded-2xl border border-card-border bg-white p-8"><p>No questions match these filters.</p>{!bank && <Link to="/materials" className="text-indigo-primary">Generate questions from your materials</Link>}</div> : <>
      <p className="text-sm text-ink/60">{query.data.totalElements} questions · {rows.length} shown on this page</p>
      {[...groups].map(([key, questions]) => <section key={key} aria-label={bank ? "Approved questions" : questions[0].materialTitle ?? "Forked questions"} className="space-y-3">
        <h2 className="font-display text-lg font-bold">{bank ? "Approved questions" : questions[0].materialTitle ?? "Forked questions"}</h2>
        {!bank && <div className="rounded-xl bg-paper p-3 text-sm">
          <p>Topics: {[...new Set(questions.map(question => question.topicName))].join(', ')}</p>
          <p>On this page: {QUESTION_TYPE_ORDER.map(type => `${questionTypeInfo(type).label}: ${questions.filter(question => question.type === type).length}`).join(' · ')}</p>
          <p>{(['DRAFT', 'APPROVED', 'REJECTED'] as const).map(status => `${status}: ${questions.filter(question => question.status === status).length}`).join(' · ')}</p>
        </div>}
        <div className="grid gap-4 md:grid-cols-2">{questions.map(question => <article className="rounded-2xl border border-card-border bg-white p-5 shadow-sm" key={question.questionId}>
          <div className="flex items-center justify-between gap-3"><QuestionTypeChip type={question.type} /><span className="text-xs font-semibold">{question.status}</span></div>
          <p className="mt-3 text-sm font-medium">{question.stemPreview}</p>
          <p className="mt-2 text-sm">{question.topicName} · Difficulty {question.difficulty}</p>
          <div className="mt-3 flex gap-4 text-sm"><Link className="font-semibold text-indigo-primary" to={`/questions/${question.questionId}`}>{question.status === 'DRAFT' ? 'Review and edit' : question.status === 'APPROVED' ? 'View approved question' : 'View rejected question'}</Link>
            {bank && <button disabled={action.isPending} className="font-semibold text-indigo-primary" onClick={() => action.mutate({ question, action: 'forks' }, { onSuccess: draft => navigate(`/questions/${draft.questionId}`) })}>Fork</button>}
          </div>
        </article>)}</div>
      </section>)}
      <nav aria-label="Question pages" className="flex items-center gap-4"><button disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page + 1} of {query.data.totalPages}</span><button disabled={page + 1 >= query.data.totalPages} onClick={() => setPage(page + 1)}>Next</button></nav>
    </>}
  </div>
}
