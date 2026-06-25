import React, { useState } from 'react'
import { supabase } from '../supabase'

// ============================================================
// TrackingLanding
// Shown to a user who chose to skip the structured protocol and
// just track instead (track_decision === 'declined').
// Honest readout + the door back to the full protocol (reversible).
// The actual tracking tools (symptom log, meal log, Ask Sensify)
// live in the existing hub/tabs; this is the home-tab framing + revert.
// ============================================================

const css = `
  .trk-card { background: white; border: 1px solid rgba(0,0,0,0.08); border-radius: 16px; padding: 22px; margin-bottom: 14px; }
  .trk-eyebrow { font-family: 'DM Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #8BAE8A; margin-bottom: 10px; }
  .trk-h { font-family: 'Fraunces', serif; font-size: 24px; font-weight: 300; line-height: 1.2; margin-bottom: 14px; color: #1C1C1C; }
  .trk-h em { font-style: italic; color: #3D5C3C; }
  .trk-p { font-size: 14.5px; line-height: 1.65; color: #4A4A45; margin-bottom: 14px; }
  .trk-tools { background: #F2F5EF; border-radius: 12px; padding: 16px; margin: 16px 0; }
  .trk-tools-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #3D5C3C; margin-bottom: 10px; }
  .trk-tool-row { display: flex; align-items: center; gap: 10px; font-size: 13.5px; color: #2A2A28; padding: 6px 0; }
  .trk-tool-dot { width: 6px; height: 6px; border-radius: 50%; background: #3D5C3C; flex-shrink: 0; }
  .trk-revert { background: #1C1C1C; border-radius: 14px; padding: 18px; margin-bottom: 14px; }
  .trk-revert-title { font-size: 14px; font-weight: 600; color: white; margin-bottom: 4px; }
  .trk-revert-sub { font-size: 12.5px; color: rgba(255,255,255,0.55); line-height: 1.5; margin-bottom: 14px; }
  .trk-revert-btn { width: 100%; padding: 12px; border-radius: 10px; border: none; background: #8BAE8A; color: #1C1C1C; font-size: 13.5px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; }
  .trk-revert-btn:disabled { opacity: 0.6; cursor: not-allowed; }
`

export default function TrackingLanding({ session, profile, onReverted }) {
  const [reverting, setReverting] = useState(false)

  const revertToProtocol = async () => {
    setReverting(true)
    // Send them back into the decision flow — they re-choose a tier (or could
    // decline again). Clearing the decision returns them to the pending state.
    const { error } = await supabase.from('profiles').update({
      track_decision: 'pending',
      program_phase: 'awaiting_decision',
    }).eq('id', session.user.id)
    setReverting(false)
    if (error) { alert('Could not switch: ' + error.message); return }
    onReverted && onReverted()
  }

  return (
    <>
      <style>{css}</style>

      <div className="trk-card">
        <div className="trk-eyebrow">Your path</div>
        <div className="trk-h">You're tracking, <em>not testing.</em></div>
        <p className="trk-p">
          You've chosen to track rather than run the structured protocol. That's a completely valid path. Your panel came back clean, which means food sensitivities are less likely to be driving your symptoms, though we can't rule food out without structured testing.
        </p>
        <p className="trk-p">
          Use the tools below to log how you eat and feel, and Ask Sensify can help you notice patterns over time. If those patterns start pointing to food, you can begin the full protocol whenever you like.
        </p>

        <div className="trk-tools">
          <div className="trk-tools-label">What you can do</div>
          <div className="trk-tool-row"><span className="trk-tool-dot" />Log your symptoms day to day</div>
          <div className="trk-tool-row"><span className="trk-tool-dot" />Log your meals and what you eat</div>
          <div className="trk-tool-row"><span className="trk-tool-dot" />Ask Sensify to help spot patterns over time</div>
        </div>
      </div>

      <div className="trk-revert">
        <div className="trk-revert-title">Ready to find real answers?</div>
        <div className="trk-revert-sub">Whenever you're ready, you can begin the structured elimination protocol and start testing foods properly.</div>
        <button className="trk-revert-btn" disabled={reverting} onClick={revertToProtocol}>
          {reverting ? 'One moment...' : 'Start the full protocol'}
        </button>
      </div>
    </>
  )
}
