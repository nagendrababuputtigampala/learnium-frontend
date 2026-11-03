import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiClient, getApiErrorMessage, type Practice } from '../lib/api'

export default function PracticePlayerPage() {
  const { instanceId = '' } = useParams(); const [index, setIndex] = useState(0); const [flipped, setFlipped] = useState(false); const [known, setKnown] = useState<Set<string>>(new Set())
  const practice = useQuery({ queryKey: ['student-practice', instanceId], queryFn: async () => (await apiClient.get<Practice>(`/student/tests/${instanceId}/practice`)).data })
  if (practice.isPending) return <Frame><p>Loading cards…</p></Frame>
  if (practice.isError || !practice.data) return <Frame><p role="alert" className="text-rose-weak">{getApiErrorMessage(practice.error, 'Could not load these cards.')}</p></Frame>
  const cards = practice.data.cards; const card = cards[index]
  if (!card) return <Frame><h1 className="font-display text-2xl font-bold">Practice complete</h1><p className="mt-3">You knew {known.size} of {cards.length} cards.</p><Link to="/student" className="mt-6 inline-block rounded-full bg-indigo-primary px-5 py-2 font-bold text-white">Back to tests</Link></Frame>
  const payload = card.payload; const advance = (yes: boolean) => { if (yes) setKnown((current) => new Set(current).add(card.itemId)); setIndex(index + 1); setFlipped(false) }
  return <Frame><p className="text-sm font-bold text-indigo-primary">{practice.data.definitionName} · Card {index + 1} of {cards.length}</p><button type="button" aria-label="Flip card" onClick={() => setFlipped(!flipped)} className="mt-6 flex min-h-72 w-full items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-primary to-indigo-bright p-8 text-center font-display text-3xl font-bold text-white shadow-lg">{String(flipped ? payload.back ?? '' : payload.front ?? '')}</button><p className="mt-3 text-center text-sm text-ink/55">Tap the card to flip it.</p>{flipped && <div className="mt-6 flex justify-center gap-3"><button type="button" onClick={() => advance(false)} className="rounded-full border border-indigo-primary px-5 py-2 font-bold text-indigo-primary">Still learning</button><button type="button" onClick={() => advance(true)} className="rounded-full bg-marigold px-5 py-2 font-bold">Know it</button></div>}</Frame>
}
function Frame({ children }: { children: React.ReactNode }) { return <div className="min-h-screen bg-gradient-to-br from-indigo-primary to-violet-500 p-4 md:p-8"><main className="mx-auto max-w-2xl rounded-3xl bg-white p-6 shadow-xl md:p-9">{children}</main></div> }
