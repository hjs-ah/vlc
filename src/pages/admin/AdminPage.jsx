import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import Button from '@/components/ui/Button'
import styles from './AdminPage.module.css'

export default function AdminPage() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('hero')

  // Hero settings
  const [settings, setSettings] = useState(null)
  const [saving, setSaving] = useState(false)

  // Users
  const [users, setUsers] = useState([])

  // Email list
  const [emailList, setEmailList] = useState([])
  const [newEmail, setNewEmail] = useState({ email: '', display_name: '', list_group: 'members' })

  // Pathway
  const [pathway, setPathway] = useState([])

  // Publications
  const [pubs, setPubs] = useState([])

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    const [{ data: s }, { data: u }, { data: el }, { data: pc }, { data: pb }] = await Promise.all([
      supabase.from('site_settings').select('*').single(),
      supabase.from('profiles').select('*').order('created_at'),
      supabase.from('email_list').select('*').eq('active', true).order('added_at'),
      supabase.from('pathway_config').select('*').order('step_number'),
      supabase.from('publications').select('*').order('sort_order'),
    ])
    if (s)  setSettings(s)
    if (u)  setUsers(u)
    if (el) setEmailList(el)
    if (pc) setPathway(pc)
    if (pb) setPubs(pb)
  }

  async function saveSettings() {
    if (!settings) return
    setSaving(true)
    await supabase.from('site_settings').update(settings).eq('id', 1)
    setSaving(false)
    alert('Saved ✓')
  }

  async function uploadHeroImage(e, field) {
    const file = e.target.files[0]
    if (!file) return
    const ext = file.name.split('.').pop()
    const path = `${field}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('hero-assets').upload(path, file, { upsert: true })
    if (error) { alert('Upload failed: ' + error.message); return }
    const { data: { publicUrl } } = supabase.storage.from('hero-assets').getPublicUrl(path)
    setSettings(s => ({ ...s, [field]: publicUrl }))
  }

  async function revokeUser(userId) {
    if (!confirm('Revoke access for this user?')) return
    await supabase.from('profiles').update({ active: false }).eq('id', userId)
    setUsers(u => u.filter(p => p.id !== userId))
  }

  async function addEmail() {
    if (!newEmail.email) return
    const { data, error } = await supabase.from('email_list').insert(newEmail).select().single()
    if (!error && data) { setEmailList(e => [...e, data]); setNewEmail({ email: '', display_name: '', list_group: 'members' }) }
  }

  async function removeEmail(id) {
    await supabase.from('email_list').update({ active: false }).eq('id', id)
    setEmailList(e => e.filter(em => em.id !== id))
  }

  async function savePathway() {
    for (const step of pathway) {
      await supabase.from('pathway_config').update({ name: step.name, sub_label: step.sub_label, description: step.description }).eq('step_number', step.step_number)
    }
    alert('Pathway saved ✓')
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Verity Admin Panel</h1>
          <p>Manage users, content, and platform settings</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="ghost" size="sm" style={{ color: 'rgba(255,255,255,0.5)' }} onClick={() => navigate('/dashboard')}>← Dashboard</Button>
          <Button variant="ghost" size="sm" style={{ color: 'rgba(255,255,255,0.5)' }} onClick={async () => { await signOut(); navigate('/') }}>Log out</Button>
        </div>
      </div>

      <div className={styles.body}>
        {/* TABS */}
        <div className={styles.tabs}>
          {['hero','users','email','pathway','publications'].map(t => (
            <button key={t} className={[styles.tab, tab === t ? styles.tabActive : ''].join(' ')} onClick={() => setTab(t)}>
              {{ hero: 'Hero & Branding', users: 'Users & Access', email: 'Email List', pathway: 'Pathway', publications: 'Publications' }[t]}
            </button>
          ))}
        </div>

        {/* HERO */}
        {tab === 'hero' && settings && (
          <div className={`${styles.panel} fade-up`}>
            <div className={styles.secTitle}>Hero section</div>
            <div className={styles.heroGrid}>
              <div>
                <Field label="Headline" value={settings.hero_headline} onChange={v => setSettings(s => ({ ...s, hero_headline: v }))} />
                <Field label="Subtext" value={settings.hero_subtext} onChange={v => setSettings(s => ({ ...s, hero_subtext: v }))} textarea />
                <Field label="Marquee label" value={settings.marquee_label} onChange={v => setSettings(s => ({ ...s, marquee_label: v }))} />
                <div className={styles.chipRow}>
                  <Field label="Chip 1 — value" value={settings.chip_1_value} onChange={v => setSettings(s => ({ ...s, chip_1_value: v }))} />
                  <Field label="Chip 1 — label" value={settings.chip_1_label} onChange={v => setSettings(s => ({ ...s, chip_1_label: v }))} />
                </div>
              </div>
              <div>
                <div className={styles.uploadGroup}>
                  <label className={styles.fieldLabel}>Background circular photo</label>
                  <label className={styles.uploadZone}>
                    <div className={styles.uploadIcon}>🖼</div>
                    <p><strong>Click to upload</strong><br />JPG / PNG / WebP · max 5MB</p>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => uploadHeroImage(e, 'hero_bg_photo_url')} />
                  </label>
                  {settings.hero_bg_photo_url && <img src={settings.hero_bg_photo_url} alt="" className={styles.imgThumb} />}
                </div>
                <div className={styles.uploadGroup}>
                  <label className={styles.fieldLabel}>Foreground PNG (transparent bg)</label>
                  <label className={styles.uploadZone}>
                    <div className={styles.uploadIcon}>🧍</div>
                    <p><strong>Click to upload</strong><br />PNG only · transparent background</p>
                    <input type="file" accept="image/png" style={{ display: 'none' }} onChange={e => uploadHeroImage(e, 'hero_fg_person_url')} />
                  </label>
                  {settings.hero_fg_person_url && <img src={settings.hero_fg_person_url} alt="" className={styles.imgThumb} />}
                </div>
              </div>
            </div>
            <div className={styles.saveRow}>
              <Button variant="ghost" onClick={() => loadAll()}>Discard</Button>
              <Button variant="blue" onClick={saveSettings} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
            </div>
          </div>
        )}

        {/* USERS */}
        {tab === 'users' && (
          <div className={`${styles.panel} fade-up`}>
            <div className={styles.secTitle}>User management</div>
            <div className={styles.tableWrap}>
              <table>
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td className={styles.nc}>{u.full_name}</td>
                      <td>{u.email}</td>
                      <td><span className={`badge ${u.role === 'admin' ? 'badge-orange' : u.role === 'instructor' ? 'badge-blue' : 'badge-grey'}`}>{u.role}</span></td>
                      <td><span className={`badge ${u.active ? 'badge-green' : 'badge-red'}`}>{u.active ? 'Active' : 'Inactive'}</span></td>
                      <td>
                        {u.id !== profile?.id && (
                          <Button variant="danger" size="sm" onClick={() => revokeUser(u.id)}>Revoke</Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={styles.note}>To invite users, use the Supabase dashboard → Authentication → Users → Invite user. Role assignment happens in the profiles table.</p>
          </div>
        )}

        {/* EMAIL LIST */}
        {tab === 'email' && (
          <div className={`${styles.panel} fade-up`}>
            <div className={styles.secTitle}>Share Content — email list</div>
            <div className={styles.addRow}>
              <input className={styles.input} placeholder="Email address" value={newEmail.email} onChange={e => setNewEmail(n => ({ ...n, email: e.target.value }))} />
              <input className={styles.input} placeholder="Display name" value={newEmail.display_name} onChange={e => setNewEmail(n => ({ ...n, display_name: e.target.value }))} />
              <select className={styles.input} value={newEmail.list_group} onChange={e => setNewEmail(n => ({ ...n, list_group: e.target.value }))}>
                <option value="all">All</option>
                <option value="members">Members</option>
                <option value="leaders">Leaders</option>
              </select>
              <Button variant="blue" size="sm" onClick={addEmail}>+ Add</Button>
            </div>
            <div className={styles.tableWrap}>
              <table>
                <thead><tr><th>Email</th><th>Name</th><th>Group</th><th></th></tr></thead>
                <tbody>
                  {emailList.map(e => (
                    <tr key={e.id}>
                      <td className={styles.nc}>{e.email}</td>
                      <td>{e.display_name}</td>
                      <td><span className={`badge ${e.list_group === 'all' ? 'badge-orange' : 'badge-blue'}`}>{e.list_group}</span></td>
                      <td><Button variant="ghost" size="sm" onClick={() => removeEmail(e.id)}>Remove</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PATHWAY */}
        {tab === 'pathway' && (
          <div className={`${styles.panel} fade-up`}>
            <div className={styles.secTitle}>Pathway step content</div>
            <div className={styles.pathwayList}>
              {pathway.map((s, i) => (
                <div key={s.step_number} className={styles.pathwayCard}>
                  <div className={styles.pathwayEmoji}>{s.emoji}</div>
                  <div className={styles.pathwayFields}>
                    <Field label={`Step ${s.step_number} name`} value={s.name} onChange={v => setPathway(p => p.map((x,j) => j===i ? {...x, name: v} : x))} />
                    <Field label="Sub-label" value={s.sub_label} onChange={v => setPathway(p => p.map((x,j) => j===i ? {...x, sub_label: v} : x))} />
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.saveRow}>
              <Button variant="blue" onClick={savePathway}>Save all steps</Button>
            </div>
          </div>
        )}

        {/* PUBLICATIONS */}
        {tab === 'publications' && (
          <div className={`${styles.panel} fade-up`}>
            <div className={styles.secTitle}>Marquee articles</div>
            <div className={styles.tableWrap}>
              <table>
                <thead><tr><th>Tag</th><th>Title</th><th>URL</th><th>Active</th></tr></thead>
                <tbody>
                  {pubs.map(p => (
                    <tr key={p.id}>
                      <td><span className="badge badge-orange">{p.tag}</span></td>
                      <td className={styles.nc}>{p.title}</td>
                      <td style={{ color: 'var(--grey-text)', fontSize: 12 }}>{p.url ?? '—'}</td>
                      <td>
                        <button
                          className={`badge ${p.active ? 'badge-green' : 'badge-grey'}`}
                          onClick={async () => {
                            await supabase.from('publications').update({ active: !p.active }).eq('id', p.id)
                            setPubs(prev => prev.map(x => x.id === p.id ? { ...x, active: !x.active } : x))
                          }}
                        >
                          {p.active ? 'Active' : 'Hidden'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, value, onChange, textarea }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--grey-dark)', marginBottom: 5 }}>{label}</label>
      {textarea ? (
        <textarea style={{ width: '100%', background: 'var(--grey-bg)', border: '1px solid var(--grey-rule)', borderRadius: 'var(--rs)', padding: '9px 12px', fontSize: 13, color: 'var(--ink)', outline: 'none', resize: 'vertical', minHeight: 72, fontFamily: 'inherit' }}
          value={value} onChange={e => onChange(e.target.value)} />
      ) : (
        <input style={{ width: '100%', background: 'var(--grey-bg)', border: '1px solid var(--grey-rule)', borderRadius: 'var(--rs)', padding: '9px 12px', fontSize: 13, color: 'var(--ink)', outline: 'none', fontFamily: 'inherit' }}
          value={value} onChange={e => onChange(e.target.value)} />
      )}
    </div>
  )
}
