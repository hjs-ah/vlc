import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import Button from '@/components/ui/Button'
import styles from './AdminPage.module.css'

// Grouped tab structure
const TAB_GROUPS = [
  {
    label: 'Homepage',
    tabs: {
      hero:         'Hero & Branding',
      pathway:      'Pathway Steps',
      publications: 'Articles & Marquee',
      marquee:      'Module Spotlight',
      events:       'Stay Locked In',
    }
  },
  {
    label: 'Facilitation & Users',
    tabs: {
      users:        'Users & Access',
      facilitators: 'Facilitators',
      email:        'Email List',
    }
  },
]

export default function AdminPage() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('hero')

  const [settings,     setSettings]    = useState(null)
  const [saving,       setSaving]       = useState(false)
  const [users,        setUsers]        = useState([])
  const [emailList,    setEmailList]    = useState([])
  const [newEmail,     setNewEmail]     = useState({ email:'', display_name:'', list_group:'members' })
  const [pathway,      setPathway]      = useState([])
  const [pubs,         setPubs]         = useState([])
  const [editingPub,   setEditingPub]   = useState(null)   // pub row being edited
  const [newPub,       setNewPub]       = useState({ tag:'', title:'', url:'', active:true })
  const [showNewPub,   setShowNewPub]   = useState(false)
  const [marqueeData,  setMarqueeData]  = useState(null)
  const [events,       setEvents]       = useState([])
  const [editingEvent, setEditingEvent] = useState(null)
  const [showNewEvent, setShowNewEvent] = useState(false)
  const [newEvent,     setNewEvent]     = useState({ title:'', day_time:'', description:'' })
  const [facView,      setFacView]      = useState([])
  const [courses,      setCourses]      = useState([])
  const [assignUser,   setAssignUser]   = useState('')
  const [assignCourse, setAssignCourse] = useState('')
  const [assignRole,   setAssignRole]   = useState('instructor')
  // Add new teacher state
  const [showNewUser,  setShowNewUser]  = useState(false)
  const [newUser,      setNewUser]      = useState({ full_name:'', email:'', role:'instructor' })
  const [addingUser,   setAddingUser]   = useState(false)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [
      { data: s }, { data: u }, { data: el },
      { data: pc }, { data: pb }, { data: fv }, { data: crs }, { data: evs }, { data: mq }
    ] = await Promise.all([
      supabase.from('home_settings').select('*').single(),
      supabase.from('profiles').select('*').order('full_name'),
      supabase.from('admin_email_list').select('*').eq('active', true).order('added_at'),
      supabase.from('home_pathway').select('*').order('step_number'),
      supabase.from('home_publications').select('*').order('sort_order'),
      supabase.from('course_facilitators_view').select('*').order('facilitator_name'),
      supabase.from('home_events').select('*').order('sort_order'),
      supabase.from('home_marquee').select('*').order('sort_order').limit(1).single(),
      supabase.from('courses').select('id,title,badge_label').eq('active', true).order('sort_order'),
    ])
    if (s)   setSettings(s)
    if (u)   setUsers(u)
    if (el)  setEmailList(el)
    if (pc)  setPathway(pc)
    if (pb)  setPubs(pb)
    if (fv)  setFacView(fv)
    if (crs) setCourses(crs)
    if (evs) setEvents(evs)
    if (mq)  setMarqueeData(mq)
  }

  // ── MARQUEE / MODULE SPOTLIGHT ──
  async function saveMarquee() {
    if (!marqueeData) return
    await supabase.from('home_marquee').update({
      label:           marqueeData.label,
      title:           marqueeData.title,
      subtitle:        marqueeData.subtitle,
      description:     marqueeData.description,
      scripture_text:  marqueeData.scripture_text,
      scripture_ref:   marqueeData.scripture_ref,
    }).eq('id', marqueeData.id)
    alert('Module spotlight saved ✓')
  }

  // ── EVENTS (Stay Locked In) ──
  async function saveEvent(ev) {
    await supabase.from('home_events').update({
      title: ev.title, day_time: ev.day_time, description: ev.description
    }).eq('id', ev.id)
    setEvents(prev => prev.map(e => e.id === ev.id ? ev : e))
    setEditingEvent(null)
  }
  async function addEvent() {
    if (!newEvent.title || !newEvent.day_time) { alert('Title and time are required.'); return }
    const { data, error } = await supabase.from('home_events')
      .insert({ ...newEvent, sort_order: events.length + 1, active: true })
      .select().single()
    if (!error && data) {
      setEvents(e => [...e, data])
      setNewEvent({ title:'', day_time:'', description:'' })
      setShowNewEvent(false)
    }
  }
  async function deleteEvent(id) {
    if (!confirm('Remove this event bubble?')) return
    await supabase.from('home_events').delete().eq('id', id)
    setEvents(e => e.filter(x => x.id !== id))
  }
  async function toggleEvent(id, active) {
    await supabase.from('home_events').update({ active: !active }).eq('id', id)
    setEvents(prev => prev.map(e => e.id === id ? {...e, active: !active} : e))
  }

  // ── HERO ──
  async function saveSettings() {
    if (!settings) return
    setSaving(true)
    await supabase.from('home_settings').update(settings).eq('id', 1)
    setSaving(false)
    alert('Saved ✓')
  }
  async function uploadHeroImage(e, field) {
    const file = e.target.files[0]; if (!file) return
    const ext = file.name.split('.').pop()
    const path = `${field}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('hero-assets').upload(path, file, { upsert: true })
    if (error) { alert('Upload failed: ' + error.message); return }
    const { data: { publicUrl } } = supabase.storage.from('hero-assets').getPublicUrl(path)
    setSettings(s => ({ ...s, [field]: publicUrl }))
  }

  // ── USERS ──
  async function revokeUser(userId) {
    if (!confirm('Revoke access for this user?')) return
    await supabase.from('profiles').update({ active: false }).eq('id', userId)
    setUsers(u => u.filter(p => p.id !== userId))
  }

  // ── ADD NEW TEACHER from facilitators tab ──
  async function addNewTeacher() {
    if (!newUser.full_name || !newUser.email) { alert('Name and email are required.'); return }
    setAddingUser(true)
    // Create auth user via admin invite
    const { data: invited, error: invErr } = await supabase.auth.admin?.inviteUserByEmail?.(newUser.email)
    if (invErr) {
      // Fallback: just create the profile — admin can set password in Supabase dashboard
      const { data: authUser } = await supabase.auth.admin?.createUser?.({
        email: newUser.email, email_confirm: true,
      })
      if (authUser?.user) {
        await supabase.from('profiles').upsert({
          id: authUser.user.id,
          full_name: newUser.full_name,
          email: newUser.email,
          role: newUser.role,
          active: true,
        })
      } else {
        alert('Could not create user automatically. Please create them in Supabase Auth first, then add their profile in the profiles table.')
        setAddingUser(false); return
      }
    }
    alert(`${newUser.full_name} added. They will receive an invite email at ${newUser.email}. Once they accept, their profile will be available in Facilitators.`)
    setNewUser({ full_name:'', email:'', role:'instructor' })
    setShowNewUser(false)
    setAddingUser(false)
    loadAll()
  }

  // ── EMAIL LIST ──
  async function addEmail() {
    if (!newEmail.email) return
    const { data, error } = await supabase.from('admin_email_list').insert(newEmail).select().single()
    if (!error && data) { setEmailList(e => [...e, data]); setNewEmail({ email:'', display_name:'', list_group:'members' }) }
  }
  async function removeEmail(id) {
    await supabase.from('admin_email_list').update({ active: false }).eq('id', id)
    setEmailList(e => e.filter(em => em.id !== id))
  }

  // ── PATHWAY ──
  async function savePathway() {
    for (const step of pathway) {
      await supabase.from('home_pathway')
        .update({ name: step.name, sub_label: step.sub_label, description: step.description })
        .eq('step_number', step.step_number)
    }
    alert('Pathway saved ✓')
  }

  // ── PUBLICATIONS ──
  async function savePub(pub) {
    await supabase.from('home_publications').update({
      tag: pub.tag, title: pub.title, url: pub.url || null, active: pub.active
    }).eq('id', pub.id)
    setPubs(prev => prev.map(p => p.id === pub.id ? pub : p))
    setEditingPub(null)
  }
  async function addPub() {
    if (!newPub.tag || !newPub.title) { alert('Tag and title are required.'); return }
    const { data, error } = await supabase.from('home_publications')
      .insert({ ...newPub, sort_order: pubs.length + 1 })
      .select().single()
    if (!error && data) { setPubs(p => [...p, data]); setNewPub({ tag:'', title:'', url:'', active:true }); setShowNewPub(false) }
  }
  async function deletePub(id) {
    if (!confirm('Remove this article from the marquee?')) return
    await supabase.from('home_publications').delete().eq('id', id)
    setPubs(p => p.filter(x => x.id !== id))
  }

  // ── FACILITATORS ──
  async function assignFacilitator() {
    if (!assignUser || !assignCourse) { alert('Select both a person and a course.'); return }
    const { error } = await supabase.from('course_facilitators').insert({
      facilitator_id: assignUser, course_id: assignCourse, role: assignRole,
    })
    if (error) {
      if (error.code === '23505') alert('Already assigned to that course.')
      else alert('Error: ' + error.message)
      return
    }
    const { data } = await supabase.from('course_facilitators_view').select('*').order('facilitator_name')
    if (data) setFacView(data)
    setAssignUser(''); setAssignCourse('')
  }
  async function removeFacilitator(facId, courseId) {
    if (!confirm('Remove this facilitator from this course?')) return
    await supabase.from('course_facilitators').delete().eq('facilitator_id', facId).eq('course_id', courseId)
    setFacView(f => f.filter(r => !(r.facilitator_id === facId && r.course_id === courseId)))
  }

  const byFacilitator = facView.reduce((acc, row) => {
    const key = row.facilitator_id
    if (!acc[key]) acc[key] = { name: row.facilitator_name, email: row.facilitator_email, courses: [] }
    acc[key].courses.push(row)
    return acc
  }, {})

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div><h1>Verity Admin Panel</h1><p>Manage users, content, and platform settings</p></div>
        <div style={{ display:'flex', gap:10 }}>
          <Button variant="ghost" size="sm" style={{ color:'rgba(255,255,255,0.5)' }} onClick={() => navigate('/dashboard')}>← Dashboard</Button>
          <Button variant="ghost" size="sm" style={{ color:'rgba(255,255,255,0.5)' }} onClick={async () => { await signOut(); navigate('/') }}>Log out</Button>
        </div>
      </div>

      <div className={styles.body}>

        {/* ── GROUPED TABS ── */}
        <div className={styles.tabGroups}>
          {TAB_GROUPS.map(group => (
            <div key={group.label} className={styles.tabGroup}>
              <div className={styles.tabGroupLabel}>{group.label}</div>
              <div className={styles.tabGroupRow}>
                {Object.entries(group.tabs).map(([key, label]) => (
                  <button
                    key={key}
                    className={[styles.tab, tab===key ? styles.tabActive : ''].join(' ')}
                    onClick={() => setTab(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── HERO ── */}
        {tab === 'hero' && settings && (
          <div className={`${styles.panel} fade-up`}>
            <div className={styles.secTitle}>Hero section</div>
            <div className={styles.heroGrid}>
              <div>
                <Field label="Headline"      value={settings.hero_headline}  onChange={v => setSettings(s=>({...s,hero_headline:v}))} />
                <Field label="Subtext"       value={settings.hero_subtext}   onChange={v => setSettings(s=>({...s,hero_subtext:v}))}  textarea />
                <Field label="Marquee label" value={settings.marquee_label}  onChange={v => setSettings(s=>({...s,marquee_label:v}))} />
                <div className={styles.chipRow}>
                  <Field label="Chip 1 — value" value={settings.chip_1_value} onChange={v => setSettings(s=>({...s,chip_1_value:v}))} />
                  <Field label="Chip 1 — label" value={settings.chip_1_label} onChange={v => setSettings(s=>({...s,chip_1_label:v}))} />
                </div>
              </div>
              <div>
                <UploadField label="Background circular photo" icon="🖼" hint="JPG / PNG · max 5MB"
                  currentUrl={settings.hero_bg_photo_url}
                  onFile={e => uploadHeroImage(e,'hero_bg_photo_url')} accept="image/*" />
                <UploadField label="Foreground PNG (transparent bg)" icon="🧍" hint="PNG only · transparent bg"
                  currentUrl={settings.hero_fg_person_url}
                  onFile={e => uploadHeroImage(e,'hero_fg_person_url')} accept="image/png" />
              </div>
            </div>
            <div className={styles.saveRow}>
              <Button variant="ghost" onClick={loadAll}>Discard</Button>
              <Button variant="blue" onClick={saveSettings} disabled={saving}>{saving?'Saving…':'Save changes'}</Button>
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

        {/* ── PUBLICATIONS — fully editable ── */}
        {tab === 'publications' && (
          <div className={`${styles.panel} fade-up`}>
            <div className={styles.secTitle} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span>Articles & Marquee</span>
              <Button variant="blue" size="sm" onClick={() => setShowNewPub(v=>!v)}>
                {showNewPub ? 'Cancel' : '+ Add article'}
              </Button>
            </div>

            {/* Add new article form */}
            {showNewPub && (
              <div className={styles.facAssignCard} style={{marginBottom:20}}>
                <div className={styles.facAssignTitle}>New article</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 2fr 2fr',gap:12,marginBottom:12}}>
                  <Field label="Tag" value={newPub.tag} onChange={v=>setNewPub(p=>({...p,tag:v}))} />
                  <Field label="Title" value={newPub.title} onChange={v=>setNewPub(p=>({...p,title:v}))} />
                  <Field label="URL (optional)" value={newPub.url} onChange={v=>setNewPub(p=>({...p,url:v}))} />
                </div>
                <Button variant="blue" size="sm" onClick={addPub}>Add to marquee</Button>
              </div>
            )}

            {/* Editable article rows */}
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {pubs.map(p => (
                <div key={p.id} className={styles.pubRow}>
                  {editingPub?.id === p.id ? (
                    /* EDIT MODE */
                    <div className={styles.pubEditForm}>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 2fr 2fr',gap:12}}>
                        <Field label="Tag"   value={editingPub.tag}   onChange={v=>setEditingPub(x=>({...x,tag:v}))} />
                        <Field label="Title" value={editingPub.title} onChange={v=>setEditingPub(x=>({...x,title:v}))} />
                        <Field label="URL"   value={editingPub.url||''} onChange={v=>setEditingPub(x=>({...x,url:v}))} />
                      </div>
                      <div style={{display:'flex',gap:8,marginTop:8}}>
                        <Button variant="blue"  size="sm" onClick={()=>savePub(editingPub)}>Save</Button>
                        <Button variant="ghost" size="sm" onClick={()=>setEditingPub(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    /* VIEW MODE */
                    <>
                      <span className="badge badge-orange" style={{flexShrink:0}}>{p.tag}</span>
                      <span className={styles.pubTitle}>{p.title}</span>
                      <span className={styles.pubUrl}>{p.url || '—'}</span>
                      <div style={{display:'flex',gap:6,flexShrink:0}}>
                        <button
                          className={`badge ${p.active?'badge-green':'badge-grey'}`}
                          style={{cursor:'pointer'}}
                          onClick={async()=>{
                            await supabase.from('home_publications').update({active:!p.active}).eq('id',p.id)
                            setPubs(prev=>prev.map(x=>x.id===p.id?{...x,active:!x.active}:x))
                          }}
                        >
                          {p.active?'Active':'Hidden'}
                        </button>
                        <Button variant="ghost" size="sm" onClick={()=>setEditingPub({...p})}>Edit</Button>
                        <Button variant="danger" size="sm" onClick={()=>deletePub(p.id)}>✕</Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MODULE SPOTLIGHT ── */}
        {tab === 'marquee' && marqueeData && (
          <div className={`${styles.panel} fade-up`}>
            <div className={styles.secTitle}>This Month's Module Spotlight</div>
            <p style={{fontSize:13,color:'var(--grey-dark)',marginBottom:20,lineHeight:1.6}}>
              This appears in the announcement banner at the top of the homepage and in the scripture bar below the hero.
            </p>

            <div className={styles.spotlightPreview}>
              <div className={styles.spvLabel}>{marqueeData.label}</div>
              <div className={styles.spvTitle}>{marqueeData.title}</div>
              {marqueeData.subtitle && <div className={styles.spvSub}>{marqueeData.subtitle}</div>}
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:20}}>
              <Field label="Banner label (pill text)"     value={marqueeData.label}    onChange={v=>setMarqueeData(m=>({...m,label:v}))} />
              <Field label="Module title"                  value={marqueeData.title}    onChange={v=>setMarqueeData(m=>({...m,title:v}))} />
            </div>
            <Field label="Subtitle (e.g. Module 4 of 8 — Discipleship Class)"
              value={marqueeData.subtitle||''} onChange={v=>setMarqueeData(m=>({...m,subtitle:v}))} />
            <Field label="Description (longer text for module detail)"
              value={marqueeData.description||''} onChange={v=>setMarqueeData(m=>({...m,description:v}))} textarea />
            <div style={{display:'grid',gridTemplateColumns:'3fr 1fr',gap:12}}>
              <Field label="Scripture text"
                value={marqueeData.scripture_text||''} onChange={v=>setMarqueeData(m=>({...m,scripture_text:v}))} textarea />
              <Field label="Reference (e.g. 2 Timothy 2:15)"
                value={marqueeData.scripture_ref||''} onChange={v=>setMarqueeData(m=>({...m,scripture_ref:v}))} />
            </div>
            <div className={styles.saveRow}>
              <Button variant="ghost" onClick={loadAll}>Discard</Button>
              <Button variant="blue" onClick={saveMarquee}>Save module spotlight</Button>
            </div>
          </div>
        )}
        {tab === 'marquee' && !marqueeData && (
          <div className={`${styles.panel} fade-up`}>
            <div className={styles.note}>No module spotlight found. Check home_marquee table in Supabase.</div>
          </div>
        )}

        {/* ── STAY LOCKED IN EVENTS ── */}
        {tab === 'events' && (
          <div className={`${styles.panel} fade-up`}>
            <div className={styles.secTitle} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span>Stay Locked In — event bubbles</span>
              <Button variant="blue" size="sm" onClick={() => setShowNewEvent(v=>!v)}>
                {showNewEvent ? 'Cancel' : '+ Add event'}
              </Button>
            </div>

            {showNewEvent && (
              <div className={styles.facAssignCard} style={{marginBottom:20}}>
                <div className={styles.facAssignTitle}>New event bubble</div>
                <div style={{display:'grid',gridTemplateColumns:'2fr 2fr',gap:12,marginBottom:12}}>
                  <Field label="Event name (large text)" value={newEvent.title}    onChange={v=>setNewEvent(e=>({...e,title:v}))} />
                  <Field label="Day · Time (ALL CAPS)"   value={newEvent.day_time} onChange={v=>setNewEvent(e=>({...e,day_time:v.toUpperCase()}))} />
                </div>
                <Field label="Description (smaller text)" value={newEvent.description} onChange={v=>setNewEvent(e=>({...e,description:v}))} textarea />
                <Button variant="blue" size="sm" onClick={addEvent}>Add bubble</Button>
              </div>
            )}

            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {events.length === 0 && <div className={styles.note}>No events yet.</div>}
              {events.map(ev => (
                <div key={ev.id} className={styles.pubRow}>
                  {editingEvent?.id === ev.id ? (
                    <div className={styles.pubEditForm}>
                      <div style={{display:'grid',gridTemplateColumns:'2fr 2fr',gap:12,marginBottom:12}}>
                        <Field label="Event name" value={editingEvent.title}    onChange={v=>setEditingEvent(e=>({...e,title:v}))} />
                        <Field label="Day · Time" value={editingEvent.day_time} onChange={v=>setEditingEvent(e=>({...e,day_time:v.toUpperCase()}))} />
                      </div>
                      <Field label="Description" value={editingEvent.description||''} onChange={v=>setEditingEvent(e=>({...e,description:v}))} textarea />
                      <div style={{display:'flex',gap:8,marginTop:8}}>
                        <Button variant="blue"  size="sm" onClick={()=>saveEvent(editingEvent)}>Save</Button>
                        <Button variant="ghost" size="sm" onClick={()=>setEditingEvent(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:14,fontWeight:700,color:'var(--ink)'}}>{ev.title}</div>
                        <div style={{fontSize:11,fontWeight:800,letterSpacing:'0.8px',color:'var(--grey-text)',marginTop:2}}>{ev.day_time}</div>
                        {ev.description && <div style={{fontSize:12,color:'var(--grey-dark)',marginTop:3}}>{ev.description}</div>}
                      </div>
                      <div style={{display:'flex',gap:6,flexShrink:0,alignItems:'center'}}>
                        <button
                          className={`badge ${ev.active?'badge-green':'badge-grey'}`}
                          style={{cursor:'pointer'}}
                          onClick={()=>toggleEvent(ev.id, ev.active)}
                        >
                          {ev.active?'Visible':'Hidden'}
                        </button>
                        <Button variant="ghost"  size="sm" onClick={()=>setEditingEvent({...ev})}>Edit</Button>
                        <Button variant="danger" size="sm" onClick={()=>deleteEvent(ev.id)}>✕</Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            <p className={styles.note} style={{marginTop:12}}>
              These bubbles appear in the "Stay Locked In" section of the homepage hero. Day/time is displayed in bold caps next to the event name. Sort order controls display sequence.
            </p>
          </div>
        )}

        {/* ── USERS ── */}
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
                      <td><span className={`badge ${u.role==='admin'?'badge-orange':u.role==='instructor'?'badge-blue':'badge-grey'}`}>{u.role}</span></td>
                      <td><span className={`badge ${u.active?'badge-green':'badge-red'}`}>{u.active?'Active':'Inactive'}</span></td>
                      <td>{u.id!==profile?.id&&<Button variant="danger" size="sm" onClick={()=>revokeUser(u.id)}>Revoke</Button>}</td>
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

            {/* Add new teacher */}
            <div style={{marginBottom:20}}>
              <Button variant="outline" size="sm" onClick={()=>setShowNewUser(v=>!v)}>
                {showNewUser ? 'Cancel' : '+ Add new teacher'}
              </Button>
              {showNewUser && (
                <div className={styles.facAssignCard} style={{marginTop:12}}>
                  <div className={styles.facAssignTitle}>Add a new teacher to the platform</div>
                  <div className={styles.facAssignRow}>
                    <div className={styles.fg} style={{flex:2}}>
                      <Field label="Full name" value={newUser.full_name} onChange={v=>setNewUser(u=>({...u,full_name:v}))} />
                    </div>
                    <div className={styles.fg} style={{flex:2}}>
                      <Field label="Email address" value={newUser.email} onChange={v=>setNewUser(u=>({...u,email:v}))} />
                    </div>
                    <div className={styles.fg} style={{flex:1}}>
                      <label className={styles.fl}>Role</label>
                      <select className={styles.fi} value={newUser.role} onChange={e=>setNewUser(u=>({...u,role:e.target.value}))}>
                        <option value="instructor">Instructor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div style={{paddingTop:20}}>
                      <Button variant="blue" size="sm" onClick={addNewTeacher} disabled={addingUser}>
                        {addingUser?'Adding…':'Add teacher →'}
                      </Button>
                    </div>
                  </div>
                  <p style={{fontSize:12,color:'var(--grey-text)',marginTop:8}}>
                    They will receive an invite email. Once they accept and log in, assign them to courses below.
                  </p>
                </div>
              )}
            </div>

            {/* Assign to course */}
            <div className={styles.facAssignCard}>
              <div className={styles.facAssignTitle}>Assign a facilitator to a course</div>
              <div className={styles.facAssignRow}>
                <div className={styles.fg} style={{flex:2}}>
                  <label className={styles.fl}>Person</label>
                  <select className={styles.fi} value={assignUser} onChange={e=>setAssignUser(e.target.value)}>
                    <option value="">— Select person —</option>
                    {users.filter(u=>u.role!=='student'&&u.active).map(u=>(
                      <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
                    ))}
                  </select>
                </div>
                <div className={styles.fg} style={{flex:2}}>
                  <label className={styles.fl}>Course</label>
                  <select className={styles.fi} value={assignCourse} onChange={e=>setAssignCourse(e.target.value)}>
                    <option value="">— Select course —</option>
                    {courses.map(c=>(<option key={c.id} value={c.id}>{c.title}</option>))}
                  </select>
                </div>
                <div className={styles.fg} style={{flex:1}}>
                  <label className={styles.fl}>Role</label>
                  <select className={styles.fi} value={assignRole} onChange={e=>setAssignRole(e.target.value)}>
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

            {/* Current assignments */}
            <div className={styles.facList}>
              {Object.values(byFacilitator).length === 0
                ? <div className={styles.note}>No facilitators assigned yet.</div>
                : Object.values(byFacilitator).map(fac=>(
                  <div key={fac.email} className={styles.facPersonCard}>
                    <div className={styles.facPersonHead}>
                      <div className={styles.facAvatar}>{fac.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}</div>
                      <div><div className={styles.facName}>{fac.name}</div><div className={styles.facEmail}>{fac.email}</div></div>
                    </div>
                    <div className={styles.facCourseList}>
                      {fac.courses.map(row=>(
                        <div key={row.course_id} className={styles.facCourseRow}>
                          <div className={styles.facCourseInfo}>
                            <span className={styles.facCourseName}>{row.course_name}</span>
                            <span className={`badge ${row.facilitator_role==='instructor'?'badge-blue':'badge-grey'}`} style={{fontSize:10}}>{row.facilitator_role}</span>
                          </div>
                          <button className={styles.facRemoveBtn} onClick={()=>removeFacilitator(row.facilitator_id,row.course_id)}>Remove</button>
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
            <div className={styles.addRow}>
              <input className={styles.input} placeholder="Email address" value={newEmail.email} onChange={e=>setNewEmail(n=>({...n,email:e.target.value}))} />
              <input className={styles.input} placeholder="Display name"  value={newEmail.display_name} onChange={e=>setNewEmail(n=>({...n,display_name:e.target.value}))} />
              <select className={styles.input} value={newEmail.list_group} onChange={e=>setNewEmail(n=>({...n,list_group:e.target.value}))}>
                <option value="all">All</option><option value="members">Members</option><option value="leaders">Leaders</option>
              </select>
              <Button variant="blue" size="sm" onClick={addEmail}>+ Add</Button>
            </div>
            <div className={styles.tableWrap}>
              <table>
                <thead><tr><th>Email</th><th>Name</th><th>Group</th><th></th></tr></thead>
                <tbody>
                  {emailList.map(e=>(
                    <tr key={e.id}>
                      <td className={styles.nc}>{e.email}</td>
                      <td>{e.display_name}</td>
                      <td><span className={`badge ${e.list_group==='all'?'badge-orange':'badge-blue'}`}>{e.list_group}</span></td>
                      <td><Button variant="ghost" size="sm" onClick={()=>removeEmail(e.id)}>Remove</Button></td>
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

function UploadField({ label, icon, hint, currentUrl, onFile, accept }) {
  return (
    <div className="uploadGroup" style={{marginBottom:16}}>
      <label style={{display:'block',fontSize:11.5,fontWeight:600,color:'var(--grey-dark)',marginBottom:6}}>{label}</label>
      <label style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',border:'1.5px dashed var(--grey-rule)',borderRadius:'var(--r)',padding:'22px 18px',textAlign:'center',cursor:'pointer',transition:'all .2s'}}>
        <div style={{fontSize:24,marginBottom:6}}>{icon}</div>
        <p style={{fontSize:12.5,color:'var(--grey-dark)'}}><strong style={{color:'var(--blue)'}}>Click to upload</strong><br/>{hint}</p>
        <input type="file" accept={accept} style={{display:'none'}} onChange={onFile} />
      </label>
      {currentUrl && <img src={currentUrl} alt="" style={{width:54,height:54,borderRadius:7,objectFit:'cover',border:'1px solid var(--grey-rule)',marginTop:10}} />}
    </div>
  )
}
