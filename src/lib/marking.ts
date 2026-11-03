import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  apiClient,
  type MarkingConfirmRequest,
  type MarkingDetail,
  type MarkingQueueGroup,
} from './api'

export const markingQueueKey = ['marking-queue'] as const

export function useMarkingQueue() {
  return useQuery({
    queryKey: markingQueueKey,
    queryFn: async () => (await apiClient.get<MarkingQueueGroup[]>('/marking-queue')).data,
  })
}

export function useMarkingDetail(id: string) {
  return useQuery({
    queryKey: [...markingQueueKey, id],
    queryFn: async () => (await apiClient.get<MarkingDetail>(`/marking-queue/${id}`)).data,
    enabled: id !== '',
  })
}

export function useConfirmMarking(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (request: MarkingConfirmRequest) =>
      (await apiClient.post<MarkingDetail>(`/marking-queue/${id}/confirm`, request)).data,
    onSuccess: async (detail) => {
      queryClient.setQueryData([...markingQueueKey, id], detail)
      await queryClient.invalidateQueries({ queryKey: markingQueueKey, exact: true })
    },
  })
}

export function useRerunMarking(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () =>
      (await apiClient.post<MarkingDetail>(`/marking-queue/${id}/rerun`)).data,
    onSuccess: async (detail) => {
      queryClient.setQueryData([...markingQueueKey, id], detail)
      await queryClient.invalidateQueries({ queryKey: markingQueueKey, exact: true })
    },
  })
}
