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
  .trk-card { background: var(--paper); border: none; border-radius: var(--r-lg); box-shadow: var(--shadow-2); padding: 24px; margin-bottom: 14px; }
  .trk-eyebrow { font-family: var(--font-mono); font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.17em; color: var(--forest-500); margin-bottom: 10px; }
  .trk-h { font-family: var(--font-display); font-size: 27px; font-weight: 300; line-height: 1.2; letter-spacing: -0.3px; margin-bottom: 14px; color: var(--ink); }
  .trk-h em { font-style: italic; color: #3D5C3C; }
  .trk-p { font-size: 14px; line-height: 1.65; color: var(--ink-soft); margin-bottom: 14px; }
  .trk-tools { background: rgba(139,174,138,0.08); border-radius: var(--r-md); padding: 16px; margin: 16px 0; }
  .trk-tools-label { font-family: var(--font-mono); font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.17em; color: var(--forest-500); margin-bottom: 10px; }
  .trk-tool-row { display: flex; align-items: center; gap: 10px; font-size: 13.5px; color: var(--ink); padding: 12px 14px; }
  .trk-tool-btn { width: 100%; background: var(--paper); border: none; cursor: pointer; text-align: left; border-radius: var(--r-sm); box-shadow: var(--shadow-1); margin-bottom: 8px; transition: transform var(--t-fast) var(--ease), box-shadow var(--t-fast) var(--ease); }
  .trk-tool-btn:last-child { margin-bottom: 0; }
  @media (hover: hover) { .trk-tool-btn:hover { transform: translateY(-1px); box-shadow: 0 10px 24px -8px rgba(56,62,48,0.18); } }
  .trk-tool-go { margin-left: auto; color: var(--forest-500); font-size: 14px; }
  .trk-tool-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--forest-300); flex-shrink: 0; }
  .trk-revert { position: relative; overflow: hidden; color: #FAF8F4; border-radius: var(--r-lg); padding: 22px 20px; margin-bottom: 14px; background: radial-gradient(120% 90% at 85% 0%, rgba(139,174,138,0.32), transparent 55%), linear-gradient(160deg, var(--forest-700) 0%, var(--forest-900) 70%); box-shadow: var(--shadow-3); }
  .trk-revert-title { font-family: var(--font-display); font-size: 20px; font-weight: 400; letter-spacing: -0.2px; color: #FAF8F4; margin-bottom: 4px; }
  .trk-revert-sub { font-size: 12.5px; color: rgba(250,248,244,0.65); line-height: 1.5; margin-bottom: 14px; }
  .trk-revert-btn { width: 100%; padding: 13px; border-radius: var(--r-md); border: none; background: var(--forest-300); color: var(--forest-900); font-size: 13.5px; font-weight: 700; cursor: pointer; box-shadow: 0 10px 24px -6px rgba(139,174,138,0.4); transition: transform var(--t-fast) var(--ease); }
  @media (hover: hover) { .trk-revert-btn:hover { transform: translateY(-1px); } }
  .trk-revert-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
`

export default function TrackingLanding({ session, profile, onReverted, onOpenDaily, onOpenAsk }) {
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

      <div className="trk-card sn-rise">
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
          <button type="button" className="trk-tool-row trk-tool-btn" onClick={() => onOpenDaily && onOpenDaily()}>
            <span className="trk-tool-dot" />Log how today went<span className="trk-tool-go">→</span>
          </button>
          <button type="button" className="trk-tool-row trk-tool-btn" onClick={() => onOpenAsk && onOpenAsk()}>
            <span className="trk-tool-dot" />Log a meal with Ask Sensify<span className="trk-tool-go">→</span>
          </button>
          <button type="button" className="trk-tool-row trk-tool-btn" onClick={() => onOpenAsk && onOpenAsk()}>
            <span className="trk-tool-dot" />Ask Sensify to help spot patterns<span className="trk-tool-go">→</span>
          </button>
        </div>
      </div>

      <div className="trk-revert sn-rise-2">
        <div className="trk-revert-title">Ready to find real answers?</div>
        <div className="trk-revert-sub">Whenever you're ready, you can begin the structured elimination protocol and start testing foods properly.</div>
        <button className="trk-revert-btn" disabled={reverting} onClick={revertToProtocol}>
          {reverting ? 'One moment...' : 'Start the full protocol'}
        </button>
      </div>
    </>
  )
}
