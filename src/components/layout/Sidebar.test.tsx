import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import Sidebar from './Sidebar'

const NAV_LABELS = [
  'Home',
  'My Materials',
  'Tests',
  'Question Bank',
  'Batches',
  'Marking',
  'Reports',
  'Settings',
]

function renderSidebar(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Sidebar />
    </MemoryRouter>,
  )
}

describe('Sidebar', () => {
  it('renders the Learnium brand', () => {
    renderSidebar()
    expect(screen.getByText('Learn')).toBeInTheDocument()
    expect(screen.getByText('ium')).toBeInTheDocument()
  })

  it('renders every navigation item as a link', () => {
    renderSidebar()
    for (const label of NAV_LABELS) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument()
    }
  })

  it('marks Home as the active page at the root route', () => {
    renderSidebar('/')
    const home = screen.getByRole('link', { name: 'Home' })
    expect(home).toHaveAttribute('aria-current', 'page')
    expect(home).toHaveClass('bg-indigo-primary')
  })

  it('does not mark other items as active at the root route', () => {
    renderSidebar('/')
    const tests = screen.getByRole('link', { name: 'Tests' })
    expect(tests).not.toHaveAttribute('aria-current')
    expect(tests).not.toHaveClass('bg-indigo-primary')
  })
})
