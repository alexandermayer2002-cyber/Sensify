import React, { useMemo } from 'react'
import { Strip, SymptomCurve, SuspectCard, StreakLine, CheckinButton, DayCounter } from '../components/objects'
import { getTestingOrder } from '../utils/protocolEngine'
import { todayLocal, localDateString } from '../utils/dateUtils'
import { HouseholdShareCard } from './HouseholdCard'

// HOME, DURING ELIMINATION (days 1-56).
// Assembled from the seven shared objects only. Answers one question per
// stretch (qa/SCREENS.md, Home / Elimination early, mid, late):
//   days 1-7   "Am I doing it right?"            -> one job: log tonight
//   days 8-35  "Is it working?"                   -> weekly scores vs baseline
//   days 36-56 "When does testing start, in what order?" -> day 57 and the order
// Never: projected trial dates, verdict colors, "improving", a curve before
// there is data to draw, two clocks in one card.

const SCALES = [
  { id: 'bloating', label: 'Bloating', baselineKey: 'baseline_bloating', lowerIsBetter: true },
  { id: 'gas', label: 'Gas', baselineKey: 'baseline_gas', lowerIsBetter: true },
  { id: 'reflux', label: 'Reflux', baselineKey: 'baseline_reflux', lowerIsBetter: true },
  { id: 'digestive', label: 'Digestive comfort', baselineKey: 'baseline_digestive', lowerIsBetter: false },
  { id: 'energy', label: 'Energy', baselineKey: 'baseline_energy', lowerIsBetter: false },
  { id: 'clarity', label: 'Clarity', baselineKey: 'baseline_clarity', lowerIsBetter: false },
  { id: 'sleep', label: 'Sleep', baselineKey: 'baseline_sleep', lowerIsBetter: false },
]
const LEVEL_WORD = { High: 'high', Moderate: 'moderate', Low: 'low', Common: null }
const FREQ_WORD = { daily: 'You eat it daily.', weekly: 'You eat it most weeks.', rarely: 'You eat it rarely.', often: 'You eat it often.', sometimes: 'You eat it sometimes.' }
const ORDINAL = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth']
const ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty']
const words = n => (n > 0 && n <= 20 ? ONES[n] : String(n))

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

  // ---- 14-day strip: the last 14 protocol days ending today ----
  const stripDays = useMemo(() => {
    const logged = new Set(weekFactors.map(f => f.log_date))
    const comp = new Map(complianceData.map(c => [c.date, c]))
    const out = []
    const first = Math.max(1, day - 13)
    for (let d = first; d <= day; d++) {
      const iso = startIso ? addDays(startIso, d - 1) : null
      if (!iso) { out.push('future'); continue }
      if (iso === today) { out.push('today'); continue }
      const c = comp.get(iso)
      if (c?.response === 'NO') { out.push('slipped'); continue }
      if (c?.response === 'YES' || logged.has(iso)) { out.push('on'); continue }
      if (awayDates.has(iso)) { out.push('away'); continue }
      out.push('none')
    }
    while (out.length < 14) out.push('future')
    return out
  }, [weekFactors, complianceData, awayDates, startIso, day, today])

  // ---- Weekly scores vs baseline (the only symptom data in elimination) ----
  const series = useMemo(() => {
    const sorted = [...checkins].filter(c => c?.answers).sort((a, b) => (a.week_number || 0) - (b.week_number || 0))
    return SCALES
      .filter(s => profile?.[s.baselineKey])
      .map(s => {
        const baseline = Number(profile[s.baselineKey])
        const pts = sorted.filter(c => c.answers[s.id] != null).map(c => ({ day: c.week_number, value: Number(c.answers[s.id]) }))
        const latest = pts.length ? pts[pts.length - 1].value : null
        return { ...s, baseline, pts, latest }
      })
  }, [checkins, profile])
  const weeksLogged = series.reduce((m, s) => Math.max(m, s.pts.length), 0)

  // ---- Suspects, in testing order, no projected dates ----
  const suspects = useMemo(() => {
    const freq = profile?.food_frequency || {}
    const foods = (labResult?.foods || []).filter(f => freq[f.name] !== 'never')
    return getTestingOrder(foods, freq).map((f, i) => {
      const lvl = LEVEL_WORD[f.level] || null
      const meta = [lvl ? `Lab flagged, ${lvl}.` : 'Common trigger.', FREQ_WORD[freq[f.name]] || ''].filter(Boolean).join(' ')
      return { name: f.name, meta, order: i }
    })
  }, [labResult, profile])

  // ---- Headline: one per stretch ----
  const headline = stretch === 'early'
    ? (day === 1 ? 'Day one. Everything is off the plate.' : `Day ${words(day)}. One job: log tonight.`)
    : stretch === 'mid'
      ? 'Your record is building.'
      : (daysLeft === 0 ? 'Testing opens tomorrow.' : `Testing begins on day 57.`)
  const lede = stretch === 'early'
    ? 'This week is about getting the suspects out and the habit in. Nothing is measured yet; the record starts tonight.'
    : stretch === 'mid'
      ? (weeksLogged >= 1
        ? `${words(weeksLogged).charAt(0).toUpperCase() + words(weeksLogged).slice(1)} weekly check-in${weeksLogged === 1 ? '' : 's'} on the record against your starting point. The trials begin on day 57; nothing is ruled before then.`
        : 'Your first weekly check-in opens at the end of week one. Until then, the nightly log is the whole job.')
      : `${words(daysLeft).charAt(0).toUpperCase() + words(daysLeft).slice(1)} clean night${daysLeft === 1 ? '' : 's'} to go. Your suspects will be tried one at a time, in the order below, and your body rules on each.`

  const btnState = weeklyDue ? 'weekly' : dailyDone ? 'logged' : 'tonight'
  const streakState = streak > 0 ? 'active' : 'none'

  return (
    <div className="he-page">
      <style>{CSS}</style>

      <section className="he-hero">
        <div>
          <p className="he-hello">{greeting}{firstName ? `, ${firstName}` : ''}. <DayCounter n={day} of={56} label="elimination" className="he-day" /></p>
          <h1 className="he-h1">{headline}</h1>
          <p className="he-lede">{lede}</p>
          <div className="he-actions">
            <CheckinButton state={btnState} onClick={btnState === 'weekly' ? onOpenWeekly : onOpenDaily} />
            {btnState === 'weekly' && !dailyDone ? <button type="button" className="he-link" onClick={onOpenDaily}>Tonight's check-in first</button> : null}
          </div>
          <StreakLine state={streakState} count={streak} className="he-streak" />
        </div>

        <aside className="ob-paper he-ledger">
          <h3>Your weeks against your starting point</h3>
          {weeksLogged === 0 ? (
            <p className="he-ledger-empty">Your first weekly check-in opens at the end of week one. Each week adds a point here.</p>
          ) : (
            <>
              <p className="he-ledger-sub">Weekly check-in scores, 1 to 10. Baseline is what you told us on day zero.</p>
              {series.map(s => (
                <div className="he-lrow" key={s.id}>
                  <div className="he-lname">{s.label}</div>
                  <SymptomCurve points={s.pts} baseline={s.baseline} max={10} width={200} height={40} minLine={3} />
                  <div className="he-lvals">{s.baseline}<i>to</i>{s.latest ?? '–'}</div>
                </div>
              ))}
            </>
          )}
        </aside>
      </section>

      <section className="ob-paper he-strip">
        <div className="he-strip-head">
          <div>
            <h3>The last fourteen nights</h3>
            <p>{dailyDone ? 'Tonight is logged.' : 'Tonight is still open.'} One square per night; a slipped night still counts as logged.</p>
          </div>
          {onOpenHistory ? <button type="button" className="he-link" onClick={onOpenHistory}>See the whole record</button> : null}
        </div>
        <Strip days={stripDays} size="lg" label="Last fourteen nights" />
      </section>

      {milestoneMessage && stretch === 'early' ? (
        <section className="ob-paper he-note">
          <h3>This week</h3>
          <p>{milestoneMessage}</p>
        </section>
      ) : null}

      <section className="he-map">
        <h2>Off the plate, for now.</h2>
        <p className="he-sub">
          {suspects.length === 1
            ? 'One suspect your protocol removed on day one. It has no verdict yet, because it has not been tried.'
            : `${words(suspects.length).charAt(0).toUpperCase() + words(suspects.length).slice(1)} suspects your protocol removed on day one. None has a verdict, because none has been tried.`}
          {' '}Your body rules on each, in turn, from day 57.
        </p>
        <div className="he-cards">
          {suspects.map((s, i) => (
            <SuspectCard
              key={s.name}
              food={s.name}
              meta={s.meta}
              state="suspect"
              line={i === 0 ? 'First on trial, from day 57.' : `${ORDINAL[i] || `${i + 1}th`} in line.`}
              onClick={onOpenReintro}
            />
          ))}
        </div>
      </section>

      <section className="he-panels">
        <div className="ob-paper he-panel">
          <h3>Rough night? Tell us what you ate.</h3>
          <p>If tonight is worse than usual, write down today's meals in your own words inside the check-in. We keep it on file against the night. It is a lead for later, never a ruling.</p>
          <CheckinButton state={dailyDone ? 'logged' : 'tonight'} onClick={onOpenDaily} className="he-panel-btn" />
        </div>
        <div className="he-panel he-panel-forest">
          <HouseholdShareCard session={session} profile={profile} />
        </div>
      </section>
    </div>
  )
}

const CSS = `
.he-page { --he-stone:#E8E3D8; max-width: 1180px; margin: 0 auto; padding: 24px 20px 72px; color: var(--ob-ink); }
.he-hero { display: grid; grid-template-columns: 1.15fr .85fr; gap: 40px; align-items: start; padding: 12px 0 0; }
.he-hello { font-size: 15px; color: var(--ob-ink-2); margin: 0 0 16px; display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
.he-day b { font-size: 22px; }
.he-h1 { font-family: var(--font-display, 'Fraunces', serif); font-weight: 300; font-size: clamp(38px, 5.6vw, 72px); line-height: .98; letter-spacing: -.022em; margin: 0 0 18px; color: var(--ob-ink); }
.he-lede { font-size: 17px; line-height: 1.5; color: var(--ob-ink-2); max-width: 540px; margin: 0 0 26px; }
.he-actions { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
.he-link { background: none; border: 0; padding: 0; font: inherit; font-size: 14px; font-weight: 500; color: var(--ob-moss); text-decoration: underline; text-decoration-color: rgba(60,106,75,.35); text-underline-offset: 5px; cursor: pointer; }
.he-streak { margin-top: 16px; font-size: 14px; }
.he-ledger h3, .he-strip h3, .he-note h3, .he-panel h3 { font-family: var(--font-display, 'Fraunces', serif); font-weight: 400; font-size: 22px; letter-spacing: -.015em; margin: 0 0 4px; }
.he-ledger { padding: 22px 24px 14px; }
.he-ledger-sub, .he-ledger-empty { font-size: 13px; color: var(--ob-mute); margin: 0 0 12px; line-height: 1.5; }
.he-ledger-empty { margin: 8px 0 6px; }
.he-lrow { display: grid; grid-template-columns: 110px 1fr 72px; gap: 14px; align-items: center; padding: 12px 0; border-top: 1px solid rgba(21,30,24,.08); }
.he-lname { font-size: 14px; font-weight: 500; }
.he-lvals { font-family: var(--font-display, 'Fraunces', serif); font-size: 24px; letter-spacing: -.02em; text-align: right; line-height: 1; }
.he-lvals i { font-style: normal; font-family: var(--font-body, 'Plus Jakarta Sans', sans-serif); font-size: 12px; color: var(--ob-mute); margin: 0 4px; position: relative; top: -2px; }
.he-strip { margin-top: 28px; padding: 22px 24px 24px; }
.he-strip-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 16px; }
.he-strip-head p { font-size: 13.5px; color: var(--ob-mute); margin: 0; line-height: 1.5; }
.he-strip .ob-strip { flex-wrap: wrap; }
.he-note { margin-top: 20px; padding: 22px 24px; }
.he-note p { font-size: 15px; line-height: 1.6; color: var(--ob-ink-2); margin: 0; }
.he-map { margin-top: 44px; }
.he-map h2 { font-family: var(--font-display, 'Fraunces', serif); font-weight: 300; font-size: 34px; letter-spacing: -.02em; margin: 0 0 8px; }
.he-sub { font-size: 15px; color: var(--ob-ink-2); max-width: 620px; line-height: 1.5; margin: 0 0 20px; }
.he-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 16px; }
.he-cards .ob-sc { min-height: 200px; }
.he-panels { display: grid; grid-template-columns: 1.1fr .9fr; gap: 16px; margin-top: 40px; }
.he-panel { padding: 26px 28px; display: flex; flex-direction: column; justify-content: space-between; gap: 18px; border-radius: 18px; }
.he-panel p { font-size: 15px; line-height: 1.55; color: var(--ob-ink-2); margin: 0; }
.he-panel-btn { align-self: flex-start; }
.he-panel-forest { padding: 0; background: transparent; }
@media (max-width: 860px) {
  .he-hero, .he-panels { grid-template-columns: 1fr; }
  .he-page { padding: 12px 14px 64px; }
  .he-lrow { grid-template-columns: 90px 1fr 64px; }
}
`
