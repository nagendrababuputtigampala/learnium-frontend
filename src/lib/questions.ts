import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient, type GeneratedQuestionDto, type PageResponse, type QuestionTypeCode } from './api'
import { useAuth } from './auth'

export interface Question extends Omit<GeneratedQuestionDto, 'type' | 'provider' | 'model' | 'promptVersion'> {
  type: QuestionTypeCode
  status: 'DRAFT' | 'APPROVED' | 'REJECTED'
  gradeSubjectId: string
  gradeName: string
  subjectName: string
  topicName: string
  difficulty: number
  revision: number
  version: number
  createdBy: string
  approvedBy: string | null
  approvedAt: string | null
  sourceQuestionId: string | null
  materialId: string | null
  materialTitle: string | null
  provider: string | null
  model: string | null
  promptVersion: string | null
}
export type QuestionSummary = Pick<Question, 'questionId' | 'type' | 'status' | 'gradeSubjectId' | 'gradeName' | 'subjectName' | 'topicId' | 'topicName' | 'difficulty' | 'materialId' | 'materialTitle' | 'createdBy' | 'createdAt' | 'approvedBy' | 'approvedAt'> & { stemPreview: string }

export interface QuestionFilters {
  status: Question['status']
  gradeId: string
  subjectId: string
  topicId: string
  type: string
  difficulty: string
  materialId: string
}
export interface QuestionEdit {
  revision: number
  topicId: string
  difficulty: number
  content: Record<string, unknown>
}
export function useQuestions(filters: QuestionFilters, page: number) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['questions', user?.centreId, user?.userId, filters, page],
    queryFn: async () => {
      const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ''))
      const response = await apiClient.get<PageResponse<QuestionSummary>>('/questions', { params: { ...params, page, size: 12 } })
      return response.data
    },
  })
}
export function useQuestion(id: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['questions', user?.centreId, user?.userId, id],
    queryFn: async () => (await apiClient.get<Question>(`/questions/${id}`)).data,
  })
}
export function useQuestionAction() {
  const cache = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async ({ question, action, edit }: {
      question: Pick<Question, 'questionId'> & { revision?: number }, action: 'save' | 'approve' | 'reject' | 'forks', edit?: QuestionEdit
    }) => {
      const response = action === 'save'
        ? await apiClient.put<Question>(`/questions/${question.questionId}`, edit)
        : await apiClient.post<Question>(`/questions/${question.questionId}/${action}`, action === 'forks' ? {} : { revision: question.revision })
      return response.data
    },
    onSuccess: result => {
      cache.setQueryData(['questions', user?.centreId, user?.userId, result.questionId], result)
      void cache.invalidateQueries({ queryKey: ['questions'] })
      void cache.invalidateQueries({ queryKey: ['materials'] })
    },
  })
}
