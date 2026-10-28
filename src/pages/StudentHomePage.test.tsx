import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { saveStudentSession } from '../lib/api'
import { studentProfile } from '../test/fixtures'
import StudentHomePage from './StudentHomePage'

function renderStudent() {
  return render(
    <MemoryRouter initialEntries={['/student']}>
      <Routes>
        <Route path="/student" element={<StudentHomePage />} />
        <Route path="/join" element={<p>Join page</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

describe('StudentHomePage', () => {
  it('redirects to /join when there is no student session', () => {
    renderStudent()
    expect(screen.getByText('Join page')).toBeInTheDocument()
  })

  it('greets the student and shows the tests placeholder', () => {
    saveStudentSession({
      accessToken: 'student-token',
      tokenType: 'Bearer',
      expiresInSeconds: 43200,
      student: studentProfile,
    })
    renderStudent()
    expect(
      screen.getByRole('heading', { name: 'Welcome, Simran' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Grade 8 Math — Batch B')).toBeInTheDocument()
    expect(screen.getByText(/Your tests will appear here/)).toBeInTheDocument()
  })
})
