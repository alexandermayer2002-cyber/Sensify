// ============================================================
// Layer 2 — Confound Analysis
// ------------------------------------------------------------
// Looks at the captured daily factors (Layer 1) and decides whether
// any non-food factor is worth gently surfacing to the user, alongside
// their weekly symptom insight.
//
// Two engines:
//   Engine 1 (absolute)   — is their NORMAL itself unhealthy? (chronic
//                            low sleep, chronic high stress, etc.)
//                            No correlation needed. Gentle standing note.
//   Engine 2 (divergence) — was THIS WEEK unusual for them, in the BAD
//                            direction, AND did symptoms worsen, AND has
//                            it repeated? Tight, correlation-gated.
//
// CRITICAL SAFETY:
//  - Code decides significance; the AI only phrases (with hard rules).
//  - Directional: only "bad direction" moves count (less sleep, more
//    stress, less water, more alcohol). A good-direction change (e.g.
//    stress dropping) is never flagged.
//  - Never contradicts the food protocol. Observations are additive
//    ("also worth noting"), never dismissive of a real food reaction.
//  - This is SURFACE-ONLY (Layer 2). It never adjusts a verdict (Layer 3).
//  - ENABLED is false until a physician reviews bands, directions,
//    thresholds, and framing.
//
// PHYSICIAN-REVIEW ITEMS (all live in CONFOUND_CONFIG, clearly flagged):
//  - unhealthyBands (what counts as an unhealthy absolute level)
//  - badDirection (the medically-bad direction per factor)
//  - divergence thresholds (what gap is "meaningful")
//  - the framing copy rules (in the prompt builder below)
// ============================================================

export const CONFOUND_ENABLED = false        // master gate
export const ENGINE1_ENABLED = true           // absolute-level (safer); independently togglable under the master gate
export const ENGINE2_ENABLED = true           // divergence (riskier)

export const CONFOUND_CONFIG = {
  // ---- Engine 2: divergence thresholds (TIGHT defaults; tune with real data) ----
  minWeeksOfData: 4,        // surface nothing before this many weeks logged
  minLoggingDays: 4,        // a week needs >= this many daily logs to count
  minRepeats: 2,            // a pattern must appear >= this many times to surface

  // "Meaningful" divergence per factor — note the UNIT differs per factor:
  sleepDropHours: 1.5,      // hours below personal norm (continuous)
  stressBandJump: 2,        // bands above norm (5-band scale)
  hydrationBandDrop: 2,     // bands below norm
  alcoholMultiplier: 2,     // >= 2x personal weekly norm ...
  alcoholFloorExtra: 4,     // ... AND at least this many extra drinks (kills "1 vs 2" false alarms)

  // ---- The medically-bad direction per factor (PHYSICIAN REVIEW) ----
  // Only divergence TOWARD these directions is eligible to surface.
  badDirection: { sleep: 'down', stress: 'up', hydration: 'down', alcohol: 'up' },

  // ---- Engine 1: unhealthy absolute bands (PHYSICIAN REVIEW) ----
  unhealthyBands: {
    sleepUnderHours: 6,       // baseline/avg under this = chronically low
    stressAtOrAbove: 'high',  // 'high' or 'severe' sustained
    hydrationLowest: 'under3', // lowest band sustained
    alcoholWeeklyOver: 14,    // drinks/week over this (common moderate-use reference)
  },
}

// Numeric scales for banded factors so we can compare/diverge them.
const STRESS_SCALE = { low: 1, mild: 2, moderate: 3, high: 4, severe: 5 }
const HYDRATION_SCALE = { under3: 1, '3-5': 2, '6-8': 3, '8plus': 4 }
const SLEEP_MIDPOINT = { under6: 5, '6-7': 6.5, '7-8': 7.5, '8plus': 8.5 }
const DRINKS_WEEK_MIDPOINT = { '1-3': 2, '4-7': 5.5, '8-14': 11, '15plus': 18 }

// ---- Shared: roll daily_factors rows into weekly summaries -------------------
// rows: [{ log_date, sleep, stress, hydration, drinks, followed_protocol }]
// Returns weeks: [{ weekStart, n, sleepHrs, stressNum, hydrationNum, drinks }]
export function computeWeeklySummaries(rows) {
  if (!rows || rows.length === 0) return []
  const byWeek = {}
  for (const r of rows) {
    const d = new Date(r.log_date)
    // Week key = the Monday of that date's week
    const day = (d.getDay() + 6) % 7
    const monday = new Date(d); monday.setDate(d.getDate() - day)
    const key = monday.toISOString().split('T')[0]
    if (!byWeek[key]) byWeek[key] = []
    byWeek[key].push(r)
  }
  return Object.entries(byWeek).map(([weekStart, wk]) => {
    const avg = (vals) => vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
    const sleepVals = wk.map(r => SLEEP_MIDPOINT[r.sleep]).filter(v => v != null)
    const stressVals = wk.map(r => STRESS_SCALE[r.stress]).filter(v => v != null)
    const hydVals = wk.map(r => HYDRATION_SCALE[r.hydration]).filter(v => v != null)
    const drinkVals = wk.map(r => (typeof r.drinks === 'number' ? r.drinks : null)).filter(v => v != null)
    return {
      weekStart,
      n: wk.length,
      sleepHrs: avg(sleepVals),
      stressNum: avg(stressVals),
      hydrationNum: avg(hydVals),
      drinks: drinkVals.length ? drinkVals.reduce((a, b) => a + b, 0) : null, // weekly total
    }
  }).sort((a, b) => new Date(a.weekStart) - new Date(b.weekStart))
}

// ---- Data sufficiency (addition #3) -----------------------------------------
// Distinguishes "no pattern" from "not enough data to look".
export function dataSufficiency(weeks) {
  const usable = (weeks || []).filter(w => w.n >= CONFOUND_CONFIG.minLoggingDays)
  if (usable.length === 0) return { state: 'none', usableWeeks: 0, message: 'No daily check-ins logged yet.' }
  if (usable.length < CONFOUND_CONFIG.minWeeksOfData) {
    return { state: 'insufficient', usableWeeks: usable.length, message: `Need ${CONFOUND_CONFIG.minWeeksOfData} weeks of check-ins to spot patterns; have ${usable.length}.` }
  }
  return { state: 'sufficient', usableWeeks: usable.length, message: 'Enough data to analyze.' }
}

// ---- Engine 1: absolute unhealthy baseline ----------------------------------
// profile carries the intake baselines; weeks gives the lived average.
export function engine1Absolute(profile, weeks) {
  if (!ENGINE1_ENABLED) return null
  const b = CONFOUND_CONFIG.unhealthyBands
  const flags = []

  // Sleep: baseline band OR lived average under the threshold
  const baseSleep = SLEEP_MIDPOINT[profile?.baseline_avg_sleep]
  const livedSleep = avgOf(weeks, 'sleepHrs')
  const sleepVal = livedSleep ?? baseSleep
  if (sleepVal != null && sleepVal < b.sleepUnderHours) {
    flags.push({ factor: 'sleep', kind: 'absolute', level: sleepVal, confidence: livedSleep != null ? 'lived' : 'stated' })
  }

  // Stress: baseline at/above 'high'
  const baseStress = STRESS_SCALE[profile?.baseline_avg_stress]
  const livedStress = avgOf(weeks, 'stressNum')
  const stressVal = livedStress ?? baseStress
  if (stressVal != null && stressVal >= STRESS_SCALE[b.stressAtOrAbove]) {
    flags.push({ factor: 'stress', kind: 'absolute', level: stressVal, confidence: livedStress != null ? 'lived' : 'stated' })
  }

  // Hydration: baseline in lowest band
  const baseHyd = HYDRATION_SCALE[profile?.baseline_avg_hydration]
  const livedHyd = avgOf(weeks, 'hydrationNum')
  const hydVal = livedHyd ?? baseHyd
  if (hydVal != null && hydVal <= HYDRATION_SCALE[b.hydrationLowest]) {
    flags.push({ factor: 'hydration', kind: 'absolute', level: hydVal, confidence: livedHyd != null ? 'lived' : 'stated' })
  }

  // Alcohol: baseline weekly over threshold
  const baseDrinks = DRINKS_WEEK_MIDPOINT[profile?.baseline_avg_drinks_week]
  if (profile?.drinks_alcohol && baseDrinks != null && baseDrinks > b.alcoholWeeklyOver) {
    flags.push({ factor: 'alcohol', kind: 'absolute', level: baseDrinks, confidence: 'stated' })
  }

  return flags.length ? flags : null
}

// ---- Engine 2: directional, plausibility-gated divergence -------------------
// weeklySymptoms: [{ weekStart, worseThanUsual: bool }] aligned to factor weeks.
export function engine2Divergence(profile, weeks, weeklySymptoms) {
  if (!ENGINE2_ENABLED) return null
  const usable = weeks.filter(w => w.n >= CONFOUND_CONFIG.minLoggingDays)
  if (usable.length < CONFOUND_CONFIG.minWeeksOfData) return null

  const cfg = CONFOUND_CONFIG
  const dir = cfg.badDirection
  // Personal norms from the usable weeks
  const normSleep = avgOf(usable, 'sleepHrs')
  const normStress = avgOf(usable, 'stressNum')
  const normHyd = avgOf(usable, 'hydrationNum')
  const normDrinks = avgOf(usable, 'drinks')

  const symMap = {}
  for (const s of (weeklySymptoms || [])) symMap[s.weekStart] = s.worseThanUsual

  // Count, per factor, weeks that were a BAD-direction strong divergence AND
  // coincided with worse symptoms.
  const hits = { sleep: [], stress: [], hydration: [], alcohol: [] }
  for (const w of usable) {
    const worse = symMap[w.weekStart] === true
    if (!worse) continue // plausibility: only weeks where symptoms worsened

    // Sleep: bad direction is DOWN
    if (dir.sleep === 'down' && normSleep != null && w.sleepHrs != null &&
        (normSleep - w.sleepHrs) >= cfg.sleepDropHours) hits.sleep.push(w.weekStart)
    // Stress: bad direction is UP
    if (dir.stress === 'up' && normStress != null && w.stressNum != null &&
        (w.stressNum - normStress) >= cfg.stressBandJump) hits.stress.push(w.weekStart)
    // Hydration: bad direction is DOWN
    if (dir.hydration === 'down' && normHyd != null && w.hydrationNum != null &&
        (normHyd - w.hydrationNum) >= cfg.hydrationBandDrop) hits.hydration.push(w.weekStart)
    // Alcohol: bad direction is UP, multiplier AND absolute floor
    if (dir.alcohol === 'up' && normDrinks != null && w.drinks != null &&
        w.drinks >= normDrinks * cfg.alcoholMultiplier &&
        (w.drinks - normDrinks) >= cfg.alcoholFloorExtra) hits.alcohol.push(w.weekStart)
  }

  // Keep only factors that repeated enough; rank by repeat count (strength).
  const eligible = Object.entries(hits)
    .filter(([, ws]) => ws.length >= cfg.minRepeats)
    .map(([factor, ws]) => ({
      factor, kind: 'divergence', direction: dir[factor], repeats: ws.length,
      confidence: ws.length >= cfg.minRepeats + 2 ? 'strong' : 'moderate',
    }))
    .sort((a, b) => b.repeats - a.repeats)

  return eligible.length ? eligible : null
}

// ---- Combiner: one observation max, default silence -------------------------
// Returns null OR a single validated observation object (not a sentence).
export function analyzeConfounds({ profile, dailyRows, weeklySymptoms }) {
  if (!CONFOUND_ENABLED) return null
  const weeks = computeWeeklySummaries(dailyRows)
  const sufficiency = dataSufficiency(weeks)

  // Engine 2 needs sufficiency; Engine 1 can speak from baseline alone.
  const e2 = sufficiency.state === 'sufficient' ? engine2Divergence(profile, weeks, weeklySymptoms) : null
  const e1 = engine1Absolute(profile, weeks)

  // Priority: a validated weekly divergence (specific, actionable) outranks a
  // standing absolute note, but we only ever surface ONE.
  let chosen = null
  if (e2 && e2.length) chosen = e2[0]
  else if (e1 && e1.length) chosen = e1[0]

  return chosen ? { observation: chosen, sufficiency, engine1All: e1, engine2All: e2 } : { observation: null, sufficiency, engine1All: e1, engine2All: e2 }
}

// ---- The guarded prompt fragment (AI phrases; hard rules) -------------------
// Returns a string to splice into the weekly insight prompt, or '' for silence.
export function confoundPromptFragment(observation) {
  if (!observation) return ''
  const f = observation.factor
  const human = { sleep: 'sleep', stress: 'stress', hydration: 'hydration', alcohol: 'alcohol intake' }[f] || f

  if (observation.kind === 'absolute') {
    return `
CONFOUND NOTE (optional, gentle, at most one sentence, and ONLY if it fits naturally):
This user's usual ${human} sits in a range that can affect how they feel day to day. You MAY add one gentle, neutral, observational aside making them aware of this as context for interpreting their symptoms.
HARD RULES for this aside:
- Observational, NEVER prescriptive. "your ${human} tends to run on the low side, which is worth being aware of" is OK. "you need to fix your ${human}" is NOT.
- NEVER causal. Do not say their ${human} is causing their symptoms.
- NEVER dismiss food. Do not imply this explains away a food reaction. It is additional context, not a replacement.
- If it doesn't fit naturally this week, omit it entirely.`
  }

  // divergence
  return `
CONFOUND NOTE (optional, gentle, at most one sentence, and ONLY if it fits naturally):
On weeks this user's symptoms were worse, their ${human} also tended to move in an unfavorable direction (this has happened ${observation.repeats} times). You MAY add one gentle, observational aside noting this co-occurrence as something to keep an eye on.
HARD RULES for this aside:
- Correlational, NEVER causal. "tended to line up with" is OK. "caused by your ${human}" is NOT.
- NEVER dismiss food. This is additional context alongside the food testing, never a replacement for it. Do not imply a food reaction was really just ${human}.
- Hedged and gentle: "worth keeping an eye on".
- If it doesn't fit naturally this week, omit it entirely.`
}

// ---- helpers ----
function avgOf(weeks, key) {
  const vals = (weeks || []).map(w => w[key]).filter(v => v != null)
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
}
