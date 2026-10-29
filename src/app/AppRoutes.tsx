import { Route, Routes } from 'react-router-dom'
import { AdminRoute, ProtectedRoute } from '../components/auth/guards'
import AppLayout from '../components/layout/AppLayout'
import BatchesPage from '../pages/BatchesPage'
import CentreOverviewPage from '../pages/CentreOverviewPage'
import CentreSettingsPage from '../pages/CentreSettingsPage'
import ForgotPasswordPage from '../pages/ForgotPasswordPage'
import HomePage from '../pages/HomePage'
import JoinPage from '../pages/JoinPage'
import LoginPage from '../pages/LoginPage'
import NotFoundPage from '../pages/NotFoundPage'
import SetPasswordPage from '../pages/SetPasswordPage'
import StudentHomePage from '../pages/StudentHomePage'
import TeachersPage from '../pages/TeachersPage'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/set-password" element={<SetPasswordPage />} />
      <Route path="/join" element={<JoinPage />} />
      <Route path="/student" element={<StudentHomePage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/batches" element={<BatchesPage />} />
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<CentreOverviewPage />} />
            <Route path="/admin/teachers" element={<TeachersPage />} />
            <Route path="/admin/settings" element={<CentreSettingsPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
