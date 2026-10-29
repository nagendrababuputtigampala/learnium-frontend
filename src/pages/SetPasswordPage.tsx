import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import PasswordInput from '../components/PasswordInput'
import { apiClient, getApiErrorMessage } from '../lib/api'

const setPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Use at least 8 characters')
      .regex(/[A-Za-z]/, 'Include at least one letter')
      .regex(/[0-9]/, 'Include at least one digit'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type SetPasswordFormValues = z.infer<typeof setPasswordSchema>

export default function SetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const isInvite = searchParams.get('purpose') === 'invite'
  const [done, setDone] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SetPasswordFormValues>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  if (token === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-4 font-body text-ink">
        <div className="w-full max-w-sm rounded-2xl border border-card-border bg-white p-8 shadow-sm">
          <h1 className="font-display text-xl font-bold">
            This link is not valid
          </h1>
          <p className="mt-2 text-sm text-ink/70">
            The link is missing its security token. Ask your centre admin for a
            new invite, or request a fresh password reset.
          </p>
          <Link
            to="/login"
            className="mt-6 block text-center text-sm font-medium text-indigo-primary hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  const onSubmit = async (values: SetPasswordFormValues) => {
    setErrorMessage(null)
    try {
      await apiClient.post(
        isInvite ? '/auth/accept-invite' : '/auth/reset-password',
        { token, newPassword: values.newPassword },
      )
      setDone(true)
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          'Could not set your password. The link may have expired.',
        ),
      )
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 font-body text-ink">
      <div className="w-full max-w-sm rounded-2xl border border-card-border bg-white p-8 shadow-sm">
        <h1 className="font-display text-xl font-bold">
          {isInvite ? 'Set your password' : 'Choose a new password'}
        </h1>
        {done ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-ink/70">
              Your password is set. You can now sign in with your email and new
              password.
            </p>
            <Link
              to="/login"
              className="block rounded-full bg-marigold px-5 py-2.5 text-center text-sm font-semibold text-ink transition hover:brightness-95"
            >
              Go to sign in
            </Link>
          </div>
        ) : (
          <form
            noValidate
            onSubmit={handleSubmit(onSubmit)}
            className="mt-4 space-y-4"
          >
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
                htmlFor="newPassword"
                className="mb-1 block text-sm font-medium"
              >
                New password
              </label>
              <PasswordInput
                id="newPassword"
                autoComplete="new-password"
                {...register('newPassword')}
              />
              {errors.newPassword && (
                <p role="alert" className="mt-1 text-sm text-rose-weak">
                  {errors.newPassword.message}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1 block text-sm font-medium"
              >
                Confirm password
              </label>
              <PasswordInput
                id="confirmPassword"
                autoComplete="new-password"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p role="alert" className="mt-1 text-sm text-rose-weak">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-marigold px-5 py-2.5 text-sm font-semibold text-ink transition hover:brightness-95 disabled:opacity-60"
            >
              Set password
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
