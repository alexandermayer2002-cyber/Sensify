import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { protocolDay } from '../utils/protocolDay'
import { getProtocolFoods, getTestingOrder } from '../utils/protocolEngine'
import { VerdictCard, SuspectCard, cycleStripDays } from '../components/objects'
import { evidenceLine } from '../utils/evidence'
// The Food Map download is a real generated PDF (vector, full color, no print
// dialog). jsPDF and the embedded fonts load only when the button is tapped.

// THE FOOD MAP. the trial-strip ledger. Every food is one row: its name, its real
// 14-day trial rendered mark by mark from reintro_daily_logs, and the verdict it
// earned, set in serif at the row's end. Shape = phase (square: ate it, circle:
// washout). Color = outcome (green clean, red symptoms; symptom marks run larger
// for colorblind legibility). Faint specks are days without a record. absence
// stays visible. Nothing on this document is assumed.

const V_COLOR = { Safe: '#3D5C3C', Limit: '#C07A28', Avoid: '#C0392B' }

// 1ST/2ND/3RD/4TH… (QA 2026-10-27 #3: "3TH TRIAL" shipped on the trophy case)
const ordinal = (n) => {
  const rem100 = n % 100
  if (rem100 >= 11 && rem100 <= 13) return `${n}TH`
  return `${n}${({ 1: 'ST', 2: 'ND', 3: 'RD' }[n % 10]) || 'TH'}`
}

// Day-0 echo (Advisor 2026-11-08 #4, approved by Alex 2026-11-10): the person
// narrated their history at intake and the product never said it back. The
// Food Map opens with their own day-0 words, closing the covenant at the
// finish line. Built only from fields the intake actually captured; absent
// fields mean no echo, never a guess.
export const dayZeroEcho = (profile, days) => {
  const a = profile?.intake_answers || {}
  const dur = {
    'Less than 6 months': 'less than six months in',
    '6–12 months': 'under a year in',
    '1–3 years': 'years in the making',
    'More than 3 years': 'more than three years running',
  }[a.digestive_duration]
  const sym = {
    'After every meal': 'bloating after every meal',
    'After specific foods': 'bloating after specific foods',
    'Randomly throughout the day': 'bloating that struck at random',
    'Mostly in the morning': 'morning bloating',
    'Mostly in the evening': 'evening bloating',
  }[a.bloating_timing]
  if (!sym && !dur) return null
  const came = sym && dur ? `${sym}, ${dur}` : (sym || `digestive symptoms ${dur}`)
  return days > 0 ? `You came in with ${came}. Here is what your own record showed.` : `You came in with ${came}.`
}

const localDate = (d) => {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}
const addDays = (iso, n) => {
  const d = new Date(iso + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return localDate(d)
}

export default function FoodMap({ session, profile, labResult }) {
  const [cycles, setCycles] = useState([])
  const [logs, setLogs] = useState([])
  const [openRow, setOpenRow] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [pdfBusy, setPdfBusy] = useState(false)
  const [pdfError, setPdfError] = useState(false)

  // Named + retryable (QA 2026-10-27 #4): a failed fetch used to render a
  // confident "0 / N RULED" board. earned verdicts shown as nothing.
  const loadVerdicts = async () => {
    if (!session?.user?.id) return
    setLoadError(false)
    try {
      const [{ data: rr, error: e1 }, { data: rl, error: e2 }] = await Promise.all([
        supabase.from('reintroduction_results').select('*').eq('user_id', session.user.id).order('started_at', { ascending: true }),
        supabase.from('reintro_daily_logs').select('reintro_id, food, log_date, phase, ate_food, had_symptoms, symptoms').eq('user_id', session.user.id),
      ])
      if (e1 || e2) throw new Error((e1 || e2).message)
      setCycles(rr || []); setLogs(rl || [])
    } catch (e) { setLoadError(true) }
    setLoaded(true)
  }
  useEffect(() => { loadVerdicts() }, [session?.user?.id])  // eslint-disable-line

  const name = profile?.full_name?.split(' ')[0]
  const currentDay = profile?.protocol_start_date ? protocolDay(profile.protocol_start_date) : 0
  const today = localDate(new Date())

  // The food universe comes from the resolver. the seam. Never the raw lab.
  const resolved = labResult ? getProtocolFoods(profile, labResult) : null
  const universe = (resolved?.foods || []).filter(f => {
    const freq = profile?.food_frequency?.[f.name]
    return freq !== 'never'
  })

  // Latest cycle per food + trial counts
  const byFood = {}
  const trialCount = {}
  for (const c of cycles) {
    const k = (c.food || '').toLowerCase()
    trialCount[k] = (trialCount[k] || 0) + 1
    byFood[k] = c
  }
  // Per-trial, not per-food (QA 2026-10-27 #2): matching by name merged every
  // retest's history into one record and let the PDF mix trials.
  const logsFor = (cycle) => logs.filter(l => l.reintro_id === cycle.id || (!l.reintro_id && (l.food || '').toLowerCase() === (cycle.food || '').toLowerCase()))

  const V_ORDER = { Safe: 1, Limit: 2, Avoid: 3 }
  const ruled = universe.filter(f => byFood[f.name.toLowerCase()]?.verdict)
    .sort((a, b) => {
      const ca = byFood[a.name.toLowerCase()], cb = byFood[b.name.toLowerCase()]
      const va = V_ORDER[ca.verdict] || 9, vb = V_ORDER[cb.verdict] || 9
      if (va !== vb) return va - vb
      return String(ca.started_at) < String(cb.started_at) ? -1 : 1
    })
  const testing = universe.filter(f => { const c = byFood[f.name.toLowerCase()]; return c && !c.verdict })
  const queue = getTestingOrder(universe.filter(f => !byFood[f.name.toLowerCase()]), profile?.food_frequency)
  const total = universe.length
  const ruledCount = ruled.length
  const complete = total > 0 && ruledCount === total
  const preReintro = currentDay > 0 && currentDay < 57 && cycles.length === 0

  // ---- One trial strip: the 14 real days, marked honestly ----
  const Strip = ({ cycle, ghost }) => {
    if (ghost || !cycle) {
      return (
        <div style={s.strip}>
          {Array.from({ length: 14 }).map((_, i) => <span key={i} style={s.speck} />)}
        </div>
      )
    }
    const start = String(cycle.started_at).split('T')[0]
    const dayLogs = {}
    for (const l of logsFor(cycle)) dayLogs[l.log_date] = l
    const marks = []
    for (let i = 0; i < 14; i++) {
      const date = addDays(start, i)
      const log = dayLogs[date]
      const isToday = !cycle.verdict && date === today
      const future = date > today
      if (isToday) {
        const exposurePhase = !cycle.washout_started_at
        marks.push(<span key={i} style={{ ...(exposurePhase ? s.sq : s.ci), ...s.todayMark }} />)
      } else if (future || !log) {
        marks.push(<span key={i} style={s.speck} />)
      } else {
        const bad = log.had_symptoms || (log.symptoms || []).length > 0
        const ate = log.ate_food === true
        const base = ate ? s.sq : s.ci
        marks.push(<span key={i} style={{ ...base, background: bad ? '#D64545' : (ate ? '#4C7A4A' : '#9DBD9C'), ...(bad ? s.symSize : {}) }} />)
      }
    }
    return <div style={s.strip}>{marks}</div>
  }

  // ---- One expandable day-record ----
  const Record = ({ cycle }) => {
    if (!cycle) return null
    const rows = logsFor(cycle).sort((a, b) => a.log_date < b.log_date ? -1 : 1)
    return (
      <div style={s.record}>
        <div style={s.recNote}>Squares are days {name ? name : 'you'} ate it. Circles are washout: the food back out, the body watched for echoes.</div>
        {rows.length === 0 && <div style={s.recLine}>No daily records exist for this trial.</div>}
        {rows.map((l, i) => (
          <div key={i} style={s.recLine}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 9, color: '#9A927E', letterSpacing: '0' }}>{l.log_date}</span>
            <span style={{ margin: '0 8px', color: '#C9C5B8' }}>·</span>
            {l.ate_food === true ? 'Ate it' : 'Washout'}
            <span style={{ margin: '0 8px', color: '#C9C5B8' }}>·</span>
            {(l.symptoms || []).length > 0 ? <span style={{ color: '#C0392B' }}>{(l.symptoms || []).map(s => typeof s === 'string' ? s : s?.name).filter(Boolean).join(', ')}</span> : <span style={{ color: '#4C7A4A' }}>Clean</span>}
          </div>
        ))}
        {cycle.verdict_reason && <div style={{ ...s.recLine, marginTop: 8, color: '#5A5A52' }}>{cycle.verdict_reason}</div>}
      </div>
    )
  }

  // Refresh 2026-11-13: cards are the shared Verdict / Suspect objects.
  // Verdict colors only on rulings; no tinted washes; tap a ruled card for
  // its full record.
  const Card = ({ food, cycle, ghost, tag, live }) => {
    const k = food.name.toLowerCase()
    const canOpen = cycle && !ghost
    const trials = trialCount[k] || 0
    const open = openRow === k
    const wrap = { gridColumn: open ? '1 / -1' : 'auto', cursor: canOpen ? 'pointer' : 'default' }
    const onClick = canOpen ? () => setOpenRow(open ? null : k) : undefined
    if (ghost) {
      return (
        <div style={wrap}>
          <SuspectCard food={food.name} meta={tag === 'EXAMPLE' ? 'Example. Your lab results choose the real list.' : undefined}
            state={tag === 'NEXT' || tag === 'DAY 57' ? 'next' : 'suspect'}
            line={tag === 'DAY 57' ? 'First trial opens on day 57.' : tag === 'NEXT' ? 'Starts the day you pick it.' : 'Still off your plate. Not yet tried.'} />
        </div>
      )
    }
    if (live) {
      const cd = Math.min(14, Math.max(1, Math.round((new Date(today + 'T12:00:00') - new Date(String(cycle.started_at).split('T')[0] + 'T12:00:00')) / 86400000) + 1))
      return (
        <div style={wrap} onClick={onClick}>
          <VerdictCard food={food.name} state="trial" evidence={`Day ${cd} of 14.`} />
          {open && <Record cycle={cycle} />}
        </div>
      )
    }
    const ev = evidenceLine(cycle, logs.filter(l => l.reintro_id === cycle.id))
    return (
      <div style={wrap} onClick={onClick}>
        <VerdictCard food={food.name} meta={trials > 1 ? `${ordinal(trials)} trial.` : undefined} state="ruled" verdict={cycle.verdict} evidence={ev}
          days={cycleStripDays(cycle, logs.filter(l => l.reintro_id === cycle.id), today)}
          conflicted={cycle.answers?.conflicted === true} stoppedEarly={!!cycle.stopped_early} />
        {open && <Record cycle={cycle} />}
      </div>
    )
  }

  // Tracking mode: the user declined the protocol. No queue, no promised
  // cycles, no example wall (intentional cut, ruled 2026-10-23): the tab
  // explains what verdicts are in text and names the door back to the
  // protocol, assuming nothing about the user's foods.
  if (profile?.track_decision === 'declined' && loaded) {
    return (
      <div style={s.page}>
        <div className="sn-rise" style={s.doc}>
          <div style={s.dochead}>
            <div>
              <div style={s.kicker}>The verdicts</div>
              <div style={s.title}>Earned by <span style={{ color: '#3D5C3C' }}>testing.</span></div>
            </div>
          </div>
          <div style={{ padding: '0 26px 24px' }}>
            <div style={{ fontSize: 12.5, color: '#5A5A52', lineHeight: 1.65, marginBottom: 14 }}>Verdicts come from reintroduction trials: a food returns to your plate for a 14 day cycle and your own logs rule it Safe, Limit, or Avoid. You're tracking for now, so no trials are scheduled and nothing here is assumed about your foods.</div>
            <div style={{ fontSize: 12.5, color: '#5A5A52', lineHeight: 1.65 }}>If your tracking starts pointing at food, start the full protocol from your Home tab and this page becomes yours to earn.</div>
          </div>
        </div>
      </div>
    )
  }

  // THE COVER. elimination era: the finished example wall + the countdown that unlocks theirs.
  if (labResult && preReintro && loaded) {
    // Refresh 2026-11-19 (look audit #2b): no coloured example wall, no
    // confetti, no verdict colours before a verdict. One calm page: the day
    // counter, what a verdict is, and the person's own suspects in order.
    const daysLeft = Math.max(1, 57 - currentDay)
    return (
      <div style={s.page}>
        <div className="ob-paper sn-rise" style={{ padding: '34px 36px' }}>
          <div style={s.title}>Your verdicts live here.</div>
          <div style={{ fontSize: 15, color: '#434B44', lineHeight: 1.55, marginTop: 10, maxWidth: 620 }}>
            Each one is earned from a fourteen-day trial of a single food on your own record. None exists yet, because no trial has run. The first opens on day 57.
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 26 }}>
            <span style={{ fontFamily: 'Fraunces, serif', fontSize: 64, fontWeight: 300, letterSpacing: '-0.03em', lineHeight: 1, color: '#151E18' }}>{daysLeft}</span>
            <span style={{ fontSize: 16, color: '#434B44' }}>clean night{daysLeft === 1 ? '' : 's'} to go. Day {currentDay} of 56.</span>
          </div>
        </div>
        {queue.length > 0 && (
          <>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 300, letterSpacing: '-0.02em', margin: '36px 0 6px', color: '#151E18' }}>What will be ruled, in order.</div>
            <div style={{ fontSize: 14.5, color: '#434B44', marginBottom: 18 }}>Ordered by how often you eat each food, with the lab level breaking ties.</div>
            <div style={s.grid}>
              {queue.map((f, i) => (
                <SuspectCard key={f.name} food={f.name} meta={f.level && f.level !== 'Common' ? `Lab flagged, ${String(f.level).toLowerCase()}.` : 'Common trigger.'} state="suspect" line={i === 0 ? 'First on trial, from day 57.' : `${['Second','Third','Fourth','Fifth','Sixth','Seventh','Eighth','Ninth','Tenth'][i - 1] || `${i + 1}th`} in line.`} />
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  // Load failure never masquerades as an empty board (QA 2026-10-27 #4).
  if (loaded && loadError) {
    return (
      <div style={s.page}>
        <div className="sn-rise" style={{ ...s.doc, padding: '26px 24px', textAlign: 'center' }}>
          <div style={s.kicker}>The verdicts</div>
          <div style={{ ...s.title, marginTop: 6 }}>Couldn't load your <span style={{ color: '#3D5C3C' }}>verdicts.</span></div>
          <div style={{ fontSize: 12.5, color: '#5A5A52', lineHeight: 1.6, margin: '10px 0 16px' }}>Your earned verdicts are safe, this page just couldn't reach them. Check your connection and try again.</div>
          <button className="sn-btn" style={{ width: '100%' }} onClick={() => { setLoaded(false); loadVerdicts() }}>Try again</button>
        </div>
      </div>
    )
  }

  return (
    <div style={s.page}>
      <style>{`@keyframes fmPl { 0%,100% { opacity: 1 } 50% { opacity: 0.35 } }`}</style>
      <div className="sn-rise" style={s.doc}>
        <div style={s.dochead}>
          <div>
            <div style={s.title}>
              {!labResult ? 'Your verdicts live here.'
                : complete ? 'Every verdict, earned.'
                : preReintro ? `${total} trial${total === 1 ? '' : 's'} waiting for day 57.`
                : 'Your Food Map, so far.'}
            </div>
            <div style={{ fontSize: 14, color: '#737B73', marginTop: 6, lineHeight: 1.5 }}>Each verdict is ruled by a fourteen-day single-food trial on your own daily record. Nothing is assumed.</div>
          </div>
          <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
            <span style={s.bignum}>{ruledCount}</span><span style={s.bigden}> of {total || 0} ruled</span>
          </div>
        </div>

        {labResult && ruledCount > 0 && (() => {
          // Refresh 2026-11-19 (look audit #2): the Food Map as one object you
          // would keep. Name, date, the rulings grouped, one save action. The
          // same groups the PDF prints.
          const groups = ['Safe', 'Limit', 'Avoid'].map(v => ({ v, foods: ruled.filter(f => byFood[f.name.toLowerCase()].verdict === v).map(f => f.name) })).filter(g => g.foods.length)
          const printedOn = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
          const VC = { Safe: 'var(--safe, #1F9C87)', Limit: 'var(--limit, #D98A1C)', Avoid: 'var(--avoid, #CF4B4B)' }
          return (
            <div className="ob-paper fm-keep" style={{ padding: '34px 36px 28px', marginBottom: 28, position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: 34, fontWeight: 300, letterSpacing: '-0.02em', color: '#151E18', lineHeight: 1.05 }}>{name ? `${name}’s` : 'Your'} Food Map.</div>
                <div style={{ fontSize: 13.5, color: '#737B73' }}>{complete ? 'Complete' : `${ruledCount} of ${total} ruled`}, {printedOn}</div>
              </div>
              <div style={{ fontSize: 14.5, color: '#434B44', margin: '8px 0 24px', maxWidth: 640, lineHeight: 1.5 }}>Ruled by your own record. Each verdict is a fourteen-day single-food trial, nothing assumed.</div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${groups.length}, 1fr)`, gap: 24 }}>
                {groups.map(g => (
                  <div key={g.v}>
                    <div style={{ fontFamily: 'Fraunces, serif', fontSize: 40, fontWeight: 400, letterSpacing: '-0.03em', lineHeight: 1, color: VC[g.v], marginBottom: 12 }}>{g.v}.</div>
                    {g.foods.map(fd => <div key={fd} style={{ fontSize: 17, color: '#151E18', padding: '7px 0', borderTop: '1px solid rgba(21,30,24,.08)' }}>{fd}</div>)}
                  </div>
                ))}
              </div>
              {(testing.length > 0 || queue.length > 0) && (
                <div style={{ fontSize: 13.5, color: '#737B73', marginTop: 22, lineHeight: 1.5 }}>
                  {testing.length > 0 ? `On trial now: ${testing.map(f => f.name).join(', ')}. ` : ''}{queue.length > 0 ? `Not yet tried: ${queue.map(f => f.name).join(', ')}.` : ''}
                </div>
              )}
            </div>
          )
        })()}

        {/* First-paint honesty for the ghosted board (QA 2026-11-10 first-timer
            #9, approved by Alex): near-zero-contrast rows read as "the page is
            broken" until the explanation was found a scroll below. */}
        {labResult && preReintro && (
          <div style={{ fontSize: 12.5, color: '#73736A', lineHeight: 1.6, margin: '2px 0 12px' }}>
            The faded rows are your trials to come, they unlock on day 57. Nothing here is broken, just not earned yet.
          </div>
        )}
        {labResult && ruledCount > 0 && dayZeroEcho(profile, currentDay) && (
          <div style={{ fontSize: 14, color: '#434B44', lineHeight: 1.6, margin: '2px 0 16px' }}>
            {dayZeroEcho(profile, currentDay)}
          </div>
        )}

        {labResult && ruledCount > 0 && (
          <div style={s.printRow}>
            <button
              type="button"
              className="ob-btn tonight"
              style={{ opacity: pdfBusy ? 0.6 : 1 }}
              disabled={pdfBusy}
              onClick={async () => {
                if (pdfBusy) return
                setPdfBusy(true)
                setPdfError(false)
                try {
                  const { generateFoodMapPdf } = await import('../utils/foodMapPdf')
                  generateFoodMapPdf({
                    firstName: name,
                    protocolStart: profile?.protocol_start_date,
                    echo: dayZeroEcho(profile, currentDay),
                    entries: ruled.map(f => { const c = byFood[f.name.toLowerCase()]; return { name: f.name, cycle: c, logs: logsFor(c) } }),
                    // On-trial foods are not "untested" (QA 2026-10-27 #5).
                    untested: queue.map(f => f.name),
                    onTrial: testing.map(f => f.name),
                  })
                } catch (e) { setPdfError(true) /* QA 2026-10-27 #4: never fail mutely */ }
                setPdfBusy(false)
              }}
            >
              {pdfBusy ? 'Preparing your Food Map...' : 'Download your Food Map'}
            </button>
            {pdfError && <div style={{ fontSize: 12, color: '#C0392B', marginTop: 6 }}>The download didn't start, try again.</div>}
          </div>
        )}

        {labResult && ruledCount > 0 && (
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, letterSpacing: '-.01em', color: '#151E18', margin: '32px 0 14px' }}>Each ruling, with its record.</div>
        )}
        <div style={s.grid}>
          {!labResult && (
            [{ name: 'Almond' }, { name: 'Coffee' }, { name: 'Dairy' }].map(f => (
              <Card key={f.name} food={f} ghost tag="EXAMPLE" />
            ))
          )}
          {labResult && testing.map(f => (
            <Card key={f.name} food={f} cycle={byFood[f.name.toLowerCase()]} live />
          ))}
          {labResult && ruled.map(f => (
            <Card key={f.name} food={f} cycle={byFood[f.name.toLowerCase()]} />
          ))}
          {labResult && queue.map((f, i) => (
            <Card key={f.name} food={f} ghost tag={i === 0 && testing.length === 0 ? (preReintro ? 'DAY 57' : 'NEXT') : ''} />
          ))}
        </div>
        {!labResult && <div style={s.awaitNote}>Your lab results choose the foods. Your body rules on each one, day by day. Every card here gets earned.</div>}
        <div style={s.docfoot}>
          <div style={s.legend}>
            <span style={{ fontSize: 12.5, color: '#737B73' }}>Tap a ruled food for its day-by-day record.</span>
          </div>
          <div style={s.sealWrap}>
            <div style={{ fontSize: 12.5, color: '#737B73', textAlign: 'right', lineHeight: 1.4 }}>Ruled by your record.<br />Nothing assumed.</div>
          </div>
        </div>
      </div>
      {labResult && (ruled.length > 0 || testing.length > 0) && (
        null
      )}
    </div>
  )
}

const s = {
  page: { maxWidth: 1180, margin: '0 auto', padding: '28px 20px 60px' },
  doc: { background: 'transparent' },
  dochead: { padding: '8px 0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  kicker: { fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 500, letterSpacing: '0', color: 'var(--forest-500)', marginBottom: 8, textTransform: 'none' },
  title: { fontFamily: 'Fraunces, serif', fontSize: 30, fontWeight: 300, color: '#151E18', lineHeight: 1.05, letterSpacing: '-0.02em' },
  bignum: { fontFamily: 'Fraunces, serif', fontSize: 30, fontWeight: 300, color: '#151E18', lineHeight: 1, letterSpacing: '-0.02em' },
  bigden: { color: 'rgba(28,28,28,0.25)', fontSize: 18 },
  countLabel: { fontFamily: 'var(--font-body)', fontSize: 7.5, letterSpacing: '0', color: '#9A927E', marginTop: 3 },
  printRow: { padding: '0 0 28px', display: 'flex', justifyContent: 'flex-start', marginTop: -10 },
  printBtn: { fontSize: 12, letterSpacing: '0', borderRadius: 999, padding: '9px 16px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 16, padding: '6px 0 10px' },
  card: { borderRadius: 16, padding: '15px 15px 13px', minHeight: 116, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', gap: 10 },
  dayStamp: { position: 'absolute', top: 12, right: 13, fontFamily: 'var(--font-body)', fontSize: 6.5, letterSpacing: '0', color: '#9A927E' },
  fname: { fontFamily: 'var(--font-body)', fontSize: 8, letterSpacing: '0', textTransform: 'none' },
  vword: { fontFamily: 'Fraunces, serif', fontSize: 32, lineHeight: 1, marginTop: 7, fontWeight: 400, fontVariationSettings: "'SOFT' 60, 'WONK' 1" },
  vGhost: { fontSize: 20 },
  ghostCorner: { position: 'absolute', top: 12, right: 13, fontFamily: 'var(--font-body)', fontSize: 6.5, letterSpacing: '0', color: 'rgba(122,122,114,0.55)' },
  strip: { display: 'flex', gap: 4, alignItems: 'center', flex: 1, flexWrap: 'wrap' },
  sq: { width: 10, height: 10, borderRadius: 3, flexShrink: 0, boxShadow: '0 1px 3px rgba(32,36,31,0.16)' },
  ci: { width: 9, height: 9, borderRadius: '50%', flexShrink: 0, boxShadow: '0 1px 3px rgba(32,36,31,0.16)' },
  symSize: { width: 12, height: 12 },
  todayMark: { background: '#2C9D8A', animation: 'fmPl 1.6s infinite', boxShadow: '0 0 7px rgba(44,157,138,0.5)', width: 11, height: 11 },
  speck: { width: 4, height: 4, borderRadius: '50%', background: 'rgba(0,0,0,0.12)', margin: '0 2px', flexShrink: 0 },
  record: { padding: '10px 0 2px', borderTop: '1px dashed rgba(0,0,0,0.12)', marginTop: 2 },
  recNote: { fontSize: 11, color: '#9A927E', lineHeight: 1.6, padding: '10px 0 8px' },
  recLine: { fontSize: 12, color: '#1C1C1C', lineHeight: 2 },
  awaitNote: { fontSize: 11.5, color: '#9A927E', lineHeight: 1.65, padding: '14px 0 16px' },
  docfoot: { marginTop: 18, padding: '14px 0 0', borderTop: '1px solid rgba(21,30,24,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  legend: { display: 'flex', gap: 13, alignItems: 'center', flexWrap: 'wrap' },
  li: { display: 'flex', gap: 5, alignItems: 'center', fontFamily: 'var(--font-body)', fontSize: 7.5, letterSpacing: '0', color: '#9A927E' },
  swSq: { width: 9, height: 9, borderRadius: 2.5, display: 'inline-block' },
  swCi: { width: 8, height: 8, borderRadius: '50%', display: 'inline-block' },
  sealWrap: { display: 'flex', alignItems: 'center', gap: 9 },
  fnote: { fontFamily: 'var(--font-body)', fontSize: 7, letterSpacing: '0', color: '#9A927E', textAlign: 'right', lineHeight: 1.8 },
  seal: { width: 34, height: 34, borderRadius: '50%', border: '1.5px dashed rgba(61,92,60,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body)', fontSize: 8, color: '#3D5C3C', flexShrink: 0 },
  sealDone: { background: '#3D5C3C', border: 'none', color: '#FAF8F4' },
  tapNote: { fontFamily: 'var(--font-body)', fontSize: 7.5, letterSpacing: '0', color: '#B5AF9F', textAlign: 'center', marginTop: 12, textTransform: 'none' },
}
