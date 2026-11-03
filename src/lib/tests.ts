import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient, type BatchDto, type RosterStudent, type QuestionTypeCode } from './api'
import { useAuth } from './auth'

export type TestKind = 'SCORED_TEST' | 'FLASHCARD_PRACTICE'
export interface TestItem {
  questionId: string; type: QuestionTypeCode; topicName: string; marks: number; displayOrder: number
  payload: Record<string, unknown>; correctRef: string
}
export interface Definition {
  id: string; name: string; kind: TestKind; gradeSubjectId: string; gradeName: string; subjectName: string
  createdBy: string; questionCount: number; totalMarks: number; publishedInstanceCount: number; items: TestItem[]
}
export interface SelectedItem { questionId: string; type: QuestionTypeCode; preview: string; marks: string }
export interface DefinitionRequest { name: string; gradeSubjectId: string; kind: TestKind; items: { questionId: string; marks: number }[] }
export interface PublishRequest {
  batchId: string; opensAt: string; closesAt: string; timeLimitSeconds?: number; maxAttempts: number
  answerReleasePolicy: 'AFTER_CLOSE' | 'ON_SUBMIT' | 'NEVER'; integrityEnabled: boolean; cameraMode: 'OFF' | 'ON'
  items: { questionId: string; marks: number }[]
}
export interface Instance {
  id: string; testId: string; name: string; kind: TestKind; batchId: string; batchName: string
  joinCode: string; status: 'SCHEDULED' | 'OPEN' | 'CLOSED'; opensAt: string; closesAt: string; closedAt: string | null
  timeLimitSeconds: number | null; maxAttempts: number; answerReleasePolicy: string; integrityEnabled: boolean; cameraMode: string
  items: TestItem[]; students: { userId: string; name: string; addedBy: string; addedAt: string }[]
}
export const kindLabel = (kind: TestKind) => kind === 'SCORED_TEST' ? 'Scored test' : 'Flashcard practice'
export const selectedItems = (items: TestItem[]): SelectedItem[] => items.map(item => ({
  questionId: item.questionId, type: item.type,
  preview: String(item.payload.stem ?? item.payload.stemWithBlank ?? item.payload.front ?? ''), marks: item.marks.toFixed(2),
}))
export function validMarks(value: string, kind: TestKind): boolean {
  return /^\d+(\.\d{1,2})?$/.test(value) && Number(value) <= 9999.99 && (kind === 'SCORED_TEST' ? Number(value) > 0 : Number(value) === 0)
}
export const totalMarks = (items: SelectedItem[]) => items.reduce((sum, item) => sum + Math.round(Number(item.marks) * 100), 0) / 100
export const itemRequest = (items: SelectedItem[]) => items.map(item => ({ questionId: item.questionId, marks: Number(item.marks) }))
export function localDateTime(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}
export function validPublishWindow(opens: string, closes: string): boolean {
  return Number.isFinite(new Date(opens).getTime()) && new Date(closes).getTime() > new Date(opens).getTime()
}
export function validPublishLimits(minutes: string, attempts: string): boolean {
  return Number.isInteger(Number(attempts)) && Number(attempts) >= 1 && (minutes === '' || (Number.isFinite(Number(minutes)) && Math.round(Number(minutes) * 60) > 0))
}
function useScope() { const { user } = useAuth(); return [user?.centreId, user?.userId] }
export function useDefinitions() {
  const scope = useScope()
  return useQuery({ queryKey: ['tests', ...scope], queryFn: async () => (await apiClient.get<Definition[]>('/tests')).data })
}
export function useDefinition(id: string) {
  const scope = useScope()
  return useQuery({ queryKey: ['tests', ...scope, 'detail', id], enabled: id !== '', queryFn: async () => (await apiClient.get<Definition>(`/tests/${id}`)).data })
}
export function useManagedBatches() {
  const scope = useScope()
  return useQuery({ queryKey: ['batches', ...scope, 'publish'], queryFn: async () => (await apiClient.get<BatchDto[]>('/batches')).data })
}
export function useInstances(batchId: string) {
  const scope = useScope()
  return useQuery({ queryKey: ['instances', ...scope, { batchId }], queryFn: async () => (await apiClient.get<Instance[]>('/instances', { params: batchId === '' ? {} : { batchId } })).data })
}
export function useInstance(id: string) {
  const scope = useScope()
  return useQuery({ queryKey: ['instances', ...scope, 'detail', id], enabled: id !== '', queryFn: async () => (await apiClient.get<Instance>(`/instances/${id}`)).data })
}
export function useInstanceRoster(batchId: string) {
  const scope = useScope()
  return useQuery({ queryKey: ['instances', ...scope, 'roster', batchId], enabled: batchId !== '', queryFn: async () => (await apiClient.get<RosterStudent[]>(`/batches/${batchId}/students`)).data })
}
export function useSaveDefinition() {
  const cache = useQueryClient(); const scope = useScope()
  return useMutation({
    mutationFn: async ({ id, request }: { id: string; request: DefinitionRequest }) => (id === '' ? await apiClient.post<Definition>('/tests', request) : await apiClient.put<Definition>(`/tests/${id}`, request)).data,
    onSuccess: result => { cache.setQueryData(['tests', ...scope, 'detail', result.id], result); void cache.invalidateQueries({ queryKey: ['tests'] }) },
  })
}
export function useDeleteDefinition() {
  const cache = useQueryClient()
  return useMutation({ mutationFn: async (id: string) => { await apiClient.delete(`/tests/${id}`) }, onSuccess: () => { void cache.invalidateQueries({ queryKey: ['tests'] }) } })
}
export function usePublishDefinition() {
  const cache = useQueryClient(); const scope = useScope()
  return useMutation({ mutationFn: async ({ id, request }: { id: string; request: PublishRequest }) => (await apiClient.post<Instance>(`/tests/${id}/publish`, request)).data,
    onSuccess: result => { cache.setQueryData(['instances', ...scope, 'detail', result.id], result); void cache.invalidateQueries({ queryKey: ['tests'] }); void cache.invalidateQueries({ queryKey: ['instances'] }) },
  })
}
export function useInstanceAction() {
  const cache = useQueryClient(); const scope = useScope()
  return useMutation({ mutationFn: async ({ id, action, userId }: { id: string; action: 'close' | 'regenerate-code' | 'students'; userId?: string }) => (await apiClient.post<Instance>(`/instances/${id}/${action}`, action === 'students' ? { userId } : {})).data,
    onSuccess: result => { cache.setQueryData(['instances', ...scope, 'detail', result.id], result); void cache.invalidateQueries({ queryKey: ['instances'] }) },
  })
}
