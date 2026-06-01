import { useEffect, useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import Nav from '@/components/layout/Nav'
import Button from '@/components/ui/Button'
import styles from './HomePage.module.css'

const DEFAULT_SETTINGS = {
  hero_headline: 'Learning that forms the whole person',
  hero_subtext: 'A curated learning environment for new members, discipleship, and deeper biblical formation — designed for the community, accessible to all.',
  hero_bg_photo_url: null, hero_fg_person_url: null,
  chip_1_value: '4', chip_1_label: 'Active Programs',
  chip_2_value: '120+', chip_2_label: 'Members Enrolled',
  chip_3_value: '68%', chip_3_label: 'Avg Completion',
  marquee_label: 'From the Director of Education',
  show_view_all: false,
}

const DEFAULT_PATHWAY = [
  { step_number:1, name:'New Members',          sub_label:'Foundations of faith', emoji:'🙏', description:'Lay the foundation. Understand who VOW is, what we believe, and how you belong.',            module_label:'Foundation · 6 modules · 6 weeks',    image_url:null },
  { step_number:2, name:'Discipleship',          sub_label:'Module 4 of 8',        emoji:'📖', description:'Go deeper. Practical formation in scripture, prayer, service, and community life.',          module_label:'Formation · 8 modules · 10 weeks',    image_url:null },
  { step_number:3, name:'Truth Bible Institute', sub_label:'Begins Fall 2026',     emoji:'🎓', description:'Rigorous biblical study for those called to lead, teach, and serve with depth.',            module_label:'Study · 12 modules · Fall 2026',      image_url:null },
  { step_number:4, name:'Advanced',              sub_label:'Leadership track',     emoji:'⭐', description:'Leadership formation, ministry practicum, and specialized study for emerging leaders.',      module_label:'Leadership · By invitation',          image_url:null },
]

const DEFAULT_ARTICLES = [
  { tag:'Formation', title:'The Shepherd as Activist: Prophetic Ministry in the Urban Context',  url:null },
  { tag:'Theology',  title:'First Fruits, Feast Days, and the Theology of Giving',                url:null },
  { tag:'Community', title:'Chess, Not Checkers: Why We Invest in the Long Game of Mentorship',   url:null },
  { tag:'Formation', title:'Incarnational Ministry and the Work of Presence',                      url:null },
  { tag:'Theology',  title:'Stewardship, Ownership, and What the Torah Says About Wealth',         url:null },
]

const DEFAULT_MARQUEE = {
  label:"This Month's Discipleship Module",
  title:'The Theology of Presence',
  subtitle:'Module 4 of 8 — Discipleship Class',
  scripture_text:'Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth.',
  scripture_ref:'2 Timothy 2:15',
}

// Chips: unique content + position per step — no fixed chip1/chip2/chip3 classes
const STEP_META = [
  {
    frameBg:'var(--grey-bg)', accentColor:'var(--grey-dark)',
    chips:[
      { icon:'🙏', val:'6',    lbl:'Modules',        style:{ top:'-14px',  right:'10px'  }, bg:'var(--grey-bg)',   delay:'0s'   },
      { icon:'📅', val:'6wk',  lbl:'Duration',        style:{ bottom:'20px',right:'-18px' }, bg:'var(--orange-l)', delay:'1.6s' },
      { icon:'👥', val:'Open', lbl:'Enrollment',      style:{ top:'38%',   left:'-22px'  }, bg:'var(--blue-l)',   delay:'0.9s' },
    ],
  },
  {
    frameBg:'var(--blue-l)', accentColor:'var(--blue)',
    chips:[
      { icon:'📖', val:'8',    lbl:'Modules',         style:{ top:'-14px',  left:'20px'   }, bg:'var(--blue-l)',   delay:'0s'   },
      { icon:'⏱',  val:'10wk', lbl:'Course length',   style:{ bottom:'10px',right:'-18px' }, bg:'var(--grey-bg)', delay:'1.4s' },
      { icon:'✅',  val:'52%',  lbl:'Your progress',   style:{ top:'30%',   left:'-28px'  }, bg:'var(--blue-l)',   delay:'0.7s' },
    ],
  },
  {
    frameBg:'#F4F1E8', accentColor:'#8A7040',
    chips:[
      { icon:'🎓', val:'12',   lbl:'Modules',         style:{ top:'-14px',  right:'30px'  }, bg:'#F4F1E8',         delay:'0s'   },
      { icon:'📆', val:'Fall', lbl:'2026 cohort',     style:{ bottom:'24px',left:'-22px'  }, bg:'var(--orange-l)', delay:'1.8s' },
      { icon:'🏛️', val:'TBI',  lbl:'Institute',       style:{ top:'45%',   right:'-20px' }, bg:'#F4F1E8',         delay:'1.1s' },
    ],
  },
  {
    frameBg:'var(--orange-l)', accentColor:'var(--orange)',
    chips:[
      { icon:'⭐', val:'∞',    lbl:'Always learning', style:{ top:'-10px',  left:'14px'   }, bg:'var(--orange-l)', delay:'0s'   },
      { icon:'🎯', val:'Lead', lbl:'Track',           style:{ bottom:'16px',right:'-20px' }, bg:'var(--grey-bg)', delay:'2s'   },
      { icon:'🔑', val:'Inv.', lbl:'By invitation',   style:{ top:'50%',   left:'-26px'  }, bg:'var(--blue-l)',   delay:'0.6s' },
    ],
  },
]

const CHEVRON_SHAPES = ['chevronClassic','chevronWide','chevronSharp','chevronNotched']

// Carousel slides
// ─────────────────────────────────────────────────────
// CAROUSEL SLIDES — edit content here directly
// Fields per slide:
//   id        — unique key (don't change)
//   tag       — small label above title (e.g. "Welcome")
//   title     — bold heading
//   desc      — paragraph text
//   cta       — button label
//   ctaIcon   — emoji before button label
//   bg        — background color (hex or CSS var)
//   type      — 'video' | 'guide' | 'articles' (controls icon shown)
//   link      — where CTA navigates ('/explore', '/login', null)
// ─────────────────────────────────────────────────────
const CAROUSEL_SLIDES = [
  {
    id: 'welcome',
    tag: 'Welcome',
    title: 'Welcome to Verity Learning Center',
    desc: 'A brief introduction to who we are, what we believe, and how this platform supports your formation journey at VOW Center.',
    cta: 'Watch intro',
    ctaIcon: '▶',
    bg: '#DEDEDE',   /* ← edit this hex to change the slide background */
    light: false,
    type: 'video',
    link: null,
  },
  {
    id: 'signup',
    tag: 'Get Started',
    title: 'How to sign up and get access',
    desc: 'Access to Verity is invitation-only. Learn how to request access, what to expect after your first login, and how to navigate your dashboard.',
    cta: 'Explore →',
    ctaIcon: '📋',
    bg: 'var(--blue-l)',
    light: false,
    type: 'guide',
    link: '/explore',
  },
  {
    id: 'articles',
    tag: 'Read',
    title: 'From the Director of Education',
    desc: 'Articles, reflections, and theological resources published on Medium — formation content available to the wider VOW Center community.',
    cta: 'Browse articles',
    ctaIcon: '✦',
    bg: '#F4F1E8',
    light: false,
    type: 'articles',
    link: '/explore',
  },
]

export default function HomePage() {
  const navigate = useNavigate()
  const [settings,   setSettings]  = useState(DEFAULT_SETTINGS)
  const [pathway,    setPathway]   = useState(DEFAULT_PATHWAY)
  const [articles,   setArticles]  = useState(DEFAULT_ARTICLES)
  const [courses,    setCourses]   = useState([])
  const [resources,  setResources] = useState([])
  const [marquee,    setMarquee]   = useState(DEFAULT_MARQUEE)
  const [events,     setEvents]    = useState([])
  const [activeStep, setActiveStep] = useState(0)
  const [hovered,    setHovered]   = useState(null)
  const [carouselIdx, setCarouselIdx] = useState(0)
  const marqueeTrackRef = useRef(null)

  // hover preview overrides active step for frame/chips, click locks it
  const displayStep = hovered !== null ? hovered : activeStep
  const step     = pathway[displayStep]     ?? DEFAULT_PATHWAY[0]
  const stepMeta = STEP_META[displayStep % 4]

  useEffect(() => {
    async function load() {
      const [{ data: s }, { data: p }, { data: a }, { data: c }, { data: r }, { data: m }, { data: ev }] = await Promise.all([
        supabase.from('home_settings').select('*').single(),
        supabase.from('home_pathway').select('*').order('step_number'),
        supabase.from('home_publications').select('tag,title,url').eq('active', true).order('sort_order'),
        supabase.from('courses').select('*').eq('active', true).order('sort_order'),
        supabase.from('home_resources').select('*').eq('active', true).order('sort_order'),
        supabase.from('home_marquee').select('*').eq('active', true).order('sort_order').limit(1).single(),
        supabase.from('home_events').select('*').eq('active', true).order('sort_order'),
      ])
      if (s) setSettings(s)
      if (p?.length) setPathway(p)
      if (a?.length) setArticles(a)
      if (c?.length) setCourses(c)
      if (r?.length) setResources(r)
      if (m) setMarquee(m)
      if (ev?.length) setEvents(ev)
    }
    load()
  }, [])

  // Auto-advance carousel
  useEffect(() => {
    const t = setInterval(() => setCarouselIdx(i => (i + 1) % CAROUSEL_SLIDES.length), 6000)
    return () => clearInterval(t)
  }, [])

  const marqueeItems = [...articles, ...articles]
  const slide = CAROUSEL_SLIDES[carouselIdx]

  return (
    <div className={styles.page}>
      <Nav />

      {/* ── ANNOUNCEMENT BANNER — This Month's Discipleship Module ── */}
      <div className={styles.announceBanner}>
        <div className={styles.announceInner}>
          <div className={styles.announcePill}>
            <span className={styles.announceDot} />
            {marquee.label}
          </div>
          <div className={styles.announceContent}>
            <span className={styles.announceTitle}>{marquee.title}</span>
            {marquee.subtitle && (
              <span className={styles.announceSub}> — {marquee.subtitle}</span>
            )}
          </div>
          <button className={styles.announceBtn} onClick={() => navigate('/login')}>
            View module →
          </button>
        </div>
      </div>

      {/* ════════════════════════════
          HERO
      ════════════════════════════ */}
      <section className={styles.hero}>
        <div className={styles.heroDots} />

        {/* City sketch — anchored to hero bottom, offset left of center */}
        <img
          src="/assets/city-sketch.png"
          alt=""
          className={styles.citySketch}
          draggable="false"
          onError={e => { e.currentTarget.src = '/assets/city-sketch.svg' }}
        />

        <div className={styles.heroInner}>

          {/* LEFT */}
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
              <Button variant="ink" size="lg" onClick={() => navigate('/login')}>Start learning →</Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/explore')}>Explore</Button>
            </div>
            <p className={styles.heroNote}>Access is granted by VOW Center leadership.</p>

            {/* ── STAY LOCKED IN — inside heroLeft, overlaps city sketch ── */}
            <div className={styles.staySection}>
              <div className={styles.stayLabel}>Stay Locked In!</div>
              <div className={styles.eventBubbles}>
                {(events.length > 0
                  ? events
                  : [
                      { id:1, title:'Bible Study',      day_time:'TUESDAY AT 7PM',   link_url:null },
                      { id:2, title:'Bible Foundation',  day_time:'SUNDAY AT 10AM',   link_url:null },
                      { id:3, title:'Youth Foundation',  day_time:'FRIDAY AT 6:30PM', link_url:null },
                    ]
                ).map(ev => {
                  const hasLink = ev.link_url && ev.link_url.trim().length > 0
                  const Tag = hasLink ? 'a' : 'span'
                  const linkProps = hasLink
                    ? { href: ev.link_url.trim(), target:'_blank', rel:'noreferrer' }
                    : {}
                  return (
                    <Tag key={ev.id} className={styles.eventBubble} {...linkProps}>
                      <div className={styles.eventTop}>
                        <span className={styles.eventTitle}>{ev.title}</span>
                        <span className={styles.eventDot} />
                        <span className={styles.eventTime}>{ev.day_time}</span>
                      </div>
                    </Tag>
                  )
                })}
              </div>
            </div>
          </div>

          {/* RIGHT — chevrons + graphic */}
          <div className={styles.heroRight}>

            {/* Chevron nav */}
            <div className={styles.chevronNav}>
              {pathway.map((s, i) => (
                <button
                  key={s.step_number}
                  className={[styles.chevronItem, styles[CHEVRON_SHAPES[i%4]], i===displayStep ? styles.chevronActive : ''].join(' ')}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => setActiveStep(i)}
                  style={{ '--step-accent': STEP_META[i%4].accentColor }}
                >
                  <span className={styles.chevronNum}>{String(s.step_number).padStart(2,'0')}</span>
                  <span className={styles.chevronName}>{s.name}</span>
                  <span className={styles.chevronSub}>{s.sub_label}</span>
                </button>
              ))}
            </div>

            {/* Graphic — no border, chips fully dynamic */}
            <div className={styles.graphicWrap}>
              {pathway.map((s, i) => (
                <div
                  key={s.step_number}
                  className={[styles.frame, i===displayStep ? styles.frameActive : ''].join(' ')}
                  style={{
                    background: s.image_url
                      ? `url(${s.image_url}) center/cover no-repeat`
                      : STEP_META[i%4].frameBg,
                    border: 'none',
                  }}
                >
                  {!s.image_url && (
                    <>
                      <span className={styles.frameEmoji}>{s.emoji}</span>
                      <span className={styles.frameLabel}>{s.name}</span>
                      <span className={styles.frameSub}>{s.description}</span>
                      <span className={`badge ${['badge-grey','badge-blue','badge-grey','badge-orange'][i%4]}`} style={{marginTop:4}}>
                        {s.module_label}
                      </span>
                    </>
                  )}
                  {settings.hero_fg_person_url && settings.hero_fg_person_url.trim() !== '' && i===displayStep && (
                    <img src={settings.hero_fg_person_url} alt="" className={styles.frameFg} />
                  )}
                </div>
              ))}

              {/* Dynamic chips — all position + content change per displayed step */}
              {stepMeta.chips.map((chip, ci) => (
                <div
                  key={`${displayStep}-${ci}`}
                  className={styles.chip}
                  style={{ ...chip.style, animationDelay: chip.delay, '--chip-bg': chip.bg }}
                >
                  <div className={styles.chipIcon}>{chip.icon}</div>
                  <div>
                    <div className={styles.chipVal}>{chip.val}</div>
                    <div className={styles.chipLbl}>{chip.lbl}</div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── MARQUEE BAR — dark grey, white text ── */}
      <div className={styles.marqueeBar}>
        <div className={styles.marqueeLbl}>
          <span className={styles.marqueeDot}>✦</span>
          {settings.marquee_label}
        </div>
        <div
          className={styles.marqueeViewport}
          onMouseEnter={() => marqueeTrackRef.current?.style.setProperty('animation-play-state','paused')}
          onMouseLeave={() => marqueeTrackRef.current?.style.setProperty('animation-play-state','running')}
        >
          <div className={styles.fadeLeft} />
          <div className={styles.fadeRight} />
          <div className={styles.marqueeTrack} ref={marqueeTrackRef}>
            {marqueeItems.map((a, i) => {
              const MTag = a.url ? 'a' : 'span'
              const mProps = a.url ? { href: a.url, target:'_blank', rel:'noreferrer' } : {}
              return (
                <MTag key={i} {...mProps} className={styles.marqueeItem}>
                  <span className={styles.mTag}>{a.tag}</span>
                  <span className={styles.mTitle}>{a.title}</span>
                  <span className={styles.mArrow}>→</span>
                </MTag>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── SCRIPTURE BAR ── */}
      <div className={styles.scriptureBar}>
        <div className={styles.scriptureInner}>
          <span className={styles.scriptureRule} />
          <blockquote className={styles.scriptureText}>
            "{marquee.scripture_text}"
          </blockquote>
          <span className={styles.scriptureRef}>— {marquee.scripture_ref}</span>
          <span className={styles.scriptureRule} />
        </div>
      </div>

      {/* ── SPLIT SECTION: Carousel left · Courses right ── */}
      <div className={styles.secWhite}>
        <div className={styles.secInner}>
          <div className={styles.splitGrid}>

            {/* LEFT 50%: Getting started carousel */}
            <div className={styles.splitLeft}>
              <div className={styles.secTag}>Getting started</div>
              <h2 className={styles.secH2}>New here?</h2>
              <div className={styles.carouselMini}>
                <div className={styles.carouselMiniTrack}>
                  {CAROUSEL_SLIDES.map((sl, i) => (
                    <div
                      key={sl.id}
                      className={[styles.carouselMiniSlide, i === carouselIdx ? styles.slideMiniActive : ''].join(' ')}
                      style={{ background: sl.bg }}
                    >
                      <div className={styles.slideMiniMedia}>
                        {sl.type === 'video' && <div className={styles.playBtnSm}>▶</div>}
                        {sl.type === 'guide' && <span className={styles.slideIconSm}>📋</span>}
                        {sl.type === 'articles' && <span className={styles.slideIconSm}>✦</span>}
                      </div>
                      <div className={styles.slideMiniBody}>
                        <div className={styles.slideTag}>{sl.tag}</div>
                        <div className={styles.slideMiniTitle}>{sl.title}</div>
                        <p className={styles.slideMiniDesc}>{sl.desc}</p>
                        <button className={styles.slideMiniCta}
                          onClick={() => navigate(sl.link ?? '/login')}>
                          {sl.ctaIcon} {sl.cta}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className={styles.carouselMiniControls}>
                  <button className={styles.carouselMiniArrow}
                    onClick={() => setCarouselIdx(i => (i - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length)}>←</button>
                  <div className={styles.carouselMiniDots}>
                    {CAROUSEL_SLIDES.map((_, i) => (
                      <button key={i}
                        className={[styles.dot, i === carouselIdx ? styles.dotActive : ''].join(' ')}
                        onClick={() => setCarouselIdx(i)} />
                    ))}
                  </div>
                  <button className={styles.carouselMiniArrow}
                    onClick={() => setCarouselIdx(i => (i + 1) % CAROUSEL_SLIDES.length)}>→</button>
                </div>
              </div>
            </div>

            {/* RIGHT 50%: Available learning tracks */}
            <div className={styles.splitRight}>
              <div className={styles.secTag}>Programs</div>
              <h2 className={styles.secH2}>Available tracks</h2>
              <div className={styles.courseStack}>
                {(courses.length
                  ? courses.slice(0, 2)
                  : DEFAULT_PATHWAY.slice(0, 2).map((s, i) => ({
                      id: i, title: s.name, badge_label: s.name,
                      thumb_color_start: '#1a1a1a', thumb_color_end: '#444',
                    }))
                ).map(c => (
                  <div key={c.id} className={styles.courseCardRow}>
                    <div
                      className={styles.courseRowThumb}
                      style={c.thumbnail_url
                        ? { backgroundImage: `url(${c.thumbnail_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                        : { background: `linear-gradient(135deg, ${c.thumb_color_start ?? '#1a1a1a'}, ${c.thumb_color_end ?? '#444'})` }
                      }
                    />
                    <div className={styles.courseRowBody}>
                      <div className={styles.courseTitle}>{c.title}</div>
                      <div className={styles.courseInst}>{c.description ?? 'VOW Center'}</div>
                      {(c.module_count > 0 || c.duration_weeks) && (
                        <div className={styles.courseMeta}>
                          {c.module_count > 0 && <span>{c.module_count} modules</span>}
                          {c.duration_weeks && <span>{c.duration_weeks} weeks</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {settings.show_view_all && <Button variant="outline" size="sm">View all tracks →</Button>}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── FIELD NOTES ── */}
      {resources.length > 0 && (
        <div className={styles.secGrey}>
          <div className={styles.secInner}>
            <div className={styles.secRow}>
              <div>
                <div className={styles.secTag}>Field Notes</div>
                <h2 className={styles.secH2}>Resources & teachings</h2>
                <p className={styles.secSub}>One-off programs, tools, and drops from VOW Center.</p>
              </div>
              {settings.show_view_all && <Link to="/explore"><Button variant="outline" size="sm">See all →</Button></Link>}
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
                        : <span style={{ color:'var(--grey-mid)', fontSize:13 }}>Coming soon</span>
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
              { icon:'📋', bg:'var(--grey-bg)',  title:'Bible Study Guide',      desc:'Structured templates for weekly Bible study facilitation.' },
              { icon:'🏛️', bg:'var(--blue-l)',   title:'Foundation Class Guide', desc:'Curriculum support for new members class instructors.' },
              { icon:'🎯', bg:'var(--grey-bg)',  title:'Teaching Mechanism',     desc:'AI slide builder that walks you through a structured presentation.' },
              { icon:'📤', bg:'var(--orange-l)', title:'Share Content',           desc:'Send a resource or announcement to your managed email list.', orange:true },
            ].map((t, i) => (
              <div key={i} className={styles.toolCard}>
                <div className={styles.toolIcon} style={{ background:t.bg }}>{t.icon}</div>
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
        <div className={styles.footerText}>
          <span>Verity Learning Center · <a href="https://vowcenter.com" target="_blank" rel="noreferrer" style={{color:'inherit',textDecoration:'underline',textUnderlineOffset:'3px'}}>VOW Center</a></span>
          <span className={styles.footerCopy}>© 2026 Verity Outreach Worship Center</span>
        </div>
      </footer>
    </div>
  )
}
