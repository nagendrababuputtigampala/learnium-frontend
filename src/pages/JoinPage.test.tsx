import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import JoinPage from './JoinPage'

describe('JoinPage', () => {
  it('redirects legacy student links to login', () => {
    render(<MemoryRouter initialEntries={['/join?batch=old']}><Routes><Route path="/join" element={<JoinPage />} /><Route path="/login" element={<p>Account login</p>} /></Routes></MemoryRouter>)
    expect(screen.getByText('Account login')).toBeInTheDocument()
  })
})
