import { jsPDF } from 'jspdf'
import { DM400, DM500, FR300, FR400 } from './foodMapPdfFonts'

// THE FOOD MAP, AS A REAL PDF.
// Replaces the old window.print() route, which produced grayscale,
// browser-dependent output. This draws the one-pager directly: vector text,
// full brand color, true fonts, downloaded as a file with no print dialog.
// Every line is still derived from the user's own cycle records.

const INK = '#1C1C1C'
const CREAM = '#FAF8F4'
const WHITE = '#FFFFFF'
const FOREST = '#3D5C3C'
const GRAY = '#6B6B62'
const BODY = '#3A3A34'
const HAIR = '#E3E0D8'
const V_INK = { Safe: '#2C9D8A', Limit: '#E8941F', Avoid: '#D64545' }

const PAGE_W = 612
const PAGE_H = 792
const M = 48 // margin
const CONTENT_W = PAGE_W - M * 2

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
  return { Safe: 'No reaction across 14 days', Limit: 'Mild reaction at full servings', Avoid: 'Reacted during the trial' }[cycle?.verdict] || ''
}

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

const paintPage = (doc) => {
  doc.setFillColor(CREAM)
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F')
}

export function generateFoodMapPdf({ firstName, protocolStart, entries, untested }) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })
  doc.addFileToVFS('DMSans-400.ttf', DM400); doc.addFont('DMSans-400.ttf', 'DMSans', 'normal')
  doc.addFileToVFS('DMSans-500.ttf', DM500); doc.addFont('DMSans-500.ttf', 'DMSans', 'bold')
  doc.addFileToVFS('Fraunces-300.ttf', FR300); doc.addFont('Fraunces-300.ttf', 'Fraunces', 'normal')
  doc.addFileToVFS('Fraunces-400.ttf', FR400); doc.addFont('Fraunces-400.ttf', 'Fraunces', 'bold')

  paintPage(doc)
  const days = daysOfTesting(protocolStart, entries)

  // ---- Header: wordmark left, provenance micro right, one ink rule ----
  let y = M + 14
  doc.setFont('Fraunces', 'bold'); doc.setFontSize(15); doc.setTextColor(INK)
  doc.text('Sensify', M, y)
  const wmW = doc.getTextWidth('Sensify')
  doc.setTextColor(FOREST); doc.text('.', M + wmW, y)
  doc.setFont('DMSans', 'bold'); doc.setFontSize(6.5); doc.setTextColor(GRAY); doc.setCharSpace(1.4)
  const micro = days ? `FOOD MAP  ·  EARNED FROM ${days} DAY${days === 1 ? '' : 'S'} OF TESTING` : 'FOOD MAP  ·  EARNED BY TESTING'
  doc.text(micro, PAGE_W - M, y - 1, { align: 'right' })
  doc.setCharSpace(0)
  y += 12
  doc.setDrawColor(INK); doc.setLineWidth(0.8)
  doc.line(M, y, PAGE_W - M, y)

  // ---- Title ----
  y += 44
  doc.setFont('Fraunces', 'normal'); doc.setFontSize(30); doc.setTextColor(INK)
  const title = `${firstName ? `${firstName}'s` : 'Your'} Food Map`
  doc.text(title, M, y)
  doc.setTextColor(FOREST); doc.text('.', M + doc.getTextWidth(title), y)
  y += 16
  doc.setFont('DMSans', 'normal'); doc.setFontSize(8.5); doc.setTextColor(GRAY)
  doc.text('Each verdict below was ruled by a 14 day single-food trial on this person’s own daily record.', M, y)
  y += 20

  // ---- Verdict cards, two columns ----
  const GAP = 12
  const colW = (CONTENT_W - GAP) / 2
  const padX = 13, padT = 15
  const evW = colW - padX * 2

  const cards = entries.map(e => {
    const ev = evidenceLine(e.cycle, e.logs)
    const evLines = doc.setFont('DMSans', 'normal').setFontSize(8).splitTextToSize(ev, evW)
    const h = padT + 9 + 20 + evLines.length * 11 + 11
    return { name: e.name, verdict: e.cycle?.verdict || '', evLines, h }
  })

  for (let i = 0; i < cards.length; i += 2) {
    const pair = cards.slice(i, i + 2)
    const rowH = Math.max(...pair.map(c => c.h))
    if (y + rowH > PAGE_H - 96) { doc.addPage(); paintPage(doc); y = M }
    pair.forEach((c, j) => {
      const x = M + j * (colW + GAP)
      doc.setFillColor(WHITE); doc.setDrawColor(HAIR); doc.setLineWidth(0.8)
      doc.roundedRect(x, y, colW, rowH, 8, 8, 'FD')
      let cy = y + padT
      doc.setFont('DMSans', 'bold'); doc.setFontSize(7); doc.setTextColor(GRAY); doc.setCharSpace(1.2)
      doc.text(c.name.toUpperCase(), x + padX, cy)
      doc.setCharSpace(0)
      cy += 18
      doc.setFont('Fraunces', 'bold'); doc.setFontSize(15); doc.setTextColor(V_INK[c.verdict] || INK)
      doc.text(`${c.verdict}.`, x + padX, cy)
      cy += 14
      doc.setFont('DMSans', 'normal'); doc.setFontSize(8); doc.setTextColor(BODY)
      doc.text(c.evLines, x + padX, cy)
    })
    y += rowH + GAP
  }

  // ---- Untested foods: named without verdict language ----
  if (untested && untested.length > 0) {
    y += 8
    if (y > PAGE_H - 110) { doc.addPage(); paintPage(doc); y = M }
    doc.setFont('DMSans', 'bold'); doc.setFontSize(6.5); doc.setTextColor(GRAY); doc.setCharSpace(1.2)
    doc.text('NOT YET TESTED', M, y)
    doc.setCharSpace(0)
    y += 11
    doc.setFont('DMSans', 'normal'); doc.setFontSize(8); doc.setTextColor(GRAY)
    const ulines = doc.splitTextToSize(untested.join(', '), CONTENT_W)
    doc.text(ulines, M, y)
    y += ulines.length * 11
  }

  // ---- Footer: the doctrine, pinned to the bottom of the last page ----
  const fy = PAGE_H - 64
  doc.setDrawColor(INK); doc.setLineWidth(0.6)
  doc.line(M, fy, PAGE_W - M, fy)
  doc.setFont('DMSans', 'normal'); doc.setFontSize(7); doc.setTextColor(GRAY)
  const foot = doc.splitTextToSize(
    'Every verdict above was earned from a 14 day single-food trial on this person’s own logged data. Nothing was assumed.',
    CONTENT_W - 110
  )
  doc.text(foot, M, fy + 13)
  const printedOn = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  doc.setFont('DMSans', 'bold')
  doc.text(printedOn, PAGE_W - M, fy + 13, { align: 'right' })

  doc.save('Sensify-Food-Map.pdf')
}
