import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import RosterPanel from '../components/roster/RosterPanel'
import {
  apiClient,
  getApiErrorMessage,
  type BatchDto,
  type GradeSubject,
  type PageResponse,
  type TeacherDto,
} from '../lib/api'
import { useAuth } from '../lib/auth'

const createBatchSchema = z.object({
  name: z.string().min(1, 'Batch name is required'),
  gradeSubjectId: z.string().min(1, 'Choose a grade and subject'),
})

type CreateBatchValues = z.infer<typeof createBatchSchema>

const inputClassName =
  'w-full rounded-lg border border-card-border px-3 py-2 text-sm outline-none focus:border-indigo-bright focus:ring-2 focus:ring-indigo-bright/30'

export default function BatchesPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'CENTRE_ADMIN'
  const queryClient = useQueryClient()
  const [actionError, setActionError] = useState<string | null>(null)
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null)

  const batchesQuery = useQuery({
    queryKey: ['batches'],
    queryFn: async () => {
      const response = await apiClient.get<BatchDto[]>('/batches')
      return response.data
    },
  })

  const gradeSubjectsQuery = useQuery({
    queryKey: ['grade-subjects'],
    queryFn: async () => {
      const response = await apiClient.get<GradeSubject[]>(
        '/master/grade-subjects',
      )
      return response.data
    },
    enabled: isAdmin,
  })

  const teachersQuery = useQuery({
    queryKey: ['teachers-all'],
    queryFn: async () => {
      const response = await apiClient.get<PageResponse<TeacherDto>>(
        '/admin/teachers',
        { params: { page: 0, size: 100 } },
      )
      return response.data.content
    },
    enabled: isAdmin,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateBatchValues>({
    resolver: zodResolver(createBatchSchema),
    defaultValues: { name: '', gradeSubjectId: '' },
  })

  const invalidateBatches = () => {
    void queryClient.invalidateQueries({ queryKey: ['batches'] })
  }

  const createMutation = useMutation({
    mutationFn: async (values: CreateBatchValues) => {
      const response = await apiClient.post<BatchDto>('/admin/batches', values)
      return response.data
    },
    onSuccess: () => {
      reset()
      invalidateBatches()
    },
    onError: (error) => {
      setActionError(getApiErrorMessage(error, 'Could not create the batch.'))
    },
  })

  const assignMutation = useMutation({
    mutationFn: async (input: { batchId: string; userId: string }) => {
      const response = await apiClient.put<BatchDto>(
        `/admin/batches/${input.batchId}/teacher`,
        { userId: input.userId },
      )
      return response.data
    },
    onSuccess: () => {
      invalidateBatches()
    },
    onError: (error) => {
      setActionError(
        getApiErrorMessage(error, 'Could not assign the teacher.'),
      )
    },
  })

  const unassignMutation = useMutation({
    mutationFn: async (batch: BatchDto) => {
      await apiClient.delete(
        `/admin/batches/${batch.batchId}/teacher/${batch.teacherUserId}`,
      )
    },
    onSuccess: () => {
      invalidateBatches()
    },
    onError: (error) => {
      setActionError(
        getApiErrorMessage(error, 'Could not remove the teacher.'),
      )
    },
  })

  const onCreate = (values: CreateBatchValues) => {
    setActionError(null)
    createMutation.mutate(values)
  }

  const onAssign = (batch: BatchDto, userId: string) => {
    setActionError(null)
    if (userId !== '') {
      assignMutation.mutate({ batchId: batch.batchId, userId })
    }
  }

  const batches = batchesQuery.data ?? []
  const gradeSubjects = gradeSubjectsQuery.data ?? []
  const teachers = teachersQuery.data ?? []

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold">Batches</h1>
        <p className="mt-1 text-sm text-ink/60">
          Teaching groups in your centre, their teachers and rosters.
        </p>
      </header>

      {actionError !== null && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-rose-weak/10 px-3 py-2 text-sm text-rose-weak"
        >
          {actionError}
        </p>
      )}

      {isAdmin && (
        <section
          aria-label="Create a batch"
          className="mb-6 rounded-2xl border border-card-border bg-white p-5 shadow-sm"
        >
          <h2 className="mb-4 font-display text-base font-bold">
            Create a batch
          </h2>
          <form
            noValidate
            onSubmit={handleSubmit(onCreate)}
            className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          >
            <div>
              <label
                htmlFor="batch-name"
                className="mb-1 block text-sm font-medium"
              >
                Batch name
              </label>
              <input
                id="batch-name"
                className={inputClassName}
                {...register('name')}
              />
              {errors.name && (
                <p role="alert" className="mt-1 text-sm text-rose-weak">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="batch-grade-subject"
                className="mb-1 block text-sm font-medium"
              >
                Grade and subject
              </label>
              <select
                id="batch-grade-subject"
                className={inputClassName}
                {...register('gradeSubjectId')}
              >
                <option value="">Select grade and subject</option>
                {gradeSubjects.map((gradeSubject) => (
                  <option
                    key={gradeSubject.gradeSubjectId}
                    value={gradeSubject.gradeSubjectId}
                  >
                    {gradeSubject.label}
                  </option>
                ))}
              </select>
              {errors.gradeSubjectId && (
                <p role="alert" className="mt-1 text-sm text-rose-weak">
                  {errors.gradeSubjectId.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              className="rounded-full bg-marigold px-5 py-2.5 text-sm font-semibold text-ink transition hover:brightness-95"
            >
              Create batch
            </button>
          </form>
        </section>
      )}

      <section aria-label="All batches">
        {batchesQuery.isPending ? (
          <p className="text-sm text-ink/60">Loading batches…</p>
        ) : batchesQuery.isError ? (
          <p role="alert" className="text-sm text-rose-weak">
            {getApiErrorMessage(
              batchesQuery.error,
              'Could not load batches.',
            )}
          </p>
        ) : batches.length === 0 ? (
          <p className="text-sm text-ink/60">No batches yet.</p>
        ) : (
          <ul className="space-y-4">
            {batches.map((batch) => (
              <li
                key={batch.batchId}
                className="rounded-2xl border border-card-border bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display font-bold">{batch.name}</p>
                    <p className="mt-1 text-sm text-ink/60">
                      {batch.gradeLabel}
                    </p>
                    <p className="mt-2 text-sm">
                      {batch.studentCount} students ·{' '}
                      {batch.teacherName === null
                        ? 'No teacher assigned'
                        : `Teacher: ${batch.teacherName}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedBatchId(
                        expandedBatchId === batch.batchId
                          ? null
                          : batch.batchId,
                      )
                    }
                    className="rounded-full border border-indigo-primary px-4 py-1.5 text-sm font-semibold text-indigo-primary transition hover:bg-indigo-tint"
                  >
                    {expandedBatchId === batch.batchId
                      ? 'Hide roster'
                      : 'View roster'}
                  </button>
                </div>

                {isAdmin && (
                  <div className="mt-4 flex flex-wrap items-end gap-3">
                    <div>
                      <label
                        htmlFor={`assign-${batch.batchId}`}
                        className="mb-1 block text-sm font-medium"
                      >
                        Assign teacher
                      </label>
                      <select
                        id={`assign-${batch.batchId}`}
                        className={inputClassName}
                        value={batch.teacherUserId ?? ''}
                        onChange={(event) =>
                          onAssign(batch, event.target.value)
                        }
                      >
                        <option value="">Select a teacher</option>
                        {teachers.map((teacher) => (
                          <option key={teacher.userId} value={teacher.userId}>
                            {teacher.displayName}
                          </option>
                        ))}
                      </select>
                    </div>
                    {batch.teacherUserId !== null && (
                      <button
                        type="button"
                        onClick={() => {
                          setActionError(null)
                          unassignMutation.mutate(batch)
                        }}
                        className="rounded-full border border-card-border px-4 py-2 text-sm font-semibold hover:bg-paper"
                      >
                        Remove teacher
                      </button>
                    )}
                  </div>
                )}

                {expandedBatchId === batch.batchId && (
                  <RosterPanel batchId={batch.batchId} />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
