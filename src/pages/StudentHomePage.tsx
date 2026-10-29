import { Navigate } from 'react-router-dom'
import { getStudent } from '../lib/api'

export default function StudentHomePage() {
  const student = getStudent()
  if (student === null) {
    return <Navigate to="/join" replace />
  }
  return (
    <div className="min-h-screen bg-paper px-4 py-10 font-body text-ink">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6">
          <p className="text-sm font-semibold text-indigo-primary">
            {student.batchName}
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold">
            Welcome, {student.displayName}
          </h1>
        </header>
        <section
          aria-label="Your tests"
          className="rounded-2xl border border-card-border bg-white p-6 shadow-sm"
        >
          <h2 className="font-display text-base font-bold">Your tests</h2>
          <p className="mt-2 text-sm text-ink/60">
            Your tests will appear here. When your teacher publishes a test,
            join it from the link or code they share with you.
          </p>
        </section>
      </div>
    </div>
  )
}
