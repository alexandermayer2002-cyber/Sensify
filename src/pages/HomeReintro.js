import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabase'
import { Strip, VerdictCard, SuspectCard, StreakLine, CheckinButton, DayCounter } from '../components/objects'
import { getTestingOrder, getProtocolFoods } from '../utils/protocolEngine'
import { todayLocal, localDateString } from '../utils/dateUtils'
import { HouseholdShareCard } from './HouseholdCard'
import { OutcomeQuestion } from './ReintroTab'
import { evidenceLine } from '../utils/evidence'

// HOME, DURING REINTRODUCTION (day 57 onward) AND AT PROGRAM COMPLETE.
// Assembled from the seven shared objects. One question per state
// (qa/SCREENS.md, Home / Reintro exposure, Washout, Verdict day, Between
// cycles, Program complete). Clock math mirrors ReintroTab.js exactly:
// washout_started_at is the date of the THIRD exposure, so washout day n is
// (days since washout_started_at), and the strip's washout squares begin the
// day after it. Design Director review 2026-11-13 (qa/design/
// 2026-11-13-home-reintro.md) drove the second pass.

const EXPOSURE_TARGET = 3
const WASHOUT_LENGTH = 11
const EXPOSURE_CALENDAR_CAP = 5
const LEVEL_WORD = { High: 'high', Moderate: 'moderate', Low: 'low' }
const FREQ_WORD = { daily: 'You eat it daily.', weekly: 'You eat it most weeks.', rarely: 'You eat it rarely.', often: 'You eat it often.', sometimes: 'You eat it sometimes.' }
const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen']
const words = n => (n >= 0 && n < ONES.length ? ONES[n] : String(n))
const Cap = s => s.charAt(0).toUpperCase() + s.slice(1)
const parseLocal = v => { const [y, m, d] = String(v).split('T')[0].split('-').map(Number); return new Date(y, m - 1, d) }
const daysBetween = (a, b) => Math.floor((b - a) / 86400000)
const lower = s => (s || '').toLowerCase()
const isoOf = d => localDateString(d)

export default function HomeReintro({
  profile, labResult, currentDay, streak, dailyDone, weeklyDue, checkinLate,
  activeCycle, awayDates = new Set(), session,
  onOpenDaily, onOpenWeekly, onOpenReintro, onOpenVerdicts, onStartVerdictSurvey,
}) {
  const firstName = (profile?.full_name || profile?.first_name || '').split(' ')[0] || null
  const hour = new Date().getHours()
  const greeting = hour < 5 ? 'Good night' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const today = todayLocal()
  const todayD = parseLocal(today)
  const reintroDay = Math.max(1, (currentDay || 57) - 56)

  // ---- Cycles and logs: this screen's own reads ----
  const [cycles, setCycles] = useState(null)   // null = loading, [] = none
  const [readError, setReadError] = useState(false)
  const [logsByCycle, setLogsByCycle] = useState({})
  useEffect(() => {
    if (!session?.user?.id) return
    let alive = true
    ;(async () => {
      try {
        const { data, error } = await supabase.from('reintroduction_results')
          .select('id, food, verdict, verdict_reason, stopped_early, answers, started_at, washout_started_at, exposure_days_completed')
          .eq('user_id', session.user.id).order('started_at', { ascending: true })
        if (error) throw error
        const rows = data || []
        const ids = rows.map(c => c.id)
        let by = {}
        if (ids.length) {
          const { data: all, error: e2 } = await supabase.from('reintro_daily_logs').select('reintro_id, log_date, ate_food, had_symptoms, symptoms, phase').in('reintro_id', ids).order('log_date', { ascending: true })
          if (e2) throw e2
          for (const l of (all || [])) (by[l.reintro_id] = by[l.reintro_id] || []).push(l)
        }
        if (alive) { setLogsByCycle(by); setCycles(rows); setReadError(false) }
      } catch (e) {
        if (alive) { setReadError(true); setCycles([]) }
      }
    })()
    return () => { alive = false }
  }, [session?.user?.id, activeCycle?.id])

  const loading = cycles === null
  const logs = activeCycle?.id ? (logsByCycle[activeCycle.id] || []) : []

  // Latest RULED cycle per food (a retest in progress never hides a standing verdict).
  const ruledByFood = useMemo(() => {
    const m = {}
    for (const c of (cycles || [])) if (c.verdict) m[lower(c.food)] = c
    return m
  }, [cycles])

  // ---- Foods in testing order ----
  const foods = useMemo(() => {
    const freq = profile?.food_frequency || {}
    const resolved = getProtocolFoods(profile, labResult)
    const list = (resolved?.foods || []).filter(f => freq[f.name] !== 'never')
    return getTestingOrder(list, freq).map(f => {
      const lvl = LEVEL_WORD[f.level] || null
      const meta = [lvl ? `Lab flagged, ${lvl}.` : 'Common trigger.', FREQ_WORD[freq[f.name]] || ''].filter(Boolean).join(' ')
      return { name: f.name, meta, cycle: ruledByFood[lower(f.name)] || null }
    })
  }, [profile, labResult, ruledByFood])
  const ruled = foods.filter(f => f.cycle)
  const unruled = foods.filter(f => !f.cycle)
  const allRuled = foods.length > 0 && unruled.length === 0 && !activeCycle
  const counts = ruled.reduce((a, f) => { a[f.cycle.verdict] = (a[f.cycle.verdict] || 0) + 1; return a }, {})

  // ---- Cycle clock, same math as ReintroTab ----
  const clock = useMemo(() => {
    if (!activeCycle?.started_at) return null
    const start = parseLocal(activeCycle.started_at)
    const cycleDay = daysBetween(start, todayD) + 1
    const done = activeCycle.exposure_days_completed || 0
    const inExposure = done < EXPOSURE_TARGET
    const washoutStart = activeCycle.washout_started_at ? parseLocal(activeCycle.washout_started_at) : null
    const washoutDayRaw = washoutStart ? daysBetween(washoutStart, todayD) + 1 : 0   // 1 on the third exposure day
    const washoutDay = Math.max(0, washoutDayRaw - 1)                                // 1 on the first real washout day
    const stalled = inExposure && cycleDay > EXPOSURE_CALENDAR_CAP
    const verdictReady = !inExposure && washoutDayRaw > WASHOUT_LENGTH
    const notStarted = cycleDay < 1
    return { food: activeCycle.food, cycleDay, done, inExposure, washoutDay, stalled, verdictReady, notStarted, washoutStart }
  }, [activeCycle, todayD])

  const todayLog = logs.find(l => l.log_date === today) || null
  const loggedToday = !!todayLog
  const loggedNights = new Set(logs.map(l => l.log_date)).size

  const state = loading ? 'loading'
    : foods.length === 0 && !clock ? 'nofoods'
      : allRuled ? 'complete'
        : !clock ? 'between'
          : clock.notStarted ? 'pending'
            : clock.verdictReady ? 'verdict'
              : clock.stalled ? 'stalled'
                : clock.inExposure ? 'exposure' : 'washout'

  // ---- The cycle strip: exposure squares by served log, washout squares from the day after the third exposure ----
  const stripDays = useMemo(() => {
    if (!clock) return []
    const out = []
    const served = logs.filter(l => l.ate_food === true).slice(0, EXPOSURE_TARGET)
    const servedDates = new Set(served.map(l => l.log_date))
    for (let i = 0; i < EXPOSURE_TARGET; i++) {
      const l = served[i]
      if (l) out.push(l.log_date === today ? 'today-exposure' : 'exposure')
      else if (i === served.length && clock.inExposure && !clock.notStarted) out.push(loggedToday ? 'exposure-planned' : 'today-exposure')
      else out.push('exposure-planned')
    }
    if (clock.washoutStart) {
      const wlogs = new Set(logs.filter(l => !servedDates.has(l.log_date)).map(l => l.log_date))
      for (let i = 1; i <= WASHOUT_LENGTH; i++) {
        const d = new Date(clock.washoutStart); d.setDate(clock.washoutStart.getDate() + i)
        const iso = isoOf(d)
        if (iso === today) out.push(wlogs.has(iso) ? 'today-on' : 'today')
        else if (iso > today) out.push('future')
        else if (wlogs.has(iso)) out.push('on')
        else if (awayDates.has(iso)) out.push('away')
        else out.push('none')
      }
    } else {
      for (let i = 0; i < WASHOUT_LENGTH; i++) out.push('future')
    }
    return out.slice(0, EXPOSURE_TARGET + WASHOUT_LENGTH)
  }, [clock, logs, today, awayDates, loggedToday])

  // ---- Headline, lede, action per state ----
  const food = clock?.food || ''
  const foodL = lower(food)
  let headline = '', lede = '', action = null
  if (state === 'loading') {
    headline = 'One moment.'
    lede = 'Reading your record.'
  } else if (state === 'nofoods') {
    headline = 'There is nothing to test yet.'
    lede = 'Your protocol has no suspects listed, so there is no trial to run. If that is a surprise, your lab results or intake may not have been read; Ask Sensify or write to us.'
    action = <button type="button" className="ob-btn tonight" onClick={onOpenReintro}>Open reintroduction</button>
  } else if (state === 'complete') {
    headline = 'Every food is ruled. Your Food Map is complete.'
    const tally = [counts.Safe ? `${words(counts.Safe)} safe` : null, counts.Limit ? `${words(counts.Limit)} to limit` : null, counts.Avoid ? `${words(counts.Avoid)} to avoid` : null].filter(Boolean).join(', ')
    lede = `${Cap(words(foods.length))} suspect${foods.length === 1 ? '' : 's'}, ${words(foods.length)} trial${foods.length === 1 ? '' : 's'}, every verdict earned from your own record. ${Cap(tally)}.`
    action = <button type="button" className="ob-btn tonight" onClick={onOpenVerdicts}>See your Food Map</button>
  } else if (state === 'between') {
    headline = ruled.length === 0 ? 'Testing is open. Choose your first food.' : 'Choose your next food.'
    lede = ruled.length === 0
      ? 'Elimination is done. Each suspect now gets its own fourteen-day trial: three days of eating it, eleven of watching. Your body rules on each.'
      : `${Cap(words(ruled.length))} of ${words(foods.length)} ruled. ${Cap(words(unruled.length))} to go, one at a time. The next trial starts the day you pick it.`
    action = <button type="button" className="ob-btn tonight" onClick={onOpenReintro}>Pick your next food</button>
  } else if (state === 'pending') {
    const n = 1 - clock.cycleDay
    headline = n === 1 ? `${Cap(foodL)} starts tomorrow.` : `${Cap(foodL)} starts in ${words(n)} days.`
    lede = `Nothing to eat yet. Day one of the trial begins ${n === 1 ? 'tomorrow' : `in ${words(n)} days`}; until then your elimination holds exactly as it is. Tonight's check-in is the usual one.`
    action = <CheckinButton state={dailyDone ? 'logged' : 'tonight'} onClick={onOpenDaily} />
  } else if (state === 'verdict') {
    headline = `Your ${foodL} verdict is ready.`
    lede = `${Cap(words(loggedNights))} night${loggedNights === 1 ? '' : 's'} of this trial are on the record. One short survey, then the ruling. Nothing is decided until you answer.`
    action = <button type="button" className="ob-btn tonight" onClick={() => onStartVerdictSurvey?.(food)}>Get my verdict</button>
  } else if (state === 'stalled') {
    headline = `The ${foodL} trial needs a fresh start.`
    lede = `A trial needs its three servings close together to be fair, and ${words(clock.cycleDay)} days have passed with ${words(clock.done)} of three logged. Nothing you logged counts against you; the trial simply restarts from day one.`
    action = <button type="button" className="ob-btn tonight" onClick={onOpenReintro}>Restart it from the Reintro tab</button>
  } else if (state === 'exposure') {
    const next = Math.min(EXPOSURE_TARGET, clock.done + 1)
    if (loggedToday && todayLog.ate_food === true) {
      headline = `${Cap(foodL)}, exposure day ${words(clock.done)} is in.`
      lede = 'Nothing more to eat or do until tomorrow. If your body does anything tonight, it goes in tomorrow’s check-in.'
    } else if (loggedToday) {
      headline = 'Tonight is logged, without a serving.'
      lede = `No ${foodL} today, so this day does not count as an exposure. Tomorrow picks up exposure day ${words(next)} of three.`
    } else {
      headline = `Eat ${foodL} today.`
      lede = `Exposure day ${words(next)} of three. A normal serving, at your usual time. Tonight’s check-in asks whether you ate it and what your body did. Nothing is concluded yet.`
    }
    action = <CheckinButton state={loggedToday ? 'logged' : 'tonight'} onClick={onOpenDaily} />
  } else {
    if (clock.washoutDay === 0) {
      headline = 'Exposure complete. Washout begins tomorrow.'
      lede = `All three ${foodL} days are logged. From tomorrow, keep it out completely while the record watches for anything delayed.`
    } else {
      headline = `${Cap(foodL)} washout, day ${words(clock.washoutDay)} of eleven.`
      lede = `Keep ${foodL} out. Tonight’s check asks one thing: anything your body did today. The verdict opens the day after washout ends.`
    }
    action = <CheckinButton state={loggedToday ? 'logged' : 'washout'} onClick={onOpenDaily} />
  }

  const streakState = streak > 0 ? 'active'
    : awayDates.has(localDateString(new Date(Date.now() - 86400000))) ? 'away'
      : (stripDays.some(s => s === 'on' || s === 'exposure') ? 'broken' : 'none')
  const showCycleCard = state === 'exposure' || state === 'washout' || state === 'pending'
  const showPanels = state !== 'verdict' && state !== 'stalled' && state !== 'loading' && state !== 'nofoods'
  const trialFood = clock && !clock.verdictReady ? food : null
  const offPlate = unruled.map(f => f.name).filter(n => lower(n) !== foodL).concat(ruled.filter(f => f.cycle.verdict === 'Avoid').map(f => f.name))

  const helloClock = clock
    ? `${food} trial, day ${Math.max(1, Math.min(14, clock.cycleDay))} of 14`
    : state === 'complete' ? 'Program complete' : null

  return (
    <div className="hr-page">
      <style>{CSS}</style>

      <section className={`hr-hero ${showCycleCard ? '' : 'hr-hero-solo'}`}>
        <div>
          <p className="hr-hello">{greeting}{firstName ? `, ${firstName}` : ''}. {helloClock ? <span className="hr-quiet">{helloClock}</span> : state === 'between' ? <DayCounter n={reintroDay} label={reintroDay === 1 ? 'day of reintroduction' : 'days of reintroduction'} className="hr-day" /> : null}</p>
          <h1 className="hr-h1">{headline}</h1>
          <p className="hr-lede">{lede}</p>
          <div className="hr-actions">
            {action}
            {weeklyDue && state !== 'verdict' && state !== 'complete' && state !== 'loading' ? <button type="button" className="hr-link" onClick={onOpenWeekly}>{checkinLate ? 'Catch up on your weekly check-in' : 'Weekly check-in is open'}</button> : null}
          </div>
          {state !== 'complete' && state !== 'loading' && state !== 'nofoods' ? <StreakLine state={streakState} count={streak} loggedTonight={loggedToday || dailyDone} className="hr-streak" /> : null}
          {readError ? <p className="hr-quiet" style={{ marginTop: 10 }}>Your trial record could not be read just now, so the map below may be incomplete. It will refresh on the next load.</p> : null}
        </div>

        {showCycleCard && (
          <aside className="ob-paper hr-cycle">
            <h3>{food} on trial</h3>
            <p>{state === 'pending' ? 'Starts soon.' : clock.inExposure ? `Exposure, day ${Math.min(14, clock.cycleDay)} of 14.` : `Washout, day ${Math.min(14, clock.cycleDay)} of 14.`} Three exposure days, then eleven of watching. One square per day.</p>
            <Strip days={stripDays} size="md" label={`${food} cycle`} />
            <div className="hr-legend"><span><i className="exposure" />exposure</span><span><i className="on" />washout, logged</span><span><i className="today" />today</span></div>
          </aside>
        )}
      </section>

      {state === 'verdict' && (
        <section className="ob-paper hr-cycle hr-cycle-wide">
          <h3>{food}, {words(loggedNights)} night{loggedNights === 1 ? '' : 's'} on the record</h3>
          <Strip days={stripDays} size="md" label={`${food} cycle`} />
        </section>
      )}

      {state === 'complete' && (
        <section className="hr-outcome"><OutcomeQuestion session={session} profile={profile} /></section>
      )}

      {state !== 'loading' && state !== 'nofoods' && (
        <section className="hr-map">
          <h2>{state === 'complete' ? 'Your Food Map.' : 'Your Food Map, so far.'}</h2>
          <p className="hr-sub">
            {ruled.length === 0 ? `${Cap(words(foods.length))} suspect${foods.length === 1 ? '' : 's'}, none ruled yet. Every verdict here will be earned from a fourteen-day trial on your own record.`
              : `${Cap(words(ruled.length))} of ${words(foods.length)} ruled. Every verdict was earned from a fourteen-day trial on your own record. Nothing was assumed.`}
          </p>
          <div className="hr-cards">
            {foods.map(f => {
              const c = f.cycle
              const isActive = clock && lower(f.name) === foodL
              if (isActive && (!c || state !== 'complete')) {
                const ev = state === 'pending' ? 'Starts soon.' : state === 'stalled' ? `Needs a fresh start. ${Cap(words(clock.done))} of three servings logged.` : state === 'verdict' ? 'Verdict ready.' : clock.inExposure ? `Exposure day ${Math.min(3, clock.done + 1)} of 3.` : `Washout day ${clock.washoutDay} of 11.`
                return <VerdictCard key={f.name} food={f.name} meta={c ? `Retest. Standing verdict: ${c.verdict}.` : f.meta} state="trial" evidence={ev} />
              }
              if (c) return <VerdictCard key={f.name} food={f.name} meta={f.meta} state="ruled" verdict={c.verdict} evidence={evidenceLine(c, logsByCycle[c.id] || [])} conflicted={c.answers?.conflicted === true} stoppedEarly={!!c.stopped_early} />
              const isNext = !clock && unruled[0] && lower(unruled[0].name) === lower(f.name)
              return <SuspectCard key={f.name} food={f.name} meta={f.meta} state={isNext ? 'next' : 'suspect'} line={isNext ? 'Starts the day you pick it.' : 'Still off your plate. Not yet tried.'} onClick={onOpenReintro} />
            })}
          </div>
        </section>
      )}

      {showPanels && (
        <section className="hr-panels">
          <div className="ob-paper hr-panel">
            <h3>{state === 'complete' ? 'Living with the map.' : 'Rough night? Say so in the check-in.'}</h3>
            <p>{state === 'complete'
              ? 'Your verdicts are for the trials you ran. Ask Sensify knows every one of them, and a verdict ruled on conflicting evidence can be retested any time.'
              : 'If tonight is worse than usual, the check-in has a place to say what you felt and what you ate today. It is kept on file against the night, as a lead for later, never a ruling.'}</p>
            {state === 'complete'
              ? <button type="button" className="hr-link" onClick={onOpenReintro}>See retests and what comes next</button>
              : !loggedToday && !dailyDone ? <button type="button" className="hr-link" onClick={onOpenDaily}>Open tonight’s check-in</button> : <p className="hr-quiet">Tonight’s check-in is in. Tomorrow’s has the same place.</p>}
          </div>
          <HouseholdShareCard session={session} profile={profile} variant="panel" phase={state === 'complete' ? 'complete' : 'reintroduction'} foods={offPlate} trialFood={trialFood} />
        </section>
      )}
    </div>
  )
}

const CSS = `
.hr-page { max-width: 1180px; margin: 0 auto; padding: 24px 20px 72px; color: var(--ob-ink); }
.hr-hero { display: grid; grid-template-columns: 1.15fr .85fr; gap: 40px; align-items: start; padding: 12px 0 0; }
.hr-hero-solo { grid-template-columns: 1fr; }
.hr-hero-solo .hr-h1 { max-width: 900px; }
.hr-hello { font-size: 15px; color: var(--ob-ink-2); margin: 0 0 16px; display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
.hr-day b { font-size: 22px; }
.hr-quiet { color: var(--ob-mute); font-size: 14px; }
.hr-h1 { font-family: var(--font-display, 'Fraunces', serif); font-weight: 300; font-size: clamp(38px, 5.4vw, 70px); line-height: .98; letter-spacing: -.022em; margin: 0 0 18px; color: var(--ob-ink); }
.hr-lede { font-size: 17px; line-height: 1.5; color: var(--ob-ink-2); max-width: 560px; margin: 0 0 26px; }
.hr-actions { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
.hr-link { background: none; border: 0; padding: 0; font: inherit; font-size: 14px; font-weight: 500; color: var(--ob-moss); text-decoration: underline; text-decoration-color: rgba(60,106,75,.35); text-underline-offset: 5px; cursor: pointer; white-space: nowrap; }
.hr-streak { margin-top: 16px; font-size: 14px; }
.hr-cycle { padding: 22px 24px; margin-top: 8px; }
.hr-cycle h3, .hr-panel h3 { font-family: var(--font-display, 'Fraunces', serif); font-weight: 400; font-size: 22px; letter-spacing: -.015em; margin: 0 0 4px; line-height: 1.1; }
.hr-cycle p { font-size: 13.5px; color: var(--ob-mute); margin: 0 0 16px; line-height: 1.5; }
.hr-cycle .ob-strip { flex-wrap: wrap; }
.hr-cycle-wide { margin-top: 28px; }
.hr-legend { display: flex; gap: 18px; margin-top: 14px; font-size: 12px; color: var(--ob-mute); flex-wrap: wrap; }
.hr-legend i { display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: 6px; vertical-align: -1px; background: var(--ob-paper-2); }
.hr-legend i.exposure { background: var(--ob-ink); } .hr-legend i.on { background: var(--ob-moss); } .hr-legend i.today { background: var(--ob-paper); outline: 2px solid var(--ob-ink); outline-offset: -2px; }
.hr-outcome { margin-top: 28px; background: var(--ob-forest); border-radius: 18px; padding: 10px 24px 14px; color: #ECE7DC; }
.hr-map { margin-top: 40px; }
.hr-map h2 { font-family: var(--font-display, 'Fraunces', serif); font-weight: 300; font-size: 34px; letter-spacing: -.02em; margin: 0 0 8px; }
.hr-sub { font-size: 15px; color: var(--ob-ink-2); max-width: 640px; line-height: 1.5; margin: 0 0 20px; }
.hr-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 16px; }
.hr-cards .ob-vc, .hr-cards .ob-sc { min-height: 200px; }
.hr-cards .ob-meta { min-height: 2.6em; }
.hr-panels { display: grid; grid-template-columns: 1.1fr .9fr; gap: 16px; margin-top: 36px; }
.hr-panel { padding: 26px 28px; display: flex; flex-direction: column; gap: 14px; border-radius: 18px; }
.hr-panel p { font-size: 15px; line-height: 1.55; color: var(--ob-ink-2); margin: 0; }
.hr-panel .hr-link, .hr-panel .hr-quiet { align-self: flex-start; margin-top: 6px; }
@media (max-width: 860px) {
  .hr-hero, .hr-panels { grid-template-columns: 1fr; }
  .hr-page { padding: 12px 14px 64px; }
}
`
