import React, { useState, useEffect } from 'react'
import { Strip, CheckinButton, SuspectCard, DayCounter } from '../components/objects'
import { supabase } from '../supabase'
import { getTestingOrder } from '../utils/protocolEngine'
import { parseSymptoms } from '../utils/verdictEngine'
import { todayLocal, localDateString } from '../utils/dateUtils'
import { generateReintroFoodBriefing, generateProgramCompleteMessage, normalizeMilestones, serializeMilestones } from '../utils/aiInsights'

// Offered to a common-track Test-2 user who finished without a clear trigger.
// Lets them escalate to Test 8 (the full panel) or accept the result and finish.

// ============================================================
// TestedLedger. the trial record. Every completed cycle as an
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
      <div className="rt-section-label" style={{ marginTop: '20px' }}>Tested: {cycles.length} food{cycles.length !== 1 ? 's' : ''}</div>
      {cycles.map((cyc) => {
        const open = expandedId === cyc.id
        // Ruled day comes from submitted_at (QA 2026-11-06 full-run #12,
        // approved by Alex): "DAY 45" alone was the day the cycle STARTED,
        // shown unlabeled beside a verdict ruled on day 59.
        const startDay = protoDay(cyc.started_at)
        const endDay = protoDay(cyc.submitted_at || cyc.updated_at || cyc.started_at)
        const logs = logsMap[cyc.id]
        return (
          <div key={cyc.id} className="sn-card-hov" style={{ background: 'var(--paper)', border: 'none', borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-1)', marginBottom: '8px', overflow: 'hidden' }}>
            <button onClick={() => toggle(cyc)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', background: 'transparent', border: 'none', padding: '14px 16px', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>{cyc.food}</div>
                {startDay && <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--gray)' }}>Days {startDay}{endDay && endDay !== startDay ? ` to ${endDay}` : ''}</div>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <div className={`rt-verdict-pill ${cyc.verdict}`}>{cyc.verdict}</div>
                <span style={{ fontSize: '11px', color: '#A8A69E', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>▾</span>
              </div>
            </button>
            {open && (
              <div style={{ background: 'var(--tint-warm)', padding: '12px 16px 14px' }}>
                {loadingId === cyc.id && <div style={{ fontSize: '12px', color: '#A8A69E', padding: '6px 0' }}>Loading the record...</div>}
                {logs && logs.length === 0 && <div style={{ fontSize: '12px', color: '#A8A69E', padding: '6px 0' }}>No daily logs were recorded for this cycle.</div>}
                {logs && logs.length > 0 && logs.map((log, li) => (
                  <div key={li} style={{ display: 'flex', gap: '10px', padding: '7px 0', borderBottom: li < logs.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', letterSpacing: '0', color: 'var(--gray-faint)', width: '86px', flexShrink: 0, paddingTop: '2px' }}>
                      {protoDay(log.log_date) ? `Day ${protoDay(log.log_date)}` : ''}, {log.phase === 'exposure' ? `exposure ${log.exposure_number || ''}`.trim() : 'washout'}
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#3A3A35', lineHeight: 1.5 }}>
                      {log.phase === 'exposure' && (log.ate_food === false ? 'Skipped the food this day. ' : log.ate_food === true ? 'Ate it. ' : '')}
                      {symptomText(log)}
                    </div>
                  </div>
                ))}
                {cyc.verdict_reason && (
                  <div style={{ marginTop: '10px', padding: '10px 12px', background: 'var(--paper)', borderRadius: 'var(--r-sm)', boxShadow: 'var(--shadow-1)', fontSize: '12px', color: '#5A5A52', lineHeight: 1.55 }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', letterSpacing: '0', color: 'var(--gray-faint)' }}>Verdict: </span>
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
  const [confirming, setConfirming] = useState(false)
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
      <div className="rt-esc-foods">The full panel adds: eggs, soy, tree nuts, corn, onion and garlic, and legumes. Testing them starts with a fresh elimination. about 8 weeks of clean baseline before the new foods unlock.</div>
      {/* Confirm step (QA 2026-10-26 #5): escalating restarts the whole program
          clock; nobody should re-enter 8 weeks of elimination on one tap. */}
      {!confirming ? (
        <>
          <button className="rt-esc-go" disabled={saving} onClick={() => setConfirming(true)}>
            Test the full panel
          </button>
          <button className="rt-esc-finish" disabled={saving} onClick={onFinish}>
            I'm good with my results
          </button>
        </>
      ) : (
        <>
          <div style={{ fontSize: '12.5px', lineHeight: 1.6, background: 'rgba(255,255,255,0.09)', borderRadius: 'var(--r-sm)', padding: '12px 14px', margin: '0 0 10px' }}>
            Just so it's said plainly: this restarts elimination. Roughly 8 weeks of clean baseline come first, then the new foods unlock for trials. Your earned verdicts stay yours.
          </div>
          <button className="rt-esc-go" disabled={saving} onClick={escalate}>
            {saving ? 'Setting up...' : 'Yes. restart with the full panel'}
          </button>
          <button className="rt-esc-finish" disabled={saving} onClick={() => setConfirming(false)}>
            Not now
          </button>
        </>
      )}
    </div>
  )
}

function ProgramComplete({ session, profile, labResult, completedFoods }) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const name = session?.user?.user_metadata?.full_name?.split(' ')[0] || 'there'

  // AUTO-COMPLETION: the program marks itself complete the moment the
  // finisher sees this screen, instead of waiting for an admin button
  // (the audit's P1: revenue dead-ending in a manual queue). Idempotent,
  // own-profile write; also retro-fixes finishers from before tonight.
  // The Maintain BILLING handoff stays admin-side until the Stripe call.
  useEffect(() => {
    if (!session?.user?.id || profile?.program_phase === 'complete') return
    supabase.from('profiles').update({ program_phase: 'complete' }).eq('id', session.user.id).then(() => {})
  }, [session?.user?.id])

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
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '28px', padding: '30px 26px', marginBottom: '14px', color: '#FAF8F4', background: 'radial-gradient(120% 90% at 85% 0%, rgba(139,174,138,0.3), transparent 55%), linear-gradient(160deg, var(--forest-700) 0%, var(--forest-900) 70%)', boxShadow: 'var(--shadow-3)' }}>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 500, textTransform: 'none', letterSpacing: '0', color: 'rgba(250,248,244,0.55)', marginBottom: '10px' }}>Program complete</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '30px', fontWeight: 300, marginBottom: '16px', letterSpacing: '-0.3px' }}>
        Reintroduction complete.
      </div>
      {loading ? (
        <div style={{ fontSize: '13px', opacity: 0.6 }}>Writing your program summary.</div>
      ) : (
        <div style={{ fontSize: '14px', opacity: 0.85, lineHeight: 1.75, marginBottom: '20px' }}>{message}</div>
      )}
      <div style={{ display: 'flex', gap: '10px' }}>
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 'var(--r-sm)', padding: '13px 14px', flex: 1, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 300, lineHeight: 1, color: '#8BAE8A' }}>
            {completedFoods.filter(f => f.verdict === 'Safe').length}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 500, textTransform: 'none', letterSpacing: '0', color: 'rgba(250,248,244,0.5)', marginTop: '6px' }}>Safe</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 'var(--r-sm)', padding: '13px 14px', flex: 1, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 300, lineHeight: 1, color: '#D4894A' }}>
            {completedFoods.filter(f => f.verdict === 'Limit').length}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 500, textTransform: 'none', letterSpacing: '0', color: 'rgba(250,248,244,0.5)', marginTop: '6px' }}>Limit</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 'var(--r-sm)', padding: '13px 14px', flex: 1, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 300, lineHeight: 1, color: '#E07070' }}>
            {completedFoods.filter(f => f.verdict === 'Avoid').length}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 500, textTransform: 'none', letterSpacing: '0', color: 'rgba(250,248,244,0.5)', marginTop: '6px' }}>Avoid</div>
        </div>
      </div>
      <OutcomeQuestion session={session} profile={profile} />
    </div>
  )
}

// THE OUTCOME QUESTION: one number the whole program exists to produce.
// Asked once, at completion, stored in the milestones KV with a timestamp.
// Honest by construction: it never suggests an answer and 0-10 includes
// "no better at all", because a recorded disappointment is real data too.
export function OutcomeQuestion({ session, profile }) {
  const already = normalizeMilestones(profile?.shown_milestones).outcome_score
  const [score, setScore] = useState(null)
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [saveErr, setSaveErr] = useState('')
  if (already !== undefined && !saved) return null

  const save = async () => {
    if (score === null || busy) return
    setBusy(true)
    setSaveErr('')
    // Checked write (QA 2026-10-26 #6): this is the one number the whole
    // program was for. a failed save keeps the scale on screen with a retry,
    // never a false "Recorded".
    try {
      const { data } = await supabase.from('profiles').select('shown_milestones').eq('id', session.user.id).single()
      const current = normalizeMilestones(data?.shown_milestones)
      const next = { ...current, outcome_score: String(score), outcome_at: new Date().toISOString() }
      if (note.trim()) next.outcome_note = note.trim().slice(0, 500)
      const { error, data: updated } = await supabase.from('profiles').update({ shown_milestones: serializeMilestones(next) }).eq('id', session.user.id).select()
      if (error || !updated || updated.length === 0) throw new Error(error?.message || 'no row updated')
      setSaved(true)
    } catch (e) {
      setSaveErr("That didn't save. your number is still selected, tap Record it to try again.")
    }
    setBusy(false)
  }

  if (saved) return (
    <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.12)', fontSize: 12.5, opacity: 0.6, lineHeight: 1.6 }}>
      Recorded. Thank you for the honest number; it is the one result the whole program was for.
    </div>
  )

  return (
    <div style={{ marginTop: 18, paddingTop: 16 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 400, letterSpacing: '-0.01em', marginBottom: 8 }}>One last measurement.</div>
      <div style={{ fontSize: 13.5, lineHeight: 1.6, marginBottom: 12 }}>Compared to day 1, how are your symptoms now? 0 means no better at all, 10 means gone.</div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
        {Array.from({ length: 11 }).map((_, i) => (
          <button key={i} onClick={() => setScore(i)}
            style={{ flex: '1 0 26px', minWidth: 26, height: 36, borderRadius: 'var(--r-sm)', border: 'none', background: score === i ? '#8BAE8A' : 'rgba(255,255,255,0.09)', color: score === i ? 'var(--forest-900)' : 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: score === i ? '0 6px 16px -4px rgba(139,174,138,0.5)' : 'none', transition: 'all 0.16s' }}>{i}</button>
        ))}
      </div>
      <input value={note} onChange={e => setNote(e.target.value)} placeholder="Anything worth adding, in a sentence (optional)"
        style={{ width: '100%', boxSizing: 'border-box', border: 'none', background: 'rgba(255,255,255,0.09)', borderRadius: 'var(--r-sm)', padding: '12px 13px', fontSize: 13, color: 'white', outline: 'none', marginBottom: 12 }} />
      {saveErr && <div style={{ fontSize: 12.5, color: '#F0B9A9', lineHeight: 1.5, marginBottom: 10 }}>{saveErr}</div>}
      <button onClick={save} disabled={score === null || busy}
        style={{ width: '100%', border: 'none', borderRadius: 'var(--r-md)', padding: 13, background: score === null ? 'rgba(255,255,255,0.12)' : '#8BAE8A', color: score === null ? 'rgba(255,255,255,0.4)' : 'var(--forest-900)', fontSize: 13.5, fontWeight: 700, cursor: score === null ? 'not-allowed' : 'pointer', boxShadow: score === null ? 'none' : '0 10px 24px -6px rgba(139,174,138,0.4)' }}>
        {busy ? 'Saving...' : 'Record it'}
      </button>
    </div>
  )
}

const css = `
  .rt-wrap { min-height: 100vh; background: transparent; color: var(--ink); }
  .rt-content { max-width: 680px; margin: 0 auto; padding: 24px 20px 60px; }
  .rt-header { margin-bottom: 24px; }
  .rt-title { font-family: var(--font-display); font-size: 30px; font-weight: 300; margin-bottom: 5px; letter-spacing: -0.3px; }
  .rt-title em { font-style: italic; color: #3D5C3C; }
  .rt-sub { font-size: 13px; color: var(--gray); line-height: 1.55; }

  .rt-active-card { position: relative; overflow: hidden; color: #FAF8F4; border-radius: 28px; padding: 26px 24px; margin-bottom: 14px; background: radial-gradient(120% 90% at 85% 0%, rgba(139,174,138,0.32), transparent 55%), linear-gradient(160deg, var(--forest-700) 0%, var(--forest-900) 70%); box-shadow: var(--shadow-3); }
  .rt-active-eyebrow { font-family: var(--font-body); font-size: 10px; font-weight: 500; letter-spacing: 0; text-transform: none; color: rgba(250,248,244,0.55); margin-bottom: 8px; }
  .rt-active-food { font-family: var(--font-display); font-size: 38px; font-weight: 300; letter-spacing: -0.02em; line-height: 1.05; margin-bottom: 6px; }
  .rt-active-food em { font-style: italic; color: #8BAE8A; }
  .rt-active-sub { font-size: 12.5px; color: rgba(250,248,244,0.6); margin-bottom: 20px; }
  .rt-phase-badge { display: inline-flex; align-items: center; gap: 6px; padding: 7px 13px; border-radius: 999px; font-size: 12px; font-weight: 600; margin-bottom: 16px; }
  .rt-phase-badge.exposure { background: rgba(139,174,138,0.22); color: #AECDAD; }
  .rt-phase-badge.washout { background: rgba(250,248,244,0.12); color: rgba(250,248,244,0.85); }
  .rt-timeline { display: flex; gap: 4px; margin-bottom: 10px; }
  .rt-day-dot { flex: 1; height: 11px; border-radius: 5px; background: rgba(250,248,244,0.1); }
  .rt-day-dot.past-logged { background: linear-gradient(90deg, var(--forest-150), var(--forest-300)); box-shadow: 0 0 12px rgba(139,174,138,0.75); }
  .rt-day-dot.past-skipped { background: rgba(250,248,244,0.18); }
  .rt-day-dot.current { background: #FAF8F4; box-shadow: 0 0 10px rgba(255,255,255,0.6); }
  .rt-day-dot.past-logged.current { background: linear-gradient(90deg, var(--forest-150), var(--forest-300)); }
  .rt-day-dot.exposure-future { background: rgba(139,174,138,0.38); }
  .rt-day-dot.washout-future { background: rgba(201,216,200,0.18); }
  .rt-day-dot.exp-divider { margin-right: 8px; }
  .rt-timeline-labels { display: flex; font-family: var(--font-body); font-size: 12px; letter-spacing: 0; text-transform: none; color: rgba(250,248,244,0.55); margin-bottom: 16px; }
  .rt-instruction { background: rgba(255,255,255,0.08); border-radius: var(--r-md); padding: 16px; }
  .rt-instruction-label { font-family: var(--font-body); font-size: 10px; font-weight: 500; text-transform: none; letter-spacing: 0; color: rgba(250,248,244,0.55); margin-bottom: 6px; }
  .rt-instruction-text { font-size: 14px; line-height: 1.65; }

  .rt-section-label { font-family: var(--font-display); font-size: 22px; font-weight: 400; letter-spacing: -0.015em; color: var(--ink); margin-bottom: 10px; margin-top: 20px; }

  .rt-food-card { background: var(--paper); border: none; border-radius: var(--r-lg); box-shadow: var(--shadow-2); padding: 18px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; transition: transform var(--t-fast) var(--ease), box-shadow var(--t-fast) var(--ease); }
  @media (hover: hover) { .rt-food-card:hover { transform: translateY(-2px); box-shadow: 0 20px 44px -10px rgba(56,62,48,0.18), 0 3px 10px rgba(56,62,48,0.06); } }
  .rt-food-card.recommended { background: linear-gradient(135deg, rgba(139,174,138,0.14), rgba(139,174,138,0.03)), var(--paper); box-shadow: 0 18px 40px -10px rgba(61,92,60,0.22), 0 2px 8px rgba(56,62,48,0.05); }
  .rt-food-left { display: flex; align-items: center; gap: 12px; }
  .rt-food-rank { width: 34px; height: 34px; border-radius: var(--r-sm); background: var(--tint-warm); display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-size: 16px; font-weight: 400; color: var(--gray); flex-shrink: 0; }
  .rt-food-rank.top { background: var(--forest-900); color: #8BAE8A; }
  .rt-food-name { font-size: 15px; font-weight: 600; margin-bottom: 2px; }
  .rt-food-freq { font-size: 12px; color: var(--gray); }
  .rt-rec-badge { font-family: var(--font-body); font-size: 12px; font-weight: 500; text-transform: none; letter-spacing: 0; color: var(--forest-500); background: var(--forest-100); padding: 3px 9px; border-radius: 999px; margin-left: 8px; }
  .rt-start-btn { background: var(--forest-500); color: white; border: none; border-radius: var(--r-sm); padding: 10px 18px; font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; box-shadow: var(--shadow-pill); transition: transform var(--t-fast) var(--ease), opacity var(--t-fast) var(--ease); }
  @media (hover: hover) { .rt-start-btn:hover { transform: translateY(-1px); } }
  .rt-start-btn:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; transform: none; }

  .rt-completed-card { background: var(--paper); border: none; border-radius: var(--r-md); box-shadow: var(--shadow-1); padding: 14px 16px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; }
  .rt-escalation { position: relative; overflow: hidden; color: #FAF8F4; border-radius: 28px; padding: 28px 26px; margin-top: 20px; background: radial-gradient(120% 90% at 85% 0%, rgba(139,174,138,0.26), transparent 55%), linear-gradient(160deg, var(--forest-700) 0%, var(--forest-900) 70%); box-shadow: var(--shadow-3); }
  .rt-esc-eyebrow { font-family: var(--font-body); font-size: 10px; font-weight: 500; text-transform: none; letter-spacing: 0; color: rgba(139,174,138,0.85); margin-bottom: 12px; }
  .rt-esc-title { font-family: var(--font-display); font-size: 27px; font-weight: 300; letter-spacing: -0.3px; color: #FAF8F4; margin-bottom: 14px; }
  .rt-esc-body { font-size: 14px; line-height: 1.65; margin-bottom: 14px; color: rgba(250,248,244,0.75); }
  .rt-esc-foods { font-size: 13px; color: rgba(250,248,244,0.55); margin-bottom: 20px; line-height: 1.5; }
  .rt-esc-go { width: 100%; padding: 14px; border-radius: var(--r-md); border: none; background: var(--forest-300); color: var(--forest-900); font-size: 14px; font-weight: 700; cursor: pointer; margin-bottom: 9px; box-shadow: 0 10px 24px -6px rgba(139,174,138,0.4); }
  .rt-esc-finish { width: 100%; padding: 12px; border-radius: var(--r-md); border: none; background: transparent; color: rgba(250,248,244,0.6); font-size: 13px; font-weight: 500; cursor: pointer; }
  .rt-verdict-pill { font-family: var(--font-body); font-size: 12px; font-weight: 500; letter-spacing: 0; text-transform: none; padding: 6px 12px; border-radius: 999px; }
  .rt-verdict-pill.Safe { background: var(--safe-100); color: #1F7465; }
  .rt-verdict-pill.Limit { background: var(--limit-100); color: var(--limit-700); }
  .rt-verdict-pill.Avoid { background: var(--avoid-100); color: var(--avoid-700); }

  .rt-locked-card { background: var(--paper); border: none; border-radius: var(--r-lg); box-shadow: var(--shadow-2); padding: 28px 24px; text-align: center; margin-bottom: 14px; }
  .rt-lk-hero { background: var(--paper); border: none; border-radius: var(--r-lg); box-shadow: var(--shadow-2); padding: 26px 24px; text-align: center; margin-bottom: 20px; }
  .rt-lk-ringwrap { position: relative; width: 110px; height: 110px; margin: 0 auto 14px; }
  .rt-lk-ringcenter { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .rt-lk-pct { font-family: var(--font-display); font-size: 30px; font-weight: 300; letter-spacing: -0.02em; color: #3D5C3C; }
  .rt-lk-daycount { font-size: 12px; color: var(--gray-faint); font-family: var(--font-body); text-transform: none; letter-spacing: 0.5px; }
  .rt-lk-headline { font-family: var(--font-display); font-size: 20px; font-weight: 300; color: var(--ink); }
  .rt-lk-headline em { font-style: italic; color: #3D5C3C; }
  .rt-lk-purpose { font-size: 12.5px; color: var(--gray); line-height: 1.6; max-width: 300px; margin: 8px auto 0; }
  .rt-lk-timeline { position: relative; padding-left: 22px; }
  .rt-lk-timeline::before { content: ''; position: absolute; left: 7px; top: 10px; bottom: 10px; width: 2px; background: #EFEDE6; border-radius: 1px; }
  .rt-lk-node { position: relative; margin-bottom: 10px; }
  .rt-lk-dot { position: absolute; left: -22px; top: 16px; width: 16px; height: 16px; border-radius: 50%; background: #EFEDE6; border: 3px solid #FAF8F4; }
  .rt-lk-dot.next { background: var(--forest-500); border-color: var(--forest-100); box-shadow: 0 0 10px rgba(139,174,138,0.6); }
  .rt-lk-tiercard { background: var(--tint-warm); border: none; border-radius: var(--r-md); padding: 14px 16px; opacity: 0.85; }
  .rt-lk-tiercard.next { background: var(--paper); border: none; box-shadow: var(--shadow-2); opacity: 1; }
  .rt-lk-tierhead { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; gap: 8px; }
  .rt-lk-tierlabel { font-size: 13px; font-weight: 600; color: #6A6A62; }
  .rt-lk-tiercard.next .rt-lk-tierlabel { color: var(--ink); }
  .rt-lk-badge { font-family: var(--font-body); font-size: 12px; font-weight: 500; color: var(--forest-500); background: var(--forest-100); padding: 4px 10px; border-radius: 999px; text-transform: none; letter-spacing: 0; white-space: nowrap; }
  .rt-lk-tierwhen { font-size: 10px; color: var(--gray-faint); font-family: var(--font-body); white-space: nowrap; }
  .rt-lk-pills { display: flex; flex-wrap: wrap; gap: 5px; }
  .rt-lk-pill { font-size: 11.5px; color: var(--ink-soft); background: var(--paper); border: none; box-shadow: var(--shadow-1); padding: 5px 11px; border-radius: 999px; }
  .rt-lk-tiercard:not(.next) .rt-lk-pill { color: #8A8A82; background: var(--paper); box-shadow: none; }
  .rt-lk-nofoods { font-size: 11.5px; color: var(--gray-faint); font-style: italic; }
  .rt-locked-icon { width: 48px; height: 48px; background: var(--tint-warm); border-radius: var(--r-md); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
  .rt-locked-title { font-family: var(--font-display); font-size: 21px; font-weight: 300; margin-bottom: 6px; }
  .rt-locked-title em { font-style: italic; color: #3D5C3C; }
  .rt-locked-sub { font-size: 13px; color: var(--gray); line-height: 1.65; max-width: 280px; margin: 0 auto 16px; }
  .rt-countdown { display: inline-flex; align-items: baseline; gap: 4px; background: var(--forest-100); padding: 8px 16px; border-radius: 999px; }
  .rt-countdown-num { font-family: var(--font-display); font-size: 24px; font-weight: 300; color: #3D5C3C; line-height: 1; }
  .rt-countdown-label { font-size: 12px; color: #3D5C3C; font-weight: 500; }

  .rt-tier-card { background: var(--paper); border: none; border-radius: var(--r-md); box-shadow: var(--shadow-1); overflow: hidden; margin-bottom: 14px; }
  .rt-tier-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; background: var(--tint-warm); border-bottom: none; }
  .rt-tier-label { font-family: var(--font-body); font-size: 10px; font-weight: 500; text-transform: none; letter-spacing: 0; color: var(--gray); }
  .rt-tier-status { font-size: 11px; color: var(--gray); }
  .rt-tier-status.unlocked { color: #3D5C3C; font-weight: 500; }
  .rt-spinner { width: 28px; height: 28px; border: 2.5px solid #EDF3ED; border-top-color: #3D5C3C; border-radius: 50%; animation: rt-spin 0.8s linear infinite; margin: 40px auto; }
  @keyframes rt-spin { to { transform: rotate(360deg) } }
  @keyframes snfyPulse { 0%, 100% { opacity: 0.35; } 50% { opacity: 1; } }
`

const FREQ_RANK = { 'daily': 1, '3-5x': 2, '1-2x': 3, 'rarely': 4, 'almost-never': 5, 'never': 6 }
const FREQ_LABEL = { 'daily': 'Daily', '3-5x': '3–5x per week', '1-2x': '1–2x per week', 'rarely': 'Rarely', 'almost-never': 'Almost never', 'never': 'Never' }

// Cycle-so-far summary. FACTUAL ONLY. never hints at the verdict
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
    // LOCAL parse (QA 2026-11-06 #4): new Date('YYYY-MM-DD') is UTC, which
    // rendered every cycle-log date one day early for US customers. the
    // only date in this area that still parsed UTC.
    const [y, m, dd] = String(log.log_date).split('T')[0].split('-').map(Number)
    const d = new Date(y, m - 1, dd)
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

// EvidenceNeedle deleted (QA 2026-11-06 protocol critique #5, approved by
// Alex 2026-11-10): a live Safe/Limit/Avoid readout during an active cycle
// fed the verdict back into the person still creating the data. the exact
// feedback loop the CycleSummary's own doctrine (above) forbids. The verdict
// now appears only when the cycle ends. computeProvisionalVerdict still
// powers the ruling itself.


const cs = {
  wrap: { background: 'var(--paper)', border: 'none', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-2)', padding: '18px', marginBottom: '14px' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' },
  label: { fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 500, textTransform: 'none', letterSpacing: '0', color: 'var(--forest-500)' },
  toggle: { background: 'var(--tint-warm)', border: 'none', borderRadius: '999px', padding: '5px 12px', fontSize: '11px', color: '#3D5C3C', fontWeight: 600, cursor: 'pointer' },
  oneLiner: { fontSize: '13.5px', color: 'var(--ink)', lineHeight: 1.6 },
  empty: { fontSize: '13px', color: 'var(--gray)', lineHeight: 1.6 },
  log: { marginTop: '14px', background: 'var(--tint-warm)', borderRadius: 'var(--r-sm)', padding: '10px 12px' },
  phaseLabel: { fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 500, textTransform: 'none', letterSpacing: '0', color: 'var(--gray-faint)', margin: '8px 0 6px' },
  logRow: { display: 'flex', gap: '14px', padding: '7px 0', alignItems: 'flex-start' },
  logDate: { fontSize: '11px', color: 'var(--gray)', fontFamily: 'var(--font-body)', minWidth: '52px', flexShrink: 0, paddingTop: '2px' },
  logBody: { fontSize: '12.5px', flex: 1 },
  clean: { color: 'var(--forest-500)', fontSize: '12.5px' },
  skip: { color: 'var(--gray)', fontStyle: 'italic', fontSize: '12.5px' },
  symRow: { display: 'flex', gap: '5px', flexWrap: 'wrap' },
  symPill: { fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '999px', border: '1px solid', textTransform: 'capitalize', background: 'var(--paper)' },
}

export default function ReintroTab({ session, profile, labResult, currentDay, onStartVerdictSurvey, onOpenDailyCheckin }) {
  const [foodMap, setFoodMap] = useState([])
  const [activeReintro, setActiveReintro] = useState(null)
  const [dailyLogs, setDailyLogs] = useState([])
  const [completedCycles, setCompletedCycles] = useState([])
  const [logExpanded, setLogExpanded] = useState(false)
  const [confirmStop, setConfirmStop] = useState(false)
  const [stopErr, setStopErr] = useState('')
  const [restartNotice, setRestartNotice] = useState(false)
  const [showComplete, setShowComplete] = useState(false)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(null)
  const [pendingStart, setPendingStart] = useState(null)  // { food, level } awaiting today/tomorrow choice
  const [showDatePick, setShowDatePick] = useState(false) // trial scheduler: 14-day date strip open in the start sheet
  const [farPick, setFarPick] = useState(null)            // YYYY-MM-DD of a far-out start (8+ days) awaiting confirm
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
        .maybeSingle()
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

  const startReintro = async (food, level, startDate) => {
    setStarting(food)
    const today = startDate || todayLocal()
    const { error: insertError } = await supabase.from('reintroduction_results').insert({
      user_id: session.user.id,
      food,
      sensitivity_level: level,
      started_at: today,
    })
    // current_reintro_day write deleted (QA 2026-11-06 #7): it was written 1
    // and incremented by nothing. a half-dead counter waiting to mislead.
    const { error: profileError, data: updated } = await supabase.from('profiles').update({
      current_reintro_food: food,
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
      let symptomPattern = null
      try {
        const { data: ev } = await supabase.from('symptom_logs').select('symptom, note').eq('user_id', session.user.id).limit(200)
        if (ev && ev.length >= 3) {
          const counts = {}; const timings = {}
          for (const e of ev) { counts[e.symptom] = (counts[e.symptom] || 0) + 1; if (e.note) timings[e.note] = (timings[e.note] || 0) + 1 }
          const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k.toLowerCase()).join(' and ')
          const when = Object.entries(timings).sort((a, b) => b[1] - a[1])[0]
          symptomPattern = top + (when ? `, usually ${when[0]}` : '')
        }
      } catch (e) {}
      const msg = await generateReintroFoodBriefing({ name, food, sensitivityLevel: level, profile, symptomPattern })
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

  // A severe day anywhere on this cycle's log (QA 2026-10-26 #1): the clear
  // answer that ends the cycle as Avoid, and the fact the restart gate must
  // never delete or re-expose past.
  // Shape-tolerant via the engine's own reader (QA 2026-11-06 #6): a legacy
  // string-encoded row used to throw here and error-boundary the whole tab.
  const hasSevereLog = (dailyLogs || []).some(l => parseSymptoms(l.symptoms).some(s => String(s?.intensity || '').toLowerCase() === 'severe'))

  // Severe reaction -> stop cycle, auto-verdict Avoid. Checked writes: a failed
  // stop must say so, never silently leave the cycle running.
  const handleStopCycle = async () => {
    if (!activeReintro) return
    setStopErr('')
    const { error, data: updated } = await supabase.from('reintroduction_results')
      .update({ stopped_early: true, verdict: 'Avoid', verdict_reason: 'Cycle stopped early due to a severe reaction.' })
      .eq('id', activeReintro.id).select()
    if (error || !updated || updated.length === 0) {
      setStopErr("That didn't save. please try again. If it keeps failing, your logs are safe and you can stop the cycle later.")
      return
    }
    // Legacy mirror; reintroduction_results above is the source of truth.
    try {
      await supabase.from('food_map').upsert({
        user_id: session.user.id,
        food: activeReintro.food,
        verdict: 'Avoid',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,food' })
    } catch (e) {}
    setConfirmStop(false)
    setActiveReintro(null)
    await loadData()
  }

  // Restart cycle after exceeding the 5-day exposure cap.
  // SEVERE GATE (QA 2026-10-26 #1): a cycle with a logged severe day is never
  // restarted. restarting would invite re-exposure and used to DELETE the
  // severe record. It routes to the Avoid stop instead, logs intact.
  const handleRestartCycle = async (startDate) => {
    if (!activeReintro) return
    if (hasSevereLog) { await handleStopCycle(); return }
    const today = startDate || todayLocal()
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

  // Get foods from lab results. filter out never/rarely eaten
  const foodFrequency = profile?.food_frequency || {}
  // A verdicted food is complete whether the legacy food_map row landed or not:
  // reintroduction_results is the source of truth the Tested ledger and the
  // gallery already use, so the picker excludes from BOTH (the silent-upsert
  // bug that left Dairy offered after its own Avoid verdict dies here).
  // Conflicted rulings (latest cycle per food): eligible for a retest offer.
  // completedCycles is started_at ascending, so later cycles win the map; a
  // clean retest therefore retires the conflicted flag along with the verdict.
  const latestCycleByFood = {}
  for (const cy of completedCycles) latestCycleByFood[(cy.food || '').toLowerCase()] = cy
  const retestable = Object.values(latestCycleByFood).filter(cy => cy.verdict && cy.answers?.conflicted === true)

  const fmVerdicts = foodMap.filter(f => f.verdict)
  const fmNameSet = new Set(fmVerdicts.map(f => (f.food || '').toLowerCase()))
  const completedFoods = [...fmVerdicts, ...completedCycles.filter(cy => cy.verdict && !fmNameSet.has((cy.food || '').toLowerCase())).map(cy => ({ food: cy.food, verdict: cy.verdict }))]
  const completedFoodNames = completedFoods.map(f => (f.food || '').toLowerCase())

  // Common track: foods have no lab severity, so they don't tier into
  // Low/Moderate/High. Treat them as a single group that all unlocks at day 57
  // (right after the 8-week elimination), tested one at a time. We map them all
  // into the "Low" bucket (which unlocks at day 57) and leave Moderate/High empty.
  const isCommonTrack = profile?.protocol_track === 'common'

  const getAllQualifyingFoods = (level) => {
    if (!labResult?.foods) return []
    // ONE queue for every track (the frequency doctrine, Alex's ruling):
    // all foods unlock together at day 57 and are ordered by how often the
    // user eats them, with lab level only as tiebreak inside getTestingOrder.
    // The old Low/Moderate/High time gates (day 113/169) are retired; the
    // 'Low' bucket now carries the whole queue and the others stay empty.
    if (level !== 'Low') return []
    return labResult.foods.filter(f => {
      const freq = foodFrequency[f.name]
      return freq !== 'never'
    })
  }

  const getRemainingFoods = (level) => {
    return getTestingOrder(
      getAllQualifyingFoods(level)
        .filter(f => !completedFoodNames.includes((f.name || '').toLowerCase()))
        .filter(f => !activeReintro || activeReintro.food !== f.name),
      foodFrequency
    )
  }

  // Tier unlocks when: day requirement met AND all previous tier qualifying foods are tested
  const allLowTested = getAllQualifyingFoods('Low').every(f => completedFoodNames.includes((f.name || '').toLowerCase()))
  const allModerateTested = getAllQualifyingFoods('Moderate').every(f => completedFoodNames.includes((f.name || '').toLowerCase()))

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
  const cycleDay = calDaysSinceStart
  const isExposure = inExposure

  if (loading) return (
    <div className="rt-wrap">
      <style>{css}</style>
      <div className="rt-content"><div className="rt-spinner" /></div>
    </div>
  )

  // Tracking mode: the user declined the protocol, so there is no
  // reintroduction timeline to promise. State-aware per finding 14.
  if (profile?.track_decision === 'declined') {
    return (
      <div className="rt-wrap">
        <style>{css}</style>
        <div className="rt-content">
          <div className="rt-header">
            <div className="rt-title">Reintroduction.</div>
            <div className="rt-sub">The testing phase of the structured protocol.</div>
          </div>
          <div className="sn-rise" style={{ background: 'var(--paper)', border: 'none', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-2)', padding: '20px 18px' }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 500, letterSpacing: '0', color: 'var(--forest-500)', textTransform: 'none', marginBottom: 10 }}>You're tracking, not testing</div>
            <div style={{ fontSize: 13.5, color: '#4A4A45', lineHeight: 1.65, marginBottom: 10 }}>Reintroduction cycles are how the protocol earns verdicts: one food returns at a time while your logs decide whether it is Safe, Limit, or Avoid. You chose to track for now, so no cycles are scheduled.</div>
            <div style={{ fontSize: 13.5, color: '#4A4A45', lineHeight: 1.65 }}>If your tracking starts pointing at food, you can begin the full protocol anytime from your Home tab. Your timeline would start the day you choose it.</div>
          </div>
        </div>
      </div>
    )
  }

  // Restart notice after exceeding 5-day exposure cap.
  // A logged SEVERE day takes a different door (QA 2026-10-26 #1): the answer
  // is already in. offer the Avoid stop, never re-exposure, and keep the logs.
  if (restartNotice && activeReintro && hasSevereLog) {
    return (
      <div className="rt-wrap">
        <style>{css}</style>
        <div className="rt-content">
          <div style={{ maxWidth: '460px', margin: '40px auto', background: 'var(--paper)', border: 'none', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-2)', padding: '28px' }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 500, letterSpacing: '0', textTransform: 'none', color: 'var(--avoid-700)', marginBottom: '10px' }}>Severe reaction on the record</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 300, letterSpacing: '-0.3px', marginBottom: '12px' }}>This cycle already gave its answer.</div>
            <p style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: 1.7, marginBottom: '20px' }}>
              You logged a severe reaction to {activeReintro.food.toLowerCase()} during this cycle. That is a clear result. there is no need to eat it again. We'll close the cycle, rule {activeReintro.food.toLowerCase()} Avoid, and keep every day you logged on the record. If symptoms feel serious, please seek medical care.
            </p>
            {stopErr && <div style={{ fontSize: '12.5px', color: 'var(--avoid-700)', lineHeight: 1.5, marginBottom: '12px' }}>{stopErr}</div>}
            <button onClick={handleStopCycle}
              style={{ width: '100%', background: 'var(--forest-500)', color: '#FFFFFF', border: 'none', borderRadius: 'var(--r-md)', padding: '14px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--shadow-pill)' }}>
              Close the cycle. rule {activeReintro.food} Avoid
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Restart notice after exceeding 5-day exposure cap
  if (restartNotice && activeReintro) {
    return (
      <div className="rt-wrap">
        <style>{css}</style>
        <div className="rt-content">
          <div style={{ maxWidth: '460px', margin: '40px auto', background: 'var(--paper)', border: 'none', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-2)', padding: '28px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 300, letterSpacing: '-0.3px', marginBottom: '12px' }}>Let's restart this cycle.</div>
            <p style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: 1.7, marginBottom: '20px' }}>
              Getting three exposure days close together gives the clearest read on how {activeReintro.food} affects you. It's been more than five days without reaching three, so we'll start fresh whenever you're ready. Nothing you logged counts against you.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={() => { const t = new Date(); const tm = new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1); handleRestartCycle(`${tm.getFullYear()}-${String(tm.getMonth() + 1).padStart(2, '0')}-${String(tm.getDate()).padStart(2, '0')}`) }}
                style={{ width: '100%', background: new Date().getHours() >= 17 ? 'var(--forest-500)' : 'var(--tint-warm)', color: new Date().getHours() >= 17 ? '#FFFFFF' : 'var(--ink)', border: 'none', borderRadius: 'var(--r-md)', padding: '14px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', boxShadow: new Date().getHours() >= 17 ? 'var(--shadow-pill)' : 'none' }}>
                Restart tomorrow, day 1 is {new Date(Date.now() + 86400000).toLocaleDateString('en-US', { weekday: 'long' })}
              </button>
              <button onClick={() => handleRestartCycle(todayLocal())}
                style={{ width: '100%', background: new Date().getHours() >= 17 ? 'var(--tint-warm)' : 'var(--forest-500)', color: new Date().getHours() >= 17 ? 'var(--ink)' : '#FFFFFF', border: 'none', borderRadius: 'var(--r-md)', padding: '14px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', boxShadow: new Date().getHours() >= 17 ? 'none' : 'var(--shadow-pill)' }}>
                Restart today
              </button>
            </div>
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
  if (!lowUnlocked) {
    // Refresh 2026-11-13: the pre-57 tab answers "when does testing start, in
    // what order?" with the shared objects. No countdown rings, no fiction
    // before the clock has started.
    const order = getRemainingFoods('Low')
    const daysLeft = profile?.protocol_start_date ? Math.max(0, 57 - (currentDay || 0)) : null
    const LEVEL_WORD = { High: 'high', Moderate: 'moderate', Low: 'low' }
    const ORD = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth', 'Eleventh', 'Twelfth']
    const explainer = ['exposure-planned', 'exposure-planned', 'exposure-planned', 'future', 'future', 'future', 'future', 'future', 'future', 'future', 'future', 'future', 'future', 'future']
    return (
      <div className="rt-wrap">
        <style>{css}</style>
        <div className="rt-content">
          <div className="rt-header">
            <div className="rt-title" style={{ fontSize: 30, lineHeight: 1.05 }}>
              {!profile?.protocol_start_date ? 'Testing opens after elimination.' : daysLeft === 0 ? 'Testing opens tomorrow.' : 'Testing opens on day 57.'}
            </div>
            <div className="rt-sub">
              {!profile?.protocol_start_date
                ? 'Once your protocol starts, every suspect gets its own fourteen-day trial here. Nothing is scheduled yet.'
                : <>{daysLeft === 0 ? 'Your last clean night is tonight.' : <><DayCounter n={daysLeft} label={daysLeft === 1 ? 'clean night to go' : 'clean nights to go'} /> </>} Your suspects will be tried one at a time, in the order below, and your body rules on each.</>}
            </div>
          </div>

          <div className="ob-paper" style={{ padding: '20px 22px', marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, letterSpacing: '-0.015em', marginBottom: 6 }}>How a trial works</div>
            <Strip days={explainer} size="md" label="A fourteen-day trial" />
            <p style={{ fontSize: 14.5, color: 'var(--ob-ink-2)', lineHeight: 1.55, margin: '12px 0 0' }}>Three days eating the food, then eleven clean days watching for anything delayed. One food at a time, so the answer can only belong to that food. The verdict is read from your own record on day fourteen.</p>
          </div>

          {order.length > 0 && (
            <>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, letterSpacing: '-0.015em', margin: '22px 0 10px' }}>Your order</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 14 }}>
                {order.map((f, i) => {
                  const lvl = LEVEL_WORD[f.level] || null
                  const meta = [lvl ? `Lab flagged, ${lvl}.` : 'Common trigger.', FREQ_LABEL[foodFrequency[f.name]] ? `You eat it: ${FREQ_LABEL[foodFrequency[f.name]].toLowerCase()}.` : ''].filter(Boolean).join(' ')
                  return <SuspectCard key={f.name} food={f.name} meta={meta} state="suspect" line={i === 0 ? 'First on trial, from day 57.' : `${ORD[i] || `${i + 1}th`} in line.`} />
                })}
              </div>
              <p style={{ fontSize: 13.5, color: 'var(--ob-mute)', lineHeight: 1.5, margin: '14px 0 0' }}>Ordered by how often you eat each food, with the lab level breaking ties. The order is a plan, not a result.</p>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="rt-wrap">
      <style>{css}</style>
      <div className="rt-content">
        {/* Refresh 2026-11-13: the header answers the state's one question
            (qa/SCREENS.md Reintro tab entries) instead of restating the tab. */}
        {(() => {
          const allDone = lowUnlocked && !activeReintro && getRemainingFoods('Low').length === 0 && getRemainingFoods('Moderate').length === 0 && getRemainingFoods('High').length === 0
          const f = activeReintro?.food || ''
          const title = activeReintro
            ? (cycleDay < 1 ? `${f} starts ${cycleDay === 0 ? 'tomorrow' : `in ${1 - cycleDay} days`}.`
              : isVerdictDay ? `${f} reintroduction complete.`
              : isExposure ? `Exposure day ${Math.min(3, nextExposureNumber)} of 3. Eat ${f.toLowerCase()}.`
              : washoutDay <= 1 ? `Exposure complete. Washout begins tomorrow.`
              : `Washout day ${washoutDay - 1} of ${WASHOUT_LENGTH}. Avoid ${f.toLowerCase()}.`)
            : allDone ? 'Reintroduction complete.'
            : completedCycles.length === 0 ? 'Testing is open.'
            : 'Choose your next food.'
          const sub = activeReintro
            ? (isVerdictDay ? 'Fourteen days are on the record. One survey, then the ruling.' : 'One food at a time. Three days of eating it, eleven of watching, then the verdict on day fourteen.')
            : allDone ? 'Every suspect has been tried. Every verdict was earned from your own record.'
            : 'One food at a time. Fourteen days per trial. Each one earns a verdict.'
          return (
            <div className="rt-header">
              <div className="rt-title" style={{ fontSize: 30, lineHeight: 1.05 }}>{title}</div>
              <div className="rt-sub">{sub}</div>
            </div>
          )
        })()}

        {/* ACTIVE REINTRODUCTION */}
        {activeReintro && (
          <>
            {/* Refresh 2026-11-13: the active trial as one paper card built
                from the shared objects. One clock, one instruction, one action. */}
            <div className="ob-paper sn-rise" style={{ padding: '22px 22px 20px', marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 400, letterSpacing: '-0.015em', lineHeight: 1.1 }}>{activeReintro.food} on trial</div>
                <div style={{ fontSize: 13.5, color: 'var(--ob-mute)' }}>{cycleDay < 1 ? (cycleDay === 0 ? 'Starts tomorrow' : `Starts in ${1 - cycleDay} days`) : `Day ${Math.min(14, cycleDay)} of 14`}</div>
              </div>
              <p style={{ fontSize: 13.5, color: 'var(--ob-mute)', margin: '6px 0 0', lineHeight: 1.5 }}>Only {activeReintro.food.toLowerCase()} comes back. Every other food on your list stays out.</p>
              {/* 14-day strip: the shared object (src/components/objects). */}
              {(() => {
                const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                const days = [...Array(14)].map((_, i) => {
                  const day = i + 1
                  const isExp = day <= 3
                  if (!cycleStart) return isExp ? 'exposure-planned' : 'future'
                  const d = new Date(cycleStart.getFullYear(), cycleStart.getMonth(), cycleStart.getDate() + day - 1)
                  const dayDate = iso(d)
                  const wasLogged = dailyLogs?.some(l => String(l.log_date).slice(0, 10) === dayDate)
                  if (day === cycleDay) return isExp ? (wasLogged ? 'exposure' : 'today-exposure') : (wasLogged ? 'today-on' : 'today')
                  if (day > cycleDay) return isExp ? 'exposure-planned' : 'future'
                  if (isExp) return wasLogged ? 'exposure' : 'none'
                  return wasLogged ? 'on' : 'none'
                })
                return (
                  <div style={{ margin: '16px 0 4px' }}>
                    <Strip days={days} size="md" label={`${activeReintro.food} cycle, day ${Math.min(14, Math.max(1, cycleDay))} of 14`} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 8, fontSize: 12, color: 'var(--ob-mute)' }}>
                      <span>Exposure, days 1 to 3</span>
                      <span>Washout, days 4 to 14</span>
                    </div>
                  </div>
                )
              })()}

              {isVerdictDay ? (
                <div style={{ marginTop: 16 }}>
                  <p style={{ fontSize: 15, color: 'var(--ob-ink-2)', lineHeight: 1.55, margin: '0 0 14px' }}>Fourteen days are on the record. One short survey, then the ruling: Safe, Limit or Avoid. Nothing is decided until you answer.</p>
                  <button type="button" className="ob-btn tonight" onClick={() => onStartVerdictSurvey(activeReintro.food)}>Get my verdict</button>
                </div>
              ) : (
                <div style={{ marginTop: 16 }}>
                  <p style={{ fontSize: 15, color: 'var(--ob-ink-2)', lineHeight: 1.55, margin: 0 }}>
                    {cycleDay < 1
                      ? (cycleDay === 0
                        ? `Nothing to do yet. Day 1 begins tomorrow; eat ${activeReintro.food.toLowerCase()} as you normally would then. Tonight's check-in is just your usual sleep, water and stress.`
                        : `Nothing to do yet. Day 1 begins in ${1 - cycleDay} days. Until then your elimination holds exactly as it is.`)
                      : loggedToday
                      ? `Today's log is in. Nothing more to eat or do until tomorrow. ${isExposure ? 'Tomorrow picks up your next exposure day.' : 'The washout continues tomorrow.'}`
                      : isExposure
                      ? `Eat ${activeReintro.food.toLowerCase()} today as you normally would, a normal serving at your usual time. Exposure day ${nextExposureNumber} of 3.`
                      : washoutDay <= 1
                      ? `Exposure complete. All 3 ${activeReintro.food.toLowerCase()} days are logged. Washout begins tomorrow: from then, keep it out completely while we watch for delayed reactions.`
                      : `Keep ${activeReintro.food.toLowerCase()} out today. Washout day ${washoutDay - 1} of ${WASHOUT_LENGTH}. Your elimination continues as usual.`}
                  </p>
                  {cycleDay < 1 && <p style={{ marginTop: 10, fontSize: 13, color: 'var(--ob-mute)' }}>Your first check-in for this trial unlocks with day 1.</p>}
                  {cycleDay >= 1 && (
                    <div style={{ marginTop: 14 }}>
                      {loggedToday ? <CheckinButton state="logged" /> : <CheckinButton state={isExposure ? 'tonight' : 'washout'} onClick={() => onOpenDailyCheckin && onOpenDailyCheckin()} />}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Food briefing */}
            {loadingBriefing && isExposure && (
              <div style={{ background: 'var(--paper)', border: 'none', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-1)', padding: '16px', marginBottom: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: 'var(--gray)', fontStyle: 'italic' }}>Getting your personalized briefing...</div>
              </div>
            )}
            {foodBriefing && !loadingBriefing && !isVerdictDay && isExposure && (
              <div className="sn-rise-2" style={{ background: 'linear-gradient(135deg, rgba(139,174,138,0.13), rgba(139,174,138,0.04)), #FFFFFF', border: 'none', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-2)', padding: '18px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '9px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--forest-300)', animation: 'snfyPulse 1.6s infinite', flexShrink: 0 }}></span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 500, textTransform: 'none', letterSpacing: '0', color: 'var(--forest-500)' }}>Briefing</span>
                </div>
                {(() => {
                  const clean = foodBriefing.replace(/\*\*/g, '')
                  const w = clean.match(/\[WATCH\]([\s\S]*?)(?=\[TIP\]|\[SAFETY\]|$)/)
                  const t = clean.match(/\[TIP\]([\s\S]*?)(?=\[SAFETY\]|$)/)
                  const sf = clean.match(/\[SAFETY\]([\s\S]*?)$/)
                  if (!w || !sf) return <div style={{ fontSize: '13.5px', color: '#1C1C1C', lineHeight: 1.7 }}>{clean.replace(/\[(WATCH|TIP|SAFETY)\]/g, '')}</div>
                  const mono = { fontFamily: 'var(--font-body)', fontSize: '7px', fontWeight: 500, letterSpacing: '0', color: 'var(--gray-faint)', marginBottom: '4px' }
                  return (
                    <>
                      <div style={mono}>Watch for</div>
                      <div style={{ fontSize: '12.5px', color: '#1C1C1C', lineHeight: 1.65, marginBottom: '12px' }}>{w[1].trim()}</div>
                      {t && <><div style={mono}>One tip</div>
                      <div style={{ fontSize: '12.5px', color: '#1C1C1C', lineHeight: 1.65, marginBottom: '12px' }}>{t[1].trim()}</div></>}
                      <div style={{ background: 'var(--avoid-100)', border: 'none', borderRadius: 'var(--r-sm)', padding: '10px 12px' }}>
                        <div style={{ ...mono, color: 'var(--avoid-700)' }}>Stop immediately if</div>
                        <div style={{ fontSize: '12px', color: '#1C1C1C', lineHeight: 1.55 }}>{sf[1].trim()}</div>
                      </div>
                    </>
                  )
                })()}
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', letterSpacing: '0', color: 'var(--gray-faint)', textTransform: 'none', marginTop: '12px' }}>Based on your sensitivity level</div>
              </div>
            )}

            {/* CYCLE SO FAR. factual summary, expands to full log */}
            <div className="sn-rise-3">
              <CycleSummary
                logs={dailyLogs}
                food={activeReintro.food}
                exposureDaysCompleted={exposureDaysCompleted}
                expanded={logExpanded}
                onToggle={() => setLogExpanded(v => !v)}
                cycleStart={activeReintro.started_at}
              />
            </div>

            {/* The live evidence needle that rendered here was removed
                2026-11-10 (approved by Alex): no mid-cycle verdict preview , 
                the data must finish being created before it is read. */}

            {/* THE SEVERE OFF-RAMP (QA 2026-10-26 #1): the daily check-in has
                always SAID a severe reaction can stop the cycle from this tab.
                This is the control that makes it true. loud when a severe day
                is on the log, a quiet door otherwise. */}
            {!isVerdictDay && cycleDay >= 1 && (
              <div className="sn-rise-4" style={{ marginTop: 14 }}>
                {confirmStop ? (
                  <div style={{ background: 'var(--paper)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-2)', padding: '18px' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>Stop the {activeReintro.food.toLowerCase()} cycle?</div>
                    <div style={{ fontSize: 12.5, color: 'var(--gray)', lineHeight: 1.6, marginBottom: 12 }}>It will be ruled Avoid on the strength of this cycle, every day you logged stays on the record, and nothing gets eaten again. This can't be undone from here (a future retest can).</div>
                    {stopErr && <div style={{ fontSize: 12.5, color: 'var(--avoid-700)', lineHeight: 1.5, marginBottom: 10 }}>{stopErr}</div>}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={handleStopCycle} style={{ flex: 1, background: 'var(--avoid-700)', color: '#FFFFFF', border: 'none', borderRadius: 'var(--r-md)', padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Stop. rule it Avoid</button>
                      <button onClick={() => { setConfirmStop(false); setStopErr('') }} style={{ flex: 1, background: 'var(--tint-warm)', color: 'var(--ink)', border: 'none', borderRadius: 'var(--r-md)', padding: '12px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Keep the cycle going</button>
                    </div>
                  </div>
                ) : hasSevereLog ? (
                  <div style={{ background: 'var(--avoid-100)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-2)', padding: '16px 18px' }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--avoid-700)', marginBottom: 6 }}>You logged a severe reaction</div>
                    <div style={{ fontSize: 12.5, color: '#1C1C1C', lineHeight: 1.6, marginBottom: 12 }}>A severe response is a clear answer on its own. You can stop this cycle now and {activeReintro.food.toLowerCase()} will be ruled Avoid. no more exposures needed. If symptoms feel serious, please seek medical care.</div>
                    <button onClick={() => setConfirmStop(true)} style={{ width: '100%', background: 'var(--avoid-700)', color: '#FFFFFF', border: 'none', borderRadius: 'var(--r-md)', padding: '13px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>Stop this cycle. rule {activeReintro.food} Avoid</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmStop(true)} style={{ width: '100%', textAlign: 'center', background: 'transparent', border: 'none', padding: '6px', fontSize: 12, color: 'var(--gray)', textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer' }}>
                    Severe reaction? You can stop this cycle →
                  </button>
                )}
              </div>
            )}

          </>
        )}

        {/* START CHOICE. day 1 begins when the person says so, not when the button was pressed */}
        {pendingStart && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,28,28,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '20px' }} onClick={() => { setPendingStart(null); setShowDatePick(false); setFarPick(null) }}>
            <div className="sn-rise" style={{ background: 'var(--paper)', borderRadius: 'var(--r-lg)', padding: '24px', maxWidth: '380px', width: '100%', boxShadow: 'var(--shadow-3)' }} onClick={e => e.stopPropagation()}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 500, textTransform: 'none', letterSpacing: '0', color: 'var(--forest-500)', marginBottom: '8px' }}>{pendingStart.food} cycle</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 400, letterSpacing: '-0.3px', color: 'var(--ink)', marginBottom: '6px' }}>When should day 1 begin?</div>
              <div style={{ fontSize: '13px', color: 'var(--gray)', lineHeight: 1.55, marginBottom: '16px' }}>Only {pendingStart.food.toLowerCase()} comes back during this cycle. Everything else on your list stays eliminated. Day 1 is an exposure day, you'll want a real chance to eat {pendingStart.food.toLowerCase()} that day.{new Date().getHours() >= 17 ? ' It\u2019s getting late, so starting tomorrow is probably the honest choice.' : ''}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button disabled={!!starting} onClick={() => { const t = new Date(); const tm = new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1); const s = `${tm.getFullYear()}-${String(tm.getMonth() + 1).padStart(2, '0')}-${String(tm.getDate()).padStart(2, '0')}`; startReintro(pendingStart.food, pendingStart.level, s); setPendingStart(null); setShowDatePick(false); setFarPick(null) }}
                  style={{ background: new Date().getHours() >= 17 ? 'var(--forest-500)' : 'var(--tint-warm)', color: new Date().getHours() >= 17 ? '#FFFFFF' : 'var(--ink)', border: 'none', borderRadius: 'var(--r-md)', padding: '13px', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer', boxShadow: new Date().getHours() >= 17 ? 'var(--shadow-pill)' : 'none' }}>
                  Start tomorrow, day 1 is {new Date(Date.now() + 86400000).toLocaleDateString('en-US', { weekday: 'long' })}
                </button>
                <button disabled={!!starting} onClick={() => { startReintro(pendingStart.food, pendingStart.level, todayLocal()); setPendingStart(null); setShowDatePick(false); setFarPick(null) }}
                  style={{ background: new Date().getHours() >= 17 ? 'var(--tint-warm)' : 'var(--forest-500)', color: new Date().getHours() >= 17 ? 'var(--ink)' : '#FFFFFF', border: 'none', borderRadius: 'var(--r-md)', padding: '13px', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer', boxShadow: new Date().getHours() >= 17 ? 'none' : 'var(--shadow-pill)' }}>
                  Start today
                </button>
                {/* THE TRIAL SCHEDULER: pick any of the next 14 days as day 1 */}
                <button disabled={!!starting} onClick={() => { setShowDatePick(v => !v); setFarPick(null) }}
                  style={{ background: 'var(--forest-050)', color: 'var(--forest-500)', border: 'none', borderRadius: 'var(--r-md)', padding: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  Pick a start date
                </button>
              </div>
              {showDatePick && (
                <div style={{ marginTop: '14px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--gray)', lineHeight: 1.55, marginBottom: '10px' }}>Exposure needs 3 days you can really eat {pendingStart.food.toLowerCase()}. Pick a day that clears your calendar.</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {Array.from({ length: 14 }).map((_, di) => {
                      const t = new Date()
                      const d = new Date(t.getFullYear(), t.getMonth(), t.getDate() + di)
                      const ds = localDateString(d)
                      const far = di > 7
                      const selected = farPick === ds
                      return (
                        <button key={ds} disabled={!!starting}
                          onClick={() => {
                            if (far) { setFarPick(ds) }
                            else { startReintro(pendingStart.food, pendingStart.level, ds); setPendingStart(null); setShowDatePick(false); setFarPick(null) }
                          }}
                          style={{ width: 'calc((100% - 36px) / 7)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px', background: selected ? 'var(--forest-500)' : 'var(--paper)', border: 'none', borderRadius: '999px', padding: '8px 0 7px', cursor: 'pointer', boxShadow: selected ? 'var(--shadow-pill)' : 'var(--shadow-1)', transition: 'all 0.16s' }}>
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', letterSpacing: '0', color: selected ? 'rgba(255,255,255,0.75)' : '#8A8A82' }}>{d.toLocaleDateString('en-US', { weekday: 'narrow' })}</span>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: selected ? '#FFFFFF' : 'var(--ink)' }}>{d.getDate()}</span>
                        </button>
                      )
                    })}
                  </div>
                  {farPick && (
                    <>
                      <div style={{ marginTop: '10px', background: 'var(--tint-warm)', border: 'none', borderRadius: 'var(--r-sm)', padding: '9px 11px', fontSize: '11.5px', color: 'var(--ink-soft)', lineHeight: 1.5 }}>That is a while away. Your elimination holds until then.</div>
                      <button disabled={!!starting}
                        onClick={() => { startReintro(pendingStart.food, pendingStart.level, farPick); setPendingStart(null); setShowDatePick(false); setFarPick(null) }}
                        style={{ marginTop: '8px', width: '100%', background: 'var(--forest-500)', color: '#FFFFFF', border: 'none', borderRadius: 'var(--r-md)', padding: '12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--shadow-pill)' }}>
                        Start on {(() => { const [y, m, dd] = farPick.split('-').map(Number); return new Date(y, m - 1, dd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) })()}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* AVAILABLE FOODS BY TIER */}
        {!activeReintro && (
          <>
            {completedCycles.length > 0 && getRemainingFoods('Low').length > 0 && (
              <div className="sn-rise" style={{ background: 'linear-gradient(135deg, rgba(139,174,138,0.13), rgba(139,174,138,0.04)), #FFFFFF', border: 'none', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-2)', padding: '20px', marginBottom: '16px' }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 500, textTransform: 'none', letterSpacing: '0', color: 'var(--forest-500)', marginBottom: '8px' }}>Cycle complete · {completedCycles.length} verdict{completedCycles.length !== 1 ? 's' : ''} earned</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 400, letterSpacing: '-0.3px', color: 'var(--ink)', marginBottom: '4px' }}>Choose your next food.</div>
                <div style={{ fontSize: '13px', color: 'var(--gray)', lineHeight: 1.55 }}>Your {completedCycles[completedCycles.length - 1].food.toLowerCase()} verdict is entered in your verdicts. Pick the next food below to start a fresh 14-day cycle, day 1 starts when you do.</div>
              </div>
            )}
            {/* DAY-57 CEREMONY: first sight of the unlocked picker, before any
                cycle has run. Disappears the moment the first verdict lands. */}
            {lowUnlocked && completedCycles.length === 0 && (
              <div className="sn-rise" style={{ position: 'relative', overflow: 'hidden', background: 'radial-gradient(120% 90% at 85% 0%, rgba(139,174,138,0.3), transparent 55%), linear-gradient(160deg, var(--forest-700) 0%, var(--forest-900) 70%)', borderRadius: '28px', padding: '24px 22px 26px', marginBottom: '16px', boxShadow: 'var(--shadow-3)' }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 500, letterSpacing: '0', color: '#8BAE8A', textTransform: 'none', marginBottom: '10px' }}>Reintroduction</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 400, letterSpacing: '-0.3px', color: '#FAF8F4', lineHeight: 1.25, marginBottom: '8px' }}>56 clean days on the record. Testing begins.</div>
                <div style={{ fontSize: '13px', color: 'rgba(250,248,244,0.7)', lineHeight: 1.6 }}>Your foods are ordered by how often you eat them. Each one gets a 14 day trial and earns its verdict.</div>
              </div>
            )}
            {lowUnlocked && (
              <>
                {getRemainingFoods('Low').length > 0 && <div className="rt-section-label">Your foods, in order</div>}
                {getRemainingFoods('Low').map((food, i) => (
                  <div key={food.name} className={`rt-food-card${i === 0 ? ' recommended' : ''} ${['sn-rise', 'sn-rise-2', 'sn-rise-3', 'sn-rise-4'][Math.min(i, 3)]}`}>
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
                    <button className="rt-start-btn" disabled={!!starting} onClick={() => { setShowDatePick(false); setFarPick(null); setPendingStart({ food: food.name, level: food.level }) }}>
                      {starting === food.name ? 'Starting...' : 'Start cycle'}
                    </button>
                  </div>
                ))}
              </>
            )}

            {/* The Moderate/High tier sections and their unlock teasers are
                retired: every track now runs ONE frequency-ordered queue that
                unlocks whole at day 57 (the doctrine). */}

            {/* RETEST: only verdicts ruled on conflicting evidence (clean logs
                vs disputing testimony, not self-discounted) earn a re-run
                offer. A retest is a fresh 14-day cycle; the newest ruling
                replaces the old one everywhere. */}
            {lowUnlocked && retestable.length > 0 && (
              <>
                <div className="rt-section-label" style={{ marginTop: '22px' }}>Retest available: ruled on conflicting evidence</div>
                {retestable.map(cyc => (
                  <div key={'retest-' + cyc.food} className="rt-food-card sn-rise-4">
                    <div className="rt-food-left">
                      <div className="rt-food-rank">↻</div>
                      <div>
                        <div className="rt-food-name">{cyc.food}</div>
                        <div className="rt-food-freq">Ruled {cyc.verdict}. Your logs and your account of it disagreed.</div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', letterSpacing: '0', color: '#8A8A82', marginTop: '2px' }}>A re-run replaces this verdict with whatever the new trial earns</div>
                      </div>
                    </div>
                    <button className="rt-start-btn" disabled={!!starting} onClick={() => { setShowDatePick(false); setFarPick(null); setPendingStart({ food: cyc.food, level: cyc.sensitivity_level || 'Low' }) }}>
                      {starting === cyc.food ? 'Starting...' : 'Retest'}
                    </button>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {/* TESTED LEDGER. the trial record, expandable evidence per cycle */}
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
