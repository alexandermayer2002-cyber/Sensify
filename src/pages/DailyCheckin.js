import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { protocolDay } from '../utils/protocolDay'
import NumPad from '../components/NumPad'
import { todayLocal, localDateString } from '../utils/dateUtils'

// ============================================================
// DailyCheckin
// The daily in-app ritual. Captures, while recall is accurate:
//   - protocol compliance (did you follow it today)
//   - last night's sleep, today's stress, today's hydration
//   - cycle phase (women only), drinks (drinkers only)
// Writes one row per day to daily_factors. Capture only (Layer 1).
// ============================================================

const SLEEP_BANDS = [
  { label: 'Under 6 hrs', value: 'under6' },
  { label: '6–7 hrs', value: '6-7' },
  { label: '7–8 hrs', value: '7-8' },
  { label: '8+ hrs', value: '8plus' },
]
const STRESS_BANDS = [
  { label: 'Low', value: 'low' },
  { label: 'Mild', value: 'mild' },
  { label: 'Moderate', value: 'moderate' },
  { label: 'High', value: 'high' },
  { label: 'Severe', value: 'severe' },
]
const HYDRATION_BANDS = [
  { label: 'Under 3', value: 'under3' },
  { label: '3–5', value: '3-5' },
  { label: '6–8', value: '6-8' },
  { label: '8+', value: '8plus' },
]
const CYCLE_PHASES = [
  { label: 'On my period', value: 'period' },
  { label: 'Not on it', value: 'none' },
  { label: 'Not sure', value: 'unsure' },
]

// Range validation for numpad entries. Keeps impossible values (e.g. 75 hours
// of sleep) out of the daily_factors math the AI insights compute against.
const PAD_LIMITS = {
  sleep: { min: 0, max: 14, warn: 'Between 0 and 14 hours.' },
  hydration: { min: 0, max: 20, warn: 'Between 0 and 20 cups.' },
  drinks: { min: 0, max: 30, warn: 'Between 0 and 30 drinks.' },
}
const padInRange = (field, v) => {
  if (v === '') return true
  const n = parseFloat(v)
  return !isNaN(n) && n >= PAD_LIMITS[field].min && n <= PAD_LIMITS[field].max
}

const PAGE_CSS = `
  .sn-input { background: #FFFFFF; border: none; box-shadow: var(--shadow-1), inset 0 1px 3px rgba(56,62,48,0.05); transition: box-shadow var(--t-fast) var(--ease); }
  .sn-input:focus { outline: none; box-shadow: 0 0 0 3px rgba(61,92,60,0.30), var(--shadow-1); }
  .sn-pad button { min-height: 52px; transition: transform 120ms var(--ease), box-shadow 120ms var(--ease); }
  .sn-pad button:active { transform: scale(0.94); }
`

const s = {
  wrap: { minHeight: '100vh', background: 'transparent', display: 'flex', flexDirection: 'column' },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', boxShadow: 'var(--shadow-1)', position: 'sticky', top: 0, zIndex: 10 },
  back: { background: 'none', border: 'none', color: '#73736A', fontSize: '14px', cursor: 'pointer' },
  logo: { fontFamily: 'Fraunces, serif', fontSize: '19px', fontWeight: 500, color: '#20241F' },
  content: { flex: 1, maxWidth: '560px', width: '100%', margin: '0 auto', padding: '28px 24px 40px' },
  eyebrow: { display: 'block', marginBottom: '10px' },
  title: { fontFamily: 'Fraunces, serif', fontSize: '30px', fontWeight: 300, lineHeight: 1.2, marginBottom: '6px', color: '#20241F', fontVariationSettings: "'SOFT' 60, 'WONK' 1" },
  titleEm: { color: '#3D5C3C' },
  hint: { fontSize: '13px', color: '#73736A', lineHeight: 1.6, marginBottom: '28px' },
  block: { padding: '18px', marginBottom: '12px' },
  label: { fontSize: '14.5px', fontWeight: 600, marginBottom: '11px', lineHeight: 1.5, color: '#20241F' },
  opts: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  opt: { padding: '11px 14px', borderRadius: '999px', border: 'none', background: '#F7F5EE', fontSize: '13px', cursor: 'pointer', color: '#5A5A52', fontWeight: 600, flex: '1 1 auto', minWidth: 'fit-content', textAlign: 'center', transition: 'all 0.12s' },
  optOn: { padding: '11px 14px', borderRadius: '999px', border: 'none', background: '#3D5C3C', fontSize: '13px', cursor: 'pointer', color: '#FFFFFF', fontWeight: 600, flex: '1 1 auto', minWidth: 'fit-content', textAlign: 'center', boxShadow: 'var(--shadow-pill)' },
  yn: { display: 'flex', gap: '8px' },
  ynBtn: { flex: 1, padding: '14px', borderRadius: '16px', border: 'none', boxShadow: 'var(--shadow-1)', background: '#FFFFFF', fontSize: '15px', fontWeight: 500, cursor: 'pointer', color: '#20241F' },
  ynYes: { flex: 1, padding: '14px', borderRadius: '16px', border: 'none', boxShadow: 'var(--shadow-pill)', background: '#3D5C3C', fontSize: '15px', fontWeight: 600, cursor: 'pointer', color: 'white' },
  ynNo: { flex: 1, padding: '14px', borderRadius: '16px', border: 'none', boxShadow: 'var(--shadow-1)', background: '#73736A', fontSize: '15px', fontWeight: 600, cursor: 'pointer', color: 'white' },
  drinksRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  stepper: { display: 'flex', alignItems: 'center', gap: '14px' },
  stepBtn: { width: '38px', height: '38px', borderRadius: '10px', border: 'none', boxShadow: 'var(--shadow-1)', background: 'white', fontSize: '18px', cursor: 'pointer', color: '#3D5C3C' },
  stepVal: { fontFamily: 'Fraunces, serif', fontSize: '24px', fontWeight: 300, minWidth: '28px', textAlign: 'center', color: '#20241F' },
  footer: { position: 'sticky', bottom: 0, background: 'rgba(251,248,242,0.92)', backdropFilter: 'blur(8px)', boxShadow: '0 -8px 24px rgba(56,62,48,0.06)', padding: '16px 24px', maxWidth: '560px', width: '100%', margin: '0 auto' },
  cta: { width: '100%' },
  ctaOff: { width: '100%' },
  padWarn: { marginTop: 8, padding: '8px 11px', background: '#FBF0DF', color: '#9A6212', borderRadius: 10, fontSize: '11.5px', lineHeight: 1.5 },
}

export default function DailyCheckin({ session, profile, onBack, onComplete }) {
  const [followed, setFollowed] = useState(null)
  const [sleep, setSleep] = useState('')
  const [openPad, setOpenPad] = useState(null)
  const [padWarning, setPadWarning] = useState(null)
  const [stress, setStress] = useState(null)
  const [hydration, setHydration] = useState('')
  const [cyclePhase, setCyclePhase] = useState(null)
  const [drinks, setDrinks] = useState('')
  const [saving, setSaving] = useState(false)
  const [reward, setReward] = useState(null)  // { streak, weekDays, reflection } after completion
  // Phase-aware reintro block (active cycle -> food questions prepend)
  const [activeReintro, setActiveReintro] = useState(null)
  const [reintroLoggedToday, setReintroLoggedToday] = useState(false)
  const [ateFood, setAteFood] = useState(null)
  const [portion, setPortion] = useState(null) // 'small' | 'normal' | 'large', exposure days only
  const [hadSymptoms, setHadSymptoms] = useState(null)
  const [symptomIntensities, setSymptomIntensities] = useState({})
  const [otherText, setOtherText] = useState('')
  const [showSevereWarning, setShowSevereWarning] = useState(false)

  useEffect(() => {
    const loadReintro = async () => {
      try {
        const { data: active } = await supabase.from('reintroduction_results')
          .select('*').eq('user_id', session.user.id).is('verdict', null)
          .order('started_at', { ascending: false }).limit(1).maybeSingle()
        if (!active) return
        setActiveReintro(active)
        const { data: log } = await supabase.from('reintro_daily_logs')
          .select('id').eq('user_id', session.user.id).eq('reintro_id', active.id)
          .eq('log_date', todayLocal()).maybeSingle()
        setReintroLoggedToday(!!log)
      } catch (e) {}
    }
    loadReintro()
  }, [session.user.id])

  const cycleStale = (() => {
    try {
      if (!activeReintro?.started_at) return false
      const done = activeReintro.exposure_days_completed || 0
      if (done >= 3) return false
      const [y, m, d] = String(activeReintro.started_at).split('T')[0].split('-').map(Number)
      const start = new Date(y, m - 1, d)
      const now = new Date()
      const cd = Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - start) / 86400000) + 1
      return cd > 5  // mirrors ReintroTab's EXPOSURE_CALENDAR_CAP restart rule
    } catch (e) { return false }
  })()
  const reintroPhase = activeReintro ? ((activeReintro.exposure_days_completed || 0) < 3 ? 'exposure' : 'washout') : null
  const reintroStarted = (() => {
    try {
      if (!activeReintro?.started_at) return false
      const [y, m, d] = String(activeReintro.started_at).split('T')[0].split('-').map(Number)
      const start = new Date(y, m - 1, d)
      const now = new Date()
      return new Date(now.getFullYear(), now.getMonth(), now.getDate()) >= start
    } catch (e) { return true }
  })()
  // Stale cycle: >5 calendar days without reaching 3 exposures means the reintro tab
  // is asking for a restart. The check-in must agree, plain factors only until restarted.
  const reintroStale = (() => {
    try {
      if (!activeReintro?.started_at || activeReintro.washout_started_at) return false
      if ((activeReintro.exposure_days_completed || 0) >= 3) return false
      const [y, m, d] = String(activeReintro.started_at).split('T')[0].split('-').map(Number)
      const start = new Date(y, m - 1, d)
      const now = new Date()
      const cd = Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - start) / 86400000) + 1
      return cd > 5
    } catch (e) { return false }
  })()
  const showReintroBlock = !!activeReintro && !reintroLoggedToday && reintroStarted && !cycleStale && !reintroStale
  const reintroSymptoms = (() => {
    const list = []
    const sym = profile?.symptoms || []
    if (sym.includes('Digestive')) list.push('Bloating', 'Gas', 'Cramping', 'Reflux', 'Loose stools')
    if (sym.includes('Energy')) list.push('Fatigue', 'Afternoon crash', 'Brain fog')
    if (sym.includes('General wellness')) list.push('Headache', 'Joint aches', 'Skin flare', 'Poor sleep')
    list.push('Other')
    return [...new Set(list.length > 1 ? list : ['Bloating', 'Gas', 'Cramping', 'Fatigue', 'Headache', 'Other'])]
  })()
  // Elimination-era symptom events (the day-grain layer; skippable by design)
  const [offToday, setOffToday] = useState(null)          // null | 'fine' | 'mild' | 'notable'
  const [elimSymptoms, setElimSymptoms] = useState({})    // { name: true }
  const [elimTiming, setElimTiming] = useState(null)      // 'morning' | 'after a meal' | 'evening' | 'all day'
  // Symptom-night recall (optional free text + parsed tags)
  const [recallText, setRecallText] = useState('')
  const [recallTags, setRecallTags] = useState(null)      // null = not parsed yet, [] = parsed empty
  const [recallBusy, setRecallBusy] = useState(false)
  const toggleElimSymptom = (nm) => setElimSymptoms(prev => { const n = { ...prev }; if (n[nm]) delete n[nm]; else n[nm] = true; return n })

  const toggleSymptom = (nm) => setSymptomIntensities(prev => { const n = { ...prev }; if (n[nm]) delete n[nm]; else n[nm] = 'mild'; return n })
  const setIntensity = (nm, lvl) => { setSymptomIntensities(prev => ({ ...prev, [nm]: lvl })); if (lvl === 'severe') setShowSevereWarning(true) }

  const isWoman = profile?.gender === 'female'
  const isDrinker = profile?.drinks_alcohol === true
  // Whether this user is on an active protocol (so compliance applies).
  const onProtocol = profile?.program_phase === 'elimination' || profile?.program_phase === 'reintroduction'

  // Core required: sleep, stress, hydration. Compliance required only if on protocol.
  const reintroComplete = !showReintroBlock || (
    (reintroPhase === 'washout' || ateFood !== null) &&
    (ateFood !== true || portion !== null) &&
    (hadSymptoms !== null) &&
    (hadSymptoms === false || Object.keys(symptomIntensities).length > 0)
  )
  const complete = sleep && stress && hydration
    && padInRange('sleep', sleep) && padInRange('hydration', hydration) && padInRange('drinks', drinks)
    && (!onProtocol || followed !== null) && reintroComplete

  // Out-of-range entries never close the pad; the warning stays until corrected.
  const confirmPad = (field, v) => {
    if (!padInRange(field, v)) { setPadWarning(field); return }
    setPadWarning(null)
    setOpenPad(null)
  }

  const submit = async () => {
    if (!complete || saving) return
    setSaving(true)
    const today = todayLocal()
    const row = {
      user_id: session.user.id,
      log_date: today,
      followed_protocol: onProtocol ? followed : null,
      sleep, stress, hydration,
      cycle_phase: isWoman ? cyclePhase : null,
      drinks: isDrinker ? (drinks === '' ? 0 : parseInt(drinks, 10)) : null,
    }
    // Phase-aware: persist the reintro log + exposure counting in the same save
    if (showReintroBlock && activeReintro) {
      try {
        const symptoms = Object.entries(symptomIntensities).map(([nm, intensity]) => ({ name: nm === 'Other' && otherText.trim() ? otherText.trim() : nm, intensity }))
        const wasExposure = reintroPhase === 'exposure'
        await supabase.from('reintro_daily_logs').upsert({
          user_id: session.user.id,
          reintro_id: activeReintro.id,
          food: activeReintro.food,
          log_date: today,
          phase: reintroPhase,
          ate_food: wasExposure ? ateFood : null,
          exposure_number: wasExposure && ateFood ? (activeReintro.exposure_days_completed || 0) + 1 : null,
          had_symptoms: symptoms.length > 0,
          symptoms,
          stopped_early: false,
        }, { onConflict: 'user_id,reintro_id,log_date' })
        if (wasExposure && ateFood) {
          const newCount = (activeReintro.exposure_days_completed || 0) + 1
          const updates = { exposure_days_completed: newCount }
          if (newCount >= 3) updates.washout_started_at = today
          // Dose rides the cycle's answers jsonb, keyed by date; the verdict
          // survey merges rather than replaces, so doses survive to ruling.
          if (portion) {
            try {
              const { data: cyc } = await supabase.from('reintroduction_results').select('answers').eq('id', activeReintro.id).single()
              const a = cyc?.answers || {}
              updates.answers = { ...a, doses: { ...(a.doses || {}), [today]: portion } }
            } catch (e) {}
          }
          await supabase.from('reintroduction_results').update(updates).eq('id', activeReintro.id)
        }
      } catch (e) { console.error('reintro save error:', e) }
    }

    // Day-grain symptom events (elimination era): unrecoverable if not captured now.
    let onRecord = null
    try {
      if (!showReintroBlock && (offToday === 'mild' || offToday === 'notable')) {
        const names = Object.keys(elimSymptoms)
        if (names.length > 0) {
          await supabase.from('symptom_logs').insert(names.map(nm => ({ user_id: session.user.id, symptom: nm, severity: offToday, note: elimTiming || null })))
          // The memory beat: the system counting in front of you.
          const since30 = new Date(Date.now() - 30 * 86400000).toISOString()
          const { data: hist } = await supabase.from('symptom_logs').select('symptom, note').eq('user_id', session.user.id).gte('logged_at', since30)
          const first = names[0]
          const symCount = (hist || []).filter(h => h.symptom === first).length
          const timeCount = elimTiming ? (hist || []).filter(h => h.note === elimTiming).length : 0
          const ord = (n) => n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`
          const pieces = [`${first}${elimTiming ? ', ' + elimTiming : ''}`]
          if (symCount > 1) pieces.push(`your ${ord(symCount)} ${first.toLowerCase()} event this month`)
          else if (timeCount > 1) pieces.push(`your ${ord(timeCount)} ${elimTiming} event this month`)
          else pieces.push('first of its kind on your record')
          onRecord = pieces.join(' \u00b7 ')
        }
        // Symptom-night recall: raw words + parsed foods, tagged as recall.
        // A lead, never a ruling; stored even when the parse fails.
        if (recallText.trim().length > 2) {
          try {
            let tags = recallTags
            if (tags === null) {
              try {
                const { parseRecallFoods } = await import('../utils/aiInsights')
                tags = await parseRecallFoods(recallText)
              } catch (e2) { tags = [] }
            }
            const { saveMealLog } = await import('../utils/askSensify')
            await saveMealLog({
              userId: session.user.id,
              rawText: recallText.trim().slice(0, 400),
              foods: (tags || []).map(t => t.name),
              mapContext: { safe: [], limit: [], avoid: [] },
              source: 'recall',
            })
          } catch (e2) { /* recall is enrichment; never blocks */ }
        }
      }
    } catch (e) { /* events never block the check-in */ }

    const { error } = await supabase.from('daily_factors').upsert(row, { onConflict: 'user_id,log_date' })

    // Feed the existing compliance system (streaks, audits, 3-NOs trigger) from
    // the in-app check-in. This lets the
    // daily check-in serve as a compliance source without changing that logic.
    if (onProtocol && followed !== null) {
      try {
        await supabase.from('daily_compliance').upsert({
          user_id: session.user.id,
          date: today,
          response: followed ? 'YES' : 'NO',
          logged_at: new Date().toISOString(),
        }, { onConflict: 'user_id,date' })
      } catch (e) {}
    }

    setSaving(false)
    if (error) { alert('Could not save: ' + error.message); return }

    // ---- Build the completion payoff (streak + week + a gentle, safe reflection) ----
    try {
      const since = new Date(); since.setDate(since.getDate() - 30)
      const { data: recent } = await supabase.from('daily_factors')
        .select('log_date, sleep, stress')
        .eq('user_id', session.user.id)
        .gte('log_date', localDateString(since))
        .order('log_date', { ascending: false })
      const logged = new Set((recent || []).map(r => r.log_date))
      // Streak: consecutive days back from today that have a log
      let streak = 0
      for (let i = 0; i < 60; i++) {
        const d = new Date(); d.setDate(d.getDate() - i)
        if (logged.has(localDateString(d))) streak++
        else break
      }
      // This week's 7 cells — the PROTOCOL week (day 1 → 7, left to right, today
      // wherever it falls), matching the dashboard's framing. Trailing-7-day
      // window (today pinned right) only as fallback when not on a protocol.
      const dow = ['Su','Mo','Tu','We','Th','Fr','Sa']
      const todayStr = localDateString(new Date())
      let weekDays
      const pDay = protocolDay(profile?.protocol_start_date)
      if (profile?.protocol_start_date && pDay >= 1) {
        const [sy, sm, sd] = profile.protocol_start_date.split('T')[0].split('-').map(Number)
        const weekStart = new Date(sy, sm - 1, sd)
        weekStart.setDate(weekStart.getDate() + (Math.ceil(pDay / 7) - 1) * 7)
        weekDays = Array.from({ length: 7 }).map((_, i) => {
          const d = new Date(weekStart); d.setDate(weekStart.getDate() + i)
          const ds = localDateString(d)
          return { label: dow[d.getDay()], done: logged.has(ds), isToday: ds === todayStr }
        })
      } else {
        weekDays = Array.from({ length: 7 }).map((_, i) => {
          const d = new Date(); d.setDate(d.getDate() - (6 - i))
          return { label: dow[d.getDay()], done: logged.has(localDateString(d)), isToday: i === 6 }
        })
      }
      const loggedThisWeek = weekDays.filter(w => w.done).length
      // A gentle, SAFE reflection — info/encouragement only, never judgment.
      let reflection
      if (streak >= 7) reflection = `${streak} days in a row. You're building a really clear picture of your body.`
      else if (streak >= 3) reflection = `${streak}-day streak. Consistency like this is exactly what makes your insights sharper.`
      else if (loggedThisWeek >= 2) reflection = `That's ${loggedThisWeek} check-ins this week. Every one adds to the picture.`
      else reflection = `Logged for today. Each check-in helps us understand what's really going on.`
      setReward({ streak, weekDays, reflection, onRecord })
    } catch (e) {
      onComplete && onComplete()  // if reward calc fails, just exit normally
    }
  }

  const Bands = ({ options, value, onPick }) => (
    <div style={s.opts}>
      {options.map(o => (
        <button key={o.value} style={value === o.value ? s.optOn : s.opt} onClick={() => onPick(o.value)}>{o.label}</button>
      ))}
    </div>
  )

  if (reward) {
    return (
      <div style={s.wrap}>
        <style>{PAGE_CSS}</style>
        <div style={s.topBar}>
          <div style={{ width: 40 }} />
          <div style={s.logo}>Sensify<span style={{ color: '#3D5C3C' }}>.</span></div>
          <div style={{ width: 40 }} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', textAlign: 'center' }}>
          <div style={{ width: 68, height: 68, borderRadius: '50%', background: '#22301F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: '#8BAE8A', marginBottom: 22, boxShadow: '0 12px 32px rgba(34,48,31,0.28), 0 0 0 8px rgba(139,174,138,0.08)' }}>✓</div>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 30, fontWeight: 300, color: '#1C1C1C', marginBottom: 8 }}>Today, logged.</div>
          {reward.streak > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 24 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8BAE8A', boxShadow: '0 0 8px rgba(139,174,138,0.7)' }}></span>
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#3D5C3C', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1.2px' }}>{reward.streak} day streak, unbroken</span>
            </div>
          )}
          {/* Week row */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
            {reward.weekDays.map((d, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: d.done ? '#3D5C3C' : 'transparent',
                  border: d.done ? 'none' : '1.5px dashed #C3CDBF',
                  color: d.done ? 'white' : '#C3CDBF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
                  boxShadow: d.isToday ? '0 0 0 3px rgba(61,92,60,0.15)' : 'none',
                }}>{d.done ? '✓' : ''}</div>
                <div style={{ fontSize: 10, color: d.isToday ? '#3D5C3C' : '#A0A096', fontWeight: d.isToday ? 700 : 500 }}>{d.label}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 15, lineHeight: 1.6, color: '#4A4A45', maxWidth: 320, marginBottom: reward.onRecord ? 14 : 32 }}>{reward.reflection}</div>
          {reward.onRecord && (
            <div style={{ background: '#FFFFFF', border: '1px solid rgba(61,92,60,0.18)', borderRadius: 12, padding: '11px 15px', marginBottom: 28, maxWidth: 320 }}>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 7.5, letterSpacing: '1.2px', color: '#3D5C3C', textTransform: 'uppercase', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: '#2C9D8A', boxShadow: '0 0 7px rgba(44,157,138,0.7)' }}></span>On the record</div>
              <div style={{ fontSize: 12.5, color: '#4A4A45', lineHeight: 1.55 }}>{reward.onRecord}</div>
            </div>
          )}
          <button style={{ ...s.cta, maxWidth: 280 }} onClick={() => { onComplete && onComplete() }}>Done →</button>
        </div>
      </div>
    )
  }

  return (
    <div style={s.wrap}>
      <style>{PAGE_CSS}</style>
      <div style={s.topBar}>
        <button style={s.back} onClick={onBack}>← Back</button>
        <div style={s.logo}>Sensify<span style={{ color: '#3D5C3C' }}>.</span></div>
        <div style={{ width: 40 }} />
      </div>
      <div className="sn-rise" style={s.content}>
        <div className="sn-micro" style={s.eyebrow}>Daily check-in</div>
        <div style={s.title}>How's today?</div>
        <div style={s.hint}>A few quick taps. This tracks the things that move how you feel as much as food does, so we can tell a real change from an ordinary day.</div>

        {showReintroBlock && (
          <div style={{ background: 'linear-gradient(135deg, rgba(139,174,138,0.10), rgba(44,157,138,0.04)), #FFFFFF', border: 'none', boxShadow: 'var(--shadow-2)', borderRadius: '24px', padding: '18px', marginBottom: '18px' }}>
            <div className="sn-micro" style={{ marginBottom: '12px' }}>Reintroduction · {activeReintro.food}</div>
            {reintroPhase === 'exposure' && (
              <div style={{ marginBottom: ateFood !== null ? 16 : 0 }}>
                <div style={s.label}>Did you eat {activeReintro.food.toLowerCase()} today?</div>
                <div style={s.yn}>
                  <button style={ateFood === true ? s.ynYes : s.ynBtn} onClick={() => setAteFood(true)}>Yes</button>
                  <button style={ateFood === false ? { ...s.ynYes, background: '#73736A', boxShadow: 'var(--shadow-1)' } : s.ynBtn} onClick={() => { setAteFood(false); setHadSymptoms(null); setSymptomIntensities({}); setPortion(null) }}>Not today</button>
                </div>
                {ateFood === true && (
                  <div style={{ marginTop: 12 }}>
                    <div style={s.label}>Roughly how much?</div>
                    <div style={s.yn}>
                      {[['small', 'A little'], ['normal', 'Normal serving'], ['large', 'A lot']].map(([id, label]) => (
                        <button key={id} style={portion === id ? s.ynYes : s.ynBtn} onClick={() => setPortion(id)}>{label}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {(reintroPhase === 'washout' || ateFood !== null) && (
              <div>
                <div style={s.label}>{reintroPhase === 'washout' ? 'Anything surface today?' : 'Any symptoms today?'}</div>
                {reintroPhase === 'washout' && (
                  <div style={{ fontSize: '12px', color: '#7A7A72', lineHeight: 1.55, marginTop: '-6px', marginBottom: '10px' }}>Reactions can show up a day or two after the last serving. That's what this window watches for.</div>
                )}
                <div style={s.yn}>
                  <button style={hadSymptoms === true ? s.ynYes : s.ynBtn} onClick={() => setHadSymptoms(true)}>Yes</button>
                  <button style={hadSymptoms === false ? s.ynYes : s.ynBtn} onClick={() => { setHadSymptoms(false); setSymptomIntensities({}) }}>No, felt fine</button>
                </div>
                {hadSymptoms === true && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                    {reintroSymptoms.map(nm => {
                      const active = !!symptomIntensities[nm]
                      return (
                        <div key={nm} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <button style={{ textAlign: 'left', background: active ? '#3D5C3C' : '#F7F5EE', border: 'none', borderRadius: '16px', padding: '12px 14px', fontSize: '13px', cursor: 'pointer', color: active ? '#FFFFFF' : '#3B4036', fontWeight: active ? 600 : 400, boxShadow: active ? 'var(--shadow-pill)' : 'none' }} onClick={() => toggleSymptom(nm)}>{nm}</button>
                          {active && nm === 'Other' && (
                            <input type="text" className="sn-input" value={otherText} onChange={e => setOtherText(e.target.value)} placeholder="What did you notice?" style={{ borderRadius: '12px', padding: '12px 14px', fontSize: '16px', color: '#20241F' }} />
                          )}
                          {active && (
                            <div style={{ display: 'flex', gap: '6px', paddingLeft: '4px' }}>
                              {['mild', 'moderate', 'severe'].map(lvl => {
                                const on = symptomIntensities[nm] === lvl
                                const onStyle = lvl === 'mild' ? { background: '#EAF4EE', border: '1px solid rgba(74,140,106,0.4)', color: '#2D6B42', fontWeight: 500 }
                                  : lvl === 'moderate' ? { background: '#FDF2EA', border: '1px solid rgba(212,137,74,0.4)', color: '#9A5F1A', fontWeight: 500 }
                                  : { background: '#FAEAEA', border: '1px solid rgba(201,91,91,0.4)', color: '#8B2E2E', fontWeight: 500 }
                                return <button key={lvl} style={{ flex: 1, background: 'white', border: 'none', boxShadow: 'var(--shadow-1)', borderRadius: '10px', padding: '8px', fontSize: '12px', cursor: 'pointer', color: '#73736A', textTransform: 'capitalize', minHeight: '40px', ...(on ? onStyle : {}) }} onClick={() => setIntensity(nm, lvl)}>{lvl}</button>
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
                {showSevereWarning && (
                  <div style={{ background: '#FAEAEA', border: '1px solid rgba(201,91,91,0.3)', borderRadius: '12px', padding: '14px', marginTop: '12px' }}>
                    <div style={{ fontSize: '13px', color: '#8B2E2E', fontWeight: 600, marginBottom: '6px' }}>Severe reaction noted</div>
                    <div style={{ fontSize: '12.5px', color: '#1C1C1C', lineHeight: 1.6 }}>A severe response is a clear answer on its own. You can stop this cycle from the Reintro tab and {activeReintro.food.toLowerCase()} will be marked Avoid, or keep logging and finish the cycle. If symptoms feel serious, please seek medical care.</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

{onProtocol && (
          <div className="sn-card" style={s.block}>
            <div style={s.label}>Did you stay on your plan today?</div>
            <div style={s.yn}>
              <button style={followed === true ? s.ynYes : s.ynBtn} onClick={() => setFollowed(true)}>Yes</button>
              <button style={followed === false ? s.ynNo : s.ynBtn} onClick={() => setFollowed(false)}>No</button>
            </div>
          </div>
        )}

        <div className="sn-card" style={s.block}>
          <div style={s.label}>How many hours did you sleep last night? <span style={{ color: '#A0A096', fontWeight: 400, fontSize: '13px' }}>to the half hour is fine</span></div>
          <button type="button" onClick={() => { setPadWarning(null); setOpenPad(openPad === 'sleep' ? null : 'sleep') }} style={{ width: '100%', textAlign: 'left', background: '#FAF8F4', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, padding: '13px 15px', fontSize: 15, fontFamily: 'DM Sans, sans-serif', color: sleep === '' ? '#B8B6AE' : '#1C1C1C', cursor: 'pointer' }}>
            {sleep === '' ? 'Tap to enter' : `${sleep} hours`}
          </button>
          {openPad === 'sleep' && (
            <div style={{ marginTop: 10 }}>
              <NumPad value={sleep} onChange={v => { setPadWarning(null); setSleep(v) }} decimals maxDigits={2} unit="hours" onSubmit={() => confirmPad('sleep', sleep)} />
              {padWarning === 'sleep' && <div style={s.padWarn}>{PAD_LIMITS.sleep.warn}</div>}
            </div>
          )}
        </div>

        <div className="sn-card" style={s.block}>
          <div style={s.label}>How's your stress today?</div>
          <Bands options={STRESS_BANDS} value={stress} onPick={setStress} />
        </div>

        <div className="sn-card" style={s.block}>
          <div style={s.label}>How many cups of water today?</div>
          <button type="button" onClick={() => { setPadWarning(null); setOpenPad(openPad === 'hydration' ? null : 'hydration') }} style={{ width: '100%', textAlign: 'left', background: '#FAF8F4', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, padding: '13px 15px', fontSize: 15, fontFamily: 'DM Sans, sans-serif', color: hydration === '' ? '#B8B6AE' : '#1C1C1C', cursor: 'pointer' }}>
            {hydration === '' ? 'Tap to enter' : `${hydration} cups`}
          </button>
          {openPad === 'hydration' && (
            <div style={{ marginTop: 10 }}>
              <NumPad value={hydration} onChange={v => { setPadWarning(null); setHydration(v) }} maxDigits={2} unit="cups" onSubmit={() => confirmPad('hydration', hydration)} />
              {padWarning === 'hydration' && <div style={s.padWarn}>{PAD_LIMITS.hydration.warn}</div>}
            </div>
          )}
        </div>

        {isWoman && (
          <div className="sn-card" style={s.block}>
            <div style={s.label}>Where are you in your cycle?</div>
            <Bands options={CYCLE_PHASES} value={cyclePhase} onPick={setCyclePhase} />
          </div>
        )}

        {isDrinker && (
          <div className="sn-card" style={s.block}>
            <div style={s.label}>How many drinks today?</div>
            <button type="button" onClick={() => { setPadWarning(null); setOpenPad(openPad === 'drinks' ? null : 'drinks') }} style={{ width: '100%', textAlign: 'left', background: '#FAF8F4', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, padding: '13px 15px', fontSize: 15, fontFamily: 'DM Sans, sans-serif', color: drinks === '' ? '#B8B6AE' : '#1C1C1C', cursor: 'pointer' }}>
              {drinks === '' ? 'Tap to enter' : `${drinks} ${drinks === '1' ? 'drink' : 'drinks'}`}
            </button>
            {openPad === 'drinks' && (
              <div style={{ marginTop: 10 }}>
                <NumPad value={drinks} onChange={v => { setPadWarning(null); setDrinks(v) }} maxDigits={2} unit="drinks" onSubmit={() => confirmPad('drinks', drinks)} />
                {padWarning === 'drinks' && <div style={s.padWarn}>{PAD_LIMITS.drinks.warn}</div>}
              </div>
            )}
          </div>
        )}
      </div>
      {!showReintroBlock && activeReintro !== undefined && (
        <div style={{ maxWidth: '560px', width: '100%', margin: '0 auto', padding: '0 24px' }}>
          <div className="sn-card" style={s.block}>
            <div style={s.label}>Anything off today? <span style={{ color: '#A0A096', fontWeight: 400, fontSize: '13px' }}>optional</span></div>
            <div style={s.opts}>
              {[['fine', 'Felt fine'], ['mild', 'Something mild'], ['notable', 'Something notable']].map(([v, l]) => (
                <button key={v} style={offToday === v ? s.optOn : s.opt} onClick={() => { setOffToday(v); if (v === 'fine') { setElimSymptoms({}); setElimTiming(null) } }}>{l}</button>
              ))}
            </div>
            {(offToday === 'mild' || offToday === 'notable') && (
              <div style={{ marginTop: '13px' }}>
                <div style={{ fontSize: '12.5px', color: '#7A7A72', marginBottom: '8px' }}>What was it?</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {reintroSymptoms.map(nm => (
                    <button key={nm} style={elimSymptoms[nm] ? { ...s.optOn, flex: 'none' } : { ...s.opt, flex: 'none' }} onClick={() => toggleElimSymptom(nm)}>{nm}</button>
                  ))}
                </div>
                <div style={{ fontSize: '12.5px', color: '#7A7A72', marginBottom: '8px' }}>When did it hit?</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {['morning', 'after a meal', 'evening', 'all day'].map(t => (
                    <button key={t} style={elimTiming === t ? { ...s.optOn, flex: 'none' } : { ...s.opt, flex: 'none' }} onClick={() => setElimTiming(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
                  ))}
                </div>

                {/* SYMPTOM-NIGHT RECALL: free text in their own words, no
                    suggested foods (suggestion biases memory). Parsed on
                    demand into removable tags; raw text stored either way.
                    Always skippable: a blank is honest data too. */}
                <div style={{ marginTop: '14px' }}>
                  <div style={{ fontSize: '12.5px', color: '#7A7A72', marginBottom: '8px' }}>What have you eaten in the last few hours? (optional, your own words)</div>
                  <textarea
                    value={recallText}
                    onChange={e => { setRecallText(e.target.value); setRecallTags(null) }}
                    rows={2}
                    placeholder=""
                    style={{ width: '100%', boxSizing: 'border-box', padding: '11px 13px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.09)', background: '#FFFFFF', fontSize: '16px', fontFamily: 'DM Sans, sans-serif', color: '#1C1C1C', resize: 'vertical', lineHeight: 1.5 }}
                  />
                  {recallText.trim().length > 2 && recallTags === null && (
                    <button type="button" disabled={recallBusy} onClick={async () => {
                      setRecallBusy(true)
                      try {
                        const { parseRecallFoods } = await import('../utils/aiInsights')
                        setRecallTags(await parseRecallFoods(recallText))
                      } catch (e) { setRecallTags([]) }
                      setRecallBusy(false)
                    }} style={{ marginTop: '8px', background: 'none', border: 'none', padding: 0, fontSize: '12px', fontWeight: 600, color: '#3D5C3C', textDecoration: 'underline', textUnderlineOffset: 2, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                      {recallBusy ? 'Reading...' : 'Check what we read from it'}
                    </button>
                  )}
                  {recallTags && recallTags.length > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '8.5px', letterSpacing: '1.2px', textTransform: 'uppercase', color: '#9A927E', marginBottom: '6px' }}>We read it as · tap anything we got wrong</div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {recallTags.map((t, i) => (
                          <button key={i} type="button" onClick={() => setRecallTags(recallTags.filter((_, j) => j !== i))}
                            style={{ ...s.optOn, flex: 'none', fontSize: '12px' }}>
                            {t.name}{t.from && t.from.toLowerCase() !== t.name.toLowerCase() ? ` · ${t.from}` : ''} ×
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={{ fontSize: '10.5px', color: '#A8A69E', marginTop: '8px', lineHeight: 1.5 }}>Memory after a symptom is a lead, never a ruling. Skipping is fine; an honest blank beats a guess.</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={s.footer}>
        <button style={complete ? s.cta : s.ctaOff} disabled={!complete || saving} onClick={submit}>
          {saving ? 'Saving...' : 'Done for today →'}
        </button>
      </div>
    </div>
  )
}
