import { useQuery } from '@tanstack/react-query'
import { apiClient, getApiErrorMessage, type BatchDto } from '../lib/api'
import { useAuth } from '../lib/auth'

export default function HomePage() {
  const { user } = useAuth()
  const batchesQuery = useQuery({
    queryKey: ['batches'],
    queryFn: async () => {
      const response = await apiClient.get<BatchDto[]>('/batches')
      return response.data
    },
  })
  const batches = batchesQuery.data ?? []

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Teacher Home</h1>
          <p className="mt-1 text-sm text-ink/60">
            Welcome back, {user?.displayName ?? 'teacher'} ·{' '}
            {user?.centreName ?? 'your centre'}
          </p>
        </div>
        <button
          type="button"
          className="rounded-full bg-marigold px-5 py-2.5 text-sm font-semibold text-ink shadow-sm transition hover:brightness-95"
        >
          Create test from a chapter
        </button>
      </header>

      <section
        aria-label="My batches"
        className="rounded-2xl border border-card-border bg-white p-5 shadow-sm"
      >
        <h2 className="mb-4 font-display text-base font-bold">My batches</h2>
        {batchesQuery.isPending ? (
          <p className="text-sm text-ink/60">Loading batches…</p>
        ) : batchesQuery.isError ? (
          <p role="alert" className="text-sm text-rose-weak">
            {getApiErrorMessage(
              batchesQuery.error,
              'Could not load your batches.',
            )}
          </p>
        ) : batches.length === 0 ? (
          <p className="text-sm text-ink/60">
            No batches assigned yet. Your centre admin can assign you to a
            batch.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {batches.map((batch) => (
              <li
                key={batch.batchId}
                className="rounded-xl border border-card-border bg-paper p-4"
              >
                <p className="font-display font-bold">{batch.name}</p>
                <p className="mt-1 text-sm text-ink/60">{batch.gradeLabel}</p>
                <p className="mt-2 text-sm">
                  {batch.studentCount} students ·{' '}
                  {batch.teacherName === null
                    ? 'No teacher assigned'
                    : `Teacher: ${batch.teacherName}`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
