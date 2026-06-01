import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import styles from './DashboardHome.module.css'

// Icons for quick-nav cards
const BookIcon  = () => <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
const ClipIcon  = () => <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
const ChartIcon = () => <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
const ChatIcon  = () => <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
const CalIcon   = () => <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
const GearIcon  = () => <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/></svg>
const AdminIcon = () => <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>

const now = new Date()
const dateStr = now.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })
const timeStr = now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })

const SESSION_COLORS = {
  'Class':        { bg:'var(--blue-l)',   dot:'var(--blue)'   },
  'Bible Study':  { bg:'var(--orange-l)', dot:'var(--orange)' },
  'Youth':        { bg:'#E8F8EE',          dot:'var(--green)'  },
  'Meeting':      { bg:'var(--grey-bg)',   dot:'var(--grey-dark)' },
  'Office Hours': { bg:'#F4F1E8',          dot:'#8A7040'       },
}

export default function DashboardHome() {
  const { profile, isInstructor, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [myCourses, setMyCourses] = useState([])
  const [enrollments,    setEnrollments]    = useState([])
  const [assignments,    setAssignments]    = useState([])
  const [schedules,      setSchedules]      = useState([])
  const [announcements,  setAnnouncements]  = useState([])
  const [allEnrollments, setAllEnrollments] = useState([]) // instructor: all students
  const [loading, setLoading] = useState(true)

  const firstName = profile?.full_name?.trim().split(/\s+/)[0] ?? 'there'
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  function getInitials(name) {
    if (!name) return '?'
    return name.trim().split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase()
  }

  useEffect(() => {
    if (!profile) return
    async function load() {
      const queries = [
        supabase.from('schedules')
          .select('*, courses(title)')
          .eq('active', true)
          .gte('scheduled_date', new Date().toISOString().split('T')[0])
          .order('scheduled_date').order('start_time')
          .limit(6),
        supabase.from('announcements')
          .select('*, profiles(full_name)')
          .eq('active', true)
          .order('pinned', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(3),
      ]

      // Students also fetch their own enrollments + pending submissions
      if (!isInstructor) {
        queries.push(
          supabase.from('enrollments')
            .select('*, courses(title, badge_label, thumb_color_start, thumb_color_end, thumbnail_url)')
            .eq('student_id', profile.id)
            .order('enrolled_at', { ascending: false }),
          supabase.from('submissions')
            .select('*, assignments(title, due_date, points, courses(title))')
            .eq('student_id', profile.id)
            .eq('status', 'pending')
        )
      }

      // Instructors/admins also fetch all enrollments for roster view
      if (isInstructor) {
        queries.push(
          supabase.from('enrollments')
            .select('*, profiles!student_id(full_name, email), courses(title)')
            .order('enrolled_at', { ascending: false })
            .limit(8)
        )
      }

      const results = await Promise.all(queries)
      const [{ data: sched }, { data: ann }] = results
      if (sched) setSchedules(sched)
      if (ann)   setAnnouncements(ann)

      if (!isInstructor) {
        const [,,{ data: enroll }, { data: asgn }] = results
        if (enroll) setEnrollments(enroll)
        if (asgn)   setAssignments(asgn)
      }
      if (isInstructor) {
        const [,,{ data: allE }] = results
        if (allE) setAllEnrollments(allE)
      }
      // Instructors: fetch their assigned courses for the banner
      if (isInstructor) {
        const { data: myC } = await supabase
          .from('course_facilitators')
          .select('courses(title)')
          .eq('facilitator_id', profile.id)
          .eq('active', true)
        if (myC) setMyCourses(myC.map(r => r.courses?.title).filter(Boolean))
      }

      setLoading(false)
    }
    load()
  }, [profile, isInstructor])

  const avgProgress = enrollments.length
    ? Math.round(enrollments.reduce((s, e) => s + e.progress_percent, 0) / enrollments.length)
    : 0

  const upcomingToday = schedules.filter(s =>
    s.scheduled_date === new Date().toISOString().split('T')[0]
  )

  return (
    <div className={styles.page}>

      {/* ── HEADER ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.avatar}>{getInitials(profile?.full_name)}</div>
          <div>
            <h1 className={styles.greeting}>{greeting}, {firstName} 👋</h1>
            <div className={styles.dateLine}>{dateStr} | {timeStr}</div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.roleChip}>{profile?.role ?? 'student'}</div>
          {upcomingToday.length > 0 && (
            <div className={styles.todayBadge}>
              {upcomingToday.length} session{upcomingToday.length > 1 ? 's' : ''} today
            </div>
          )}
        </div>
      </div>

      {/* ── QUICK NAV CARDS — large nav shortcuts ── */}
      <div className={styles.quickNav}>
        {[
          { icon: <BookIcon />,  label: 'My Courses',      to: '/dashboard/courses',     color: 'var(--blue-l)',   border: 'var(--blue-b)'   },
          { icon: <ClipIcon />,  label: 'Assignments',     to: '/dashboard/assignments', color: 'var(--orange-l)', border: 'var(--orange-b)' },
          { icon: <ChartIcon />, label: 'Grades',          to: '/dashboard/grades',      color: 'var(--grey-bg)',  border: 'var(--grey-rule)' },
          { icon: <ChatIcon />,  label: 'Discussions',     to: '/dashboard/discussions', color: 'var(--grey-bg)',  border: 'var(--grey-rule)' },
          { icon: <CalIcon />,   label: 'Schedule',        to: '/dashboard/schedule',    color: '#E8F8EE',          border: '#B8E8C8'          },
          ...(isInstructor ? [
            { icon: <GearIcon />, label: 'Instructor Tools', to: '/dashboard/tools',    color: 'var(--blue-l)',   border: 'var(--blue-b)'   },
          ] : []),
          ...(isAdmin ? [
            { icon: <AdminIcon />, label: 'Admin Panel',   to: '/admin',                 color: 'var(--orange-l)', border: 'var(--orange-b)' },
          ] : []),
        ].map((item, i) => (
          <button key={i} className={styles.quickNavBtn}
            style={{ background: item.color, borderColor: item.border }}
            onClick={() => navigate(item.to)}
          >
            <span className={styles.quickNavIcon}>{item.icon}</span>
            <span className={styles.quickNavLabel}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* ── FACILITATOR BANNER (instructors only) ── */}
      {isInstructor && myCourses.length > 0 && (
        <div className={styles.facBanner}>
          <div className={styles.facBannerLeft}>
            <span className={styles.facBannerIcon}>🎓</span>
            <div>
              <div className={styles.facBannerTitle}>You're a facilitator!</div>
              <div className={styles.facBannerSub}>
                {myCourses.join(' · ')}
              </div>
            </div>
          </div>
          <button
            className={styles.facBannerBtn}
            onClick={() => navigate('/dashboard/tools')}
          >
            Open Instructor Tools →
          </button>
        </div>
      )}

      {/* ── STAT CHIPS (profile card style from reference) ── */}
      <div className={styles.profileCard}>
        <div className={styles.profileProgress}>
          <div className={styles.profileName}>{profile?.full_name}</div>
          <div className={styles.profileSub}>Member since {new Date(profile?.created_at ?? Date.now()).toLocaleDateString('en-US',{month:'short',year:'numeric'})}</div>
          {!isInstructor && (
            <>
              <div className={styles.progressBarWrap}>
                <div className={styles.progressBarFill} style={{ width: `${avgProgress}%` }} />
              </div>
              <div className={styles.progressLabel}>
                <span>Overall progress</span><span>{avgProgress}%</span>
              </div>
            </>
          )}
        </div>
        <div className={styles.statChips}>
          {!isInstructor ? (
            <>
              <StatChip icon="📚" val={enrollments.length} lbl="Enrolled" color="blue" />
              <StatChip icon="⏱"  val={`${Math.round(avgProgress * 0.4)}h`} lbl="Learning time" color="orange" />
              <StatChip icon="📋" val={assignments.length} lbl="Pending" color="grey" />
              <StatChip icon="✅" val={enrollments.filter(e=>e.progress_percent===100).length} lbl="Completed" color="green" />
            </>
          ) : (
            <>
              <StatChip icon="👥" val={allEnrollments.length} lbl="Students" color="blue" />
              <StatChip icon="📅" val={schedules.length} lbl="Upcoming" color="orange" />
              <StatChip icon="📢" val={announcements.length} lbl="Announcements" color="grey" />
              <StatChip icon="🏫" val="4" lbl="Active courses" color="green" />
            </>
          )}
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      <div className={styles.mainGrid}>

        {/* LEFT COLUMN */}
        <div className={styles.leftCol}>

          {/* STUDENT: Continue Learning */}
          {!isInstructor && (
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <span>Continue learning</span>
                <span className={styles.cardHeadSub}>My courses ({enrollments.length})</span>
              </div>
              {loading ? <div className={styles.empty}>Loading…</div>
              : enrollments.length === 0 ? <div className={styles.empty}>No courses enrolled yet.</div>
              : enrollments.map(e => (
                <div key={e.id} className={styles.courseRow}>
                  <div className={styles.courseThumb} style={
                    e.courses?.thumbnail_url
                      ? { backgroundImage:`url(${e.courses.thumbnail_url})`, backgroundSize:'cover', backgroundPosition:'center' }
                      : { background:`linear-gradient(135deg,${e.courses?.thumb_color_start??'#1a1a1a'},${e.courses?.thumb_color_end??'#444'})` }
                  }/>
                  <div className={styles.courseInfo}>
                    <div className={styles.courseName}>{e.courses?.title ?? 'Course'}</div>
                    <div className={styles.courseBar}>
                      <div className={styles.courseBarFill} style={{ width:`${e.progress_percent}%` }} />
                    </div>
                  </div>
                  <span className={styles.coursePct}>{e.progress_percent}%</span>
                </div>
              ))}
            </div>
          )}

          {/* INSTRUCTOR: Recent student activity */}
          {isInstructor && (
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <span>Student roster</span>
                <span className={styles.cardHeadSub}>Recent activity</span>
              </div>
              {loading ? <div className={styles.empty}>Loading…</div>
              : allEnrollments.length === 0 ? <div className={styles.empty}>No enrollments yet.</div>
              : (
                <div className={styles.rosterTable}>
                  <div className={styles.rosterHeader}>
                    <span>Student</span><span>Course</span><span>Progress</span><span>Status</span>
                  </div>
                  {allEnrollments.slice(0,6).map(e => (
                    <div key={e.id} className={styles.rosterRow}>
                      <div className={styles.rosterName}>
                        <div className={styles.rosterAvatar}>
                          {e.profiles?.full_name?.split(' ').map(n=>n[0]).join('').slice(0,2) ?? '?'}
                        </div>
                        <span>{e.profiles?.full_name ?? '—'}</span>
                      </div>
                      <span className={styles.rosterCourse}>{e.courses?.title ?? '—'}</span>
                      <div className={styles.rosterProgress}>
                        <div className={styles.rosterBar}>
                          <div className={styles.rosterBarFill} style={{ width:`${e.progress_percent}%` }} />
                        </div>
                        <span>{e.progress_percent}%</span>
                      </div>
                      <span className={`badge ${e.progress_percent === 100 ? 'badge-green' : e.progress_percent > 0 ? 'badge-blue' : 'badge-grey'}`}>
                        {e.progress_percent === 100 ? 'Done' : e.progress_percent > 0 ? 'Active' : 'Not started'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* BOTH: Announcements */}
          <div className={styles.card}>
            <div className={styles.cardHead}><span>Announcements</span></div>
            {announcements.length === 0
              ? <div className={styles.empty}>No announcements.</div>
              : announcements.map(a => (
                <div key={a.id} className={styles.announcRow}>
                  {a.pinned && <span className={styles.pinnedDot} />}
                  <div>
                    <div className={styles.announcTitle}>{a.title}</div>
                    <div className={styles.announcBody}>{a.body}</div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className={styles.rightCol}>

          {/* SCHEDULE */}
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <span>Upcoming sessions</span>
              {isInstructor && (
                <button className={styles.cardAction}>+ Add session</button>
              )}
            </div>
            {loading ? <div className={styles.empty}>Loading…</div>
            : schedules.length === 0 ? <div className={styles.empty}>No upcoming sessions.</div>
            : schedules.map(s => {
                const meta = SESSION_COLORS[s.session_type] ?? SESSION_COLORS['Class']
                const isToday = s.scheduled_date === new Date().toISOString().split('T')[0]
                return (
                  <div key={s.id} className={styles.schedRow} style={{ background: isToday ? meta.bg : 'transparent' }}>
                    <div className={styles.schedDot} style={{ background: meta.dot }} />
                    <div className={styles.schedInfo}>
                      <div className={styles.schedTitle}>{s.title}</div>
                      <div className={styles.schedMeta}>
                        <span>{new Date(s.scheduled_date + 'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>
                        <span>·</span>
                        <span>{s.start_time?.slice(0,5)}{s.end_time ? ` – ${s.end_time.slice(0,5)}` : ''}</span>
                        {s.location && <><span>·</span><span>{s.location}</span></>}
                      </div>
                      {s.notes && <div className={styles.schedNotes}>{s.notes}</div>}
                    </div>
                    <span className={styles.schedType} style={{ color: meta.dot }}>{s.session_type}</span>
                  </div>
                )
              })
            }
          </div>

          {/* STUDENT: Upcoming assignments */}
          {!isInstructor && (
            <div className={styles.card}>
              <div className={styles.cardHead}><span>Upcoming assignments</span></div>
              {loading ? <div className={styles.empty}>Loading…</div>
              : assignments.length === 0
                ? <div className={styles.empty}>All caught up — no pending assignments.</div>
                : assignments.slice(0,4).map((s, i) => {
                    const overdue = s.assignments?.due_date && new Date(s.assignments.due_date) < new Date()
                    return (
                      <div key={s.id} className={styles.aRow}>
                        <div className={styles.aIcon} style={{ background: overdue ? 'var(--red-l)' : i===0 ? 'var(--orange-l)' : 'var(--blue-l)' }}>
                          {overdue ? '⚠️' : '📋'}
                        </div>
                        <div className={styles.aInfo}>
                          <div className={styles.aTitle}>{s.assignments?.title}</div>
                          <div className={styles.aMeta}>{s.assignments?.courses?.title} · {s.assignments?.points} pts</div>
                        </div>
                        <span className={`badge ${overdue ? 'badge-red' : i===0 ? 'badge-orange' : 'badge-blue'}`}>
                          {overdue ? 'Overdue' : s.assignments?.due_date
                            ? new Date(s.assignments.due_date).toLocaleDateString('en-US',{month:'short',day:'numeric'})
                            : 'No date'}
                        </span>
                      </div>
                    )
                  })
              }
            </div>
          )}

          {/* INSTRUCTOR/ADMIN: Quick actions */}
          {isInstructor && (
            <div className={styles.card}>
              <div className={styles.cardHead}><span>Quick actions</span></div>
              <div className={styles.quickActions}>
                {[
                  { icon:'📤', label:'Share content',     href:'/dashboard/tools' },
                  { icon:'📋', label:'Enter grades',      href:'/dashboard/gradebook' },
                  { icon:'📢', label:'Post announcement', href:'/dashboard/tools' },
                  { icon:'🎯', label:'Teaching mechanism',href:'/dashboard/tools' },
                ].map((a,i) => (
                  <a key={i} href={a.href} className={styles.quickBtn}>
                    <span className={styles.quickIcon}>{a.icon}</span>
                    <span>{a.label}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatChip({ icon, val, lbl, color }) {
  return (
    <div className={`${styles.statChip} ${styles[`chip_${color}`]}`}>
      <div className={styles.statIcon}>{icon}</div>
      <div className={styles.statVal}>{val}</div>
      <div className={styles.statLbl}>{lbl}</div>
    </div>
  )
}
