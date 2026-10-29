import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { teacherUser } from './test/fixtures'
import App from './App'

const mock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  refreshAccessToken: vi.fn(),
  sessionExpired: { handler: null as (() => void) | null },
}))

vi.mock('./lib/api', async () => {
  const helper = await import('./test/mockApi')
  return helper.createMockApiModule(mock)
})

beforeEach(() => {
  window.history.pushState({}, '', '/')
  localStorage.clear()
  sessionStorage.clear()
  mock.get.mockReset()
  mock.post.mockReset()
  mock.refreshAccessToken.mockReset()
})

describe('App', () => {
  it('lands on the login page at the root URL when signed out', async () => {
    render(<App />)
    expect(await screen.findByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
  })

  it('restores a stored session and shows the Teacher Home', async () => {
    localStorage.setItem('learnium.refreshToken', 'stored-refresh')
    mock.refreshAccessToken.mockResolvedValue('fresh-access')
    mock.get.mockImplementation((url: string) => {
      if (url === '/me') {
        return Promise.resolve({ data: teacherUser })
      }
      if (url === '/batches') {
        return Promise.resolve({ data: [] })
      }
      return Promise.reject(new Error(`Unexpected GET ${url}`))
    })
    render(<App />)
    expect(
      await screen.findByRole('heading', { name: 'Teacher Home' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
  })
})
