import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './api'

export type IntegrityEventType = 'TAB_HIDDEN' | 'FOCUS_LOST' | 'MOUSE_LEFT' | 'FULLSCREEN_EXIT' | 'CAMERA_LOST'
export interface IntegrityEventInput { type: IntegrityEventType; occurredAt: string }
export interface IntegrityEventItem { eventId: string; type: IntegrityEventType; occurredAt: string }
export type SnapshotReason = 'PRE_TEST' | 'PERIODIC' | 'EVENT'
export interface SnapshotItem { snapshotId: string; reason: SnapshotReason; capturedAt: string }
export interface CameraCheckResult { checkToken: string; expiresAt: string }

export interface InstanceAttempt {
  attemptId: string
  studentId: string
  displayName: string
  username: string | null
  attemptNo: number
  status: string
  startedAt: string
  submittedAt: string | null
  score: number | null
  maxScore: number
  markingPending: boolean
  flags: Record<string, number>
  flagTotal: number
}

/** Sends one batch of integrity events; the server drops them silently when signals are off. */
export async function recordIntegrityEvents(attemptId: string, events: IntegrityEventInput[]): Promise<void> {
  await apiClient.post(`/student/attempts/${attemptId}/integrity-events`, { events })
}

/** Uploads the pre-test frame; the returned token unlocks one start of a camera-ON test. */
export async function submitCameraCheck(instanceId: string, frame: Blob): Promise<CameraCheckResult> {
  const form = new FormData()
  form.append('file', frame, 'camera-check.jpg')
  return (await apiClient.post<CameraCheckResult>(`/student/tests/${instanceId}/camera-check`, form)).data
}

/** Uploads one in-attempt frame (periodic cadence or integrity-event triggered). */
export async function uploadSnapshot(attemptId: string, frame: Blob, reason: Exclude<SnapshotReason, 'PRE_TEST'>): Promise<void> {
  const form = new FormData()
  form.append('file', frame, 'snapshot.jpg')
  form.append('reason', reason)
  await apiClient.post(`/student/attempts/${attemptId}/snapshots`, form)
}

export const instanceAttemptsKey = (instanceId: string) => ['instance-attempts', instanceId] as const

export function useInstanceAttempts(instanceId: string) {
  return useQuery({
    queryKey: instanceAttemptsKey(instanceId),
    queryFn: async () => (await apiClient.get<InstanceAttempt[]>(`/instances/${instanceId}/attempts`)).data,
    enabled: instanceId !== '',
  })
}

export function useAttemptTimeline(attemptId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['attempt-timeline', attemptId],
    queryFn: async () => (await apiClient.get<IntegrityEventItem[]>(`/attempts/${attemptId}/integrity-events`)).data,
    enabled: enabled && attemptId !== '',
  })
}

export function useAttemptSnapshots(attemptId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['attempt-snapshots', attemptId],
    queryFn: async () => (await apiClient.get<SnapshotItem[]>(`/attempts/${attemptId}/snapshots`)).data,
    enabled: enabled && attemptId !== '',
  })
}

export function useInvalidateAttempt(instanceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (attemptId: string) =>
      (await apiClient.post<InstanceAttempt>(`/attempts/${attemptId}/invalidate`)).data,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: instanceAttemptsKey(instanceId) })
    },
  })
}

/** Fetches one snapshot image through the authenticated client and returns an object URL for it. */
export async function fetchSnapshotObjectUrl(attemptId: string, snapshotId: string): Promise<string> {
  const response = await apiClient.get<Blob>(`/attempts/${attemptId}/snapshots/${snapshotId}`, { responseType: 'blob' })
  return URL.createObjectURL(response.data)
}
