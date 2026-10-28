import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  apiClient,
  getApiErrorMessage,
  type BatchDto,
  type PageResponse,
  type TeacherDto,
} from '../lib/api'
import { useAuth } from '../lib/auth'

const linkClassName =
  'rounded-full border border-indigo-primary px-4 py-2 text-sm font-semibold text-indigo-primary transition hover:bg-indigo-tint'

export default function CentreOverviewPage() {
  const { user } = useAuth()
  const teachersQuery = useQuery({
    queryKey: ['teachers-count', user?.centreId],
    queryFn: async () => {
      const response = await apiClient.get<PageResponse<TeacherDto>>(
        '/admin/teachers',
        { params: { page: 0, size: 1 } },
      )
      return response.data
    },
  })
  const batchesQuery = useQuery({
    queryKey: ['batches', user?.centreId],
    queryFn: async () => {
      const response = await apiClient.get<BatchDto[]>('/batches')
      return response.data
    },
  })
  const loadError = teachersQuery.error ?? batchesQuery.error

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold">Centre Overview</h1>
        <p className="mt-1 text-sm text-ink/60">
          {user?.centreName ?? 'Your centre'}
        </p>
      </header>

      {loadError !== null && (
        <p
          role="alert"
          className="mb-6 rounded-lg bg-rose-weak/10 px-3 py-2 text-sm text-rose-weak"
        >
          {getApiErrorMessage(loadError, 'Could not load centre data.')}
        </p>
      )}

      <section
        aria-label="Centre summary"
        className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <div className="rounded-2xl border border-card-border bg-white p-5 shadow-sm">
          <p className="font-display text-3xl font-bold">
            {teachersQuery.data?.totalElements ?? '–'}
          </p>
          <p className="mt-1 text-sm text-ink/60">Teachers</p>
        </div>
        <div className="rounded-2xl border border-card-border bg-white p-5 shadow-sm">
          <p className="font-display text-3xl font-bold">
            {batchesQuery.data?.length ?? '–'}
          </p>
          <p className="mt-1 text-sm text-ink/60">Batches</p>
        </div>
      </section>

      <nav aria-label="Quick links" className="flex flex-wrap gap-3">
        <Link to="/admin/teachers" className={linkClassName}>
          Manage teachers
        </Link>
        <Link to="/batches" className={linkClassName}>
          View batches
        </Link>
        <Link to="/admin/settings" className={linkClassName}>
          Centre settings
        </Link>
      </nav>
    </div>
  )
}
