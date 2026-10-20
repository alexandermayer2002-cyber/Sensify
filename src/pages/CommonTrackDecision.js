import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { localDateString } from '../utils/dateUtils'
import { TIER_META, symptomsAreGI } from '../utils/protocolEngine'

// ============================================================
// CommonTrackDecision
// Shown when a user has been assigned the "common" track and
// hasn't yet decided. Two surfaces:
//   1. A one-time explanation popup (first landing).
//   2. A persistent dashboard card: re-readable explanation,
//      tier picker (Test 2 / Test 8), and the choice to start
//      the protocol or just track instead.
// Writes protocol_tier + track_decision to the profile.
// ============================================================

const css = `
  .ctd-overlay { position: fixed; inset: 0; background: rgba(20,20,18,0.55); backdrop-filter: blur(4px); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .ctd-modal { background: var(--paper); border-radius: var(--r-lg); max-width: 460px; width: 100%; padding: 28px; position: relative; max-height: 88vh; overflow-y: auto; box-shadow: var(--shadow-3); }
  .ctd-x { position: absolute; top: 16px; right: 16px; width: 30px; height: 30px; border-radius: 50%; border: none; background: rgba(0,0,0,0.06); cursor: pointer; font-size: 16px; color: #555; display: flex; align-items: center; justify-content: center; }
  .ctd-eyebrow { font-family: var(--font-mono); font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.17em; color: var(--forest-500); margin-bottom: 10px; }
  .ctd-h { font-family: var(--font-display); font-size: 28px; font-weight: 300; line-height: 1.15; letter-spacing: -0.3px; margin-bottom: 14px; color: var(--ink); }
  .ctd-h em { font-style: italic; color: #3D5C3C; }
  .ctd-p { font-size: 14px; line-height: 1.65; color: var(--ink-soft); margin-bottom: 14px; }
  .ctd-card { background: var(--paper); border: none; border-radius: var(--r-lg); box-shadow: var(--shadow-2); padding: 22px; margin-bottom: 14px; }
  .ctd-card-head { display: flex; align-items: center; justify-content: space-between; cursor: pointer; }
  .ctd-card-title { font-size: 15px; font-weight: 600; color: var(--ink); }
  .ctd-card-chev { font-size: 13px; color: #8A8A82; transition: transform 0.2s; }
  .ctd-card-chev.open { transform: rotate(180deg); }
  .ctd-card-body { margin-top: 14px; }
  .ctd-tier-label { font-family: var(--font-mono); font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.17em; color: var(--forest-500); margin: 18px 0 10px; }
  .ctd-tier { border: none; background: var(--tint-warm); border-radius: var(--r-md); padding: 16px; margin-bottom: 10px; cursor: pointer; transition: transform var(--t-fast) var(--ease), box-shadow var(--t-fast) var(--ease), background var(--t-fast) var(--ease); }
  @media (hover: hover) { .ctd-tier:hover { transform: translateY(-1px); box-shadow: var(--shadow-1); } }
  .ctd-tier.on { background: linear-gradient(135deg, rgba(139,174,138,0.18), rgba(139,174,138,0.05)), var(--paper); box-shadow: var(--shadow-2); }
  .ctd-tier-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
  .ctd-tier-name { font-size: 15px; font-weight: 600; color: var(--ink); }
  .ctd-tier-rec { font-size: 9px; font-family: var(--font-mono); font-weight: 500; text-transform: uppercase; letter-spacing: 0.12em; background: var(--forest-500); color: white; padding: 4px 9px; border-radius: 999px; box-shadow: var(--shadow-pill); }
  .ctd-tier-foods { font-size: 12.5px; color: var(--gray); line-height: 1.5; }
  .ctd-radio { width: 18px; height: 18px; border-radius: 50%; border: 2px solid var(--forest-150); background: var(--paper); flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
  .ctd-radio.on { border-color: var(--forest-500); }
  .ctd-radio.on::after { content: ''; width: 9px; height: 9px; border-radius: 50%; background: var(--forest-500); }
  .ctd-btn { width: 100%; padding: 14px; border-radius: var(--r-md); border: none; font-size: 14px; font-weight: 700; cursor: pointer; margin-top: 8px; transition: transform var(--t-fast) var(--ease), opacity var(--t-fast) var(--ease); }
  @media (hover: hover) { .ctd-btn:hover { transform: translateY(-1px); } }
  .ctd-btn.primary { background: var(--forest-500); color: white; box-shadow: var(--shadow-pill); }
  .ctd-btn.primary:disabled { background: #F0EEE6; color: rgba(32,36,31,0.35); border: none; box-shadow: none; cursor: not-allowed; transform: none; }
  .ctd-btn.ghost { background: transparent; color: #8A8A82; font-weight: 500; font-size: 13px; box-shadow: none; }
  .ctd-mascot { width: 40px; height: 40px; margin-bottom: 14px; }
`

function ExplanationBody({ profile, flaggedCount }) {
  // Two scripts: the clean-panel story, and the low-flag story. Telling a
  // flagged user their panel came back clean contradicts their own lab.
  if (flaggedCount > 0) {
    return (
      <>
        <p className="ctd-p">
          Your lab flagged {flaggedCount === 1 ? 'one food' : `${flaggedCount} foods`}, all at low levels. That's a real finding, and {flaggedCount === 1 ? 'it joins' : 'they join'} your elimination either way. But low-level flags alone rarely explain real symptoms, so the lab is the start of the answer, not the whole of it.
        </p>
        <p className="ctd-p">
          Some of the most common triggers, especially digestive ones like FODMAPs, don't show up on a lab panel at all. The most reliable next step is to test the usual suspects directly, alongside your flagged {flaggedCount === 1 ? 'food' : 'foods'}, through the same structured elimination and reintroduction the protocol is built on.
        </p>
        <p className="ctd-p">
          You choose how thorough to go. And if you'd rather not run the full protocol right now, you can simply track your meals and symptoms instead, and start anytime.
        </p>
      </>
    )
  }
  return (
    <>
      <p className="ctd-p">
        Your lab panel came back without clear food flags. That's actually useful information, not a dead end. It means the most common antibody-based sensitivities aren't the obvious culprit.
      </p>
      <p className="ctd-p">
        But you're dealing with real symptoms, and some of the most common triggers, especially digestive ones like FODMAPs, don't show up on a lab panel at all. So the most reliable next step is to test the usual suspects directly, through the same structured elimination and reintroduction the protocol is built on.
      </p>
      <p className="ctd-p">
        You choose how thorough to go. And if you'd rather not run the full protocol right now, you can simply track your meals and symptoms instead, and start anytime.
      </p>
    </>
  )
}

export default function CommonTrackDecision({ session, profile, flaggedCount = 0, onDecided }) {
  const [showPopup, setShowPopup] = useState(!profile?.seen_track_intro)
  const [expanded, setExpanded] = useState(false)
  const [tier, setTier] = useState(null)
  const [labFoods, setLabFoods] = useState([])
  const [tierFreq, setTierFreq] = useState({})   // { foodName: freqValue } — measured, not assumed
  const FREQ_OPTS = [
    ['daily', 'Daily'], ['3-5x', '3\u20135x/week'], ['1-2x', '1\u20132x/week'],
    ['rarely', 'Rarely'], ['almost-never', 'Almost never'], ['never', 'Never'],
  ]
  useEffect(() => {
    (async () => {
      try {
        const { data: lab } = await supabase.from('lab_results').select('foods').eq('user_id', session.user.id).order('submitted_at', { ascending: false }).limit(1).maybeSingle()
        setLabFoods((lab?.foods || []).filter(f => f.level && f.level !== 'No sensitivity'))
      } catch (e) {}
    })()
  }, [])
  const [saving, setSaving] = useState(false)
  const gi = symptomsAreGI(profile)
  // Recommend Test 8 for GI symptoms (FODMAP coverage), else Test 2 as the lighter start.
  const recommendedTier = gi ? 2 : 1

  const dismissPopup = async () => {
    setShowPopup(false)
    try {
      await supabase.from('profiles').update({ seen_track_intro: true }).eq('id', session.user.id)
    } catch (e) {}
  }

  const startProtocol = async () => {
    if (!tier) return
    setSaving(true)
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
    const mergedFreq = { ...(profile?.food_frequency || {}), ...tierFreq }
    const { error } = await supabase.from('profiles').update({
      protocol_tier: tier,
      food_frequency: mergedFreq,
      track_decision: 'active',
      program_phase: 'elimination',
      protocol_start_date: localDateString(tomorrow),
      latest_insight: null,
      latest_insight_week: null,
    }).eq('id', session.user.id)
    setSaving(false)
    if (error) { alert('Could not start protocol: ' + error.message); return }
    onDecided && onDecided()
  }

  const declineToTrack = async () => {
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      track_decision: 'declined',
      program_phase: 'tracking',
    }).eq('id', session.user.id)
    setSaving(false)
    if (error) { alert('Could not save: ' + error.message); return }
    onDecided && onDecided()
  }

  return (
    <>
      <style>{css}</style>

      {/* One-time explanation popup */}
      {showPopup && (
        <div className="ctd-overlay" onClick={dismissPopup}>
          <div className="ctd-modal" onClick={e => e.stopPropagation()}>
            <button className="ctd-x" onClick={dismissPopup}>✕</button>
            <div className="ctd-eyebrow">Your results are in</div>
            {flaggedCount > 0
              ? <div className="ctd-h">Your flags are real. <em>So is what labs miss.</em></div>
              : <div className="ctd-h">A clean panel is <em>still an answer.</em></div>}
            <ExplanationBody profile={profile} flaggedCount={flaggedCount} />
            <button className="ctd-btn primary" onClick={dismissPopup}>Got it</button>
          </div>
        </div>
      )}

      {/* Persistent dashboard decision card */}
      <div className="ctd-card sn-rise">
        <div className="ctd-card-head" onClick={() => setExpanded(e => !e)}>
          <span className="ctd-card-title">Choose your path</span>
          <span className={`ctd-card-chev${expanded ? ' open' : ''}`}>▾</span>
        </div>
        {expanded && (
          <div className="ctd-card-body">
            <ExplanationBody profile={profile} flaggedCount={flaggedCount} />
          </div>
        )}

        <div className="ctd-tier-label">How thorough do you want to go?</div>

        {[1, 2].map(t => {
          const meta = TIER_META[t]
          const impact = t === 1
            ? { what: 'You eliminate and test the two most common trigger foods.', arc: 'Eight clean weeks, then a 14-day test cycle for each food.', tradeoff: 'The easiest version to stick to, and the fastest to answers. But only these two foods get verdicts. If your symptoms come from something else, this round will not find it.' }
            : { what: 'You eliminate all eight common trigger groups at once.', arc: 'The same eight weeks, then every food tested back one at a time, which adds several months of cycles.', tradeoff: 'The strictest eight weeks and the longest road. In return, all eight get their own earned verdict, and the finished map covers the full set.' }
          return (
            <div key={t} className={`ctd-tier${tier === t ? ' on' : ''}`} onClick={() => setTier(t)}>
              <div className="ctd-tier-top">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className={`ctd-radio${tier === t ? ' on' : ''}`} />
                  <span className="ctd-tier-name">{meta.label}</span>
                </div>
                {recommendedTier === t && <span className="ctd-tier-rec">Suggested from your intake</span>}
              </div>
              <div className="ctd-tier-foods">{meta.foods.map(f => f.name).join(', ')}</div>
              <div style={{ fontSize: '12px', color: '#5A5A52', lineHeight: 1.6, marginTop: '8px' }}>{impact.what} {impact.arc}</div>
              <div style={{ fontSize: '11.5px', color: '#7A7A72', lineHeight: 1.6, marginTop: '6px' }}>{impact.tradeoff}</div>
            </div>
          )
        })}
        {labFoods.length > 0 && (
          <div style={{ background: 'linear-gradient(135deg, rgba(139,174,138,0.15), rgba(139,174,138,0.05))', borderRadius: 'var(--r-md)', padding: '13px 14px', fontSize: '12.5px', color: 'var(--forest-500)', lineHeight: 1.6, marginBottom: '14px' }}>
            Your lab also flagged {labFoods.map(f => f.name).join(', ')}. Whichever you choose, {labFoods.length === 1 ? 'it' : 'they'} come{labFoods.length === 1 ? 's' : ''} out with your trigger foods and get{labFoods.length === 1 ? 's' : ''} tested too.
          </div>
        )}

        {tier && (
          <div style={{ background: 'var(--tint-warm)', border: 'none', borderRadius: 'var(--r-md)', padding: '16px', marginBottom: '14px' }}>
            <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>How often do you eat these?</div>
            <div style={{ fontSize: '12px', color: 'var(--gray)', lineHeight: 1.55, marginBottom: '12px' }}>Your testing order is built from how you actually eat. The foods in your life most get answered first.</div>
            {TIER_META[tier].foods.map(f => (
              <div key={f.name} style={{ marginBottom: '12px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.17em', color: 'var(--forest-500)', marginBottom: '7px' }}>{f.name}</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {FREQ_OPTS.map(([v, l]) => (
                    <button key={v} onClick={() => setTierFreq(prev => ({ ...prev, [f.name]: v }))} style={{
                      padding: '7px 13px', borderRadius: '999px', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer',
                      border: 'none',
                      background: tierFreq[f.name] === v ? 'var(--forest-500)' : 'var(--paper)',
                      color: tierFreq[f.name] === v ? '#fff' : 'var(--gray)',
                      boxShadow: tierFreq[f.name] === v ? 'var(--shadow-pill)' : 'var(--shadow-1)',
                      transition: 'all 0.16s',
                    }}>{l}</button>
                  ))}
                </div>
              </div>
            ))}
            {TIER_META[tier].foods.some(f => tierFreq[f.name] === 'never') && (
              <div style={{ fontSize: '11.5px', color: 'var(--ink-soft)', background: 'var(--paper)', boxShadow: 'var(--shadow-1)', borderRadius: 'var(--r-sm)', padding: '10px 12px', lineHeight: 1.55 }}>
                Foods you never eat are not tested, since there is nothing to learn from removing them. If these foods are not part of your diet, the other path may fit you better.
              </div>
            )}
          </div>
        )}

        <button className="ctd-btn primary" disabled={!tier || saving || !TIER_META[tier].foods.every(f => tierFreq[f.name])} onClick={startProtocol}>
          {saving ? 'Starting...' : 'Start my protocol'}
        </button>
        <button className="ctd-btn ghost" disabled={saving} onClick={declineToTrack}>
          I'd rather just track for now
        </button>
      </div>
    </>
  )
}
