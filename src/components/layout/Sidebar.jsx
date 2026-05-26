import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import styles from './Sidebar.module.css'

const HomeIcon  = () => <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
const BookIcon  = () => <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
const ClipIcon  = () => <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
const ChartIcon = () => <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
const ChatIcon  = () => <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
const GearIcon  = () => <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/></svg>
const GridIcon  = () => <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M10 4v16"/></svg>
const LogoutIcon = () => <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>

export default function Sidebar({ open, onClose }) {
  const { profile, isInstructor, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <>
      {/* Mobile backdrop */}
      {open && <div className={styles.backdrop} onClick={onClose} />}

      <aside className={[styles.sidebar, open ? styles.open : ''].join(' ')}>
        <div className={styles.logo}>
          <div className={styles.logoMark}>V</div>
          <div className={styles.logoText}>
            Verity Learning
            <span>Verity Outreach</span>
          </div>
        </div>

        <nav className={styles.nav}>
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Main</div>
            <NavItem to="/dashboard"             icon={<HomeIcon />}  label="Dashboard"   onClick={onClose} />
            <NavItem to="/dashboard/courses"     icon={<BookIcon />}  label="My courses"  onClick={onClose} />
            <NavItem to="/dashboard/assignments" icon={<ClipIcon />}  label="Assignments" badge="3" onClick={onClose} />
            <NavItem to="/dashboard/grades"      icon={<ChartIcon />} label="Grades"      onClick={onClose} />
            <NavItem to="/dashboard/discussions" icon={<ChatIcon />}  label="Discussions" badge="5" onClick={onClose} />
          </div>

          {isInstructor && (
            <div className={styles.section}>
              <div className={styles.sectionLabel}>Instructor</div>
              <NavItem to="/dashboard/gradebook" icon={<GridIcon />} label="Grade book"       onClick={onClose} />
              <NavItem to="/dashboard/tools"     icon={<GearIcon />} label="Instructor tools" onClick={onClose} />
            </div>
          )}

          {isAdmin && (
            <div className={styles.section}>
              <div className={styles.sectionLabel}>Admin</div>
              <NavItem to="/admin" icon={<GearIcon />} label="Admin panel" onClick={onClose} />
            </div>
          )}
        </nav>

        <div className={styles.bottom}>
          <button className={styles.userChip} onClick={handleSignOut}>
            <div className={styles.avatar}>{initials}</div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{profile?.full_name ?? 'User'}</div>
              <div className={styles.userRole}>{profile?.role ?? ''}</div>
            </div>
            <LogoutIcon />
          </button>
        </div>
      </aside>
    </>
  )
}

function NavItem({ to, icon, label, badge, onClick }) {
  return (
    <NavLink
      to={to}
      end={to === '/dashboard'}
      className={({ isActive }) =>
        [styles.navItem, isActive ? styles.active : ''].join(' ')
      }
      onClick={onClick}
    >
      <span className={styles.navIcon}>{icon}</span>
      <span>{label}</span>
      {badge && <span className={styles.badge}>{badge}</span>}
    </NavLink>
  )
}
