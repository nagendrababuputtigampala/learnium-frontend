import type { FormEvent } from 'react'

export default function LoginPage() {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 font-body text-ink">
      <div className="w-full max-w-sm rounded-2xl border border-card-border bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-primary font-display text-xl font-bold text-white">
            L
          </span>
          <h1 className="font-display text-xl font-bold">
            Sign in to Learn<span className="text-marigold">ium</span>
          </h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-lg border border-card-border px-3 py-2 text-sm outline-none focus:border-indigo-bright focus:ring-2 focus:ring-indigo-bright/30"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-lg border border-card-border px-3 py-2 text-sm outline-none focus:border-indigo-bright focus:ring-2 focus:ring-indigo-bright/30"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-full bg-marigold px-5 py-2.5 text-sm font-semibold text-ink transition hover:brightness-95"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  )
}
