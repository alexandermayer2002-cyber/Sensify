import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'

// Map Health: the Maintain promise made concrete. Once a month (or whenever the
// user opens Maintain), this card compares the last 30 days of symptom logs
// against the program-era record, per earned verdict, and says plainly whether
// the map is holding or something is creeping back.
//
// THE MATH (all of it lives in computeMapHealth below, documented there):
//   recent rate = symptom events per week in the last 30 days
//   noise floor = symptom events per week during the elimination window
//                 (protocol_start_date -> first reintro cycle start; if that
//                 window is not computable, the whole program era is used)
//   WITHIN BAND     recent rate below both watch thresholds
//   WORTH WATCHING  recent >= 2x floor AND recent >= 1.5 events/week
//   DRIFTING        recent >= 3x floor AND recent >= 2.0 events/week
//
// Symptom logs are not tagged to foods, so attribution is exposure-based and
// honest about it: when meal_logs (Ask Sensify's log table) is readable, only
// verdict foods actually logged in the last 30 days inherit an elevated state;
// a food the user has not touched cannot be what is drifting. If meal_logs is
// unavailable, every verdict food shows the shared drift reading.
//
// Thin data rule: under 4 recent data points (check-ins + symptom logs in 30
// days) the card refuses to judge rather than show fake green.

const DAY_MS = 24 * 60 * 60 * 1000
const WINDOW_DAYS = 30
const WINDOW_WEEKS = WINDOW_DAYS / 7
const MIN_DATA_POINTS = 4

// Drift thresholds, named so the card and the math agree forever.
const WATCH_RATIO = 2 // recent rate at least double the floor
const WATCH_ABS = 1.5 // and at least 1.5 events/week
const DRIFT_RATIO = 3 // recent rate at least triple the floor
const DRIFT_ABS = 2.0 // and at least 2 events/week

const VERDICT_COLORS = { Safe: '#2C9D8A', Limit: '#E8941F', Avoid: '#D64545' }
const STATE_COLORS = { within: '#2C9D8A', watch: '#E8941F', drift: '#D64545' }
const STATE_LABELS = { within: 'WITHIN BAND', watch: 'WORTH WATCHING', drift: 'DRIFTING' }

// Parse a Supabase date ('YYYY-MM-DD') or timestamptz as a LOCAL-sane Date.
// Date-only strings must not go through new Date('YYYY-MM-DD') (UTC midnight
// lands the previous evening in US timezones; see protocolDay.js).
const parseWhen = (v) => {
  if (!v) return null
  const str = String(v)
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  const dt = new Date(str)
  return isNaN(dt.getTime()) ? null : dt
}

const norm = (s) => String(s || '').trim().toLowerCase()

// Does a meal log mention this verdict food? Checks the parsed foods array
// first, then the raw text, with containment either way so 'Dairy' matches a
// logged 'dairy milk'.
const mealMentions = (meal, foodName) => {
  const target = norm(foodName)
  if (!target) return false
  const names = Array.isArray(meal?.foods) ? meal.foods.map(f => norm(f?.name)) : []
  if (names.some(n => n && (n === target || n.includes(target) || target.includes(n)))) return true
  return norm(meal?.raw_text).includes(target)
}

const fmtRate = (n) => {
  const r = Math.round(n * 10) / 10
  return r === Math.trunc(r) ? String(Math.trunc(r)) + '.0' : String(r)
}

/**
 * All Map Health math. Pure; returns null on any failure (fail silent).
 *
 * @param {Array}  verdictRows  reintroduction_results rows (food, verdict, started_at), verdict non-null
 * @param {Array}  symptomRows  symptom_logs rows (symptom, severity, logged_at) for this user, all time
 * @param {Array}  factorRows   daily_factors rows (log_date, followed_protocol), last 30 days
 * @param {Array|null} mealRows meal_logs rows (logged_at, raw_text, foods), last 30 days; null when the table was unreadable
 * @param {string|null} protocolStart profile.protocol_start_date
 * @param {Date}   now
 * @returns {object|null} {
 *   thin, checkins, symptomCount, recentRate, floorRate, hasMealLogs,
 *   foods: [{ food, verdict, state, exposures }], driftingFoods, watchingFoods
 * }
 *
 * Rates: recentRate = recent symptom events / (30/7) weeks. floorRate = events
 * in the elimination window / its length in weeks (window clamped to >= 1 week
 * so a short window cannot manufacture an absurd floor). Elimination window =
 * protocol_start_date to the earliest reintro cycle started_at; when either end
 * is missing or the window is under 7 days, the whole program era (protocol
 * start, or earliest symptom log, up to the 30-day cutoff) is used instead.
 * Classification uses raw rates; display rounds to one decimal.
 */
function computeMapHealth(verdictRows, symptomRows, factorRows, mealRows, protocolStart, now) {
  try {
    // Latest verdict per food (a food can be re-tested; the newest cycle wins).
    const byFood = new Map()
    const sorted = [...(verdictRows || [])]
      .filter(r => r && r.food && VERDICT_COLORS[r.verdict])
      .sort((a, b) => String(a.started_at || '').localeCompare(String(b.started_at || '')))
    for (const r of sorted) byFood.set(norm(r.food), { food: r.food, verdict: r.verdict })
    const verdictFoods = Array.from(byFood.values())
    if (verdictFoods.length === 0) return null

    const cutoff = new Date(now.getTime() - WINDOW_DAYS * DAY_MS)

    // Split symptom logs into the recent window and the program era.
    const recentSymptoms = []
    const eraSymptoms = []
    for (const row of (symptomRows || [])) {
      const at = parseWhen(row?.logged_at)
      if (!at) continue
      if (at >= cutoff) { if (at <= now) recentSymptoms.push({ at }) }
      else eraSymptoms.push({ at })
    }

    const checkins = (factorRows || []).filter(r => r && r.log_date).length
    const symptomCount = recentSymptoms.length
    const thin = (checkins + symptomCount) < MIN_DATA_POINTS

    const recentRate = symptomCount / WINDOW_WEEKS

    // Noise floor: elimination window first, whole program era as the fallback.
    const startDate = parseWhen(protocolStart)
    const cycleStarts = sorted.map(r => parseWhen(r.started_at)).filter(Boolean)
    const firstCycle = cycleStarts.length ? new Date(Math.min(...cycleStarts.map(d => d.getTime()))) : null

    let floorStart = startDate
    let floorEnd = firstCycle
    if (!floorStart || !floorEnd || (floorEnd - floorStart) < 7 * DAY_MS) {
      // Whole program era: from protocol start (or the earliest symptom log)
      // up to where the recent window begins.
      const earliestLog = eraSymptoms.length
        ? new Date(Math.min(...eraSymptoms.map(s => s.at.getTime())))
        : null
      floorStart = startDate || earliestLog
      floorEnd = cutoff
    }
    let floorRate = 0
    if (floorStart && floorEnd && floorEnd > floorStart) {
      const weeks = Math.max(1, (floorEnd - floorStart) / (7 * DAY_MS))
      const eraCount = eraSymptoms.filter(s => s.at >= floorStart && s.at < floorEnd).length
      floorRate = eraCount / weeks
    }

    // Global drift reading from the two-gate thresholds.
    let globalState = 'within'
    if (recentRate >= DRIFT_RATIO * floorRate && recentRate >= DRIFT_ABS) globalState = 'drift'
    else if (recentRate >= WATCH_RATIO * floorRate && recentRate >= WATCH_ABS) globalState = 'watch'

    // Exposure counts from meal_logs, when readable.
    const hasMealLogs = Array.isArray(mealRows)
    const recentMeals = hasMealLogs
      ? mealRows.filter(m => { const at = parseWhen(m?.logged_at); return at && at >= cutoff })
      : []

    const foods = verdictFoods.map(({ food, verdict }) => {
      const exposures = hasMealLogs ? recentMeals.filter(m => mealMentions(m, food)).length : null
      // Exposure-honest attribution: with meal data, an elevated state only
      // lands on foods actually eaten in the window; without it, the shared
      // reading applies to every verdict food.
      const state = (globalState !== 'within' && hasMealLogs && exposures === 0) ? 'within' : globalState
      return { food, verdict, state, exposures }
    })

    const order = { drift: 0, watch: 1, within: 2 }
    foods.sort((a, b) => order[a.state] - order[b.state])

    return {
      thin,
      checkins,
      symptomCount,
      recentRate,
      floorRate,
      hasMealLogs,
      foods,
      driftingFoods: foods.filter(f => f.state === 'drift').map(f => f.food),
      watchingFoods: foods.filter(f => f.state === 'watch').map(f => f.food),
    }
  } catch (e) {
    return null
  }
}

export default function MapHealth({ session, profile }) {
  const [report, setReport] = useState(null)
  const [showHow, setShowHow] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const uid = session?.user?.id
        if (!uid) return
        const cutoffIso = new Date(Date.now() - WINDOW_DAYS * DAY_MS).toISOString()
        const cutoffDateIso = cutoffIso.split('T')[0]

        const [verdictsRes, symptomsRes, factorsRes] = await Promise.all([
          supabase.from('reintroduction_results')
            .select('food, verdict, started_at')
            .eq('user_id', uid)
            .not('verdict', 'is', null),
          supabase.from('symptom_logs')
            .select('symptom, severity, logged_at')
            .eq('user_id', uid),
          supabase.from('daily_factors')
            .select('log_date, followed_protocol')
            .eq('user_id', uid)
            .gte('log_date', cutoffDateIso),
        ])
        if (verdictsRes.error || symptomsRes.error || factorsRes.error) return
        if (!verdictsRes.data || verdictsRes.data.length === 0) return

        // Ask Sensify meal logs feed exposure counts. Queried separately and
        // tolerated as missing: the readout degrades gracefully without it.
        let mealRows = null
        try {
          const { data, error } = await supabase.from('meal_logs')
            .select('logged_at, raw_text, foods')
            .eq('user_id', uid)
            .gte('logged_at', cutoffIso)
          if (!error && Array.isArray(data)) mealRows = data
        } catch (e) {}

        const result = computeMapHealth(
          verdictsRes.data, symptomsRes.data, factorsRes.data, mealRows,
          profile?.protocol_start_date, new Date()
        )
        if (!cancelled && result) setReport(result)
      } catch (e) {
        // Fail silent: Map Health never blocks the Maintain tab.
      }
    }
    load()
    return () => { cancelled = true }
  }, [session?.user?.id, profile?.protocol_start_date])

  if (!report) return null

  const { thin, checkins, symptomCount, recentRate, floorRate, foods, driftingFoods, watchingFoods } = report

  let summary
  if (thin) {
    summary = 'Too little recent data to judge drift. Log a few days and this report sharpens.'
  } else if (driftingFoods.length > 0) {
    summary = driftingFoods.join(' and ') + (driftingFoods.length === 1 ? ' is drifting. Worth a closer look.' : ' are drifting. Worth a closer look.')
  } else if (watchingFoods.length > 0) {
    summary = 'Mostly holding. ' + watchingFoods.join(' and ') + (watchingFoods.length === 1 ? ' is worth watching.' : ' are worth watching.')
  } else {
    summary = 'Your map is holding. Nothing is drifting.'
  }

  const rateLine = fmtRate(recentRate) + ' events a week, was ' + fmtRate(floorRate) + ' during the program.'

  return (
    <div className="sn-card">
      <div className="sn-micro sn-micro-dim" style={{ marginBottom: 8 }}>MAP HEALTH · LAST 30 DAYS</div>
      <div style={st.intro}>
        Whether the foods you cleared are still behaving, checked against your own quiet weeks.{' '}
        <button type="button" style={st.howBtn} onClick={() => setShowHow(v => !v)}>
          {showHow ? 'Hide' : 'How this works'}
        </button>
      </div>
      {showHow && (
        <div style={st.howPanel}>
          We compare how often symptoms show up in your last 30 days against how often they showed up during your quiet elimination weeks, your noise floor. A cleared food is only flagged when recent symptoms rise clearly above that floor and you actually logged eating it in the window. With fewer than four recent logs the card says so instead of guessing.
        </div>
      )}
      <div style={st.summary}>{summary}</div>
      <div style={st.vitality}>
        {checkins} check-in{checkins === 1 ? '' : 's'} and {symptomCount} symptom log{symptomCount === 1 ? '' : 's'} in the last 30 days.
      </div>

      {!thin && foods.map((f, i) => (
        <div key={f.food} className="sn-row" style={{ ...st.row, display: 'block', marginTop: i === 0 ? 0 : 8 }}>
          <div style={st.rowTop}>
            <span style={st.food}>{f.food}</span>
            <span className={`sn-stamp sn-stamp-${String(f.verdict).toLowerCase()}`}>{f.verdict}</span>
            <span style={{ ...st.state, color: STATE_COLORS[f.state], marginLeft: 'auto' }}>
              {STATE_LABELS[f.state]}
            </span>
          </div>
          <div style={st.rateLine}>
            {rateLine}
            {f.exposures != null && (
              <span style={st.exposure}> Logged {f.exposures} time{f.exposures === 1 ? '' : 's'} in the last 30 days.</span>
            )}
          </div>
          {(f.state === 'watch' || f.state === 'drift') && (
            <div style={st.retest}>
              <span style={st.retestLine}>A fresh 14 day trial would update this verdict.</span>
              <span className="sn-stamp sn-stamp-quiet" style={st.retestHint}>Re-test from your Reintro tab</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

const st = {
  intro: { fontSize: 12, color: '#8A8A82', lineHeight: 1.55, marginBottom: 12 },
  howBtn: {
    background: 'none', border: 'none', padding: 0,
    fontSize: 12, fontWeight: 600, color: '#3D5C3C', cursor: 'pointer',
    textDecoration: 'underline', textUnderlineOffset: 2,
  },
  howPanel: {
    background: 'var(--tint-warm)', borderRadius: 10, padding: '10px 12px', margin: '-4px 0 12px',
    fontSize: 11.5, color: '#7A7A72', lineHeight: 1.6,
  },
  summary: {
    fontFamily: 'Fraunces, serif', fontSize: 19, fontWeight: 300,
    lineHeight: 1.4, color: '#1C1C1C',
  },
  vitality: { fontSize: 12, color: '#8A8A82', marginTop: 6, marginBottom: 14 },
  row: { padding: '12px 14px' },
  rowTop: { display: 'flex', alignItems: 'center', gap: 8 },
  food: { fontSize: 13.5, fontWeight: 600, color: '#1C1C1C' },
  state: {
    fontFamily: 'DM Mono, monospace', fontSize: 9, letterSpacing: '0.08em', fontWeight: 500,
  },
  rateLine: { fontSize: 11.5, color: '#7A7A72', lineHeight: 1.5, marginTop: 5 },
  exposure: { fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#A8A69E' },
  retest: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  retestLine: { fontSize: 12, color: '#3D5C3C', fontWeight: 500 },
  retestHint: { opacity: 0.8, cursor: 'default' },
}
