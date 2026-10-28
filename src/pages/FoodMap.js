import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { protocolDay } from '../utils/protocolDay'
import { getProtocolFoods, getTestingOrder } from '../utils/protocolEngine'
// The Food Map download is a real generated PDF (vector, full color, no print
// dialog). jsPDF and the embedded fonts load only when the button is tapped.

// THE FOOD MAP — the trial-strip ledger. Every food is one row: its name, its real
// 14-day trial rendered mark by mark from reintro_daily_logs, and the verdict it
// earned, set in serif at the row's end. Shape = phase (square: ate it, circle:
// washout). Color = outcome (green clean, red symptoms; symptom marks run larger
// for colorblind legibility). Faint specks are days without a record — absence
// stays visible. Nothing on this document is assumed.

const V_COLOR = { Safe: '#3D5C3C', Limit: '#C07A28', Avoid: '#C0392B' }

// 1ST/2ND/3RD/4TH… (QA 2026-10-27 #3: "3TH TRIAL" shipped on the trophy case)
const ordinal = (n) => {
  const rem100 = n % 100
  if (rem100 >= 11 && rem100 <= 13) return `${n}TH`
  return `${n}${({ 1: 'ST', 2: 'ND', 3: 'RD' }[n % 10]) || 'TH'}`
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
  // confident "0 / N RULED" board — earned verdicts shown as nothing.
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

  // The food universe comes from the resolver — the seam. Never the raw lab.
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
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: '#9A927E', letterSpacing: '0.5px' }}>{l.log_date}</span>
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

  const wash = { Safe: ['#EDF3ED', 'rgba(61,92,60,0.14)'], Limit: ['#FBF3E4', 'rgba(192,122,40,0.16)'], Avoid: ['#F9EAE8', 'rgba(192,57,43,0.14)'] }
  const Card = ({ food, cycle, ghost, tag, live }) => {
    const k = food.name.toLowerCase()
    const canOpen = cycle && !ghost
    const trials = trialCount[k] || 0
    const open = openRow === k
    const [bg, bd] = ghost ? ['transparent', 'rgba(0,0,0,0.13)'] : live ? ['#E7F3F0', 'rgba(44,157,138,0.22)'] : (wash[cycle?.verdict] || ['#FFFFFF', 'rgba(0,0,0,0.08)'])
    const dayOf = (iso) => {
      if (!profile?.protocol_start_date || !iso) return null
      const a = new Date(String(profile.protocol_start_date).split('T')[0] + 'T12:00:00')
      const b = new Date(String(iso).split('T')[0] + 'T12:00:00')
      return Math.max(1, Math.round((b - a) / 86400000) + 1)
    }
    // Stamp the day the verdict actually landed (QA 2026-10-27 #6): a severe
    // stop on day 2 or an extended trial never saw day 14.
    const ruledDay = cycle?.verdict
      ? dayOf(cycle.submitted_at ? String(cycle.submitted_at).split('T')[0] : addDays(String(cycle.started_at).split('T')[0], 13))
      : null
    const dayStamp = cycle?.verdict
      ? (ruledDay ? `DAY ${ruledDay}` : null)
      : live && cycle ? `DAY ${Math.min(14, Math.max(1, Math.round((new Date(today + 'T12:00:00') - new Date(String(cycle.started_at).split('T')[0] + 'T12:00:00')) / 86400000) + 1))} OF 14` : null
    return (
      <div className={canOpen ? 'sn-card-hov' : undefined} style={{ ...s.card, background: bg, border: ghost ? `1.5px dashed ${bd}` : 'none', cursor: canOpen ? 'pointer' : 'default', gridColumn: open ? '1 / -1' : 'auto' }} onClick={() => canOpen && setOpenRow(open ? null : k)}>
        {dayStamp && <div style={s.dayStamp}>{dayStamp}</div>}
        <div>
          <div style={{ ...s.fname, color: ghost ? 'rgba(122,122,114,0.5)' : '#7A7A72' }}>{food.name}{trials > 1 && <span style={{ marginLeft: 6, opacity: 0.7 }}>{ordinal(trials)} TRIAL</span>}</div>
          <div style={{ ...s.vword, ...(ghost ? s.vGhost : {}), color: ghost ? 'rgba(28,28,28,0.2)' : live ? '#2C9D8A' : (V_COLOR[cycle?.verdict] || '#1C1C1C'), animation: live ? 'fmPl 2s infinite' : 'none' }}>
            {ghost ? (tag === 'NEXT' || tag === 'DAY 57' ? 'Next.' : 'Awaiting.') : live ? 'On trial.' : `${cycle.verdict}.`}
          </div>
        </div>
        <Strip cycle={ghost ? null : cycle} ghost={ghost} />
        {ghost && tag && <div style={s.ghostCorner}>{tag}</div>}
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
              <div style={s.kicker}>SENSIFY · THE VERDICTS</div>
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

  // THE COVER — elimination era: the finished example wall + the countdown that unlocks theirs.
  if (labResult && preReintro && loaded) {
    const daysLeft = Math.max(1, 57 - currentDay)
    const pct = Math.max(2, Math.min(100, (currentDay / 56) * 100))
    const exCard = (nm, wd, sub, color, bg, bd) => (
      <div key={nm} style={{ borderRadius: 16, padding: '12px 12px 11px', minHeight: 64, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: bg }}>
        <div>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 7, letterSpacing: '1.3px', color: '#7A7A72' }}>{nm}</div>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 19, lineHeight: 1, marginTop: 4, color, fontVariationSettings: "'SOFT' 60, 'WONK' 1" }}>{wd}</div>
        </div>
        <div style={{ fontSize: 8.5, color: '#7A7A72', lineHeight: 1.4, marginTop: 7 }}>{sub}</div>
      </div>
    )
    return (
      <div style={s.page}>
        <div className="sn-rise" style={{ ...s.doc, padding: '24px 24px 20px' }}>
          <div style={s.kicker}>SENSIFY · THE VERDICTS</div>
          <div style={{ ...s.title, fontSize: 25 }}>This is what you're <span style={{ color: '#3D5C3C' }}>working toward.</span></div>
          <div style={{ fontSize: 12, color: '#5A5A52', lineHeight: 1.6, marginTop: 8 }}>A finished wall, shown as an example: every food ruled by a real 14 day trial on a real body. Yours gets earned the same way, one trial at a time.</div>

          <div style={{ marginTop: 18 }}>
            <style>{`@keyframes fmExGlow { 0%,100% { box-shadow: 0 0 0 3px rgba(139,174,138,0.18), 0 0 18px rgba(139,174,138,0.35) } 50% { box-shadow: 0 0 0 3px rgba(139,174,138,0.08), 0 0 7px rgba(139,174,138,0.15) } }`}</style>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <div style={{ background: '#EDF3ED', border: '1.5px solid #8BAE8A', borderRadius: 999, padding: '8px 18px', fontFamily: 'DM Mono, monospace', fontSize: 10, fontWeight: 500, letterSpacing: '2.2px', color: '#3D5C3C', animation: 'fmExGlow 2.8s ease-in-out infinite' }}>EXAMPLE · NOT YOURS YET</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, opacity: 0.82 }}>
              {exCard('WHEAT', 'Safe.', 'No reaction across 14 days', '#3D5C3C', '#EDF3ED', 'rgba(61,92,60,0.13)')}
              {exCard('OATS', 'Safe.', 'No reaction across 14 days', '#3D5C3C', '#EDF3ED', 'rgba(61,92,60,0.13)')}
              {exCard('COFFEE', 'Limit.', 'Mild reaction at full servings', '#C07A28', '#FBF3E4', 'rgba(192,122,40,0.15)')}
              {exCard('GLUTEN', 'Avoid.', 'Reacted on 2 of 3 test days', '#C0392B', '#F9EAE8', 'rgba(192,57,43,0.13)')}
              {exCard('DAIRY', 'Avoid.', 'Reacted, then echoed after', '#C0392B', '#F9EAE8', 'rgba(192,57,43,0.13)')}
              {exCard('EGGS', 'Safe.', 'No reaction across 14 days', '#3D5C3C', '#EDF3ED', 'rgba(61,92,60,0.13)')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 11 }}>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 6, letterSpacing: '1.2px', color: '#9A927E' }}>EXAMPLE · YOURS IS EARNED FROM YOUR OWN TRIALS</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#3D5C3C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Mono, monospace', fontSize: 6.5, color: '#FAF8F4' }}>6/6</div>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 6, letterSpacing: '1px', color: '#3D5C3C', lineHeight: 1.6 }}>SENSIFY<br />VERIFIED</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 16, background: '#22301F', borderRadius: 16, boxShadow: 'var(--shadow-3)', padding: '13px 15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ fontSize: 11.5, color: 'rgba(250,248,244,0.85)', lineHeight: 1.5 }}><b style={{ color: '#FAF8F4', fontWeight: 600 }}>Yours unlocks in</b><br />Day {currentDay} of 56 · every clean day counts</div>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, color: '#8BAE8A', whiteSpace: 'nowrap', lineHeight: 1 }}>{daysLeft} day{daysLeft === 1 ? '' : 's'}</div>
          </div>
          <div className="sn-track" style={{ margin: '16px 0 5px' }}>
            <div className="sn-fill" style={{ width: `${pct}%` }} />
            <div className="sn-dot" style={{ left: `${pct}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'DM Mono, monospace', fontSize: 6, letterSpacing: '1px', color: '#9A927E', marginTop: 7 }}>
            <span>DAY 1</span><span>TRIALS BEGIN · DAY 57</span>
          </div>
        </div>
      </div>
    )
  }

  // Load failure never masquerades as an empty board (QA 2026-10-27 #4).
  if (loaded && loadError) {
    return (
      <div style={s.page}>
        <div className="sn-rise" style={{ ...s.doc, padding: '26px 24px', textAlign: 'center' }}>
          <div style={s.kicker}>SENSIFY · THE VERDICTS</div>
          <div style={{ ...s.title, marginTop: 6 }}>Couldn't load your <span style={{ color: '#3D5C3C' }}>verdicts.</span></div>
          <div style={{ fontSize: 12.5, color: '#5A5A52', lineHeight: 1.6, margin: '10px 0 16px' }}>Your earned verdicts are safe — this page just couldn't reach them. Check your connection and try again.</div>
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
            <div style={s.kicker}>SENSIFY · THE VERDICTS{complete ? ' · VERIFIED' : ''}</div>
            <div style={s.title}>
              {!labResult ? <>A document, <span style={{ color: '#3D5C3C' }}>waiting.</span></>
                : complete ? <>Every verdict, <span style={{ color: '#3D5C3C' }}>earned.</span></>
                : preReintro ? <>{total} trial{total === 1 ? '' : 's'} <span style={{ color: '#3D5C3C' }}>waiting.</span></>
                : <>{name ? `${name}'s` : 'Your'} <span style={{ color: '#3D5C3C' }}>verdicts.</span></>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={s.bignum}>{ruledCount}<span style={s.bigden}> / {total || '—'}</span></div>
            <div style={s.countLabel}>RULED · EARNED</div>
          </div>
        </div>

        {labResult && ruledCount > 0 && (
          <div style={s.printRow}>
            <button
              type="button"
              className="sn-btn sn-btn-quiet"
              style={{ ...s.printBtn, opacity: pdfBusy ? 0.6 : 1 }}
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
            {pdfError && <div style={{ fontSize: 12, color: '#C0392B', marginTop: 6 }}>The download didn't start — try again.</div>}
          </div>
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
            <Card key={f.name} food={f} ghost tag={i === 0 ? (preReintro ? 'DAY 57' : 'NEXT') : ''} />
          ))}
        </div>
        {!labResult && <div style={s.awaitNote}>Your lab results choose the foods. Your body rules on each one, day by day. Every card here gets earned.</div>}
        <div style={s.docfoot}>
          <div style={s.legend}>
            <span style={s.li}><span style={{ ...s.swSq, background: 'rgba(34,48,31,0.35)' }} />ATE THE FOOD</span>
            <span style={s.li}><span style={{ ...s.swCi, background: 'rgba(34,48,31,0.35)' }} />WASHOUT</span>
            <span style={s.li}><span style={{ ...s.swSq, background: '#4C7A4A' }} />NO SYMPTOMS</span>
            <span style={s.li}><span style={{ ...s.swSq, background: '#D64545' }} />SYMPTOMS</span>
          </div>
          <div style={s.sealWrap}>
            <div style={s.fnote}>RULED BY YOUR RECORD<br />NOTHING ASSUMED</div>
            <div style={{ ...s.seal, ...(complete ? s.sealDone : {}) }}>{ruledCount}/{total || 0}</div>
          </div>
        </div>
      </div>
      {labResult && (ruled.length > 0 || testing.length > 0) && (
        <div style={s.tapNote}>Tap any trial for its full record.</div>
      )}
    </div>
  )
}

const s = {
  page: { maxWidth: 640, margin: '0 auto', padding: '28px 18px 60px' },
  doc: { background: 'var(--paper)', border: 'none', borderRadius: 24, overflow: 'hidden', boxShadow: 'var(--shadow-2)' },
  dochead: { padding: '25px 26px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  kicker: { fontFamily: 'DM Mono, monospace', fontSize: 10, fontWeight: 500, letterSpacing: '0.17em', color: 'var(--forest-500)', marginBottom: 8, textTransform: 'uppercase' },
  title: { fontFamily: 'Fraunces, serif', fontSize: 27, fontWeight: 400, color: '#1C1C1C', lineHeight: 1.1, fontVariationSettings: "'SOFT' 60, 'WONK' 1" },
  bignum: { fontFamily: 'Fraunces, serif', fontSize: 27, color: '#3D5C3C', lineHeight: 1 },
  bigden: { color: 'rgba(28,28,28,0.25)', fontSize: 18 },
  countLabel: { fontFamily: 'DM Mono, monospace', fontSize: 7.5, letterSpacing: '1.4px', color: '#9A927E', marginTop: 3 },
  printRow: { padding: '0 26px 10px', display: 'flex', justifyContent: 'flex-end' },
  printBtn: { fontSize: 12, letterSpacing: '0.2px', borderRadius: 999, padding: '9px 16px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 12, padding: '6px 26px 10px' },
  card: { borderRadius: 16, padding: '15px 15px 13px', minHeight: 116, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', gap: 10 },
  dayStamp: { position: 'absolute', top: 12, right: 13, fontFamily: 'DM Mono, monospace', fontSize: 6.5, letterSpacing: '1.1px', color: '#9A927E' },
  fname: { fontFamily: 'DM Mono, monospace', fontSize: 8, letterSpacing: '1.6px', textTransform: 'uppercase' },
  vword: { fontFamily: 'Fraunces, serif', fontSize: 32, lineHeight: 1, marginTop: 7, fontWeight: 400, fontVariationSettings: "'SOFT' 60, 'WONK' 1" },
  vGhost: { fontSize: 20 },
  ghostCorner: { position: 'absolute', top: 12, right: 13, fontFamily: 'DM Mono, monospace', fontSize: 6.5, letterSpacing: '1.1px', color: 'rgba(122,122,114,0.55)' },
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
  docfoot: { marginTop: 4, padding: '13px 26px 19px', borderTop: '1px solid rgba(0,0,0,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  legend: { display: 'flex', gap: 13, alignItems: 'center', flexWrap: 'wrap' },
  li: { display: 'flex', gap: 5, alignItems: 'center', fontFamily: 'DM Mono, monospace', fontSize: 7.5, letterSpacing: '1px', color: '#9A927E' },
  swSq: { width: 9, height: 9, borderRadius: 2.5, display: 'inline-block' },
  swCi: { width: 8, height: 8, borderRadius: '50%', display: 'inline-block' },
  sealWrap: { display: 'flex', alignItems: 'center', gap: 9 },
  fnote: { fontFamily: 'DM Mono, monospace', fontSize: 7, letterSpacing: '1.1px', color: '#9A927E', textAlign: 'right', lineHeight: 1.8 },
  seal: { width: 34, height: 34, borderRadius: '50%', border: '1.5px dashed rgba(61,92,60,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Mono, monospace', fontSize: 8, color: '#3D5C3C', flexShrink: 0 },
  sealDone: { background: '#3D5C3C', border: 'none', color: '#FAF8F4' },
  tapNote: { fontFamily: 'DM Mono, monospace', fontSize: 7.5, letterSpacing: '1.2px', color: '#B5AF9F', textAlign: 'center', marginTop: 12, textTransform: 'uppercase' },
}
