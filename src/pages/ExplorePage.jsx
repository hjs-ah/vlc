import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import Nav from '@/components/layout/Nav'
import Button from '@/components/ui/Button'
import styles from './ExplorePage.module.css'

const CATEGORIES = ['All', 'Teaching', 'Mentorship', 'Formation', 'Tools', 'Archive']

export default function ExplorePage() {
  const navigate = useNavigate()
  const [resources, setResources] = useState([])
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('resources')
        .select('*')
        .eq('active', true)
        .order('featured', { ascending: false })
        .order('sort_order')
      if (data) setResources(data)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = filter === 'All'
    ? resources
    : resources.filter(r => r.category === filter)

  const featured = filtered.filter(r => r.featured)
  const rest     = filtered.filter(r => !r.featured)

  return (
    <div className={styles.page}>
      <Nav />

      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.tag}>Field Notes</div>
          <h1 className={styles.h1}>Explore</h1>
          <p className={styles.sub}>
            One-off teachings, tools, mentorship programs, and resources from VOW Center —
            available to the community outside the formal learning pathway.
          </p>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.bodyInner}>

          {/* Filter tabs */}
          <div className={styles.filters}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={[styles.filterBtn, filter === cat ? styles.filterActive : ''].join(' ')}
                onClick={() => setFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className={styles.empty}>Loading resources…</div>
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>No resources in this category yet.</div>
          ) : (
            <>
              {/* Featured cards — larger */}
              {featured.length > 0 && (
                <div className={styles.featuredGrid}>
                  {featured.map(r => (
                    <ResourceCard key={r.id} r={r} featured />
                  ))}
                </div>
              )}

              {/* Rest — standard grid */}
              {rest.length > 0 && (
                <div className={styles.grid}>
                  {rest.map(r => (
                    <ResourceCard key={r.id} r={r} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* CTA to request access */}
          <div className={styles.cta}>
            <div className={styles.ctaInner}>
              <div className={styles.ctaTitle}>Have something to contribute?</div>
              <p className={styles.ctaText}>
                VOW Center instructors and leaders can submit resources for the community.
                Reach out to request access or submit content.
              </p>
              <Button variant="ink" size="md" onClick={() => navigate('/login')}>
                Access instructor tools →
              </Button>
            </div>
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

function ResourceCard({ r, featured }) {
  return (
    <div className={[styles.card, featured ? styles.cardFeatured : ''].join(' ')}>
      {r.thumbnail_url ? (
        <img src={r.thumbnail_url} alt={r.title} className={styles.cardThumb} />
      ) : (
        <div className={styles.cardThumbPlaceholder}>
          <span className={styles.cardEmoji}>
            {{ Teaching: '🎓', Mentorship: '♟', Formation: '📖', Tools: '🛠', Archive: '📦' }[r.category] ?? '📦'}
          </span>
        </div>
      )}
      <div className={styles.cardBody}>
        <div className={styles.cardCat}>{r.category}</div>
        <div className={styles.cardTitle}>{r.title}</div>
        {r.subtitle && <div className={styles.cardSub}>{r.subtitle}</div>}
        {r.description && featured && <p className={styles.cardDesc}>{r.description}</p>}
        {r.tags?.length > 0 && (
          <div className={styles.cardTags}>
            {r.tags.map(t => <span key={t} className="badge badge-grey">{t}</span>)}
          </div>
        )}
        <div className={styles.cardFoot}>
          {r.resource_url ? (
            <a href={r.resource_url} target="_blank" rel="noreferrer" className={styles.cardLink}>
              Access resource →
            </a>
          ) : (
            <span className={styles.cardSoon}>Coming soon</span>
          )}
        </div>
      </div>
    </div>
  )
}
