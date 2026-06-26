// Track recommendation engine.
// Takes a user's intake (symptoms + baseline severity) and their lab flags,
// and recommends which protocol track they should go into.
// The admin confirms or overrides this — it's a recommendation, not a decision.

// The four tracks:
//  - flagged    : lab flagged foods + real symptoms -> eliminate flagged foods
//  - common     : clean/sparse panel + real symptoms -> eliminate common triggers (+FODMAPs)
//  - wellness   : mild/no symptoms but motivated -> optimization / self-knowledge
//  - decline    : nothing meaningful to work on -> honest readout, no full protocol

// ============================================================
// SCALE DIRECTION — single source of truth.
// Some baseline scales are "higher = worse" (symptoms: more bloating is bad),
// others are "higher = better" (wellbeing: more energy is good). Everything
// that interprets these scores — burden, colors, insights — must respect this.
// Keyed WITHOUT the 'baseline_' prefix so it works for both profile fields
// (baseline_bloating) and weekly answer ids (bloating).
// ============================================================
export const SCALE_DIRECTION = {
  bloating: 'higherWorse',
  gas: 'higherWorse',
  reflux: 'higherWorse',
  digestive: 'higherWorse',     // high = "Very uncomfortable"
  energy: 'higherBetter',
  clarity: 'higherBetter',
  afternoon: 'higherBetter',    // high = "Sustained energy" (was miscategorized as a symptom)
  sleep: 'higherBetter',
  wellbeing: 'higherBetter',
}

// Normalize any scale value to a 0-10 "badness" (10 = worst), respecting direction.
export function toBadness(scaleKey, value) {
  const key = String(scaleKey).replace(/^baseline_/, '')
  const n = Number(value)
  if (isNaN(n)) return null
  return SCALE_DIRECTION[key] === 'higherBetter' ? (10 - n) : n
}

// Only the "higher = worse" symptom scales gauge symptom burden.
const SEVERITY_KEYS = [
  'baseline_bloating', 'baseline_gas', 'baseline_reflux', 'baseline_digestive',
]

// Returns a 0-10 symptom burden score (higher = more symptomatic)
export function symptomBurden(profile) {
  if (!profile) return 0
  const vals = SEVERITY_KEYS
    .map(k => Number(profile[k]))
    .filter(v => !isNaN(v) && v > 0)
  if (vals.length === 0) return 0
  // average of the reported "worse = higher" symptom scales
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

// Count meaningful lab flags (High/Moderate/Low; ignores "No sensitivity")
export function countFlags(labFoods = []) {
  const flagged = (labFoods || []).filter(f => ['High', 'Moderate', 'Low'].includes(f.level))
  return {
    total: flagged.length,
    high: flagged.filter(f => f.level === 'High').length,
    moderate: flagged.filter(f => f.level === 'Moderate').length,
    low: flagged.filter(f => f.level === 'Low').length,
    names: flagged.map(f => f.name),
  }
}

// Whether the user's stated goal is general wellness (vs a symptom complaint)
export function isWellnessGoal(profile) {
  const s = profile?.symptoms
  const arr = Array.isArray(s) ? s : (typeof s === 'string' ? [s] : [])
  const joined = arr.join(' ').toLowerCase()
  // general wellness selected AND no specific digestive/energy complaint dominates
  return joined.includes('general') || joined.includes('wellness')
}

// The main recommendation. Returns { track, label, reason, confidence }
export function recommendTrack({ profile, labFoods }) {
  const burden = symptomBurden(profile)
  const flags = countFlags(labFoods)
  const wellness = isWellnessGoal(profile)

  const hasSymptoms = burden >= 4       // moderate+ symptom burden
  const mildSymptoms = burden >= 2 && burden < 4
  const noSymptoms = burden < 2

  // 1) Lab flagged foods AND the person has real symptoms -> flagged track
  if (flags.total > 0 && (hasSymptoms || mildSymptoms)) {
    return {
      track: 'flagged',
      label: 'Flagged-foods protocol',
      reason: `Lab flagged ${flags.total} food${flags.total !== 1 ? 's' : ''} (${flags.high}H / ${flags.moderate}M / ${flags.low}L) and symptom burden is ${burden.toFixed(1)}/10. Standard elimination of the flagged foods.`,
      confidence: hasSymptoms ? 'high' : 'medium',
    }
  }

  // 2) Clean/sparse panel but real symptoms -> common-trigger track
  if (flags.total === 0 && hasSymptoms) {
    return {
      track: 'common',
      label: 'Common-trigger protocol',
      reason: `Panel came back clean but symptom burden is ${burden.toFixed(1)}/10. Worth testing common triggers (gluten, dairy, egg, soy) and FODMAPs, which IgG panels miss. Admin should select the foods to test.`,
      confidence: 'medium',
    }
  }

  // 3) Flagged foods but essentially no symptoms -> likely wellness
  if (flags.total > 0 && noSymptoms) {
    return {
      track: 'wellness',
      label: 'Wellness / self-knowledge',
      reason: `Lab flagged ${flags.total} food${flags.total !== 1 ? 's' : ''} but symptom burden is low (${burden.toFixed(1)}/10). Frame as mapping how they respond. Admin can select a subset to test or decline.`,
      confidence: 'medium',
    }
  }

  // 4) Explicit wellness goal, mild/no symptoms -> wellness track
  if (wellness && (mildSymptoms || noSymptoms)) {
    return {
      track: 'wellness',
      label: 'Wellness / self-knowledge',
      reason: `Stated goal is general wellness and symptom burden is low (${burden.toFixed(1)}/10). Optimization track — admin selects a subset of common foods to test, or declines.`,
      confidence: 'medium',
    }
  }

  // 5) No symptoms, no flags, no wellness goal -> nothing to work on
  if (flags.total === 0 && noSymptoms) {
    return {
      track: 'decline',
      label: 'Consider declining',
      reason: `No meaningful lab flags and very low symptom burden (${burden.toFixed(1)}/10). There may be nothing for a full protocol to work on. Consider an honest readout instead of running the program.`,
      confidence: 'low',
    }
  }

  // Fallback — mild symptoms, no clear signal
  return {
    track: 'common',
    label: 'Common-trigger protocol',
    reason: `Mixed signal (symptom burden ${burden.toFixed(1)}/10, ${flags.total} flags). Defaulting to a common-trigger approach. Admin should review and select foods.`,
    confidence: 'low',
  }
}

// The standard common-trigger food set (for tracks 2/3 where there's no lab list)
export const COMMON_TRIGGERS = [
  { name: 'Gluten / wheat', group: 'Top allergens' },
  { name: 'Dairy', group: 'Top allergens' },
  { name: 'Eggs', group: 'Top allergens' },
  { name: 'Soy', group: 'Top allergens' },
  { name: 'Corn', group: 'Top allergens' },
  { name: 'Tree nuts', group: 'Top allergens' },
  { name: 'Onion / garlic (FODMAP)', group: 'FODMAPs' },
  { name: 'Wheat (FODMAP)', group: 'FODMAPs' },
  { name: 'Legumes (FODMAP)', group: 'FODMAPs' },
  { name: 'Certain fruits (FODMAP)', group: 'FODMAPs' },
  { name: 'Dairy lactose (FODMAP)', group: 'FODMAPs' },
]
