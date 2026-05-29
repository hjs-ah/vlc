import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/lib/AuthContext'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'

import HomePage      from '@/pages/HomePage'
import LoginPage     from '@/pages/LoginPage'
import ExplorePage   from '@/pages/ExplorePage'
import DashboardHome    from '@/pages/dashboard/DashboardHome'
import InstructorTools from '@/pages/dashboard/InstructorTools'
import AdminPage     from '@/pages/admin/AdminPage'

// Lazy stub pages — fill out progressively
const Stub = ({ name }) => (
  <div style={{ padding: 32, color: 'var(--grey-dark)', fontSize: 14 }}>
    <strong>{name}</strong> — coming in v0.2.0
  </div>
)

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/"        element={<HomePage />} />
          <Route path="/login"   element={<LoginPage />} />
          <Route path="/explore" element={<ExplorePage />} />

          {/* Protected dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index                element={<DashboardHome />} />
            <Route path="courses"       element={<Stub name="My Courses" />} />
            <Route path="assignments"   element={<Stub name="Assignments" />} />
            <Route path="grades"        element={<Stub name="Grades" />} />
            <Route path="discussions"   element={<Stub name="Discussions" />} />
            <Route path="schedule"       element={<Stub name="Schedule" />} />
            <Route path="gradebook"     element={<Stub name="Grade Book" />} />
            <Route path="tools"         element={<InstructorTools />} />
          </Route>

          {/* Admin — requires admin role */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireRole="admin">
                <AdminPage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
