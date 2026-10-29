import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  apiClient,
  getApiErrorMessage,
  type PageResponse,
  type TeacherDto,
} from '../lib/api'
import { useAuth } from '../lib/auth'

const PAGE_SIZE = 10

const inviteSchema = z.object({
  displayName: z.string().min(1, 'Display name is required'),
  email: z.string().email('Enter a valid email address'),
})

type InviteFormValues = z.infer<typeof inviteSchema>

const inputClassName =
  'w-full rounded-lg border border-card-border px-3 py-2 text-sm outline-none focus:border-indigo-bright focus:ring-2 focus:ring-indigo-bright/30'

export default function TeachersPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [notice, setNotice] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const teachersQuery = useQuery({
    queryKey: ['teachers', user?.centreId, page],
    queryFn: async () => {
      const response = await apiClient.get<PageResponse<TeacherDto>>(
        '/admin/teachers',
        { params: { page, size: PAGE_SIZE } },
      )
      return response.data
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { displayName: '', email: '' },
  })

  const inviteMutation = useMutation({
    mutationFn: async (values: InviteFormValues) => {
      const response = await apiClient.post<TeacherDto>(
        '/admin/teachers',
        values,
      )
      return response.data
    },
    onSuccess: (_created, values) => {
      setNotice(`Invitation sent to ${values.email}`)
      reset()
      void queryClient.invalidateQueries({ queryKey: ['teachers'] })
    },
    onError: (error) => {
      setActionError(
        getApiErrorMessage(error, 'Could not invite the teacher.'),
      )
    },
  })

  const resendInviteMutation = useMutation({
    mutationFn: async (teacher: TeacherDto) => {
      await apiClient.post(
        `/admin/teachers/${teacher.userId}/resend-invite`,
      )
      return teacher
    },
    onSuccess: (teacher) => {
      setNotice(`Invitation re-sent to ${teacher.email}`)
    },
    onError: (error) => {
      setActionError(
        getApiErrorMessage(error, 'Could not resend the invitation.'),
      )
    },
  })

  const deactivateMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiClient.delete(`/admin/teachers/${userId}`)
    },
    onSuccess: () => {
      setConfirmingId(null)
      void queryClient.invalidateQueries({ queryKey: ['teachers'] })
    },
    onError: (error) => {
      setActionError(
        getApiErrorMessage(error, 'Could not deactivate the teacher.'),
      )
    },
  })

  const onInvite = (values: InviteFormValues) => {
    setNotice(null)
    setActionError(null)
    inviteMutation.mutate(values)
  }

  const teachers = teachersQuery.data?.content ?? []
  const totalPages = teachersQuery.data?.totalPages ?? 0

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold">Teachers</h1>
        <p className="mt-1 text-sm text-ink/60">
          Invite teachers to your centre and manage their access.
        </p>
      </header>

      {notice !== null && (
        <p className="mb-4 rounded-lg bg-emerald-progress/10 px-3 py-2 text-sm text-emerald-progress">
          {notice}
        </p>
      )}
      {actionError !== null && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-rose-weak/10 px-3 py-2 text-sm text-rose-weak"
        >
          {actionError}
        </p>
      )}

      <section
        aria-label="Invite a teacher"
        className="mb-6 rounded-2xl border border-card-border bg-white p-5 shadow-sm"
      >
        <h2 className="mb-4 font-display text-base font-bold">
          Invite a teacher
        </h2>
        <form
          noValidate
          onSubmit={handleSubmit(onInvite)}
          className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        >
          <div>
            <label
              htmlFor="teacher-display-name"
              className="mb-1 block text-sm font-medium"
            >
              Display name
            </label>
            <input
              id="teacher-display-name"
              className={inputClassName}
              {...register('displayName')}
            />
            {errors.displayName && (
              <p role="alert" className="mt-1 text-sm text-rose-weak">
                {errors.displayName.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="teacher-email"
              className="mb-1 block text-sm font-medium"
            >
              Email
            </label>
            <input
              id="teacher-email"
              type="email"
              className={inputClassName}
              {...register('email')}
            />
            {errors.email && (
              <p role="alert" className="mt-1 text-sm text-rose-weak">
                {errors.email.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            className="rounded-full bg-marigold px-5 py-2.5 text-sm font-semibold text-ink transition hover:brightness-95"
          >
            Send invite
          </button>
        </form>
      </section>

      <section
        aria-label="All teachers"
        className="rounded-2xl border border-card-border bg-white p-5 shadow-sm"
      >
        {teachersQuery.isPending ? (
          <p className="text-sm text-ink/60">Loading teachers…</p>
        ) : teachersQuery.isError ? (
          <p role="alert" className="text-sm text-rose-weak">
            {getApiErrorMessage(
              teachersQuery.error,
              'Could not load teachers.',
            )}
          </p>
        ) : teachers.length === 0 ? (
          <p className="text-sm text-ink/60">No teachers yet.</p>
        ) : (
          <>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-card-border text-ink/60">
                  <th className="py-2 font-medium">Name</th>
                  <th className="py-2 font-medium">Email</th>
                  <th className="py-2 font-medium">Status</th>
                  <th className="py-2 font-medium">Joined</th>
                  <th className="py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => (
                  <tr
                    key={teacher.userId}
                    className="border-b border-card-border last:border-0"
                  >
                    <td className="py-2 font-medium">{teacher.displayName}</td>
                    <td className="py-2">{teacher.email}</td>
                    <td className="py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          teacher.invited
                            ? 'bg-indigo-bright/15 text-indigo-primary'
                            : teacher.active
                              ? 'bg-emerald-progress/15 text-emerald-progress'
                              : 'bg-ink/10 text-ink/60'
                        }`}
                      >
                        {teacher.invited
                          ? 'Invited'
                          : teacher.active
                            ? 'Active'
                            : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-2">{teacher.createdAt.slice(0, 10)}</td>
                    <td className="py-2">
                      <span className="flex gap-2">
                        {teacher.invited && (
                          <button
                            type="button"
                            onClick={() => {
                              setNotice(null)
                              setActionError(null)
                              resendInviteMutation.mutate(teacher)
                            }}
                            className="rounded-full border border-card-border px-3 py-1 text-xs font-semibold hover:bg-paper"
                          >
                            Resend invite
                          </button>
                        )}
                        {teacher.active &&
                          (confirmingId === teacher.userId ? (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  deactivateMutation.mutate(teacher.userId)
                                }
                                className="rounded-full bg-rose-weak px-3 py-1 text-xs font-semibold text-white hover:brightness-95"
                              >
                                Confirm deactivate
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmingId(null)}
                                className="rounded-full border border-card-border px-3 py-1 text-xs font-semibold hover:bg-paper"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmingId(teacher.userId)}
                              className="rounded-full border border-card-border px-3 py-1 text-xs font-semibold hover:bg-paper"
                            >
                              Deactivate
                            </button>
                          ))}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 0 && (
              <div className="mt-4 flex items-center gap-3 text-sm">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((current) => current - 1)}
                  className="rounded-full border border-card-border px-4 py-1.5 font-semibold hover:bg-paper disabled:opacity-50"
                >
                  Previous
                </button>
                <span>
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-full border border-card-border px-4 py-1.5 font-semibold hover:bg-paper disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
