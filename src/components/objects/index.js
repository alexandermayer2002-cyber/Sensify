import React from 'react'
import './objects.css'

// THE SEVEN SHARED OBJECTS (presentational only: data in, markup out).
// Screens assemble these; none of them talks to Supabase. State lists are
// fixed by qa/SCREENS.md §3 and the approved objects sheet (2026-11-13).

/* ------------------------------------------------------------------ */
/* 1. 14-day strip                                                     */
/* days: array of states, in order. Allowed states:                    */
/*   'on' | 'exposure' | 'exposure-planned' | 'slipped' | 'none'        */
/*   | 'away' | 'today' | 'today-exposure' | 'future'                   */
/* size: 'sm' | 'md' | 'lg'                                             */
const STRIP_STATES = new Set(['on', 'exposure', 'exposure-planned', 'slipped', 'none', 'away', 'today', 'today-on', 'today-slipped', 'today-exposure', 'future'])
const STRIP_WORDS = {
  on: 'on plan', exposure: 'exposure day', 'exposure-planned': 'exposure day, coming',
  slipped: 'slipped', none: 'no check-in', away: 'away on plan', today: 'today',
  'today-on': 'today, logged', 'today-slipped': 'today, logged a slip', 'today-exposure': 'today, exposure day', future: 'coming',
}
export function Strip({ days = [], size = 'md', label, startDay = 1 }) {
  return (
    <div className={`ob-strip ${size === 'sm' ? 'ob-sm' : size === 'lg' ? 'ob-lg' : ''}`} role="img" aria-label={label || `${days.length} days`}>
      {days.map((s, i) => {
        const st = STRIP_STATES.has(s) ? s : 'future'
        const cls = st === 'today-exposure' ? 'today exposure' : st === 'today-on' ? 'today on' : st === 'today-slipped' ? 'today slipped' : st
        return <i key={i} className={cls} title={`Day ${startDay + i}: ${STRIP_WORDS[st]}`} />
      })}
    </div>
  )
}

/* Helper: build a 14-day reintro strip from cycle logs.                */
/* logs: [{log_date, ate_food, on_plan?, away?}], cycleStart: 'YYYY-MM-DD', today: 'YYYY-MM-DD' */
export function reintroStripDays({ logs = [], cycleStart, today, exposureDays = 3, totalDays = 14 }) {
  const byDate = new Map(logs.filter(l => l && l.log_date).map(l => [String(l.log_date).slice(0, 10), l]))
  const out = []
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(cycleStart + 'T12:00:00'); d.setDate(d.getDate() + i)
    const iso = d.toISOString().slice(0, 10)
    const isExposure = i < exposureDays
    const log = byDate.get(iso)
    if (iso === today) { out.push(isExposure ? 'today-exposure' : 'today'); continue }
    if (iso > today) { out.push(isExposure ? 'exposure-planned' : 'future'); continue }
    if (!log) { out.push('none'); continue }
    if (log.away) { out.push('away'); continue }
    if (isExposure) { out.push('exposure'); continue }
    out.push(log.on_plan === false ? 'slipped' : 'on')
  }
  return out
}

/* ------------------------------------------------------------------ */
/* 2. Symptom curve                                                    */
/* points: [{day:number, value:number}] (0-5 or 0-10 scale; pass max)  */
/* baseline: number | null. Under 7 points draws dots, never a line.    */
/* Never draws past the last point. Change is position only.           */
export function SymptomCurve({ points = [], baseline = null, max = 5, width = 260, height = 90, minLine = 7, todayLabel, caption = true, baselineLabel = true, emptyText = "Your curve starts after tonight's check-in." }) {
  // minLine: nightly series need 7 points before a line is honest; weekly
  // series (one point per check-in) may pass 3.
  const W = width, H = height
  const y = v => H - 8 - (v / (max * 1.2)) * (H - 16)
  const ink = 'var(--ob-ink)', moss = 'var(--ob-moss)', mute = 'var(--ob-mute)'
  const pts = points.filter(p => p && Number.isFinite(p.value))
  const base = baseline != null ? (
    <g>
      <line x1="0" x2={W} y1={y(baseline)} y2={y(baseline)} stroke={mute} strokeOpacity=".5" strokeDasharray="2 5" />
      {baselineLabel ? <text x="0" y={y(baseline) - 5} fontSize="10" fill={mute}>baseline</text> : null}
    </g>
  ) : null

  if (pts.length === 0) {
    return (
      <svg className="ob-curve" viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
        <line x1="0" x2={W} y1={H - 8} y2={H - 8} stroke={mute} strokeOpacity=".3" />
        <text x="0" y={H - 20} fontSize="11" fill={mute}>{emptyText}</text>
      </svg>
    )
  }
  if (pts.length < minLine) {
    const unit = minLine === 7 ? 'night' : 'week'
    return (
      <svg className="ob-curve" viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
        {base}
        {pts.map((p, i) => <circle key={i} cx={8 + i * ((W - 16) / Math.max(1, minLine - 1))} cy={y(p.value)} r="4" fill={moss} />)}
        {caption ? <text x="0" y={H - 2} fontSize="10" fill={mute}>{pts.length} {unit}{pts.length === 1 ? '' : 's'}. A line appears at {minLine}.</text> : null}
      </svg>
    )
  }
  const x = i => i / (pts.length - 1) * W
  let d = ''
  pts.forEach((p, i) => {
    const X = x(i), Y = y(p.value)
    if (i === 0) d += `M${X},${Y}`
    else { const px = x(i - 1), py = y(pts[i - 1].value), cx = (px + X) / 2; d += ` C${cx},${py} ${cx},${Y} ${X},${Y}` }
  })
  const last = pts[pts.length - 1]
  return (
    <svg className="ob-curve" viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      {base}
      <path d={`${d} L${W},${H} L0,${H} Z`} fill={moss} fillOpacity=".10" />
      <path d={d} fill="none" stroke={moss} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={W} cy={y(last.value)} r="4.5" fill={ink} />
      {todayLabel ? <text x={W} y={y(last.value) - 10} textAnchor="end" fontSize="11" fontWeight="500" fill={ink}>{todayLabel}</text> : null}
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* 3. Verdict card                                                     */
/* state: 'untested' | 'next' | 'trial' | 'ruled'                        */
/* verdict (ruled only): 'Safe' | 'Limit' | 'Avoid'                     */
/* evidence: one sentence. conflicted / stoppedEarly: booleans (tags).  */
const VERDICT_CLASS = { Safe: 'safe', Limit: 'limit', Avoid: 'avoid' }
export function VerdictCard({ food, meta, state = 'untested', verdict, evidence, conflicted = false, stoppedEarly = false, className = '', style }) {
  let word, cls = 'quiet', ev = evidence
  if (state === 'untested') { word = 'Not yet.'; ev = ev || 'Still off your plate. No data.' }
  else if (state === 'next') { word = 'Next.' }
  else if (state === 'trial') { word = 'On trial.'; cls = '' }
  else if (state === 'ruled' && VERDICT_CLASS[verdict]) { word = `${verdict}.`; cls = VERDICT_CLASS[verdict] }
  else { word = 'Not yet.'; ev = ev || 'Nothing to rule from.' }
  return (
    <div className={`ob-paper ob-vc ${className}`} style={style}>
      <div><div className="ob-food">{food}</div>{meta ? <div className="ob-meta">{meta}</div> : null}</div>
      <div>
        <div className={`ob-v ${cls}`}>{word}</div>
        {ev ? <div className="ob-ev">{/[.!?]$/.test(ev.trim()) ? ev : ev.trim() + '.'}</div> : null}
        {state === 'ruled' && conflicted ? <span className="ob-tag">Conflicting evidence. Retest offered</span> : null}
        {state === 'ruled' && stoppedEarly ? <span className="ob-tag">Stopped early</span> : null}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 4. Suspect card                                                     */
/* state: 'suspect' | 'next' | 'exposure' | 'washout' | 'verdict'       */
/* meta: "Lab flagged, low. You eat it rarely." (lab level is a word)   */
/* line: the one sentence under the state (order, day count, instruction)*/
const SUSPECT_WORD = { suspect: 'Out.', next: 'Up next.', exposure: 'Eat it today.', washout: 'Watching.', verdict: 'Verdict day.' }
export function SuspectCard({ food, meta, state = 'suspect', line, className = '', style, onClick }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag className={`ob-paper ob-sc ${className}`} style={{ textAlign: 'left', border: 0, font: 'inherit', cursor: onClick ? 'pointer' : 'default', ...style }} onClick={onClick}>
      <div className="ob-food">{food}</div>
      {meta ? <div className="ob-meta">{meta}</div> : null}
      <div className="ob-state">{SUSPECT_WORD[state] || SUSPECT_WORD.suspect}</div>
      {line ? <div className="ob-line">{line}</div> : null}
    </Tag>
  )
}

/* ------------------------------------------------------------------ */
/* 5. Streak line                                                      */
/* state: 'none' | 'active' | 'broken' | 'away'; count: nights          */
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty']
const numWord = n => (n >= 0 && n <= 20 ? WORDS[n] : String(n))
const cap = s => s.charAt(0).toUpperCase() + s.slice(1)
export function StreakLine({ state = 'none', count = 0, loggedTonight = false, className = '' }) {
  let body
  if (state === 'active' && count > 0 && loggedTonight) {
    body = <><b>{cap(numWord(count))} night{count === 1 ? '' : 's'} in a row,</b> tonight included.</>
  } else if (state === 'active' && count > 0) {
    body = <><b>{cap(numWord(count))} night{count === 1 ? '' : 's'} in a row.</b> Tonight makes {numWord(count + 1)}.</>
  } else if (state === 'broken') {
    body = <>Streak reset last night. <b>Tonight starts a new one.</b></>
  } else if (state === 'away') {
    body = <><b>Away, on plan.</b> Your streak is paused, not broken.</>
  } else if (loggedTonight) {
    body = <><b>One night on the record.</b> Tomorrow makes two.</>
  } else {
    body = <>Your streak starts with tonight's check-in.</>
  }
  return <p className={`ob-streak ${className}`}>{body}</p>
}

/* ------------------------------------------------------------------ */
/* 6. Check-in button                                                  */
/* state: 'tonight' | 'logged' | 'washout' | 'catchup' | 'weekly'       */
const BTN = {
  tonight: { label: "Start tonight's check-in", time: '2 minutes' },
  logged: { label: 'Logged tonight. See you tomorrow.', time: null },
  washout: { label: "Log tonight's washout check", time: '1 minute' },
  catchup: { label: 'Catch up on your weekly check-in', time: '5 minutes' },
  weekly: { label: 'Weekly check-in is open', time: '5 minutes' },
}
export function CheckinButton({ state = 'tonight', onClick, block = false, className = '' }) {
  const b = BTN[state] || BTN.tonight
  const disabled = state === 'logged'
  return (
    <button type="button" className={`ob-btn ${state} ${block ? 'ob-block' : ''} ${className}`} onClick={disabled ? undefined : onClick} disabled={disabled} aria-disabled={disabled}>
      {b.label}{b.time ? <small>{b.time}</small> : null}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* 7. Day counter                                                      */
/* One clock per card. n: number; of: total (optional); label: words.  */
export function DayCounter({ n, of, label, className = '' }) {
  if (!Number.isFinite(n)) return null
  return (
    <span className={`ob-day ${className}`}>
      <b>{n}</b>
      <span>{of ? `of ${of}, ` : ''}{label}</span>
    </span>
  )
}
