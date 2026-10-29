import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ExtractionStatusChip from './ExtractionStatusChip'

describe('ExtractionStatusChip', () => {
  it('renders the label for a known status', () => {
    render(<ExtractionStatusChip status="OK" />)
    expect(screen.getByText('Ready')).toBeInTheDocument()
  })

  it('renders the fallback label for a legacy material with no status', () => {
    render(<ExtractionStatusChip status={null} />)
    expect(screen.getByText('Not extracted')).toBeInTheDocument()
  })
})
