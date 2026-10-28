import axios, { type AxiosInstance } from 'axios'

/**
 * Base URL for the Learnium backend API.
 * Override at build/serve time with the VITE_API_BASE_URL env var;
 * defaults to the same-origin path proxied to the backend.
 */
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

/** Creates an axios client bound to the given API base URL. */
export function createApiClient(baseURL: string): AxiosInstance {
  return axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

/** Shared API client used across the app. */
export const apiClient: AxiosInstance = createApiClient(API_BASE_URL)
