// Central export point for all services

// Core API configuration
export { api } from './api';

// User-related services
export { 
  UserService, 
  signIn, 
  createUserProfile,
  type UserProfile,
  type SignInResponse,
  type CreateUserRequest,
  type Submission
} from './userService';

// Exam-related services
export { 
  ExamService, 
  getGrades, 
  getSubjects,
  getSubjectsByGrade,
  getSubjectsByGradeCode, 
  getTopics, 
  getTopicsByGradeAndSubject,
  getTopicsByGradeCodeAndSubject,
  getExamModes,
  getExams,
  getQuestions,
  getTestWithQuestions,
  getTests,
  submitExamAttempt,
  getExamAttemptReview,
  type Grade,
  type Subject as ExamSubject,
  type Topic,
  type ExamTopic,
  type ExamMode,
  type PartialExamMode,
  type Exam,
  type ProcessedExam,
  type Test,
  type Question,
  type QuestionOption,
  type QuestionBlank,
  type QuestionPayload,
  type TestWithQuestions,
  type ProcessedQuestion,
  type SubmissionAnswer,
  type SubmissionRequest,
  type SubmissionResponse,
  type ReviewResponse,
  type ReviewQuestionAttempt
} from './examService';