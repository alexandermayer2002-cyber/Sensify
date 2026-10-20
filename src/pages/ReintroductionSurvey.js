import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { computeProvisionalVerdict, applyAiAdjustment } from '../utils/verdictEngine'
import { generateReintroVerdict } from '../utils/aiInsights'

const s = {
  wrap: { minHeight: '100vh', background: 'transparent', display: 'flex', flexDirection: 'column' },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: 'var(--paper)', boxShadow: 'var(--shadow-1)' },
  logo: { fontFamily: 'var(--font-display)', fontSize: '19px', fontWeight: 500, color: 'var(--ink)' },
  logoEm: { color: '#3D5C3C', fontStyle: 'italic' },
  back: { fontSize: '13px', color: 'var(--gray)', cursor: 'pointer', background: 'none', border: 'none' },
  day14Badge: { fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--forest-500)', background: 'var(--forest-100)', padding: '6px 12px', borderRadius: '999px' },
  content: { flex: 1, padding: '28px 24px 100px', maxWidth: '620px', margin: '0 auto', width: '100%', boxSizing: 'border-box' },
  foodName: { fontFamily: 'var(--font-display)', fontSize: '38px', fontWeight: 300, color: '#3D5C3C', fontStyle: 'italic', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '4px' },
  title: { fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 300, letterSpacing: '-0.3px', marginBottom: '8px' },
  hint: { fontSize: '13px', color: 'var(--gray)', marginBottom: '28px', lineHeight: 1.65 },
  contextCard: { background: 'var(--paper)', border: 'none', borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-1)', padding: '16px', marginBottom: '24px' },
  contextRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', fontSize: '13px' },
  contextRowLast: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', fontSize: '13px' },
  contextLabel: { color: 'var(--gray)' },
  contextValue: { fontWeight: 500 },
  sectionLabel: { fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.17em', color: 'var(--forest-500)', marginBottom: '14px' },
  questionBlock: { marginBottom: '28px' },
  questionSub: { fontSize: '12.5px', color: 'var(--gray)', lineHeight: 1.55, marginTop: '-4px', marginBottom: '12px' },
  summaryCard: { position: 'relative', overflow: 'hidden', color: '#FAF8F4', borderRadius: 'var(--r-lg)', padding: '24px 22px', marginBottom: '28px', background: 'radial-gradient(120% 90% at 85% 0%, rgba(139,174,138,0.32), transparent 55%), linear-gradient(160deg, var(--forest-700) 0%, var(--forest-900) 70%)', boxShadow: 'var(--shadow-3)' },
  summaryText: { position: 'relative', fontSize: '14.5px', color: 'rgba(250,248,244,0.92)', lineHeight: 1.7 },
  stackBtns: { display: 'flex', flexDirection: 'column', gap: '8px' },
  stackBtn: { textAlign: 'left', padding: '14px 16px', borderRadius: 'var(--r-md)', border: 'none', background: 'var(--tint-warm)', fontSize: '13.5px', cursor: 'pointer', fontWeight: 600, color: 'var(--ink)', transition: 'all 0.12s' },
  stackBtnOn: { textAlign: 'left', padding: '14px 16px', borderRadius: 'var(--r-md)', border: 'none', background: 'var(--forest-500)', fontSize: '13.5px', cursor: 'pointer', fontWeight: 600, color: '#FFFFFF', boxShadow: 'var(--shadow-pill)' },
  textarea: { width: '100%', boxSizing: 'border-box', padding: '14px', borderRadius: 'var(--r-md)', border: 'none', background: 'var(--tint-warm)', fontSize: '16px', color: 'var(--ink)', resize: 'vertical', lineHeight: 1.5, outline: 'none' },
  questionLabel: { fontSize: '14px', fontWeight: 600, marginBottom: '10px', lineHeight: 1.5 },
  scaleLabels: { display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--gray)', marginBottom: '7px' },
  scaleRow: { display: 'flex', gap: '5px' },
  sbt: { flex: 1, height: '40px', borderRadius: 'var(--r-sm)', border: 'none', background: 'var(--paper)', boxShadow: 'var(--shadow-1)', fontSize: '13px', cursor: 'pointer', fontWeight: 500, color: 'var(--ink)' },
  sbtOn: { flex: 1, height: '40px', borderRadius: 'var(--r-sm)', border: 'none', background: 'var(--forest-500)', boxShadow: 'var(--shadow-pill)', fontSize: '13px', cursor: 'pointer', fontWeight: 600, color: 'white' },
  divider: { height: '1px', background: 'rgba(0,0,0,0.06)', margin: '24px 0' },
  triggerBtns: { display: 'flex', gap: '8px' },
  triggerBtn: { flex: 1, padding: '13px', borderRadius: 'var(--r-sm)', border: 'none', background: 'var(--paper)', boxShadow: 'var(--shadow-1)', fontSize: '13px', cursor: 'pointer', fontWeight: 500, color: 'var(--ink)', textAlign: 'center', transition: 'all 0.12s' },
  triggerBtnOn: { flex: 1, padding: '13px', borderRadius: 'var(--r-sm)', border: 'none', background: 'var(--forest-500)', boxShadow: 'var(--shadow-pill)', fontSize: '13px', cursor: 'pointer', fontWeight: 600, color: 'white', textAlign: 'center' },
  footer: { position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 24px', background: 'rgba(251,248,242,0.92)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', boxShadow: '0 -12px 30px rgba(56,62,48,0.08)' },
  cta: { background: 'var(--forest-500)', color: 'white', border: 'none', borderRadius: 'var(--r-md)', padding: '14px', width: '100%', maxWidth: '572px', margin: '0 auto', display: 'block', fontSize: '14px', fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--shadow-pill)' },
  verdictWrap: { flex: 1, padding: '28px 24px', display: 'flex', flexDirection: 'column', maxWidth: '620px', margin: '0 auto', width: '100%', boxSizing: 'border-box' },
  verdictBox: { borderRadius: 'var(--r-lg)', padding: '28px 24px', textAlign: 'center', marginBottom: '16px' },
  verdictEmoji: { display: 'flex', justifyContent: 'center', marginBottom: '12px' },
  verdictTitle: { fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 400, marginBottom: '6px' },
  verdictSub: { fontSize: '13px', opacity: 0.8, lineHeight: 1.6 },
  analysisCard: { background: 'linear-gradient(135deg, rgba(139,174,138,0.13), rgba(139,174,138,0.04)), #FFFFFF', border: 'none', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-2)', padding: '18px 20px', marginBottom: '12px' },
  analysisTag: { fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--forest-500)', background: 'var(--forest-100)', padding: '4px 10px', borderRadius: '999px', display: 'inline-block', marginBottom: '8px' },
  analysisText: { fontSize: '13px', color: 'var(--ink)', lineHeight: 1.65 },
  spinner: { width: '32px', height: '32px', border: '3px solid #EDF3ED', borderTopColor: '#3D5C3C', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '40px auto 16px' },
  processingText: { textAlign: 'center', fontSize: '14px', color: 'var(--gray)', fontFamily: 'var(--font-display)' },
}

const VERDICT_CONFIG = {
  Safe: {
    bg: '#EAF4EE',
    border: 'rgba(44,157,138,0.4)',
    glow: '0 0 24px rgba(44,157,138,0.18)',
    color: '#4A8C6A',
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4A8C6A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    title: 'You tolerated {food} well.',
    sub: 'No meaningful symptom correlation detected. {food} has been added to your Safe list.',
  },
  Limit: {
    bg: '#FDF2EA',
    border: 'rgba(232,148,31,0.4)',
    glow: '0 0 24px rgba(232,148,31,0.16)',
    color: '#D4894A',
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D4894A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
    title: 'Be mindful with {food}.',
    sub: 'Mild or dose-dependent symptoms detected. {food} has been added to your Limit list.',
  },
  Avoid: {
    bg: '#FAEAEA',
    border: 'rgba(214,69,69,0.4)',
    glow: '0 0 24px rgba(214,69,69,0.15)',
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
  const symptomNames = [...new Set(exposureSymptomDays.flatMap(l => (l.symptoms || []).map(s => typeof s === 'string' ? s : s?.name).filter(Boolean)))]
  const symptomPhrase = symptomNames.length === 0 ? '' :
    symptomNames.length === 1 ? symptomNames[0].toLowerCase() :
    symptomNames.slice(0, -1).map(s => s.toLowerCase()).join(', ') + ' and ' + symptomNames[symptomNames.length - 1].toLowerCase()

  let part1
  if (exposure.length === 0) {
    part1 = `You logged this ${f} cycle, though no exposure days were recorded.`
  } else if (exposureSymptomDays.length === 0) {
    part1 = `You ate ${f} on ${exposure.length} day${exposure.length !== 1 ? 's' : ''} and noted no symptoms on any of them.`
  } else {
    part1 = `You ate ${f} on ${exposure.length} day${exposure.length !== 1 ? 's' : ''}. On ${exposureSymptomDays.length} of those ${exposure.length !== 1 ? 'days' : 'day'} you noted ${symptomPhrase || 'symptoms'}.`
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
  // Disagreement follow-up: only shown when the testimony disputes the logs.
  // Three neutral questions so the one-step shift is earned from specifics,
  // not from a single checkbox. feltWhat is optional; when and cause are not.
  const [feltWhat, setFeltWhat] = useState([])
  const [feltWhatText, setFeltWhatText] = useState('')
  const [feltWhen, setFeltWhen] = useState(null) // 'exposure' | 'washout' | 'whole'
  const [feltCause, setFeltCause] = useState(null) // 'food' | 'unsure' | 'other'
  const [context, setContext] = useState('')
  const [dailyLogs, setDailyLogs] = useState([])
  const [logsLoaded, setLogsLoaded] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [verdict, setVerdict] = useState(null)
  const [wasConflicted, setWasConflicted] = useState(false)
  const [noiseFloor, setNoiseFloor] = useState(null)
  const [sleepOverlap, setSleepOverlap] = useState(null)
  const [analysis, setAnalysis] = useState('')

  // Load the cycle's daily logs so we can summarize them back to the user
  useEffect(() => {
    let active = true
    const load = async () => {
      if (!activeReintroId) { setLogsLoaded(true); return }
      try {
        const { data } = await supabase.from('reintro_daily_logs').select('*').eq('reintro_id', activeReintroId).order('log_date', { ascending: true })

        // ---- Day-grain intelligence (surface + prompt context; never decides) ----
        try {
          // Noise floor: elimination-era symptom events per week (clean baseline rumble)
          const { data: cyc } = await supabase.from('reintroduction_results').select('started_at').eq('id', activeReintroId).single()
          if (cyc?.started_at) {
            const cycStart = String(cyc.started_at).split('T')[0]
            const { data: elimEvents } = await supabase.from('symptom_logs').select('symptom, severity, logged_at').eq('user_id', session.user.id).lt('logged_at', cycStart)
            if (elimEvents && elimEvents.length >= 0) {
              const dayset = new Set(elimEvents.map(e => String(e.logged_at).split('T')[0]))
              const span = elimEvents.length ? Math.max(7, (new Date() - new Date([...dayset].sort()[0])) / 86400000) : 56
              const perWeek = dayset.size ? (dayset.size / (span / 7)) : 0
              setNoiseFloor({ daysPerWeek: Math.round(perWeek * 10) / 10, totalDays: dayset.size })
            }
            // Sleep cross-ref: symptom days vs worst-sleep nights inside the cycle
            const symDays = (data || []).filter(l => (l.symptoms || []).length > 0).map(l => l.log_date)
            if (symDays.length >= 2) {
              const { data: dfs } = await supabase.from('daily_factors').select('log_date, sleep').eq('user_id', session.user.id).gte('log_date', cycStart)
              const SLEEP_RANK = { under6: 1, '6-7': 2, '7-8': 3, '8plus': 4 }
              const ranked = (dfs || []).filter(d => d.sleep).sort((a, b) => SLEEP_RANK[a.sleep] - SLEEP_RANK[b.sleep])
              const worst = new Set(ranked.slice(0, Math.max(2, symDays.length)).map(d => d.log_date))
              const overlap = symDays.filter(d => worst.has(d)).length
              if (overlap >= 2) setSleepOverlap({ overlap, symDays: symDays.length })
            }
          }
        } catch (e) { /* intelligence never blocks the survey */ }
        if (active) { setDailyLogs(data || []); setLogsLoaded(true) }
      } catch (e) { if (active) setLogsLoaded(true) }
    }
    load()
    return () => { active = false }
  }, [activeReintroId])

  const disagreeing = accuracy === 'worse' || accuracy === 'milder'
  const allAnswered = () => accuracy !== null && (!disagreeing || (feltWhen !== null && feltCause !== null))

  const handleSubmit = async () => {
    setSubmitting(true)

    // Compute provisional verdict from logged data
    let provisional = null
    if (dailyLogs.length > 0) provisional = computeProvisionalVerdict(dailyLogs)
    let computedVerdict = provisional ? provisional.verdict : 'Limit'

    // The follow-up detail rides with the testimony. A verdict is CONFLICTED
    // when the testimony disputes the logs and the user did not discount it
    // themselves ("probably something else"): ruled on conflicting evidence,
    // which is what unlocks the retest offer.
    const followup = disagreeing ? {
      felt: feltWhat,
      feltText: feltWhatText.trim() || null,
      when: feltWhen,
      cause: feltCause,
    } : null
    const conflicted = disagreeing && feltCause !== 'other'

    // Existing cycle answers (exposure doses live here mid-cycle): read once,
    // feed the ruling, and merge on write so nothing is clobbered.
    let existing = {}
    if (activeReintroId) {
      try {
        const { data: cyc2 } = await supabase.from('reintroduction_results').select('answers').eq('id', activeReintroId).single()
        existing = cyc2?.answers || {}
      } catch (e) {}
    }

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
        disagreeDetail: followup,
        doses: existing.doses || null,
        dayGrainContext: [
          noiseFloor ? `Clean-baseline noise floor: during elimination this person logged symptoms on about ${noiseFloor.daysPerWeek} day(s) per week (${noiseFloor.totalDays} symptom days total). Weigh exposure symptoms against that background, and say so if the exposure pattern clearly exceeds it.` : null,
          sleepOverlap ? `Sleep cross-reference: ${sleepOverlap.overlap} of their ${sleepOverlap.symDays} symptom days in this cycle were also among their worst sleep nights. Mention this as honest context; it may inflate the signal.` : null,
        ].filter(Boolean).join('\n'),
        contextNote: context,
      })
      if (aiResult?.verdict) computedVerdict = applyAiAdjustment(
        provisional || { verdict: computedVerdict },
        aiResult.verdict
      )
      aiReason = aiResult?.analysis || ''
    } catch (e) {}

    // Update the EXISTING active row (don't insert a duplicate). MERGE into
    // answers: mid-cycle writers (exposure doses) store there too.
    if (activeReintroId) {
      await supabase.from('reintroduction_results').update({
        answers: { ...existing, accuracy, context, followup, conflicted },
        verdict: computedVerdict,
        verdict_reason: aiReason,
        submitted_at: new Date().toISOString(),
      }).eq('id', activeReintroId)
    } else {
      await supabase.from('reintroduction_results').insert({
        user_id: session.user.id, food, cycle_number: cycleNumber,
        answers: { accuracy, context, followup, conflicted },
        verdict: computedVerdict, submitted_at: new Date().toISOString(),
      })
    }
    setWasConflicted(conflicted)

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
          <div style={{ textAlign: 'center', marginBottom: 22, marginTop: 8 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 500, letterSpacing: '0.17em', color: 'var(--gray-faint)', textTransform: 'uppercase', marginBottom: 10 }}>Verdict entered · Day 14 of 14</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 400, color: 'var(--ink)', marginBottom: 2 }}>{food}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '56px', fontWeight: 300, letterSpacing: '-0.02em', color: config.color, lineHeight: 1.1, textShadow: config.glow.replace('0 0 24px', '0 0 38px') }}>{verdict}.</div>
            <div style={{ width: '38px', height: '2px', background: config.color, opacity: 0.45, margin: '14px auto 12px' }} />
            <div style={{ fontSize: '13.5px', color: '#5A5A52', lineHeight: 1.6, maxWidth: 420, margin: '0 auto' }}>{config.sub.replace(/{food}/g, food)}</div>
          </div>

          <div style={{ background: 'linear-gradient(180deg, #FDFBF6, #F8F4EA)', border: 'none', borderRadius: 'var(--r-md)', padding: '14px 16px', marginBottom: '14px', boxShadow: '0 10px 26px -8px rgba(60,50,30,0.16), 0 2px 6px rgba(60,50,30,0.05), inset 0 0 30px rgba(201,162,39,0.03)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '7px', fontWeight: 500, letterSpacing: '1.2px', color: '#9A927E', marginBottom: 8 }}>ENTERED IN YOUR VERDICTS</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: verdict === 'Safe' ? '#2C9D8A' : verdict === 'Limit' ? '#E8941F' : '#D64545', flexShrink: 0 }}></span>
                <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#1C1C1C' }}>{food}</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '7px', letterSpacing: '0.6px', color: '#8A8474' }}>{verdict === 'Safe' ? 'NO REACTION' : verdict === 'Limit' ? 'MILD, DOSE-LINKED' : 'SYMPTOMS CONFIRMED'}</span>
            </div>
          </div>

          <div style={s.analysisCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--forest-300)', boxShadow: '0 0 8px rgba(139,174,138,0.75)' }}></span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.17em', color: 'var(--forest-500)' }}>The analysis</span>
            </div>
            <div style={s.analysisText}>{analysis}</div>
          </div>

          {wasConflicted && (
            <div style={{ background: 'var(--tint-warm)', border: 'none', borderRadius: 'var(--r-md)', padding: '14px 16px', marginBottom: '12px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 500, letterSpacing: '0.17em', color: 'var(--gray)', textTransform: 'uppercase', marginBottom: 7 }}>Ruled on conflicting evidence</div>
              <div style={{ fontSize: '12.5px', color: '#5A5A52', lineHeight: 1.65 }}>Your logs and what you told us disagreed, so this verdict moved one careful step and no further. When you want a firmer answer, you can re-run this trial from your Reintro tab; the newest verdict replaces this one.</div>
            </div>
          )}

          <div style={{ padding: '14px 16px', marginBottom: '12px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 500, letterSpacing: '0.17em', color: 'var(--gray-faint)', textTransform: 'uppercase', marginBottom: 7 }}>Worth knowing</div>
            <div style={{ fontSize: '12.5px', color: '#7A7A72', lineHeight: 1.65 }}>This isn't necessarily permanent. Sensitivities can shift over time. After completing your full program, you can choose to retest any food and update its verdict.</div>
          </div>
        </div>
        <div style={s.footer}>
          <button style={allAnswered() ? s.cta : { ...s.cta, background: '#F0EEE6', color: 'rgba(32,36,31,0.35)', border: 'none', boxShadow: 'none', cursor: 'not-allowed' }} onClick={onComplete}>View your verdicts →</button>
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

      <div style={s.content} className="sn-rise">
        <div style={s.foodName}>{food}</div>
        <div style={s.title}>Your {food.toLowerCase()} results.</div>
        <div style={s.hint}>One last step before we map {food} on your Food Map. Confirm what you logged, and tell us if anything unusual happened.</div>

        {/* BLOCK 1 — Their logged data in plain sentences */}
        <div style={s.sectionLabel}>What you logged</div>
        <div style={s.summaryCard}>
          {logsLoaded ? <div style={s.summaryText}>{buildSummary(dailyLogs, food)}</div> : <div style={s.summaryText}>Loading your cycle…</div>}
        </div>

        {(noiseFloor?.totalDays > 0 || sleepOverlap) && (
          <div style={{ background: 'var(--tint-warm)', border: 'none', borderRadius: 'var(--r-md)', padding: '13px 14px', marginBottom: '14px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 500, letterSpacing: '0.17em', color: 'var(--gray-faint)', textTransform: 'uppercase', marginBottom: 6 }}>Worth weighing</div>
            {noiseFloor?.totalDays > 0 && <div style={{ fontSize: '12px', color: '#5A5A52', lineHeight: 1.6 }}>During clean elimination weeks you logged symptoms about {noiseFloor.daysPerWeek} day{noiseFloor.daysPerWeek === 1 ? '' : 's'} a week. That background is part of how this cycle gets read.</div>}
            {sleepOverlap && <div style={{ fontSize: '12px', color: '#5A5A52', lineHeight: 1.6, marginTop: noiseFloor?.totalDays > 0 ? 6 : 0 }}>{sleepOverlap.overlap} of your {sleepOverlap.symDays} symptom days were also among your worst sleep nights this cycle. The analysis weighs that too.</div>}
          </div>
        )}

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

        {/* BLOCK 2.5 — Disagreement follow-up: the gap, in the user's words.
            Neutral questions only; the ruling weighs these, nothing leads. */}
        {disagreeing && (
          <div style={{ ...s.questionBlock, background: 'var(--paper)', border: 'none', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-2)', padding: '18px' }}>
            <div style={s.questionLabel}>Tell us about the gap.</div>
            <div style={s.questionSub}>Your logs and what you just said disagree. That is worth getting right, so three quick questions. The ruling weighs your answers.</div>

            <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
              {accuracy === 'worse' ? 'What did you feel that the logs missed? (optional)' : 'What do the logs overstate? (optional)'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
              {['Bloating', 'Gas', 'Stomach pain', 'Reflux', 'Headache', 'Fatigue', 'Brain fog', 'Skin'].map(sym => {
                const on = feltWhat.includes(sym)
                return (
                  <button key={sym}
                    style={{ padding: '8px 15px', borderRadius: '999px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', border: 'none', background: on ? 'var(--forest-500)' : 'var(--paper)', color: on ? '#fff' : 'var(--gray)', boxShadow: on ? 'var(--shadow-pill)' : 'var(--shadow-1)', transition: 'all 0.16s' }}
                    onClick={() => setFeltWhat(v => on ? v.filter(x => x !== sym) : [...v, sym])}>
                    {sym}
                  </button>
                )
              })}
            </div>
            <input
              style={{ ...s.textarea, padding: '10px 12px', fontSize: '14px', marginBottom: '16px' }}
              value={feltWhatText}
              onChange={e => setFeltWhatText(e.target.value)}
              placeholder="Anything else, in your own words"
            />

            <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>When was it strongest?</div>
            <div style={{ ...s.stackBtns, marginBottom: '16px' }}>
              {[
                { id: 'exposure', label: `On the days I ate ${food.toLowerCase()}` },
                { id: 'washout', label: 'In the days after' },
                { id: 'whole', label: 'The whole two weeks, evenly' },
              ].map(opt => (
                <button key={opt.id} style={feltWhen === opt.id ? s.stackBtnOn : s.stackBtn} onClick={() => setFeltWhen(opt.id)}>{opt.label}</button>
              ))}
            </div>

            <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>Do you think {food.toLowerCase()} was behind it?</div>
            <div style={s.stackBtns}>
              {[
                { id: 'food', label: `Yes, I think it was the ${food.toLowerCase()}` },
                { id: 'unsure', label: 'Not sure' },
                { id: 'other', label: 'Probably something else going on' },
              ].map(opt => (
                <button key={opt.id} style={feltCause === opt.id ? s.stackBtnOn : s.stackBtn} onClick={() => setFeltCause(opt.id)}>{opt.label}</button>
              ))}
            </div>
          </div>
        )}

        {/* BLOCK 3 — Confounders, free text, no examples */}
        <div style={s.questionBlock}>
          <div style={s.questionLabel}>Was anything else going on? (optional)</div>
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
          style={allAnswered() ? s.cta : { ...s.cta, background: '#F0EEE6', color: 'rgba(32,36,31,0.35)', border: 'none', boxShadow: 'none', cursor: 'not-allowed' }}
          disabled={!allAnswered()}
          title={!allAnswered() ? (disagreeing ? 'Answer the follow-up questions above first' : 'Answer the accuracy question above first') : undefined}
          onClick={handleSubmit}
        >
          Get my verdict →
        </button>
      </div>
    </div>
  )
}
