import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  apiClient,
  getApiErrorMessage,
  type CreatedStudent,
  type RosterStudent,
} from '../../lib/api'

const addStudentSchema = z.object({
  fullName: z.string().min(1, 'Student name is required'),
})

const bulkAddSchema = z.object({
  namesText: z.string().min(1, 'Enter at least one student name'),
})

type AddStudentValues = z.infer<typeof addStudentSchema>
type BulkAddValues = z.infer<typeof bulkAddSchema>

const inputClassName =
  'w-full rounded-lg border border-card-border px-3 py-2 text-sm outline-none focus:border-indigo-bright focus:ring-2 focus:ring-indigo-bright/30'

interface RosterPanelProps {
  batchId: string
}

export default function RosterPanel({ batchId }: RosterPanelProps) {
  const queryClient = useQueryClient()
  const [pinNotice, setPinNotice] = useState<CreatedStudent[] | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [copiedPin, setCopiedPin] = useState<string | null>(null)

  const rosterQuery = useQuery({
    queryKey: ['roster', batchId],
    queryFn: async () => {
      const response = await apiClient.get<RosterStudent[]>(
        `/batches/${batchId}/students`,
      )
      return response.data
    },
  })

  const invalidateRoster = () => {
    void queryClient.invalidateQueries({ queryKey: ['roster', batchId] })
    void queryClient.invalidateQueries({ queryKey: ['batches'] })
  }

  const addForm = useForm<AddStudentValues>({
    resolver: zodResolver(addStudentSchema),
    defaultValues: { fullName: '' },
  })

  const bulkForm = useForm<BulkAddValues>({
    resolver: zodResolver(bulkAddSchema),
    defaultValues: { namesText: '' },
  })

  const addMutation = useMutation({
    mutationFn: async (values: AddStudentValues) => {
      const response = await apiClient.post<CreatedStudent>(
        `/batches/${batchId}/students`,
        { fullName: values.fullName },
      )
      return response.data
    },
    onSuccess: (created) => {
      setPinNotice([created])
      addForm.reset()
      invalidateRoster()
    },
    onError: (error) => {
      setActionError(getApiErrorMessage(error, 'Could not add the student.'))
    },
  })

  const bulkMutation = useMutation({
    mutationFn: async (fullNames: string[]) => {
      const response = await apiClient.post<CreatedStudent[]>(
        `/batches/${batchId}/students/bulk`,
        { fullNames },
      )
      return response.data
    },
    onSuccess: (created) => {
      setPinNotice(created)
      bulkForm.reset()
      invalidateRoster()
    },
    onError: (error) => {
      setActionError(getApiErrorMessage(error, 'Could not add the students.'))
    },
  })

  const resetPinMutation = useMutation({
    mutationFn: async (student: RosterStudent) => {
      const response = await apiClient.post<{ pin: string }>(
        `/batches/${batchId}/students/${student.membershipId}/reset-pin`,
      )
      return { student, pin: response.data.pin }
    },
    onSuccess: ({ student, pin }) => {
      setPinNotice([
        {
          membershipId: student.membershipId,
          userId: student.userId,
          fullName: student.fullName,
          pin,
        },
      ])
    },
    onError: (error) => {
      setActionError(getApiErrorMessage(error, 'Could not reset the PIN.'))
    },
  })

  const deactivateMutation = useMutation({
    mutationFn: async (membershipId: string) => {
      await apiClient.delete(`/batches/${batchId}/students/${membershipId}`)
    },
    onSuccess: () => {
      setConfirmingId(null)
      invalidateRoster()
    },
    onError: (error) => {
      setActionError(
        getApiErrorMessage(error, 'Could not deactivate the student.'),
      )
    },
  })

  const onAddStudent = (values: AddStudentValues) => {
    setActionError(null)
    addMutation.mutate(values)
  }

  const onBulkAdd = (values: BulkAddValues) => {
    setActionError(null)
    const fullNames = values.namesText
      .split('\n')
      .map((name) => name.trim())
      .filter((name) => name.length > 0)
    if (fullNames.length === 0) {
      setActionError('Enter at least one student name.')
      return
    }
    bulkMutation.mutate(fullNames)
  }

  const copyPin = async (pin: string) => {
    await navigator.clipboard.writeText(pin)
    setCopiedPin(pin)
  }

  /** Dismissing the notice drops the PIN-bearing mutations entirely:
   * resetting an observer alone leaves its result in the mutation
   * cache, so the cache is cleared as well — a one-time PIN must not
   * linger anywhere once it has been dismissed. */
  const dismissPinNotice = () => {
    setPinNotice(null)
    setCopiedPin(null)
    addMutation.reset()
    bulkMutation.reset()
    resetPinMutation.reset()
    queryClient.getMutationCache().clear()
  }

  const students = rosterQuery.data ?? []

  return (
    <div className="mt-4 border-t border-card-border pt-4">
      <h3 className="font-display text-sm font-bold">Roster</h3>

      {actionError !== null && (
        <p
          role="alert"
          className="mt-3 rounded-lg bg-rose-weak/10 px-3 py-2 text-sm text-rose-weak"
        >
          {actionError}
        </p>
      )}

      {pinNotice !== null && (
        <div className="mt-3 rounded-xl border border-emerald-progress/40 bg-emerald-progress/10 p-4">
          <p className="text-sm font-semibold">
            Student PINs — save these now
          </p>
          <p className="mt-1 text-xs text-ink/60">
            PINs are shown once and cannot be retrieved later. Share each PIN
            privately with the student.
          </p>
          <ul className="mt-2 space-y-1">
            {pinNotice.map((entry) => (
              <li
                key={entry.membershipId}
                className="flex items-center gap-3 text-sm"
              >
                <span>{entry.fullName}</span>
                <code className="rounded bg-white px-2 py-0.5 font-mono font-bold">
                  {entry.pin}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    void copyPin(entry.pin)
                  }}
                  className="text-xs font-semibold text-indigo-primary hover:underline"
                >
                  {copiedPin === entry.pin ? 'Copied' : 'Copy PIN'}
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={dismissPinNotice}
            className="mt-3 rounded-full border border-card-border bg-white px-4 py-1.5 text-xs font-semibold hover:bg-paper"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <form
          noValidate
          onSubmit={addForm.handleSubmit(onAddStudent)}
          className="space-y-2"
        >
          <label
            htmlFor={`student-name-${batchId}`}
            className="block text-sm font-medium"
          >
            Student name
          </label>
          <div className="flex gap-2">
            <input
              id={`student-name-${batchId}`}
              className={inputClassName}
              {...addForm.register('fullName')}
            />
            <button
              type="submit"
              className="shrink-0 rounded-full bg-indigo-primary px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Add student
            </button>
          </div>
          {addForm.formState.errors.fullName && (
            <p role="alert" className="text-sm text-rose-weak">
              {addForm.formState.errors.fullName.message}
            </p>
          )}
        </form>

        <form
          noValidate
          onSubmit={bulkForm.handleSubmit(onBulkAdd)}
          className="space-y-2"
        >
          <label
            htmlFor={`student-names-${batchId}`}
            className="block text-sm font-medium"
          >
            Student names (one per line)
          </label>
          <textarea
            id={`student-names-${batchId}`}
            rows={3}
            className={inputClassName}
            {...bulkForm.register('namesText')}
          />
          {bulkForm.formState.errors.namesText && (
            <p role="alert" className="text-sm text-rose-weak">
              {bulkForm.formState.errors.namesText.message}
            </p>
          )}
          <button
            type="submit"
            className="rounded-full bg-indigo-primary px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Add students
          </button>
        </form>
      </div>

      <div className="mt-4">
        {rosterQuery.isPending ? (
          <p className="text-sm text-ink/60">Loading roster…</p>
        ) : rosterQuery.isError ? (
          <p role="alert" className="text-sm text-rose-weak">
            {getApiErrorMessage(
              rosterQuery.error,
              'Could not load the roster.',
            )}
          </p>
        ) : students.length === 0 ? (
          <p className="text-sm text-ink/60">No students on the roster yet.</p>
        ) : (
          <ul className="divide-y divide-card-border">
            {students.map((student) => (
              <li
                key={student.membershipId}
                className="flex flex-wrap items-center gap-3 py-2 text-sm"
              >
                <span className="font-medium">{student.fullName}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    student.status === 'ACTIVE'
                      ? 'bg-emerald-progress/15 text-emerald-progress'
                      : 'bg-ink/10 text-ink/60'
                  }`}
                >
                  {student.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                </span>
                {student.pinLocked && (
                  <span className="rounded-full bg-rose-weak/10 px-2 py-0.5 text-xs font-semibold text-rose-weak">
                    PIN locked
                  </span>
                )}
                {student.status === 'ACTIVE' && (
                  <span className="ml-auto flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActionError(null)
                        resetPinMutation.mutate(student)
                      }}
                      className="rounded-full border border-card-border px-3 py-1 text-xs font-semibold hover:bg-paper"
                    >
                      Reset PIN
                    </button>
                    {confirmingId === student.membershipId ? (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            deactivateMutation.mutate(student.membershipId)
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
                        onClick={() => setConfirmingId(student.membershipId)}
                        className="rounded-full border border-card-border px-3 py-1 text-xs font-semibold hover:bg-paper"
                      >
                        Deactivate
                      </button>
                    )}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
