import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import Sidebar from './Sidebar'
import styles from './DashboardLayout.module.css'

const TITLES = {
  '/dashboard':             'Dashboard',
  '/dashboard/courses':     'My courses',
  '/dashboard/assignments': 'Assignments',
  '/dashboard/grades':      'Grades',
  '/dashboard/discussions': 'Discussions',
  '/dashboard/gradebook':   'Grade book',
  '/dashboard/tools':       'Instructor Tools',
  '/dashboard/schedule':    'Schedule',
  '/dashboard/release':     'Release Notes',
}

const BellIcon = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
)
const MenuIcon = () => (
  <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)
const LogoutIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
)

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { pathname } = useLocation()
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const title = TITLES[pathname] ?? 'Dashboard'

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className={styles.shell}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={styles.main}>
        <header className={styles.topbar}>
          <button className={styles.menuBtn} onClick={() => setSidebarOpen(true)}>
            <MenuIcon />
          </button>
          <h1 className={styles.title}>{title}</h1>

          {/* Right side actions */}
          <div className={styles.topbarRight}>
            <button className={styles.iconBtn}>
              <BellIcon />
              <span className={styles.notifDot} />
            </button>
            <button
              className={styles.logoutBtn}
              onClick={handleSignOut}
              title="Sign out"
            >
              <LogoutIcon />
              <span>Sign out</span>
            </button>
          </div>
        </header>

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
