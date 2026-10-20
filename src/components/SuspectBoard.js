import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { getTestingOrder } from '../utils/protocolEngine'

// THE SUSPECT BOARD, the case file that stays open during the quiet eight weeks.
// Every protocol food is a dossier row whose stamp moves SUSPECT -> ON TRIAL ->
// its earned verdict. Queued suspects carry an honest (~) estimate of when their
// trial opens, derived from the protocol clock: elimination runs day 1-56, then
// 14-day cycles in testing order from day 57.
//
// PRESENTATION (redesign): plain-words intro + "How this works" expander, a
// fixed-width aligned stamp column, consistent row height, and the NEXT queued
// suspect highlighted since it is the food the user will test first. Rows that
// are ON TRIAL or UP NEXT become tappable (with a chevron) when the optional
// onOpenReintro callback prop is passed; with no prop they render exactly as
// before. All schedule math and data fetching are untouched.

const ELIMINATION_DAYS = 56
const CYCLE_DAYS = 14

// Stamps ride the system's .sn-stamp classes: verdict colors appear only here.
const STAMP = {
  Suspect: { label: 'SUSPECT', cls: 'sn-stamp-quiet' },
  Trial:   { label: 'ON TRIAL', cls: 'sn-stamp-live' },
  Safe:    { label: 'SAFE', cls: 'sn-stamp-safe' },
  Limit:   { label: 'LIMIT', cls: 'sn-stamp-limit' },
  Avoid:   { label: 'AVOID', cls: 'sn-stamp-avoid' },
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

export default function SuspectBoard({ session, profile, labResult, onOpenReintro }) {
  const [cycles, setCycles] = useState([])
  // null = fetch in flight, 'ok' = loaded, 'err' = failed. The board renders
  // nothing until it knows: a half-loaded board reads "0 OF N RULED" with
  // earned verdicts missing, which is worse than a moment of blank space.
  const [loadState, setLoadState] = useState(null)
  const [expanded, setExpanded] = useState(false)
  const [showHow, setShowHow] = useState(false)

  useEffect(() => {
    if (!session?.user?.id) return
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('reintroduction_results')
          .select('food, verdict, started_at, washout_started_at')
          .eq('user_id', session.user.id)
          .order('started_at', { ascending: true })
        if (error) { setLoadState('err'); return }
        setCycles(data || [])
        setLoadState('ok')
      } catch (e) { setLoadState('err') }
    })()
  }, [session?.user?.id])

  // In flight or failed: show nothing rather than wrong case statuses.
  if (loadState !== 'ok') return null

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
    // The first queued suspect is UP NEXT: it is the food the user tests first.
    let queueIndex = 0
    const rows = boardFoods.map((food, idx) => {
      const cycle = byFood[food.name.toLowerCase()]
      let stamp, detail, done = false, active = false, next = false, queuedFirst = false
      if (cycle?.verdict && STAMP[cycle.verdict]) {
        stamp = STAMP[cycle.verdict]
        detail = 'Trial complete'
        done = true
      } else if (cycle) {
        stamp = STAMP.Trial
        detail = cycle.washout_started_at ? 'In washout' : 'In exposure'
        active = true
      } else {
        stamp = STAMP.Suspect
        detail = queueBase ? `Trial opens ~${fmt(addDays(queueBase, CYCLE_DAYS * queueIndex))}` : 'Awaiting protocol start'
        queuedFirst = queueIndex === 0
        next = queuedFirst && !activeCycle // highlight only when it is truly next up
        queueIndex += 1
      }
      const origin = food.level === 'Common'
        ? { text: 'Common trigger', color: '#8A8A82' }
        : { text: `Lab · ${food.level}`, color: LEVEL_COLOR[food.level] || '#8A8A82' }
      return { rank: idx + 1, name: food.name, origin, freqText: FREQ_TEXT[freq[food.name]] || null, stamp, detail, done, active, next, queuedFirst }
    })

    const collapsible = rows.length > 6
    const visible = collapsible && !expanded ? rows.slice(0, 6) : rows
    const hasOpen = typeof onOpenReintro === 'function'

    return (
      <div className="sn-card" style={s.card}>
        <style>{`.snsb-tap { transition: background 160ms ease; } @media (hover: hover) { .snsb-tap:hover { background: var(--forest-050); } }`}</style>
        <div style={s.header}>
          <span className="sn-micro">THE SUSPECT BOARD</span>
          <span className="sn-micro sn-micro-dim">{ruledCount} OF {boardFoods.length} RULED</span>
        </div>

        <div style={s.intro}>
          Every food your protocol removed and where its case stands: suspect, on trial, or ruled.{' '}
          <button type="button" style={s.howBtn} onClick={() => setShowHow(v => !v)}>
            {showHow ? 'Hide' : 'How this works'}
          </button>
        </div>

        {showHow && (
          <div style={s.howPanel}>
            Each food stays off your plate through elimination, then comes back one at a time for its own 14 day trial: three exposure days, then a washout while your record settles. The ~dates are estimates from your protocol clock (elimination runs 56 days, trials begin day 57, one trial per 14 days) and shift if a trial restarts or runs long. Every verdict is earned from your own check-ins, never assumed.
          </div>
        )}

        <div style={{ marginTop: 10 }}>
          {visible.map((r) => {
            const tappable = hasOpen && (r.active || r.queuedFirst)
            const rowStyle = {
              ...s.row,
              ...(r.next ? s.rowNext : null),
              ...(tappable ? { cursor: 'pointer' } : null),
            }
            return (
              <div
                key={r.name}
                className={tappable ? 'snsb-tap' : undefined}
                style={rowStyle}
                onClick={tappable ? () => onOpenReintro(r.name) : undefined}
                role={tappable ? 'button' : undefined}
                tabIndex={tappable ? 0 : undefined}
                onKeyDown={tappable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenReintro(r.name) } } : undefined}
              >
                <span style={s.rank}>{r.rank}</span>
                <div style={{ flex: 1, minWidth: 0, opacity: r.done ? 0.62 : 1 }}>
                  <div style={s.nameLine}>
                    <span style={s.name}>{r.name}</span>
                    {r.next && <span className="sn-micro" style={s.nextTag}>UP NEXT</span>}
                  </div>
                  <div style={s.sub}>
                    <span style={{ color: r.origin.color }}>{r.origin.text}</span>
                    {r.freqText && <span>{' · '}{r.freqText}</span>}
                    <span>{' · '}{r.detail}</span>
                  </div>
                </div>
                <span style={s.stampCol}>
                  <span className={`sn-stamp ${r.stamp.cls}`} style={s.stamp}>{r.stamp.label}</span>
                </span>
                {hasOpen && (
                  <span style={{ ...s.chevron, visibility: tappable ? 'visible' : 'hidden' }}>›</span>
                )}
              </div>
            )
          })}
        </div>

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
    padding: '22px 22px 16px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  intro: { fontSize: 12, color: '#8A8A82', lineHeight: 1.55 },
  howBtn: {
    background: 'none', border: 'none', padding: 0,
    fontSize: 12, fontWeight: 600, color: '#3D5C3C', cursor: 'pointer',
    textDecoration: 'underline', textUnderlineOffset: 2,
  },
  howPanel: {
    background: 'var(--tint-warm)', borderRadius: 10, padding: '10px 12px', marginTop: 8,
    fontSize: 11.5, color: '#7A7A72', lineHeight: 1.6,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    padding: '8px 10px',
    boxSizing: 'border-box',
    borderRadius: 10,
  },
  rowNext: {
    background: 'linear-gradient(135deg, rgba(139, 174, 138, 0.15), rgba(139, 174, 138, 0.05))',
    margin: '4px 0',
  },
  rank: {
    fontFamily: 'DM Mono, monospace',
    fontSize: 10,
    color: '#B8B6AE',
    width: 16,
    flexShrink: 0,
    textAlign: 'right',
  },
  nameLine: { display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 },
  name: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1C1C1C',
    lineHeight: 1.3,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  nextTag: {
    fontSize: 8,
    background: 'var(--forest-100)',
    borderRadius: 999,
    padding: '2px 7px',
    flexShrink: 0,
  },
  sub: {
    fontSize: 11,
    color: '#8A8A82',
    marginTop: 1,
    lineHeight: 1.4,
  },
  stampCol: {
    width: 72,
    flexShrink: 0,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  stamp: {
    whiteSpace: 'nowrap',
  },
  chevron: {
    fontSize: 16,
    color: '#B8B6AE',
    flexShrink: 0,
    width: 10,
    textAlign: 'center',
    lineHeight: 1,
  },
  toggle: {
    background: 'none',
    border: 'none',
    padding: '8px 0 2px',
    width: '100%',
    textAlign: 'center',
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
