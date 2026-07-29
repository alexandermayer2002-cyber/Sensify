import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import ReintroDailyCheckin from './ReintroDailyCheckin'
import { computeProvisionalVerdict } from '../utils/verdictEngine'
import { todayLocal, localDateString } from '../utils/dateUtils'
import { generateReintroFoodBriefing, generateProgramCompleteMessage } from '../utils/aiInsights'

// Offered to a common-track Test-2 user who finished without a clear trigger.
// Lets them escalate to Test 8 (the full panel) or accept the result and finish.

// ============================================================
// TestedLedger — the trial record. Every completed cycle as an
// expandable row: verdict + dates collapsed, the full day-by-day
// evidence (exposures, symptoms, intensities, washout) on tap.
// This is the provenance layer: the certificate shows the verdict,
// this shows how it was earned.
// ============================================================
function TestedLedger({ cycles, protocolStartDate }) {
  const [expandedId, setExpandedId] = useState(null)
  const [logsMap, setLogsMap] = useState({})
  const [loadingId, setLoadingId] = useState(null)

  const parseL = (str) => { if (!str) return null; const [y, m, d] = String(str).split('T')[0].split('-').map(Number); return new Date(y, m - 1, d) }
  const pStart = parseL(protocolStartDate)
  const protoDay = (dateStr) => {
    const d = parseL(dateStr)
    if (!d || !pStart) return null
    return Math.floor((d - pStart) / 86400000) + 1
  }

  const toggle = async (cyc) => {
    if (expandedId === cyc.id) { setExpandedId(null); return }
    setExpandedId(cyc.id)
    if (!logsMap[cyc.id]) {
      setLoadingId(cyc.id)
      try {
        const { data } = await supabase.from('reintro_daily_logs').select('*').eq('reintro_id', cyc.id).order('log_date', { ascending: true })
        setLogsMap(prev => ({ ...prev, [cyc.id]: data || [] }))
      } catch (e) { setLogsMap(prev => ({ ...prev, [cyc.id]: [] })) }
      setLoadingId(null)
    }
  }

  const symptomText = (log) => {
    let syms = log.symptoms
    if (typeof syms === 'string') { try { syms = JSON.parse(syms) } catch (e) { syms = null } }
    if (Array.isArray(syms) && syms.length > 0) {
      return syms.map(s => (s && s.name) ? `${s.name}${s.intensity ? ` (${s.intensity})` : ''}` : String(s)).join(', ')
    }
    return log.had_symptoms ? 'Symptoms noted' : 'No symptoms'
  }

  return (
    <>
      <div className="rt-section-label" style={{ marginTop: '20px' }}>Tested — {cycles.length} food{cycles.length !== 1 ? 's' : ''}</div>
      {cycles.map((cyc) => {
        const open = expandedId === cyc.id
        const startDay = protoDay(cyc.started_at)
        const endDay = protoDay(cyc.updated_at || cyc.started_at)
        const logs = logsMap[cyc.id]
        return (
          <div key={cyc.id} style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '14px', marginBottom: '8px', overflow: 'hidden' }}>
            <button onClick={() => toggle(cyc)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', background: 'transparent', border: 'none', padding: '14px 16px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#1C1C1C' }}>{cyc.food}</div>
                {startDay && <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '8px', letterSpacing: '0.6px', color: '#9A927E' }}>DAY {startDay}{endDay && endDay !== startDay ? ` → ${endDay}` : ''}</div>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <div className={`rt-verdict-pill ${cyc.verdict}`}>{cyc.verdict}</div>
                <span style={{ fontSize: '11px', color: '#A8A69E', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>▾</span>
              </div>
            </button>
            {open && (
              <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', padding: '12px 16px 14px' }}>
                {loadingId === cyc.id && <div style={{ fontSize: '12px', color: '#A8A69E', padding: '6px 0' }}>Loading the record...</div>}
                {logs && logs.length === 0 && <div style={{ fontSize: '12px', color: '#A8A69E', padding: '6px 0' }}>No daily logs were recorded for this cycle.</div>}
                {logs && logs.length > 0 && logs.map((log, li) => (
                  <div key={li} style={{ display: 'flex', gap: '10px', padding: '7px 0', borderBottom: li < logs.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                    <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '8px', letterSpacing: '0.5px', color: '#9A927E', width: '86px', flexShrink: 0, paddingTop: '2px' }}>
                      {protoDay(log.log_date) ? `DAY ${protoDay(log.log_date)}` : ''} · {log.phase === 'exposure' ? `EXP ${log.exposure_number || ''}`.trim() : 'WASHOUT'}
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#3A3A35', lineHeight: 1.5 }}>
                      {log.phase === 'exposure' && (log.ate_food === false ? 'Skipped the food this day. ' : log.ate_food === true ? 'Ate it. ' : '')}
                      {symptomText(log)}
                    </div>
                  </div>
                ))}
                {cyc.verdict_reason && (
                  <div style={{ marginTop: '10px', padding: '10px 12px', background: '#FAF9F5', borderRadius: '10px', fontSize: '12px', color: '#5A5A52', lineHeight: 1.55 }}>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '8px', letterSpacing: '0.7px', color: '#9A927E' }}>VERDICT · </span>
                    {cyc.verdict_reason}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}

function TierEscalation({ session, profile, completedFoods, onFinish }) {
  const [saving, setSaving] = useState(false)
  const avoids = completedFoods.filter(f => f.verdict === 'Avoid').length
  const name = session?.user?.user_metadata?.full_name?.split(' ')[0] || 'there'

  const escalate = async () => {
    setSaving(true)
    // Upgrade to Tier 2, restart the protocol so the additional foods get
    // eliminated then reintroduced. Mark escalated so we don't offer it again.
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
    const { error } = await supabase.from('profiles').update({
      protocol_tier: 2,
      tier_escalated: true,
      program_phase: 'elimination',
      protocol_start_date: localDateString(tomorrow),
    }).eq('id', session.user.id)
    setSaving(false)
    if (error) { alert('Could not upgrade: ' + error.message); return }
    window.location.reload()
  }

  return (
    <div className="rt-escalation">
      <div className="rt-esc-eyebrow">You've tested your first foods</div>
      <div className="rt-esc-title">Want to go deeper, {name}?</div>
      <div className="rt-esc-body">
        {avoids === 0
          ? "You tested dairy and gluten and neither came back as a clear trigger. That's useful to know. But if you're still dealing with symptoms, the next step is to test more of the common culprits, including foods that often cause issues but rarely show up on a lab."
          : "You've finished testing dairy and gluten. If you're still dealing with symptoms beyond what you've found, you can go deeper and test more of the common triggers."}
      </div>
      <div className="rt-esc-foods">The full panel adds: eggs, soy, tree nuts, corn, onion and garlic, and legumes.</div>
      <button className="rt-esc-go" disabled={saving} onClick={escalate}>
        {saving ? 'Setting up...' : 'Test the full panel →'}
      </button>
      <button className="rt-esc-finish" disabled={saving} onClick={onFinish}>
        I'm good with my results
      </button>
    </div>
  )
}

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
  .rt-wrap { min-height: 100vh; background: transparent; font-family: 'DM Sans', sans-serif; color: #1C1C1C; }
  .rt-content { max-width: 680px; margin: 0 auto; padding: 24px 20px 60px; }
  .rt-header { margin-bottom: 24px; }
  .rt-title { font-family: 'Fraunces', serif; font-size: 26px; font-weight: 300; margin-bottom: 5px; letter-spacing: -0.3px; }
  .rt-title em { font-style: italic; color: #3D5C3C; }
  .rt-sub { font-size: 13px; color: #7A7A72; line-height: 1.55; }

  .rt-active-card { background: #22301F; border-radius: 18px; padding: 24px; margin-bottom: 14px; color: white; }
  .rt-active-eyebrow { font-size: 10px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; opacity: 0.45; margin-bottom: 6px; }
  .rt-active-food { font-family: 'Fraunces', serif; font-size: 28px; font-weight: 300; letter-spacing: -0.5px; margin-bottom: 4px; }
  .rt-active-food em { font-style: italic; color: #8BAE8A; }
  .rt-active-sub { font-size: 13px; opacity: 0.5; margin-bottom: 20px; }
  .rt-phase-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; margin-bottom: 16px; }
  .rt-phase-badge.exposure { background: rgba(109,191,138,0.2); color: #6DBF8A; }
  .rt-phase-badge.washout { background: rgba(212,137,74,0.2); color: #D4894A; }
  .rt-timeline { display: flex; gap: 4px; margin-bottom: 10px; }
  .rt-day-dot { flex: 1; height: 9px; border-radius: 4px; }
  .rt-day-dot.past-logged { background: #8BAE8A; box-shadow: 0 0 6px rgba(139,174,138,0.4); }
  .rt-day-dot.past-skipped { background: rgba(255,255,255,0.18); }
  .rt-day-dot.current { background: white; box-shadow: 0 0 8px rgba(255,255,255,0.5); }
  .rt-day-dot.past-logged.current { background: #8BAE8A; }
  .rt-day-dot.exposure-future { background: rgba(109,191,138,0.4); }
  .rt-day-dot.washout-future { background: rgba(224,169,119,0.4); }
  .rt-day-dot.exp-divider { margin-right: 8px; }
  .rt-timeline-labels { display: flex; font-size: 10px; opacity: 0.55; margin-bottom: 16px; }
  .rt-instruction { background: rgba(255,255,255,0.07); border-radius: 11px; padding: 14px; }
  .rt-instruction-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.5; margin-bottom: 6px; }
  .rt-instruction-text { font-size: 14px; line-height: 1.65; }

  .rt-section-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; color: #7A7A72; margin-bottom: 10px; margin-top: 20px; }

  .rt-food-card { background: #FFFFFF; border: 1px solid rgba(0,0,0,0.07); border-radius: 18px; padding: 17px 18px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; transition: border-color 0.15s, box-shadow 0.15s; }
  .rt-food-card:hover { border-color: rgba(61,92,60,0.3); box-shadow: 0 4px 16px rgba(34,48,31,0.07); }
  .rt-food-card.recommended { border: 1.5px solid #3D5C3C; box-shadow: 0 4px 18px rgba(61,92,60,0.1); background: linear-gradient(135deg, rgba(139,174,138,0.06), rgba(44,157,138,0.02)), #FFFFFF; }
  .rt-food-left { display: flex; align-items: center; gap: 12px; }
  .rt-food-rank { width: 30px; height: 30px; border-radius: 10px; background: #F4F2EC; display: flex; align-items: center; justify-content: center; font-family: 'Fraunces', serif; font-size: 14px; font-weight: 400; color: #7A7A72; flex-shrink: 0; }
  .rt-food-rank.top { background: #22301F; color: #8BAE8A; }
  .rt-food-name { font-size: 15px; font-weight: 500; margin-bottom: 2px; }
  .rt-food-freq { font-size: 12px; color: #7A7A72; }
  .rt-rec-badge { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #3D5C3C; background: #EDF3ED; padding: 2px 8px; border-radius: 20px; margin-left: 8px; }
  .rt-start-btn { background: #3D5C3C; color: white; border: none; border-radius: 9px; padding: 9px 18px; font-size: 13px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; white-space: nowrap; transition: opacity 0.15s; }
  .rt-start-btn:hover { opacity: 0.87; }
  .rt-start-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .rt-completed-card { background: #FFFFFF; border: 1px solid rgba(0,0,0,0.07); border-radius: 13px; padding: 14px 16px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; }
  .rt-escalation { background: #0E0E0C; border-radius: 18px; padding: 26px; margin-top: 20px; }
  .rt-esc-eyebrow { font-family: 'DM Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: rgba(139,174,138,0.8); margin-bottom: 12px; }
  .rt-esc-title { font-family: 'Fraunces', serif; font-size: 24px; font-weight: 300; color: white; margin-bottom: 14px; }
  .rt-esc-body { font-size: 14.5px; line-height: 1.65; margin-bottom: 14px; color: rgba(255,255,255,0.72); }
  .rt-esc-foods { font-size: 13px; color: rgba(255,255,255,0.5); margin-bottom: 20px; line-height: 1.5; }
  .rt-esc-go { width: 100%; padding: 14px; border-radius: 12px; border: none; background: #8BAE8A; color: #0E0E0C; font-size: 14px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; margin-bottom: 9px; }
  .rt-esc-finish { width: 100%; padding: 12px; border-radius: 12px; border: none; background: transparent; color: rgba(255,255,255,0.55); font-size: 13px; font-weight: 500; font-family: 'DM Sans', sans-serif; cursor: pointer; }
  .rt-verdict-pill { font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px; }
  .rt-verdict-pill.Safe { background: #EAF4EE; color: #2D6B42; }
  .rt-verdict-pill.Limit { background: #FDF2EA; color: #9A5F1A; }
  .rt-verdict-pill.Avoid { background: #FAEAEA; color: #8B2E2E; }

  .rt-locked-card { background: #FFFFFF; border: 1px solid rgba(0,0,0,0.07); border-radius: 14px; padding: 28px 24px; text-align: center; margin-bottom: 14px; }
  .rt-lk-hero { background: #FFFFFF; border: 0.5px solid rgba(0,0,0,0.08); border-radius: 16px; padding: 26px 24px; text-align: center; margin-bottom: 20px; }
  .rt-lk-ringwrap { position: relative; width: 110px; height: 110px; margin: 0 auto 14px; }
  .rt-lk-ringcenter { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .rt-lk-pct { font-size: 26px; font-weight: 500; color: #3D5C3C; }
  .rt-lk-daycount { font-size: 9.5px; color: #A0A096; font-family: 'DM Mono', monospace; text-transform: uppercase; letter-spacing: 0.5px; }
  .rt-lk-headline { font-family: 'Fraunces', serif; font-size: 19px; font-weight: 300; color: #1C1C1C; }
  .rt-lk-headline em { font-style: italic; color: #3D5C3C; }
  .rt-lk-purpose { font-size: 12.5px; color: #7A7A72; line-height: 1.6; max-width: 300px; margin: 8px auto 0; }
  .rt-lk-timeline { position: relative; padding-left: 22px; }
  .rt-lk-timeline::before { content: ''; position: absolute; left: 7px; top: 10px; bottom: 10px; width: 2px; background: #EFEDE6; border-radius: 1px; }
  .rt-lk-node { position: relative; margin-bottom: 10px; }
  .rt-lk-dot { position: absolute; left: -22px; top: 16px; width: 16px; height: 16px; border-radius: 50%; background: #EFEDE6; border: 3px solid #FAF8F4; }
  .rt-lk-dot.next { background: #3D5C3C; border-color: #EDF3ED; }
  .rt-lk-tiercard { background: #FCFBF8; border: 0.5px solid rgba(0,0,0,0.06); border-radius: 13px; padding: 14px 16px; opacity: 0.82; }
  .rt-lk-tiercard.next { background: #FFFFFF; border: 1px solid rgba(61,92,60,0.25); opacity: 1; }
  .rt-lk-tierhead { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; gap: 8px; }
  .rt-lk-tierlabel { font-size: 13px; font-weight: 600; color: #6A6A62; }
  .rt-lk-tiercard.next .rt-lk-tierlabel { color: #1C1C1C; }
  .rt-lk-badge { font-size: 10px; font-weight: 600; color: #3D5C3C; background: #EDF3ED; padding: 3px 8px; border-radius: 5px; text-transform: uppercase; letter-spacing: 0.4px; white-space: nowrap; }
  .rt-lk-tierwhen { font-size: 10px; color: #A0A096; font-family: 'DM Mono', monospace; white-space: nowrap; }
  .rt-lk-pills { display: flex; flex-wrap: wrap; gap: 5px; }
  .rt-lk-pill { font-size: 11.5px; color: #3A3A35; background: #FAF8F4; border: 0.5px solid rgba(0,0,0,0.06); padding: 4px 10px; border-radius: 20px; }
  .rt-lk-tiercard:not(.next) .rt-lk-pill { color: #8A8A82; background: #FFFFFF; }
  .rt-lk-nofoods { font-size: 11.5px; color: #A0A096; font-style: italic; }
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
  @keyframes snfyPulse { 0%, 100% { opacity: 0.35; } 50% { opacity: 1; } }
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

  // Neutral factual read. Progress against the 3-day target + a calm symptom note.
  const parts = []

  if (exposureDaysCompleted > 0 && exposureDaysCompleted < 3) {
    const note = exposureSymptomDays > 0 ? 'Symptoms noted.' : 'No symptoms noted.'
    parts.push(`Exposure day ${exposureDaysCompleted} of 3 logged. ${note}`)
  } else if (exposureDaysCompleted >= 3 && washoutLogs.length === 0) {
    const note = exposureSymptomDays > 0 ? `Symptoms noted on ${exposureSymptomDays} of 3.` : 'No symptoms noted.'
    parts.push(`Exposure complete. ${note}`)
  } else if (washoutLogs.length > 0) {
    const expNote = exposureSymptomDays > 0 ? `symptoms on ${exposureSymptomDays} of 3 exposure days` : 'no exposure symptoms'
    const washNote = washoutSymptomDays === 0 ? 'washout clear so far' : `${washoutSymptomDays} washout day${washoutSymptomDays !== 1 ? 's' : ''} with symptoms`
    parts.push(`Exposure complete, ${expNote}. Washout: ${washNote}.`)
  } else {
    parts.push('Your daily check-ins will build a record here.')
  }

  const oneLiner = parts.join(' ')

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
  logRow: { display: 'flex', gap: '14px', padding: '7px 0', borderBottom: '1px solid rgba(0,0,0,0.03)', alignItems: 'flex-start' },
  logDate: { fontSize: '11px', color: '#7A7A72', fontFamily: 'DM Mono, monospace', minWidth: '52px', flexShrink: 0, paddingTop: '2px' },
  logBody: { fontSize: '12.5px', flex: 1 },
  clean: { color: '#4A8C6A', fontSize: '12.5px' },
  skip: { color: '#7A7A72', fontStyle: 'italic', fontSize: '12.5px' },
  symRow: { display: 'flex', gap: '5px', flexWrap: 'wrap' },
  symPill: { fontSize: '11px', padding: '2px 8px', borderRadius: '20px', border: '1px solid', textTransform: 'capitalize' },
}

export default function ReintroTab({ session, profile, labResult, currentDay, onStartVerdictSurvey, onOpenDailyCheckin }) {
  const [foodMap, setFoodMap] = useState([])
  const [activeReintro, setActiveReintro] = useState(null)
  const [dailyLogs, setDailyLogs] = useState([])
  const [completedCycles, setCompletedCycles] = useState([])
  const [logExpanded, setLogExpanded] = useState(false)
  const [showDailyCheckin, setShowDailyCheckin] = useState(false)
  const [restartNotice, setRestartNotice] = useState(false)
  const [showComplete, setShowComplete] = useState(false)
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

      const { data: done } = await supabase
        .from('reintroduction_results')
        .select('*')
        .eq('user_id', session.user.id)
        .not('verdict', 'is', null)
        .order('started_at', { ascending: true })
      setCompletedCycles(done || [])

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
    const today = todayLocal()
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

    try {
      if (wasExposure && ateFood) {
        const newCount = (activeReintro.exposure_days_completed || 0) + 1
        const updates = { exposure_days_completed: newCount }
        if (newCount >= 3) {
          updates.washout_started_at = todayLocal()
        }
        await supabase.from('reintroduction_results').update(updates).eq('id', activeReintro.id)
      }
      await loadData()
    } catch (e) {
      console.error('handleDailyComplete error:', e)
    } finally {
      setShowDailyCheckin(false)
    }
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
    const today = todayLocal()
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

  // Common track: foods have no lab severity, so they don't tier into
  // Low/Moderate/High. Treat them as a single group that all unlocks at day 57
  // (right after the 8-week elimination), tested one at a time. We map them all
  // into the "Low" bucket (which unlocks at day 57) and leave Moderate/High empty.
  const isCommonTrack = profile?.protocol_track === 'common'

  const getAllQualifyingFoods = (level) => {
    if (!labResult?.foods) return []
    if (isCommonTrack) {
      // All common-track foods live in the Low bucket; other buckets are empty.
      if (level !== 'Low') return []
      return labResult.foods.filter(f => {
        const freq = foodFrequency[f.name]
        return freq !== 'never'
      })
    }
    return labResult.foods.filter(f => {
      if (f.level !== level) return false
      const freq = foodFrequency[f.name]
      return freq !== 'never'
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

  const parseLocal = (str) => { if (!str) return null; const [y, m, d] = String(str).split('T')[0].split('-').map(Number); return new Date(y, m - 1, d) }
  const cycleStart = activeReintro?.started_at ? parseLocal(activeReintro.started_at) : null
  const today = new Date()
  const calDaysSinceStart = cycleStart
    ? Math.floor((new Date(today.getFullYear(), today.getMonth(), today.getDate()) - cycleStart) / (1000 * 60 * 60 * 24)) + 1
    : 1

  const exposureDaysCompleted = activeReintro?.exposure_days_completed || 0
  const inExposure = exposureDaysCompleted < EXPOSURE_TARGET
  const phase = inExposure ? 'exposure' : 'washout'

  // Restart trigger: too many calendar days without hitting exposure target
  const needsRestart = inExposure && calDaysSinceStart > EXPOSURE_CALENDAR_CAP && exposureDaysCompleted < EXPOSURE_TARGET

  // Has today already been logged?
  const todayStr = localDateString(today)
  const loggedToday = dailyLogs?.some(l => l.log_date === todayStr)

  // Which exposure number they'd be logging next
  const nextExposureNumber = exposureDaysCompleted + 1

  // Days into washout + verdict readiness
  const washoutStart = activeReintro?.washout_started_at ? parseLocal(activeReintro.washout_started_at) : null
  const washoutDay = washoutStart
    ? Math.floor((new Date(today.getFullYear(), today.getMonth(), today.getDate()) - washoutStart) / (1000 * 60 * 60 * 24)) + 1
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
        {(() => {
          // ── Pre-results state: no protocol_start_date yet, the clock hasn't started.
          // The countdown below would show fiction ("57 days") — show the honest explainer instead.
          if (!profile?.protocol_start_date) return (
            <>
              <div style={{ position: 'relative', background: '#22301F', borderRadius: 18, padding: '26px 22px', overflow: 'hidden', boxShadow: '0 16px 40px rgba(34,48,31,0.25)', marginBottom: 14 }}>
                <div style={{ position: 'absolute', top: -50, right: -50, width: 180, height: 180, borderRadius: '50%', background: '#8BAE8A', opacity: 0.1, pointerEvents: 'none' }} />
                <div style={{ position: 'relative', fontFamily: 'DM Mono, monospace', fontSize: 9, letterSpacing: '1.5px', color: '#C9A227', textTransform: 'uppercase', marginBottom: 12 }}>Phase 2 · Locked</div>
                <div style={{ position: 'relative', fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 400, color: '#FAF8F4', lineHeight: 1.25, marginBottom: 9 }}>Where your answers get earned.</div>
                <div style={{ position: 'relative', fontSize: 13, color: 'rgba(250,248,244,0.7)', lineHeight: 1.65 }}>Reintroduction is the testing phase. One food at a time comes back into your diet while you track how your body responds. Every food ends with a verdict: Safe, Limit, or Avoid.</div>
              </div>
              <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 14, padding: '18px 16px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1C1C1C', marginBottom: 12 }}>How it unlocks</div>
                {[
                  ['1', '#3D5C3C', 'Your lab results come in and your elimination list is built'],
                  ['2', '#8BAE8A', 'You complete 8 weeks of clean elimination. This is the baseline that makes every test trustworthy'],
                  ['3', '#E0DED6', 'Testing opens. Your least reactive foods go first, one at a time'],
                ].map(([n, bg, text], i) => (
                  <div key={n} style={{ display: 'flex', gap: 12, marginBottom: i < 2 ? 12 : 0 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: bg, color: bg === '#E0DED6' ? '#7A7A72' : '#fff', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{n}</div>
                    <div style={{ fontSize: 13, color: '#4A4A45', lineHeight: 1.5 }}>{text}</div>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: 'center', fontSize: 12, color: '#A8A69E', marginTop: 12 }}>Your timeline starts the day your results arrive</div>
            </>
          )
          // ── Locked state: progress ring + personalized roadmap ──
          const elimDays = 56
          const dayCapped = Math.min(Math.max(currentDay, 0), elimDays)
          const pct = Math.round((dayCapped / elimDays) * 100)
          const R = 48, CIRC = 2 * Math.PI * R
          const offset = CIRC * (1 - dayCapped / elimDays)
          const tierFoods = (level) => getAllQualifyingFoods(level).map(f => f.name)
          const lowFoods = tierFoods('Low')
          const modFoods = tierFoods('Moderate')
          const highFoods = tierFoods('High')
          const commonNoFoodsYet = isCommonTrack && lowFoods.length === 0
          const tiers = isCommonTrack
            ? [{ label: 'Your test foods', day: 57, days: daysUntilLow, foods: lowFoods, next: true }]
            : [
              { label: 'Low sensitivity', day: 57, days: daysUntilLow, foods: lowFoods, next: true },
              { label: 'Moderate sensitivity', day: 113, days: daysUntilModerate, foods: modFoods, next: false },
              { label: 'High sensitivity', day: 169, days: daysUntilHigh, foods: highFoods, next: false },
            ]
          return (
            <>
              <style>{`
                @keyframes rtNodeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes rtGlow { 0%, 100% { opacity: 0.05; } 50% { opacity: 0.11; } }
                @keyframes rtRise { from { opacity: 0; transform: translateY(18px) scale(0.985); } to { opacity: 1; transform: translateY(0) scale(1); } }
              `}</style>
              <div style={{ position: 'relative', background: '#22301F', borderRadius: 22, padding: '24px 24px 26px', overflow: 'hidden', textAlign: 'center', boxShadow: '0 24px 60px rgba(34,48,31,0.35)', animation: 'rtRise 0.7s cubic-bezier(0.16,1,0.3,1) both', marginBottom: 20 }}>
                <div style={{ position: 'absolute', top: -70, right: -70, width: 240, height: 240, borderRadius: '50%', background: '#8BAE8A', animation: 'rtGlow 5s ease-in-out infinite', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: -90, left: -60, width: 200, height: 200, borderRadius: '50%', background: '#E8941F', opacity: 0.05, pointerEvents: 'none' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, position: 'relative' }}>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9.5, letterSpacing: '1.5px', color: '#8BAE8A' }}>SENSIFY · REINTRODUCTION</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E8941F' }} />
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 8.5, letterSpacing: '1px', color: 'rgba(250,248,244,0.55)' }}>T-MINUS {daysUntilLow}D</span>
                  </div>
                </div>
                <div style={{ position: 'relative', width: 110, height: 110, margin: '0 auto 14px' }}>
                  <svg width="110" height="110" viewBox="0 0 110 110">
                    <circle cx="55" cy="55" r={R} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="9" />
                    <circle cx="55" cy="55" r={R} fill="none" stroke="#8BAE8A" strokeWidth="9" strokeLinecap="round"
                      strokeDasharray={CIRC} strokeDashoffset={offset} transform="rotate(-90 55 55)" style={{ filter: 'drop-shadow(0 0 8px rgba(139,174,138,0.5))' }} />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontFamily: 'Fraunces, serif', fontSize: 27, fontWeight: 300, color: '#FAF8F4' }}>{pct}%</div>
                    <div style={{ fontSize: 8, color: 'rgba(250,248,244,0.55)', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Day {dayCapped} of {elimDays}</div>
                  </div>
                </div>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 300, color: '#FAF8F4', position: 'relative' }}>Your first tests unlock in <em style={{ fontStyle: 'italic', color: '#8BAE8A' }}>{daysUntilLow} {daysUntilLow === 1 ? 'day' : 'days'}.</em></div>
                <div style={{ fontSize: 12.5, color: 'rgba(250,248,244,0.7)', lineHeight: 1.65, maxWidth: 310, margin: '8px auto 0', position: 'relative', fontWeight: 300 }}>Every clean elimination day makes your reintroduction results sharper. You're building the baseline that makes testing work.</div>
              </div>

              <div className="rt-section-label" style={{ animation: 'rtNodeIn 0.5s ease 0.5s both' }}>Your testing roadmap</div>
              {(() => {
                const nsCount = (labResult?.foods || []).filter(f => foodFrequency[f.name] === 'never' && f.level !== 'No sensitivity').length
                return nsCount > 0 ? (
                  <div style={{ fontSize: '11px', color: '#8A8A82', margin: '2px 0 8px', lineHeight: 1.55, animation: 'rtNodeIn 0.5s ease 0.55s both' }}>{nsCount} flagged food{nsCount !== 1 ? 's aren\'t' : ' isn\'t'} scheduled because you never eat {nsCount !== 1 ? 'them' : 'it'}. You can add {nsCount !== 1 ? 'them' : 'it'} from your Food Map.</div>
                ) : null
              })()}
              <div className="rt-lk-timeline">
                {tiers.map((tier, i) => (
                  <div key={i} className="rt-lk-node" style={{ animation: `rtNodeIn 0.55s ease ${0.7 + i * 0.2}s both` }}>
                    <div className={`rt-lk-dot${tier.next ? ' next' : ''}`} />
                    <div className={`rt-lk-tiercard${tier.next ? ' next' : ''}`}>
                      <div className="rt-lk-tierhead">
                        <div className="rt-lk-tierlabel">{tier.label}</div>
                        {tier.next
                          ? <div className="rt-lk-badge">Up next · Day {tier.day}</div>
                          : <div className="rt-lk-tierwhen">Day {tier.day} · in {tier.days} days</div>}
                      </div>
                      {tier.foods.length > 0 ? (
                        <div className="rt-lk-pills">
                          {tier.foods.map((f, j) => <span key={j} className="rt-lk-pill">{f}</span>)}
                        </div>
                      ) : (
                        <div className="rt-lk-nofoods">{commonNoFoodsYet ? "You'll choose your test foods when this unlocks." : 'No foods in this tier — one less thing to test.'}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )
        })()}
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
                  const dayDate = cycleStart ? (() => { const d = new Date(cycleStart.getFullYear(), cycleStart.getMonth(), cycleStart.getDate() + day - 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` })() : null
                  const wasLogged = dayDate && dailyLogs?.some(l => String(l.log_date).slice(0, 10) === dayDate)
                  return (
                    <div key={i} className={`rt-day-dot ${day === 3 ? 'exp-divider ' : ''}${isPast ? (wasLogged ? 'past-logged' : 'past-skipped') : isCurrent ? (wasLogged ? 'past-logged current' : 'current') : isExp ? 'exposure-future' : 'washout-future'}`} />
                  )
                })}
              </div>
              <div className="rt-timeline-labels">
                <span style={{ flex: 3, textAlign: 'left' }}>Exposure (days 1 to 3)</span>
                <span style={{ flex: 11, textAlign: 'right' }}>Washout (days 4 to 14)</span>
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
                      onClick={() => onOpenDailyCheckin ? onOpenDailyCheckin() : setShowDailyCheckin(true)}
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
              <div style={{ background: 'linear-gradient(135deg, rgba(139,174,138,0.13), rgba(44,157,138,0.05)), #FFFFFF', border: '1px solid rgba(61,92,60,0.14)', borderRadius: '14px', padding: '16px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '9px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2C9D8A', animation: 'snfyPulse 1.6s infinite', flexShrink: 0 }}></span>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#3D5C3C' }}>REINTRODUCTION BRIEFING</span>
                </div>
                <div style={{ fontSize: '13.5px', color: '#1C1C1C', lineHeight: 1.7 }}>{foodBriefing.replace(/\*\*/g, '')}</div>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '8.5px', letterSpacing: '0.6px', color: '#A8A69E', textTransform: 'uppercase', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>BASED ON YOUR SENSITIVITY LEVEL</div>
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
                <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#3D5C3C', background: '#EDF3ED', padding: '3px 9px', borderRadius: '20px', display: 'inline-block', marginBottom: '10px' }}>Day 14 · Verdict ready</div>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 400, marginBottom: '6px' }}><span style={{ color: '#3D5C3C' }}>{activeReintro.food}</span> reintroduction complete.</div>
                <div style={{ fontSize: '13px', color: '#7A7A72', marginBottom: '14px', lineHeight: 1.6 }}>One last survey. Your answers and fourteen days of logs decide the verdict: Safe, Limit, or Avoid.</div>
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
                  {isCommonTrack ? 'Your foods — unlocked' : 'Low sensitivity — unlocked'}
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

            {!isCommonTrack && !moderateUnlocked && lowUnlocked && (
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

        {/* TESTED LEDGER — the trial record, expandable evidence per cycle */}
        {completedCycles.length > 0 && (
          <TestedLedger cycles={completedCycles} protocolStartDate={profile?.protocol_start_date} />
        )}

        {/* ALL DONE */}
        {lowUnlocked && !activeReintro &&
          getRemainingFoods('Low').length === 0 &&
          getRemainingFoods('Moderate').length === 0 &&
          getRemainingFoods('High').length === 0 && (
          (isCommonTrack && Number(profile?.protocol_tier) === 1 && !profile?.tier_escalated && !showComplete) ? (
            <TierEscalation session={session} profile={profile} completedFoods={completedFoods} onFinish={() => setShowComplete(true)} />
          ) : (
            <ProgramComplete session={session} profile={profile} labResult={labResult} completedFoods={completedFoods} />
          )
        )}
      </div>
    </div>
  )
}
