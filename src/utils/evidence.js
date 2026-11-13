// ONE HONEST EVIDENCE LINE PER RULED FOOD.
// Shared by the Food Map PDF, the Verdict card on Home and anywhere else a
// ruling is shown with its reason. Three provenances, three sentences:
//   severe stop       -> says so
//   testimony-adjusted (answers.accuracy !== 'accurate') -> the stored
//                        verdict_reason, which already tells the honest story
//   data-ruled        -> read straight from the daily logs
const reacted = (l) => l.had_symptoms || (l.symptoms || []).length > 0

// One honest evidence line per ruled food.
// Three provenances, three sentences (QA 2026-10-27 #1: the log-only line used
// to print "Avoid. / No reaction across 14 days" on testimony-adjusted rulings
// — on the one document a customer hands a doctor):
//   severe stop      -> says so
//   testimony-adjusted (answers.accuracy !== 'accurate') -> the stored
//                       verdict_reason, which already tells the honest story
//   data-ruled       -> read straight from the daily logs, as before
export function evidenceLine(cycle, logs) {
  if (cycle?.stopped_early) return 'Stopped early after a severe reaction'
  const acc = cycle?.answers?.accuracy
  if (acc && acc !== 'accurate') {
    const reason = String(cycle?.verdict_reason || '').trim()
    if (reason) return reason
    return `Ruled ${cycle?.verdict || ''} with their own account of the two weeks weighed alongside the logs`.trim()
  }
  const logged = (logs || []).filter(l => l.log_date)
  if (logged.length > 0) {
    const exposure = logged.filter(l => l.ate_food === true)
    const expReacted = exposure.filter(reacted).length
    const washReacted = logged.filter(l => l.ate_food !== true).filter(reacted).length
    if (expReacted === 0 && washReacted === 0) {
      return logged.length >= 10 ? 'No reaction across 14 days' : 'No reaction on any logged day'
    }
    if (expReacted > 0 && washReacted > 0) {
      return `Reacted on ${expReacted} of ${exposure.length} exposure days, with symptoms into washout`
    }
    if (expReacted > 0) {
      return `Reacted on ${expReacted} of ${exposure.length} exposure day${exposure.length === 1 ? '' : 's'}`
    }
    return `Clean on exposure days, symptoms on ${washReacted} washout day${washReacted === 1 ? '' : 's'}`
  }
  return { Safe: 'No reaction across 14 days', Limit: 'Mild reaction at full servings', Avoid: 'Reacted during the trial' }[cycle?.verdict] || ''
}

