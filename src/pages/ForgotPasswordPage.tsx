import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { apiClient, getApiErrorMessage } from '../lib/api'

const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address'),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setErrorMessage(null)
    try {
      await apiClient.post('/auth/forgot-password', { email: values.email })
      setSent(true)
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          'Could not send the reset email. Please try again.',
        ),
      )
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 font-body text-ink">
      <div className="w-full max-w-sm rounded-2xl border border-card-border bg-white p-8 shadow-sm">
        <h1 className="font-display text-xl font-bold">Reset your password</h1>
        {sent ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-ink/70">
              If an account exists for that email, we&rsquo;ve sent a password
              reset link. The link expires in one hour.
            </p>
            <Link
              to="/login"
              className="block text-center text-sm font-medium text-indigo-primary hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-ink/70">
              Enter your account email and we&rsquo;ll send you a link to set a
              new password.
            </p>
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
                  htmlFor="email"
                  className="mb-1 block text-sm font-medium"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="w-full rounded-lg border border-card-border px-3 py-2 text-sm outline-none focus:border-indigo-bright focus:ring-2 focus:ring-indigo-bright/30"
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
                disabled={isSubmitting}
                className="w-full rounded-full bg-marigold px-5 py-2.5 text-sm font-semibold text-ink transition hover:brightness-95 disabled:opacity-60"
              >
                Send reset link
              </button>
            </form>
            <Link
              to="/login"
              className="mt-6 block text-center text-sm font-medium text-indigo-primary hover:underline"
            >
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
