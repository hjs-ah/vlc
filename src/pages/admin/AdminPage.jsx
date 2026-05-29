import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import Button from '@/components/ui/Button'
import styles from './AdminPage.module.css'

const TABS = {
  hero:         'Hero & Branding',
  users:        'Users & Access',
  facilitators: 'Facilitators',
  email:        'Email List',
  pathway:      'Pathway',
  publications: 'Publications',
}

export default function AdminPage() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('hero')

  const [settings,     setSettings]     = useState(null)
  const [saving,       setSaving]        = useState(false)
  const [users,        setUsers]         = useState([])
  const [emailList,    setEmailList]     = useState([])
  const [newEmail,     setNewEmail]      = useState({ email:'', display_name:'', list_group:'members' })
  const [pathway,      setPathway]       = useState([])
  const [pubs,         setPubs]          = useState([])
  const [facView,      setFacView]       = useState([])  // course_facilitators_view rows
  const [courses,      setCourses]       = useState([])  // all active courses
  const [assignUser,   setAssignUser]    = useState('')  // user id being assigned
  const [assignCourse, setAssignCourse] = useState('')  // course id being assigned
  const [assignRole,   setAssignRole]   = useState('instructor')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [
      { data: s }, { data: u }, { data: el },
      { data: pc }, { data: pb }, { data: fv }, { data: crs }
    ] = await Promise.all([
      supabase.from('home_settings').select('*').single(),
      supabase.from('profiles').select('*').order('full_name'),
      supabase.from('admin_email_list').select('*').eq('active', true).order('added_at'),
      supabase.from('home_pathway').select('*').order('step_number'),
      supabase.from('home_publications').select('*').order('sort_order'),
      supabase.from('course_facilitators_view').select('*').order('facilitator_name'),
      supabase.from('courses').select('id,title,badge_label').eq('active', true).order('sort_order'),
    ])
    if (s)   setSettings(s)
    if (u)   setUsers(u)
    if (el)  setEmailList(el)
    if (pc)  setPathway(pc)
    if (pb)  setPubs(pb)
    if (fv)  setFacView(fv)
    if (crs) setCourses(crs)
  }

  async function saveSettings() {
    if (!settings) return
    setSaving(true)
    await supabase.from('home_settings').update(settings).eq('id', 1)
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
    const { data, error } = await supabase.from('admin_email_list').insert(newEmail).select().single()
    if (!error && data) { setEmailList(e => [...e, data]); setNewEmail({ email:'', display_name:'', list_group:'members' }) }
  }

  async function removeEmail(id) {
    await supabase.from('admin_email_list').update({ active: false }).eq('id', id)
    setEmailList(e => e.filter(em => em.id !== id))
  }

  async function savePathway() {
    for (const step of pathway) {
      await supabase.from('home_pathway')
        .update({ name: step.name, sub_label: step.sub_label, description: step.description })
        .eq('step_number', step.step_number)
    }
    alert('Pathway saved ✓')
  }

  // ── FACILITATOR MANAGEMENT ──
  async function assignFacilitator() {
    if (!assignUser || !assignCourse) { alert('Select both a person and a course.'); return }
    const { error } = await supabase.from('course_facilitators').insert({
      facilitator_id: assignUser,
      course_id:      assignCourse,
      role:           assignRole,
    })
    if (error) {
      if (error.code === '23505') alert('This person is already assigned to that course.')
      else alert('Error: ' + error.message)
      return
    }
    // Refresh view
    const { data } = await supabase.from('course_facilitators_view').select('*').order('facilitator_name')
    if (data) setFacView(data)
    setAssignUser(''); setAssignCourse('')
    alert('Assigned ✓')
  }

  async function removeFacilitator(facId, courseId) {
    if (!confirm('Remove this facilitator from this course?')) return
    await supabase.from('course_facilitators')
      .delete()
      .eq('facilitator_id', facId)
      .eq('course_id', courseId)
    setFacView(f => f.filter(r => !(r.facilitator_id === facId && r.course_id === courseId)))
  }

  // Group facView by facilitator for display
  const byFacilitator = facView.reduce((acc, row) => {
    const key = row.facilitator_id
    if (!acc[key]) acc[key] = { name: row.facilitator_name, email: row.facilitator_email, courses: [] }
    acc[key].courses.push(row)
    return acc
  }, {})

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Verity Admin Panel</h1>
          <p>Manage users, content, and platform settings</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <Button variant="ghost" size="sm" style={{ color:'rgba(255,255,255,0.5)' }} onClick={() => navigate('/dashboard')}>← Dashboard</Button>
          <Button variant="ghost" size="sm" style={{ color:'rgba(255,255,255,0.5)' }} onClick={async () => { await signOut(); navigate('/') }}>Log out</Button>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.tabs}>
          {Object.entries(TABS).map(([key, label]) => (
            <button key={key} className={[styles.tab, tab===key ? styles.tabActive : ''].join(' ')} onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </div>

        {/* ── HERO ── */}
        {tab === 'hero' && settings && (
          <div className={`${styles.panel} fade-up`}>
            <div className={styles.secTitle}>Hero section</div>
            <div className={styles.heroGrid}>
              <div>
                <Field label="Headline"      value={settings.hero_headline}  onChange={v => setSettings(s => ({...s, hero_headline:v}))} />
                <Field label="Subtext"       value={settings.hero_subtext}   onChange={v => setSettings(s => ({...s, hero_subtext:v}))}  textarea />
                <Field label="Marquee label" value={settings.marquee_label}  onChange={v => setSettings(s => ({...s, marquee_label:v}))} />
                <div className={styles.chipRow}>
                  <Field label="Chip 1 — value" value={settings.chip_1_value} onChange={v => setSettings(s => ({...s, chip_1_value:v}))} />
                  <Field label="Chip 1 — label" value={settings.chip_1_label} onChange={v => setSettings(s => ({...s, chip_1_label:v}))} />
                </div>
              </div>
              <div>
                <div className={styles.uploadGroup}>
                  <label className={styles.fieldLabel}>Background circular photo</label>
                  <label className={styles.uploadZone}>
                    <div className={styles.uploadIcon}>🖼</div>
                    <p><strong>Click to upload</strong><br/>JPG / PNG / WebP · max 5MB</p>
                    <input type="file" accept="image/*" style={{display:'none'}} onChange={e => uploadHeroImage(e,'hero_bg_photo_url')} />
                  </label>
                  {settings.hero_bg_photo_url && <img src={settings.hero_bg_photo_url} alt="" className={styles.imgThumb} />}
                </div>
                <div className={styles.uploadGroup}>
                  <label className={styles.fieldLabel}>Foreground PNG (transparent bg)</label>
                  <label className={styles.uploadZone}>
                    <div className={styles.uploadIcon}>🧍</div>
                    <p><strong>Click to upload</strong><br/>PNG only · transparent background</p>
                    <input type="file" accept="image/png" style={{display:'none'}} onChange={e => uploadHeroImage(e,'hero_fg_person_url')} />
                  </label>
                  {settings.hero_fg_person_url && <img src={settings.hero_fg_person_url} alt="" className={styles.imgThumb} />}
                </div>
              </div>
            </div>
            <div className={styles.saveRow}>
              <Button variant="ghost" onClick={loadAll}>Discard</Button>
              <Button variant="blue" onClick={saveSettings} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
            </div>
          </div>
        )}

        {/* ── USERS ── */}
        {tab === 'users' && (
          <div className={`${styles.panel} fade-up`}>
            <div className={styles.secTitle}>User management</div>
            <div className={styles.tableWrap}>
              <table>
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last active</th><th>Actions</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td className={styles.nc}>{u.full_name}</td>
                      <td>{u.email}</td>
                      <td><span className={`badge ${u.role==='admin'?'badge-orange':u.role==='instructor'?'badge-blue':'badge-grey'}`}>{u.role}</span></td>
                      <td><span className={`badge ${u.active?'badge-green':'badge-red'}`}>{u.active?'Active':'Inactive'}</span></td>
                      <td style={{color:'var(--grey-text)',fontSize:12}}>{u.updated_at ? new Date(u.updated_at).toLocaleDateString() : '—'}</td>
                      <td>{u.id !== profile?.id && <Button variant="danger" size="sm" onClick={() => revokeUser(u.id)}>Revoke</Button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={styles.note}>To invite users: Supabase → Authentication → Users → Invite user. Set their role in the profiles table after they accept.</p>
          </div>
        )}

        {/* ── FACILITATORS ── */}
        {tab === 'facilitators' && (
          <div className={`${styles.panel} fade-up`}>
            <div className={styles.secTitle}>Course facilitator assignments</div>

            {/* Assign form */}
            <div className={styles.facAssignCard}>
              <div className={styles.facAssignTitle}>Assign a facilitator to a course</div>
              <div className={styles.facAssignRow}>
                <div className={styles.fg} style={{flex:2}}>
                  <label className={styles.fl}>Person</label>
                  <select className={styles.fi} value={assignUser} onChange={e => setAssignUser(e.target.value)}>
                    <option value="">— Select person —</option>
                    {users.filter(u => u.role !== 'student' && u.active).map(u => (
                      <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
                    ))}
                  </select>
                </div>
                <div className={styles.fg} style={{flex:2}}>
                  <label className={styles.fl}>Course</label>
                  <select className={styles.fi} value={assignCourse} onChange={e => setAssignCourse(e.target.value)}>
                    <option value="">— Select course —</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.fg} style={{flex:1}}>
                  <label className={styles.fl}>Role</label>
                  <select className={styles.fi} value={assignRole} onChange={e => setAssignRole(e.target.value)}>
                    <option value="instructor">Instructor</option>
                    <option value="assistant">Assistant</option>
                    <option value="guest">Guest</option>
                  </select>
                </div>
                <div style={{paddingTop:20}}>
                  <Button variant="blue" size="sm" onClick={assignFacilitator}>Assign →</Button>
                </div>
              </div>
            </div>

            {/* Current assignments — grouped by person */}
            <div className={styles.facList}>
              {Object.values(byFacilitator).length === 0
                ? <div className={styles.note}>No facilitators assigned yet.</div>
                : Object.values(byFacilitator).map(fac => (
                  <div key={fac.email} className={styles.facPersonCard}>
                    <div className={styles.facPersonHead}>
                      <div className={styles.facAvatar}>
                        {fac.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div className={styles.facName}>{fac.name}</div>
                        <div className={styles.facEmail}>{fac.email}</div>
                      </div>
                    </div>
                    <div className={styles.facCourseList}>
                      {fac.courses.map(row => (
                        <div key={row.course_id} className={styles.facCourseRow}>
                          <div className={styles.facCourseInfo}>
                            <span className={styles.facCourseName}>{row.course_name}</span>
                            <span className={`badge ${row.facilitator_role==='instructor'?'badge-blue':'badge-grey'}`} style={{fontSize:10}}>
                              {row.facilitator_role}
                            </span>
                          </div>
                          <button
                            className={styles.facRemoveBtn}
                            onClick={() => removeFacilitator(row.facilitator_id, row.course_id)}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* ── EMAIL LIST ── */}
        {tab === 'email' && (
          <div className={`${styles.panel} fade-up`}>
            <div className={styles.secTitle}>Share Content — email list</div>
            <p style={{fontSize:13,color:'var(--grey-dark)',marginBottom:18}}>Controls who receives content via the Share Content button. No self-signup — manually managed.</p>
            <div className={styles.addRow}>
              <input className={styles.input} placeholder="Email address" value={newEmail.email} onChange={e => setNewEmail(n=>({...n,email:e.target.value}))} />
              <input className={styles.input} placeholder="Display name"  value={newEmail.display_name} onChange={e => setNewEmail(n=>({...n,display_name:e.target.value}))} />
              <select className={styles.input} value={newEmail.list_group} onChange={e => setNewEmail(n=>({...n,list_group:e.target.value}))}>
                <option value="all">All</option><option value="members">Members</option><option value="leaders">Leaders</option>
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
                      <td><span className={`badge ${e.list_group==='all'?'badge-orange':'badge-blue'}`}>{e.list_group}</span></td>
                      <td><Button variant="ghost" size="sm" onClick={() => removeEmail(e.id)}>Remove</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── PATHWAY ── */}
        {tab === 'pathway' && (
          <div className={`${styles.panel} fade-up`}>
            <div className={styles.secTitle}>Pathway step content</div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {pathway.map((s,i) => (
                <div key={s.step_number} className={styles.card} style={{padding:16}}>
                  <div style={{display:'grid',gridTemplateColumns:'auto 1fr 1fr',gap:12,alignItems:'center'}}>
                    <div style={{fontSize:20}}>{s.emoji}</div>
                    <Field label={`Step ${s.step_number} name`} value={s.name}      onChange={v => setPathway(p=>p.map((x,j)=>j===i?{...x,name:v}:x))} />
                    <Field label="Sub-label"                     value={s.sub_label} onChange={v => setPathway(p=>p.map((x,j)=>j===i?{...x,sub_label:v}:x))} />
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.saveRow}><Button variant="blue" onClick={savePathway}>Save all steps</Button></div>
          </div>
        )}

        {/* ── PUBLICATIONS ── */}
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
                      <td style={{color:'var(--grey-text)',fontSize:12}}>{p.url ?? '—'}</td>
                      <td>
                        <button
                          className={`badge ${p.active?'badge-green':'badge-grey'}`}
                          style={{cursor:'pointer'}}
                          onClick={async () => {
                            await supabase.from('home_publications').update({ active: !p.active }).eq('id', p.id)
                            setPubs(prev => prev.map(x => x.id===p.id ? {...x,active:!x.active} : x))
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
    <div style={{marginBottom:14}}>
      <label style={{display:'block',fontSize:11.5,fontWeight:600,color:'var(--grey-dark)',marginBottom:5}}>{label}</label>
      {textarea
        ? <textarea style={{width:'100%',background:'var(--grey-bg)',border:'1px solid var(--grey-rule)',borderRadius:'var(--rs)',padding:'9px 12px',fontSize:13,color:'var(--ink)',outline:'none',resize:'vertical',minHeight:72,fontFamily:'inherit'}} value={value||''} onChange={e=>onChange(e.target.value)} />
        : <input    style={{width:'100%',background:'var(--grey-bg)',border:'1px solid var(--grey-rule)',borderRadius:'var(--rs)',padding:'9px 12px',fontSize:13,color:'var(--ink)',outline:'none',fontFamily:'inherit'}}                      value={value||''} onChange={e=>onChange(e.target.value)} />
      }
    </div>
  )
}
