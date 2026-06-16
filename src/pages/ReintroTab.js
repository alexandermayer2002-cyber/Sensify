import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import ReintroDailyCheckin from './ReintroDailyCheckin'
import { computeProvisionalVerdict } from '../utils/verdictEngine'
import { generateReintroFoodBriefing, generateProgramCompleteMessage } from '../utils/aiInsights'

function ProgramComplete({ session, profile, labResult, completedFoods }) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const name = session?.user?.user_metadata?.full_name?.split(' ')[0] || 'there'

  useEffect(() => {
    const generate = async () => {
      try {
        const { data: checkins } = await supabase
          .from('weekly_checkins')
          .select('*')
          .eq('user_id', session.user.id)
          .order('submitted_at', { ascending: false })
          .limit(1)

        const msg = await generateProgramCompleteMessage({
          name,
          profile,
          labResult,
          foodMap: completedFoods,
          checkins: checkins || [],
        })
        setMessage(msg)
      } catch (e) {}
      setLoading(false)
    }
    generate()
  }, [])

  return (
    <div style={{ background: '#1C1C1C', borderRadius: '18px', padding: '28px 24px', marginBottom: '14px', color: 'white' }}>
      <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', opacity: 0.45, marginBottom: '10px' }}>Program complete</div>
      <div style={{ fontFamily: 'Fraunces, serif', fontSize: '24px', fontWeight: 300, marginBottom: '16px', letterSpacing: '-0.3px' }}>
        Reintroduction <em style={{ fontStyle: 'italic', color: '#8BAE8A' }}>complete.</em>
      </div>
      {loading ? (
        <div style={{ fontSize: '13px', opacity: 0.5, fontStyle: 'italic' }}>Generating your program summary...</div>
      ) : (
        <div style={{ fontSize: '14px', opacity: 0.85, lineHeight: 1.75, marginBottom: '20px' }}>{message}</div>
      )}
      <div style={{ display: 'flex', gap: '10px' }}>
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '11px 14px', flex: 1, textAlign: 'center' }}>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: '24px', fontWeight: 300, color: '#8BAE8A' }}>
            {completedFoods.filter(f => f.verdict === 'Safe').length}
          </div>
          <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.45, marginTop: '3px' }}>Safe</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '11px 14px', flex: 1, textAlign: 'center' }}>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: '24px', fontWeight: 300, color: '#D4894A' }}>
            {completedFoods.filter(f => f.verdict === 'Limit').length}
          </div>
          <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.45, marginTop: '3px' }}>Limit</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '11px 14px', flex: 1, textAlign: 'center' }}>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: '24px', fontWeight: 300, color: '#E07070' }}>
            {completedFoods.filter(f => f.verdict === 'Avoid').length}
          </div>
          <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.45, marginTop: '3px' }}>Avoid</div>
        </div>
      </div>
    </div>
  )
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Fraunces:ital,wght@0,300;0,500;1,300&display=swap');
  .rt-wrap { min-height: 100vh; background: #FAF8F4; font-family: 'DM Sans', sans-serif; color: #1C1C1C; }
  .rt-content { max-width: 680px; margin: 0 auto; padding: 24px 20px 60px; }
  .rt-header { margin-bottom: 24px; }
  .rt-title { font-family: 'Fraunces', serif; font-size: 26px; font-weight: 300; margin-bottom: 5px; letter-spacing: -0.3px; }
  .rt-title em { font-style: italic; color: #3D5C3C; }
  .rt-sub { font-size: 13px; color: #7A7A72; line-height: 1.55; }

  .rt-active-card { background: #1C1C1C; border-radius: 18px; padding: 24px; margin-bottom: 14px; color: white; }
  .rt-active-eyebrow { font-size: 10px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; opacity: 0.45; margin-bottom: 6px; }
  .rt-active-food { font-family: 'Fraunces', serif; font-size: 28px; font-weight: 300; letter-spacing: -0.5px; margin-bottom: 4px; }
  .rt-active-food em { font-style: italic; color: #8BAE8A; }
  .rt-active-sub { font-size: 13px; opacity: 0.5; margin-bottom: 20px; }
  .rt-phase-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; margin-bottom: 16px; }
  .rt-phase-badge.exposure { background: rgba(109,191,138,0.2); color: #6DBF8A; }
  .rt-phase-badge.washout { background: rgba(212,137,74,0.2); color: #D4894A; }
  .rt-timeline { display: flex; gap: 4px; margin-bottom: 16px; }
  .rt-day-dot { flex: 1; height: 8px; border-radius: 4px; }
  .rt-day-dot.past { background: rgba(255,255,255,0.5); }
  .rt-day-dot.current { background: white; }
  .rt-day-dot.exposure-future { background: rgba(109,191,138,0.25); }
  .rt-day-dot.washout-future { background: rgba(212,137,74,0.2); }
  .rt-timeline-labels { display: flex; justify-content: space-between; font-size: 10px; opacity: 0.45; margin-bottom: 16px; }
  .rt-instruction { background: rgba(255,255,255,0.07); border-radius: 11px; padding: 14px; }
  .rt-instruction-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.5; margin-bottom: 6px; }
  .rt-instruction-text { font-size: 14px; line-height: 1.65; }

  .rt-section-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; color: #7A7A72; margin-bottom: 10px; margin-top: 20px; }

  .rt-food-card { background: #FFFFFF; border: 1px solid rgba(0,0,0,0.07); border-radius: 14px; padding: 16px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; }
  .rt-food-card.recommended { border-color: #3D5C3C; }
  .rt-food-left { display: flex; align-items: center; gap: 12px; }
  .rt-food-rank { width: 28px; height: 28px; border-radius: 8px; background: #FAF8F4; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; color: #7A7A72; flex-shrink: 0; }
  .rt-food-rank.top { background: #EDF3ED; color: #3D5C3C; }
  .rt-food-name { font-size: 15px; font-weight: 500; margin-bottom: 2px; }
  .rt-food-freq { font-size: 12px; color: #7A7A72; }
  .rt-rec-badge { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #3D5C3C; background: #EDF3ED; padding: 2px 8px; border-radius: 20px; margin-left: 8px; }
  .rt-start-btn { background: #3D5C3C; color: white; border: none; border-radius: 9px; padding: 9px 18px; font-size: 13px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; white-space: nowrap; transition: opacity 0.15s; }
  .rt-start-btn:hover { opacity: 0.87; }
  .rt-start-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .rt-completed-card { background: #FFFFFF; border: 1px solid rgba(0,0,0,0.07); border-radius: 13px; padding: 14px 16px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; }
  .rt-verdict-pill { font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px; }
  .rt-verdict-pill.Safe { background: #EAF4EE; color: #2D6B42; }
  .rt-verdict-pill.Limit { background: #FDF2EA; color: #9A5F1A; }
  .rt-verdict-pill.Avoid { background: #FAEAEA; color: #8B2E2E; }

  .rt-locked-card { background: #FFFFFF; border: 1px solid rgba(0,0,0,0.07); border-radius: 14px; padding: 28px 24px; text-align: center; margin-bottom: 14px; }
  .rt-locked-icon { width: 48px; height: 48px; background: #FAF8F4; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
  .rt-locked-title { font-family: 'Fraunces', serif; font-size: 20px; font-weight: 300; margin-bottom: 6px; }
  .rt-locked-title em { font-style: italic; color: #3D5C3C; }
  .rt-locked-sub { font-size: 13px; color: #7A7A72; line-height: 1.65; max-width: 280px; margin: 0 auto 16px; }
  .rt-countdown { display: inline-flex; align-items: baseline; gap: 4px; background: #EDF3ED; padding: 8px 16px; border-radius: 20px; }
  .rt-countdown-num { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 300; color: #3D5C3C; line-height: 1; }
  .rt-countdown-label { font-size: 12px; color: #3D5C3C; font-weight: 500; }

  .rt-tier-card { background: #FFFFFF; border: 1px solid rgba(0,0,0,0.07); border-radius: 14px; overflow: hidden; margin-bottom: 14px; }
  .rt-tier-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; background: #FAF8F4; border-bottom: 1px solid rgba(0,0,0,0.06); }
  .rt-tier-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #7A7A72; }
  .rt-tier-status { font-size: 11px; color: #7A7A72; }
  .rt-tier-status.unlocked { color: #3D5C3C; font-weight: 500; }
  .rt-spinner { width: 28px; height: 28px; border: 2.5px solid #EDF3ED; border-top-color: #3D5C3C; border-radius: 50%; animation: rt-spin 0.8s linear infinite; margin: 40px auto; }
  @keyframes rt-spin { to { transform: rotate(360deg) } }
`

const FREQ_RANK = { 'daily': 1, '3-5x': 2, '1-2x': 3, 'rarely': 4, 'never': 5 }
const FREQ_LABEL = { 'daily': 'Daily', '3-5x': '3–5x per week', '1-2x': '1–2x per week', 'rarely': 'Rarely', 'never': 'Never' }

// Cycle-so-far summary. FACTUAL ONLY — never hints at the verdict
// (mid-cycle interpretation would bias the user's daily reporting and
// corrupt the data the verdict depends on). States what was logged.
function CycleSummary({ logs = [], food, exposureDaysCompleted = 0, expanded, onToggle, cycleStart }) {
  if (!logs || logs.length === 0) {
    return (
      <div style={cs.wrap}>
        <div style={cs.label}>Your cycle so far</div>
        <div style={cs.empty}>No days logged yet. Your daily check-ins will build a record here as you go.</div>
      </div>
    )
  }

  const intensityColor = { mild: '#4A8C6A', moderate: '#D4894A', severe: '#C95B5B' }
  const intensityRank = { mild: 1, moderate: 2, severe: 3 }

  const exposureLogs = logs.filter(l => l.phase === 'exposure')
  const washoutLogs = logs.filter(l => l.phase === 'washout')
  const eatenDays = exposureLogs.filter(l => l.ate_food)
  const exposureSymptomDays = eatenDays.filter(l => l.had_symptoms).length
  const washoutSymptomDays = washoutLogs.filter(l => l.had_symptoms).length

  // Neutral one-line factual read
  const parts = []
  if (eatenDays.length > 0) {
    parts.push(exposureSymptomDays === 0
      ? `No symptoms logged across ${eatenDays.length} exposure day${eatenDays.length !== 1 ? 's' : ''}`
      : `Symptoms on ${exposureSymptomDays} of ${eatenDays.length} exposure day${eatenDays.length !== 1 ? 's' : ''}`)
  }
  if (washoutLogs.length > 0) {
    parts.push(washoutSymptomDays === 0
      ? `quiet washout so far`
      : `${washoutSymptomDays} washout day${washoutSymptomDays !== 1 ? 's' : ''} with symptoms`)
  }
  if (exposureDaysCompleted < 3) {
    parts.push(`${3 - exposureDaysCompleted} exposure day${3 - exposureDaysCompleted !== 1 ? 's' : ''} remaining`)
  }
  const oneLiner = parts.join(', ') + '.'

  const dayLabel = (log) => {
    const d = new Date(log.log_date)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const renderSymptoms = (log) => {
    if (!log.ate_food && log.phase === 'exposure') return <span style={cs.skip}>Did not eat</span>
    if (!log.had_symptoms) return <span style={cs.clean}>No symptoms</span>
    const syms = Array.isArray(log.symptoms) ? [...log.symptoms].sort((a, b) => (intensityRank[b.intensity] || 0) - (intensityRank[a.intensity] || 0)) : []
    return (
      <span style={cs.symRow}>
        {syms.map((s, i) => (
          <span key={i} style={{ ...cs.symPill, color: intensityColor[s.intensity], borderColor: intensityColor[s.intensity] + '40' }}>
            {s.name} · {s.intensity}
          </span>
        ))}
      </span>
    )
  }

  return (
    <div style={cs.wrap}>
      <div style={cs.header}>
        <div style={cs.label}>Your cycle so far</div>
        <button style={cs.toggle} onClick={onToggle}>{expanded ? 'Hide log' : 'View daily log'}</button>
      </div>
      <div style={cs.oneLiner}>{oneLiner}</div>

      {expanded && (
        <div style={cs.log}>
          {exposureLogs.length > 0 && <div style={cs.phaseLabel}>Exposure</div>}
          {exposureLogs.map((l, i) => (
            <div key={`e${i}`} style={cs.logRow}>
              <span style={cs.logDate}>{dayLabel(l)}</span>
              <span style={cs.logBody}>{renderSymptoms(l)}</span>
            </div>
          ))}
          {washoutLogs.length > 0 && <div style={cs.phaseLabel}>Washout</div>}
          {washoutLogs.map((l, i) => (
            <div key={`w${i}`} style={cs.logRow}>
              <span style={cs.logDate}>{dayLabel(l)}</span>
              <span style={cs.logBody}>{renderSymptoms(l)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const cs = {
  wrap: { background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '14px', padding: '16px', marginBottom: '14px' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' },
  label: { fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#7A7A72' },
  toggle: { background: 'rgba(0,0,0,0.04)', border: 'none', borderRadius: '7px', padding: '4px 10px', fontSize: '11px', color: '#3D5C3C', fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  oneLiner: { fontSize: '13.5px', color: '#1C1C1C', lineHeight: 1.6 },
  empty: { fontSize: '13px', color: '#7A7A72', lineHeight: 1.6 },
  log: { marginTop: '14px', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '12px' },
  phaseLabel: { fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#7A7A72', margin: '8px 0 6px' },
  logRow: { display: 'flex', gap: '12px', padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,0.03)', alignItems: 'baseline' },
  logDate: { fontSize: '11px', color: '#7A7A72', fontFamily: 'DM Mono, monospace', minWidth: '46px', flexShrink: 0 },
  logBody: { fontSize: '12.5px', flex: 1 },
  clean: { color: '#4A8C6A', fontSize: '12.5px' },
  skip: { color: '#7A7A72', fontStyle: 'italic', fontSize: '12.5px' },
  symRow: { display: 'flex', gap: '5px', flexWrap: 'wrap' },
  symPill: { fontSize: '11px', padding: '2px 8px', borderRadius: '20px', border: '1px solid', textTransform: 'capitalize' },
}

export default function ReintroTab({ session, profile, labResult, currentDay, onStartVerdictSurvey }) {
  const [foodMap, setFoodMap] = useState([])
  const [activeReintro, setActiveReintro] = useState(null)
  const [dailyLogs, setDailyLogs] = useState([])
  const [logExpanded, setLogExpanded] = useState(false)
  const [showDailyCheckin, setShowDailyCheckin] = useState(false)
  const [restartNotice, setRestartNotice] = useState(false)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(null)
  const [foodBriefing, setFoodBriefing] = useState('')
  const [loadingBriefing, setLoadingBriefing] = useState(false)

  const name = session?.user?.user_metadata?.full_name?.split(' ')[0] || 'there'

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: fm } = await supabase.from('food_map').select('*').eq('user_id', session.user.id)
      if (fm) setFoodMap(fm)

      const { data: active } = await supabase
        .from('reintroduction_results')
        .select('*')
        .eq('user_id', session.user.id)
        .is('verdict', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .single()
      if (active) {
        setActiveReintro(active)
        if (active.food_briefing) {
          setFoodBriefing(active.food_briefing)
        } else {
          // Active cycle with no saved briefing (started before persistence): regenerate
          setLoadingBriefing(true)
          try {
            const nm = profile?.full_name?.split(' ')[0] || 'there'
            const msg = await generateReintroFoodBriefing({ name: nm, food: active.food, sensitivityLevel: active.sensitivity_level, profile })
            setFoodBriefing(msg)
            if (msg) await supabase.from('reintroduction_results').update({ food_briefing: msg }).eq('id', active.id)
          } catch (e) {}
          setLoadingBriefing(false)
        }
        const { data: logs } = await supabase
          .from('reintro_daily_logs')
          .select('*')
          .eq('reintro_id', active.id)
          .order('log_date', { ascending: true })
        setDailyLogs(logs || [])
      }
    } catch (e) {}
    setLoading(false)
  }

  const startReintro = async (food, level) => {
    setStarting(food)
    const today = new Date().toISOString().split('T')[0]
    const { error: insertError } = await supabase.from('reintroduction_results').insert({
      user_id: session.user.id,
      food,
      sensitivity_level: level,
      started_at: today,
    })
    const { error: profileError, data: updated } = await supabase.from('profiles').update({
      current_reintro_food: food,
      current_reintro_day: 1,
      reintro_started_at: today,
    }).eq('id', session.user.id).select()

    setStarting(null)

    if (insertError || profileError || !updated || updated.length === 0) {
      alert(`Could not start cycle: ${insertError?.message || profileError?.message || 'update blocked (check RLS policy on reintroduction_results / profiles)'}`)
      return
    }

    await loadData()

    // Generate food briefing
    setLoadingBriefing(true)
    try {
      const msg = await generateReintroFoodBriefing({ name, food, sensitivityLevel: level, profile })
      setFoodBriefing(msg)
      // Persist so it shows every time the active cycle is viewed, not just at start
      if (msg) {
        await supabase.from('reintroduction_results')
          .update({ food_briefing: msg })
          .eq('user_id', session.user.id)
          .is('verdict', null)
      }
    } catch (e) {}
    setLoadingBriefing(false)
  }

  // Handle a completed daily check-in
  const handleDailyComplete = async ({ ateFood, symptoms }) => {
    if (!activeReintro) return
    const wasExposure = (activeReintro.exposure_days_completed || 0) < 3

    if (wasExposure && ateFood) {
      const newCount = (activeReintro.exposure_days_completed || 0) + 1
      const updates = { exposure_days_completed: newCount }
      // Hitting the 3rd exposure day starts washout
      if (newCount >= 3) {
        updates.washout_started_at = new Date().toISOString().split('T')[0]
      }
      await supabase.from('reintroduction_results').update(updates).eq('id', activeReintro.id)
    }
    setShowDailyCheckin(false)
    await loadData()
  }

  // Severe reaction -> stop cycle, auto-verdict Avoid
  const handleStopCycle = async () => {
    if (!activeReintro) return
    await supabase.from('reintroduction_results')
      .update({ stopped_early: true, verdict: 'Avoid', verdict_reason: 'Cycle stopped early due to a severe reaction.' })
      .eq('id', activeReintro.id)
    await supabase.from('food_map').upsert({
      user_id: session.user.id,
      food: activeReintro.food,
      verdict: 'Avoid',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,food' })
    setShowDailyCheckin(false)
    setActiveReintro(null)
    await loadData()
  }

  // Restart cycle after exceeding the 5-day exposure cap
  const handleRestartCycle = async () => {
    if (!activeReintro) return
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('reintro_daily_logs').delete().eq('reintro_id', activeReintro.id)
    await supabase.from('reintroduction_results').update({
      started_at: today,
      exposure_days_completed: 0,
      washout_started_at: null,
      restart_count: (activeReintro.restart_count || 0) + 1,
    }).eq('id', activeReintro.id)
    setRestartNotice(false)
    await loadData()
  }

  // Get foods from lab results — filter out never/rarely eaten
  const foodFrequency = profile?.food_frequency || {}
  const completedFoods = foodMap.filter(f => f.verdict)
  const completedFoodNames = completedFoods.map(f => f.food)

  const getAllQualifyingFoods = (level) => {
    if (!labResult?.foods) return []
    return labResult.foods.filter(f => {
      if (f.level !== level) return false
      const freq = foodFrequency[f.name]
      return freq && freq !== 'never' && freq !== 'rarely'
    })
  }

  const getRemainingFoods = (level) => {
    return getAllQualifyingFoods(level)
      .filter(f => !completedFoodNames.includes(f.name))
      .filter(f => !activeReintro || activeReintro.food !== f.name)
      .sort((a, b) => (FREQ_RANK[foodFrequency[a.name]] || 99) - (FREQ_RANK[foodFrequency[b.name]] || 99))
  }

  // Tier unlocks when: day requirement met AND all previous tier qualifying foods are tested
  const allLowTested = getAllQualifyingFoods('Low').every(f => completedFoodNames.includes(f.name))
  const allModerateTested = getAllQualifyingFoods('Moderate').every(f => completedFoodNames.includes(f.name))

  const lowUnlocked = currentDay >= 57
  const moderateUnlocked = currentDay >= 113 && allLowTested
  const highUnlocked = currentDay >= 169 && allModerateTested

  const daysUntilLow = Math.max(57 - currentDay, 0)
  const daysUntilModerate = Math.max(113 - currentDay, 0)
  const daysUntilHigh = Math.max(169 - currentDay, 0)

  // Active reintro day calculation
  // ── Floating schedule ────────────────────────────────────
  // Exposure requires 3 days where the food was actually eaten.
  // Skips extend exposure. If 3 eaten days aren't reached within
  // 5 calendar days, the cycle restarts (with an explanation).
  const EXPOSURE_TARGET = 3
  const EXPOSURE_CALENDAR_CAP = 5
  const WASHOUT_LENGTH = 11

  const cycleStart = activeReintro?.started_at ? new Date(activeReintro.started_at) : null
  const today = new Date()
  const calDaysSinceStart = cycleStart
    ? Math.floor((new Date(today.getFullYear(), today.getMonth(), today.getDate()) - new Date(cycleStart.getFullYear(), cycleStart.getMonth(), cycleStart.getDate())) / (1000 * 60 * 60 * 24)) + 1
    : 1

  const exposureDaysCompleted = activeReintro?.exposure_days_completed || 0
  const inExposure = exposureDaysCompleted < EXPOSURE_TARGET
  const phase = inExposure ? 'exposure' : 'washout'

  // Restart trigger: too many calendar days without hitting exposure target
  const needsRestart = inExposure && calDaysSinceStart > EXPOSURE_CALENDAR_CAP && exposureDaysCompleted < EXPOSURE_TARGET

  // Has today already been logged?
  const todayStr = today.toISOString().split('T')[0]
  const loggedToday = dailyLogs?.some(l => l.log_date === todayStr)

  // Which exposure number they'd be logging next
  const nextExposureNumber = exposureDaysCompleted + 1

  // Days into washout + verdict readiness
  const washoutStart = activeReintro?.washout_started_at ? new Date(activeReintro.washout_started_at) : null
  const washoutDay = washoutStart
    ? Math.floor((new Date(today.getFullYear(), today.getMonth(), today.getDate()) - new Date(washoutStart.getFullYear(), washoutStart.getMonth(), washoutStart.getDate())) / (1000 * 60 * 60 * 24)) + 1
    : 0
  const isVerdictDay = !inExposure && washoutDay > WASHOUT_LENGTH

  // For the timeline display: total planned days floats with skips
  const skippedSoFar = Math.max(0, calDaysSinceStart - exposureDaysCompleted - 1)
  const totalPlannedDays = EXPOSURE_TARGET + skippedSoFar + WASHOUT_LENGTH
  const cycleDay = calDaysSinceStart
  const isExposure = phase === 'exposure'

  if (loading) return (
    <div className="rt-wrap">
      <style>{css}</style>
      <div className="rt-content"><div className="rt-spinner" /></div>
    </div>
  )

  // Daily check-in screen for the active cycle
  if (showDailyCheckin && activeReintro) {
    return (
      <ReintroDailyCheckin
        session={session}
        profile={profile}
        reintro={activeReintro}
        phase={phase}
        exposureNumber={nextExposureNumber}
        onComplete={handleDailyComplete}
        onStopCycle={handleStopCycle}
      />
    )
  }

  // Restart notice after exceeding 5-day exposure cap
  if (restartNotice && activeReintro) {
    return (
      <div className="rt-wrap">
        <style>{css}</style>
        <div className="rt-content">
          <div style={{ maxWidth: '460px', margin: '40px auto', background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '18px', padding: '28px' }}>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: '22px', fontWeight: 300, marginBottom: '12px' }}>Let's restart this <em style={{ fontStyle: 'italic', color: '#3D5C3C' }}>cycle.</em></div>
            <p style={{ fontSize: '14px', color: '#7A7A72', lineHeight: 1.7, marginBottom: '20px' }}>
              Getting three exposure days close together gives the clearest read on how {activeReintro.food} affects you. It's been more than five days without reaching three, so we'll start fresh whenever you're ready. Nothing you logged counts against you.
            </p>
            <button onClick={handleRestartCycle} style={{ width: '100%', background: '#3D5C3C', color: 'white', border: 'none', borderRadius: '11px', padding: '14px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
              Restart {activeReintro.food} cycle
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Auto-surface restart notice when needed
  if (needsRestart && !restartNotice) {
    setTimeout(() => setRestartNotice(true), 0)
  }

  // Not in reintroduction yet
  if (!lowUnlocked) return (
    <div className="rt-wrap">
      <style>{css}</style>
      <div className="rt-content">
        <div className="rt-header">
          <div className="rt-title">Reintro<em>duction.</em></div>
          <div className="rt-sub">Foods are reintroduced one at a time after your elimination phase is complete.</div>
        </div>
        <div className="rt-locked-card">
          <div className="rt-locked-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7A7A72" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          </div>
          <div className="rt-locked-title">Reintroduction <em>unlocks soon.</em></div>
          <div className="rt-locked-sub">Complete your 8-week elimination phase first. Low sensitivity foods unlock first.</div>
          <div className="rt-countdown">
            <div className="rt-countdown-num">{daysUntilLow}</div>
            <div className="rt-countdown-label">{daysUntilLow === 1 ? 'day until unlock' : 'days until unlock'}</div>
          </div>
        </div>

        {/* Preview tiers */}
        <div className="rt-section-label">Unlock schedule</div>
        {[
          { label: 'Low sensitivity foods', day: 57, days: daysUntilLow },
          { label: 'Moderate sensitivity foods', day: 113, days: daysUntilModerate },
          { label: 'High sensitivity foods', day: 169, days: daysUntilHigh },
        ].map((tier, i) => (
          <div key={i} className="rt-tier-card">
            <div className="rt-tier-header">
              <div className="rt-tier-label">{tier.label}</div>
              <div className="rt-tier-status">Day {tier.day} · {tier.days} days away</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="rt-wrap">
      <style>{css}</style>
      <div className="rt-content">
        <div className="rt-header">
          <div className="rt-title">Reintro<em>duction.</em></div>
          <div className="rt-sub">One food at a time. 14 days per cycle. Your answers build your Food Map.</div>
        </div>

        {/* ACTIVE REINTRODUCTION */}
        {activeReintro && (
          <>
            <div className="rt-active-card">
              <div className="rt-active-eyebrow">Currently testing</div>
              <div className="rt-active-food"><em>{activeReintro.food}</em></div>
              <div className="rt-active-sub">14-day reintroduction cycle · Day {cycleDay} of 14</div>

              <div className={`rt-phase-badge ${isExposure ? 'exposure' : 'washout'}`}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: isExposure ? '#6DBF8A' : '#D4894A', flexShrink: 0 }}></div>
                {isExposure ? 'Exposure phase — eat this food' : 'Washout phase — avoid this food'}
              </div>

              {/* 14-day timeline */}
              <div className="rt-timeline">
                {[...Array(14)].map((_, i) => {
                  const day = i + 1
                  const isPast = day < cycleDay
                  const isCurrent = day === cycleDay
                  const isExp = day <= 3
                  return (
                    <div key={i} className={`rt-day-dot ${isPast ? 'past' : isCurrent ? 'current' : isExp ? 'exposure-future' : 'washout-future'}`} />
                  )
                })}
              </div>
              <div className="rt-timeline-labels">
                <span>Day 1</span>
                <span>Exposure (1-3)</span>
                <span>Washout (4-14)</span>
                <span>Day 14</span>
              </div>

              <div className="rt-instruction">
                <div className="rt-instruction-label">Today's instruction</div>
                <div className="rt-instruction-text">
                  {isVerdictDay
                    ? `Your ${activeReintro.food} cycle is complete. Complete your verdict survey to get your result.`
                    : isExposure
                    ? `Eat ${activeReintro.food} today as you normally would. You're on exposure day ${nextExposureNumber} of 3. Don't change anything else about your diet.`
                    : `Avoid ${activeReintro.food} completely today. This is washout day ${washoutDay} of ${WASHOUT_LENGTH}. Continue your elimination diet as usual.`}
                </div>
                {!isVerdictDay && (
                  loggedToday ? (
                    <div style={{ marginTop: '14px', fontSize: '12px', color: '#4A8C6A', fontWeight: 500 }}>✓ Logged for today. See you tomorrow.</div>
                  ) : (
                    <button
                      onClick={() => setShowDailyCheckin(true)}
                      style={{ marginTop: '14px', background: '#3D5C3C', color: 'white', border: 'none', borderRadius: '10px', padding: '11px 20px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
                    >
                      {isExposure ? 'Log today\u2019s check-in \u2192' : 'Log washout check \u2192'}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Food briefing */}
            {loadingBriefing && (
              <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '14px', padding: '16px', marginBottom: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#7A7A72', fontStyle: 'italic' }}>Getting your personalized briefing...</div>
              </div>
            )}
            {foodBriefing && !loadingBriefing && (
              <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderLeft: '3px solid #3D5C3C', borderRadius: '0 14px 14px 0', padding: '16px', marginBottom: '14px' }}>
                <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#3D5C3C', marginBottom: '8px' }}>Your briefing</div>
                <div style={{ fontSize: '13px', color: '#1C1C1C', lineHeight: 1.75 }}>{foodBriefing}</div>
              </div>
            )}

            {/* CYCLE SO FAR — factual summary, expands to full log */}
            <CycleSummary
              logs={dailyLogs}
              food={activeReintro.food}
              exposureDaysCompleted={exposureDaysCompleted}
              expanded={logExpanded}
              onToggle={() => setLogExpanded(v => !v)}
              cycleStart={activeReintro.started_at}
            />

            {isVerdictDay && (
              <div style={{ background: '#FFFFFF', border: '1.5px solid #3D5C3C', borderRadius: '14px', padding: '18px', marginBottom: '14px' }}>
                <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#3D5C3C', background: '#EDF3ED', padding: '3px 9px', borderRadius: '20px', display: 'inline-block', marginBottom: '10px' }}>Day 14 — verdict ready</div>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 300, marginBottom: '6px' }}><em style={{ fontStyle: 'italic', color: '#3D5C3C' }}>{activeReintro.food}</em> reintroduction complete.</div>
                <div style={{ fontSize: '13px', color: '#7A7A72', marginBottom: '14px', lineHeight: 1.6 }}>Complete your survey and get your AI verdict — Safe, Limit, or Avoid.</div>
                <button style={{ background: '#3D5C3C', color: 'white', border: 'none', borderRadius: '9px', padding: '11px 20px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }} onClick={() => onStartVerdictSurvey(activeReintro.food)}>
                  Get my verdict →
                </button>
              </div>
            )}
          </>
        )}

        {/* AVAILABLE FOODS BY TIER */}
        {!activeReintro && (
          <>
            {lowUnlocked && (
              <>
                <div className="rt-section-label">
                  Low sensitivity — unlocked
                  {getRemainingFoods('Low').length === 0 && ' · none to test'}
                </div>
                {getRemainingFoods('Low').map((food, i) => (
                  <div key={food.name} className={`rt-food-card${i === 0 ? ' recommended' : ''}`}>
                    <div className="rt-food-left">
                      <div className={`rt-food-rank${i === 0 ? ' top' : ''}`}>{i + 1}</div>
                      <div>
                        <div className="rt-food-name">
                          {food.name}
                          {i === 0 && <span className="rt-rec-badge">Recommended</span>}
                        </div>
                        <div className="rt-food-freq">{FREQ_LABEL[foodFrequency[food.name]] || ''}</div>
                      </div>
                    </div>
                    <button className="rt-start-btn" disabled={!!starting} onClick={() => startReintro(food.name, food.level)}>
                      {starting === food.name ? 'Starting...' : 'Start cycle →'}
                    </button>
                  </div>
                ))}
              </>
            )}

            {moderateUnlocked && (
              <>
                <div className="rt-section-label">Moderate sensitivity — unlocked</div>
                {getRemainingFoods('Moderate').map((food, i) => (
                  <div key={food.name} className={`rt-food-card${i === 0 ? ' recommended' : ''}`}>
                    <div className="rt-food-left">
                      <div className={`rt-food-rank${i === 0 ? ' top' : ''}`}>{i + 1}</div>
                      <div>
                        <div className="rt-food-name">
                          {food.name}
                          {i === 0 && <span className="rt-rec-badge">Recommended</span>}
                        </div>
                        <div className="rt-food-freq">{FREQ_LABEL[foodFrequency[food.name]] || ''}</div>
                      </div>
                    </div>
                    <button className="rt-start-btn" disabled={!!starting} onClick={() => startReintro(food.name, food.level)}>
                      {starting === food.name ? 'Starting...' : 'Start cycle →'}
                    </button>
                  </div>
                ))}
              </>
            )}

            {!moderateUnlocked && lowUnlocked && (
              <div className="rt-tier-card" style={{ marginTop: '8px' }}>
                <div className="rt-tier-header">
                  <div className="rt-tier-label">Moderate sensitivity foods</div>
                  <div className="rt-tier-status">Unlocks in {daysUntilModerate} days</div>
                </div>
              </div>
            )}

            {highUnlocked && (
              <>
                <div className="rt-section-label">High sensitivity — unlocked</div>
                {getRemainingFoods('High').map((food, i) => (
                  <div key={food.name} className={`rt-food-card${i === 0 ? ' recommended' : ''}`}>
                    <div className="rt-food-left">
                      <div className={`rt-food-rank${i === 0 ? ' top' : ''}`}>{i + 1}</div>
                      <div>
                        <div className="rt-food-name">
                          {food.name}
                          {i === 0 && <span className="rt-rec-badge">Recommended</span>}
                        </div>
                        <div className="rt-food-freq">{FREQ_LABEL[foodFrequency[food.name]] || ''}</div>
                      </div>
                    </div>
                    <button className="rt-start-btn" disabled={!!starting} onClick={() => startReintro(food.name, food.level)}>
                      {starting === food.name ? 'Starting...' : 'Start cycle →'}
                    </button>
                  </div>
                ))}
              </>
            )}

            {!highUnlocked && moderateUnlocked && (
              <div className="rt-tier-card" style={{ marginTop: '8px' }}>
                <div className="rt-tier-header">
                  <div className="rt-tier-label">High sensitivity foods</div>
                  <div className="rt-tier-status">Unlocks in {daysUntilHigh} days</div>
                </div>
              </div>
            )}
          </>
        )}

        {/* COMPLETED FOODS */}
        {completedFoods.length > 0 && (
          <>
            <div className="rt-section-label" style={{ marginTop: '20px' }}>Completed — {completedFoods.length} food{completedFoods.length !== 1 ? 's' : ''}</div>
            {completedFoods.map((f, i) => (
              <div key={i} className="rt-completed-card">
                <div style={{ fontSize: '14px', fontWeight: 500 }}>{f.food}</div>
                <div className={`rt-verdict-pill ${f.verdict}`}>{f.verdict}</div>
              </div>
            ))}
          </>
        )}

        {/* ALL DONE */}
        {lowUnlocked && !activeReintro &&
          getRemainingFoods('Low').length === 0 &&
          getRemainingFoods('Moderate').length === 0 &&
          getRemainingFoods('High').length === 0 && (
          <ProgramComplete session={session} profile={profile} labResult={labResult} completedFoods={completedFoods} />
        )}
      </div>
    </div>
  )
}
