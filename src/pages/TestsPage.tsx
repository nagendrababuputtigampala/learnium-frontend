import { useState } from 'react'
import { Link } from 'react-router-dom'
import { kindLabel, useDefinitions } from '../lib/tests'
import ApiFailure from '../components/tests/ApiFailure'
import PublishDialog from '../components/tests/PublishDialog'

export default function TestsPage() {
  const query = useDefinitions()
  const [publishId, setPublishId] = useState('')
  return <div className="mx-auto max-w-6xl space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="font-display text-2xl font-bold">My Tests</h1><p className="mt-2 text-sm text-ink/60">Reusable definitions for your classes. Centre admins see every definition in their centre.</p></div><Link to="/tests/new" className="rounded-full bg-indigo-primary px-5 py-2 font-semibold text-white">Build a test</Link></header>
    {query.isPending ? <p>Loading test definitions…</p> : query.isError ? <ApiFailure error={query.error} fallback="Could not load test definitions." /> : query.data.length === 0 ? <p className="rounded-2xl border border-card-border bg-white p-8">No test definitions yet. Build one from your approved question bank.</p> : <div className="grid gap-5 md:grid-cols-2">
      {query.data.map(definition => <article key={definition.id} className="space-y-3 rounded-2xl border border-card-border bg-white p-5 shadow-sm">
        <span className="inline-block rounded-full bg-indigo-tint px-3 py-1 text-xs font-semibold text-indigo-primary">{kindLabel(definition.kind)}</span>
        <h2 className="font-display text-lg font-bold">{definition.name}</h2>
        <p className="text-sm text-ink/60">{definition.gradeName} · {definition.subjectName}</p>
        <p className="text-sm">{definition.questionCount} questions · {definition.totalMarks.toFixed(2)} marks · {definition.publishedInstanceCount} published instances</p>
        <div className="flex gap-5 text-sm font-semibold text-indigo-primary"><Link to={`/tests/${definition.id}`}>Edit definition</Link><button onClick={() => setPublishId(definition.id)}>Publish test</button></div>
      </article>)}
    </div>}
    {publishId !== '' && <PublishDialog id={publishId} onClose={() => setPublishId('')} />}
  </div>
}
