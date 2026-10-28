import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the app shell with Teacher Home at the root URL', () => {
    render(<App />)
    expect(
      screen.getByRole('heading', { name: 'Teacher Home' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
  })
})
