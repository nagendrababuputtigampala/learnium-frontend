import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-4 text-center font-body text-ink">
      <p className="font-display text-5xl font-bold text-indigo-primary">404</p>
      <h1 className="mt-3 font-display text-xl font-bold">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-ink/60">
        The page you are looking for does not exist or may have moved.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-full bg-marigold px-5 py-2.5 text-sm font-semibold text-ink transition hover:brightness-95"
      >
        Back to home
      </Link>
    </div>
  )
}
