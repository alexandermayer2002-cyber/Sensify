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

  const [primary, ...rest] = data.scales
  const others = rest.slice(0, 3)
  const day3 = baseUncertainty(3)
  // Sharpness as a 0-to-1 journey from the day-one margin to the floor. This is
  // pure presentation: it reuses the same uncertainty the old bar displayed.
  const sharpFrac = Math.min(1, Math.max(0, (U_START - primary.uncertainty) / (U_START - U_FLOOR)))
  const fillPct = Math.max(3, sharpFrac * 100) // never invisible on day one

  return (
    <div style={b.card}>
      <div style={b.header}>
        <span style={b.micro}>Baseline Sharpness</span>
        <span style={{ ...b.micro, color: '#9A927E' }}>
          {data.loggedDays} {data.loggedDays === 1 ? 'day' : 'days'} logged
        </span>
      </div>

      <div style={b.intro}>
        How steady your symptom baseline has become. Tighter is better: every verdict is measured against this line.{' '}
        <button type="button" style={b.howBtn} onClick={() => setShowHow(v => !v)}>
          {showHow ? 'Hide' : 'How this works'}
        </button>
      </div>

      {showHow && (
        <div style={b.howPanel}>
          Your baseline is where your symptoms sit on an ordinary day, and the margin is how much that reading still wobbles. Every day you log narrows it: on-plan days count in full, off-plan days count half, and noisy weekly check-ins widen it a little. It starts at ±{fmt1(U_START)} and can tighten to ±{fmt1(U_FLOOR)}; a food only earns a verdict by moving you clearly outside this band.
        </div>
      )}

      {/* THE BAND: the hero. Fuzzy on the left, sharp on the right, you are the dot. */}
      <div style={b.bandWrap}>
        <div style={b.track}>
          <div style={{ ...b.fill, width: `${fillPct}%` }} />
          <div style={{ ...b.marker, left: `calc(${fillPct}% - 7px)` }} />
        </div>
        <div style={b.endpoints}>
          <span style={b.endLabel}>Day 1: fuzzy</span>
          <span style={{ ...b.endLabel, color: '#3D5C3C' }}>Goal: sharp</span>
        </div>
      </div>

      <div style={b.statRow}>
        <span style={b.bigMargin}>±{fmt1(primary.uncertainty)}</span>
        <span style={b.statCaption}>
          today&rsquo;s margin on your {primary.label} baseline of {fmt1(primary.baseline)}. Was ±{fmt1(day3)} on day 3.
        </span>
      </div>

      {others.length > 0 && (
        <div style={b.othersWrap}>
          <div style={b.othersLabel}>Other baselines</div>
          <div style={b.othersRow}>
            {others.map(sc => (
              <span key={sc.id} style={b.otherItem}>
                <span style={b.otherName}>{sc.label}</span>
                <span style={b.otherVal}>{fmt1(sc.baseline)} ±{fmt1(sc.uncertainty)}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const b = {
  card: {
    background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 18,
    padding: '18px 20px', fontFamily: 'DM Sans, sans-serif', color: '#1C1C1C',
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 },
  micro: {
    fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.12em',
    textTransform: 'uppercase', color: '#3D5C3C',
  },
  intro: { fontSize: 12, color: '#8A8A82', lineHeight: 1.55 },
  howBtn: {
    background: 'none', border: 'none', padding: 0, fontFamily: 'DM Sans, sans-serif',
    fontSize: 12, fontWeight: 600, color: '#3D5C3C', cursor: 'pointer',
    textDecoration: 'underline', textUnderlineOffset: 2,
  },
  howPanel: {
    background: '#FAF8F4', borderRadius: 10, padding: '10px 12px', marginTop: 8,
    fontSize: 11.5, color: '#7A7A72', lineHeight: 1.6,
  },
  bandWrap: { marginTop: 16 },
  track: {
    position: 'relative', height: 10, borderRadius: 5,
    background: 'linear-gradient(90deg, #F0EDE6 0%, #ECEFE8 100%)',
  },
  fill: {
    position: 'absolute', top: 0, bottom: 0, left: 0,
    background: 'linear-gradient(90deg, #C9D8C8 0%, #8BAE8A 100%)',
    borderRadius: 5,
  },
  marker: {
    position: 'absolute', top: -2, width: 14, height: 14, borderRadius: '50%',
    background: '#3D5C3C', border: '2.5px solid #FFFFFF', boxSizing: 'border-box',
    boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
  },
  endpoints: { display: 'flex', justifyContent: 'space-between', marginTop: 7 },
  endLabel: {
    fontFamily: 'DM Mono, monospace', fontSize: 8.5, letterSpacing: '0.1em',
    textTransform: 'uppercase', color: '#A8A69E',
  },
  statRow: { display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 14 },
  bigMargin: {
    fontFamily: 'Fraunces, serif', fontSize: 28, fontWeight: 300, color: '#3D5C3C',
    flexShrink: 0, lineHeight: 1,
  },
  statCaption: { fontSize: 11.5, color: '#8A8A82', lineHeight: 1.5 },
  othersWrap: { marginTop: 14, paddingTop: 10, borderTop: '1px solid rgba(0,0,0,0.05)' },
  othersLabel: {
    fontFamily: 'DM Mono, monospace', fontSize: 8.5, letterSpacing: '0.1em',
    textTransform: 'uppercase', color: '#B8B6AE', marginBottom: 5,
  },
  othersRow: { display: 'flex', flexWrap: 'wrap', gap: '4px 16px' },
  otherItem: { display: 'inline-flex', alignItems: 'baseline', gap: 5 },
  otherName: { fontSize: 11, color: '#7A7A72' },
  otherVal: { fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#8A8A82' },
}
