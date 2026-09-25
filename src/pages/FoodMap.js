import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { protocolDay } from '../utils/protocolDay'
import { getProtocolFoods } from '../utils/protocolEngine'

// THE FOOD MAP — the trial-strip ledger. Every food is one row: its name, its real
// 14-day trial rendered mark by mark from reintro_daily_logs, and the verdict it
// earned, set in serif at the row's end. Shape = phase (square: ate it, circle:
// washout). Color = outcome (green clean, red symptoms; symptom marks run larger
// for colorblind legibility). Faint specks are days without a record — absence
// stays visible. Nothing on this document is assumed.

const V_COLOR = { Safe: '#3D5C3C', Limit: '#C07A28', Avoid: '#C0392B' }
const FREQ_RANK = { 'daily': 1, '3-5x': 2, '1-2x': 3, 'rarely': 4, 'almost-never': 5, 'never': 6 }

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

  useEffect(() => {
    if (!session?.user?.id) return
    ;(async () => {
      try {
        const [{ data: rr }, { data: rl }] = await Promise.all([
          supabase.from('reintroduction_results').select('*').eq('user_id', session.user.id).order('started_at', { ascending: true }),
          supabase.from('reintro_daily_logs').select('food, log_date, phase, ate_food, had_symptoms, symptoms').eq('user_id', session.user.id),
        ])
        setCycles(rr || []); setLogs(rl || [])
      } catch (e) {}
      setLoaded(true)
    })()
  }, [session?.user?.id])

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
  const logsFor = (cycle) => logs.filter(l => (l.food || '').toLowerCase() === (cycle.food || '').toLowerCase())

  const ruled = universe.filter(f => byFood[f.name.toLowerCase()]?.verdict)
  const testing = universe.filter(f => { const c = byFood[f.name.toLowerCase()]; return c && !c.verdict })
  const queue = universe.filter(f => !byFood[f.name.toLowerCase()])
    .sort((a, b) => (FREQ_RANK[profile?.food_frequency?.[a.name]] || 9) - (FREQ_RANK[profile?.food_frequency?.[b.name]] || 9))
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
            {(l.symptoms || []).length > 0 ? <span style={{ color: '#C0392B' }}>{l.symptoms.join(', ')}</span> : <span style={{ color: '#4C7A4A' }}>Clean</span>}
          </div>
        ))}
        {cycle.verdict_reason && <div style={{ ...s.recLine, marginTop: 8, color: '#5A5A52' }}>{cycle.verdict_reason}</div>}
      </div>
    )
  }

  const Row = ({ food, cycle, ghost, tag, verdictEl }) => {
    const k = food.name.toLowerCase()
    const canOpen = cycle && !ghost
    const trials = trialCount[k] || 0
    return (
      <div style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <div style={{ ...s.row, cursor: canOpen ? 'pointer' : 'default' }} onClick={() => canOpen && setOpenRow(openRow === k ? null : k)}>
          <div style={{ ...s.food, color: ghost ? 'rgba(28,28,28,0.32)' : '#1C1C1C' }}>
            {food.name}
            {trials > 1 && <span style={s.trialTag}>{trials === 2 ? '2ND' : trials + 'TH'} TRIAL</span>}
          </div>
          <Strip cycle={cycle} ghost={ghost} />
          <div style={s.verdict}>{verdictEl || (tag ? <span style={s.ghostTag}>{tag}</span> : null)}</div>
        </div>
        {openRow === k && <Record cycle={cycle} />}
      </div>
    )
  }

  return (
    <div style={s.page}>
      <style>{`@keyframes fmPl { 0%,100% { opacity: 1 } 50% { opacity: 0.35 } }`}</style>
      <div style={s.doc}>
        <div style={s.dochead}>
          <div>
            <div style={s.kicker}>SENSIFY · FOOD MAP{complete ? ' · VERIFIED' : ''}</div>
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

        <div style={s.ledger}>
          {!labResult && (
            <>
              {[{ name: 'Almond' }, { name: 'Coffee' }, { name: 'Dairy' }].map(f => (
                <Row key={f.name} food={f} ghost tag="EXAMPLE" />
              ))}
              <div style={s.awaitNote}>Your lab results choose the foods. Your body rules on each one, day by day, on this document.</div>
            </>
          )}
          {labResult && ruled.map(f => {
            const c = byFood[f.name.toLowerCase()]
            return <Row key={f.name} food={f} cycle={c} verdictEl={<span style={{ ...s.verdictWord, color: V_COLOR[c.verdict] || '#3D5C3C' }}>{c.verdict}</span>} />
          })}
          {labResult && testing.map(f => (
            <Row key={f.name} food={f} cycle={byFood[f.name.toLowerCase()]} verdictEl={<span style={{ ...s.verdictWord, color: '#2C9D8A', animation: 'fmPl 2s infinite' }}>Testing</span>} />
          ))}
          {labResult && queue.map((f, i) => (
            <Row key={f.name} food={f} ghost tag={i === 0 ? (preReintro ? 'DAY 57' : 'NEXT') : ''} />
          ))}
        </div>

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
  doc: { background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 10px 34px rgba(34,48,31,0.07)' },
  dochead: { padding: '25px 26px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  kicker: { fontFamily: 'DM Mono, monospace', fontSize: 8.5, letterSpacing: '2px', color: '#7A7A72', marginBottom: 8, textTransform: 'uppercase' },
  title: { fontFamily: 'Fraunces, serif', fontSize: 27, fontWeight: 400, color: '#1C1C1C', lineHeight: 1.1, fontVariationSettings: "'SOFT' 60, 'WONK' 1" },
  bignum: { fontFamily: 'Fraunces, serif', fontSize: 27, color: '#3D5C3C', lineHeight: 1 },
  bigden: { color: 'rgba(28,28,28,0.25)', fontSize: 18 },
  countLabel: { fontFamily: 'DM Mono, monospace', fontSize: 7.5, letterSpacing: '1.4px', color: '#9A927E', marginTop: 3 },
  ledger: { padding: '2px 26px 4px' },
  row: { display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0' },
  food: { fontFamily: 'Fraunces, serif', fontSize: 16, width: 86, flexShrink: 0, lineHeight: 1.25 },
  trialTag: { display: 'block', fontFamily: 'DM Mono, monospace', fontSize: 6.5, letterSpacing: '1px', color: '#9A927E', marginTop: 2 },
  strip: { display: 'flex', gap: 4, alignItems: 'center', flex: 1, flexWrap: 'wrap' },
  sq: { width: 10, height: 10, borderRadius: 2.5, flexShrink: 0 },
  ci: { width: 9, height: 9, borderRadius: '50%', flexShrink: 0 },
  symSize: { width: 12, height: 12 },
  todayMark: { background: '#2C9D8A', animation: 'fmPl 1.6s infinite', boxShadow: '0 0 8px rgba(44,157,138,0.5)', width: 11, height: 11 },
  speck: { width: 4, height: 4, borderRadius: '50%', background: 'rgba(0,0,0,0.13)', margin: '0 2.5px', flexShrink: 0 },
  verdict: { width: 68, textAlign: 'right', flexShrink: 0 },
  verdictWord: { fontFamily: 'Fraunces, serif', fontSize: 17, fontWeight: 400 },
  ghostTag: { fontFamily: 'DM Mono, monospace', fontSize: 8.5, letterSpacing: '1.2px', color: 'rgba(28,28,28,0.25)' },
  record: { padding: '2px 0 14px', borderTop: '1px dashed rgba(0,0,0,0.07)', marginTop: -1 },
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
