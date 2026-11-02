import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../../lib/api'
import { useMaterialQuestions } from '../../lib/generation'
import DraftQuestionCard from './DraftQuestionCard'

/**
 * Read-only preview of a material's generated questions (review and
 * approval arrive in M4 — deliberately no actions here). The section
 * carries id="generated-drafts" so the job view's "View drafts"
 * action can scroll to it via scrollToDrafts().
 */
export default function GeneratedDraftsSection({
  materialId,
}: {
  materialId: string
}) {
  const [page, setPage] = useState(0)
  const questionsQuery = useMaterialQuestions(materialId, page)
  const data = questionsQuery.data
  const totalPages = data?.totalPages ?? 0

  return (
    <section
      id="generated-drafts"
      aria-label="Generated questions"
      className="mt-6 rounded-2xl border border-card-border bg-white p-6 shadow-sm"
    >
      <h2 className="font-display text-lg font-bold">Generated questions</h2>

      <Link className="mt-2 inline-block text-sm font-semibold text-indigo-primary" to={`/review?materialId=${materialId}`}>Review this chapter’s questions</Link>

      {questionsQuery.isPending && (
        <p className="mt-3 text-sm text-ink/60">Loading questions…</p>
      )}

      {questionsQuery.isError && (
        <p role="alert" className="mt-3 text-sm text-rose-weak">
          {getApiErrorMessage(
            questionsQuery.error,
            'Could not load the generated questions.',
          )}
        </p>
      )}

      {data !== undefined && (
        <>
          {data.totalElements === 0 ? (
            <p className="mt-3 text-sm text-ink/60">
              No questions yet — generate questions from this chapter.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {data.content.map((question) => (
                <DraftQuestionCard
                  key={question.questionId}
                  question={question}
                />
              ))}
            </div>
          )}
          {totalPages > 0 && (
            <div className="mt-4 flex items-center gap-3 text-sm">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((current) => current - 1)}
                className="rounded-full border border-card-border px-4 py-1.5 font-semibold hover:bg-paper disabled:opacity-50"
              >
                Previous
              </button>
              <span>
                Page {page + 1} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-full border border-card-border px-4 py-1.5 font-semibold hover:bg-paper disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
