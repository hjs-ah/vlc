import { Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'

export default function ProtectedRoute({ children, requireRole }) {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--grey-text)', fontSize: 14 }}>
        Loading…
      </div>
    )
  }

  if (!profile) return <Navigate to="/login" replace />

  if (requireRole) {
    const hierarchy = { student: 1, instructor: 2, admin: 3 }
    if ((hierarchy[profile.role] ?? 0) < (hierarchy[requireRole] ?? 0)) {
      return <Navigate to="/dashboard" replace />
    }
  }

  return children
}
