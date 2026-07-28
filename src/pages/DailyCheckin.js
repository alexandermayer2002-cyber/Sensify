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

const s = {
  wrap: { minHeight: '100vh', background: 'transparent', fontFamily: 'DM Sans, sans-serif', display: 'flex', flexDirection: 'column' },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: '#FFFFFF', borderBottom: '1px solid rgba(0,0,0,0.08)', position: 'sticky', top: 0, zIndex: 10 },
  back: { background: 'none', border: 'none', color: '#7A7A72', fontSize: '14px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  logo: { fontFamily: 'Fraunces, serif', fontSize: '19px', fontWeight: 500, color: '#1C1C1C' },
  content: { flex: 1, maxWidth: '560px', width: '100%', margin: '0 auto', padding: '28px 24px 40px' },
  eyebrow: { fontFamily: 'DM Mono, monospace', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#8BAE8A', marginBottom: '10px' },
  title: { fontFamily: 'Fraunces, serif', fontSize: '26px', fontWeight: 300, lineHeight: 1.2, marginBottom: '6px', color: '#1C1C1C' },
  titleEm: { fontStyle: 'italic', color: '#3D5C3C' },
  hint: { fontSize: '13.5px', color: '#7A7A72', lineHeight: 1.5, marginBottom: '28px' },
  block: { marginBottom: '24px' },
  label: { fontSize: '15px', fontWeight: 500, marginBottom: '11px', lineHeight: 1.5, color: '#1C1C1C' },
  opts: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  opt: { padding: '11px 14px', borderRadius: '10px', border: 'none', background: '#EDF3ED', fontSize: '13px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', color: '#5A5A52', flex: '1 1 auto', minWidth: 'fit-content', textAlign: 'center', transition: 'all 0.12s' },
  optOn: { padding: '11px 14px', borderRadius: '10px', border: 'none', background: '#3D5C3C', fontSize: '13px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', color: '#FFFFFF', fontWeight: 500, flex: '1 1 auto', minWidth: 'fit-content', textAlign: 'center', boxShadow: '0 2px 8px rgba(61,92,60,0.28)' },
  yn: { display: 'flex', gap: '8px' },
  ynBtn: { flex: 1, padding: '14px', borderRadius: '12px', border: '1.5px solid rgba(0,0,0,0.1)', background: '#FFFFFF', fontSize: '15px', fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', color: '#1C1C1C' },
  ynYes: { flex: 1, padding: '14px', borderRadius: '12px', border: '1.5px solid #3D5C3C', background: '#3D5C3C', fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', color: 'white' },
  ynNo: { flex: 1, padding: '14px', borderRadius: '12px', border: '1.5px solid #D64545', background: '#D64545', fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', color: 'white' },
  drinksRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  stepper: { display: 'flex', alignItems: 'center', gap: '14px' },
  stepBtn: { width: '38px', height: '38px', borderRadius: '10px', border: '1.5px solid rgba(0,0,0,0.12)', background: 'white', fontSize: '18px', cursor: 'pointer', color: '#3D5C3C', fontFamily: 'DM Sans, sans-serif' },
  stepVal: { fontFamily: 'Fraunces, serif', fontSize: '24px', fontWeight: 400, minWidth: '28px', textAlign: 'center', color: '#1C1C1C' },
  footer: { position: 'sticky', bottom: 0, background: '#FAF8F4', borderTop: '1px solid rgba(0,0,0,0.06)', padding: '16px 24px', maxWidth: '560px', width: '100%', margin: '0 auto' },
  cta: { width: '100%', padding: '15px', borderRadius: '12px', border: 'none', background: '#3D5C3C', color: 'white', fontSize: '15px', fontWeight: 600, fontFamily: 'DM Sans, sans-serif', cursor: 'pointer' },
  ctaOff: { width: '100%', padding: '15px', borderRadius: '12px', border: 'none', background: '#C3CDBF', color: 'white', fontSize: '15px', fontWeight: 600, fontFamily: 'DM Sans, sans-serif', cursor: 'not-allowed' },
}

export default function DailyCheckin({ session, profile, onBack, onComplete }) {
  const [followed, setFollowed] = useState(null)
  const [sleep, setSleep] = useState('')
  const [openPad, setOpenPad] = useState(null)
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

  const reintroPhase = activeReintro ? ((activeReintro.exposure_days_completed || 0) < 3 ? 'exposure' : 'washout') : null
  const showReintroBlock = !!activeReintro && !reintroLoggedToday
  const reintroSymptoms = (() => {
    const list = []
    const sym = profile?.symptoms || []
    if (sym.includes('Digestive')) list.push('Bloating', 'Gas', 'Cramping', 'Reflux', 'Loose stools')
    if (sym.includes('Energy')) list.push('Fatigue', 'Afternoon crash', 'Brain fog')
    if (sym.includes('General wellness')) list.push('Headache', 'Joint aches', 'Skin flare', 'Poor sleep')
    list.push('Other')
    return [...new Set(list.length > 1 ? list : ['Bloating', 'Gas', 'Cramping', 'Fatigue', 'Headache', 'Other'])]
  })()
  const toggleSymptom = (nm) => setSymptomIntensities(prev => { const n = { ...prev }; if (n[nm]) delete n[nm]; else n[nm] = 'mild'; return n })
  const setIntensity = (nm, lvl) => { setSymptomIntensities(prev => ({ ...prev, [nm]: lvl })); if (lvl === 'severe') setShowSevereWarning(true) }

  const isWoman = profile?.gender === 'female'
  const isDrinker = profile?.drinks_alcohol === true
  // Whether this user is on an active protocol (so compliance applies).
  const onProtocol = profile?.program_phase === 'elimination' || profile?.program_phase === 'reintroduction'

  // Core required: sleep, stress, hydration. Compliance required only if on protocol.
  const reintroComplete = !showReintroBlock || (
    (reintroPhase === 'washout' || ateFood !== null) &&
    (hadSymptoms !== null) &&
    (hadSymptoms === false || Object.keys(symptomIntensities).length > 0)
  )
  const complete = sleep && stress && hydration && (!onProtocol || followed !== null) && reintroComplete

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
          await supabase.from('reintroduction_results').update(updates).eq('id', activeReintro.id)
        }
      } catch (e) { console.error('reintro save error:', e) }
    }

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
      setReward({ streak, weekDays, reflection })
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
          <div style={{ fontSize: 15, lineHeight: 1.6, color: '#4A4A45', maxWidth: 320, marginBottom: 32 }}>{reward.reflection}</div>
          <button style={{ ...s.cta, maxWidth: 280 }} onClick={() => { onComplete && onComplete() }}>Done →</button>
        </div>
      </div>
    )
  }

  return (
    <div style={s.wrap}>
      <div style={s.topBar}>
        <button style={s.back} onClick={onBack}>← Back</button>
        <div style={s.logo}>Sensify<span style={{ color: '#3D5C3C' }}>.</span></div>
        <div style={{ width: 40 }} />
      </div>
      <div style={s.content}>
        <div style={s.eyebrow}>Daily check-in</div>
        <div style={s.title}>How's today?</div>
        <div style={s.hint}>A few quick taps. This tracks the things that move how you feel as much as food does, so we can tell a real change from an ordinary day.</div>

        {showReintroBlock && (
          <div style={{ background: 'linear-gradient(135deg, rgba(139,174,138,0.10), rgba(44,157,138,0.04)), #FFFFFF', border: '1px solid rgba(61,92,60,0.16)', borderRadius: '16px', padding: '18px', marginBottom: '18px' }}>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1px', color: '#3D5C3C', marginBottom: '12px' }}>Reintroduction · {activeReintro.food}</div>
            {reintroPhase === 'exposure' && (
              <div style={{ marginBottom: ateFood !== null ? 16 : 0 }}>
                <div style={s.label}>Did you eat {activeReintro.food.toLowerCase()} today?</div>
                <div style={s.yn}>
                  <button style={ateFood === true ? s.ynYes : s.ynBtn} onClick={() => setAteFood(true)}>Yes</button>
                  <button style={ateFood === false ? { ...s.ynYes, background: '#7A7A72', borderColor: '#7A7A72' } : s.ynBtn} onClick={() => { setAteFood(false); setHadSymptoms(null); setSymptomIntensities({}) }}>No</button>
                </div>
              </div>
            )}
            {(reintroPhase === 'washout' || ateFood !== null) && (
              <div>
                <div style={s.label}>Any symptoms today?</div>
                <div style={s.yn}>
                  <button style={hadSymptoms === true ? s.ynYes : s.ynBtn} onClick={() => setHadSymptoms(true)}>Yes</button>
                  <button style={hadSymptoms === false ? s.ynYes : s.ynBtn} onClick={() => { setHadSymptoms(false); setSymptomIntensities({}) }}>No</button>
                </div>
                {hadSymptoms === true && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                    {reintroSymptoms.map(nm => {
                      const active = !!symptomIntensities[nm]
                      return (
                        <div key={nm} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <button style={{ textAlign: 'left', background: active ? '#3D5C3C' : '#F4F2EC', border: 'none', borderRadius: '10px', padding: '12px 14px', fontSize: '13px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', color: active ? '#FFFFFF' : '#3A3A35', fontWeight: active ? 500 : 400 }} onClick={() => toggleSymptom(nm)}>{nm}</button>
                          {active && nm === 'Other' && (
                            <input type="text" value={otherText} onChange={e => setOtherText(e.target.value)} placeholder="What did you notice?" style={{ background: '#FAF8F4', border: '1px solid rgba(0,0,0,0.09)', borderRadius: '10px', padding: '12px 14px', fontSize: '13px', fontFamily: 'DM Sans, sans-serif', color: '#1C1C1C', outline: 'none' }} />
                          )}
                          {active && (
                            <div style={{ display: 'flex', gap: '6px', paddingLeft: '4px' }}>
                              {['mild', 'moderate', 'severe'].map(lvl => {
                                const on = symptomIntensities[nm] === lvl
                                const onStyle = lvl === 'mild' ? { background: '#EAF4EE', border: '1px solid rgba(74,140,106,0.4)', color: '#2D6B42', fontWeight: 500 }
                                  : lvl === 'moderate' ? { background: '#FDF2EA', border: '1px solid rgba(212,137,74,0.4)', color: '#9A5F1A', fontWeight: 500 }
                                  : { background: '#FAEAEA', border: '1px solid rgba(201,91,91,0.4)', color: '#8B2E2E', fontWeight: 500 }
                                return <button key={lvl} style={{ flex: 1, background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', padding: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', color: '#7A7A72', textTransform: 'capitalize', ...(on ? onStyle : {}) }} onClick={() => setIntensity(nm, lvl)}>{lvl}</button>
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

        {showReintroBlock && (
          <div style={{ ...s.block, background: 'linear-gradient(135deg, rgba(139,174,138,0.10), rgba(44,157,138,0.04)), #FFFFFF', border: '1px solid rgba(61,92,60,0.16)', borderRadius: '16px', padding: '18px' }}>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.9px', color: '#3D5C3C', marginBottom: '12px' }}>
              {activeReintro.food} cycle · {reintroPhase === 'exposure' ? `Exposure` : `Washout`}
            </div>
            {reintroPhase === 'exposure' && (
              <>
                <div style={s.label}>Did you eat {activeReintro.food.toLowerCase()} today?</div>
                <div style={{ ...s.yn, marginBottom: '16px' }}>
                  <button style={ateFood === true ? s.ynYes : s.ynBtn} onClick={() => setAteFood(true)}>Yes</button>
                  <button style={ateFood === false ? { ...s.ynYes, background: '#7A7A72', borderColor: '#7A7A72' } : s.ynBtn} onClick={() => { setAteFood(false); }}>Not today</button>
                </div>
              </>
            )}
            {(reintroPhase === 'washout' || ateFood !== null) && (
              <>
                <div style={s.label}>Any symptoms today?</div>
                <div style={{ ...s.yn, marginBottom: hadSymptoms ? '14px' : 0 }}>
                  <button style={hadSymptoms === true ? { ...s.ynYes, background: '#C95B5B', borderColor: '#C95B5B' } : s.ynBtn} onClick={() => setHadSymptoms(true)}>Yes</button>
                  <button style={hadSymptoms === false ? s.ynYes : s.ynBtn} onClick={() => { setHadSymptoms(false); setSymptomIntensities({}) }}>No, felt fine</button>
                </div>
                {hadSymptoms && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {reintroSymptoms.map(nm => {
                      const active = !!symptomIntensities[nm]
                      return (
                        <div key={nm} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <button
                            style={{ textAlign: 'left', background: active ? '#3D5C3C' : '#F4F2EC', border: 'none', borderRadius: '10px', padding: '12px 14px', fontSize: '13px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', color: active ? '#FFFFFF' : '#3A3A35', fontWeight: active ? 500 : 400 }}
                            onClick={() => toggleSymptom(nm)}
                          >{nm}</button>
                          {active && nm === 'Other' && (
                            <input type="text" value={otherText} onChange={e => setOtherText(e.target.value)} placeholder="What did you notice?"
                              style={{ background: '#FAF8F4', border: '1px solid rgba(0,0,0,0.09)', borderRadius: '10px', padding: '12px 14px', fontSize: '13px', fontFamily: 'DM Sans, sans-serif', color: '#1C1C1C', outline: 'none' }} />
                          )}
                          {active && (
                            <div style={{ display: 'flex', gap: '6px', paddingLeft: '4px' }}>
                              {['mild', 'moderate', 'severe'].map(lvl => {
                                const on = symptomIntensities[nm] === lvl
                                const onStyle = lvl === 'mild' ? { background: '#EAF4EE', border: '1px solid rgba(74,140,106,0.4)', color: '#2D6B42', fontWeight: 500 }
                                  : lvl === 'moderate' ? { background: '#FDF2EA', border: '1px solid rgba(212,137,74,0.4)', color: '#9A5F1A', fontWeight: 500 }
                                  : { background: '#FAEAEA', border: '1px solid rgba(201,91,91,0.4)', color: '#8B2E2E', fontWeight: 500 }
                                return (
                                  <button key={lvl} onClick={() => setIntensity(nm, lvl)}
                                    style={{ flex: 1, background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', padding: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', color: '#7A7A72', textTransform: 'capitalize', ...(on ? onStyle : {}) }}
                                  >{lvl}</button>
                                )
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
                    <div style={{ fontSize: '13px', color: '#8B2E2E', fontWeight: 600, marginBottom: '6px' }}>That sounds severe.</div>
                    <div style={{ fontSize: '12.5px', color: '#1C1C1C', lineHeight: 1.6 }}>If this reaction feels serious, stop eating {activeReintro.food.toLowerCase()} now. You can end this cycle from the Reintro tab — it will be marked Avoid with your evidence. If symptoms are severe or worsening, contact a medical professional.</div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {onProtocol && (
          <div style={s.block}>
            <div style={s.label}>Did you stay on your plan today?</div>
            <div style={s.yn}>
              <button style={followed === true ? s.ynYes : s.ynBtn} onClick={() => setFollowed(true)}>Yes</button>
              <button style={followed === false ? s.ynNo : s.ynBtn} onClick={() => setFollowed(false)}>No</button>
            </div>
          </div>
        )}

        <div style={s.block}>
          <div style={s.label}>How many hours did you sleep last night? <span style={{ color: '#A0A096', fontWeight: 400, fontSize: '13px' }}>(7.5 counts)</span></div>
          <button type="button" onClick={() => setOpenPad(openPad === 'sleep' ? null : 'sleep')} style={{ width: '100%', textAlign: 'left', background: '#FAF8F4', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, padding: '13px 15px', fontSize: 15, fontFamily: 'DM Sans, sans-serif', color: sleep === '' ? '#B8B6AE' : '#1C1C1C', cursor: 'pointer' }}>
            {sleep === '' ? 'Tap to enter' : `${sleep} hours`}
          </button>
          {openPad === 'sleep' && (
            <div style={{ marginTop: 10 }}>
              <NumPad value={sleep} onChange={setSleep} decimals maxDigits={2} unit="hours" onSubmit={() => setOpenPad(null)} />
            </div>
          )}
        </div>

        <div style={s.block}>
          <div style={s.label}>How's your stress today?</div>
          <Bands options={STRESS_BANDS} value={stress} onPick={setStress} />
        </div>

        <div style={s.block}>
          <div style={s.label}>How many cups of water today?</div>
          <button type="button" onClick={() => setOpenPad(openPad === 'hydration' ? null : 'hydration')} style={{ width: '100%', textAlign: 'left', background: '#FAF8F4', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, padding: '13px 15px', fontSize: 15, fontFamily: 'DM Sans, sans-serif', color: hydration === '' ? '#B8B6AE' : '#1C1C1C', cursor: 'pointer' }}>
            {hydration === '' ? 'Tap to enter' : `${hydration} cups`}
          </button>
          {openPad === 'hydration' && (
            <div style={{ marginTop: 10 }}>
              <NumPad value={hydration} onChange={setHydration} maxDigits={2} unit="cups" onSubmit={() => setOpenPad(null)} />
            </div>
          )}
        </div>

        {isWoman && (
          <div style={s.block}>
            <div style={s.label}>Where are you in your cycle?</div>
            <Bands options={CYCLE_PHASES} value={cyclePhase} onPick={setCyclePhase} />
          </div>
        )}

        {isDrinker && (
          <div style={s.block}>
            <div style={s.label}>How many drinks today?</div>
            <button type="button" onClick={() => setOpenPad(openPad === 'drinks' ? null : 'drinks')} style={{ width: '100%', textAlign: 'left', background: '#FAF8F4', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, padding: '13px 15px', fontSize: 15, fontFamily: 'DM Sans, sans-serif', color: drinks === '' ? '#B8B6AE' : '#1C1C1C', cursor: 'pointer' }}>
              {drinks === '' ? 'Tap to enter' : `${drinks} ${drinks === '1' ? 'drink' : 'drinks'}`}
            </button>
            {openPad === 'drinks' && (
              <div style={{ marginTop: 10 }}>
                <NumPad value={drinks} onChange={setDrinks} maxDigits={2} unit="drinks" onSubmit={() => setOpenPad(null)} />
              </div>
            )}
          </div>
        )}
      </div>
      <div style={s.footer}>
        <button style={complete ? s.cta : s.ctaOff} disabled={!complete || saving} onClick={submit}>
          {saving ? 'Saving...' : 'Done for today →'}
        </button>
      </div>
    </div>
  )
}
