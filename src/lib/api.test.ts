import { AxiosHeaders } from 'axios'
import { describe, expect, it, vi } from 'vitest'
import { API_BASE_URL, apiClient, createApiClient } from './api'

describe('api client', () => {
  it('defaults the base URL to /api/v1 when no env override is set', () => {
    expect(API_BASE_URL).toBe('/api/v1')
  })

  it('creates a client with the given base URL and JSON content type', () => {
    const client = createApiClient('https://example.test/api/v9')
    expect(client.defaults.baseURL).toBe('https://example.test/api/v9')
    const headers = AxiosHeaders.from(client.defaults.headers)
    expect(headers.get('Content-Type')).toBe('application/json')
  })

  it('exposes a shared client bound to the module base URL', () => {
    expect(apiClient.defaults.baseURL).toBe(API_BASE_URL)
  })

  it('uses the VITE_API_BASE_URL env override when set', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test/v2')
    vi.resetModules()
    try {
      const mod = await import('./api')
      expect(mod.API_BASE_URL).toBe('https://api.example.test/v2')
      expect(mod.apiClient.defaults.baseURL).toBe(
        'https://api.example.test/v2',
      )
    } finally {
      vi.unstubAllEnvs()
      vi.resetModules()
    }
  })
})
