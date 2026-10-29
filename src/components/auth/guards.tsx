import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../lib/auth'

/** Blocks the nested routes until a staff session exists. */
export function ProtectedRoute() {
  const { user, isRestoring } = useAuth()
  if (isRestoring) {
    return (
      <p className="flex min-h-screen items-center justify-center bg-paper font-body text-sm text-ink/60">
        Loading…
      </p>
    )
  }
  if (user === null) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}

/** Blocks the nested routes unless the user is a centre admin. */
export function AdminRoute() {
  const { user } = useAuth()
  if (user === null) {
    return <Navigate to="/login" replace />
  }
  if (user.role !== 'CENTRE_ADMIN') {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}
