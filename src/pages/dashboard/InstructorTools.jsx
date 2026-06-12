import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import styles from './InstructorTools.module.css'

export default function InstructorTools() {
  const { profile } = useAuth()
  const [myCourses,     setMyCourses]     = useState([])
  const [resources,     setResources]     = useState([])
  const [activeTool,    setActiveTool]    = useState(null)
  const [activeTab,     setActiveTab]     = useState('tools')
  const [loading,       setLoading]       = useState(true)
  const [iframeLoading, setIframeLoading] = useState(false)

  useEffect(() => {
    if (!profile) return
    async function load() {
      const [{ data: cf }, { data: ir }] = await Promise.all([
        supabase
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
          .eq('active', true),
        supabase
          .from('instructor_resources')
          .select('*')
          .eq('active', true)
          .order('sort_order'),
      ])
      if (cf) setMyCourses(cf)
      if (ir) setResources(ir)
      setLoading(false)
    }
    load()
  }, [profile])

  // Build tab list — sort_order controls position (Schedule=0, DCW Workspace=1)
  const allTools = myCourses.flatMap(fc =>
    (fc.courses?.course_tools ?? []).map(t => ({
      ...t,
      courseTitle: fc.courses?.title,
      courseId:    fc.courses?.id,
    }))
  ).sort((a, b) => a.sort_order - b.sort_order)

  // Build iframe URL — pass user identity via query params for VLC apps.
  // Skip for third-party URLs (Notion, etc.) where params are irrelevant.
  function buildToolUrl(tool) {
    if (!tool.tool_url || tool.tool_url === 'about:blank') return null
    try {
      const url = new URL(tool.tool_url)
      // Only inject VLC user params for our own Vercel apps
      const isVlcApp = url.hostname.endsWith('vercel.app')
      if (profile && isVlcApp) {
        url.searchParams.set('vlc_user',     profile.full_name ?? '')
        url.searchParams.set('vlc_initials', getInitials(profile.full_name))
        url.searchParams.set('vlc_email',    profile.email ?? '')
        url.searchParams.set('vlc_role',     profile.role ?? 'instructor')
      }
      return url.toString()
    } catch {
      return tool.tool_url
    }
  }

  function openTool(tool) {
    setActiveTool(tool)
    setActiveTab(tool.id)
    // Only show loading spinner for real URLs
    setIframeLoading(!!tool.tool_url && tool.tool_url !== 'about:blank')
  }

  function closeFrame() {
    setActiveTool(null)
    setActiveTab('tools')
  }

  const isScheduleTab = activeTool?.tool_url === 'about:blank' || !activeTool?.tool_url

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

      {/* ── TOOLS HOME ── */}
      {activeTab === 'tools' && (
        <div className={styles.toolsView}>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>My courses</div>
            {loading ? (
              <div className={styles.empty}>Loading…</div>
            ) : myCourses.length === 0 ? (
              <div className={styles.empty}>No courses assigned yet. Ask an admin to assign you as a facilitator.</div>
            ) : (
              <div className={styles.courseGrid}>
                {myCourses.map(fc => {
                  const c     = fc.courses
                  const tools = (c?.course_tools ?? []).sort((a,b) => a.sort_order - b.sort_order)
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
                        <div className={styles.toolBtns}>
                          {tools.map(t => (
                            <button
                              key={t.id}
                              className={t.tool_url && t.tool_url !== 'about:blank'
                                ? styles.toolBtn
                                : styles.toolBtnSecondary}
                              onClick={() => openTool({ ...t, courseTitle: c?.title })}
                            >
                              {t.icon} {t.short_label ?? t.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>Teaching resources</div>
            {resources.length === 0 ? (
              <div className={styles.empty}>No resources added yet.</div>
            ) : (
              <div className={styles.stdGrid}>
                {resources.map((r) => {
                  const hasLink = r.url && r.url.trim().length > 0
                  const cta = r.cta_label || (hasLink ? 'Open' : 'Coming soon')
                  const isOrange = (r.icon_bg || '').includes('orange')
                  const ctaColor = !hasLink
                    ? 'var(--grey-mid)'
                    : isOrange ? 'var(--orange)' : 'var(--blue)'
                  const cardProps = hasLink
                    ? {
                        as: 'a',
                        href: r.url.trim(),
                        target: r.open_in_new_tab ? '_blank' : '_self',
                        rel: 'noreferrer',
                      }
                    : {}
                  const Tag = hasLink ? 'a' : 'div'
                  return (
                    <Tag
                      key={r.id}
                      className={styles.stdCard}
                      href={hasLink ? r.url.trim() : undefined}
                      target={hasLink ? (r.open_in_new_tab ? '_blank' : '_self') : undefined}
                      rel={hasLink ? 'noreferrer' : undefined}
                      style={hasLink ? { textDecoration: 'none', color: 'inherit' } : undefined}
                    >
                      <div className={styles.stdIcon} style={{ background: r.icon_bg }}>{r.icon}</div>
                      <div className={styles.stdTitle}>{r.title}</div>
                      <div className={styles.stdDesc}>{r.description}</div>
                      <div className={styles.stdCta} style={{ color: ctaColor }}>
                        {cta}{hasLink ? ' →' : ''}
                      </div>
                    </Tag>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── FRAME / PLACEHOLDER VIEW ── */}
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
              {/* Show user context being passed — transparency for the instructor */}
              {!isScheduleTab && profile && (
                <div className={styles.frameUser}>
                  <div className={styles.frameUserAvatar}>{getInitials(profile.full_name)}</div>
                  <span>{profile.full_name}</span>
                </div>
              )}
              <button className={styles.frameClose} onClick={closeFrame}>✕ Close</button>
            </div>
          </div>

          {/* Schedule placeholder */}
          {isScheduleTab && (
            <div className={styles.schedulePlaceholder}>
              <div className={styles.spIcon}>📅</div>
              <div className={styles.spTitle}>Schedule</div>
              <p className={styles.spText}>
                The schedule view for <strong>{activeTool.courseTitle}</strong> is coming soon.
                Session times and facilitation details will appear here.
              </p>
              <div className={styles.spNote}>
                For now, manage session times in the schedules table in Supabase,
                or in the Upcoming Sessions card on your dashboard home.
              </div>
            </div>
          )}

          {/* Real iframe */}
          {!isScheduleTab && (
            <>
              {iframeLoading && (
                <div className={styles.frameLoading}>
                  <div className={styles.frameSpinner} />
                  Loading {activeTool.label}…
                </div>
              )}
              <iframe
                src={buildToolUrl(activeTool)}
                className={styles.frame}
                title={activeTool.label}
                onLoad={() => setIframeLoading(false)}
                allow="clipboard-read; clipboard-write"
                style={{ opacity: iframeLoading ? 0 : 1 }}
              />
            </>
          )}
        </div>
      )}
    </div>
  )
}

function getInitials(name) {
  if (!name) return '??'
  return name.trim().split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase()
}
