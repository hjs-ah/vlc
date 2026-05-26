import { useEffect, useState } from 'react'
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
  chip_1_value: '4',  chip_1_label: 'Active Programs',
  chip_2_value: '120+', chip_2_label: 'Members Enrolled',
  chip_3_value: '68%', chip_3_label: 'Avg Completion',
  marquee_label: 'From the Director of Education',
}

const DEFAULT_PATHWAY = [
  { step_number: 1, name: 'Discipleship Class',     sub_label: 'Formation · 8 modules', emoji: '📖', description: 'Go deeper. Practical formation in scripture, prayer, service, and community life.', module_label: 'Formation · 8 modules · 10 weeks', image_url: null },
  { step_number: 2, name: 'For New Members',         sub_label: 'Foundation · 6 modules', emoji: '🙏', description: 'Lay the foundation. Understand who VOW is, what we believe, and how you belong.', module_label: 'Foundation · 6 modules · 6 weeks', image_url: null },
  { step_number: 3, name: 'Truth Bible Institute',   sub_label: 'Study · Fall 2026', emoji: '🎓', description: 'Rigorous biblical study for those called to lead, teach, and serve with depth.', module_label: 'Study · 12 modules · Fall 2026', image_url: null },
  { step_number: 4, name: 'Supporting our Youth',    sub_label: 'Youth formation', emoji: '⭐', description: 'Formation programs and mentorship tracks designed specifically for young people at VOW Center.', module_label: 'Youth · Ongoing enrollment', image_url: null },
]

const DEFAULT_MARQUEE = {
  label: "This Month's Discipleship Module",
  title: 'The Theology of Presence',
  subtitle: 'Module 4 of 8 — Discipleship Class',
  scripture_text: 'Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth.',
  scripture_ref: '2 Timothy 2:15',
}

const DEFAULT_PUBS = [
  { tag: 'Formation', title: 'The Shepherd as Activist', url: null },
  { tag: 'Theology',  title: 'First Fruits and Feast Days', url: null },
  { tag: 'Community', title: 'Chess, Not Checkers', url: null },
  { tag: 'Formation', title: 'Incarnational Ministry and the Work of Presence', url: null },
]

export default function HomePage() {
  const navigate = useNavigate()
  const [settings, setSettings]   = useState(DEFAULT_SETTINGS)
  const [pathway,  setPathway]    = useState(DEFAULT_PATHWAY)
  const [articles, setArticles]   = useState(DEFAULT_PUBS)
  const [courses,  setCourses]    = useState([])
  const [resources,setResources]  = useState([])
  const [marquee,  setMarquee]    = useState(DEFAULT_MARQUEE)
  const [hovered,  setHovered]    = useState(null)   // which path item is hovered
  const [active,   setActive]     = useState(0)      // clicked/selected step

  const displayStep = hovered !== null ? hovered : active
  const step = pathway[displayStep] ?? DEFAULT_PATHWAY[0]

  useEffect(() => {
    async function loadData() {
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
    loadData()
  }, [])

  return (
    <div className={styles.page}>
      <Nav />

      {/* ══════════════════════════════
          HERO — layered overlapping boxes
      ══════════════════════════════ */}
      <section className={styles.hero}>
        <div className={styles.heroDotGrid} />

        {/* Fixed-height canvas where boxes are absolutely placed */}
        <div className={styles.heroCanvas}>

          {/* BOX 1 — top-left: Welcome / headline */}
          <div className={styles.box1}>
            <div className={styles.eyebrow}>
              <span className={styles.eyebrowDot} />
              VOW Center · Verity Outreach
            </div>
            <h1 className={styles.h1}>
              {settings.hero_headline.split(' ').map((word, i) =>
                ['forms','formation','whole','learning'].includes(word.toLowerCase().replace(/[^a-z]/g,''))
                  ? <em key={i}>{word} </em>
                  : <span key={i}>{word} </span>
              )}
            </h1>
            <p className={styles.h1sub}>{settings.hero_subtext}</p>
            <div className={styles.box1cta}>
              <Button variant="blue" size="sm" onClick={() => navigate('/login')}>
                Start learning →
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/explore')}>
                Explore
              </Button>
            </div>
          </div>

          {/* PATH LIST — left of box 2, floats mid-left */}
          <div className={styles.pathList}>
            {pathway.map((s, i) => (
              <div
                key={s.step_number}
                className={[styles.pathItem, i === displayStep ? styles.pathItemActive : ''].join(' ')}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setActive(i)}
              >
                <span className={styles.pathName}>{s.name}</span>
                <div className={styles.pathRule} />
              </div>
            ))}
          </div>

          {/* BOX 2 — bottom-center: Path graphic + detail, overlaps box 1 */}
          <div className={styles.box2}>
            {/* Image / graphic fill */}
            <div
              className={styles.box2graphic}
              style={{
                background: step.image_url
                  ? `url(${step.image_url}) center/cover no-repeat`
                  : ['#1a1a1a','#0f1f35','#151c0f','#1c100a'][displayStep % 4],
              }}
            >
              {!step.image_url && (
                <span className={styles.box2emoji}>{step.emoji}</span>
              )}
              {settings.hero_fg_person_url && (
                <img src={settings.hero_fg_person_url} alt="" className={styles.box2fg} />
              )}
              {/* Step counter badge */}
              <div className={styles.stepBadge}>
                {String(displayStep + 1).padStart(2,'0')} / {String(pathway.length).padStart(2,'0')}
              </div>
            </div>
            {/* Detail strip inside box 2 */}
            <div className={styles.box2detail}>
              <div className={styles.detailName}>{step.name}</div>
              <div className={styles.detailDesc}>{step.description}</div>
              <div className={styles.detailFooter}>
                {step.module_label && <span className={styles.detailMeta}>{step.module_label}</span>}
                <button className={styles.detailCta} onClick={() => navigate('/login')}>
                  {step.cta_label ?? 'Learn more'} →
                </button>
              </div>
            </div>
          </div>

          {/* BOX 3 — top-right: Article / publication feed */}
          <div className={styles.box3}>
            <div className={styles.feedHeader}>
              <span className={styles.feedLabel}>Article or publication<br/>feed from medium.com</span>
              <a href="https://medium.com" target="_blank" rel="noreferrer" className={styles.feedLink}>
                View all →
              </a>
            </div>
            <div className={styles.feedList}>
              {articles.slice(0, 5).map((a, i) => (
                <a
                  key={i}
                  href={a.url ?? '#'}
                  target={a.url ? '_blank' : '_self'}
                  rel="noreferrer"
                  className={styles.feedItem}
                >
                  <div className={styles.feedTag}>{a.tag}</div>
                  <div className={styles.feedTitle}>{a.title}</div>
                </a>
              ))}
            </div>
          </div>

        </div>{/* /heroCanvas */}

        {/* ── DISCIPLESHIP MODULE SPOTLIGHT STRIP ── */}
        <div className={styles.spotlight}>
          <div className={styles.spotlightInner}>
            <div className={styles.spotlightLeft}>
              <div className={styles.spotlightLabel}>{marquee.label}</div>
              <div className={styles.spotlightTitle}>{marquee.title}</div>
              {marquee.subtitle && <div className={styles.spotlightSub}>{marquee.subtitle}</div>}
            </div>
            {(marquee.scripture_text || marquee.scripture_ref) && (
              <div className={styles.spotlightScripture}>
                {marquee.scripture_text && (
                  <p className={styles.scriptureText}>"{marquee.scripture_text}"</p>
                )}
                {marquee.scripture_ref && (
                  <span className={styles.scriptureRef}>— {marquee.scripture_ref}</span>
                )}
              </div>
            )}
            <Button variant="outline" size="sm" className={styles.spotlightBtn} onClick={() => navigate('/login')}>
              View module →
            </Button>
          </div>
        </div>

      </section>

      {/* ── COURSES ── */}
      <div className={styles.secWhite}>
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
            }))).map(c => (
              <div key={c.id} className={styles.courseCard}>
                <div
                  className={styles.courseThumb}
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
        </div>
      )}

      {/* ── INSTRUCTOR TOOLS ── */}
      <div className={styles.secWhite}>
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
          <div className={styles.footerMark}>V</div>
          <span>Verity Learning Center · VOW Center</span>
        </div>
        <span>© 2026 Verity Outreach Worship Center</span>
      </footer>
    </div>
  )
}
