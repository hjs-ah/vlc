import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import Button from '@/components/ui/Button'
import styles from './Nav.module.css'

export default function Nav() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>

        <Link to="/" className={styles.logo}>
          <img src="/vlc-logo-wide.jpg" alt="Verity Learning Center" className={styles.logoImg} />
        </Link>

        {/* CENTER — nav links */}
        <div className={styles.links}>
          <Link to="/">Programs</Link>
          <Link to="/explore">Explore</Link>
          <Link to="/">About</Link>
        </div>

        {/* RIGHT — auth actions */}
        <div className={styles.actions}>
          {profile ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                Dashboard
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => navigate('/login')}>
                Sign in
              </Button>
              <Button variant="ink" size="sm" onClick={() => navigate('/login')}>
                Get started
              </Button>
            </>
          )}
        </div>

      </div>
    </nav>
  )
}
