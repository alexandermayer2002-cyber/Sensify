import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import AskSensify from './AskSensify'

// ── Tier colors (matches the rest of the app) ──
const TIER = {
  Safe: { dot: '#2C9D8A', text: '#1A6256', bg: '#DEF2EE' },
  Limit: { dot: '#E8941F', text: '#8A5410', bg: '#FCEFD9' },
  Avoid: { dot: '#D64545', text: '#A32D2D', bg: '#FBE9E9' },
}

const SYMPTOM_OPTIONS = ['Bloating', 'Gas / cramping', 'Reflux', 'Fatigue', 'Headache', 'Skin issue', 'Brain fog', 'Other']
const SEVERITY = ['mild', 'moderate', 'severe']

export default function MaintainHub({ session, profile }) {
  const [view, setView] = useState('hub') // hub | ask | symptom | history
  const [foodMap, setFoodMap] = useState([])
  const [meals, setMeals] = useState([])
  const [symptoms, setSymptoms] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const [fm, ml, sl] = await Promise.all([
        supabase.from('food_map').select('*').eq('user_id', session.user.id),
        supabase.from('meal_logs').select('*').eq('user_id', session.user.id).order('logged_at', { ascending: false }).limit(50),
        supabase.from('symptom_logs').select('*').eq('user_id', session.user.id).order('logged_at', { ascending: false }).limit(50),
      ])
      setFoodMap(fm.data || [])
      setMeals(ml.data || [])
      setSymptoms(sl.data || [])
    } catch (e) {}
    setLoading(false)
  }

  useEffect(() => { load() }, [session.user.id])

  const firstName = profile?.full_name?.split(' ')[0] || 'there'
  const safe = foodMap.filter(f => f.verdict === 'Safe')
  const limit = foodMap.filter(f => f.verdict === 'Limit')
  const avoid = foodMap.filter(f => f.verdict === 'Avoid')

  if (view === 'ask') {
    return (
      <div style={{ height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column' }}>
        <BackBar label="Ask Sensify" onBack={() => setView('hub')} />
        <div style={{ flex: 1, overflow: 'hidden' }}><AskSensify session={session} /></div>
      </div>
    )
  }

  if (view === 'symptom') {
    return <SymptomReport session={session} onBack={() => { setView('hub'); load() }} />
  }

  if (view === 'history') {
    return <HistoryLog meals={meals} symptoms={symptoms} onBack={() => setView('hub')} />
  }

  return (
    <div style={s.wrap}>
      <style>{css}</style>
      <div style={s.body}>
        <div style={s.greet}>Hi, <em style={s.em}>{firstName}.</em></div>
        <div style={s.subgreet}>Your Food Map is up to date. Here's your kit for today.</div>

        {/* Ask Sensify hero */}
        <div style={s.hero} onClick={() => setView('ask')}>
          <div style={s.heroEye}>Ask Sensify</div>
          <div style={s.heroTitle}>What's on the menu <em style={{ fontStyle: 'italic', color: '#8BAE8A' }}>today?</em></div>
          <div style={s.heroDesc}>Check any food, read a menu, or just tell me what you ate. I know your whole map.</div>
          <div style={s.heroInput}>
            <span>Ask about a food, or log a meal...</span>
            <span style={s.heroSend}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></span>
          </div>
        </div>

        {/* Food Map summary */}
        <div style={s.sectionLabel}>Your Food Map</div>
        <div style={s.mapCard}>
          {loading ? <div style={s.muted}>Loading…</div> : foodMap.length === 0 ? (
            <div style={s.muted}>Your verdicts will appear here as you complete reintroductions.</div>
          ) : (
            <>
              <MapRow tier="Avoid" foods={avoid} />
              <MapRow tier="Limit" foods={limit} />
              <MapRow tier="Safe" foods={safe} />
            </>
          )}
        </div>

        {/* Track tiles */}
        <div style={s.sectionLabel}>Track</div>
        <div style={s.grid2}>
          <div style={s.tile} onClick={() => setView('symptom')}>
            <div style={s.tileIco}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><circle cx="12" cy="12" r="3"/></svg></div>
            <div style={s.tileT}>Report a symptom</div>
            <div style={s.tileD}>Felt off? Note it so we can spot patterns.</div>
          </div>
          <div style={s.tile} onClick={() => setView('history')}>
            <div style={s.tileIco}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></div>
            <div style={s.tileT}>History &amp; trends</div>
            <div style={s.tileD}>Your meals and symptoms over time.</div>
          </div>
        </div>

        {/* Refer a friend */}
        <div style={s.sectionLabel}>Refer a friend</div>
        <div style={s.referCard}>
          <div style={s.referText}>Know someone who's tired of guessing what their body can't handle? Send them your Food Map. They get 10% off the program, and you get a free month of Maintain when they join.</div>
          <button style={s.referBtn}>Share your Food Map</button>
        </div>

        {/* Recent activity */}
        <div style={s.sectionLabel}>Recent activity</div>
        <div style={s.activity}>
          {[...meals.slice(0, 2).map(m => ({ type: 'meal', m, at: m.logged_at })),
            ...symptoms.slice(0, 1).map(sm => ({ type: 'symptom', sm, at: sm.logged_at }))]
            .sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 4).map((item, i) => (
            <ActivityRow key={i} item={item} />
          ))}
          {meals.length === 0 && symptoms.length === 0 && <div style={{ ...s.muted, padding: '12px 0' }}>Nothing logged yet. Try asking Sensify about a meal.</div>}
        </div>
      </div>
    </div>
  )
}

function MapRow({ tier, foods }) {
  if (foods.length === 0) return null
  const t = TIER[tier]
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '7px' }}>
        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: t.dot }} />
        <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', color: t.text }}>{tier}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {foods.map((f, i) => <span key={i} style={{ fontSize: '12.5px', fontWeight: 500, padding: '5px 11px', borderRadius: '9px', background: t.bg, color: t.text }}>{f.food}</span>)}
      </div>
    </div>
  )
}

function ActivityRow({ item }) {
  if (item.type === 'meal') {
    const foods = (item.m.foods || []).map(f => f.name).join(', ')
    const flagged = item.m.flagged
    return (
      <div style={s.actRow}>
        <span style={{ ...s.actDot, background: flagged ? '#E8941F' : '#2C9D8A' }} />
        <span style={s.actTxt}><b>{flagged ? 'Logged (flagged):' : 'Logged:'}</b> {foods || item.m.raw_text}</span>
        <span style={s.actTime}>{fmtTime(item.at)}</span>
      </div>
    )
  }
  return (
    <div style={s.actRow}>
      <span style={{ ...s.actDot, background: '#A8A69E' }} />
      <span style={s.actTxt}><b>Symptom:</b> {item.sm.severity} {item.sm.symptom.toLowerCase()}</span>
      <span style={s.actTime}>{fmtTime(item.at)}</span>
    </div>
  )
}

// ── Symptom reporting view ──
function SymptomReport({ session, onBack }) {
  const [symptom, setSymptom] = useState(null)
  const [severity, setSeverity] = useState(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const save = async () => {
    if (!symptom || !severity) return
    setSaving(true)
    try {
      await supabase.from('symptom_logs').insert({ user_id: session.user.id, symptom, severity, note: note || null })
      setDone(true)
      setTimeout(onBack, 1100)
    } catch (e) { setSaving(false) }
  }

  if (done) return (
    <div style={s.wrap}><div style={{ ...s.body, textAlign: 'center', paddingTop: '80px' }}>
      <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#EDF3ED', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3D5C3C" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div style={{ fontFamily: 'Fraunces, serif', fontSize: '20px', fontWeight: 300 }}>Logged. Thanks for noting it.</div>
    </div></div>
  )

  return (
    <div style={s.wrap}>
      <style>{css}</style>
      <BackBar label="Report a symptom" onBack={onBack} />
      <div style={s.body}>
        <div style={s.qLabel}>What are you feeling?</div>
        <div style={s.chipWrap}>
          {SYMPTOM_OPTIONS.map(opt => (
            <button key={opt} style={symptom === opt ? s.chipOn : s.chip} onClick={() => setSymptom(opt)}>{opt}</button>
          ))}
        </div>

        <div style={{ ...s.qLabel, marginTop: '24px' }}>How intense?</div>
        <div style={s.sevRow}>
          {SEVERITY.map(sv => (
            <button key={sv} style={severity === sv ? s.sevOn : s.sev} onClick={() => setSeverity(sv)}>{sv}</button>
          ))}
        </div>

        <div style={{ ...s.qLabel, marginTop: '24px' }}>Anything to add? <span style={{ fontWeight: 400, color: '#A8A69E' }}>(optional)</span></div>
        <textarea style={s.textarea} rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="" />

        <button style={(symptom && severity && !saving) ? s.cta : s.ctaOff} disabled={!symptom || !severity || saving} onClick={save}>
          {saving ? 'Saving…' : 'Log symptom'}
        </button>
        <div style={s.disclaimer}>For severe or concerning symptoms, contact a healthcare provider. This log helps spot patterns, it is not medical care.</div>
      </div>
    </div>
  )
}

// ── History & trends view ──
function HistoryLog({ meals, symptoms, onBack }) {
  const [tab, setTab] = useState('meals')
  return (
    <div style={s.wrap}>
      <style>{css}</style>
      <BackBar label="History & trends" onBack={onBack} />
      <div style={s.body}>
        <div style={s.histTabs}>
          <button style={tab === 'meals' ? s.histTabOn : s.histTab} onClick={() => setTab('meals')}>Meals</button>
          <button style={tab === 'symptoms' ? s.histTabOn : s.histTab} onClick={() => setTab('symptoms')}>Symptoms</button>
        </div>

        {tab === 'meals' ? (
          meals.length === 0 ? <div style={s.muted}>No meals logged yet.</div> :
          groupByDate(meals).map(([date, items]) => (
            <div key={date} style={{ marginBottom: '18px' }}>
              <div style={s.histDate}>{fmtDate(date)}</div>
              {items.map((m, i) => (
                <div key={i} style={s.histRow}>
                  <span style={{ ...s.actDot, background: m.flagged ? '#E8941F' : '#2C9D8A', marginTop: '6px' }} />
                  <div style={{ flex: 1 }}>
                    <div style={s.histFoods}>{(m.foods || []).map(f => f.name).join(', ') || m.raw_text}</div>
                    {m.flagged && <div style={s.histFlag}>{(m.foods || []).filter(f => f.mapStatus === 'avoid' || f.mapStatus === 'limit').map(f => `${f.name} (${f.mapStatus})`).join(', ')}</div>}
                  </div>
                  <span style={s.actTime}>{fmtTime(m.logged_at)}</span>
                </div>
              ))}
            </div>
          ))
        ) : (
          symptoms.length === 0 ? <div style={s.muted}>No symptoms logged yet.</div> :
          groupByDate(symptoms).map(([date, items]) => (
            <div key={date} style={{ marginBottom: '18px' }}>
              <div style={s.histDate}>{fmtDate(date)}</div>
              {items.map((sm, i) => (
                <div key={i} style={s.histRow}>
                  <span style={{ ...s.actDot, background: sm.severity === 'severe' ? '#D64545' : sm.severity === 'moderate' ? '#E8941F' : '#A8A69E', marginTop: '6px' }} />
                  <div style={{ flex: 1 }}>
                    <div style={s.histFoods}>{sm.symptom} <span style={{ color: '#A8A69E', fontSize: '12px' }}>· {sm.severity}</span></div>
                    {sm.note && <div style={s.histFlag}>{sm.note}</div>}
                  </div>
                  <span style={s.actTime}>{fmtTime(sm.logged_at)}</span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function BackBar({ label, onBack }) {
  return (
    <div style={s.backBar}>
      <button style={s.backBtn} onClick={onBack}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1C1C1C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>
      <span style={s.backLabel}>{label}</span>
    </div>
  )
}

// ── helpers ──
function fmtTime(d) {
  const date = new Date(d)
  const now = new Date()
  if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(' ', '').toLowerCase()
  const yest = new Date(now); yest.setDate(now.getDate() - 1)
  if (date.toDateString() === yest.toDateString()) return 'Yesterday'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function fmtDate(dateStr) {
  const date = new Date(dateStr + 'T12:00:00')
  const now = new Date()
  if (date.toDateString() === now.toDateString()) return 'Today'
  const yest = new Date(now); yest.setDate(now.getDate() - 1)
  if (date.toDateString() === yest.toDateString()) return 'Yesterday'
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}
function groupByDate(items) {
  const groups = {}
  for (const it of items) {
    const d = it.log_date || (it.logged_at || '').split('T')[0]
    if (!groups[d]) groups[d] = []
    groups[d].push(it)
  }
  return Object.entries(groups).sort((a, b) => new Date(b[0]) - new Date(a[0]))
}

const css = `@keyframes none {}`

const s = {
  wrap: { maxWidth: '680px', margin: '0 auto', width: '100%', minHeight: '100%' },
  body: { padding: '22px 18px 40px' },
  greet: { fontFamily: 'Fraunces, serif', fontSize: '28px', fontWeight: 300 },
  em: { fontStyle: 'italic', color: '#3D5C3C' },
  subgreet: { fontSize: '13px', color: '#7A7A72', marginTop: '3px', marginBottom: '22px' },
  sectionLabel: { fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.7px', color: '#7A7A72', margin: '24px 0 11px' },
  muted: { fontSize: '13px', color: '#A8A69E', lineHeight: 1.5 },

  hero: { background: '#0E0E0C', borderRadius: '16px', padding: '20px', position: 'relative', overflow: 'hidden', cursor: 'pointer' },
  heroEye: { fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'rgba(139,174,138,0.75)', marginBottom: '8px' },
  heroTitle: { fontFamily: 'Fraunces, serif', fontSize: '22px', fontWeight: 300, color: 'white', marginBottom: '6px' },
  heroDesc: { fontSize: '12.5px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, marginBottom: '14px' },
  heroInput: { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '10px', padding: '11px 13px', fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  heroSend: { width: '26px', height: '26px', borderRadius: '7px', background: '#3D5C3C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  mapCard: { background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '14px', padding: '16px' },

  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  tile: { background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '13px', padding: '15px', cursor: 'pointer' },
  tileIco: { width: '32px', height: '32px', borderRadius: '9px', background: '#EDF3ED', color: '#3D5C3C', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' },
  tileT: { fontSize: '13px', fontWeight: 600, marginBottom: '3px' },
  tileD: { fontSize: '11px', color: '#7A7A72', lineHeight: 1.4 },

  referCard: { background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '13px', padding: '16px' },
  referText: { fontSize: '12.5px', color: '#7A7A72', lineHeight: 1.5, marginBottom: '13px' },
  referBtn: { width: '100%', padding: '11px', borderRadius: '10px', border: 'none', background: '#3D5C3C', color: 'white', fontSize: '13px', fontWeight: 600, fontFamily: 'DM Sans, sans-serif', cursor: 'pointer' },

  activity: { background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '13px', padding: '4px 16px' },
  actRow: { display: 'flex', alignItems: 'center', gap: '11px', padding: '11px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' },
  actDot: { width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0 },
  actTxt: { fontSize: '12px', flex: 1, lineHeight: 1.4 },
  actTime: { fontSize: '10px', color: '#A8A69E', fontFamily: 'DM Mono, monospace', flexShrink: 0 },

  backBar: { display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)' },
  backBtn: { width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: '#F1EFE8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  backLabel: { fontSize: '15px', fontWeight: 600 },

  qLabel: { fontSize: '14px', fontWeight: 600, marginBottom: '11px' },
  chipWrap: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  chip: { padding: '9px 14px', borderRadius: '10px', border: '1.5px solid rgba(0,0,0,0.1)', background: 'white', fontSize: '13px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 500, color: '#1C1C1C' },
  chipOn: { padding: '9px 14px', borderRadius: '10px', border: '1.5px solid #3D5C3C', background: '#EDF3ED', fontSize: '13px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 500, color: '#2D6B42' },
  sevRow: { display: 'flex', gap: '8px' },
  sev: { flex: 1, padding: '11px', borderRadius: '10px', border: '1.5px solid rgba(0,0,0,0.1)', background: 'white', fontSize: '13px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 500, color: '#1C1C1C', textTransform: 'capitalize' },
  sevOn: { flex: 1, padding: '11px', borderRadius: '10px', border: '1.5px solid #3D5C3C', background: '#EDF3ED', fontSize: '13px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 500, color: '#2D6B42', textTransform: 'capitalize' },
  textarea: { width: '100%', boxSizing: 'border-box', padding: '13px', borderRadius: '11px', border: '1.5px solid rgba(0,0,0,0.1)', background: 'white', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', resize: 'vertical', lineHeight: 1.5 },
  cta: { width: '100%', marginTop: '24px', padding: '14px', borderRadius: '12px', border: 'none', background: '#3D5C3C', color: 'white', fontSize: '14px', fontWeight: 600, fontFamily: 'DM Sans, sans-serif', cursor: 'pointer' },
  ctaOff: { width: '100%', marginTop: '24px', padding: '14px', borderRadius: '12px', border: 'none', background: '#C8C6BE', color: 'white', fontSize: '14px', fontWeight: 600, fontFamily: 'DM Sans, sans-serif', cursor: 'not-allowed' },
  disclaimer: { fontSize: '11px', color: '#A8A69E', textAlign: 'center', marginTop: '14px', lineHeight: 1.5 },

  histTabs: { display: 'flex', gap: '8px', marginBottom: '20px' },
  histTab: { flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)', background: 'white', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', color: '#7A7A72' },
  histTabOn: { flex: 1, padding: '10px', borderRadius: '10px', border: '1.5px solid #3D5C3C', background: '#EDF3ED', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', color: '#2D6B42' },
  histDate: { fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#7A7A72', marginBottom: '9px' },
  histRow: { display: 'flex', gap: '11px', padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', alignItems: 'flex-start' },
  histFoods: { fontSize: '13.5px', lineHeight: 1.4 },
  histFlag: { fontSize: '11px', color: '#8A5410', marginTop: '3px' },
}
