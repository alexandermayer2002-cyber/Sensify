import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { computeProvisionalVerdict, applyAiAdjustment } from '../utils/verdictEngine'
import { generateReintroVerdict } from '../utils/aiInsights'

const s = {
  wrap: { minHeight: '100vh', background: "linear-gradient(180deg, #F4F0E6 0%, #F8F5EE 320px, #F8F5EE 100%)", display: 'flex', flexDirection: 'column' },
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
  questionSub: { fontSize: '12.5px', color: '#7A7A72', lineHeight: 1.55, marginTop: '-4px', marginBottom: '12px' },
  summaryCard: { background: '#0E0E0C', borderRadius: '14px', padding: '20px', marginBottom: '28px' },
  summaryText: { fontSize: '14.5px', color: 'rgba(255,255,255,0.92)', lineHeight: 1.7 },
  stackBtns: { display: 'flex', flexDirection: 'column', gap: '8px' },
  stackBtn: { textAlign: 'left', padding: '14px 16px', borderRadius: '11px', border: '1.5px solid rgba(0,0,0,0.1)', background: '#FFFFFF', fontSize: '13.5px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 500, color: '#1C1C1C', transition: 'all 0.12s' },
  stackBtnOn: { textAlign: 'left', padding: '14px 16px', borderRadius: '11px', border: '1.5px solid #3D5C3C', background: '#EDF3ED', fontSize: '13.5px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 500, color: '#2D6B42' },
  textarea: { width: '100%', boxSizing: 'border-box', padding: '14px', borderRadius: '11px', border: '1.5px solid rgba(0,0,0,0.1)', background: '#FFFFFF', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', color: '#1C1C1C', resize: 'vertical', lineHeight: 1.5 },
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

// Turn the cycle's daily logs into a plain-language summary
function buildSummary(logs, food) {
  const f = food.toLowerCase()
  const exposure = logs.filter(l => l.phase === 'exposure' && l.ate_food)
  const washout = logs.filter(l => l.phase === 'washout')
  const exposureSymptomDays = exposure.filter(l => l.had_symptoms)
  const washoutSymptomDays = washout.filter(l => l.had_symptoms)

  // Collect the distinct symptoms reported during exposure
  const symptomNames = [...new Set(exposureSymptomDays.flatMap(l => (l.symptoms || []).map(s => s.name)))]
  const symptomPhrase = symptomNames.length === 0 ? '' :
    symptomNames.length === 1 ? symptomNames[0].toLowerCase() :
    symptomNames.slice(0, -1).map(s => s.toLowerCase()).join(', ') + ' and ' + symptomNames[symptomNames.length - 1].toLowerCase()

  let part1
  if (exposure.length === 0) {
    part1 = `You logged this ${f} cycle, though no exposure days were recorded.`
  } else if (exposureSymptomDays.length === 0) {
    part1 = `You ate ${f} on ${exposure.length} day${exposure.length !== 1 ? 's' : ''} and noted no symptoms on any of them.`
  } else {
    part1 = `You ate ${f} on ${exposure.length} day${exposure.length !== 1 ? 's' : ''}. On ${exposureSymptomDays.length} of those day${exposureSymptomDays.length !== 1 ? 's' : ''} you noted ${symptomPhrase || 'symptoms'}.`
  }

  let part2 = ''
  if (washout.length > 0) {
    part2 = washoutSymptomDays.length === 0
      ? ` During the ${washout.length} days after, you stayed clear.`
      : ` In the ${washout.length} days after, you noted symptoms on ${washoutSymptomDays.length} of them.`
  }

  return part1 + part2
}

export default function ReintroductionSurvey({ session, food = 'Eggs', cycleNumber = 1, baselineScores = {}, symptoms = [], profile = null, activeReintroId = null, onComplete, onBack }) {
  const [accuracy, setAccuracy] = useState(null) // 'accurate' | 'worse' | 'milder'
  const [context, setContext] = useState('')
  const [dailyLogs, setDailyLogs] = useState([])
  const [logsLoaded, setLogsLoaded] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [verdict, setVerdict] = useState(null)
  const [analysis, setAnalysis] = useState('')

  // Load the cycle's daily logs so we can summarize them back to the user
  useEffect(() => {
    let active = true
    const load = async () => {
      if (!activeReintroId) { setLogsLoaded(true); return }
      try {
        const { data } = await supabase.from('reintro_daily_logs').select('*').eq('reintro_id', activeReintroId).order('log_date', { ascending: true })
        if (active) { setDailyLogs(data || []); setLogsLoaded(true) }
      } catch (e) { if (active) setLogsLoaded(true) }
    }
    load()
    return () => { active = false }
  }, [activeReintroId])

  const allAnswered = () => accuracy !== null

  const handleSubmit = async () => {
    setSubmitting(true)

    // Compute provisional verdict from logged data
    let provisional = null
    if (dailyLogs.length > 0) provisional = computeProvisionalVerdict(dailyLogs)
    let computedVerdict = provisional ? provisional.verdict : 'Limit'

    // AI refines (may adjust by one level with reason) — never against data
    let aiReason = ''
    try {
      const aiResult = await generateReintroVerdict({
        name: profile?.full_name?.split(' ')[0] || 'there',
        food,
        provisionalVerdict: computedVerdict,
        signals: provisional?.signals,
        dailyLogs,
        surveyAnswers: { accuracy, context },
        accuracyNote: accuracy,
        contextNote: context,
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
        answers: { accuracy, context },
        verdict: computedVerdict,
        verdict_reason: aiReason,
        submitted_at: new Date().toISOString(),
      }).eq('id', activeReintroId)
    } else {
      await supabase.from('reintroduction_results').insert({
        user_id: session.user.id, food, cycle_number: cycleNumber,
        answers: { accuracy, context },
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
        <div style={s.logo}>Sensify<span style={{ color: '#3D5C3C' }}>.</span></div>
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
          <div style={s.logo}>Sensify<span style={{ color: '#3D5C3C' }}>.</span></div>
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
        <div style={s.logo}>Sensify<span style={{ color: '#3D5C3C' }}>.</span></div>
        <div style={s.day14Badge}>Day 14</div>
      </div>

      <div style={s.content}>
        <div style={s.foodName}>{food}</div>
        <div style={s.title}>Your {food.toLowerCase()} results.</div>
        <div style={s.hint}>One last step before we map {food} on your Food Map. Confirm what you logged, and tell us if anything unusual happened.</div>

        {/* BLOCK 1 — Their logged data in plain sentences */}
        <div style={s.sectionLabel}>What you logged</div>
        <div style={s.summaryCard}>
          {logsLoaded ? <div style={s.summaryText}>{buildSummary(dailyLogs, food)}</div> : <div style={s.summaryText}>Loading your cycle…</div>}
        </div>

        {/* BLOCK 2 — Confirm accuracy */}
        <div style={s.questionBlock}>
          <div style={s.questionLabel}>Does that sound right?</div>
          <div style={s.questionSub}>This is what you told us day by day. If anything looks off, let us know and we'll factor it in.</div>
          <div style={s.stackBtns}>
            {[
              { id: 'accurate', label: "Yes, that's accurate" },
              { id: 'worse', label: 'Not quite, it felt worse than that' },
              { id: 'milder', label: 'Not quite, it felt milder than that' },
            ].map(opt => (
              <button key={opt.id} style={accuracy === opt.id ? s.stackBtnOn : s.stackBtn} onClick={() => setAccuracy(opt.id)}>{opt.label}</button>
            ))}
          </div>
        </div>

        {/* BLOCK 3 — Confounders, free text, no examples */}
        <div style={s.questionBlock}>
          <div style={s.questionLabel}>Was anything else going on?</div>
          <div style={s.questionSub}>Things outside of {food.toLowerCase()} can affect how you feel. If anything notable happened these past two weeks, jot it down. If not, leave it blank.</div>
          <textarea
            style={s.textarea}
            value={context}
            onChange={e => setContext(e.target.value)}
            rows={3}
            placeholder=""
          />
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
