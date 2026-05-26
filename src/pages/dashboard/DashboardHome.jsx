import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import styles from './DashboardHome.module.css'

export default function DashboardHome() {
  const { profile } = useAuth()
  const [enrollments, setEnrollments] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  useEffect(() => {
    async function load() {
      if (!profile) return
      const [{ data: e }, { data: a }] = await Promise.all([
        supabase.from('enrollments')
          .select('*, courses(title, badge_label, thumb_color_start, thumb_color_end)')
          .eq('student_id', profile.id)
          .order('enrolled_at', { ascending: false }),
        supabase.from('submissions')
          .select('*, assignments(title, due_date, points, courses(title))')
          .eq('student_id', profile.id)
          .eq('status', 'pending')
          .order('assignments(due_date)'),
      ])
      if (e) setEnrollments(e)
      if (a) setAssignments(a)
      setLoading(false)
    }
    load()
  }, [profile])

  const avgProgress = enrollments.length
    ? Math.round(enrollments.reduce((s, e) => s + e.progress_percent, 0) / enrollments.length)
    : 0

  return (
    <div className={`${styles.page} fade-up`}>
      <div className={styles.header}>
        <h1>{greeting}, {profile?.full_name?.split(' ')[0] ?? 'there'} 👋</h1>
        <p>Here's your formation progress at a glance.</p>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={`${styles.stat} ${styles.blue}`}>
          <div className={styles.statLabel}>Enrolled</div>
          <div className={styles.statVal}>{enrollments.length}</div>
          <div className={styles.statSub}>Active courses</div>
        </div>
        <div className={`${styles.stat} ${styles.orange}`}>
          <div className={styles.statLabel}>Due soon</div>
          <div className={styles.statVal}>{assignments.length}</div>
          <div className={styles.statSub}>Pending</div>
        </div>
        <div className={`${styles.stat} ${styles.mix}`}>
          <div className={styles.statLabel}>Progress</div>
          <div className={styles.statVal}>{avgProgress}%</div>
          <div className={styles.statSub}>Avg across courses</div>
        </div>
      </div>

      <div className={styles.grid2}>
        {/* Continue Learning */}
        <div className="card">
          <div className={styles.cardHead}><span>Continue learning</span></div>
          {loading ? (
            <div className={styles.empty}>Loading…</div>
          ) : enrollments.length === 0 ? (
            <div className={styles.empty}>No courses enrolled yet.</div>
          ) : (
            enrollments.map(e => (
              <div key={e.id} className={styles.courseRow}>
                <div className={styles.courseThumb}
                  style={{ background: `linear-gradient(135deg, ${e.courses?.thumb_color_start ?? '#1a1a1a'}, ${e.courses?.thumb_color_end ?? '#444'})` }}
                />
                <div className={styles.courseInfo}>
                  <div className={styles.courseName}>{e.courses?.title ?? 'Course'}</div>
                  <div className="progress-bar" style={{ marginTop: 5 }}>
                    <div className="progress-fill" style={{ width: `${e.progress_percent}%` }} />
                  </div>
                </div>
                <span className={styles.coursePct}>{e.progress_percent}%</span>
              </div>
            ))
          )}
        </div>

        {/* Upcoming Assignments */}
        <div className="card">
          <div className={styles.cardHead}><span>Upcoming assignments</span></div>
          {loading ? (
            <div className={styles.empty}>Loading…</div>
          ) : assignments.length === 0 ? (
            <div className={styles.empty}>No pending assignments.</div>
          ) : (
            assignments.slice(0, 4).map((s, i) => (
              <div key={s.id} className={styles.aRow}>
                <div className={styles.aDot} style={{ background: i === 0 ? 'var(--orange)' : 'var(--blue)' }} />
                <div className={styles.aInfo}>
                  <div className={styles.aTitle}>{s.assignments?.title}</div>
                  <div className={styles.aMeta}>{s.assignments?.courses?.title}</div>
                </div>
                {s.assignments?.due_date && (
                  <span className={`badge ${i === 0 ? 'badge-orange' : 'badge-blue'}`}>
                    {new Date(s.assignments.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
