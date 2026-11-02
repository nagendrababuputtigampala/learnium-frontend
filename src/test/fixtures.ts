import { vi } from 'vitest'
import type {
  AuthUser,
  BatchDto,
  CentreDto,
  GeneratedQuestionDto,
  GenerationJobDetailDto,
  GenerationJobDto,
  GradeSubject,
  LoginResponse,
  MaterialDetailDto,
  MaterialDto,
  RosterStudent,
  StudentProfile,
  TeacherDto,
  Topic,
} from '../lib/api'
import type { AuthContextValue } from '../lib/auth'

/** Builds an AuthContextValue for tests that mock `useAuth` directly. */
export function authContextValue(
  overrides: Partial<AuthContextValue> = {},
): AuthContextValue {
  return {
    user: null,
    isRestoring: false,
    login: vi.fn(),
    logout: vi.fn(),
    studentSession: vi.fn(),
    restore: vi.fn(),
    ...overrides,
  }
}

/** Shared sample data mirroring the backend contract. */

export const adminUser: AuthUser = {
  userId: 'user-admin',
  displayName: 'Ada Admin',
  email: 'ada@learnium.test',
  role: 'CENTRE_ADMIN',
  centreId: 'centre-1',
  centreName: 'Demo Tutoring Centre',
}

export const teacherUser: AuthUser = {
  userId: 'user-teacher',
  displayName: 'Mrs. Patel',
  email: 'patel@learnium.test',
  role: 'TEACHER',
  centreId: 'centre-1',
  centreName: 'Demo Tutoring Centre',
}

export function loginResponseFor(user: AuthUser): LoginResponse {
  return {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    tokenType: 'Bearer',
    expiresInSeconds: 900,
    user,
  }
}

export const studentProfile: StudentProfile = {
  userId: 'user-student',
  displayName: 'Simran',
  membershipId: 'membership-1',
  batchId: 'batch-1',
  batchName: 'Grade 8 Math — Batch B',
  centreId: 'centre-1',
}

export const teacherOne: TeacherDto = {
  userId: 'user-teacher',
  email: 'patel@learnium.test',
  displayName: 'Mrs. Patel',
  active: true,
  invited: false,
  createdAt: '2026-10-01T09:00:00Z',
}

export const teacherTwo: TeacherDto = {
  userId: 'user-teacher-2',
  email: 'lee@learnium.test',
  displayName: 'Mr. Lee',
  active: false,
  invited: false,
  createdAt: '2026-10-02T09:00:00Z',
}

export const teacherInvited: TeacherDto = {
  userId: 'user-teacher-3',
  email: 'new@learnium.test',
  displayName: 'New Teacher',
  active: true,
  invited: true,
  createdAt: '2026-10-03T09:00:00Z',
}

export const batchOne: BatchDto = {
  batchId: 'batch-1',
  name: 'Grade 8 Math — Batch B',
  gradeSubjectId: 'gs-1',
  gradeLabel: 'Grade 8 · Mathematics',
  teacherUserId: 'user-teacher',
  teacherName: 'Mrs. Patel',
  studentCount: 5,
}

export const batchTwo: BatchDto = {
  batchId: 'batch-2',
  name: 'Grade 7 Science — Batch A',
  gradeSubjectId: 'gs-2',
  gradeLabel: 'Grade 7 · Science',
  teacherUserId: null,
  teacherName: null,
  studentCount: 0,
}

export const gradeSubjects: GradeSubject[] = [
  {
    gradeSubjectId: 'gs-1',
    gradeCode: 'G8',
    gradeName: 'Grade 8',
    subjectId: 'subject-math',
    subjectName: 'Mathematics',
    label: 'Grade 8 · Mathematics',
  },
  {
    gradeSubjectId: 'gs-2',
    gradeCode: 'G7',
    gradeName: 'Grade 7',
    subjectId: 'subject-science',
    subjectName: 'Science',
    label: 'Grade 7 · Science',
  },
]

export const rosterStudentActive: RosterStudent = {
  membershipId: 'membership-1',
  userId: 'user-student',
  fullName: 'Simran',
  status: 'ACTIVE',
  pinLocked: false,
}

export const rosterStudentLocked: RosterStudent = {
  membershipId: 'membership-2',
  userId: 'user-student-2',
  fullName: 'Arjun',
  status: 'ACTIVE',
  pinLocked: true,
}

export const rosterStudentInactive: RosterStudent = {
  membershipId: 'membership-3',
  userId: 'user-student-3',
  fullName: 'Meera',
  status: 'INACTIVE',
  pinLocked: false,
}

export const materialOk: MaterialDto = {
  materialId: 'mat-1',
  title: 'Fractions chapter',
  gradeSubjectId: 'gs-1',
  gradeCode: 'G8',
  gradeName: 'Grade 8',
  subjectName: 'Mathematics',
  sourceType: 'PDF',
  extractionStatus: 'OK',
  extractedChars: 12340,
  contentHash: 'hash-1',
  deduplicated: false,
  createdAt: '2026-10-20T09:00:00Z',
}

export const materialText: MaterialDto = {
  materialId: 'mat-2',
  title: 'Pasted science notes',
  gradeSubjectId: 'gs-2',
  gradeCode: 'G7',
  gradeName: 'Grade 7',
  subjectName: 'Science',
  sourceType: 'TEXT',
  extractionStatus: 'OK',
  extractedChars: 640,
  contentHash: 'hash-2',
  deduplicated: false,
  createdAt: '2026-10-21T09:00:00Z',
}

export const materialNoText: MaterialDto = {
  ...materialOk,
  materialId: 'mat-3',
  title: 'Scanned worksheet',
  extractionStatus: 'NO_TEXT',
  extractedChars: 0,
  contentHash: null,
}

export const materialUnusable: MaterialDto = {
  ...materialOk,
  materialId: 'mat-4',
  title: 'Garbled export',
  extractionStatus: 'UNUSABLE_TEXT',
  extractedChars: 87,
  contentHash: 'hash-4',
}

export const materialOverLimit: MaterialDto = {
  ...materialOk,
  materialId: 'mat-5',
  title: 'Whole textbook',
  extractionStatus: 'OVER_LIMIT',
  extractedChars: null,
  contentHash: 'hash-5',
}

export const materialFailed: MaterialDto = {
  ...materialOk,
  materialId: 'mat-6',
  title: 'Corrupt file',
  extractionStatus: 'EXTRACTION_FAILED',
  extractedChars: null,
  contentHash: null,
}

/** Legacy material added before extraction existed: no status, no text. */
export const materialLegacy: MaterialDto = {
  ...materialOk,
  materialId: 'mat-7',
  title: 'Legacy chapter',
  extractionStatus: null,
  extractedChars: null,
  contentHash: null,
}

export const materialDetailOk: MaterialDetailDto = {
  ...materialOk,
  extractedText: 'A fraction is a part of a whole.',
}

export const materialDetailNoText: MaterialDetailDto = {
  ...materialNoText,
  extractedText: null,
}

export const materialDetailLegacy: MaterialDetailDto = {
  ...materialLegacy,
  extractedText: null,
}

export const centreDto: CentreDto = {
  centreId: 'centre-1',
  name: 'Demo Tutoring Centre',
  logoUrl: 'https://example.test/logo.png',
  contactEmail: 'hello@demo.test',
}

export const topics: Topic[] = [
  { topicId: 'topic-1', name: 'Fractions' },
  { topicId: 'topic-2', name: 'Decimals' },
]

export const generationJobCreated: GenerationJobDto = {
  id: 'job-1',
  materialId: 'mat-1',
  topicId: 'topic-1',
  status: 'PENDING',
  requestedCounts: { MCQ: 5, WRITTEN: 2 },
  difficulty: 'MEDIUM',
  provider: 'gemini',
  model: 'gemini-test',
  attempts: 0,
  createdAt: '2026-10-22T09:00:00Z',
}

export const jobDetailQueued: GenerationJobDetailDto = {
  ...generationJobCreated,
  promptVersion: 'v3',
  payloadSchemaVersion: '1',
  contentHash: 'hash-1',
  failureKind: null,
  resultCounts: null,
  usageInputTokens: null,
  usageOutputTokens: null,
  usageThinkingTokens: null,
  updatedAt: '2026-10-22T09:00:00Z',
  finishedAt: null,
}

export const jobDetailRunning: GenerationJobDetailDto = {
  ...jobDetailQueued,
  status: 'RUNNING',
  attempts: 1,
  updatedAt: '2026-10-22T09:00:05Z',
}

export const jobDetailRetrying: GenerationJobDetailDto = {
  ...jobDetailQueued,
  status: 'PENDING',
  attempts: 1,
  failureKind: 'MODEL_ERROR',
  updatedAt: '2026-10-22T09:00:40Z',
}

export const jobDetailSucceeded: GenerationJobDetailDto = {
  ...jobDetailQueued,
  status: 'SUCCEEDED',
  attempts: 1,
  resultCounts: {
    MCQ: {
      requested: 5,
      received: 6,
      accepted: 5,
      dropped: 1,
      dropReasons: { DUPLICATE_STEM: 1 },
    },
    WRITTEN: {
      requested: 2,
      received: 2,
      accepted: 1,
      dropped: 1,
      dropReasons: { RUBRIC_INVALID: 1 },
    },
  },
  usageInputTokens: 4200,
  usageOutputTokens: 1800,
  usageThinkingTokens: 300,
  updatedAt: '2026-10-22T09:01:00Z',
  finishedAt: '2026-10-22T09:01:00Z',
}

export const jobDetailFailedSafety: GenerationJobDetailDto = {
  ...jobDetailQueued,
  status: 'FAILED',
  attempts: 1,
  failureKind: 'SAFETY_REFUSAL',
  updatedAt: '2026-10-22T09:00:30Z',
  finishedAt: '2026-10-22T09:00:30Z',
}

export const jobDetailFailedZeroValid: GenerationJobDetailDto = {
  ...jobDetailQueued,
  status: 'FAILED',
  attempts: 1,
  failureKind: 'ZERO_VALID',
  resultCounts: {
    MCQ: {
      requested: 5,
      received: 5,
      accepted: 0,
      dropped: 5,
      dropReasons: { SCHEMA_INVALID: 3, FIELD_TOO_LONG: 2 },
    },
    WRITTEN: {
      requested: 2,
      received: 2,
      accepted: 0,
      dropped: 2,
      dropReasons: { RUBRIC_INVALID: 2 },
    },
  },
  usageInputTokens: 4000,
  usageOutputTokens: 1500,
  usageThinkingTokens: null,
  updatedAt: '2026-10-22T09:01:00Z',
  finishedAt: '2026-10-22T09:01:00Z',
}

const questionBase = {
  topicId: 'topic-1',
  provider: 'gemini',
  model: 'gemini-test',
  promptVersion: 'v3',
  generationJobId: 'job-1',
  createdAt: '2026-10-22T09:01:00Z',
}

export const questionMcq: GeneratedQuestionDto = {
  ...questionBase,
  questionId: 'q-1',
  type: 'MCQ',
  payload: {
    stem: 'What is 1/2 + 1/4?',
    options: [
      { id: 'a', text: '1/6' },
      { id: 'b', text: '3/4' },
      { id: 'c', text: '2/6' },
      { id: 'd', text: '1/8' },
    ],
  },
  correctRef: 'b',
}

export const questionFillBlank: GeneratedQuestionDto = {
  ...questionBase,
  questionId: 'q-2',
  type: 'FILL_BLANK',
  payload: {
    stemWithBlank: 'The fraction _____ is equal to 0.5.',
    answer: '1/2',
  },
  correctRef: '1/2',
}

export const questionFlashcard: GeneratedQuestionDto = {
  ...questionBase,
  questionId: 'q-3',
  type: 'FLASHCARD',
  payload: {
    front: 'What is a numerator?',
    back: 'The top number of a fraction — how many parts are taken.',
  },
  correctRef: 'back',
}

export const questionNumeric: GeneratedQuestionDto = {
  ...questionBase,
  questionId: 'q-4',
  type: 'NUMERIC',
  payload: {
    stem: 'Compute 3/4 of 20.',
    answerValue: 15,
    tolerance: 0.01,
    unit: '',
    workedSolution: '20 ÷ 4 = 5, then 5 × 3 = 15.',
  },
  correctRef: '{"value":15,"tolerance":0.01,"unit":""}',
}

export const questionWritten: GeneratedQuestionDto = {
  ...questionBase,
  questionId: 'q-5',
  type: 'WRITTEN',
  payload: {
    stem: 'Explain why 2/4 and 1/2 represent the same amount.',
    modelAnswer:
      'Both fractions describe half of the same whole: 2/4 simplifies to 1/2.',
    rubric: [
      { id: 'crit-1', criterion: 'States the fractions are equal', maxScore: 1 },
      { id: 'crit-2', criterion: 'Refers to the same whole', maxScore: 2 },
      { id: 'crit-3', criterion: 'Simplifies 2/4 to 1/2', maxScore: 2 },
    ],
  },
  correctRef: 'modelAnswer',
}

/** A draft whose payload does not match its type's shape at all. */
export const questionMalformed: GeneratedQuestionDto = {
  ...questionBase,
  questionId: 'q-6',
  type: 'MCQ',
  payload: { unexpected: true },
  correctRef: 'b',
}
