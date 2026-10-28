import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import HomePage from './HomePage'

describe('HomePage', () => {
  it('renders the Teacher Home heading and batch context', () => {
    render(<HomePage />)
    expect(
      screen.getByRole('heading', { name: 'Teacher Home' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Grade 8 Math — Batch B')).toBeInTheDocument()
  })

  it('renders the primary call to action', () => {
    render(<HomePage />)
    expect(
      screen.getByRole('button', { name: 'Create test from a chapter' }),
    ).toBeInTheDocument()
  })

  it('renders the weekly stat cards', () => {
    render(<HomePage />)
    expect(screen.getByText('Tests this week')).toBeInTheDocument()
    expect(screen.getByText('6')).toBeInTheDocument()
    expect(screen.getByText('Students active')).toBeInTheDocument()
    expect(screen.getByText('24')).toBeInTheDocument()
    expect(screen.getByText('Answers to mark')).toBeInTheDocument()
    expect(screen.getByText('9')).toBeInTheDocument()
  })

  it('renders weak topics with heat bars at the right widths', () => {
    render(<HomePage />)
    expect(screen.getByText('Adding unlike denominators')).toBeInTheDocument()
    expect(screen.getByText('Word problems')).toBeInTheDocument()
    expect(screen.getByText('Equivalent fractions')).toBeInTheDocument()

    const bars = screen.getAllByTestId('heat-bar')
    expect(bars).toHaveLength(3)
    expect(bars[0]).toHaveStyle({ width: '52%' })
    expect(bars[0]).toHaveClass('bg-rose-weak')
    expect(bars[1]).toHaveStyle({ width: '61%' })
    expect(bars[1]).toHaveClass('bg-marigold')
    expect(bars[2]).toHaveStyle({ width: '88%' })
    expect(bars[2]).toHaveClass('bg-emerald-progress')
    expect(screen.getByText('52%')).toBeInTheDocument()
    expect(screen.getByText('61%')).toBeInTheDocument()
    expect(screen.getByText('88%')).toBeInTheDocument()
  })
})
