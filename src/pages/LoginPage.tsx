import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import signInBackground from '../assets/signin-background.svg'
import PasswordInput from '../components/PasswordInput'
import { getApiErrorMessage } from '../lib/api'
import { useAuth } from '../lib/auth'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormValues = z.infer<typeof loginSchema>

const inputClassName =
  'w-full rounded-lg border border-card-border px-3 py-2 text-sm outline-none focus:border-indigo-bright focus:ring-2 focus:ring-indigo-bright/30'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values: LoginFormValues) => {
    setErrorMessage(null)
    try {
      const user = await login(values.email, values.password)
      navigate(user.role === 'CENTRE_ADMIN' ? '/admin' : '/', {
        replace: true,
      })
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          'Sign-in failed. Please check your details and try again.',
        ),
      )
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-paper bg-cover bg-center px-4 font-body text-ink"
      style={{ backgroundImage: `url("${signInBackground}")` }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-card-border bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-primary font-display text-xl font-bold text-white">
            L
          </span>
          <h1 className="font-display text-xl font-bold">
            Sign in to Learn<span className="text-marigold">ium</span>
          </h1>
        </div>
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {errorMessage !== null && (
            <p
              role="alert"
              className="rounded-lg bg-rose-weak/10 px-3 py-2 text-sm text-rose-weak"
            >
              {errorMessage}
            </p>
          )}
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className={inputClassName}
              {...register('email')}
            />
            {errors.email && (
              <p role="alert" className="mt-1 text-sm text-rose-weak">
                {errors.email.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium"
            >
              Password
            </label>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              {...register('password')}
            />
            {errors.password && (
              <p role="alert" className="mt-1 text-sm text-rose-weak">
                {errors.password.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-marigold px-5 py-2.5 text-sm font-semibold text-ink transition hover:brightness-95 disabled:opacity-60"
          >
            Sign in
          </button>
        </form>
        <div className="mt-6 flex flex-col gap-2 text-center text-sm">
          <Link
            to="/forgot-password"
            className="font-medium text-indigo-primary hover:underline"
          >
            Forgot your password?
          </Link>
          <Link
            to="/join"
            className="font-medium text-indigo-primary hover:underline"
          >
            Joining a test as a student?
          </Link>
        </div>
      </div>
    </div>
  )
}
