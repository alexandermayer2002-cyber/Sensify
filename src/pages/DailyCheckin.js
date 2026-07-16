import React, { useState } from 'react'
import { supabase } from '../supabase'
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
  wrap: { minHeight: '100vh', background: '#FAF8F4', fontFamily: 'DM Sans, sans-serif', display: 'flex', flexDirection: 'column' },
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
  const [sleep, setSleep] = useState(null)
  const [stress, setStress] = useState(null)
  const [hydration, setHydration] = useState(null)
  const [cyclePhase, setCyclePhase] = useState(null)
  const [drinks, setDrinks] = useState(0)
  const [saving, setSaving] = useState(false)
  const [reward, setReward] = useState(null)  // { streak, weekDays, reflection } after completion

  const isWoman = profile?.gender === 'female'
  const isDrinker = profile?.drinks_alcohol === true
  // Whether this user is on an active protocol (so compliance applies).
  const onProtocol = profile?.program_phase === 'elimination' || profile?.program_phase === 'reintroduction'

  // Core required: sleep, stress, hydration. Compliance required only if on protocol.
  const complete = sleep && stress && hydration && (!onProtocol || followed !== null)

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
      drinks: isDrinker ? drinks : null,
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
      // This week's 7 cells (last 7 days), filled or not
      const dow = ['Su','Mo','Tu','We','Th','Fr','Sa']
      const weekDays = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i))
        return { label: dow[d.getDay()], done: logged.has(localDateString(d)), isToday: i === 6 }
      })
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
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#EDF3ED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, marginBottom: 20 }}>✓</div>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 28, fontWeight: 300, color: '#1C1C1C', marginBottom: 6 }}>Checked in for today</div>
          {reward.streak > 1 && (
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color: '#3D5C3C', fontWeight: 600, marginBottom: 24, textTransform: 'uppercase', letterSpacing: '1px' }}>{reward.streak}-day streak 🔥</div>
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
          <div style={s.label}>How did you sleep last night?</div>
          <Bands options={SLEEP_BANDS} value={sleep} onPick={setSleep} />
        </div>

        <div style={s.block}>
          <div style={s.label}>How's your stress today?</div>
          <Bands options={STRESS_BANDS} value={stress} onPick={setStress} />
        </div>

        <div style={s.block}>
          <div style={s.label}>How much water today? <span style={{ color: '#A0A096', fontWeight: 400, fontSize: '13px' }}>(cups)</span></div>
          <Bands options={HYDRATION_BANDS} value={hydration} onPick={setHydration} />
        </div>

        {isWoman && (
          <div style={s.block}>
            <div style={s.label}>Where are you in your cycle?</div>
            <Bands options={CYCLE_PHASES} value={cyclePhase} onPick={setCyclePhase} />
          </div>
        )}

        {isDrinker && (
          <div style={s.block}>
            <div style={s.label}>Any drinks today?</div>
            <div style={s.stepper}>
              <button style={s.stepBtn} onClick={() => setDrinks(d => Math.max(0, d - 1))}>−</button>
              <span style={s.stepVal}>{drinks}</span>
              <button style={s.stepBtn} onClick={() => setDrinks(d => d + 1)}>+</button>
            </div>
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
