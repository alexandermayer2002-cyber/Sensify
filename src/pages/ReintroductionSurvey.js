import React, { useState } from 'react'
import { supabase } from '../supabase'
import { computeProvisionalVerdict, applyAiAdjustment } from '../utils/verdictEngine'
import { generateReintroVerdict } from '../utils/aiInsights'

const s = {
  wrap: { minHeight: '100vh', background: '#FAF8F4', display: 'flex', flexDirection: 'column' },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: '#FFFFFF', borderBottom: '1px solid rgba(0,0,0,0.08)' },
  logo: { fontFamily: 'Fraunces, serif', fontSize: '19px', fontWeight: 500, color: '#1C1C1C' },
  logoEm: { color: '#3D5C3C', fontStyle: 'italic' },
  back: { fontSize: '13px', color: '#7A7A72', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'DM Sans, sans-serif' },
  day14Badge: { fontSize: '11px', color: '#D4894A', background: '#FDF2EA', padding: '4px 10px', borderRadius: '20px', fontWeight: 500 },
  content: { flex: 1, padding: '28px 24px 100px' },
  foodName: { fontFamily: 'Fraunces, serif', fontSize: '32px', fontWeight: 300, color: '#3D5C3C', fontStyle: 'italic', marginBottom: '4px' },
  title: { fontFamily: 'Fraunces, serif', fontSize: '22px', fontWeight: 300, marginBottom: '8px' },
  hint: { fontSize: '13px', color: '#7A7A72', marginBottom: '28px', lineHeight: 1.65 },
  contextCard: { background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px', padding: '16px', marginBottom: '24px' },
  contextRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', fontSize: '13px' },
  contextRowLast: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', fontSize: '13px' },
  contextLabel: { color: '#7A7A72' },
  contextValue: { fontWeight: 500 },
  sectionLabel: { fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#7A7A72', marginBottom: '14px' },
  questionBlock: { marginBottom: '28px' },
  questionLabel: { fontSize: '14px', fontWeight: 500, marginBottom: '10px', lineHeight: 1.5 },
  scaleLabels: { display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#7A7A72', marginBottom: '7px' },
  scaleRow: { display: 'flex', gap: '5px' },
  sbt: { flex: 1, height: '40px', borderRadius: '7px', border: '1.5px solid rgba(0,0,0,0.08)', background: '#FFFFFF', fontSize: '13px', cursor: 'pointer', fontWeight: 500, color: '#1C1C1C', fontFamily: 'DM Sans, sans-serif' },
  sbtOn: { flex: 1, height: '40px', borderRadius: '7px', border: '1.5px solid #3D5C3C', background: '#3D5C3C', fontSize: '13px', cursor: 'pointer', fontWeight: 500, color: 'white', fontFamily: 'DM Sans, sans-serif' },
  divider: { height: '1px', background: 'rgba(0,0,0,0.06)', margin: '24px 0' },
  triggerBtns: { display: 'flex', gap: '8px' },
  triggerBtn: { flex: 1, padding: '13px', borderRadius: '10px', border: '1.5px solid rgba(0,0,0,0.08)', background: '#FFFFFF', fontSize: '13px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 500, color: '#1C1C1C', textAlign: 'center', transition: 'all 0.12s' },
  triggerBtnOn: { flex: 1, padding: '13px', borderRadius: '10px', border: '1.5px solid #3D5C3C', background: '#3D5C3C', fontSize: '13px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 500, color: 'white', textAlign: 'center' },
  triggerBtnUnsure: { flex: 1, padding: '13px', borderRadius: '10px', border: '1.5px solid rgba(0,0,0,0.08)', background: '#FAF8F4', fontSize: '13px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 500, color: '#7A7A72', textAlign: 'center', transition: 'all 0.12s' },
  footer: { position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 24px', background: '#FAF8F4', borderTop: '1px solid rgba(0,0,0,0.06)' },
  cta: { background: '#3D5C3C', color: 'white', border: 'none', borderRadius: '11px', padding: '14px', width: '100%', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  verdictWrap: { flex: 1, padding: '28px 24px', display: 'flex', flexDirection: 'column' },
  verdictBox: { borderRadius: '14px', padding: '24px', textAlign: 'center', marginBottom: '16px' },
  verdictEmoji: { fontSize: '40px', marginBottom: '12px' },
  verdictTitle: { fontFamily: 'Fraunces, serif', fontSize: '22px', fontWeight: 300, marginBottom: '6px' },
  verdictSub: { fontSize: '13px', opacity: 0.8, lineHeight: 1.6 },
  analysisCard: { background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px', padding: '16px', marginBottom: '12px' },
  analysisTag: { fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#3D5C3C', background: '#EDF3ED', padding: '3px 8px', borderRadius: '20px', display: 'inline-block', marginBottom: '8px' },
  analysisText: { fontSize: '13px', color: '#1C1C1C', lineHeight: 1.65 },
  spinner: { width: '32px', height: '32px', border: '3px solid #EDF3ED', borderTopColor: '#3D5C3C', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '40px auto 16px' },
  processingText: { textAlign: 'center', fontSize: '14px', color: '#7A7A72', fontFamily: 'Fraunces, serif', fontStyle: 'italic' },
}

const VERDICT_CONFIG = {
  Safe: {
    bg: '#EAF4EE',
    border: 'rgba(74,140,106,0.15)',
    color: '#4A8C6A',
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4A8C6A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    title: 'You tolerated {food} well.',
    sub: 'No meaningful symptom correlation detected. {food} has been added to your Safe list.',
  },
  Limit: {
    bg: '#FDF2EA',
    border: 'rgba(212,137,74,0.15)',
    color: '#D4894A',
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D4894A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
    title: 'Be mindful with {food}.',
    sub: 'Mild or dose-dependent symptoms detected. {food} has been added to your Limit list.',
  },
  Avoid: {
    bg: '#FAEAEA',
    border: 'rgba(201,91,91,0.15)',
    color: '#C95B5B',
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C95B5B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
    title: 'We recommend avoiding {food}.',
    sub: 'A clear, repeatable symptom pattern was detected. {food} has been added to your Avoid list.',
  },
}

export default function ReintroductionSurvey({ session, food = 'Eggs', cycleNumber = 1, baselineScores = {}, symptoms = [], profile = null, activeReintroId = null, onComplete, onBack }) {
  const [answers, setAnswers] = useState({})
  const [trigger, setTrigger] = useState(null)
  const [confidence, setConfidence] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [verdict, setVerdict] = useState(null)
  const [analysis, setAnalysis] = useState('')

  const setAnswer = (id, value) => setAnswers(prev => ({ ...prev, [id]: value }))

  const allAnswered = () => {
    const hasSymptomScores = Object.keys(answers).length >= 2
    return hasSymptomScores && trigger !== null && confidence !== null
  }

  const computeVerdict = (answers, trigger, confidence) => {
    // Fallback heuristic if no daily logs exist (legacy / safety net)
    const scores = Object.values(answers).filter(v => typeof v === 'number')
    const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
    if (trigger === 'No' && avgScore <= 4) return 'Safe'
    if (trigger === 'Yes' && avgScore >= 6 && confidence >= 7) return 'Avoid'
    if (trigger === 'Unsure' || avgScore >= 3) return 'Limit'
    return 'Safe'
  }

  const handleSubmit = async () => {
    setSubmitting(true)

    // Pull the logged daily data for this cycle to compute a data-driven verdict
    let provisional = null
    let dailyLogs = []
    try {
      if (activeReintroId) {
        const { data: logs } = await supabase.from('reintro_daily_logs').select('*').eq('reintro_id', activeReintroId)
        dailyLogs = logs || []
        if (dailyLogs.length > 0) provisional = computeProvisionalVerdict(dailyLogs)
      }
    } catch (e) {}

    // Provisional from data, or heuristic fallback if no logs
    let computedVerdict = provisional ? provisional.verdict : computeVerdict(answers, trigger, confidence)

    // AI refines (may adjust by one level with reason) — never against data
    let aiReason = ''
    try {
      const aiResult = await generateReintroVerdict({
        name: profile?.full_name?.split(' ')[0] || 'there',
        food,
        provisionalVerdict: computedVerdict,
        signals: provisional?.signals,
        dailyLogs,
        surveyAnswers: answers,
        triggerBelief: trigger,
        confidence,
      })
      if (aiResult?.verdict) computedVerdict = applyAiAdjustment(
        provisional || { verdict: computedVerdict },
        aiResult.verdict
      )
      aiReason = aiResult?.analysis || ''
    } catch (e) {}

    // Update the EXISTING active row (don't insert a duplicate)
    if (activeReintroId) {
      await supabase.from('reintroduction_results').update({
        answers,
        trigger_belief: trigger,
        confidence,
        verdict: computedVerdict,
        verdict_reason: aiReason,
        submitted_at: new Date().toISOString(),
      }).eq('id', activeReintroId)
    } else {
      await supabase.from('reintroduction_results').insert({
        user_id: session.user.id, food, cycle_number: cycleNumber,
        answers, trigger_belief: trigger, confidence,
        verdict: computedVerdict, submitted_at: new Date().toISOString(),
      })
    }

    // Clear the active-cycle pointer on the profile
    await supabase.from('profiles').update({
      current_reintro_food: null, current_reintro_day: null, reintro_started_at: null,
    }).eq('id', session.user.id)

    await supabase.from('food_map').upsert({
      user_id: session.user.id, food, verdict: computedVerdict,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,food' })

    setAnalysis(aiReason || `This verdict reflects your logged response to ${food} across the exposure and washout days, not your original lab sensitivity level.`)
    setVerdict(computedVerdict)
    setSubmitting(false)
  }

  if (submitting) return (
    <div style={s.wrap}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <div style={s.topBar}>
        <div style={{ width: 40 }}></div>
        <div style={s.logo}>sensi<em style={s.logoEm}>fy</em></div>
        <div style={{ width: 40 }}></div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={s.spinner}></div>
        <div style={s.processingText}>Analyzing your {food.toLowerCase()} results...</div>
      </div>
    </div>
  )

  if (verdict) {
    const config = VERDICT_CONFIG[verdict]
    return (
      <div style={s.wrap}>
        <div style={s.topBar}>
          <div style={{ width: 40 }}></div>
          <div style={s.logo}>sensi<em style={s.logoEm}>fy</em></div>
          <div style={{ width: 40 }}></div>
        </div>
        <div style={s.verdictWrap}>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: '22px', fontWeight: 300, marginBottom: '2px' }}>{food} <em style={{ fontStyle: 'italic', color: '#3D5C3C' }}>Verdict.</em></div>
          <div style={{ fontSize: '12px', color: '#7A7A72', marginBottom: '20px' }}>Based on your 14-day reintroduction cycle</div>

          <div style={{ ...s.verdictBox, background: config.bg, border: `1px solid ${config.border}` }}>
            <div style={{ width: '56px', height: '56px', background: config.bg, border: `1px solid ${config.border}`, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>{config.icon}</div>
            <div style={{ ...s.verdictTitle, color: config.color }}>{config.title.replace('{food}', food)}</div>
            <div style={{ ...s.verdictSub, color: config.color }}>{config.sub.replace(/{food}/g, food)}</div>
          </div>

          <div style={s.analysisCard}>
            <div style={s.analysisTag}>AI analysis</div>
            <div style={s.analysisText}>{analysis}</div>
          </div>

          <div style={s.analysisCard}>
            <div style={s.analysisTag}>Worth knowing</div>
            <div style={s.analysisText}>This isn't necessarily permanent. Sensitivities can shift over time. After completing your full program, you can choose to retest any food in your Avoid list.</div>
          </div>
        </div>
        <div style={s.footer}>
          <button style={s.cta} onClick={onComplete}>View updated Food Map →</button>
        </div>
      </div>
    )
  }

  return (
    <div style={s.wrap}>
      <div style={s.topBar}>
        <button style={s.back} onClick={onBack}>← Back</button>
        <div style={s.logo}>sensi<em style={s.logoEm}>fy</em></div>
        <div style={s.day14Badge}>Day 14</div>
      </div>

      <div style={s.content}>
        <div style={s.foodName}>{food}</div>
        <div style={s.title}>Reintroduction survey.</div>
        <div style={s.hint}>This is the most important survey in your program. Your answers determine whether {food} is Safe, Limit, or Avoid on your personal Food Map.</div>

        <div style={s.contextCard}>
          <div style={s.contextRow}>
            <div style={s.contextLabel}>Baseline bloating</div>
            <div style={s.contextValue}>{baselineScores.bloating || '—'}/10</div>
          </div>
          <div style={s.contextRow}>
            <div style={s.contextLabel}>Baseline energy</div>
            <div style={s.contextValue}>{baselineScores.energy || '—'}/10</div>
          </div>
          <div style={s.contextRowLast}>
            <div style={s.contextLabel}>Reintroduction cycle</div>
            <div style={s.contextValue}>#{cycleNumber}</div>
          </div>
        </div>

        <div style={s.sectionLabel}>Your symptoms during this cycle</div>

        <div style={s.questionBlock}>
          <div style={s.questionLabel}>Rate your bloating during the {food.toLowerCase()} reintroduction (days 1–3) vs normally</div>
          <div style={s.scaleLabels}><span>Much better</span><span>Much worse</span></div>
          <div style={s.scaleRow}>
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <button key={n} style={answers.bloating_change === n ? s.sbtOn : s.sbt} onClick={() => setAnswer('bloating_change', n)}>{n}</button>
            ))}
          </div>
        </div>

        <div style={s.questionBlock}>
          <div style={s.questionLabel}>Rate your energy during the {food.toLowerCase()} reintroduction vs normally</div>
          <div style={s.scaleLabels}><span>Much worse</span><span>Much better</span></div>
          <div style={s.scaleRow}>
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <button key={n} style={answers.energy_change === n ? s.sbtOn : s.sbt} onClick={() => setAnswer('energy_change', n)}>{n}</button>
            ))}
          </div>
        </div>

        {symptoms.includes('Skin issues') && (
          <div style={s.questionBlock}>
            <div style={s.questionLabel}>How was your skin during the {food.toLowerCase()} reintroduction?</div>
            <div style={s.scaleLabels}><span>Much better</span><span>Much worse</span></div>
            <div style={s.scaleRow}>
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <button key={n} style={answers.skin_change === n ? s.sbtOn : s.sbt} onClick={() => setAnswer('skin_change', n)}>{n}</button>
              ))}
            </div>
          </div>
        )}

        <div style={s.divider}></div>
        <div style={s.sectionLabel}>Your assessment</div>

        <div style={s.questionBlock}>
          <div style={s.questionLabel}>Do you believe {food.toLowerCase()} caused or worsened your symptoms?</div>
          <div style={s.triggerBtns}>
            <button style={trigger === 'Yes' ? s.triggerBtnOn : s.triggerBtn} onClick={() => setTrigger('Yes')}>Yes</button>
            <button style={trigger === 'No' ? s.triggerBtnOn : s.triggerBtn} onClick={() => setTrigger('No')}>No</button>
            <button style={trigger === 'Unsure' ? s.triggerBtnUnsure : s.triggerBtn} onClick={() => setTrigger('Unsure')}>Unsure</button>
          </div>
        </div>

        <div style={s.questionBlock}>
          <div style={s.questionLabel}>How confident are you in your assessment? (1–10)</div>
          <div style={s.scaleLabels}><span>Not sure at all</span><span>Very confident</span></div>
          <div style={s.scaleRow}>
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <button key={n} style={confidence === n ? s.sbtOn : s.sbt} onClick={() => setConfidence(n)}>{n}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={s.footer}>
        <button
          style={allAnswered() ? s.cta : { ...s.cta, opacity: 0.35, cursor: 'not-allowed' }}
          disabled={!allAnswered()}
          onClick={handleSubmit}
        >
          Get my verdict →
        </button>
      </div>
    </div>
  )
}
