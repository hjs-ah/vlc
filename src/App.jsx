import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/lib/AuthContext'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'

import HomePage      from '@/pages/HomePage'
import LoginPage     from '@/pages/LoginPage'
import ExplorePage   from '@/pages/ExplorePage'
import DashboardHome    from '@/pages/dashboard/DashboardHome'
import InstructorTools from '@/pages/dashboard/InstructorTools'
import ReleaseNotes   from '@/pages/dashboard/ReleaseNotes'
import AdminPage     from '@/pages/admin/AdminPage'

// Coming Soon stub — shown for pages not yet built
const Stub = ({ name }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', minHeight: '60vh', gap: 14, textAlign: 'center',
    padding: 32,
  }}>
    <div style={{ fontSize: 40 }}>🚧</div>
    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.4px' }}>
      {name}
    </div>
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      background: 'var(--orange-l)', border: '1px solid var(--orange-b)',
      borderRadius: 20, padding: '6px 16px',
      fontSize: 12, fontWeight: 700, color: 'var(--orange)',
      letterSpacing: '0.5px', textTransform: 'uppercase',
    }}>
      Coming soon
    </div>
    <p style={{ fontSize: 13.5, color: 'var(--grey-text)', maxWidth: 320, lineHeight: 1.65, marginTop: 4 }}>
      This section is being built out. Check back soon — or see Release Notes for the latest updates.
    </p>
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
            <Route path="release"        element={<ReleaseNotes />} />
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
