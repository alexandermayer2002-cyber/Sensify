import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabase'
import { Strip, VerdictCard, SuspectCard, StreakLine, CheckinButton, DayCounter } from '../components/objects'
import { getTestingOrder, getProtocolFoods } from '../utils/protocolEngine'
import { todayLocal, localDateString } from '../utils/dateUtils'
import { HouseholdShareCard } from './HouseholdCard'
import { evidenceLine } from '../utils/evidence'

// HOME, DURING REINTRODUCTION (day 57 onward) AND AT PROGRAM COMPLETE.
// Assembled from the seven shared objects. One question per state
// (qa/SCREENS.md, Home / Reintro exposure, Washout, Verdict day, Between
// cycles, Program complete):
//   exposure      "Did I eat <food>? What do I log?"   hero = the cycle strip
//   washout       "Anything to do today?"               hero = the cycle strip
//   verdict ready "Anything to do?"                      hero = one button
//   stalled       "What happened to my trial?"          hero = restart
//   between       "What do I do today?"                  hero = the map so far
//   complete      "Am I done?"                           hero = the Food Map
// Never: "MAP COMPLETE" as a label, projected trial dates, a verdict color on
// an unruled food, two clocks in one card, "Protocol Day n" beside a cycle day.

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

  // ---- Cycles and the active cycle's logs (this screen's own two reads) ----
  const [cycles, setCycles] = useState(null)
  const [logs, setLogs] = useState([])
  const [logsByCycle, setLogsByCycle] = useState({})
  useEffect(() => {
    if (!session?.user?.id) return
    let alive = true
    ;(async () => {
      const { data } = await supabase.from('reintroduction_results')
        .select('id, food, verdict, verdict_reason, stopped_early, answers, started_at, washout_started_at, exposure_days_completed')
        .eq('user_id', session.user.id).order('started_at', { ascending: true })
      if (alive) setCycles(data || [])
      const ids = (data || []).map(c => c.id)
      if (ids.length) {
        const { data: all } = await supabase.from('reintro_daily_logs').select('reintro_id, log_date, ate_food, had_symptoms, symptoms, phase').in('reintro_id', ids).order('log_date', { ascending: true })
        const by = {}
        for (const l of (all || [])) (by[l.reintro_id] = by[l.reintro_id] || []).push(l)
        if (alive) setLogsByCycle(by)
      }
      if (activeCycle?.id) {
        const { data: l } = await supabase.from('reintro_daily_logs').select('log_date, ate_food, had_symptoms, phase').eq('reintro_id', activeCycle.id).order('log_date', { ascending: true })
        if (alive) setLogs(l || [])
      }
    })()
    return () => { alive = false }
  }, [session?.user?.id, activeCycle?.id])

  const latestByFood = useMemo(() => {
    const m = {}
    for (const c of (cycles || [])) m[lower(c.food)] = c  // ascending, so the latest cycle wins
    return m
  }, [cycles])

  // ---- Foods in testing order, with state ----
  const foods = useMemo(() => {
    const freq = profile?.food_frequency || {}
    const resolved = getProtocolFoods(profile, labResult)
    const list = (resolved?.foods || []).filter(f => freq[f.name] !== 'never')
    return getTestingOrder(list, freq).map(f => {
      const lvl = LEVEL_WORD[f.level] || null
      const meta = [lvl ? `Lab flagged, ${lvl}.` : 'Common trigger.', FREQ_WORD[freq[f.name]] || ''].filter(Boolean).join(' ')
      return { name: f.name, meta, cycle: latestByFood[lower(f.name)] || null }
    })
  }, [profile, labResult, latestByFood])
  const ruled = foods.filter(f => f.cycle?.verdict)
  const unruled = foods.filter(f => !f.cycle?.verdict)
  const allRuled = foods.length > 0 && unruled.length === 0
  const counts = ruled.reduce((a, f) => { a[f.cycle.verdict] = (a[f.cycle.verdict] || 0) + 1; return a }, {})

  // ---- Cycle clock (same math as ReintroTab) ----
  const clock = useMemo(() => {
    if (!activeCycle?.started_at) return null
    const start = parseLocal(activeCycle.started_at)
    const cycleDay = daysBetween(start, todayD) + 1
    const done = activeCycle.exposure_days_completed || 0
    const inExposure = done < EXPOSURE_TARGET
    const washoutStart = activeCycle.washout_started_at ? parseLocal(activeCycle.washout_started_at) : null
    const washoutDay = washoutStart ? daysBetween(washoutStart, todayD) + 1 : 0
    const stalled = inExposure && cycleDay > EXPOSURE_CALENDAR_CAP
    const verdictReady = !inExposure && washoutDay > WASHOUT_LENGTH
    return { food: activeCycle.food, cycleDay, done, inExposure, washoutDay, stalled, verdictReady }
  }, [activeCycle, todayD])

  const state = allRuled ? 'complete'
    : !clock ? 'between'
      : clock.verdictReady ? 'verdict'
        : clock.stalled ? 'stalled'
          : clock.inExposure ? 'exposure' : 'washout'

  // ---- The cycle strip: exposure squares by log, then eleven washout squares ----
  const loggedToday = logs.some(l => l.log_date === today)
  const stripDays = useMemo(() => {
    if (!clock) return []
    const out = []
    const expLogs = logs.filter(l => l.phase === 'exposure' || l.ate_food === true).slice(0, EXPOSURE_TARGET)
    for (let i = 0; i < EXPOSURE_TARGET; i++) {
      const l = expLogs[i]
      if (l) out.push(l.log_date === today ? 'today-exposure' : 'exposure')
      else if (i === expLogs.length && clock.inExposure) out.push(loggedToday ? 'exposure-planned' : 'today-exposure')
      else out.push('exposure-planned')
    }
    if (activeCycle?.washout_started_at) {
      const ws = parseLocal(activeCycle.washout_started_at)
      const wlogs = new Set(logs.filter(l => l.phase !== 'exposure' && l.ate_food !== true).map(l => l.log_date))
      for (let i = 0; i < WASHOUT_LENGTH; i++) {
        const d = new Date(ws); d.setDate(ws.getDate() + i)
        const iso = localDateString(d)
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
  }, [clock, logs, today, activeCycle, awayDates, loggedToday])

  // ---- Headline, lede, action per state ----
  const food = clock?.food || ''
  const foodL = lower(food)
  let headline, lede, action
  if (state === 'complete') {
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
  } else if (state === 'verdict') {
    headline = `Your ${foodL} verdict is ready.`
    lede = 'Fourteen days are on the record. One short survey, then the ruling. Nothing is decided until you answer.'
    action = <button type="button" className="ob-btn tonight" onClick={() => onStartVerdictSurvey?.(food)}>Get my verdict</button>
  } else if (state === 'stalled') {
    headline = `The ${foodL} trial stalled.`
    lede = `${Cap(words(clock.done))} of three exposure days logged in ${words(clock.cycleDay)} days. A trial needs its three servings close together to be fair, so this one restarts fresh.`
    action = <button type="button" className="ob-btn tonight" onClick={onOpenReintro}>Restart the {foodL} trial</button>
  } else if (state === 'exposure') {
    const n = Math.min(EXPOSURE_TARGET, clock.done + (loggedToday ? 0 : 1))
    headline = loggedToday ? `${Cap(foodL)}, exposure day ${words(clock.done)} is in.` : `Eat ${foodL} today.`
    lede = loggedToday
      ? 'Nothing more to eat or do until tomorrow. Note anything your body does tonight in tomorrow’s check-in.'
      : 'A normal serving, at your usual time. Tonight’s check-in asks whether you ate it and what your body did. Nothing is concluded yet.'
    action = <CheckinButton state={loggedToday ? 'logged' : 'tonight'} onClick={onOpenDaily} />
  } else {
    headline = `${Cap(foodL)} washout, day ${words(clock.washoutDay)} of eleven.`
    lede = `Keep ${foodL} out. Tonight’s check is one question: anything your body did today. The verdict arrives on day fourteen.`
    action = <CheckinButton state={loggedToday ? 'logged' : 'washout'} onClick={onOpenDaily} />
  }

  const streakState = streak > 0 ? 'active' : awayDates.has(localDateString(new Date(Date.now() - 86400000))) ? 'away' : 'none'
  const cycleLine = clock ? `${clock.inExposure ? 'Exposure' : 'Washout'}: day ${Math.min(14, clock.cycleDay)} of 14` : null
  const avoidNow = unruled.map(f => f.name).concat(ruled.filter(f => f.cycle.verdict === 'Avoid').map(f => f.name))

  return (
    <div className="hr-page">
      <style>{CSS}</style>

      <section className={`hr-hero ${state === 'exposure' || state === 'washout' ? '' : 'hr-hero-solo'}`}>
        <div>
          <p className="hr-hello">{greeting}{firstName ? `, ${firstName}` : ''}. {state === 'complete' ? <span className="hr-quiet">Program complete</span> : <DayCounter n={reintroDay} label={reintroDay === 1 ? 'day of reintroduction' : 'days of reintroduction'} className="hr-day" />}</p>
          <h1 className="hr-h1">{headline}</h1>
          <p className="hr-lede">{lede}</p>
          <div className="hr-actions">
            {action}
            {weeklyDue && state !== 'verdict' && state !== 'complete' ? <button type="button" className="hr-link" onClick={onOpenWeekly}>{checkinLate ? 'Weekly check-in, catch up' : 'Weekly check-in is open'}</button> : null}
          </div>
          {state !== 'complete' ? <StreakLine state={streakState} count={streak} className="hr-streak" /> : null}
        </div>

        {(state === 'exposure' || state === 'washout') && (
          <aside className="ob-paper hr-cycle">
            <h3>{food} on trial</h3>
            <p>{cycleLine}. Three exposure days, then eleven of watching. One square per day.</p>
            <Strip days={stripDays} size="md" label={`${food} cycle`} />
            <div className="hr-legend"><span><i className="exposure" />exposure</span><span><i className="on" />washout, logged</span><span><i className="today" />today</span></div>
          </aside>
        )}
      </section>

      {state === 'verdict' && (
        <section className="ob-paper hr-cycle hr-cycle-wide">
          <h3>{food}, fourteen days on the record</h3>
          <Strip days={stripDays} size="lg" label={`${food} cycle`} />
        </section>
      )}

      <section className="hr-map">
        <h2>{state === 'complete' ? 'Your Food Map.' : 'Your Food Map, so far.'}</h2>
        <p className="hr-sub">
          {foods.length === 0 ? 'No suspects are listed for your protocol.'
            : ruled.length === 0 ? `${Cap(words(foods.length))} suspect${foods.length === 1 ? '' : 's'}, none ruled yet. Every verdict here will be earned from a fourteen-day trial on your own record.`
            : `${Cap(words(ruled.length))} of ${words(foods.length)} ruled. Every verdict was earned from a fourteen-day trial on your own record. Nothing was assumed.`}
        </p>
        <div className="hr-cards">
          {foods.map((f, i) => {
            const c = f.cycle
            if (c?.verdict) {
              return <VerdictCard key={f.name} food={f.name} meta={f.meta} state="ruled" verdict={c.verdict} evidence={evidenceLine(c, logsByCycle[c.id] || [])} conflicted={c.answers?.conflicted === true} stoppedEarly={!!c.stopped_early} />
            }
            if (clock && lower(f.name) === foodL) {
              return <VerdictCard key={f.name} food={f.name} meta={f.meta} state="trial" evidence={clock.inExposure ? `Exposure day ${Math.min(3, clock.done + 1)} of 3.` : `Washout day ${clock.washoutDay} of 11.`} />
            }
            const firstUnruled = unruled[0] && lower(unruled[0].name) === lower(f.name) && !clock
            return <SuspectCard key={f.name} food={f.name} meta={f.meta} state={firstUnruled ? 'next' : 'suspect'} line={firstUnruled ? 'Starts the day you pick it.' : 'Still off your plate. Not yet tried.'} onClick={onOpenReintro} />
          })}
        </div>
      </section>

      <section className="hr-panels">
        <div className="ob-paper hr-panel">
          <h3>{state === 'complete' ? 'Living with the map.' : 'Rough night? Tell us what you ate.'}</h3>
          <p>{state === 'complete'
            ? 'Your verdicts are for the trials you ran. Ask Sensify knows every one of them, and if a verdict was ruled on conflicting evidence you can retest it any time.'
            : 'If tonight is worse than usual, write down today’s meals in your own words inside the check-in. We keep it on file against the night. It is a lead for later, never a ruling.'}</p>
          {state === 'complete'
            ? <button type="button" className="hr-link" onClick={onOpenReintro}>See retests and what comes next</button>
            : !dailyDone && !loggedToday ? <button type="button" className="hr-link" onClick={onOpenDaily}>It goes in tonight’s check-in</button> : <p className="hr-quiet">Tonight’s check-in is in. Tomorrow’s has the same box.</p>}
        </div>
        <HouseholdShareCard session={session} profile={profile} variant="panel" phase={state === 'complete' ? 'complete' : 'reintroduction'} foods={avoidNow} />
      </section>
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
