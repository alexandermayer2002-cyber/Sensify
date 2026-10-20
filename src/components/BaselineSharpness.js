import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'

// Baseline Sharpness: makes the invisible work of elimination visible. As clean,
// consistently-logged days accumulate, the user's symptom baseline becomes a
// sharper instrument, which means more trustworthy verdicts later.
//
// THE FORMULA (honest math, no theater):
//   Start from an uncertainty of ±2.5 scale points on day zero and shrink toward
//   a floor of ±0.4 with a saturating curve driven by effective logged days:
//
//     effectiveDays = followedDays + 0.5 * (loggedDays - followedDays)
//       (every logged day counts; days where followed_protocol was true count
//        fully, off-plan days count half, so adherence genuinely strengthens it)
//
//     uncertainty = 0.4 + 2.1 * exp(-effectiveDays / 18)
//
//   Then widen by how noisy this scale's weekly check-in scores have been so far
//   (elimination-phase weeks only, since reintroduction weeks are intentionally
//   perturbed):
//
//     uncertainty += min(stddev(weeklyScores) * 0.3, 0.6)
//
//   Clamped to [0.4, 2.5]. Shown with ONE decimal, never more: the instrument is
//   not more precise than that.
//
// The "was ±X.X on day 3" figure in the caption is computed by the same curve at
// effectiveDays = 3 with no variance term, so the comparison is apples to apples
// with where this user actually started.
//
// PRESENTATION (redesign): the hero is the fuzzy-to-sharp BAND with labeled
// endpoints, so the card reads without numbers. The raw baseline values are
// subordinate, and a "How this works" toggle carries the honest explanation.
// All math above is untouched.

// Canonical scale order matches WeeklyCheckin.js; the first tracked scale is the
// user's primary. Only symptom baselines count (baseline_avg_* lifestyle fields
// on the profile are deliberately excluded).
const SCALES = [
  { id: 'bloating', label: 'bloating' },
  { id: 'gas', label: 'gas' },
  { id: 'reflux', label: 'reflux' },
  { id: 'digestive', label: 'digestive comfort' },
  { id: 'energy', label: 'energy' },
  { id: 'clarity', label: 'mental clarity' },
  { id: 'afternoon', label: 'afternoon energy' },
  { id: 'sleep', label: 'sleep' },
  { id: 'wellbeing', label: 'wellbeing' },
]

const U_FLOOR = 0.4
const U_SPAN = 2.1 // floor + span = ±2.5 starting uncertainty
const U_TAU = 18 // days to shrink by ~63% of the remaining span
const VAR_WEIGHT = 0.3
const VAR_CAP = 0.6
const U_START = U_FLOOR + U_SPAN // ±2.5

const baseUncertainty = (effectiveDays) => U_FLOOR + U_SPAN * Math.exp(-effectiveDays / U_TAU)

const stddev = (xs) => {
  if (xs.length < 2) return 0
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length
  const variance = xs.reduce((a, b) => a + (b - mean) * (b - mean), 0) / xs.length
  return Math.sqrt(variance)
}

const fmt1 = (n) => n.toFixed(1)

export default function BaselineSharpness({ session, profile }) {
  const [data, setData] = useState(null) // { loggedDays, scales: [{ id, label, baseline, uncertainty }] }
  const [showHow, setShowHow] = useState(false)
  const [sel, setSel] = useState(0)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        if (!session?.user?.id || !profile?.protocol_start_date) return
        const tracked = SCALES.filter(s => profile['baseline_' + s.id] != null)
        if (tracked.length === 0) return

        const startIso = String(profile.protocol_start_date).split('T')[0]
        const [{ data: factors, error: fErr }, { data: checkins, error: cErr }] = await Promise.all([
          supabase.from('daily_factors')
            .select('log_date, sleep, stress, hydration, followed_protocol')
            .eq('user_id', session.user.id)
            .gte('log_date', startIso),
          supabase.from('weekly_checkins')
            .select('answers, week_number, submitted_at')
            .eq('user_id', session.user.id)
            .order('submitted_at', { ascending: true }),
        ])
        if (fErr || cErr) return

        // Count distinct logged days since protocol start, and how many were on-plan.
        const byDate = new Map()
        for (const row of (factors || [])) {
          if (!row?.log_date) continue
          const prev = byDate.get(row.log_date)
          byDate.set(row.log_date, Boolean(prev) || row.followed_protocol === true)
        }
        const loggedDays = byDate.size
        if (loggedDays === 0) return
        let followedDays = 0
        byDate.forEach(followed => { if (followed) followedDays += 1 })
        const effectiveDays = followedDays + 0.5 * (loggedDays - followedDays)

        // Elimination-phase weekly scores per scale (reintro weeks are perturbed on purpose).
        const elimCheckins = (checkins || []).filter(c => c?.answers && c.answers._phase !== 'reintroduction')
        const scales = tracked.map(s => {
          const scores = elimCheckins
            .map(c => c.answers[s.id])
            .filter(v => typeof v === 'number' && isFinite(v))
          const u = Math.min(U_START, Math.max(U_FLOOR,
            baseUncertainty(effectiveDays) + Math.min(stddev(scores) * VAR_WEIGHT, VAR_CAP)))
          return { id: s.id, label: s.label, baseline: Number(profile['baseline_' + s.id]), uncertainty: u }
        })

        if (!cancelled) setData({ loggedDays, scales })
      } catch (e) {
        // Fail silent: this card never blocks the dashboard.
      }
    }
    load()
    return () => { cancelled = true }
  }, [session?.user?.id, profile])

  if (!data || !data.scales.length) return null

  const cur = data.scales[Math.min(sel, data.scales.length - 1)]
  const day3 = baseUncertainty(3)
  // Sharpness as a 0-to-1 journey from the day-one margin to the floor. This is
  // pure presentation: it reuses the same uncertainty the math always produced.
  const sharpFrac = Math.min(1, Math.max(0, (U_START - cur.uncertainty) / (U_START - U_FLOOR)))
  const fillPct = Math.max(3, sharpFrac * 100)
  const status = sharpFrac < 0.35 ? 'Still rough' : sharpFrac < 0.75 ? 'Settling' : 'Sharp'

  return (
    <div className="sn-card">
      <div style={b.header}>
        <span className="sn-micro">Baseline Sharpness</span>
        <span className="sn-micro sn-micro-dim">
          {data.loggedDays} {data.loggedDays === 1 ? 'day' : 'days'} logged
        </span>
      </div>

      <div style={b.headline}>How well we know your normal.</div>

      <div style={b.intro}>
        Every verdict is your trial week measured against your ordinary week. This is how precisely your ordinary week has been measured so far.{' '}
        <button type="button" style={b.howBtn} onClick={() => setShowHow(v => !v)}>
          {showHow ? 'Hide' : 'Why this matters'}
        </button>
      </div>

      {showHow && (
        <div style={b.howPanel}>
          Say you trial dairy and log bloating at 6. If your normal is 5, that is nothing. If your normal is 2, that is a clear spike. Same logs, opposite verdicts, decided entirely by how well your normal is known. Every day you log is one more measurement of it: on-plan days count in full, off-plan days count half, and noisy weeks widen the margin. A sharp baseline is what makes your verdicts trustworthy.
        </div>
      )}

      {data.scales.length > 1 && (
        <div style={b.tabs}>
          {data.scales.map((sc, i) => (
            <button
              key={sc.id}
              type="button"
              className={i === Math.min(sel, data.scales.length - 1) ? 'sn-chip sn-chip-on' : 'sn-chip'}
              style={b.tab}
              onClick={() => setSel(i)}
            >
              {sc.label}
            </button>
          ))}
        </div>
      )}

      <div style={b.statRow}>
        <span style={b.statVal}>{fmt1(cur.baseline)}</span>
        <span style={b.statMargin}>±{fmt1(cur.uncertainty)}</span>
        <span style={b.statusChip}>{status}</span>
      </div>
      <div style={b.statName}>your normal {cur.label}, and how much that reading still wobbles</div>

      <div style={b.bandWrap}>
        <div className="sn-track">
          <div className="sn-fill" style={{ width: `${fillPct}%` }} />
          <div className="sn-dot" style={{ left: `${fillPct}%` }} />
        </div>
        <div style={b.endpoints}>
          <span className="sn-micro sn-micro-dim">Day 1 · ±{fmt1(U_START)}</span>
          <span className="sn-micro">Verdict-ready · ±{fmt1(U_FLOOR)}</span>
        </div>
      </div>

      <div style={b.footNote}>
        Was ±{fmt1(day3)} on day 3; your logging narrowed it. Not a symptom score: how you feel week to week lives in the Weekly Insight.
      </div>
    </div>
  )
}

const b = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 },
  headline: {
    fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 300, color: '#1C1C1C',
    lineHeight: 1.25, marginBottom: 6,
  },
  intro: { fontSize: 12, color: '#8A8A82', lineHeight: 1.55 },
  howBtn: {
    background: 'none', border: 'none', padding: 0,
    fontSize: 12, fontWeight: 600, color: '#3D5C3C', cursor: 'pointer',
    textDecoration: 'underline', textUnderlineOffset: 2,
  },
  howPanel: {
    background: 'var(--tint-warm)', borderRadius: 10, padding: '10px 12px', marginTop: 8,
    fontSize: 11.5, color: '#7A7A72', lineHeight: 1.6,
  },
  tabs: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 },
  tab: { padding: '5px 12px', fontSize: 11.5, textTransform: 'capitalize' },
  statRow: { display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 16 },
  statVal: {
    fontFamily: 'Fraunces, serif', fontSize: 36, fontWeight: 300, color: '#1C1C1C',
    lineHeight: 1,
  },
  statMargin: {
    fontFamily: 'DM Mono, monospace', fontSize: 14, color: '#3D5C3C', fontWeight: 500,
  },
  statusChip: {
    marginLeft: 'auto', background: '#EFF3EE', color: '#3D5C3C', borderRadius: 999,
    padding: '4px 11px', fontSize: 11, fontWeight: 600,
  },
  statName: { fontSize: 11.5, color: '#8A8A82', marginTop: 5, lineHeight: 1.4 },
  bandWrap: { marginTop: 14 },
  endpoints: { display: 'flex', justifyContent: 'space-between', marginTop: 9 },
  footNote: {
    marginTop: 14, paddingTop: 10, borderTop: '1px solid rgba(0,0,0,0.05)',
    fontSize: 11, color: '#7A7A72', lineHeight: 1.5,
  },
}
