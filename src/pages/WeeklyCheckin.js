import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { aiPrompt } from '../utils/aiClient'


const CONTEXT_OPTIONS = [
  'I traveled or was away from home',
  'I ate out more than usual',
  'I had a stressful week',
  'I wasn\'t feeling well this week',
  'I tried a new safe food',
  'I had a social event with limited food options',
  'My sleep was off',
  'Nothing unusual — normal week',
]

const s = {
  wrap: { minHeight: '100vh', background: '#FAF8F4', display: 'flex', flexDirection: 'column', fontFamily: 'DM Sans, sans-serif' },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: '#FFFFFF', borderBottom: '1px solid rgba(0,0,0,0.08)', position: 'sticky', top: 0, zIndex: 10 },
  logo: { fontFamily: 'Fraunces, serif', fontSize: '19px', fontWeight: 500, color: '#1C1C1C' },
  logoEm: { color: '#3D5C3C', fontStyle: 'italic' },
  back: { fontSize: '13px', color: '#7A7A72', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'DM Sans, sans-serif' },
  weekBadge: { fontSize: '11px', color: '#7A7A72', background: '#EDF3ED', padding: '4px 10px', borderRadius: '20px', fontWeight: 500 },
  content: { flex: 1, padding: '28px 24px 100px', maxWidth: '560px', margin: '0 auto', width: '100%' },
  eyebrow: { fontSize: '11px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: '#3D5C3C', marginBottom: '10px' },
  title: { fontFamily: 'Fraunces, serif', fontSize: '26px', fontWeight: 300, marginBottom: '6px', letterSpacing: '-0.3px' },
  titleEm: { fontStyle: 'italic', color: '#3D5C3C' },
  hint: { fontSize: '13px', color: '#7A7A72', marginBottom: '28px', lineHeight: 1.65 },
  sectionDivider: { display: 'flex', alignItems: 'center', gap: '12px', margin: '28px 0 20px' },
  sectionLine: { flex: 1, height: '1px', background: 'rgba(0,0,0,0.07)' },
  sectionLabel: { fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#7A7A72', whiteSpace: 'nowrap' },
  questionBlock: { marginBottom: '26px' },
  questionLabel: { fontSize: '15px', fontWeight: 500, marginBottom: '10px', lineHeight: 1.5, color: '#1C1C1C' },
  scaleLabels: { display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#7A7A72', marginBottom: '7px' },
  scaleRow: { display: 'flex', gap: '5px' },
  sbt: { flex: 1, height: '42px', borderRadius: '8px', border: '1.5px solid rgba(0,0,0,0.08)', background: '#FFFFFF', fontSize: '13px', cursor: 'pointer', fontWeight: 500, color: '#1C1C1C', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.12s' },
  sbtOn: { flex: 1, height: '42px', borderRadius: '8px', border: '1.5px solid #3D5C3C', background: '#3D5C3C', fontSize: '13px', cursor: 'pointer', fontWeight: 500, color: 'white', fontFamily: 'DM Sans, sans-serif' },
  chipRow: { display: 'flex', gap: '7px', flexWrap: 'wrap' },
  chip: { padding: '10px 14px', borderRadius: '22px', border: '1.5px solid rgba(0,0,0,0.08)', background: '#FFFFFF', fontSize: '13px', cursor: 'pointer', color: '#1C1C1C', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.12s', lineHeight: 1.3 },
  chipOn: { padding: '10px 14px', borderRadius: '22px', border: '1.5px solid #3D5C3C', background: '#3D5C3C', fontSize: '13px', cursor: 'pointer', color: 'white', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.3 },
  textarea: { width: '100%', border: '1.5px solid rgba(0,0,0,0.08)', borderRadius: '10px', padding: '12px 14px', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', color: '#1C1C1C', background: '#FFFFFF', resize: 'none', height: '80px', outline: 'none' },
  footer: { position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 24px', background: '#FAF8F4', borderTop: '1px solid rgba(0,0,0,0.06)' },
  cta: { background: '#3D5C3C', color: 'white', border: 'none', borderRadius: '11px', padding: '14px', width: '100%', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  ctaDisabled: { background: '#3D5C3C', color: 'white', border: 'none', borderRadius: '11px', padding: '14px', width: '100%', fontSize: '14px', fontWeight: 500, cursor: 'not-allowed', fontFamily: 'DM Sans, sans-serif', opacity: 0.35 },
  successCard: { background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '14px', padding: '28px 24px', textAlign: 'center', margin: '8px 0 16px' },
  successIcon: { width: '52px', height: '52px', background: '#EDF3ED', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' },
  successTitle: { fontFamily: 'Fraunces, serif', fontSize: '22px', fontWeight: 300, marginBottom: '6px' },
  successTitleEm: { fontStyle: 'italic', color: '#3D5C3C' },
  successSub: { fontSize: '13px', color: '#7A7A72', lineHeight: 1.65 },
  insightCard: { background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px', padding: '18px', marginBottom: '12px' },
  insightTag: { fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#3D5C3C', background: '#EDF3ED', padding: '3px 8px', borderRadius: '20px', display: 'inline-block', marginBottom: '10px' },
  insightText: { fontSize: '14px', color: '#1C1C1C', lineHeight: 1.75 },
  statsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' },
  statCard: { background: '#FAF8F4', borderRadius: '10px', padding: '14px', textAlign: 'center' },
  statVal: { fontFamily: 'Fraunces, serif', fontSize: '28px', fontWeight: 300, color: '#1C1C1C', lineHeight: 1 },
  statLabel: { fontSize: '11px', color: '#7A7A72', marginTop: '4px' },
  statChange: { fontSize: '11px', fontWeight: 500, marginTop: '2px' },
  loadingCard: { background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px', padding: '24px', textAlign: 'center', marginBottom: '12px' },
  spinner: { width: '28px', height: '28px', border: '2.5px solid #EDF3ED', borderTopColor: '#3D5C3C', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' },
  loadingText: { fontSize: '13px', color: '#7A7A72', fontFamily: 'Fraunces, serif', fontStyle: 'italic' },
}

// Build adaptive symptom scales based on what the user has baseline scores for
const getSymptomScales = (profile) => {
  const scales = []
  if (profile?.baseline_bloating) scales.push({ id: 'bloating', label: 'How was your bloating this week?', low: 'None at all', high: 'Severe', baseline: profile.baseline_bloating })
  if (profile?.baseline_gas) scales.push({ id: 'gas', label: 'How was your gas or cramping this week?', low: 'None at all', high: 'Severe', baseline: profile.baseline_gas })
  if (profile?.baseline_reflux) scales.push({ id: 'reflux', label: 'How was your reflux or heartburn this week?', low: 'None at all', high: 'Severe', baseline: profile.baseline_reflux })
  if (profile?.baseline_digestive) scales.push({ id: 'digestive', label: 'How was your overall digestive comfort this week?', low: 'Very uncomfortable', high: 'Very comfortable', baseline: profile.baseline_digestive })
  if (profile?.baseline_energy) scales.push({ id: 'energy', label: 'How were your energy levels this week?', low: 'Exhausted', high: 'Full energy', baseline: profile.baseline_energy })
  if (profile?.baseline_clarity) scales.push({ id: 'clarity', label: 'How was your mental clarity this week?', low: 'Very foggy', high: 'Crystal clear', baseline: profile.baseline_clarity })
  if (profile?.baseline_afternoon) scales.push({ id: 'afternoon', label: 'How were your afternoon energy levels this week?', low: 'Severe crash', high: 'Sustained energy', baseline: profile.baseline_afternoon })
  if (profile?.baseline_sleep) scales.push({ id: 'sleep', label: 'How was your sleep this week?', low: 'Very poor', high: 'Excellent', baseline: profile.baseline_sleep })
  if (profile?.baseline_wellbeing) scales.push({ id: 'wellbeing', label: 'How was your overall sense of wellbeing this week?', low: 'Very poor', high: 'Excellent', baseline: profile.baseline_wellbeing })
  // Fallback if no baselines set
  if (scales.length === 0) {
    scales.push({ id: 'bloating', label: 'How was your bloating this week?', low: 'None at all', high: 'Severe', baseline: null })
    scales.push({ id: 'energy', label: 'How were your energy levels this week?', low: 'Exhausted', high: 'Full energy', baseline: null })
  }
  return scales
}

const generateInsight = async ({ name, weekNumber, profile, answers, previousAnswers, currentFoods, phase }) => {
  const scales = getSymptomScales(profile)
  
  const symptomScores = scales
    .filter(s => answers[s.id] !== undefined)
    .map(s => {
      const baseline = s.baseline
      const current = answers[s.id]
      const change = baseline ? Math.round(((current - baseline) / baseline) * 100) : null
      return `${s.id}: ${current}/10${baseline ? ` (baseline: ${baseline}, ${change > 0 ? '+' : ''}${change}%)` : ''}`
    }).join('\n')

  const previousScores = previousAnswers
    ? scales.filter(s => previousAnswers[s.id] !== undefined).map(s => `${s.id}: ${previousAnswers[s.id]}/10`).join(', ')
    : null

  const contextItems = answers.context_changes?.filter(c => c !== 'Nothing unusual — normal week') || []
  const contextStr = contextItems.length > 0 ? contextItems.join(', ') : 'Normal week — nothing unusual'

  const prompt = `You are the AI health coach inside Sensify, a food sensitivity wellness program. Generate a personalized weekly insight.

USER CONTEXT:
- Name: ${name}
- Week ${weekNumber} of the program
- Phase: ${phase || 'elimination'}
- Symptom focus: ${profile?.symptoms?.join(', ') || 'general wellness'}
- Foods being avoided: ${currentFoods?.slice(0, 8).join(', ') || 'their elimination list'}

THIS WEEK'S SCORES vs BASELINE:
${symptomScores}

${previousScores ? `LAST WEEK'S SCORES:\n${previousScores}` : 'This is their first check-in.'}

OVERALL FEELING: ${answers.overall_feeling || 'not specified'}
WHAT CHANGED THIS WEEK: ${contextStr}
COMPLIANCE: ${answers.compliance || 'not specified'}
${answers.notes ? `USER NOTES: ${answers.notes}` : ''}

YOUR TASK:
Write a 2-4 sentence personalized weekly insight. Rules:
- Reference specific numbers and percentage changes — never be vague
- Factor in what changed this week (travel, stress, etc.) when explaining score shifts
- Match tone to week: early weeks = encouraging, mid = analytical, late = celebratory if improving
- Sound like a warm smart health coach — not a doctor, not a chatbot
- Never say "based on your data" or "according to your responses"
- Don't start with "Great job" or generic praise
- Use ${name}'s name naturally if it fits
- If compliance was poor and scores are bad, connect them honestly
- If they had a tough week (travel, stress, illness) acknowledge it and frame next week

Write only the insight. No labels, no formatting.`

  return aiPrompt(prompt, 300)
}

function ConfettiCanvas() {
  const ref = React.useRef(null)
  React.useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const colors = ['#3D5C3C', '#8BAE8A', '#D4894A', '#FAF8F4', '#EDF3ED', '#4A8C6A']
    const pieces = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      w: Math.random() * 10 + 5, h: Math.random() * 5 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360, rotSpeed: (Math.random() - 0.5) * 4,
      vx: (Math.random() - 0.5) * 2, vy: Math.random() * 3 + 2,
    }))
    let start = null
    const duration = 3500
    let raf
    const animate = (ts) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      pieces.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.rotation += p.rotSpeed
        const opacity = progress > 0.6 ? 1 - ((progress - 0.6) / 0.4) : 1
        ctx.save()
        ctx.globalAlpha = opacity
        ctx.translate(p.x + p.w / 2, p.y + p.h / 2)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx.restore()
      })
      if (progress < 1) raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [])
  return <canvas ref={ref} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 999 }} />
}

export default function WeeklyCheckin({ session, weekNumber = 1, profile, currentFoods = [], phase = 'elimination', onComplete, onBack }) {
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [generatingInsight, setGeneratingInsight] = useState(false)
  const [insight, setInsight] = useState('')
  const [previousAnswers, setPreviousAnswers] = useState(null)
  const [insightError, setInsightError] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [streakMessage, setStreakMessage] = useState('')
  const [showStreakCard, setShowStreakCard] = useState(false)

  const name = session?.user?.user_metadata?.full_name?.split(' ')[0] || 'there'
  const symptomScales = getSymptomScales(profile)

  useEffect(() => { loadPreviousCheckin() }, [])

  const loadPreviousCheckin = async () => {
    if (weekNumber <= 1) return
    const { data } = await supabase.from('weekly_checkins').select('answers').eq('user_id', session.user.id).order('submitted_at', { ascending: false }).limit(1).single()
    if (data) setPreviousAnswers(data.answers)
  }

  const setAnswer = (id, value) => setAnswers(prev => ({ ...prev, [id]: value }))

  const toggleContext = (item) => {
    const current = answers.context_changes || []
    if (item === 'Nothing unusual — normal week') {
      setAnswer('context_changes', [item])
      return
    }
    const withoutNormal = current.filter(c => c !== 'Nothing unusual — normal week')
    if (withoutNormal.includes(item)) {
      setAnswer('context_changes', withoutNormal.filter(c => c !== item))
    } else {
      setAnswer('context_changes', [...withoutNormal, item])
    }
  }

  const allRequiredAnswered = () => {
    const scalesDone = symptomScales.every(s => answers[s.id] !== undefined)
    const overallDone = answers.overall_feeling !== undefined
    const contextDone = answers.context_changes && answers.context_changes.length > 0
    const complianceDone = answers.compliance !== undefined
    return scalesDone && overallDone && contextDone && complianceDone
  }

  const handleSubmit = async () => {
    if (!allRequiredAnswered()) return
    setSubmitting(true)
    setSubmitted(true)
    setGeneratingInsight(true)

    let aiInsight = ''
    try {
      aiInsight = await generateInsight({ name, weekNumber, profile, answers, previousAnswers, currentFoods, phase })
      setInsight(aiInsight)
    } catch (e) {
      setInsightError(true)
    }
    setGeneratingInsight(false)

    await supabase.from('weekly_checkins').insert({
      user_id: session.user.id,
      week_number: weekNumber,
      answers,
      ai_insight: aiInsight,
      submitted_at: new Date().toISOString(),
    })

    await supabase.from('profiles').update({
      latest_insight: aiInsight,
      latest_insight_week: weekNumber,
      last_checkin_at: new Date().toISOString(),
      current_week: weekNumber,
    }).eq('id', session.user.id)

    // Fire confetti if compliance was good
    const goodCompliance = answers.compliance === 'Fully' || answers.compliance === 'Mostly'
    if (goodCompliance) {
      setShowConfetti(true)
      setTimeout(() => {
        setShowConfetti(false)
        // Generate streak congratulations message
        const STREAK_MSGS = {
          1: `Week one done. That's the hardest stretch — your body is already adjusting. Keep the same energy next week.`,
          2: `Two weeks of elimination. Most people don't make it this far. You're building real data now.`,
          3: `Three weeks in. This is where the signal starts getting clearer. Whatever you're noticing this week — that's real.`,
          4: `One month of compliance. That's rare. The data you're building over the next four weeks will tell you everything.`,
          5: `Five weeks. You're deep into elimination now. The patterns are forming — your AI insights are getting more accurate every check-in.`,
          6: `Six weeks. Two more and reintroduction begins. You're closer to your Food Map than you've ever been.`,
          7: `Seven weeks clean. Almost there. The last stretch of elimination is the most important — stay sharp.`,
          8: `Eight weeks done. Elimination complete. Everything you've built over the last two months is about to pay off.`,
        }
        const msg = STREAK_MSGS[weekNumber] || `Week ${weekNumber} done. Keep going — every check-in makes your Food Map more accurate.`
        setStreakMessage(msg)
        setShowStreakCard(true)
      }, 3500)
    }

    setSubmitting(false)
  }

  // SUCCESS SCREEN
  if (submitted) {
    const firstScale = symptomScales[0]
    const secondScale = symptomScales[1]
    return (
      <div style={s.wrap}>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } } @keyframes slideUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }`}</style>
        <div style={s.topBar}>
          <div style={{ width: 40 }} />
          <div style={s.logo}>sensi<em style={s.logoEm}>fy</em></div>
          <div style={s.weekBadge}>Week {weekNumber}</div>
        </div>
        <div style={s.content}>

          {/* Streak celebration card — appears after confetti */}
          {showStreakCard && (
            <div style={{ background: '#1C1C1C', borderRadius: '14px', padding: '22px 20px', marginBottom: '16px', animation: 'slideUp 0.4s ease', position: 'relative' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(255,255,255,0.35)', marginBottom: '8px' }}>Week {weekNumber} complete</div>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.75, margin: 0 }}>{streakMessage}</p>
              <button onClick={() => setShowStreakCard(false)} style={{ position: 'absolute', top: '14px', right: '14px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>×</button>
            </div>
          )}

          <div style={s.successCard}>
            <div style={s.successIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3D5C3C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div style={s.successTitle}>Week {weekNumber} check-in <em style={s.successTitleEm}>complete.</em></div>
            <div style={s.successSub}>Your scores are saved. Your AI insight is below.</div>
          </div>

          {firstScale && secondScale && (
            <div style={s.statsRow}>
              {[firstScale, secondScale].map(scale => {
                const current = answers[scale.id]
                const baseline = scale.baseline
                const change = baseline && current !== undefined ? Math.round(((current - baseline) / baseline) * 100) : null
                const isGoodMetric = ['energy', 'clarity', 'afternoon', 'sleep', 'wellbeing', 'digestive'].includes(scale.id)
                const improved = isGoodMetric ? change > 0 : change < 0
                return (
                  <div key={scale.id} style={s.statCard}>
                    <div style={s.statVal}>{current ?? '—'}</div>
                    <div style={s.statLabel}>{scale.id.charAt(0).toUpperCase() + scale.id.slice(1)}</div>
                    {change !== null && (
                      <div style={{ ...s.statChange, color: improved ? '#4A8C6A' : '#C95B5B' }}>
                        {change > 0 ? '+' : ''}{change}% from baseline
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {generatingInsight ? (
            <div style={s.loadingCard}>
              <div style={s.spinner} />
              <div style={s.loadingText}>Generating your insight...</div>
            </div>
          ) : insight ? (
            <div style={s.insightCard}>
              <div style={s.insightTag}>Your week {weekNumber} insight</div>
              <div style={s.insightText}>{insight}</div>
            </div>
          ) : insightError ? (
            <div style={s.insightCard}>
              <div style={s.insightTag}>Your week {weekNumber} insight</div>
              <div style={s.insightText}>Your scores have been saved. Your insight will appear on your dashboard shortly.</div>
            </div>
          ) : null}

          <button style={{ ...s.cta, marginTop: '8px' }} onClick={onComplete}>Back to dashboard →</button>
        </div>
        {showConfetti && <ConfettiCanvas />}
      </div>
    )
  }

  return (
    <div style={s.wrap}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <div style={s.topBar}>
        <button style={s.back} onClick={onBack}>← Back</button>
        <div style={s.logo}>sensi<em style={s.logoEm}>fy</em></div>
        <div style={s.weekBadge}>Week {weekNumber}</div>
      </div>
      <div style={s.content}>
        <div style={s.eyebrow}>Week {weekNumber} check-in</div>
        <div style={s.title}>How was your<br /><em style={s.titleEm}>week?</em></div>
        <div style={s.hint}>Honest answers only — good or bad. This is how we track what's actually working.</div>

        {/* ADAPTIVE SYMPTOM SCALES */}
        <div style={s.sectionDivider}>
          <div style={s.sectionLine} />
          <div style={s.sectionLabel}>Your symptoms</div>
          <div style={s.sectionLine} />
        </div>

        {symptomScales.map(scale => (
          <div key={scale.id} style={s.questionBlock}>
            <div style={s.questionLabel}>{scale.label}</div>
            {scale.baseline && (
              <div style={{ fontSize: '11px', color: '#7A7A72', marginBottom: '8px' }}>Your baseline: {scale.baseline}/10</div>
            )}
            <div style={s.scaleLabels}><span>{scale.low}</span><span>{scale.high}</span></div>
            <div style={s.scaleRow}>
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <button key={n} style={answers[scale.id] === n ? s.sbtOn : s.sbt} onClick={() => setAnswer(scale.id, n)}>{n}</button>
              ))}
            </div>
          </div>
        ))}

        {/* OVERALL FEELING */}
        <div style={s.sectionDivider}>
          <div style={s.sectionLine} />
          <div style={s.sectionLabel}>Overall</div>
          <div style={s.sectionLine} />
        </div>

        <div style={s.questionBlock}>
          <div style={s.questionLabel}>How do you feel overall compared to last week?</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {['Better', 'About the same', 'Worse'].map(opt => (
              <button key={opt} style={answers.overall_feeling === opt ? { padding: '13px 16px', borderRadius: '11px', border: '1.5px solid #3D5C3C', background: '#EDF3ED', fontSize: '14px', cursor: 'pointer', color: '#3D5C3C', fontFamily: 'DM Sans, sans-serif', textAlign: 'left', fontWeight: 500 } : { padding: '13px 16px', borderRadius: '11px', border: '1.5px solid rgba(0,0,0,0.08)', background: '#FFFFFF', fontSize: '14px', cursor: 'pointer', color: '#1C1C1C', fontFamily: 'DM Sans, sans-serif', textAlign: 'left' }} onClick={() => setAnswer('overall_feeling', opt)}>{opt}</button>
            ))}
          </div>
        </div>

        {/* WHAT CHANGED */}
        <div style={s.questionBlock}>
          <div style={s.questionLabel}>What changed this week? <span style={{ fontSize: '12px', color: '#7A7A72', fontWeight: 400 }}>(select all that apply)</span></div>
          <div style={s.chipRow}>
            {CONTEXT_OPTIONS.map(opt => (
              <button
                key={opt}
                style={(answers.context_changes || []).includes(opt) ? s.chipOn : s.chip}
                onClick={() => toggleContext(opt)}
              >{opt}</button>
            ))}
          </div>
        </div>

        {/* COMPLIANCE */}
        <div style={s.sectionDivider}>
          <div style={s.sectionLine} />
          <div style={s.sectionLabel}>Compliance</div>
          <div style={s.sectionLine} />
        </div>

        <div style={s.questionBlock}>
          <div style={s.questionLabel}>How closely did you follow the elimination plan this week?</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {['Fully', 'Mostly', 'Some slip-ups', 'Not at all'].map(opt => (
              <button key={opt} style={answers.compliance === opt ? { padding: '13px 16px', borderRadius: '11px', border: '1.5px solid #3D5C3C', background: '#EDF3ED', fontSize: '14px', cursor: 'pointer', color: '#3D5C3C', fontFamily: 'DM Sans, sans-serif', textAlign: 'left', fontWeight: 500 } : { padding: '13px 16px', borderRadius: '11px', border: '1.5px solid rgba(0,0,0,0.08)', background: '#FFFFFF', fontSize: '14px', cursor: 'pointer', color: '#1C1C1C', fontFamily: 'DM Sans, sans-serif', textAlign: 'left' }} onClick={() => setAnswer('compliance', opt)}>{opt}</button>
            ))}
          </div>
        </div>

        {/* NOTES */}
        <div style={s.questionBlock}>
          <div style={s.questionLabel}>Anything else worth noting? <span style={{ fontSize: '12px', color: '#7A7A72', fontWeight: 400 }}>(optional)</span></div>
          <textarea
            style={s.textarea}
            placeholder="Anything unusual, a reaction you noticed, something you want your AI insight to factor in..."
            value={answers.notes || ''}
            onChange={e => setAnswer('notes', e.target.value)}
          />
        </div>
      </div>

      <div style={s.footer}>
        <button
          style={allRequiredAnswered() ? s.cta : s.ctaDisabled}
          disabled={!allRequiredAnswered() || submitting}
          onClick={handleSubmit}
        >
          {submitting ? 'Saving...' : 'Submit check-in →'}
        </button>
      </div>
    </div>
  )
}
