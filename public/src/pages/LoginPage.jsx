import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      if (error.message.includes('Invalid login') || error.message.includes('invalid_credentials')) {
        setError('Email or password is incorrect.')
      } else {
        setError(error.message)
      }
      setLoading(false)
    } else {
      // Small delay to let AuthContext finish fetching the profile
      setTimeout(() => navigate('/dashboard'), 300)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <div className={styles.logoMark}>V</div>
          <div className={styles.logoText}>Verity Learning Center</div>
        </div>

        <h1 className={styles.h1}>Sign in</h1>
        <p className={styles.sub}>Access is managed by VOW Center leadership.</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}
          <div className={styles.field}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@vowcenter.org"
              required
              autoFocus
            />
          </div>
          <div className={styles.field}>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <Button
            type="submit"
            variant="ink"
            size="lg"
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign in →'}
          </Button>
        </form>

        <button className={styles.back} onClick={() => navigate('/')}>← Back to home</button>
      </div>
    </div>
  )
}
