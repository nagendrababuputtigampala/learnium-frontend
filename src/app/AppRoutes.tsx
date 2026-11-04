import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminRoute, ProtectedRoute, StaffRoute, StudentRoute } from '../components/auth/guards'
import AppLayout from '../components/layout/AppLayout'
import BatchesPage from '../pages/BatchesPage'
import CentreOverviewPage from '../pages/CentreOverviewPage'
import CentreSettingsPage from '../pages/CentreSettingsPage'
import ForgotPasswordPage from '../pages/ForgotPasswordPage'
import HomePage from '../pages/HomePage'
import LoginPage from '../pages/LoginPage'
import MaterialDetailPage from '../pages/MaterialDetailPage'
import MaterialsPage from '../pages/MaterialsPage'
import QuestionsPage from '../pages/QuestionsPage'
import TestsPage from '../pages/TestsPage'
import InstancesPage from '../pages/InstancesPage'
import InstanceAttemptsPage from '../pages/InstanceAttemptsPage'
import TestBuilderPage from '../pages/TestBuilderPage'
import QuestionDetailPage from '../pages/QuestionDetailPage'
import NotFoundPage from '../pages/NotFoundPage'
import SetPasswordPage from '../pages/SetPasswordPage'
import StudentHomePage from '../pages/StudentHomePage'
import StudentPlayerPage from '../pages/StudentPlayerPage'
import StudentResultPage from '../pages/StudentResultPage'
import PracticePlayerPage from '../pages/PracticePlayerPage'
import TeachersPage from '../pages/TeachersPage'
import MarkingQueuePage from '../pages/MarkingQueuePage'
import MarkingDetailPage from '../pages/MarkingDetailPage'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/set-password" element={<SetPasswordPage />} />
      <Route path="/join" element={<Navigate to="/login" replace />} />
      <Route element={<StudentRoute />}>
        <Route path="/student" element={<StudentHomePage />} />
        <Route path="/student/tests/:instanceId" element={<StudentPlayerPage />} />
        <Route path="/student/attempts/:attemptId/result" element={<StudentResultPage />} />
        <Route path="/student/tests/:instanceId/practice" element={<PracticePlayerPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<StaffRoute />}>
          <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/batches" element={<BatchesPage />} />
          <Route path="/instances" element={<InstancesPage />} />
          <Route path="/instances/:instanceId" element={<InstancesPage />} />
          <Route path="/instances/:instanceId/attempts" element={<InstanceAttemptsPage />} />
          <Route path="/tests" element={<TestsPage />} />
          <Route path="/tests/new" element={<TestBuilderPage />} />
          <Route path="/tests/:testId" element={<TestBuilderPage />} />
          <Route path="/review" element={<QuestionsPage key="review" />} />
          <Route path="/question-bank" element={<QuestionsPage key="bank" bank />} />
          <Route path="/questions/:questionId" element={<QuestionDetailPage />} />
          <Route path="/materials" element={<MaterialsPage />} />
          <Route path="/marking" element={<MarkingQueuePage />} />
          <Route path="/marking/:questionAttemptId" element={<MarkingDetailPage />} />
          <Route
            path="/materials/:materialId"
            element={<MaterialDetailPage />}
          />
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<CentreOverviewPage />} />
            <Route path="/admin/teachers" element={<TeachersPage />} />
            <Route path="/admin/settings" element={<CentreSettingsPage />} />
          </Route>
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
