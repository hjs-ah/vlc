import { Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'

export default function ProtectedRoute({ children, requireRole }) {
  const { profile, loading, session } = useAuth()

  // Show loading spinner while:
  // 1. Still checking for existing session (loading = true)
  // 2. Session exists but profile hasn't loaded yet
  // This prevents the redirect-to-login flicker on page refresh
  if (loading || session === undefined) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', color: 'var(--grey-text)', fontSize: 14,
        flexDirection: 'column', gap: 12,
      }}>
        <div style={{
          width: 24, height: 24, borderRadius: '50%',
          border: '2px solid var(--grey-rule)',
          borderTopColor: 'var(--blue)',
          animation: 'spin 0.7s linear infinite',
        }} />
        <span>Loading…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
