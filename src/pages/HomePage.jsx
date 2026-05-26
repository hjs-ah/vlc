import { useEffect, useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import Nav from '@/components/layout/Nav'
import Button from '@/components/ui/Button'
import styles from './HomePage.module.css'

const DEFAULT_SETTINGS = {
  hero_headline: 'Learning that forms the whole person',
  hero_subtext: 'A curated learning environment for new members, discipleship, and deeper biblical formation — designed for the community, accessible to all.',
  hero_bg_photo_url: null,
  hero_fg_person_url: null,
  chip_1_value: '4',    chip_1_label: 'Active Programs',
  chip_2_value: '120+', chip_2_label: 'Members Enrolled',
  chip_3_value: '68%',  chip_3_label: 'Avg Completion',
  marquee_label: 'From the Director of Education',
}

const DEFAULT_PATHWAY = [
  { step_number: 1, name: 'New Members',          sub_label: 'Foundations of faith',  emoji: '🙏', description: 'Lay the foundation. Understand who VOW is, what we believe, and how you belong.', module_label: 'Foundation · 6 modules · 6 weeks', image_url: null },
  { step_number: 2, name: 'Discipleship',          sub_label: 'Module 4 of 8',          emoji: '📖', description: 'Go deeper. Practical formation in scripture, prayer, service, and community life.',  module_label: 'Formation · 8 modules · 10 weeks', image_url: null },
  { step_number: 3, name: 'Truth Bible Institute', sub_label: 'Begins Fall 2026',       emoji: '🎓', description: 'Rigorous biblical study for those called to lead, teach, and serve with depth.',      module_label: 'Study · 12 modules · Fall 2026',   image_url: null },
  { step_number: 4, name: 'Advanced',              sub_label: 'Leadership track',       emoji: '⭐', description: 'Leadership formation, ministry practicum, and specialized study for emerging leaders.', module_label: 'Leadership · By invitation',      image_url: null },
]

const DEFAULT_ARTICLES = [
  { tag: 'Formation', title: 'The Shepherd as Activist: Prophetic Ministry in the Urban Context',   url: null },
  { tag: 'Theology',  title: 'First Fruits, Feast Days, and the Theology of Giving',                 url: null },
  { tag: 'Community', title: 'Chess, Not Checkers: Why We Invest in the Long Game of Mentorship',    url: null },
  { tag: 'Formation', title: 'Incarnational Ministry and the Work of Presence',                       url: null },
  { tag: 'Theology',  title: 'Stewardship, Ownership, and What the Torah Says About Wealth',          url: null },
]

const DEFAULT_MARQUEE = {
  label: "This Month's Discipleship Module",
  title: 'The Theology of Presence',
  subtitle: 'Module 4 of 8 — Discipleship Class',
  scripture_text: 'Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth.',
  scripture_ref: '2 Timothy 2:15',
}

// Frame tints per step index
const FRAME_BG = ['var(--grey-bg)', 'var(--blue-l)', '#F4F1E8', '#F8F0EB']
const FRAME_BORDER = ['var(--grey-rule)', 'var(--blue-b)', '#E0D9C0', 'var(--orange-b)']

export default function HomePage() {
  const navigate = useNavigate()
  const [settings,  setSettings]  = useState(DEFAULT_SETTINGS)
  const [pathway,   setPathway]   = useState(DEFAULT_PATHWAY)
  const [articles,  setArticles]  = useState(DEFAULT_ARTICLES)
  const [courses,   setCourses]   = useState([])
  const [resources, setResources] = useState([])
  const [marquee,   setMarquee]   = useState(DEFAULT_MARQUEE)
  const [activeStep, setActiveStep] = useState(0)
  const marqueeTrackRef = useRef(null)

  const step = pathway[activeStep] ?? DEFAULT_PATHWAY[0]

  useEffect(() => {
    async function load() {
      const [{ data: s }, { data: p }, { data: a }, { data: c }, { data: r }, { data: m }] = await Promise.all([
        supabase.from('home_settings').select('*').single(),
        supabase.from('home_pathway').select('*').order('step_number'),
        supabase.from('home_publications').select('tag,title,url').eq('active', true).order('sort_order'),
        supabase.from('courses').select('*').eq('active', true).order('sort_order'),
        supabase.from('home_resources').select('*').eq('active', true).order('sort_order'),
        supabase.from('home_marquee').select('*').eq('active', true).order('sort_order').limit(1).single(),
      ])
      if (s) setSettings(s)
      if (p?.length) setPathway(p)
      if (a?.length) setArticles(a)
      if (c?.length) setCourses(c)
      if (r?.length) setResources(r)
      if (m) setMarquee(m)
    }
    load()
  }, [])

  // Double for seamless marquee loop
  const marqueeItems = [...articles, ...articles]

  return (
    <div className={styles.page}>
      <Nav />

      {/* ── MARQUEE STRIP — top of page, below nav ── */}
      <div className={styles.marqueeBar}>
        <div
          className={styles.marqueeLbl}
          style={{ minWidth: 220 }}
        >
          <span className={styles.marqueeDot}>✦</span>
          {settings.marquee_label}
        </div>
        <div
          className={styles.marqueeViewport}
          onMouseEnter={() => marqueeTrackRef.current?.style.setProperty('animation-play-state','paused')}
          onMouseLeave={() => marqueeTrackRef.current?.style.setProperty('animation-play-state','running')}
        >
          <div className={styles.marqueeTrack} ref={marqueeTrackRef}>
            {marqueeItems.map((a, i) => (
              <a
                key={i}
                href={a.url ?? '#'}
                target={a.url ? '_blank' : '_self'}
                rel="noreferrer"
                className={styles.marqueeItem}
              >
                <span className={styles.mTag}>{a.tag}</span>
                <span className={styles.mTitle}>{a.title}</span>
                <span className={styles.mArrow}>→</span>
              </a>
            ))}
          </div>
          {/* Fade masks */}
          <div className={styles.fadeLeft}  />
          <div className={styles.fadeRight} />
        </div>
      </div>

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.heroDots} />

        <div className={styles.heroInner}>

          {/* LEFT — headline + CTA */}
          <div className={styles.heroLeft}>
            <div className={styles.eyebrow}>
              <span className={styles.eyeDot} />
              VOW Center · Verity Outreach
            </div>

            <h1 className={styles.h1}>
              {settings.hero_headline.split(' ').map((word, i) => {
                const clean = word.toLowerCase().replace(/[^a-z]/g, '')
                return ['forms','formation','whole','learning'].includes(clean)
                  ? <em key={i}>{word} </em>
                  : <span key={i}>{word} </span>
              })}
            </h1>

            <p className={styles.heroSub}>{settings.hero_subtext}</p>

            <div className={styles.heroCta}>
              <Button variant="ink" size="lg" onClick={() => navigate('/login')}>
                Start learning →
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/explore')}>
                Explore
              </Button>
            </div>
            <p className={styles.heroNote}>Access is granted by VOW Center leadership.</p>

            {/* Small logo mark below CTA */}
            <img
              src="/vlc-logo.jpg"
              alt="Verity Learning Center"
              className={styles.heroLogo}
            />
          </div>

          {/* RIGHT — rounded rect graphic frame + floating chips */}
          <div className={styles.heroRight}>
            <div className={styles.graphicWrap}>

              {/* Animated frames — one per pathway step */}
              {pathway.map((s, i) => (
                <div
                  key={s.step_number}
                  className={[styles.frame, i === activeStep ? styles.frameActive : ''].join(' ')}
                  style={{
                    background: s.image_url
                      ? `url(${s.image_url}) center/cover no-repeat`
                      : FRAME_BG[i % 4],
                    border: `1px solid ${FRAME_BORDER[i % 4]}`,
                  }}
                >
                  {!s.image_url && (
                    <>
                      <span className={styles.frameEmoji}>{s.emoji}</span>
                      <span className={styles.frameLabel}>{s.name}</span>
                      <span className={styles.frameSub}>{s.description}</span>
                    </>
                  )}
                  {settings.hero_fg_person_url && i === activeStep && (
                    <img src={settings.hero_fg_person_url} alt="" className={styles.frameFg} />
                  )}
                </div>
              ))}

              {/* Floating stat chips */}
              <div className={`${styles.chip} ${styles.chip1}`}>
                <div className={styles.chipIcon} style={{ background: 'var(--grey-bg)' }}>📚</div>
                <div>
                  <div className={styles.chipVal}>{settings.chip_1_value}</div>
                  <div className={styles.chipLbl}>{settings.chip_1_label}</div>
                </div>
              </div>
              <div className={`${styles.chip} ${styles.chip2}`}>
                <div className={styles.chipIcon} style={{ background: 'var(--blue-l)' }}>👥</div>
                <div>
                  <div className={styles.chipVal}>{settings.chip_2_value}</div>
                  <div className={styles.chipLbl}>{settings.chip_2_label}</div>
                </div>
              </div>
              <div className={`${styles.chip} ${styles.chip3}`}>
                <div className={styles.chipIcon} style={{ background: 'var(--orange-l)' }}>✅</div>
                <div>
                  <div className={styles.chipVal}>{settings.chip_3_value}</div>
                  <div className={styles.chipLbl}>{settings.chip_3_label}</div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ── PATHWAY STRIP — bottom of hero ── */}
        <div className={styles.pathwayStrip}>
          <div className={styles.pathwayInner}>
            {pathway.map((s, i) => (
              <button
                key={s.step_number}
                className={[styles.pathStep, i === activeStep ? styles.pathStepActive : ''].join(' ')}
                onClick={() => setActiveStep(i)}
              >
                <div className={styles.pathNum}>{s.step_number}</div>
                <div className={styles.pathName}>{s.name}</div>
                <div className={styles.pathSub}>{s.sub_label}</div>
              </button>
            ))}
          </div>
        </div>

      </section>

      {/* ── COURSES ── */}
      <div className={styles.secWhite}>
        <div className={styles.secInner}>
          <div className={styles.secRow}>
            <div>
              <div className={styles.secTag}>Programs</div>
              <h2 className={styles.secH2}>Available learning tracks</h2>
              <p className={styles.secSub}>Structured formation pathways for every stage of your journey with VOW Center.</p>
            </div>
            <Button variant="outline" size="sm">View all</Button>
          </div>
          <div className={styles.courseGrid}>
            {(courses.length ? courses : DEFAULT_PATHWAY.map((s, i) => ({
              id: i, title: s.name, badge_label: s.name,
              thumb_color_start: '#1a1a1a', thumb_color_end: '#444',
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
      </div>

      {/* ── FIELD NOTES / RESOURCES ── */}
      {resources.length > 0 && (
        <div className={styles.secGrey}>
          <div className={styles.secInner}>
            <div className={styles.secRow}>
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
                    : <div className={styles.dropThumbPh}><span>📦</span></div>
                  }
                  <div className={styles.dropBody}>
                    <div className={styles.dropCat}>{r.category}</div>
                    <div className={styles.dropTitle}>{r.title}</div>
                    {r.subtitle && <div className={styles.dropSub}>{r.subtitle}</div>}
                    <div className={styles.dropCta}>
                      {r.resource_url
                        ? <a href={r.resource_url} target="_blank" rel="noreferrer" className={styles.dropLink}>Access →</a>
                        : <span style={{ color: 'var(--grey-mid)', fontSize: 13 }}>Coming soon</span>
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── INSTRUCTOR TOOLS ── */}
      <div className={styles.secWhite}>
        <div className={styles.secInner}>
          <div className={styles.secRow}>
            <div>
              <div className={styles.secTag}>For Instructors</div>
              <h2 className={styles.secH2}>Teaching resources</h2>
            </div>
            <Button variant="ink" size="sm" onClick={() => navigate('/login')}>Instructor login →</Button>
          </div>
          <div className={styles.toolGrid}>
            {[
              { icon: '📋', bg: 'var(--grey-bg)',  title: 'Bible Study Guide',      desc: 'Structured templates for weekly Bible study facilitation.' },
              { icon: '🏛️', bg: 'var(--blue-l)',   title: 'Foundation Class Guide', desc: 'Curriculum support for new members class instructors.' },
              { icon: '🎯', bg: 'var(--grey-bg)',  title: 'Teaching Mechanism',     desc: 'AI slide builder that walks you through a structured presentation.' },
              { icon: '📤', bg: 'var(--orange-l)', title: 'Share Content',           desc: 'Send a resource or announcement to your managed email list.', orange: true },
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
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerLogo}>
          <img src="/vlc-logo.jpg" alt="Verity Learning Center" className={styles.footerLogoImg} />
          <span>Verity Learning Center · VOW Center</span>
        </div>
        <span className={styles.footerCopy}>© 2026 Verity Outreach Worship Center</span>
      </footer>
    </div>
  )
}
