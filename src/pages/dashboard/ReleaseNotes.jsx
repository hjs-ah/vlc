import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './ReleaseNotes.module.css'

export default function ReleaseNotes() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('meta_release_updates')
      .select('*')
      .order('released_at', { ascending: false })
      .then(({ data }) => {
        if (data) setNotes(data)
        setLoading(false)
      })
  }, [])

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.tag}>Changelog</div>
        <h1 className={styles.h1}>Release Notes</h1>
        <p className={styles.sub}>Updates, improvements, and fixes to Verity Learning Center.</p>
      </div>

      {loading ? (
        <div className={styles.empty}>Loading…</div>
      ) : notes.length === 0 ? (
        <div className={styles.card}>
          <div className={styles.noteHeader}>
            <span className="badge badge-blue">v1.0</span>
            <span className={styles.noteDate}>May 2026</span>
          </div>
          <div className={styles.noteTitle}>Initial launch — Verity Learning Center</div>
          <div className={styles.noteBody}>
            <p>Platform launched for VOW Center community. Includes:</p>
            <ul>
              <li>Student and instructor dashboards</li>
              <li>Course enrollment and progress tracking</li>
              <li>Discipleship Curriculum Workspace integration</li>
              <li>Admin panel for content and user management</li>
              <li>Facilitation schedule management</li>
              <li>Announcement and marquee system</li>
            </ul>
          </div>
        </div>
      ) : notes.map(n => (
        <div key={n.id} className={styles.card}>
          <div className={styles.noteHeader}>
            <span className="badge badge-blue">{n.version}</span>
            <span className={styles.noteDate}>
              {new Date(n.released_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <div className={styles.noteTitle}>{n.title}</div>
          {n.body && <div className={styles.noteBody}>{n.body}</div>}
        </div>
      ))}
    </div>
  )
}
