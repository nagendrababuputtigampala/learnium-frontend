import axios from 'axios'
import { getApiErrorMessage, type ApiErrorBody } from '../../lib/api'

export default function ApiFailure({ error, fallback }: { error: unknown; fallback: string }) {
  const fields = axios.isAxiosError<ApiErrorBody>(error) ? error.response?.data?.fieldErrors : undefined
  return <div role="alert" className="rounded-xl bg-rose-weak/10 p-4 text-sm text-rose-weak">
    <p>{getApiErrorMessage(error, fallback)}</p>
    {fields && <ul className="mt-2 list-disc pl-5">{Object.entries(fields).map(([field, reason]) => <li key={field}>{reason}</li>)}</ul>}
  </div>
}
