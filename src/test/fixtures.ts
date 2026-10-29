import { vi } from 'vitest'
import type {
  AuthUser,
  BatchDto,
  CentreDto,
  GradeSubject,
  LoginResponse,
  MaterialDetailDto,
  MaterialDto,
  RosterStudent,
  StudentProfile,
  TeacherDto,
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
