import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import { normalizeMilestones, serializeMilestones } from '../utils/aiInsights'

// HOUSEHOLD CARD
// Two components live here:
//   1. HouseholdCard (default): the PUBLIC read-only page rendered when the
//      URL carries ?household=<token>. No auth, no session. It shows exactly
//      two things: what the user is avoiding, and this week's trial food.
//      No symptoms, no scores, no verdicts, first name only.
//   2. HouseholdShareCard: the small card the signed-in user sees on their
//      dashboard to mint, copy, and turn off the share link. The token lives
//      in their own profiles.shown_milestones under household_token, written
//      through the normal authenticated client.

const s = {
  wrap: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', color: 'var(--ink)', boxSizing: 'border-box' },
  card: { background: 'var(--paper)', border: 'none', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-2)', padding: '28px', width: '100%', maxWidth: '420px', boxSizing: 'border-box' },
  micro: { marginBottom: '14px' },
  headline: { fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 300, lineHeight: 1.2, marginBottom: '22px' },
  sectionLabel: { marginBottom: '10px' },
  chips: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '22px' },
  chip: { background: 'var(--forest-100)', color: 'var(--forest-500)', borderRadius: 'var(--r-pill)', padding: '7px 14px', fontSize: '13.5px', fontWeight: 500 },
  empty: { fontSize: '13.5px', color: 'var(--gray)', marginBottom: '22px' },
  trial: { background: 'linear-gradient(135deg, rgba(139, 174, 138, 0.15), rgba(139, 174, 138, 0.05))', borderRadius: 'var(--r-md)', padding: '16px', marginBottom: '22px' },
  trialLabel: { marginBottom: '8px' },
  trialLine: { fontSize: '14px', lineHeight: 1.5, color: 'var(--ink)' },
  footer: { borderTop: '1px solid rgba(0,0,0,0.07)', paddingTop: '14px', fontSize: '12px', lineHeight: 1.5, color: 'var(--gray)' },
  centerText: { fontSize: '14px', color: 'var(--gray)', textAlign: 'center' },
}

export default function HouseholdCard({ token }) {
  const [state, setState] = useState('loading') // loading | ready | notfound | error
  const [data, setData] = useState(null)

  useEffect(() => {
    let alive = true
    fetch('/.netlify/functions/household-card?token=' + encodeURIComponent(token || ''))
      .then(r => {
        if (r.status === 404) { if (alive) setState('notfound'); return null }
        if (!r.ok) throw new Error('bad status')
        return r.json()
      })
      .then(d => { if (alive && d) { setData(d); setState('ready') } })
      .catch(() => { if (alive) setState('error') })
    return () => { alive = false }
  }, [token])

  if (state === 'loading') return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div className="sn-micro sn-micro-dim" style={s.micro}>Sensify · Household card</div>
        <div style={s.centerText}>Loading the card...</div>
      </div>
    </div>
  )

  if (state === 'notfound' || state === 'error') return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div className="sn-micro sn-micro-dim" style={s.micro}>Sensify · Household card</div>
        <div style={{ ...s.headline, fontSize: '24px' }}>This card is not available.</div>
        <div style={{ ...s.centerText, textAlign: 'left' }}>
          {state === 'notfound'
            ? 'The link may have been turned off. Ask the person who sent it for a fresh one.'
            : 'Something went wrong loading the card. Please try again in a moment.'}
        </div>
      </div>
    </div>
  )

  const name = data.first_name || 'someone you cook for'
  const avoiding = data.avoiding || []
  const trial = data.trial

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div className="sn-micro sn-micro-dim" style={s.micro}>Sensify · Household card</div>
        <div style={s.headline}>Cooking for {name}?</div>

        <div className="sn-micro" style={s.sectionLabel}>Currently off the plate</div>
        {avoiding.length > 0 ? (
          <div style={s.chips}>
            {avoiding.map(f => {
              // Entries may be strings (legacy) or {name, status}; a ruled
              // Limit/Avoid food carries its ruling so the cook sees it.
              const nm = typeof f === 'string' ? f : f.name
              const stLabel = typeof f === 'string' ? null : f.status === 'avoid' ? 'AVOID' : f.status === 'limit' ? 'SMALL AMOUNTS ONLY' : null
              return (
                <span key={nm} style={s.chip}>
                  {nm}
                  {stLabel && <span style={{ marginLeft: 6, fontFamily: 'DM Mono, monospace', fontSize: 8, letterSpacing: '0.8px', color: f.status === 'avoid' ? '#A32D2D' : '#8A5410' }}>{stLabel}</span>}
                </span>
              )
            })}
          </div>
        ) : (
          <div style={s.empty}>Nothing is off the plate right now.</div>
        )}

        {trial && (
          <div style={s.trial}>
            <div className="sn-micro" style={s.trialLabel}>This week's trial: {trial.food}</div>
            <div style={s.trialLine}>
              {trial.phase === 'washout'
                ? `${trial.food} is off again while the record settles. Everything on the list stays off.`
                : `${trial.food} is back on the plate on purpose this week. Everything else stays off.`}
            </div>
          </div>
        )}

        <div style={s.footer}>This card updates automatically. Nothing else about the program is shared.</div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// The signed-in user's share card. The dashboard engineer places this.
// Minting writes a random 24-hex-char token into the user's own
// shown_milestones via the authenticated client (read-merge-write, same
// pattern as markMilestoneShown, so other milestone keys are never clobbered).
// ---------------------------------------------------------------------------

// Compact utility row before minting (one line + button); the link tools only
// appear after a link exists. Same logic as before, quieter ceremony.
const sc = {
  card: { padding: '16px 18px' },
  row: { display: 'flex', alignItems: 'center', gap: '14px' },
  micro: { marginBottom: '4px' },
  line: { fontSize: '12px', lineHeight: 1.5, color: 'var(--gray)' },
  btn: { background: 'var(--forest-500)', color: 'white', border: 'none', borderRadius: 'var(--r-md)', padding: '11px 16px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--shadow-pill)', whiteSpace: 'nowrap', flexShrink: 0 },
  linkRow: { display: 'flex', gap: '8px', marginTop: '12px' },
  linkInput: { flex: 1, minWidth: 0, border: 'none', borderRadius: 'var(--r-sm)', padding: '10px 12px', fontSize: '12.5px', background: 'var(--tint-warm)', color: 'var(--ink)', outline: 'none', fontFamily: 'var(--font-mono)', boxSizing: 'border-box' },
  copyBtn: { background: 'var(--forest-500)', color: 'white', border: 'none', borderRadius: 'var(--r-sm)', padding: '10px 14px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' },
  statusRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginTop: '10px' },
  liveNote: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--gray)' },
  liveDot: { width: '6px', height: '6px', borderRadius: '50%', background: 'var(--forest-300)', flexShrink: 0 },
  off: { background: 'none', border: 'none', padding: 0, fontSize: '12px', color: 'var(--avoid-700)', cursor: 'pointer', textDecoration: 'underline', flexShrink: 0 },
  err: { background: 'var(--avoid-100)', color: 'var(--avoid-700)', borderRadius: 'var(--r-sm)', padding: '9px 12px', fontSize: '12.5px', marginTop: '10px' },
}

const mintToken = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(12)), b => b.toString(16).padStart(2, '0')).join('')

export function HouseholdShareCard({ session, profile, variant, phase, foods = [], trialFood = null }) {
  const [token, setToken] = useState(() => normalizeMilestones(profile?.shown_milestones).household_token || null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const t = normalizeMilestones(profile?.shown_milestones).household_token
    if (t) setToken(t)
  }, [profile])

  const userId = session?.user?.id
  const link = token ? window.location.origin + '/?household=' + token : null

  const createLink = async () => {
    if (!userId || busy) return
    setBusy(true); setError(null)
    try {
      // Fresh read-merge-write so concurrent milestone writers are not clobbered
      // and an already-minted token (another device) is reused, not replaced.
      const { data } = await supabase.from('profiles').select('shown_milestones').eq('id', userId).single()
      const current = normalizeMilestones(data?.shown_milestones)
      const t = current.household_token || mintToken()
      if (!current.household_token) {
        const { error: upErr } = await supabase.from('profiles')
          .update({ shown_milestones: serializeMilestones({ ...current, household_token: t }) })
          .eq('id', userId)
        if (upErr) throw upErr
      }
      setToken(t)
    } catch (e) {
      setError('Could not create the link. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const turnOff = async () => {
    if (!userId || busy) return
    setBusy(true); setError(null)
    try {
      const { data } = await supabase.from('profiles').select('shown_milestones').eq('id', userId).single()
      const current = normalizeMilestones(data?.shown_milestones)
      delete current.household_token
      const { error: upErr } = await supabase.from('profiles')
        .update({ shown_milestones: serializeMilestones(current) })
        .eq('id', userId)
      if (upErr) throw upErr
      setToken(null); setCopied(false)
    } catch (e) {
      setError('Could not turn off the link. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const copyLink = async () => {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch (e) {
      // Clipboard API unavailable: select the input so the user can copy by hand.
      if (inputRef.current) {
        inputRef.current.focus()
        inputRef.current.select()
      }
    }
  }

  if (variant === 'panel') {
    // Refresh 2026-11-13: the Home panel form. Same logic, one dark panel,
    // sentences not labels, no raw URL on screen (the input stays for the
    // clipboard fallback only).
    const what = trialFood ? `what is off your plate and that ${String(trialFood).toLowerCase()} is on trial` : phase === 'complete' ? 'which foods you avoid' : 'what is off your plate right now'
    return (
      <div style={hp.panel}>
        <div>
          <h3 style={hp.h3}>{token ? 'Your household card is live.' : 'A card for whoever cooks for you.'}</h3>
          <p style={hp.p}>
            {token
              ? `Anyone with your link sees ${what}, nothing more. It updates itself as the protocol moves, so nobody has to ask.`
              : `One link that shows ${what}, nothing more. It updates itself as the protocol moves, so nobody has to ask.`}
          </p>
          {(foods.length > 0 || trialFood) && (
            <div style={hp.chips}>{trialFood ? <span key="trial" style={{ ...hp.chip, background: 'rgba(236,231,220,.14)' }}>{trialFood}, on trial</span> : null}{foods.map(f => <span key={f} style={hp.chip}>{f}</span>)}</div>
          )}
          {error && <p style={{ ...hp.p, color: '#F2C7C7', marginTop: 10 }}>{error}</p>}
        </div>
        <div style={hp.actions}>
          {token ? (
            <>
              <button style={{ ...hp.btn, opacity: busy ? 0.6 : 1 }} onClick={copyLink} disabled={busy}>{copied ? 'Link copied' : 'Copy the link'}</button>
              <button style={{ ...hp.quiet, opacity: busy ? 0.6 : 1 }} onClick={turnOff} disabled={busy}>Turn the link off</button>
              <input ref={inputRef} value={link} readOnly aria-hidden="true" tabIndex={-1} style={hp.hidden} onFocus={e => e.target.select()} />
            </>
          ) : (
            <button style={{ ...hp.btn, opacity: busy ? 0.6 : 1 }} onClick={createLink} disabled={busy}>{busy ? 'Creating the link' : 'Create the link'}</button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="sn-card" style={sc.card}>
      <div style={sc.row}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="sn-micro sn-micro-dim" style={sc.micro}>Household card</div>
          <div style={sc.line}>
            {!token
              ? 'A link for whoever cooks for you: what is off the plate right now, nothing else.'
              : 'Your card is live. Anyone with this link sees what is off the plate and this week’s trial, nothing else.'}
          </div>
        </div>
        {!token && (
          <button style={{ ...sc.btn, opacity: busy ? 0.6 : 1 }} onClick={createLink} disabled={busy}>
            {busy ? 'Creating...' : 'Create link'}
          </button>
        )}
      </div>
      {error && <div style={sc.err}>{error}</div>}
      {token && (
        <>
          <div style={sc.linkRow}>
            <input ref={inputRef} style={sc.linkInput} value={link} readOnly onFocus={e => e.target.select()} />
            <button style={{ ...sc.copyBtn, opacity: busy ? 0.6 : 1 }} onClick={copyLink} disabled={busy}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div style={sc.statusRow}>
            <span style={sc.liveNote}><span style={sc.liveDot} />Updates by itself as your protocol moves</span>
            <button style={{ ...sc.off, opacity: busy ? 0.6 : 1 }} onClick={turnOff} disabled={busy}>
              Turn off link
            </button>
          </div>
        </>
      )}
    </div>
  )
}

const hp = {
  panel: { background: '#1E3327', color: '#ECE7DC', borderRadius: 18, padding: '26px 28px', minHeight: 240, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 20 },
  h3: { fontFamily: "var(--font-display, 'Fraunces', serif)", fontWeight: 400, fontSize: 22, letterSpacing: '-.015em', margin: '0 0 8px', lineHeight: 1.1 },
  p: { fontSize: 15, lineHeight: 1.55, color: 'rgba(236,231,220,.78)', margin: 0 },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  chip: { border: '1px solid rgba(236,231,220,.3)', borderRadius: 999, padding: '6px 12px', fontSize: 13 },
  actions: { display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' },
  btn: { background: '#ECE7DC', color: '#1E3327', border: 0, borderRadius: 999, padding: '14px 22px', fontWeight: 600, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' },
  quiet: { background: 'none', border: 0, padding: 0, color: 'rgba(236,231,220,.6)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', textUnderlineOffset: 4 },
  hidden: { position: 'absolute', opacity: 0, width: 1, height: 1, pointerEvents: 'none' },
}
