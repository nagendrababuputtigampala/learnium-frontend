import { useState } from 'react'
import axios from 'axios'
import type { ApiErrorBody } from '../lib/api'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../lib/api'
import { useQuestion, useQuestionAction } from '../lib/questions'
import QuestionEditForm from '../components/questions/QuestionEditForm'
import { QuestionPreview } from './QuestionsPage'

export default function QuestionDetailPage() {
  const { questionId = '' } = useParams()
  const query = useQuestion(questionId)
  const action = useQuestionAction()
  const navigate = useNavigate()
  const [reloadEpoch, setReloadEpoch] = useState(0)
  const [dirty, setDirty] = useState(false)
  const [notice, setNotice] = useState('')
  const [rejectConfirm, setRejectConfirm] = useState(false)
  const question = query.data
  const run = (kind: 'approve' | 'reject' | 'forks') => {
    action.mutate({ question: question!, action: kind }, { onSuccess: result => {
      if (kind === 'forks') { setNotice(''); setDirty(false); navigate(`/questions/${result.questionId}`) }
      else { setNotice(kind === 'approve' ? 'Question approved and added to the bank.' : 'Question rejected.'); setRejectConfirm(false) }
    } })
  }
  if (query.isPending) return <p>Loading question…</p>
  if (query.isError) return <p role="alert">{getApiErrorMessage(query.error, 'Could not load this question.')}</p>
  const errors = axios.isAxiosError<ApiErrorBody>(action.error) ? action.error.response?.data.fieldErrors : undefined
  return <div className="mx-auto max-w-3xl space-y-4">
    <Link to={question!.status === 'APPROVED' ? '/question-bank' : '/review'} className="font-semibold text-indigo-primary">Back to {question!.status === 'APPROVED' ? 'Question Bank' : 'Review'}</Link>
    <h1 className="font-display text-2xl font-bold">{question!.status === 'DRAFT' ? 'Review draft' : question!.status === 'APPROVED' ? 'Approved question' : 'Rejected question'}</h1>
    {question!.sourceQuestionId && <Link className="block text-sm text-indigo-primary" to={`/questions/${question!.sourceQuestionId}`}>View original approved question</Link>}
    <QuestionPreview question={question!} />
    {notice && <p role="status" className="rounded-lg bg-emerald-progress/10 p-3">{notice}</p>}
    {action.isError && <div role="alert" className="rounded-lg bg-rose-weak/10 p-3"><p>{getApiErrorMessage(action.error, 'Could not update this question.')}</p><button className="mt-2 underline" onClick={() => { setDirty(false); setReloadEpoch(value => value + 1); action.reset(); void query.refetch() }}>Reload latest question</button></div>}
    {question!.status === 'DRAFT' ? <>
      <QuestionEditForm key={`${question!.questionId}:${question!.revision}:${reloadEpoch}`} question={question!} pending={action.isPending} dirty={dirty} serverErrors={errors} onApprove={() => run('approve')} onDirty={setDirty} onSave={edit => {
        action.mutate({ question: question!, action: 'save', edit }, { onSuccess: () => { setDirty(false); setNotice('Draft saved. You can approve it when ready.') } })
      }} />
      <div className="flex flex-wrap gap-3">
        <button disabled={action.isPending} className="rounded-full border border-rose-weak px-5 py-2 text-rose-weak" onClick={() => setRejectConfirm(true)}>Reject draft</button>
        {rejectConfirm && <div role="dialog" aria-label="Reject draft confirmation"><p>Reject this draft? It cannot be edited afterwards.</p><button disabled={action.isPending} onClick={() => run('reject')}>Confirm reject</button><button onClick={() => setRejectConfirm(false)}>Keep draft</button></div>}
      </div><p className="text-sm text-ink/60">Save edits before approving. Rejection does not require valid content.</p>
    </> : question!.status === 'APPROVED' ? <>
      <p className="text-sm">Approved{question!.approvedAt && <> on {question!.approvedAt.slice(0, 10)}</>}. This question is immutable. Fork it to make changes.</p>
      <button disabled={action.isPending} className="rounded-full bg-indigo-primary px-5 py-2 font-semibold text-white" onClick={() => run('forks')}>Fork to a new draft</button>
    </> : <p>This question stays rejected. Generate new questions from your materials to try again.</p>}
  </div>
}
