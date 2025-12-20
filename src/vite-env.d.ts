/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_HOST: string;
  readonly VITE_API_BASE_PATH: string;
  readonly VITE_API_USERS_DASHBOARD_PATH: string;
  readonly VITE_API_AUTH_SIGNIN_PATH: string;
  readonly VITE_API_EXAM_GET_GRADES_PATH: string;
  readonly VITE_API_EXAM_GET_SUBJECTS_PATH: string;
  readonly VITE_API_EXAM_GET_SUBJECTS_BY_GRADE_PATH: string;
  readonly VITE_API_EXAM_GET_TOPICS_PATH: string;
  readonly VITE_API_EXAM_GET_TOPICS_BY_GRADE_SUBJECT_PATH: string;
  readonly VITE_API_EXAM_GET_EXAM_MODES_PATH: string;
  readonly VITE_API_EXAM_GET_EXAMS_PATH: string;
  readonly VITE_API_EXAM_GET_QUESTIONS_PATH: string;
  readonly VITE_API_EXAM_GET_TESTS_PATH: string;
  readonly VITE_API_USER_PROFILE_PATH: string;
  readonly VITE_API_USER_SUBMISSIONS_PATH: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
