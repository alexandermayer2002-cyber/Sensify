import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { getTestingOrder } from '../utils/protocolEngine'

// THE SUSPECT BOARD — the case file that stays open during the quiet eight weeks.
// Every protocol food is a dossier row whose stamp moves SUSPECT -> ON TRIAL ->
// its earned verdict. Queued suspects carry an honest (~) estimate of when their
// trial opens, derived from the protocol clock: elimination runs day 1-56, then
// 14-day cycles in testing order from day 57.

const ELIMINATION_DAYS = 56
const CYCLE_DAYS = 14

// Stamp colors (full strength text on a ~12% wash of the same color).
const STAMP = {
  Suspect: { label: 'SUSPECT', color: '#5A5A52' },
  Trial:   { label: 'ON TRIAL', color: '#3D5C3C' },
  Safe:    { label: 'SAFE', color: '#2C9D8A' },
  Limit:   { label: 'LIMIT', color: '#E8941F' },
  Avoid:   { label: 'AVOID', color: '#D64545' },
}

// Lab level colors for the origin micro-line (dark variants for small-text legibility).
const LEVEL_COLOR = { High: '#A32D2D', Moderate: '#8A5410', Low: '#1A6256' }

const FREQ_TEXT = {
  'daily': 'eaten daily',
  '3-5x': 'eaten 3-5x a week',
  '1-2x': 'eaten 1-2x a week',
  'rarely': 'eaten rarely',
  'almost-never': 'almost never eaten',
}

// ---- Local date math (never UTC; mirrors dateUtils doctrine) ----
const parseLocal = (iso) => {
  const [y, m, d] = String(iso).split('T')[0].split('-').map(Number)
  return new Date(y, m - 1, d)
}
const addDays = (date, n) => {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}
const fmt = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

export default function SuspectBoard({ session, profile, labResult }) {
  const [cycles, setCycles] = useState([])
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!session?.user?.id) return
    ;(async () => {
      try {
        const { data } = await supabase
          .from('reintroduction_results')
          .select('food, verdict, started_at, washout_started_at')
          .eq('user_id', session.user.id)
          .order('started_at', { ascending: true })
        setCycles(data || [])
      } catch (e) { /* fail silent; board renders as all-suspect */ }
    })()
  }, [session?.user?.id])

  try {
    const allFoods = labResult?.foods || []
    if (allFoods.length === 0) return null

    const freq = profile?.food_frequency || {}
    const neverCount = allFoods.filter(f => freq[f.name] === 'never').length
    const boardFoods = getTestingOrder(allFoods.filter(f => freq[f.name] !== 'never'), freq)
    if (boardFoods.length === 0) return null

    // Latest cycle per food (fetch is started_at ascending, so later rows win).
    const byFood = {}
    for (const c of cycles) byFood[(c.food || '').toLowerCase()] = c

    const activeCycle = cycles.find(c => !c.verdict)
    const ruledCount = boardFoods.filter(f => byFood[f.name.toLowerCase()]?.verdict).length

    // ---- Schedule math for queued suspects ----
    // Day 57 is the first trial slot: protocol_start_date + 56 days. An active
    // cycle occupies the clock until ~its start + 14, so the queue opens after
    // whichever is later. Floored at today so an estimate never reads as past.
    const startDate = profile?.protocol_start_date ? parseLocal(profile.protocol_start_date) : null
    let queueBase = null
    if (startDate) {
      queueBase = addDays(startDate, ELIMINATION_DAYS) // day 57
      if (activeCycle?.started_at) {
        const activeEnd = addDays(parseLocal(activeCycle.started_at), CYCLE_DAYS)
        if (activeEnd > queueBase) queueBase = activeEnd
      }
      const todayMid = new Date(); todayMid.setHours(0, 0, 0, 0)
      if (todayMid > queueBase) queueBase = todayMid
    }

    // Build rows in testing order; queued suspects count their own 0-based slot.
    let queueIndex = 0
    const rows = boardFoods.map((food, idx) => {
      const cycle = byFood[food.name.toLowerCase()]
      let stamp, detail, done = false
      if (cycle?.verdict && STAMP[cycle.verdict]) {
        stamp = STAMP[cycle.verdict]
        detail = 'Trial complete'
        done = true
      } else if (cycle) {
        stamp = STAMP.Trial
        detail = cycle.washout_started_at ? 'In washout' : 'In exposure'
      } else {
        stamp = STAMP.Suspect
        detail = queueBase ? `Trial opens ~${fmt(addDays(queueBase, CYCLE_DAYS * queueIndex))}` : 'Awaiting protocol start'
        queueIndex += 1
      }
      const origin = food.level === 'Common'
        ? { text: 'Common trigger', color: '#8A8A82' }
        : { text: `Lab · ${food.level}`, color: LEVEL_COLOR[food.level] || '#8A8A82' }
      return { rank: idx + 1, name: food.name, origin, freqText: FREQ_TEXT[freq[food.name]] || null, stamp, detail, done }
    })

    const collapsible = rows.length > 6
    const visible = collapsible && !expanded ? rows.slice(0, 6) : rows

    return (
      <div style={s.card}>
        <div style={s.header}>
          <span style={s.micro}>THE SUSPECT BOARD</span>
          <span style={{ ...s.micro, color: '#9A927E' }}>{ruledCount} OF {boardFoods.length} RULED</span>
        </div>

        {visible.map((r) => (
          <div key={r.name} style={s.row}>
            <span style={s.rank}>{r.rank}</span>
            <div style={{ flex: 1, minWidth: 0, opacity: r.done ? 0.62 : 1 }}>
              <div style={s.name}>{r.name}</div>
              <div style={s.sub}>
                <span style={{ color: r.origin.color }}>{r.origin.text}</span>
                {r.freqText && <span>{' · '}{r.freqText}</span>}
                <span>{' · '}{r.detail}</span>
              </div>
            </div>
            <span style={{
              ...s.stamp,
              color: r.stamp.color,
              background: `${r.stamp.color}1F`,
            }}>{r.stamp.label}</span>
          </div>
        ))}

        {collapsible && (
          <button type="button" onClick={() => setExpanded(!expanded)} style={s.toggle}>
            {expanded ? 'Show less' : `Show all ${rows.length}`}
          </button>
        )}

        {neverCount > 0 && (
          <div style={s.footnote}>
            {neverCount} {neverCount === 1 ? 'food' : 'foods'} marked never eaten, excluded from the schedule.
          </div>
        )}
      </div>
    )
  } catch (e) {
    return null
  }
}

const s = {
  card: {
    background: '#FFFFFF',
    border: '1px solid rgba(0,0,0,0.07)',
    borderRadius: 18,
    padding: '18px 18px 14px',
    fontFamily: 'DM Sans, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  micro: {
    fontFamily: 'DM Mono, monospace',
    fontSize: 9,
    letterSpacing: '1.2px',
    textTransform: 'uppercase',
    color: '#3D5C3C',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 0',
    borderTop: '1px solid rgba(0,0,0,0.05)',
  },
  rank: {
    fontFamily: 'DM Mono, monospace',
    fontSize: 10,
    color: '#B8B6AE',
    width: 16,
    flexShrink: 0,
    textAlign: 'right',
  },
  name: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1C1C1C',
    lineHeight: 1.3,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  sub: {
    fontSize: 11,
    color: '#8A8A82',
    marginTop: 1,
    lineHeight: 1.4,
  },
  stamp: {
    fontFamily: 'DM Mono, monospace',
    fontSize: 8,
    letterSpacing: '0.8px',
    textTransform: 'uppercase',
    padding: '2px 7px',
    borderRadius: 5,
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
  toggle: {
    background: 'none',
    border: 'none',
    padding: '8px 0 2px',
    width: '100%',
    textAlign: 'center',
    fontFamily: 'DM Sans, sans-serif',
    fontSize: 12,
    fontWeight: 600,
    color: '#3D5C3C',
    cursor: 'pointer',
  },
  footnote: {
    fontSize: 10,
    color: '#B8B6AE',
    marginTop: 8,
    paddingTop: 8,
    borderTop: '1px solid rgba(0,0,0,0.05)',
  },
}
