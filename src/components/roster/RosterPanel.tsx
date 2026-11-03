import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { apiClient, getApiErrorMessage, type CreatedStudent, type PageResponse, type RosterStudent, type StudentLookup } from '../../lib/api'
import { useAuth } from '../../lib/auth'

const schema = z.object({
  displayName: z.string().trim().min(1, 'Student name is required'),
  contactEmail: z.union([z.literal(''), z.email('Enter a valid contact email')]),
  username: z.string().trim().min(3, 'Username must be at least 3 characters'),
  userId: z.string(),
})
const bulkSchema = z.object({ namesText: z.string().min(1, 'Enter at least one student name') })
type Values = z.infer<typeof schema>
type BulkValues = z.infer<typeof bulkSchema>
const input = 'w-full rounded-lg border border-card-border px-3 py-2 text-sm outline-none focus:border-indigo-bright focus:ring-2 focus:ring-indigo-bright/30'

function suggest(name: string) {
  const words = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
  if (words.length === 0) return ''
  const value = words.length === 1 ? words[0] : `${words[0]}.${words.at(-1)?.[0]}`
  return value.length >= 3 ? value.slice(0, 30) : `${value}student`.slice(0, 3)
}

export default function RosterPanel({ batchId }: { batchId: string }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [customUsername, setCustomUsername] = useState(false)
  const [renameId, setRenameId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const key = ['roster', user?.centreId, batchId]
  const roster = useQuery({ queryKey: key, queryFn: async () => (await apiClient.get<RosterStudent[]>(`/batches/${batchId}/students`)).data })
  const centreStudents = useQuery({ queryKey: ['centre-students', user?.centreId], queryFn: async () => (await apiClient.get<PageResponse<StudentLookup>>('/centre/students?size=100')).data.content })
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { displayName: '', contactEmail: '', username: '', userId: '' } })
  const bulk = useForm<BulkValues>({ resolver: zodResolver(bulkSchema), defaultValues: { namesText: '' } })
  const displayName = form.watch('displayName')
  const username = form.watch('username')
  const selectedUserId = form.watch('userId')

  useEffect(() => {
    if (!customUsername && selectedUserId === '') form.setValue('username', suggest(displayName), { shouldValidate: false })
  }, [customUsername, displayName, form, selectedUserId])

  const usernameCheck = useQuery({
    queryKey: ['username-check', user?.centreId, username],
    queryFn: async () => (await apiClient.get<{ available: boolean }>(`/centre/username-check?value=${encodeURIComponent(username)}`)).data.available,
    enabled: selectedUserId === '' && username.length >= 3,
    staleTime: 5_000,
  })
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: key })
    void queryClient.invalidateQueries({ queryKey: ['batches'] })
    void queryClient.invalidateQueries({ queryKey: ['centre-students', user?.centreId] })
  }
  const add = useMutation({
    mutationFn: async (values: Values) => (await apiClient.post<CreatedStudent>(`/batches/${batchId}/students`, values.userId ? { displayName: values.displayName, userId: values.userId } : { displayName: values.displayName, contactEmail: values.contactEmail || null, username: values.username })).data,
    onSuccess: (created) => { setNotice(`${created.displayName} added as ${created.username}@${user?.centreCode}. Invite: ${created.inviteStatus.toLowerCase().replace('_', ' ')}.`); form.reset(); setCustomUsername(false); invalidate() },
    onError: (caught) => setError(getApiErrorMessage(caught, 'Could not add the student.')),
  })
  const bulkAdd = useMutation({
    mutationFn: async (names: string[]) => (await apiClient.post<CreatedStudent[]>(`/batches/${batchId}/students/bulk`, { fullNames: names })).data,
    onSuccess: (created) => { setNotice(`${created.length} students added with usernames.`); bulk.reset(); invalidate() },
    onError: (caught) => setError(getApiErrorMessage(caught, 'Could not add the students.')),
  })
  const resend = useMutation({ mutationFn: async (student: RosterStudent) => apiClient.post(`/batches/${batchId}/students/${student.userId}/resend-invite`), onSuccess: () => { setNotice('Invite resent.'); invalidate() }, onError: (caught) => setError(getApiErrorMessage(caught, 'Could not resend the invite.')) })
  const rename = useMutation({ mutationFn: async (student: RosterStudent) => apiClient.put(`/batches/${batchId}/students/${student.userId}/username`, { username: renameValue }), onSuccess: () => { setRenameId(null); invalidate() }, onError: (caught) => setError(getApiErrorMessage(caught, 'Could not update the username.')) })
  const deactivate = useMutation({ mutationFn: async (membershipId: string) => apiClient.delete(`/batches/${batchId}/students/${membershipId}`), onSuccess: invalidate, onError: (caught) => setError(getApiErrorMessage(caught, 'Could not deactivate the student.')) })

  const chooseExisting = (id: string) => {
    form.setValue('userId', id)
    const student = centreStudents.data?.find((item) => item.id === id)
    if (student) { form.setValue('displayName', student.displayName); form.setValue('username', student.username) }
  }

  return <section className="mt-4 border-t border-card-border pt-4">
    <h3 className="font-display text-sm font-bold">Roster</h3>
    {error && <p role="alert" className="mt-3 rounded-lg bg-rose-weak/10 px-3 py-2 text-sm text-rose-weak">{error}</p>}
    {notice && <p role="status" className="mt-3 rounded-lg bg-emerald-progress/10 px-3 py-2 text-sm text-emerald-progress">{notice}</p>}
    <div className="mt-4 grid gap-5 lg:grid-cols-2">
      <form noValidate onSubmit={form.handleSubmit((values) => { setError(null); add.mutate(values) })} className="space-y-3 rounded-xl bg-paper p-4">
        <label className="block text-sm font-medium">Use an existing student<select aria-label="Use an existing student" className={`${input} mt-1`} value={selectedUserId} onChange={(event) => chooseExisting(event.target.value)}><option value="">Create a new student</option>{centreStudents.data?.map((student) => <option key={student.id} value={student.id}>{student.displayName} ({student.username})</option>)}</select></label>
        <label className="block text-sm font-medium">Student name<input className={`${input} mt-1`} disabled={selectedUserId !== ''} {...form.register('displayName')} /></label>
        {form.formState.errors.displayName && <p role="alert" className="text-sm text-rose-weak">{form.formState.errors.displayName.message}</p>}
        {selectedUserId === '' && <><label className="block text-sm font-medium">Contact email (optional)<input className={`${input} mt-1`} type="email" {...form.register('contactEmail')} /></label><label className="block text-sm font-medium">Username<div className="mt-1 flex items-center"><input aria-label="Username" className={`${input} rounded-r-none`} {...form.register('username', { onChange: () => setCustomUsername(true) })} /><span className="rounded-r-lg border border-l-0 border-card-border bg-white px-3 py-2 text-sm text-ink/60">@{user?.centreCode}</span></div></label><p className={`text-xs ${usernameCheck.data === true ? 'text-emerald-progress' : usernameCheck.data === false ? 'text-rose-weak' : 'text-ink/50'}`}>{usernameCheck.isFetching ? 'Checking availability…' : usernameCheck.data === true ? 'Username is available' : usernameCheck.data === false ? 'Username is unavailable' : '3–30 lowercase letters, digits or dots'}</p></>}
        <button type="submit" disabled={add.isPending || (selectedUserId === '' && usernameCheck.data !== true)} className="rounded-full bg-indigo-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Add student</button>
      </form>
      <form onSubmit={bulk.handleSubmit((values) => bulkAdd.mutate(values.namesText.split('\n').map((name) => name.trim()).filter(Boolean)))} className="space-y-3 rounded-xl bg-paper p-4"><label className="block text-sm font-medium">Student names (one per line)<textarea rows={5} className={`${input} mt-1`} {...bulk.register('namesText')} /></label>{bulk.formState.errors.namesText && <p role="alert" className="text-sm text-rose-weak">{bulk.formState.errors.namesText.message}</p>}<button type="submit" className="rounded-full border border-indigo-primary px-4 py-2 text-sm font-semibold text-indigo-primary">Add students</button></form>
    </div>
    <div className="mt-5">{roster.isPending ? <p className="text-sm text-ink/60">Loading roster…</p> : roster.isError ? <p role="alert" className="text-sm text-rose-weak">{getApiErrorMessage(roster.error, 'Could not load the roster.')}</p> : roster.data?.length === 0 ? <p className="text-sm text-ink/60">No students on the roster yet.</p> : <ul className="divide-y divide-card-border">{roster.data?.map((student) => <li key={student.membershipId} className="flex flex-wrap items-center gap-3 py-3 text-sm"><div className="min-w-44"><p className="font-semibold">{student.displayName}</p><p className="text-xs text-ink/55">{student.username}@{user?.centreCode}</p></div><span className="rounded-full bg-indigo-primary/10 px-2 py-1 text-xs font-semibold">{student.inviteStatus.replace('_', ' ')}</span>{renameId === student.userId ? <span className="flex gap-2"><input aria-label={`Username for ${student.displayName}`} className="rounded border border-card-border px-2 py-1" value={renameValue} onChange={(event) => setRenameValue(event.target.value)} /><button type="button" onClick={() => rename.mutate(student)} className="font-semibold text-indigo-primary">Save</button></span> : <button type="button" onClick={() => { setRenameId(student.userId); setRenameValue(student.username) }} className="text-xs font-semibold text-indigo-primary">Edit username</button>}<span className="ml-auto flex gap-2">{student.inviteStatus === 'PENDING' && <button type="button" onClick={() => resend.mutate(student)} className="rounded-full border border-card-border px-3 py-1 text-xs font-semibold">Resend invite</button>}<button type="button" onClick={() => deactivate.mutate(student.membershipId)} className="rounded-full border border-card-border px-3 py-1 text-xs font-semibold">Deactivate</button></span></li>)}</ul>}</div>
  </section>
}
