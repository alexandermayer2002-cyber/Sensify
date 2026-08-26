// ============================================================
// Protocol Track Engine
// ------------------------------------------------------------
// One engine, multiple ways of populating its food list.

// ---- PHYSICIAN GATE --------------------------------------------------------
// The common-trigger track directs a broad elimination WITHOUT lab justification,
// which is a bigger clinical step than the flagged track. It must not go live to
// real users until the medical advisor has signed off on the tier food lists,
// the GI/FODMAP logic, and the timings. Flip to true only after sign-off.
// The flagged track is unaffected by this and stays fully live.
export const COMMON_TRACK_ENABLED = true

// The rest of the app asks getProtocolFoods() for "what is this
// user eliminating and reintroducing" instead of reading the
// lab results directly. That single seam lets the assigned track
// drive the protocol.
//
// Tracks (assigned by admin):
//   flagged  -> test the lab-flagged foods (by tier), as before
//   common   -> clean panel + symptoms; test common triggers.
//               The USER picks Tier 1 (essentials) or Tier 2 (full panel).
//   declined -> no protocol; routed to self-tracking instead.
//
// CLINICAL NOTE: the tier food lists below are research-based
// defaults (6-Food Elimination Diet + top FODMAP triggers) and
// are NOT a clinical standard until reviewed by the medical advisor.
// FODMAP foods are flagged so they can be emphasised for GI symptoms.
// ============================================================

// ---- Common-track tier food sets -------------------------------------------
// Each food carries a default `level` so the existing reintro engine (which
// expects High/Moderate/Low) has something to work with. Common-track foods
// have no lab severity, so they all sit in one tier and default to 'Moderate'.

export const COMMON_TIER_1 = [
  { name: 'Dairy', level: 'Common', fodmap: false },
  { name: 'Gluten / wheat', level: 'Common', fodmap: false },
]

export const COMMON_TIER_2 = [
  { name: 'Dairy', level: 'Common', fodmap: false },
  { name: 'Gluten / wheat', level: 'Common', fodmap: false },
  { name: 'Eggs', level: 'Common', fodmap: false },
  { name: 'Soy', level: 'Common', fodmap: false },
  { name: 'Tree nuts', level: 'Common', fodmap: false },
  { name: 'Corn', level: 'Common', fodmap: false },
  { name: 'Onion / garlic', level: 'Common', fodmap: true },
  { name: 'Legumes', level: 'Common', fodmap: true },
]

// User-facing labels for the two tiers (plain language, the user sees these).
export const TIER_META = {
  1: { key: 1, label: 'Test 2 Foods', sub: 'The essentials', foods: COMMON_TIER_1 },
  2: { key: 2, label: 'Test 8 Foods', sub: 'The full panel', foods: COMMON_TIER_2 },
}

// ---- Per-track timeline parameters -----------------------------------------
// Currently flagged and common both run the full programme. Kept as a per-track
// table so durations can be tuned later (e.g. by the advisor) without touching
// engine logic. The 3-day exposure is constant everywhere and lives in the
// reintro engine, not here.
export const TRACK_TIMELINE = {
  flagged:  { eliminationDays: 56, cycleDays: 14 },
  common:   { eliminationDays: 56, cycleDays: 14 },
  declined: { eliminationDays: 0,  cycleDays: 0 },
}

// ---- The resolver: the single source of "what foods is this protocol" ------
// profile: the user's profile row (has protocol_track, protocol_tier)
// labResult: their lab result row (has .foods for the flagged track)
// Returns { track, foods: [{name, level, fodmap?}], timeline }
export function getProtocolFoods(profile, labResult) {
  const track = profile?.protocol_track || (labResult?.foods?.length ? 'flagged' : null)

  if (track === 'declined') {
    return { track: 'declined', foods: [], timeline: TRACK_TIMELINE.declined }
  }

  if (track === 'common') {
    const tier = Number(profile?.protocol_tier) === 2 ? 2 : 1
    return {
      track: 'common',
      tier,
      foods: TIER_META[tier].foods,
      timeline: TRACK_TIMELINE.common,
    }
  }

  // Default / flagged: use the lab-flagged foods exactly as before.
  return {
    track: 'flagged',
    foods: (labResult?.foods || []),
    timeline: TRACK_TIMELINE.flagged,
  }
}

// Convenience: just the food names the user is eliminating/testing.
export function getProtocolFoodNames(profile, labResult) {
  return getProtocolFoods(profile, labResult).foods.map(f => f.name)
}

// Whether the common track should emphasise FODMAP foods, based on whether the
// user's symptoms are GI-related. Used to guide (not force) the admin + framing.
export function symptomsAreGI(profile) {
  const s = profile?.symptoms
  const arr = Array.isArray(s) ? s : (typeof s === 'string' ? [s] : [])
  const joined = arr.join(' ').toLowerCase()
  return /digest|bloat|gas|stomach|gut|ibs|reflux|constip|diarr/.test(joined)
}
