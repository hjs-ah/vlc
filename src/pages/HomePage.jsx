import { useEffect, useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import Nav from '@/components/layout/Nav'
import Button from '@/components/ui/Button'
import styles from './HomePage.module.css'

// ── Fallback data while loading ──────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  hero_headline: 'Learning that forms the whole person',
  hero_subtext: 'A curated learning environment for new members, discipleship, and deeper biblical formation — designed for the community, accessible to all.',
  hero_bg_photo_url: null,
  hero_fg_person_url: null,
  chip_1_value: '4',  chip_1_label: 'Active Programs',
  chip_2_value: '120+', chip_2_label: 'Members Enrolled',
  chip_3_value: '68%', chip_3_label: 'Avg Completion',
  marquee_label: 'From the Director of Education',
}

const DEFAULT_PATHWAY = [
  { step_number: 1, name: 'New Members',          sub_label: 'Foundations of faith',  emoji: '🙏', description: 'Lay the foundation. Understand who VOW is, what we believe, and how you belong.' },
  { step_number: 2, name: 'Discipleship',          sub_label: 'Module 4 of 8',          emoji: '📖', description: 'Go deeper. Practical formation in scripture, prayer, service, and community life.' },
  { step_number: 3, name: 'Truth Bible Institute', sub_label: 'Begins Fall 2026',       emoji: '🎓', description: 'Rigorous biblical study for those called to lead, teach, and serve the body with depth.' },
  { step_number: 4, name: 'Advanced',              sub_label: 'Leadership track',       emoji: '⭐', description: 'Leadership formation, ministry practicum, and specialized study for emerging leaders.' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const [settings, setSettings]   = useState(DEFAULT_SETTINGS)
  const [pathway, setPathway]     = useState(DEFAULT_PATHWAY)
  const [articles, setArticles]   = useState([])
  const [courses, setCourses]     = useState([])
  const [resources, setResources] = useState([])
  const [activeStep, setActiveStep] = useState(0)
  const marqueeRef = useRef(null)

  useEffect(() => {
    async function loadData() {
      const [{ data: s }, { data: p }, { data: a }, { data: c }, { data: r }] = await Promise.all([
        supabase.from('site_settings').select('*').single(),
        supabase.from('pathway_config').select('*').order('step_number'),
        supabase.from('publications').select('tag,title,url').eq('active', true).order('sort_order'),
        supabase.from('courses').select('*').eq('active', true).order('sort_order'),
        supabase.from('resources').select('*').eq('active', true).order('sort_order'),
      ])
      if (s) setSettings(s)
      if (p?.length) setPathway(p)
      if (a?.length) setArticles(a)
      if (c?.length) setCourses(c)
      if (r?.length) setResources(r)
    }
    loadData()
  }, [])

  // Double articles for seamless marquee loop
  const marqueeItems = [...articles, ...articles]

  const step = pathway[activeStep] ?? DEFAULT_PATHWAY[0]

  return (
    <div className={styles.page}>
      <Nav />

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.heroDotGrid} />

        <div className={styles.heroBody}>
          {/* LEFT */}
          <div className={styles.heroLeft}>
            <div className={styles.eyebrow}>
              <span className={styles.eyebrowDot} />
              VOW Center · Verity Outreach
            </div>
            <h1
              className={styles.h1}
              dangerouslySetInnerHTML={{
                __html: settings.hero_headline.replace(
                  /(forms|formation|whole)/gi,
                  '<em>$1</em>'
                ),
              }}
            />
            <p className={styles.sub}>{settings.hero_subtext}</p>
            <div className={styles.cta}>
              <Button variant="ink" size="lg" onClick={() => navigate('/login')}>
                Start learning →
              </Button>
              <Button variant="outline" size="lg">
                Browse programs
              </Button>
            </div>
            <p className={styles.note}>Access is granted by VOW Center leadership.</p>
          </div>

          {/* RIGHT: Graphic */}
          <div className={styles.heroRight}>
            <div className={styles.graphic}>
              {/* Static illustrated frame (transitions on step change) */}
              <div
                className={styles.graphicFrame}
                style={{
                  background: ['var(--grey-bg)', 'var(--blue-l)', '#F4F1E8', '#F8F0EB'][activeStep] ?? 'var(--grey-bg)',
                  border: `1px solid ${['var(--grey-rule)', 'var(--blue-b)', '#E0D9C0', 'var(--orange-b)'][activeStep] ?? 'var(--grey-rule)'}`,
                }}
              >
                {settings.hero_bg_photo_url ? (
                  <img src={settings.hero_bg_photo_url} alt="" className={styles.graphicPhoto} />
                ) : (
                  <>
                    <div className={styles.graphicEmoji}>{step.emoji}</div>
                    <div className={styles.graphicLabel}>{step.name}</div>
                    <div className={styles.graphicDesc}>{step.description}</div>
                    <div className={styles.graphicBadges}>
                      <span className="badge badge-grey">{step.sub_label}</span>
                    </div>
                  </>
                )}
                {settings.hero_fg_person_url && (
                  <img src={settings.hero_fg_person_url} alt="" className={styles.graphicFg} />
                )}
              </div>

              {/* Floating chips */}
              <div className={`${styles.chip} ${styles.chip1}`}>
                <div className={styles.chipIcon} style={{ background: 'var(--grey-bg)' }}>📚</div>
                <div><div className={styles.chipVal}>{settings.chip_1_value}</div><div className={styles.chipLbl}>{settings.chip_1_label}</div></div>
              </div>
              <div className={`${styles.chip} ${styles.chip2}`} style={{ animationDelay: '1.6s' }}>
                <div className={styles.chipIcon} style={{ background: 'var(--blue-l)' }}>👥</div>
                <div><div className={styles.chipVal}>{settings.chip_2_value}</div><div className={styles.chipLbl}>{settings.chip_2_label}</div></div>
              </div>
              <div className={`${styles.chip} ${styles.chip3}`} style={{ animationDelay: '0.9s' }}>
                <div className={styles.chipIcon} style={{ background: 'var(--orange-l)' }}>✅</div>
                <div><div className={styles.chipVal}>{settings.chip_3_value}</div><div className={styles.chipLbl}>{settings.chip_3_label}</div></div>
              </div>
            </div>
          </div>
        </div>

        {/* ── PATHWAY TABS ── */}
        <div className={styles.pathway}>
          <div className={styles.pathwayInner}>
            {pathway.map((s, i) => (
              <button
                key={s.step_number}
                className={[styles.pstep, i === activeStep ? styles.pstepActive : '', i < activeStep ? styles.pstepDone : ''].join(' ')}
                onClick={() => setActiveStep(i)}
              >
                <div className={styles.pnum}>{s.step_number}</div>
                <div className={styles.pname}>{s.name}</div>
                <div className={styles.psub}>{s.sub_label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ── MARQUEE ── */}
        {articles.length > 0 && (
          <div className={styles.marqueeWrap}
            onMouseEnter={() => marqueeRef.current?.style.setProperty('animation-play-state', 'paused')}
            onMouseLeave={() => marqueeRef.current?.style.setProperty('animation-play-state', 'running')}
          >
            <div className={styles.marqueeLabel}>
              <span className={styles.marqueeDot}>✦</span>
              {settings.marquee_label}
            </div>
            <div className={styles.marqueeTrack} ref={marqueeRef}>
              {marqueeItems.map((a, i) => (
                <a
                  key={i}
                  href={a.url ?? '#'}
                  target={a.url ? '_blank' : '_self'}
                  rel="noreferrer"
                  className={styles.marqueeItem}
                >
                  <span className={styles.marcTag}>{a.tag}</span>
                  <span className={styles.marcTitle}>{a.title}</span>
                  <span className={styles.marcArrow}>→</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── COURSES ── */}
      <section className={styles.secWhite}>
        <div className={styles.secInner}>
          <div className={styles.secHeaderRow}>
            <div>
              <div className={styles.secTag}>Programs</div>
              <h2 className={styles.secH2}>Available learning tracks</h2>
              <p className={styles.secSub}>Structured formation pathways for every stage of your journey.</p>
            </div>
            <Button variant="outline" size="sm">View all</Button>
          </div>
          <div className={styles.courseGrid}>
            {(courses.length ? courses : DEFAULT_PATHWAY.map((s, i) => ({
              id: i, title: s.name, badge_label: s.name, module_count: 0,
              thumb_color_start: '#1a1a1a', thumb_color_end: '#444',
              cinst: 'VOW Center',
            }))).map(c => (
              <div key={c.id} className={styles.courseCard}>
                <div className={styles.courseThumb}
                  style={{ background: `linear-gradient(135deg, ${c.thumb_color_start}, ${c.thumb_color_end})` }}
                >
                  <span className={styles.courseBadge}>{c.badge_label}</span>
                </div>
                <div className={styles.courseBody}>
                  <div className={styles.courseTitle}>{c.title}</div>
                  <div className={styles.courseInst}>{c.description ?? 'VOW Center'}</div>
                  <div className={styles.courseMeta}>
                    {c.module_count > 0 && <span>{c.module_count} modules</span>}
                    {c.duration_weeks && <span>{c.duration_weeks} weeks</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEED ── */}
      <section className={styles.secGrey}>
        <div className={styles.secInner}>
          <div className={styles.secHeaderRow}>
            <div>
              <div className={styles.secTag}>From Verity</div>
              <h2 className={styles.secH2}>From the publication</h2>
              <p className={styles.secSub}>Articles, reflections, and teaching resources from VOW Center's voice on Medium.</p>
            </div>
            <Button variant="outline" size="sm">View on Medium →</Button>
          </div>
          <div className={styles.feedGrid}>
            {(articles.slice(0, 3).length ? articles.slice(0, 3) : [
              { tag: 'Formation', title: 'The Shepherd as Activist', url: null },
              { tag: 'Theology',  title: 'First Fruits and Feast Days', url: null },
              { tag: 'Community', title: 'Chess, Not Checkers', url: null },
            ]).map((a, i) => (
              <div key={i} className={styles.feedCard}>
                <div className={styles.feedTag}>{a.tag}</div>
                <div className={styles.feedTitle}>{a.title}</div>
                <div className={styles.feedFoot}>
                  <span className={styles.feedRead}>Read →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DROPS / RESOURCES ── */}
      {resources.length > 0 && (
        <section className={styles.secWhite}>
          <div className={styles.secInner}>
            <div className={styles.secHeaderRow}>
              <div>
                <div className={styles.secTag}>Field Notes</div>
                <h2 className={styles.secH2}>Resources & teachings</h2>
                <p className={styles.secSub}>One-off programs, tools, and drops from VOW Center.</p>
              </div>
              <Link to="/explore"><Button variant="outline" size="sm">See all →</Button></Link>
            </div>
            <div className={styles.dropsGrid}>
              {resources.map(r => (
                <div key={r.id} className={[styles.dropCard, r.featured ? styles.dropFeatured : ''].join(' ')}>
                  {r.thumbnail_url
                    ? <img src={r.thumbnail_url} alt={r.title} className={styles.dropThumb} />
                    : <div className={styles.dropThumbPlaceholder}><span>📦</span></div>
                  }
                  <div className={styles.dropBody}>
                    <div className={styles.dropCategory}>{r.category}</div>
                    <div className={styles.dropTitle}>{r.title}</div>
                    {r.subtitle && <div className={styles.dropSub}>{r.subtitle}</div>}
                    <div className={styles.dropCta}>
                      {r.resource_url
                        ? <a href={r.resource_url} target="_blank" rel="noreferrer" className={styles.dropLink}>Access →</a>
                        : <span className={styles.dropLink} style={{ color: 'var(--grey-mid)' }}>Coming soon</span>
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── INSTRUCTOR TOOLS ── */}
      <section className={styles.secWhite}>
        <div className={styles.secInner}>
          <div className={styles.secHeaderRow}>
            <div>
              <div className={styles.secTag}>For Instructors</div>
              <h2 className={styles.secH2}>Teaching resources</h2>
            </div>
            <Button variant="ink" size="sm" onClick={() => navigate('/login')}>Instructor login →</Button>
          </div>
          <div className={styles.toolGrid}>
            {[
              { icon: '📋', bg: 'var(--grey-bg)',    title: 'Bible Study Guide',     desc: 'Structured templates for weekly Bible study facilitation.' },
              { icon: '🏛️', bg: 'var(--blue-l)',    title: 'Foundation Class Guide', desc: 'Curriculum support for new members class instructors.' },
              { icon: '🎯', bg: 'var(--grey-bg)',    title: 'Teaching Mechanism',    desc: 'AI slide builder that walks you through a structured presentation.' },
              { icon: '📤', bg: 'var(--orange-l)',   title: 'Share Content',          desc: 'Send a resource or announcement to your managed email list.', orange: true },
            ].map((t, i) => (
              <div key={i} className={styles.toolCard}>
                <div className={styles.toolIcon} style={{ background: t.bg }}>{t.icon}</div>
                <div className={styles.toolTitle}>{t.title}</div>
                <div className={styles.toolDesc}>{t.desc}</div>
                <div className={styles.toolCta} style={{ color: t.orange ? 'var(--orange)' : 'var(--blue)' }}>
                  {t.orange ? 'Share now →' : 'Open →'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerLogo}>
          <div className={styles.footerMark}>V</div>
          <span>Verity Learning Center · VOW Center</span>
        </div>
        <span>© 2026 Verity Outreach Worship Center</span>
      </footer>
    </div>
  )
}
