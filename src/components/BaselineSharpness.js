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
  const bandPct = Math.min(100, Math.max(0, (primary.uncertainty / U_START) * 100))

  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 18,
      padding: '18px 20px', fontFamily: 'DM Sans, sans-serif', color: '#1C1C1C',
    }}>
      <div style={{
        fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: '#8A8A82', marginBottom: 12,
      }}>Baseline Sharpness</div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontFamily: 'Fraunces, serif', fontSize: 34, fontWeight: 300, color: '#1C1C1C' }}>
          {fmt1(primary.baseline)}
        </span>
        <span style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 300, color: '#3D5C3C' }}>
          ±{fmt1(primary.uncertainty)}
        </span>
      </div>
      <div style={{ fontSize: 12, color: '#8A8A82', marginTop: 2 }}>{primary.label} baseline</div>

      <div style={{ position: 'relative', height: 6, background: '#F0EDE6', borderRadius: 3, marginTop: 14, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: 0, bottom: 0, left: '50%',
          transform: 'translateX(-50%)', width: `${bandPct}%`,
          background: '#3D5C3C', borderRadius: 3, opacity: 0.85,
        }} />
      </div>

      <div style={{ fontSize: 11.5, color: '#8A8A82', lineHeight: 1.5, marginTop: 12 }}>
        Was ±{fmt1(day3)} on day 3. Every consistent day tightens it, and a tighter baseline makes every verdict sharper. {data.loggedDays} {data.loggedDays === 1 ? 'day' : 'days'} logged so far.
      </div>

      {others.length > 0 && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '4px 14px', marginTop: 12,
          paddingTop: 10, borderTop: '1px solid rgba(0,0,0,0.05)',
          fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#8A8A82',
        }}>
          {others.map(sc => (
            <span key={sc.id}>{sc.label} {fmt1(sc.baseline)} ±{fmt1(sc.uncertainty)}</span>
          ))}
        </div>
      )}
    </div>
  )
}
