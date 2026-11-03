import { useQuery } from '@tanstack/react-query'
import { BookOpen, Clock3, LogOut, Trophy } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient, getApiErrorMessage, type StudentTest, type StudentTestState } from '../lib/api'
import { useAuth } from '../lib/auth'

const tabs: { value: StudentTestState; label: string }[] = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'UPCOMING', label: 'Upcoming' },
  { value: 'COMPLETED', label: 'Completed' },
]

function TestCard({ test }: { test: StudentTest }) {
  const navigate = useNavigate()
  const open = () => {
    if (test.kind === 'FLASHCARD_PRACTICE') navigate(`/student/tests/${test.instanceId}/practice`)
    else if (test.state === 'COMPLETED' && test.latestAttemptId) navigate(`/student/attempts/${test.latestAttemptId}/result`)
    else navigate(`/student/tests/${test.instanceId}`)
  }
  return (
    <article className="rounded-2xl border border-indigo-bright/20 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-primary">{test.kind}</p>
          <h3 className="mt-1 font-display text-lg font-bold">{test.definitionName}</h3>
          <p className="mt-1 text-sm text-ink/60">{test.batchName}</p>
        </div>
        <span className="rounded-full bg-marigold/20 px-3 py-1 text-xs font-bold text-ink">{test.attemptsUsed}/{test.maxAttempts} attempts</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-ink/65">
        <span className="inline-flex items-center gap-1.5"><Clock3 size={15} />Closes {new Date(test.closesAt).toLocaleDateString()}</span>
        {test.totalSoFar !== null && <span className="inline-flex items-center gap-1.5"><Trophy size={15} />Score {test.totalSoFar}</span>}
        {test.markingPending && <span className="font-semibold text-amber-700">Marking pending</span>}
      </div>
      {test.state !== 'UPCOMING' && <button type="button" onClick={open} className="mt-5 rounded-full bg-indigo-primary px-5 py-2 text-sm font-bold text-white hover:bg-indigo-bright">{test.kind === 'FLASHCARD_PRACTICE' ? 'Practise cards' : test.state === 'COMPLETED' ? 'View results' : test.latestAttemptStatus === 'IN_PROGRESS' ? 'Resume test' : 'Start test'}</button>}
    </article>
  )
}

export default function StudentHomePage() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<StudentTestState>('AVAILABLE')
  const tests = useQuery({
    queryKey: ['student-tests', user?.centreId, user?.userId],
    queryFn: async () => (await apiClient.get<StudentTest[]>('/student/tests')).data,
    enabled: user !== null,
  })
  const allTests = tests.data ?? []
  const visible = allTests.filter((test) => test.state === activeTab)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-primary via-indigo-bright to-violet-500 px-4 py-8 font-body text-ink">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between text-white">
          <div><p className="text-sm font-semibold text-marigold">{user?.centreName}</p><h1 className="mt-1 font-display text-3xl font-bold">Hi, {user?.displayName}</h1><p className="mt-1 text-sm text-white/75">Ready for your next challenge?</p></div>
          <button type="button" onClick={() => void logout()} className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/25"><LogOut size={16} />Sign out</button>
        </header>
        <main className="mt-8 rounded-3xl bg-paper p-5 shadow-xl md:p-8">
          <div className="flex items-center gap-3"><span className="rounded-xl bg-marigold p-2"><BookOpen size={22} /></span><h2 className="font-display text-2xl font-bold">Tests</h2></div>
          <div role="tablist" aria-label="Test status" className="mt-6 flex gap-2 border-b border-card-border">
            {tabs.map((tab) => <button key={tab.value} role="tab" aria-selected={activeTab === tab.value} onClick={() => setActiveTab(tab.value)} className={`border-b-2 px-4 py-3 text-sm font-bold ${activeTab === tab.value ? 'border-indigo-primary text-indigo-primary' : 'border-transparent text-ink/55'}`}>{tab.label} ({allTests.filter((test) => test.state === tab.value).length})</button>)}
          </div>
          {tests.isPending ? <p className="py-10 text-center text-ink/60">Loading your tests…</p> : tests.isError ? <p role="alert" className="mt-5 rounded-xl bg-rose-weak/10 p-4 text-rose-weak">{getApiErrorMessage(tests.error, 'Could not load your tests.')}</p> : visible.length === 0 ? <p className="py-12 text-center text-ink/55">No {activeTab.toLowerCase()} tests right now.</p> : <div className="mt-5 grid gap-4 md:grid-cols-2">{visible.map((test) => <TestCard key={test.instanceId} test={test} />)}</div>}
        </main>
      </div>
    </div>
  )
}
