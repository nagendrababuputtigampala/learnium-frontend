interface Stat {
  label: string
  value: string
}

const STATS: Stat[] = [
  { label: 'Tests this week', value: '6' },
  { label: 'Students active', value: '24' },
  { label: 'Answers to mark', value: '9' },
]

interface WeakTopic {
  topic: string
  percent: number
  barClass: string
}

const WEAK_TOPICS: WeakTopic[] = [
  { topic: 'Adding unlike denominators', percent: 52, barClass: 'bg-rose-weak' },
  { topic: 'Word problems', percent: 61, barClass: 'bg-marigold' },
  { topic: 'Equivalent fractions', percent: 88, barClass: 'bg-emerald-progress' },
]

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Teacher Home</h1>
          <p className="mt-1 text-sm text-ink/60">
            Grade 8 Math — Batch B
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
        aria-label="This week at a glance"
        className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-card-border bg-white p-5 shadow-sm"
          >
            <p className="font-display text-3xl font-bold">{stat.value}</p>
            <p className="mt-1 text-sm text-ink/60">{stat.label}</p>
          </div>
        ))}
      </section>

      <section
        aria-label="Weak topics"
        className="rounded-2xl border border-card-border bg-white p-5 shadow-sm"
      >
        <h2 className="mb-4 font-display text-base font-bold">
          Weak topics — this batch
        </h2>
        <ul className="space-y-3">
          {WEAK_TOPICS.map((item) => (
            <li key={item.topic} className="flex items-center gap-3 text-sm">
              <span className="w-52 shrink-0">{item.topic}</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-indigo-tint">
                <span
                  data-testid="heat-bar"
                  className={`block h-full rounded-full ${item.barClass}`}
                  style={{ width: `${item.percent}%` }}
                />
              </span>
              <span className="w-10 text-right font-semibold">
                {item.percent}%
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
