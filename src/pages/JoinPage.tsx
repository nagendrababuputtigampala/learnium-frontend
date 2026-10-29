import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import signInBackground from '../assets/signin-background.svg'
import {
  apiClient,
  getApiErrorMessage,
  type PublicBatch,
  type PublicCentre,
} from '../lib/api'
import { useAuth } from '../lib/auth'

const joinSchema = z.object({
  fullName: z.string().min(1, 'Enter your full name'),
  pin: z.string().min(1, 'Enter your PIN'),
})

type JoinFormValues = z.infer<typeof joinSchema>

const inputClassName =
  'w-full rounded-lg border border-card-border px-3 py-2 text-sm outline-none focus:border-indigo-bright focus:ring-2 focus:ring-indigo-bright/30'

export default function JoinPage() {
  const [searchParams] = useSearchParams()
  const batchParam = searchParams.get('batch')
  const { studentSession } = useAuth()
  const navigate = useNavigate()
  const [centreId, setCentreId] = useState('')
  const [batchId, setBatchId] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const centresQuery = useQuery({
    queryKey: ['public-centres'],
    queryFn: async () => {
      const response = await apiClient.get<PublicCentre[]>('/public/centres')
      return response.data
    },
  })

  const batchesQuery = useQuery({
    queryKey: ['public-batches', centreId],
    queryFn: async () => {
      const response = await apiClient.get<PublicBatch[]>(
        `/public/centres/${centreId}/batches`,
      )
      return response.data
    },
    enabled: centreId !== '',
  })

  const lookupQuery = useQuery({
    queryKey: ['public-batch-lookup', batchParam],
    queryFn: async () => {
      // The query is only enabled once the centre list has loaded.
      const centres = centresQuery.data as PublicCentre[]
      const results = await Promise.all(
        centres.map(async (centre) => {
          const response = await apiClient.get<PublicBatch[]>(
            `/public/centres/${centre.centreId}/batches`,
          )
          return { centreId: centre.centreId, batches: response.data }
        }),
      )
      const match = results.find((result) =>
        result.batches.some((batch) => batch.batchId === batchParam),
      )
      return match === undefined
        ? null
        : { centreId: match.centreId, batchId: batchParam as string }
    },
    enabled: batchParam !== null && centresQuery.data !== undefined,
  })

  useEffect(() => {
    if (lookupQuery.data) {
      setCentreId(lookupQuery.data.centreId)
      setBatchId(lookupQuery.data.batchId)
    }
  }, [lookupQuery.data])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<JoinFormValues>({
    resolver: zodResolver(joinSchema),
    defaultValues: { fullName: '', pin: '' },
  })

  const onSubmit = async (values: JoinFormValues) => {
    if (batchId === '') {
      setFormError('Choose your batch to continue.')
      return
    }
    setFormError(null)
    try {
      await studentSession(batchId, values.fullName, values.pin)
      navigate('/student')
    } catch (error) {
      setFormError(
        getApiErrorMessage(
          error,
          'Could not join. Check your name and PIN, then try again.',
        ),
      )
    }
  }

  const centres = centresQuery.data ?? []
  const batches = batchesQuery.data ?? []

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-paper bg-cover bg-center px-4 font-body text-ink"
      style={{ backgroundImage: `url("${signInBackground}")` }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-card-border bg-white p-8 shadow-sm">
        <Link
          to="/login"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-primary hover:underline"
        >
          <ArrowLeft size={16} />
          Back to sign in
        </Link>
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-primary font-display text-xl font-bold text-white">
            L
          </span>
          <h1 className="font-display text-xl font-bold">Join your test</h1>
        </div>
        <p className="mb-4 text-sm text-ink/70">
          Pick your centre and batch, then enter the name and PIN from your
          teacher&rsquo;s roster sheet.
        </p>

        {centresQuery.isError && (
          <p
            role="alert"
            className="mb-4 rounded-lg bg-rose-weak/10 px-3 py-2 text-sm text-rose-weak"
          >
            {getApiErrorMessage(
              centresQuery.error,
              'Could not load the centre list.',
            )}
          </p>
        )}

        <div className="space-y-4">
          <div>
            <label
              htmlFor="join-centre"
              className="mb-1 block text-sm font-medium"
            >
              Centre
            </label>
            <select
              id="join-centre"
              className={inputClassName}
              value={centreId}
              onChange={(event) => {
                setCentreId(event.target.value)
                setBatchId('')
              }}
            >
              <option value="">Select your centre</option>
              {centres.map((centre) => (
                <option key={centre.centreId} value={centre.centreId}>
                  {centre.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="join-batch"
              className="mb-1 block text-sm font-medium"
            >
              Batch
            </label>
            <select
              id="join-batch"
              className={inputClassName}
              value={batchId}
              disabled={centreId === ''}
              onChange={(event) => setBatchId(event.target.value)}
            >
              <option value="">Select your batch</option>
              {batches.map((batch) => (
                <option key={batch.batchId} value={batch.batchId}>
                  {batch.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="mt-4 space-y-4"
        >
          {formError !== null && (
            <p
              role="alert"
              className="rounded-lg bg-rose-weak/10 px-3 py-2 text-sm text-rose-weak"
            >
              {formError}
            </p>
          )}
          <div>
            <label
              htmlFor="fullName"
              className="mb-1 block text-sm font-medium"
            >
              Full name
            </label>
            <input
              id="fullName"
              autoComplete="name"
              className={inputClassName}
              {...register('fullName')}
            />
            {errors.fullName && (
              <p role="alert" className="mt-1 text-sm text-rose-weak">
                {errors.fullName.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="pin" className="mb-1 block text-sm font-medium">
              PIN
            </label>
            <input
              id="pin"
              inputMode="numeric"
              autoComplete="off"
              className={inputClassName}
              {...register('pin')}
            />
            {errors.pin && (
              <p role="alert" className="mt-1 text-sm text-rose-weak">
                {errors.pin.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-marigold px-5 py-2.5 text-sm font-semibold text-ink transition hover:brightness-95 disabled:opacity-60"
          >
            Join test
          </button>
        </form>
      </div>
    </div>
  )
}
