import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  apiClient,
  getApiErrorMessage,
  type CentreDto,
} from '../lib/api'
import { useAuth } from '../lib/auth'

const centreSettingsSchema = z.object({
  name: z.string().min(1, 'Centre name is required'),
  logoUrl: z.string(),
  contactEmail: z.string().email('Enter a valid email address'),
})

type CentreSettingsValues = z.infer<typeof centreSettingsSchema>

const inputClassName =
  'w-full rounded-lg border border-card-border px-3 py-2 text-sm outline-none focus:border-indigo-bright focus:ring-2 focus:ring-indigo-bright/30'

function SettingsForm({ centre }: { centre: CentreDto }) {
  const [saved, setSaved] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CentreSettingsValues>({
    resolver: zodResolver(centreSettingsSchema),
    defaultValues: {
      name: centre.name,
      logoUrl: centre.logoUrl,
      contactEmail: centre.contactEmail,
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (values: CentreSettingsValues) => {
      const response = await apiClient.put<CentreDto>('/centre', values)
      return response.data
    },
    onSuccess: () => {
      setSaved(true)
    },
    onError: (error) => {
      setErrorMessage(
        getApiErrorMessage(error, 'Could not save the settings.'),
      )
    },
  })

  const onSubmit = (values: CentreSettingsValues) => {
    setSaved(false)
    setErrorMessage(null)
    saveMutation.mutate(values)
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-2xl border border-card-border bg-white p-5 shadow-sm"
    >
      {saved && (
        <p className="rounded-lg bg-emerald-progress/10 px-3 py-2 text-sm text-emerald-progress">
          Settings saved.
        </p>
      )}
      {errorMessage !== null && (
        <p
          role="alert"
          className="rounded-lg bg-rose-weak/10 px-3 py-2 text-sm text-rose-weak"
        >
          {errorMessage}
        </p>
      )}
      <div>
        <label
          htmlFor="centre-name"
          className="mb-1 block text-sm font-medium"
        >
          Centre name
        </label>
        <input
          id="centre-name"
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
          htmlFor="centre-logo-url"
          className="mb-1 block text-sm font-medium"
        >
          Logo URL
        </label>
        <input
          id="centre-logo-url"
          className={inputClassName}
          {...register('logoUrl')}
        />
      </div>
      <div>
        <label
          htmlFor="centre-contact-email"
          className="mb-1 block text-sm font-medium"
        >
          Contact email
        </label>
        <input
          id="centre-contact-email"
          type="email"
          className={inputClassName}
          {...register('contactEmail')}
        />
        {errors.contactEmail && (
          <p role="alert" className="mt-1 text-sm text-rose-weak">
            {errors.contactEmail.message}
          </p>
        )}
      </div>
      <button
        type="submit"
        className="rounded-full bg-marigold px-5 py-2.5 text-sm font-semibold text-ink transition hover:brightness-95"
      >
        Save settings
      </button>
    </form>
  )
}

export default function CentreSettingsPage() {
  const { user } = useAuth()
  const centreQuery = useQuery({
    queryKey: ['centre', user?.centreId],
    queryFn: async () => {
      const response = await apiClient.get<CentreDto>('/centre')
      return response.data
    },
  })

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold">Centre Settings</h1>
        <p className="mt-1 text-sm text-ink/60">
          Your centre profile, shown to teachers, students and parents.
        </p>
      </header>
      {centreQuery.isPending ? (
        <p className="text-sm text-ink/60">Loading centre settings…</p>
      ) : centreQuery.isError ? (
        <p role="alert" className="text-sm text-rose-weak">
          {getApiErrorMessage(
            centreQuery.error,
            'Could not load centre settings.',
          )}
        </p>
      ) : (
        <SettingsForm centre={centreQuery.data} />
      )}
    </div>
  )
}
