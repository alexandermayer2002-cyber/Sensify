import React, { useMemo } from 'react'
import { Strip, SymptomCurve, SuspectCard, StreakLine, CheckinButton, DayCounter } from '../components/objects'
import { getTestingOrder, getProtocolFoods } from '../utils/protocolEngine'
import { todayLocal, localDateString } from '../utils/dateUtils'
import { HouseholdShareCard } from './HouseholdCard'
import BaselineSharpness from '../components/BaselineSharpness'

// HOME, DURING ELIMINATION (days 1-56).
// Assembled from the seven shared objects only. One question per stretch
// (qa/SCREENS.md, Home / Elimination early, mid, late), and the layout
// changes with the question, not just the headline:
//   days 1-7   "Am I doing it right?"        hero = the strip filling in
//   days 8-35  "Is it working?"              hero = weekly scores vs baseline
//   days 36-56 "When does testing start?"    hero = the ordered suspects
// Never: projected trial dates, verdict colors, "improving", a curve before
// there is data to draw, two clocks in one card, the same button twice.
// Design Director review 2026-11-13 (qa/design/2026-11-13-home-elimination.md)
// drove the second pass.

const SCALES = [
  { id: 'bloating', label: 'Bloating', baselineKey: 'baseline_bloating', lowerIsBetter: true },
  { id: 'gas', label: 'Gas', baselineKey: 'baseline_gas', lowerIsBetter: true },
  { id: 'reflux', label: 'Reflux', baselineKey: 'baseline_reflux', lowerIsBetter: true },
  { id: 'digestive', label: 'Digestive comfort', baselineKey: 'baseline_digestive', lowerIsBetter: false },
  { id: 'energy', label: 'Energy', baselineKey: 'baseline_energy', lowerIsBetter: false },
  { id: 'clarity', label: 'Clarity', baselineKey: 'baseline_clarity', lowerIsBetter: false },
  { id: 'sleep', label: 'Sleep', baselineKey: 'baseline_sleep', lowerIsBetter: false },
]
const LEVEL_WORD = { High: 'high', Moderate: 'moderate', Low: 'low' }
const FREQ_WORD = { daily: 'You eat it daily.', weekly: 'You eat it most weeks.', rarely: 'You eat it rarely.', often: 'You eat it often.', sometimes: 'You eat it sometimes.' }
const ORDINAL = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth', 'Eleventh', 'Twelfth']
const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty']
const TENS = { 20: 'twenty', 30: 'thirty', 40: 'forty', 50: 'fifty' }
const words = n => {
  if (n >= 0 && n <= 20) return ONES[n]
  if (n < 60) { const t = Math.floor(n / 10) * 10, o = n - t; return o ? `${TENS[t]}-${ONES[o]}` : TENS[t] }
  return String(n)
}
const Cap = s => s.charAt(0).toUpperCase() + s.slice(1)
function addDays(iso, n) { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return localDateString(d) }

export default function HomeElimination({
  profile, labResult, currentDay, streak, dailyDone, weeklyDue, checkinLate,
  checkins = [], complianceData = [], weekFactors = [], awayDates = new Set(),
  milestoneMessage, session,
  onOpenDaily, onOpenWeekly, onOpenHistory, onOpenReintro,
}) {
  const firstName = (profile?.full_name || profile?.first_name || '').split(' ')[0] || null
  const hour = new Date().getHours()
  const greeting = hour < 5 ? 'Good night' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const day = Math.max(1, Math.min(56, currentDay || 1))
  const daysLeft = Math.max(0, 57 - day)
  const stretch = day <= 7 ? 'early' : day <= 35 ? 'mid' : 'late'
  const today = todayLocal()
  const startIso = String(profile?.protocol_start_date || '').split('T')[0]
  const logged = useMemo(() => new Set(weekFactors.map(f => f.log_date)), [weekFactors])

  // ---- 14-night strip: the last 14 protocol days ending today ----
  const firstStripDay = Math.max(1, day - 13)
  const stripDays = useMemo(() => {
    const comp = new Map(complianceData.map(c => [c.date, c]))
    const out = []
    for (let d = firstStripDay; d <= day; d++) {
      const iso = startIso ? addDays(startIso, d - 1) : null
      if (!iso) { out.push('future'); continue }
      const c = comp.get(iso)
      const isLogged = c?.response === 'YES' || c?.response === 'NO' || logged.has(iso)
      if (iso === today) { out.push(isLogged ? (c?.response === 'NO' ? 'today-slipped' : 'today-on') : 'today'); continue }
      if (c?.response === 'NO') { out.push('slipped'); continue }
      if (isLogged) { out.push('on'); continue }
      if (awayDates.has(iso)) { out.push('away'); continue }
      out.push('none')
    }
    while (out.length < 14) out.push('future')
    return out
  }, [complianceData, logged, awayDates, startIso, day, today, firstStripDay])

  // ---- Streak state: none / active / broken / away ----
  const streakState = useMemo(() => {
    if (streak > 0) return 'active'
    const y = localDateString(new Date(Date.now() - 86400000))
    if (awayDates.has(y)) return 'away'
    // Lapsed: there is a log somewhere in the last 14 protocol days, but not a run ending yesterday.
    const recent = stripDays.some(s => s === 'on' || s === 'slipped')
    return recent ? 'broken' : 'none'
  }, [streak, awayDates, stripDays])

  // ---- Weekly scores vs baseline (the only symptom data in elimination) ----
  const sortedCheckins = useMemo(() => [...checkins].filter(c => c?.answers).sort((a, b) => (a.week_number || 0) - (b.week_number || 0)), [checkins])
  const weeksLogged = sortedCheckins.length
  const series = useMemo(() => SCALES
    .filter(s => profile?.[s.baselineKey])
    .map(s => {
      const baseline = Number(profile[s.baselineKey])
      const pts = sortedCheckins.filter(c => c.answers[s.id] != null).map(c => ({ day: c.week_number, value: Number(c.answers[s.id]) }))
      return { ...s, baseline, pts, latest: pts.length ? pts[pts.length - 1].value : null }
    }), [sortedCheckins, profile])

  // ---- Suspects, in testing order, from the resolved protocol list ----
  const suspects = useMemo(() => {
    const freq = profile?.food_frequency || {}
    const resolved = getProtocolFoods(profile, labResult)
    const foods = (resolved?.foods || []).filter(f => freq[f.name] !== 'never')
    return getTestingOrder(foods, freq).map((f, i) => {
      const lvl = LEVEL_WORD[f.level] || null
      const meta = [lvl ? `Lab flagged, ${lvl}.` : 'Common trigger.', FREQ_WORD[freq[f.name]] || ''].filter(Boolean).join(' ')
      return { name: f.name, meta, order: i }
    })
  }, [labResult, profile])
  const suspectNames = suspects.map(s => s.name)

  // ---- Headline and lede: one per stretch, honest about tonight ----
  let headline, lede
  if (stretch === 'early') {
    headline = day === 1
      ? (dailyDone ? 'Day one, logged.' : 'Day one. Your suspects are off the plate.')
      : (dailyDone ? `Day ${words(day)}, logged.` : `One job tonight: the check-in.`)
    lede = dailyDone
      ? 'That counts. The record is built one night at a time, and tonight is on it. Tomorrow is the same job.'
      : 'This week is about keeping the suspects out and getting the habit in. Nothing is measured yet; the record is built one night at a time.'
  } else if (stretch === 'mid') {
    headline = 'Your record is building.'
    lede = weeksLogged >= 1
      ? `${Cap(words(weeksLogged))} weekly check-in${weeksLogged === 1 ? '' : 's'} on the record against your starting point. The trials begin on day 57; nothing is ruled before then.`
      : weeklyDue
        ? 'Your weekly check-in is open. It is the only place your symptoms get scored against day zero, so it is worth the five minutes.'
        : 'The nightly log is the whole job this week. Your weekly check-in scores the week against day zero when it opens.'
  } else {
    headline = 'Testing begins on day 57. Your order is set.'
    lede = `${Cap(words(daysLeft))} clean night${daysLeft === 1 ? '' : 's'} to go. Your suspects will be tried one at a time, in the order below, and your body rules on each.`
  }

  const btnState = weeklyDue ? (checkinLate ? 'catchup' : 'weekly') : dailyDone ? 'logged' : 'tonight'
  const btnClick = weeklyDue ? onOpenWeekly : onOpenDaily

  // ---- Blocks ----
  const Hero = (
    <div className="he-herotext">
      <p className="he-hello">{greeting}{firstName ? `, ${firstName}` : ''}. <DayCounter n={day} of={56} label="elimination" className="he-day" /></p>
      <h1 className="he-h1">{headline}</h1>
      <p className="he-lede">{lede}</p>
      <div className="he-actions">
        <CheckinButton state={btnState} onClick={btnClick} />
        {weeklyDue && !dailyDone ? <button type="button" className="he-link" onClick={onOpenDaily}>Tonight's check-in first</button> : null}
      </div>
      <StreakLine state={streakState} count={streak} className="he-streak" />
    </div>
  )

  const StripCard = (
    <section className="ob-paper he-strip">
      <div className="he-strip-head">
        <div>
          <h3>{stretch === 'early' ? 'Your nights so far' : 'The last fourteen nights'}</h3>
          <p>{dailyDone ? 'Tonight is logged.' : 'Tonight is still open.'} One square per night. A slipped night still counts as logged.</p>
        </div>
        {onOpenHistory ? <button type="button" className="he-link" onClick={onOpenHistory}>See the whole record</button> : null}
      </div>
      <Strip days={stripDays} size={stretch === "early" ? "md" : "lg"} startDay={firstStripDay} label={`Nights ${firstStripDay} to ${day}`} />
    </section>
  )

  const Ledger = (
    <aside className="ob-paper he-ledger">
      <h3>Your weeks against your starting point</h3>
      {weeksLogged === 0 ? (
        <p className="he-ledger-empty">{day <= 7 ? 'Your first weekly check-in opens at the end of week one. Each week adds a point here.' : weeklyDue ? 'No weekly check-in on the record yet. One is open now; each one adds a point here.' : 'No weekly check-in on the record yet. Each one adds a point here.'}</p>
      ) : series.length === 0 ? (
        <p className="he-ledger-empty">{Cap(words(weeksLogged))} weekly check-in{weeksLogged === 1 ? '' : 's'} on the record. Your day-zero baseline was not scored, so there is nothing to compare against yet.</p>
      ) : (
        <>
          <p className="he-ledger-sub">Weekly check-in scores, 1 to 10, against what you told us on day zero. {weeksLogged < 3 ? `${Cap(words(weeksLogged))} week${weeksLogged === 1 ? '' : 's'} so far; a line appears at three.` : ''}</p>
          {series.map(s => (
            <div className="he-lrow" key={s.id}>
              <div className="he-lname">{s.label}<span>{s.lowerIsBetter ? 'lower is better' : 'higher is better'}</span></div>
              <SymptomCurve points={s.pts} baseline={s.baseline} max={10} width={200} height={40} minLine={3} caption={false} baselineLabel={false} />
              <div className="he-lvals">{s.baseline}<i>to</i>{s.latest ?? '–'}</div>
            </div>
          ))}
        </>
      )}
    </aside>
  )

  const SuspectCards = (
    <div className="he-cards">
      {suspects.map((s, i) => (
        <SuspectCard key={s.name} food={s.name} meta={s.meta} state="suspect"
          line={i === 0 ? 'First on trial, from day 57.' : `${ORDINAL[i] || `${i + 1}th`} in line.`} onClick={onOpenReintro} />
      ))}
    </div>
  )
  const suspectIntro = suspects.length === 0
    ? 'Your protocol has no suspects listed yet.'
    : suspects.length === 1
      ? 'One suspect your protocol removed on day one. It has no verdict yet, because it has not been tried.'
      : `${Cap(words(suspects.length))} suspects your protocol removed on day one. None has a verdict, because none has been tried.`

  const SuspectsFull = (
    <section className="he-map">
      <h2>{stretch === 'late' ? 'Your order, from day 57.' : 'Off the plate, for now.'}</h2>
      <p className="he-sub">{suspectIntro} Your body rules on each, in turn, from day 57.</p>
      {SuspectCards}
    </section>
  )
  const SuspectsCompact = (
    <section className="ob-paper he-compact">
      <div>
        <h3>Off the plate, for now</h3>
        <p>{suspectNames.length ? suspectNames.join(', ') : 'No suspects listed yet'}. {suspects.length === 1 ? 'It goes on trial from day 57.' : 'They go on trial one at a time, from day 57, in this order.'}</p>
      </div>
      <button type="button" className="he-link" onClick={onOpenReintro}>See the order</button>
    </section>
  )

  const Panels = (
    <section className="he-panels">
      <div className="ob-paper he-panel">
        <h3>Rough night? Tell us what you ate.</h3>
        <p>If tonight is worse than usual, write down today's meals in your own words inside the check-in. We keep it on file against the night. It is a lead for later, never a ruling.</p>
        {!dailyDone ? <button type="button" className="he-link" onClick={onOpenDaily}>It goes in tonight's check-in</button> : <p className="he-quiet">Tonight's check-in is in. Tomorrow's has the same box.</p>}
      </div>
      <HouseholdShareCard session={session} profile={profile} variant="panel" phase="elimination" foods={suspectNames} />
    </section>
  )

  return (
    <div className="he-page">
      <style>{CSS}</style>
      {stretch === 'early' && (
        <>
          <section className="he-hero">{Hero}{StripCard}</section>
          {milestoneMessage ? <section className="ob-paper he-note"><h3>This week</h3><p>{milestoneMessage}</p></section> : null}
          {SuspectsCompact}
          {Panels}
        </>
      )}
      {stretch === 'mid' && (
        <>
          <section className="he-hero">{Hero}{Ledger}</section>
          <div className="he-sharp"><BaselineSharpness session={session} profile={profile} /></div>
          {StripCard}
          {SuspectsCompact}
          {Panels}
        </>
      )}
      {stretch === 'late' && (
        <>
          <section className="he-hero he-hero-solo">{Hero}</section>
          {SuspectsFull}
          <section className="he-two">{StripCard}{Ledger}</section>
          {Panels}
        </>
      )}
    </div>
  )
}

const CSS = `
.he-page { max-width: 1180px; margin: 0 auto; padding: 24px 20px 72px; color: var(--ob-ink); }
.he-hero { display: grid; grid-template-columns: 1.15fr .85fr; gap: 40px; align-items: start; padding: 12px 0 0; }
.he-hero-solo { grid-template-columns: 1fr; }
.he-hero-solo .he-h1 { max-width: 900px; }
.he-hello { font-size: 15px; color: var(--ob-ink-2); margin: 0 0 16px; display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
.he-day b { font-size: 22px; }
.he-h1 { font-family: var(--font-display, 'Fraunces', serif); font-weight: 300; font-size: clamp(38px, 5.4vw, 70px); line-height: .98; letter-spacing: -.022em; margin: 0 0 18px; color: var(--ob-ink); }
.he-lede { font-size: 17px; line-height: 1.5; color: var(--ob-ink-2); max-width: 540px; margin: 0 0 26px; }
.he-actions { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
.he-link { background: none; border: 0; padding: 0; font: inherit; font-size: 14px; font-weight: 500; color: var(--ob-moss); text-decoration: underline; text-decoration-color: rgba(60,106,75,.35); text-underline-offset: 5px; cursor: pointer; white-space: nowrap; }
.he-streak { margin-top: 16px; font-size: 14px; }
.he-ledger h3, .he-strip h3, .he-note h3, .he-panel h3, .he-compact h3 { font-family: var(--font-display, 'Fraunces', serif); font-weight: 400; font-size: 22px; letter-spacing: -.015em; margin: 0 0 4px; line-height: 1.1; }
.he-ledger { padding: 22px 24px 14px; }
.he-ledger-sub, .he-ledger-empty { font-size: 13px; color: var(--ob-mute); margin: 0 0 12px; line-height: 1.5; }
.he-ledger-empty { margin: 8px 0 6px; }
.he-lrow { display: grid; grid-template-columns: 118px 1fr 72px; gap: 14px; align-items: center; padding: 12px 0; border-top: 1px solid rgba(21,30,24,.08); }
.he-lname { font-size: 14px; font-weight: 500; line-height: 1.2; }
.he-lname span { display: block; font-size: 11px; font-weight: 400; color: var(--ob-mute); margin-top: 2px; }
.he-lvals { font-family: var(--font-display, 'Fraunces', serif); font-size: 24px; letter-spacing: -.02em; text-align: right; line-height: 1; }
.he-lvals i { font-style: normal; font-family: var(--font-body, 'Plus Jakarta Sans', sans-serif); font-size: 12px; color: var(--ob-mute); margin: 0 4px; position: relative; top: -2px; }
.he-strip { padding: 22px 24px 24px; }
.he-hero .he-strip { margin-top: 8px; }
.he-page > .he-strip, .he-sharp, .he-compact, .he-note { margin-top: 24px; }
.he-strip-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 16px; }
.he-strip-head p { font-size: 13.5px; color: var(--ob-mute); margin: 0; line-height: 1.5; }
.he-strip .ob-strip { flex-wrap: wrap; }
.he-note { padding: 22px 24px; }
.he-note p { font-size: 15px; line-height: 1.6; color: var(--ob-ink-2); margin: 0; }
.he-compact { display: flex; justify-content: space-between; align-items: center; gap: 20px; padding: 20px 24px; }
.he-compact p { font-size: 14.5px; color: var(--ob-ink-2); margin: 4px 0 0; line-height: 1.5; }
.he-map { margin-top: 36px; }
.he-map h2 { font-family: var(--font-display, 'Fraunces', serif); font-weight: 300; font-size: 34px; letter-spacing: -.02em; margin: 0 0 8px; }
.he-sub { font-size: 15px; color: var(--ob-ink-2); max-width: 620px; line-height: 1.5; margin: 0 0 20px; }
.he-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 16px; }
.he-cards .ob-sc { min-height: 200px; }
.he-cards .ob-meta { min-height: 2.6em; }
.he-two { display: grid; grid-template-columns: 1.1fr .9fr; gap: 16px; margin-top: 36px; align-items: start; }
.he-panels { display: grid; grid-template-columns: 1.1fr .9fr; gap: 16px; margin-top: 36px; }
.he-panel { padding: 26px 28px; display: flex; flex-direction: column; justify-content: flex-start; gap: 14px; border-radius: 18px; }
.he-panel .he-link, .he-panel .he-quiet { align-self: flex-start; margin-top: 6px; }
.he-panel p { font-size: 15px; line-height: 1.55; color: var(--ob-ink-2); margin: 0; }
.he-quiet { font-size: 14px; color: var(--ob-mute); }
.he-sharp .sn-card { border-radius: 14px; }
@media (max-width: 860px) {
  .he-hero, .he-panels, .he-two { grid-template-columns: 1fr; }
  .he-page { padding: 12px 14px 64px; }
  .he-lrow { grid-template-columns: 96px 1fr 64px; }
  .he-compact { flex-direction: column; align-items: flex-start; }
}
`
