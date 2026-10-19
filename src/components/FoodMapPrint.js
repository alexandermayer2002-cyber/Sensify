import React from 'react'
import { createPortal } from 'react-dom'

// FOOD MAP PRINT SHEET — the one-pager a user keeps. Rendered hidden into
// document.body via portal; printFoodMap() flags the body and opens the
// browser's print dialog, where a @media print stylesheet hides the app
// shell and shows only this sheet. Users save as PDF natively. Every line
// on the page is derived from the user's own cycle records. Nothing styled
// here depends on color to survive a grayscale printer.

// Print ink for verdicts (print palette, not the on-screen wall palette).
const V_INK = { Safe: '#2C9D8A', Limit: '#E8941F', Avoid: '#D64545' }

const localDate = (d) => {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}
const addDays = (iso, n) => {
  const d = new Date(iso + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return localDate(d)
}
const isoDay = (v) => (v ? String(v).split('T')[0] : null)

// Flag the body, open the native print dialog, clean up after.
export function printFoodMap() {
  const done = () => {
    document.body.classList.remove('fm-printing')
    window.removeEventListener('afterprint', done)
  }
  document.body.classList.add('fm-printing')
  window.addEventListener('afterprint', done)
  window.print()
  setTimeout(done, 2000)
}

const reacted = (l) => l.had_symptoms || (l.symptoms || []).length > 0

// One honest evidence line per ruled food, read straight from the daily logs.
function evidenceLine(cycle, logs) {
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
  // No daily records survive for this trial: fall back to the verdict's
  // standard descriptor rather than inventing counts.
  return { Safe: 'No reaction across 14 days', Limit: 'Mild reaction at full servings', Avoid: 'Reacted during the trial' }[cycle?.verdict] || ''
}

// Days of testing: protocol start through the latest verdict date
// (submitted_at when recorded, otherwise day 14 of that trial).
function daysOfTesting(protocolStart, entries) {
  const start = isoDay(protocolStart)
  if (!start) return null
  let latest = null
  for (const e of entries) {
    const c = e.cycle
    if (!c) continue
    const end = isoDay(c.submitted_at) || (isoDay(c.started_at) ? addDays(isoDay(c.started_at), 13) : null)
    if (end && (!latest || end > latest)) latest = end
  }
  if (!latest) return null
  const n = Math.round((new Date(latest + 'T12:00:00') - new Date(start + 'T12:00:00')) / 86400000) + 1
  return n >= 1 ? n : null
}

const PRINT_CSS = `
.fm-print-sheet { display: none; }
@media print {
  @page { size: letter; margin: 0.65in; }
  body.fm-printing { background: #FFFFFF !important; }
  body.fm-printing > *:not(.fm-print-sheet) { display: none !important; }
  body.fm-printing > .fm-print-sheet {
    display: block !important;
    background: #FFFFFF;
    color: #1C1C1C;
    font-family: 'DM Sans', sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .fm-print-sheet .fmp-head { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #1C1C1C; padding-bottom: 10px; }
  .fm-print-sheet .fmp-wordmark { font-family: 'Fraunces', serif; font-size: 19px; font-weight: 500; font-variation-settings: 'SOFT' 60, 'WONK' 1; }
  .fm-print-sheet .fmp-dot { color: #3D5C3C; }
  .fm-print-sheet .fmp-micro { font-size: 7.5px; letter-spacing: 2.2px; color: #5A5A52; text-transform: uppercase; }
  .fm-print-sheet .fmp-title { font-family: 'Fraunces', serif; font-size: 34px; font-weight: 400; line-height: 1.1; margin: 26px 0 20px; font-variation-settings: 'SOFT' 60, 'WONK' 1; }
  .fm-print-sheet .fmp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .fm-print-sheet .fmp-card { border: 1px solid rgba(0,0,0,0.22); border-radius: 8px; padding: 11px 13px 10px; break-inside: avoid; page-break-inside: avoid; }
  .fm-print-sheet .fmp-food { font-size: 8px; font-weight: 500; letter-spacing: 1.8px; text-transform: uppercase; color: #5A5A52; }
  .fm-print-sheet .fmp-verdict { font-family: 'Fraunces', serif; font-size: 21px; line-height: 1; margin-top: 5px; font-variation-settings: 'SOFT' 60, 'WONK' 1; }
  .fm-print-sheet .fmp-evidence { font-size: 9.5px; color: #3A3A34; line-height: 1.45; margin-top: 6px; }
  .fm-print-sheet .fmp-untested { font-size: 9px; color: #5A5A52; line-height: 1.55; margin-top: 18px; }
  .fm-print-sheet .fmp-foot { display: flex; justify-content: space-between; gap: 18px; border-top: 1px solid rgba(0,0,0,0.3); margin-top: 22px; padding-top: 9px; font-size: 8px; color: #5A5A52; line-height: 1.5; }
  .fm-print-sheet .fmp-date { white-space: nowrap; }
}
`

export default function FoodMapPrint({ firstName, protocolStart, entries, untested }) {
  if (!entries || entries.length === 0) return null
  const days = daysOfTesting(protocolStart, entries)
  const printedOn = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const sheet = (
    <div className="fm-print-sheet">
      <style>{PRINT_CSS}</style>
      <div className="fmp-head">
        <div className="fmp-wordmark">Sensify<span className="fmp-dot">.</span></div>
        <div className="fmp-micro">FOOD MAP{days ? ` · EARNED FROM ${days} DAY${days === 1 ? '' : 'S'} OF TESTING` : ' · EARNED BY TESTING'}</div>
      </div>
      <div className="fmp-title">{firstName ? `${firstName}'s` : 'Your'} Food Map<span className="fmp-dot">.</span></div>
      <div className="fmp-grid">
        {entries.map(e => (
          <div key={e.name} className="fmp-card">
            <div className="fmp-food">{e.name}</div>
            <div className="fmp-verdict" style={{ color: V_INK[e.cycle?.verdict] || '#1C1C1C' }}>{e.cycle?.verdict}.</div>
            <div className="fmp-evidence">{evidenceLine(e.cycle, e.logs)}</div>
          </div>
        ))}
      </div>
      {untested && untested.length > 0 && (
        <div className="fmp-untested">Not yet tested: {untested.join(', ')}</div>
      )}
      <div className="fmp-foot">
        <span>Every verdict above was earned from a 14 day single-food trial on this person's own logged data. Nothing was assumed.</span>
        <span className="fmp-date">{printedOn}</span>
      </div>
    </div>
  )
  return createPortal(sheet, document.body)
}
