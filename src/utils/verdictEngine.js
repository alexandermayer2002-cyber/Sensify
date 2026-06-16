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

  // How much the AI is allowed to move the provisional verdict
  aiMaxAdjustmentLevels: 1,
}

const LEVELS = ['Safe', 'Limit', 'Avoid']
const clampLevel = (idx) => LEVELS[Math.max(0, Math.min(2, idx))]
const levelIndex = (v) => LEVELS.indexOf(v)

// Compute the provisional verdict purely from logged data.
// logs: array of daily log rows for this cycle.
export const computeProvisionalVerdict = (logs = []) => {
  const t = VERDICT_THRESHOLDS

  const exposureLogs = logs.filter(l => l.phase === 'exposure' && l.ate_food)
  const washoutLogs = logs.filter(l => l.phase === 'washout')

  // Flatten symptom intensities
  const allSymptoms = logs.flatMap(l => Array.isArray(l.symptoms) ? l.symptoms : [])
  const hasSevere = allSymptoms.some(s => s.intensity === 'severe') || logs.some(l => l.stopped_early)

  // Severe -> Avoid immediately
  if (t.severeAlwaysAvoid && hasSevere) {
    return { verdict: 'Avoid', reason: 'A severe reaction was logged. The cycle defaults to Avoid for safety.', signals: { hasSevere: true } }
  }

  const exposureSymptomDays = exposureLogs.filter(l => l.had_symptoms).length
  const moderateCount = allSymptoms.filter(s => s.intensity === 'moderate').length
  const mildCount = allSymptoms.filter(s => s.intensity === 'mild').length
  const washoutFlareDays = washoutLogs.filter(l => l.had_symptoms).length

  let idx // index into LEVELS

  if (exposureSymptomDays === 0 && washoutFlareDays === 0) {
    idx = 0 // Safe
  } else if (exposureSymptomDays >= t.avoidSymptomDayCount || moderateCount >= 2) {
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
      moderateCount,
      mildCount,
      hasSevere: false,
      exposureDaysCompleted: exposureLogs.length,
    },
  }
}

// Apply the AI's adjustment, clamped to +/- aiMaxAdjustmentLevels
// and never crossing Safe<->Avoid in one move.
export const applyAiAdjustment = (provisional, aiVerdict) => {
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
