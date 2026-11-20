// ============================================================
// Reintroduction Verdict Engine
// ------------------------------------------------------------
// Rules compute a provisional verdict from logged daily data.
// The AI may then confirm, or adjust by ONE level with a stated
// reason. It can never leap Safe<->Avoid against the data.
//
// CLINICAL THRESHOLDS LIVE HERE in one place so a physician
// advisor can review and adjust without touching app logic.
// These are sensible defaults and are NOT a clinical standard
// until reviewed by the medical advisor.
// ============================================================

export const VERDICT_THRESHOLDS = {
  // Any single severe symptom during the cycle -> Avoid, full stop
  severeAlwaysAvoid: true,

  // Number of exposure days (out of 3) with symptoms that tips toward Avoid
  avoidSymptomDayCount: 2,        // 2 or 3 of 3 exposure days with symptoms

  // A moderate-intensity symptom on 1 exposure day -> at least Limit
  // A mild symptom on 1 day -> Limit (inconsistent/ambiguous)
  // Zero symptom days across exposure AND washout -> Safe

  // Washout delayed flare (symptoms appearing days 4-14 that match
  // the food) escalates one level toward Avoid
  washoutFlareEscalates: true,

  // P02 (ledger): one symptom on one washout day is background noise, not a
  // delayed reaction. A washout flare counts only if it appears on at least
  // this many washout days, or on any washout day at moderate intensity, and,
  // when the exposure days had symptoms, shares a symptom name with them.
  // FLAGGED FOR PHYSICIAN REVIEW (default values).
  washoutFlareMinDays: 2,

  // How much the AI is allowed to move the provisional verdict
  aiMaxAdjustmentLevels: 1,
}

const LEVELS = ['Safe', 'Limit', 'Avoid']
const clampLevel = (idx) => LEVELS[Math.max(0, Math.min(2, idx))]
const levelIndex = (v) => LEVELS.indexOf(v)

// Compute the provisional verdict purely from logged data.
// ONE tolerant symptom reader for the whole verdict path (QA 2026-11-06 #6):
// rows arrive as object arrays, string arrays, or JSON-encoded strings
// (legacy). The severe gate and the engine must read every shape the
// ledger/needle already tolerate — a silently skipped severe day could rule
// a reactive food Safe.
export const parseSymptoms = (raw) => {
  let syms = raw
  if (typeof syms === 'string') { try { syms = JSON.parse(syms) } catch (e) { syms = null } }
  if (!Array.isArray(syms)) return []
  return syms
    .map(s => typeof s === 'string' ? { name: s, intensity: null } : (s && typeof s === 'object' ? s : null))
    .filter(Boolean)
}

// logs: array of daily log rows for this cycle.
export const computeProvisionalVerdict = (logs = []) => {
  const t = VERDICT_THRESHOLDS

  const exposureLogs = logs.filter(l => l.phase === 'exposure' && l.ate_food)
  const washoutLogs = logs.filter(l => l.phase === 'washout')

  // Flatten symptom intensities — tolerant of every stored shape
  const allSymptoms = logs.flatMap(l => parseSymptoms(l.symptoms))
  const hasSevere = allSymptoms.some(s => String(s.intensity || '').toLowerCase() === 'severe') || logs.some(l => l.stopped_early)

  // Severe -> Avoid immediately
  if (t.severeAlwaysAvoid && hasSevere) {
    return { verdict: 'Avoid', reason: 'A severe reaction was logged. The cycle defaults to Avoid for safety.', signals: { hasSevere: true } }
  }

  const exposureSymptomDays = exposureLogs.filter(l => l.had_symptoms).length
  // Moderate DAYS, not moderate symptom objects (QA 2026-11-06 protocol
  // critique #6, approved by Alex 2026-11-10): one afternoon logged as
  // "bloating/moderate + gas/moderate" used to count 2 and jump straight to
  // Avoid, bypassing the 2-day consistency requirement.
  const moderateDays = new Set(
    logs.filter(l => parseSymptoms(l.symptoms).some(s => String(s.intensity || '').toLowerCase() === 'moderate')).map(l => l.log_date)
  ).size
  const mildCount = allSymptoms.filter(s => String(s.intensity || '').toLowerCase() === 'mild').length
  const washoutSymDays = washoutLogs.filter(l => l.had_symptoms)
  const nm = (s) => String(s.name || s.symptom || '').trim().toLowerCase()
  const expNames = new Set(exposureLogs.flatMap(l => parseSymptoms(l.symptoms)).map(nm).filter(Boolean))
  const matchesExposure = (l) => expNames.size === 0 || parseSymptoms(l.symptoms).some(s => expNames.has(nm(s)))
  const hasModerateWashout = washoutSymDays.some(l => parseSymptoms(l.symptoms).some(s => String(s.intensity || '').toLowerCase() === 'moderate'))
  const matchedWashout = washoutSymDays.filter(matchesExposure)
  // Meaningful flare = enough matching days, or a matching moderate day.
  const washoutFlareDays = (matchedWashout.length >= t.washoutFlareMinDays || (hasModerateWashout && matchedWashout.length > 0)) ? matchedWashout.length : 0

  let idx // index into LEVELS

  if (exposureSymptomDays === 0 && washoutFlareDays === 0) {
    idx = 0 // Safe
  } else if (exposureSymptomDays >= t.avoidSymptomDayCount || moderateDays >= 2) {
    idx = 2 // Avoid
  } else {
    idx = 1 // Limit (mild/inconsistent)
  }

  // Washout delayed flare escalates one level toward Avoid
  if (t.washoutFlareEscalates && washoutFlareDays > 0 && idx < 2) {
    idx += 1
  }

  return {
    verdict: clampLevel(idx),
    reason: null,
    signals: {
      exposureSymptomDays,
      washoutFlareDays,
      moderateDays,
      mildCount,
      hasSevere: false,
      exposureDaysCompleted: exposureLogs.length,
    },
  }
}

// Apply the AI's adjustment, clamped to +/- aiMaxAdjustmentLevels
// and never crossing Safe<->Avoid in one move.
export const applyAiAdjustment = (provisional, aiVerdict) => {
  // SEVERE IS CODE LAW, NOT A PROMPT REQUEST (QA 2026-11-06 protocol critique
  // #3, approved by Alex 2026-11-10): a severe reaction means Avoid, and the
  // AI's adjustment is skipped entirely — its analysis text may ride along,
  // its power over the verdict does not. Before this, one ignored prompt
  // instruction could soften a throat-tightening reaction to "Limit".
  if (VERDICT_THRESHOLDS.severeAlwaysAvoid && provisional?.signals?.hasSevere) return provisional.verdict
  if (!LEVELS.includes(aiVerdict)) return provisional.verdict
  const from = levelIndex(provisional.verdict)
  const to = levelIndex(aiVerdict)
  const delta = to - from
  const capped = Math.max(-VERDICT_THRESHOLDS.aiMaxAdjustmentLevels,
                  Math.min(VERDICT_THRESHOLDS.aiMaxAdjustmentLevels, delta))
  // Never allow Safe<->Avoid leap (delta of 2)
  if (Math.abs(from + capped - 0) === 2 && Math.abs(delta) === 2) {
    return clampLevel(from + (capped > 0 ? 1 : -1))
  }
  return clampLevel(from + capped)
}
