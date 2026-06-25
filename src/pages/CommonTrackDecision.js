import React, { useState } from 'react'
import { supabase } from '../supabase'
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
  .ctd-modal { background: #FAF8F4; border-radius: 20px; max-width: 460px; width: 100%; padding: 28px; position: relative; max-height: 88vh; overflow-y: auto; }
  .ctd-x { position: absolute; top: 16px; right: 16px; width: 30px; height: 30px; border-radius: 50%; border: none; background: rgba(0,0,0,0.06); cursor: pointer; font-size: 16px; color: #555; display: flex; align-items: center; justify-content: center; }
  .ctd-eyebrow { font-family: 'DM Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #8BAE8A; margin-bottom: 10px; }
  .ctd-h { font-family: 'Fraunces', serif; font-size: 26px; font-weight: 300; line-height: 1.15; margin-bottom: 14px; color: #1C1C1C; }
  .ctd-h em { font-style: italic; color: #3D5C3C; }
  .ctd-p { font-size: 14.5px; line-height: 1.65; color: #4A4A45; margin-bottom: 14px; }
  .ctd-card { background: white; border: 1px solid rgba(0,0,0,0.08); border-radius: 16px; padding: 20px; margin-bottom: 14px; }
  .ctd-card-head { display: flex; align-items: center; justify-content: space-between; cursor: pointer; }
  .ctd-card-title { font-size: 15px; font-weight: 600; color: #1C1C1C; }
  .ctd-card-chev { font-size: 13px; color: #8A8A82; transition: transform 0.2s; }
  .ctd-card-chev.open { transform: rotate(180deg); }
  .ctd-card-body { margin-top: 14px; }
  .ctd-tier-label { font-size: 12px; font-weight: 600; color: #3D5C3C; margin: 18px 0 10px; }
  .ctd-tier { border: 2px solid rgba(0,0,0,0.1); border-radius: 13px; padding: 15px; margin-bottom: 10px; cursor: pointer; transition: all 0.15s; }
  .ctd-tier.on { border-color: #3D5C3C; background: #EDF3ED; }
  .ctd-tier-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
  .ctd-tier-name { font-size: 15px; font-weight: 600; color: #1C1C1C; }
  .ctd-tier-rec { font-size: 9.5px; font-family: 'DM Mono', monospace; text-transform: uppercase; letter-spacing: 0.5px; background: #3D5C3C; color: white; padding: 2px 7px; border-radius: 5px; }
  .ctd-tier-foods { font-size: 12.5px; color: #7A7A72; line-height: 1.5; }
  .ctd-radio { width: 18px; height: 18px; border-radius: 50%; border: 2px solid #ccc; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
  .ctd-radio.on { border-color: #3D5C3C; }
  .ctd-radio.on::after { content: ''; width: 9px; height: 9px; border-radius: 50%; background: #3D5C3C; }
  .ctd-btn { width: 100%; padding: 14px; border-radius: 12px; border: none; font-size: 14px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; margin-top: 8px; }
  .ctd-btn.primary { background: #3D5C3C; color: white; }
  .ctd-btn.primary:disabled { background: #C3CDBF; cursor: not-allowed; }
  .ctd-btn.ghost { background: transparent; color: #8A8A82; font-weight: 500; font-size: 13px; }
  .ctd-mascot { width: 40px; height: 40px; margin-bottom: 14px; }
`

function ExplanationBody({ profile, flaggedCount }) {
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
    const { error } = await supabase.from('profiles').update({
      protocol_tier: tier,
      track_decision: 'active',
      program_phase: 'elimination',
      protocol_start_date: tomorrow.toISOString().split('T')[0],
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
            <div className="ctd-h">A clean panel is <em>still an answer.</em></div>
            <ExplanationBody profile={profile} flaggedCount={flaggedCount} />
            <button className="ctd-btn primary" onClick={dismissPopup}>Got it</button>
          </div>
        </div>
      )}

      {/* Persistent dashboard decision card */}
      <div className="ctd-card">
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
          const isRec = t === recommendedTier
          return (
            <div key={t} className={`ctd-tier${tier === t ? ' on' : ''}`} onClick={() => setTier(t)}>
              <div className="ctd-tier-top">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className={`ctd-radio${tier === t ? ' on' : ''}`} />
                  <span className="ctd-tier-name">{meta.label}</span>
                </div>
                {isRec && <span className="ctd-tier-rec">Recommended</span>}
              </div>
              <div className="ctd-tier-foods">{meta.foods.map(f => f.name).join(', ')}</div>
            </div>
          )
        })}

        <button className="ctd-btn primary" disabled={!tier || saving} onClick={startProtocol}>
          {saving ? 'Starting...' : 'Start my protocol'}
        </button>
        <button className="ctd-btn ghost" disabled={saving} onClick={declineToTrack}>
          I'd rather just track for now
        </button>
      </div>
    </>
  )
}
