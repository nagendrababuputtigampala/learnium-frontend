import { useQuery } from '@tanstack/react-query'
import { apiClient, type StudentDashboard } from './api'

export function useStudentDashboard() {
  return useQuery({
    queryKey: ['student-dashboard'],
    queryFn: async () => (await apiClient.get<StudentDashboard>('/student/dashboard')).data,
  })
}
