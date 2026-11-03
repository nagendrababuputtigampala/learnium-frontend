import { useState } from 'react'

export default function CopyCode({ code }: { code: string }) {
  const [notice, setNotice] = useState('')
  return <div className="flex flex-wrap items-center gap-3">
    <code className="rounded-lg bg-paper px-4 py-2 font-mono text-xl font-bold tracking-widest">{code}</code>
    <button className="text-sm font-semibold text-indigo-primary" onClick={async () => {
      try { await navigator.clipboard.writeText(code); setNotice('Join code copied.') }
      catch { setNotice('Could not copy. Select and copy the join code above.') }
    }}>Copy join code</button>
    {notice && <p role="status" className="text-sm">{notice}</p>}
  </div>
}
