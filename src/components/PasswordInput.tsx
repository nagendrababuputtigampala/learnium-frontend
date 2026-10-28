import { Eye, EyeOff } from 'lucide-react'
import { useState, type InputHTMLAttributes, type Ref } from 'react'

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  ref?: Ref<HTMLInputElement>
}

const inputClassName =
  'w-full rounded-lg border border-card-border px-3 py-2 pr-11 text-sm outline-none focus:border-indigo-bright focus:ring-2 focus:ring-indigo-bright/30'

/** Password field with an eye toggle that reveals the typed value. */
export default function PasswordInput({ ref, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <input
        ref={ref}
        {...props}
        type={visible ? 'text' : 'password'}
        className={inputClassName}
      />
      <button
        type="button"
        onClick={() => {
          setVisible((current) => !current)
        }}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-ink/50 transition hover:text-ink"
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  )
}
