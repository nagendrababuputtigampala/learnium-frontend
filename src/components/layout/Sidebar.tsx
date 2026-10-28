import { NavLink } from 'react-router-dom'

interface NavItem {
  label: string
  to: string
  end?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', to: '/', end: true },
  { label: 'My Materials', to: '/materials' },
  { label: 'Tests', to: '/tests' },
  { label: 'Question Bank', to: '/question-bank' },
  { label: 'Batches', to: '/batches' },
  { label: 'Marking', to: '/marking' },
  { label: 'Reports', to: '/reports' },
  { label: 'Settings', to: '/settings' },
]

export default function Sidebar() {
  return (
    <aside className="flex w-60 shrink-0 flex-col bg-indigo-deep px-4 py-6 text-white">
      <div className="mb-8 flex items-center gap-3 px-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-primary font-display text-xl font-bold">
          L
        </span>
        <span className="font-display text-lg font-bold tracking-tight">
          Learn<span className="text-marigold">ium</span>
        </span>
      </div>
      <nav aria-label="Primary" className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-primary text-white'
                  : 'text-indigo-100 hover:bg-indigo-primary/40 hover:text-white'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
