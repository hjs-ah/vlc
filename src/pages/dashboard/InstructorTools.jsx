import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import styles from './InstructorTools.module.css'

export default function InstructorTools() {
  const { profile } = useAuth()
  const [myCourses,   setMyCourses]   = useState([])
  const [activeTool,  setActiveTool]  = useState(null)  // { label, tool_url, icon, course }
  const [activeTab,   setActiveTab]   = useState('tools') // 'tools' | course tool id
  const [loading,     setLoading]     = useState(true)
  const [iframeLoading, setIframeLoading] = useState(false)

  useEffect(() => {
    if (!profile) return
    async function load() {
      // Fetch courses this instructor facilitates + any tools attached
      const { data, error } = await supabase
        .from('course_facilitators')
        .select(`
          role,
          courses (
            id, title, badge_label,
            thumb_color_start, thumb_color_end, thumbnail_url,
            course_tools ( id, label, short_label, tool_url, icon, sort_order )
          )
        `)
        .eq('facilitator_id', profile.id)
        .eq('active', true)

      if (data) setMyCourses(data)
      setLoading(false)
    }
    load()
  }, [profile])

  // Flatten all tools across all courses for the tab bar
  const allTools = myCourses.flatMap(fc =>
    (fc.courses?.course_tools ?? []).map(t => ({
      ...t,
      courseTitle: fc.courses?.title,
      courseId: fc.courses?.id,
    }))
  ).sort((a,b) => a.sort_order - b.sort_order)

  function openTool(tool) {
    setActiveTool(tool)
    setActiveTab(tool.id)
    setIframeLoading(true)
  }

  function closeFrame() {
    setActiveTool(null)
    setActiveTab('tools')
  }

  return (
    <div className={styles.page}>

      {/* Tab bar */}
      <div className={styles.tabBar}>
        <button
          className={[styles.tab, activeTab === 'tools' ? styles.tabActive : ''].join(' ')}
          onClick={closeFrame}
        >
          Instructor Tools
        </button>
        {allTools.map(t => (
          <button
            key={t.id}
            className={[styles.tab, activeTab === t.id ? styles.tabActive : ''].join(' ')}
            onClick={() => openTool(t)}
          >
            <span>{t.icon}</span>
            {t.short_label ?? t.label}
          </button>
        ))}
      </div>

      {/* ── TOOLS HOME VIEW ── */}
      {activeTab === 'tools' && (
        <div className={styles.toolsView}>

          {/* My Courses row */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>My courses</div>
            {loading ? (
              <div className={styles.empty}>Loading…</div>
            ) : myCourses.length === 0 ? (
              <div className={styles.empty}>No courses assigned yet. Ask an admin to assign you as a facilitator.</div>
            ) : (
              <div className={styles.courseGrid}>
                {myCourses.map(fc => {
                  const c = fc.courses
                  const tools = c?.course_tools ?? []
                  return (
                    <div key={c?.id} className={styles.courseCard}>
                      <div
                        className={styles.courseThumb}
                        style={c?.thumbnail_url
                          ? { backgroundImage:`url(${c.thumbnail_url})`, backgroundSize:'cover', backgroundPosition:'center' }
                          : { background:`linear-gradient(135deg,${c?.thumb_color_start??'#1a1a1a'},${c?.thumb_color_end??'#444'})` }
                        }
                      >
                        <span className={styles.courseRole}>{fc.role}</span>
                      </div>
                      <div className={styles.courseBody}>
                        <div className={styles.courseTitle}>{c?.title}</div>
                        <div className={styles.courseBadge}>{c?.badge_label}</div>
                        {/* Tool launcher buttons */}
                        {tools.length > 0 && (
                          <div className={styles.toolBtns}>
                            {tools.map(t => (
                              <button
                                key={t.id}
                                className={styles.toolBtn}
                                onClick={() => openTool({ ...t, courseTitle: c?.title })}
                              >
                                {t.icon} {t.short_label ?? t.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Standard tools */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Teaching resources</div>
            <div className={styles.stdGrid}>
              {[
                { icon:'📋', title:'Bible Study Guide',      desc:'Structured templates for weekly facilitation.',          bg:'var(--grey-bg)' },
                { icon:'🏛️', title:'Foundation Class Guide', desc:'Curriculum support for new members class.',              bg:'var(--blue-l)'  },
                { icon:'🎯', title:'Teaching Mechanism',     desc:'AI slide builder — paste notes, get a live presentation.',bg:'var(--grey-bg)' },
                { icon:'📤', title:'Share Content',          desc:'Send a resource or announcement to your email list.',    bg:'var(--orange-l)', orange:true },
              ].map((t,i) => (
                <div key={i} className={styles.stdCard}>
                  <div className={styles.stdIcon} style={{ background:t.bg }}>{t.icon}</div>
                  <div className={styles.stdTitle}>{t.title}</div>
                  <div className={styles.stdDesc}>{t.desc}</div>
                  <div className={styles.stdCta} style={{ color: t.orange ? 'var(--orange)' : 'var(--blue)' }}>
                    {t.orange ? 'Share now →' : 'Open →'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── IFRAME TOOL VIEW ── */}
      {activeTool && activeTab !== 'tools' && (
        <div className={styles.frameWrap}>
          <div className={styles.frameHeader}>
            <div className={styles.frameInfo}>
              <span className={styles.frameIcon}>{activeTool.icon}</span>
              <div>
                <div className={styles.frameTitle}>{activeTool.label}</div>
                {activeTool.courseTitle && (
                  <div className={styles.frameCourse}>{activeTool.courseTitle}</div>
                )}
              </div>
            </div>
            <div className={styles.frameActions}>
              <a
                href={activeTool.tool_url}
                target="_blank"
                rel="noreferrer"
                className={styles.frameOpen}
              >
                Open in new tab ↗
              </a>
              <button className={styles.frameClose} onClick={closeFrame}>
                ✕ Close
              </button>
            </div>
          </div>

          {iframeLoading && (
            <div className={styles.frameLoading}>
              <div className={styles.frameSpinner} />
              Loading {activeTool.label}…
            </div>
          )}

          <iframe
            src={activeTool.tool_url}
            className={styles.frame}
            title={activeTool.label}
            onLoad={() => setIframeLoading(false)}
            allow="clipboard-read; clipboard-write"
            style={{ opacity: iframeLoading ? 0 : 1 }}
          />
        </div>
      )}
    </div>
  )
}
