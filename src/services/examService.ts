import { api, publicApi } from './api';

// Types for exam-related API responses
export interface Grade {
  gradeId: string;
  code: string;
  name: string;
  sortOrder: number;
}

export interface Subject {
  subjectId: string;
  subjectName: string;
  icon: string;
  color: string;
  description: string;
  gradientFrom?: string | null;
  gradientTo?: string | null;
}

export interface Topic {
  topicId: string;
  topicName: string;
  description: string;
  icon: string;
  color: string;
  sortOrder: number;
  completed?: boolean;
  locked?: boolean;
}

// API response type for topics
export interface ExamTopic {
  topicId: string;
  topicName: string;
  description: string;
  completed: boolean;
  locked: boolean;
}

export interface Test {
  examTemplateId: string;
  templateName: string;
  description: string;
  durationSeconds: number;
  totalQuestions: number;
  difficulty?: string | null;
  sortOrder: number;
  // Legacy fields for backward compatibility
  testId?: number;
  testName?: string;
  questionsCount?: number;
  estimatedTime?: string;
  topicId?: string;
  locked?: boolean;
  bestScore?: number;
}

export interface Exam {
  examId: number;
  examName: string | null;
  totalQuestions?: number | null;
  level?: string | null;
  estimatedTime?: string | null;
  duration?: number | null;
  bestScore?: number | null;
}

// Processed exam with fallbacks for UI
export interface ProcessedExam {
  examId: number;
  examName: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questionsCount: number;
  estimatedTime: string;
  locked: boolean;
  bestScore?: number;
}

export interface ExamMode {
  examModeId: string;
  testType: 'quiz' | 'flashcard' | 'input' | 'games' | 'fill_blanks';
  title: string;
  description: string;
  icon: string;
  gradientFrom: string;
  gradientTo: string;
  buttonColor: string;
  hoverBorderColor?: string;
  features: string[];
  buttonText: string;
  sortOrder: number;
}

// Question and Option interfaces for API responses
export interface QuestionOption {
  id: string;
  text: string;
}

export interface QuestionBlank {
  id: string;
  placeholder: string;
}

export interface QuestionPayload {
  stem: string;
  tags: string[];
  type: 'MCQ' | 'FIB';
  options?: QuestionOption[];
  blanks?: QuestionBlank[];
}

export interface Question {
  questionId: string;
  payload: QuestionPayload;
}

// Test with questions response interface
export interface TestWithQuestions {
  examTemplateId: string;
  templateName: string;
  description: string;
  durationSeconds: number;
  totalQuestions: number;
  gradeId: string;
  subjectId: string;
  topicId: string;
  examModeId: string;
  version: number;
  questions: Question[];
}

// Submission interfaces
export interface SubmissionAnswer {
  questionId: string;
  answer: {
    selectedOptionId?: string; // For MCQ questions
    text?: string; // For FIB questions
  };
  timeSpentSec: number;
}

export interface SubmissionRequest {
  userId: string;
  examTemplateId: string;
  durationSec: number;
  answers: SubmissionAnswer[];
}

export interface SubmissionResponse {
  attemptId: string;
  status: string;
  totalQuestions: number;
  attempted: number;
  correct: number;
  wrong: number;
  skipped: number;
  score: number;
  percentage: number;
  submittedAt: string;
}

// Review interfaces
export interface ReviewQuestionAttempt {
  questionAttemptId: string;
  questionId: string;
  questionType: string;
  difficulty: number;
  questionPayload: {
    stem: string;
    tags: string[];
    type: 'MCQ' | 'FIB';
    options?: { id: string; text: string }[];
    blanks?: { id: string; placeholder: string; correctText: string }[];
  };
  userAnswer: {
    selectedOptionId?: string;
    text?: string;
  } | null;
  correctOptionId?: string;
  acceptedAnswers: string[];
  correct: boolean;
  points: number;
  timeSpentSec: number;
}

export interface ReviewResponse {
  attemptId: string;
  examTemplateId: string;
  templateName: string;
  templateVersion: number;
  gradeId: string;
  subjectId: string;
  topicId: string;
  examModeId: string;
  status: string;
  durationSec: number;
  totalQuestions: number;
  attempted: number;
  correct: number;
  wrong: number;
  skipped: number;
  score: number;
  percentage: number;
  startedAt: string;
  submittedAt: string;
  questions: ReviewQuestionAttempt[];
}

// Processed question interface for UI compatibility
export interface ProcessedQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  image?: string;
  type: 'text' | 'image';
}

// Partial interface for API responses that might be incomplete
export interface PartialExamMode {
  examModeId?: string;
  testType?: 'quiz' | 'flashcard' | 'input' | 'games' | 'fill_blanks';
  title?: string;
  description?: string;
  icon?: string;
  gradientFrom?: string;
  gradientTo?: string;
  buttonColor?: string;
  hoverBorderColor?: string;
  features?: string[];
  buttonText?: string;
  sortOrder?: number;
}

// API endpoints from environment variables
const ENDPOINTS = {
  GET_GRADES: import.meta.env.VITE_API_EXAM_GET_GRADES_PATH || '/exam/getGrades',
  GET_SUBJECTS: import.meta.env.VITE_API_EXAM_GET_SUBJECTS_PATH || '/exam/getSubjects',
  GET_SUBJECTS_BY_GRADE: import.meta.env.VITE_API_EXAM_GET_SUBJECTS_BY_GRADE_PATH || '/exam/getSubjectsByGrade',
  GET_SUBJECTS_BY_GRADE_CODE: import.meta.env.VITE_API_EXAM_GET_SUBJECTS_BY_GRADE_CODE_PATH || '/v1/subjects',
  GET_TOPICS: import.meta.env.VITE_API_EXAM_GET_TOPICS_PATH || '/exam/getTopics',
  GET_TOPICS_BY_GRADE_SUBJECT: import.meta.env.VITE_API_EXAM_GET_TOPICS_BY_GRADE_SUBJECT_PATH || '/exam/getTopicByGradeSubject',
  GET_TOPICS_BY_GRADE_CODE_SUBJECT: import.meta.env.VITE_API_EXAM_GET_TOPICS_BY_GRADE_CODE_SUBJECT_PATH || '/v1/topics',
  GET_EXAM_MODES: import.meta.env.VITE_API_EXAM_GET_EXAM_MODES_PATH || '/v1/exam-modes',
  GET_EXAMS: import.meta.env.VITE_API_EXAM_GET_EXAMS_PATH || '/exam/grades/{gradeId}/subjects/{subjectId}/topics/{topicId}/exam-modes/{examModeId}/exams',
  GET_QUESTIONS: import.meta.env.VITE_API_EXAM_GET_QUESTIONS_PATH || '/exam/grades/{gradeId}/subjects/{subjectId}/topics/{topicId}/exam-modes/{examModeId}/exams/{examId}/questions',
  GET_TESTS: import.meta.env.VITE_API_EXAM_GET_TESTS_PATH || '/v1/tests',
  GET_TEST_WITH_QUESTIONS: import.meta.env.VITE_API_EXAM_GET_TEST_WITH_QUESTIONS_PATH || '/v1/tests',
  SUBMIT_EXAM: import.meta.env.VITE_API_EXAM_SUBMIT_PATH || '/v1/exam-attempts',
  GET_REVIEW: import.meta.env.VITE_API_EXAM_GET_REVIEW_PATH || '/v1/exam-attempts',
};

/**
 * Exam Service - Centralized API calls for exam-related operations
 */
export class ExamService {
  /**
   * Fetch all available grades
   * @returns Promise<Grade[]>
   */
  static async getGrades(): Promise<Grade[]> {
    try {
      const response = await publicApi.get<Grade[]>(ENDPOINTS.GET_GRADES);
      
      // Ensure we always return an array, even if the response is malformed
      const data = Array.isArray(response.data) ? response.data : [];
      
      // Sort by sortOrder and filter out any null/undefined entries
      return data
        .filter(grade => grade && grade.gradeId && grade.name)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    } catch (error: any) {
      console.error('Error fetching grades:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch grades');
    }
  }

  /**
   * Fetch subjects for a specific grade
   * @param gradeId - The grade ID
   * @returns Promise<Subject[]>
   */
  static async getSubjects(gradeId: string): Promise<Subject[]> {
    try {
      const response = await api.get<Subject[]>(ENDPOINTS.GET_SUBJECTS, {
        params: { gradeId }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching subjects:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch subjects');
    }
  }

  /**
   * Fetch subjects by grade ID using the new endpoint
   * @param gradeId - The grade ID (now string)
   * @returns Promise<Subject[]>
   */
  static async getSubjectsByGrade(gradeId: string): Promise<Subject[]> {
    try {
      const response = await api.get<Subject[]>(`${ENDPOINTS.GET_SUBJECTS_BY_GRADE}/${gradeId}`);
      
      // Ensure we always return an array, even if the response is malformed
      const data = Array.isArray(response.data) ? response.data : [];
      
      // Filter out any null/undefined entries and ensure minimum required fields
      return data.filter(subject => subject && subject.subjectId && subject.subjectName);
    } catch (error: any) {
      console.error('Error fetching subjects by grade:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch subjects');
    }
  }

  /**
   * Fetch subjects by grade code using the new API
   * @param gradeCode - The grade code (e.g., "G8")
   * @returns Promise<Subject[]>
   */
  static async getSubjectsByGradeCode(gradeCode: string): Promise<Subject[]> {
    try {
      const response = await api.get<Subject[]>(ENDPOINTS.GET_SUBJECTS_BY_GRADE_CODE, {
        params: { gradeCode }
      });
      
      // Ensure we always return an array, even if the response is malformed
      const data = Array.isArray(response.data) ? response.data : [];
      
      // Filter out any null/undefined entries and ensure minimum required fields
      return data.filter(subject => subject && subject.subjectId && subject.subjectName);
    } catch (error: any) {
      console.error('Error fetching subjects by grade code:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch subjects');
    }
  }

  /**
   * Fetch topics for a specific subject and grade
   * @param subjectId - The subject ID
   * @param gradeId - The grade ID
   * @returns Promise<Topic[]>
   */
  static async getTopics(subjectId: string, gradeId: string): Promise<Topic[]> {
    try {
      const response = await api.get<Topic[]>(ENDPOINTS.GET_TOPICS, {
        params: { subjectId, gradeId }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching topics:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch topics');
    }
  }

  /**
   * Fetch topics by grade and subject using the new endpoint
   * @param gradeId - The grade ID
   * @param subjectId - The subject ID
   * @returns Promise<ExamTopic[]>
   */
  static async getTopicsByGradeAndSubject(gradeId: string, subjectId: string): Promise<ExamTopic[]> {
    try {
      const response = await api.get<ExamTopic[]>(`${ENDPOINTS.GET_TOPICS_BY_GRADE_SUBJECT}/${gradeId}/${subjectId}`);
      
      // Ensure we always return an array, even if the response is malformed
      const data = Array.isArray(response.data) ? response.data : [];
      
      // Filter out any null/undefined entries and provide fallbacks
      return data.filter(topic => topic && (topic.topicId || topic.topicName)).map(topic => ({
        topicId: topic.topicId || `topic-${Date.now()}`,
        topicName: topic.topicName || 'Unknown Topic',
        description: topic.description || 'No description available',
        completed: topic.completed || false,
        locked: topic.locked || false
      }));
    } catch (error: any) {
      console.error('Error fetching topics by grade and subject:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch topics');
    }
  }

  /**
   * Fetch topics by grade code and subject ID using the new API
   * @param gradeCode - The grade code (e.g., "G8")  
   * @param subjectId - The subject UUID
   * @returns Promise<Topic[]>
   */
  static async getTopicsByGradeCodeAndSubject(gradeCode: string, subjectId: string): Promise<Topic[]> {
    try {
      const url = ENDPOINTS.GET_TOPICS_BY_GRADE_CODE_SUBJECT;
      const params = { gradeCode, subjectId };
      
      console.log('ExamService.getTopicsByGradeCodeAndSubject called with:', {
        gradeCode,
        subjectId,
        url,
        params,
        fullEndpoint: `${url}?gradeCode=${gradeCode}&subjectId=${subjectId}`
      });
      
      const response = await api.get<Topic[]>(url, { params });
      
      console.log('Raw API response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers
      });
      
      // Ensure we always return an array, even if the response is malformed
      const data = Array.isArray(response.data) ? response.data : [];
      
      console.log('Processing response data:', {
        isArray: Array.isArray(response.data),
        originalLength: response.data?.length || 0,
        filteredLength: data.length
      });
      
      // Filter out any null/undefined entries and provide defaults for optional fields
      const processedTopics = data.filter(topic => topic && topic.topicId && topic.topicName).map(topic => ({
        topicId: topic.topicId,
        topicName: topic.topicName,
        description: topic.description || 'No description available',
        icon: topic.icon || 'circle',
        color: topic.color || '#6366f1',
        sortOrder: topic.sortOrder || 0,
        completed: topic.completed || false,
        locked: topic.locked || false
      }));
      
      console.log('Final processed topics:', processedTopics);
      return processedTopics;
    } catch (error: any) {
      console.error('Error fetching topics by grade code and subject:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch topics');
    }
  }

  /**
   * Fetch available exam modes for a specific grade, subject, and topic
   * @param gradeId - The grade UUID
   * @param subjectId - The subject UUID  
   * @param topicId - The topic UUID
   * @returns Promise<ExamMode[]>
   */
  static async getExamModes(gradeId: string, subjectId: string, topicId: string): Promise<ExamMode[]> {
    try {
      console.log('ExamService.getExamModes called with:', {
        gradeId,
        subjectId,
        topicId,
        endpoint: ENDPOINTS.GET_EXAM_MODES
      });
      
      const response = await api.get<ExamMode[]>(ENDPOINTS.GET_EXAM_MODES, {
        params: { gradeId, subjectId, topicId }
      });
      
      console.log('Raw exam modes API response:', {
        status: response.status,
        data: response.data
      });
      
      // Ensure we always return an array, even if the response is malformed
      const data = Array.isArray(response.data) ? response.data : [];
      
      // Process and normalize the response data
      const processedModes = data.filter(mode => mode && mode.examModeId && mode.testType).map(mode => ({
        examModeId: mode.examModeId,
        testType: mode.testType,
        title: mode.title || 'Test',
        description: mode.description || 'Practice questions',
        icon: mode.icon || 'BookOpen',
        gradientFrom: mode.gradientFrom || '#1D4ED8',
        gradientTo: mode.gradientTo || '#60A5FA',
        buttonColor: mode.buttonColor || '#2563EB',
        hoverBorderColor: mode.hoverBorderColor,
        features: mode.features || ['Practice questions'],
        buttonText: mode.buttonText || 'Start Test',
        sortOrder: mode.sortOrder || 0
      }));
      
      console.log('Final processed exam modes:', processedModes);
      return processedModes;
    } catch (error: any) {
      console.error('Error fetching exam modes:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw new Error(error.response?.data?.message || 'Failed to fetch exam modes');
    }
  }

  /**
   * Fetch exams for a specific grade, subject, topic, and exam mode
   * @param gradeId - The grade ID
   * @param subjectId - The subject ID
   * @param topicId - The topic ID
   * @param examModeId - The exam mode ID
   * @returns Promise<Exam[]>
   */
  static async getExams(gradeId: string, subjectId: string, topicId: string, examModeId: string): Promise<Exam[]> {
    try {
      const endpoint = ENDPOINTS.GET_EXAMS
        .replace('{gradeId}', gradeId)
        .replace('{subjectId}', subjectId)
        .replace('{topicId}', topicId)
        .replace('{examModeId}', examModeId);
      
      const response = await api.get<Exam[]>(endpoint);
      
      // Ensure we always return an array, even if the response is malformed
      const data = Array.isArray(response.data) ? response.data : [];
      
      // Filter out any null/undefined entries
      return data.filter(exam => exam && exam.examId);
    } catch (error: any) {
      console.error('Error fetching exams:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch exams');
    }
  }

  /**
   * Fetch test with questions for a specific exam template
   * @param examTemplateId - The exam template UUID
   * @returns Promise<TestWithQuestions>
   */
  static async getTestWithQuestions(examTemplateId: string): Promise<TestWithQuestions> {
    try {
      console.log('ExamService.getTestWithQuestions called with:', {
        examTemplateId,
        endpoint: `${ENDPOINTS.GET_TEST_WITH_QUESTIONS}/${examTemplateId}`
      });
      
      const response = await api.get<TestWithQuestions>(`${ENDPOINTS.GET_TEST_WITH_QUESTIONS}/${examTemplateId}`);
      
      console.log('Raw test with questions API response:', {
        status: response.status,
        data: response.data
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Error fetching test with questions:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw new Error(error.response?.data?.message || 'Failed to fetch test with questions');
    }
  }

  /**
   * Submit exam attempt with answers
   * @param examAttemptId - The unique exam attempt ID (UUID)
   * @param submissionData - The submission data including answers and duration
   * @returns Promise<SubmissionResponse>
   */
  static async submitExamAttempt(examAttemptId: string, submissionData: SubmissionRequest): Promise<SubmissionResponse> {
    try {
      console.log('ExamService.submitExamAttempt called with:', {
        examAttemptId,
        submissionData,
        endpoint: `${ENDPOINTS.SUBMIT_EXAM}/${examAttemptId}/submit`
      });
      
      const response = await api.post<SubmissionResponse>(
        `${ENDPOINTS.SUBMIT_EXAM}/${examAttemptId}/submit`,
        submissionData
      );
      
      console.log('Exam submission API response:', {
        status: response.status,
        data: response.data
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Error submitting exam attempt:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Handle specific error cases from the API
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      
      throw new Error(error.response?.data?.message || 'Failed to submit exam attempt');
    }
  }

  /**
   * Get exam attempt review data with correct answers and user responses
   * @param examAttemptId - The exam attempt UUID
   * @returns Promise<ReviewResponse>
   */
  static async getExamAttemptReview(examAttemptId: string): Promise<ReviewResponse> {
    try {
      console.log('ExamService.getExamAttemptReview called with:', {
        examAttemptId,
        endpoint: `${ENDPOINTS.GET_REVIEW}/${examAttemptId}/review`
      });
      
      const response = await api.get<ReviewResponse>(
        `${ENDPOINTS.GET_REVIEW}/${examAttemptId}/review`
      );
      
      console.log('Exam attempt review API response:', {
        status: response.status,
        data: response.data
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Error fetching exam attempt review:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      throw new Error(error.response?.data?.message || 'Failed to fetch exam attempt review');
    }
  }

  /**
   * Fetch questions for a specific exam (legacy method for backward compatibility)
   * @param gradeId - The grade ID
   * @param subjectId - The subject ID
   * @param topicId - The topic ID
   * @param examModeId - The exam mode ID
   * @param examId - The exam ID
   * @returns Promise<Question[]>
   */
  static async getQuestions(gradeId: string, subjectId: string, topicId: string, examModeId: string, examId: number): Promise<Question[]> {
    try {
      const endpoint = ENDPOINTS.GET_QUESTIONS
        .replace('{gradeId}', gradeId)
        .replace('{subjectId}', subjectId)
        .replace('{topicId}', topicId)
        .replace('{examModeId}', examModeId)
        .replace('{examId}', examId.toString());
      
      const response = await api.get<Question[]>(endpoint);
      
      // Ensure we always return an array, even if the response is malformed
      const data = Array.isArray(response.data) ? response.data : [];
      
      // Filter out any null/undefined entries and ensure minimum required fields
      return data.filter(question => question && question.questionId);
    } catch (error: any) {
      console.error('Error fetching questions:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch questions');
    }
  }

  /**
   * Fetch tests for a specific grade, subject, topic, and exam mode
   * @param gradeId - The grade UUID
   * @param subjectId - The subject UUID
   * @param topicId - The topic UUID
   * @param examModeId - The exam mode UUID
   * @returns Promise<Test[]>
   */
  static async getTests(gradeId: string, subjectId: string, topicId: string, examModeId: string): Promise<Test[]> {
    try {
      console.log('ExamService.getTests called with:', {
        gradeId,
        subjectId,
        topicId,
        examModeId,
        endpoint: ENDPOINTS.GET_TESTS
      });
      
      const response = await api.get<Test[]>(ENDPOINTS.GET_TESTS, {
        params: { gradeId, subjectId, topicId, examModeId }
      });
      
      console.log('Raw tests API response:', {
        status: response.status,
        data: response.data
      });
      
      // Ensure we always return an array, even if the response is malformed
      const data = Array.isArray(response.data) ? response.data : [];
      
      // Process and normalize the response data
      const processedTests = data.filter(test => test && test.examTemplateId).map(test => {
        // Convert difficulty string to proper case
        const getDifficulty = (diff?: string | null): 'Easy' | 'Medium' | 'Hard' => {
          if (!diff) return 'Medium';
          const lower = diff.toLowerCase();
          if (lower === 'easy') return 'Easy';
          if (lower === 'hard') return 'Hard';
          return 'Medium';
        };

        return {
          examTemplateId: test.examTemplateId,
          templateName: test.templateName || 'Test',
          description: test.description || 'Practice test',
          durationSeconds: test.durationSeconds || 0,
          totalQuestions: test.totalQuestions || 0,
          difficulty: test.difficulty,
          sortOrder: test.sortOrder || 0,
          // Legacy compatibility fields
          testId: parseInt(test.examTemplateId.split('-')[0], 16) || 1,
          testName: test.templateName,
          questionsCount: test.totalQuestions,
          estimatedTime: test.durationSeconds > 0 ? `${Math.ceil(test.durationSeconds / 60)} min` : 'Unlimited',
          topicId: topicId,
          locked: false,
          bestScore: undefined
        };
      });
      
      console.log('Final processed tests:', processedTests);
      return processedTests;
    } catch (error: any) {
      console.error('Error fetching tests:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw new Error(error.response?.data?.message || 'Failed to fetch tests');
    }
  }
}

// Export individual functions for backward compatibility
export const getGrades = ExamService.getGrades;
export const getSubjects = ExamService.getSubjects;
export const getSubjectsByGrade = ExamService.getSubjectsByGrade;
export const getSubjectsByGradeCode = ExamService.getSubjectsByGradeCode;
export const getTopics = ExamService.getTopics;
export const getTopicsByGradeAndSubject = ExamService.getTopicsByGradeAndSubject;
export const getTopicsByGradeCodeAndSubject = ExamService.getTopicsByGradeCodeAndSubject;
export const getExamModes = ExamService.getExamModes;
export const getExams = ExamService.getExams;
export const getQuestions = ExamService.getQuestions;
export const getTestWithQuestions = ExamService.getTestWithQuestions;
export const getTests = ExamService.getTests;
export const submitExamAttempt = ExamService.submitExamAttempt;
export const getExamAttemptReview = ExamService.getExamAttemptReview;