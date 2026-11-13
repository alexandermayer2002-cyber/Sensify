import React from 'react'
import { createRoot } from 'react-dom/client'
import { Strip, SymptomCurve, VerdictCard, SuspectCard, StreakLine, CheckinButton, DayCounter, reintroStripDays } from '../../src/components/objects'

const pts = n => Array.from({ length: n }, (_, i) => ({ day: i + 1, value: Math.max(1.5, 5 - i * 0.08 + Math.sin(i * 2.1) * 0.15) }))
const Row = ({ title, children }) => (
  <section style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 40, padding: '32px 0', borderTop: '1px solid rgba(21,30,24,.12)' }}>
    <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 300, fontSize: 28 }}>{title}</h2>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '22px 30px', alignItems: 'flex-end' }}>{children}</div>
  </section>
)
const L = ({ t, children }) => <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><div style={{ fontSize: 12, color: '#737B73' }}>{t}</div>{children}</div>

function App() {
  const strip = reintroStripDays({ cycleStart: '2026-11-01', today: '2026-11-09', logs: [
    { log_date: '2026-11-01', ate_food: true }, { log_date: '2026-11-02', ate_food: true }, { log_date: '2026-11-03', ate_food: true },
    { log_date: '2026-11-04' }, { log_date: '2026-11-05' }, { log_date: '2026-11-06', away: true }, { log_date: '2026-11-07' }, { log_date: '2026-11-08', on_plan: false },
  ] })
  return (
    <main style={{ background: '#E8E3D8', minHeight: '100vh', padding: '48px 56px', fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#151E18' }}>
      <h1 style={{ fontFamily: 'Fraunces, serif', fontWeight: 300, fontSize: 40, marginBottom: 24 }}>Objects, rendered from the real components.</h1>
      <Row title="Strip">
        <L t="Elimination day 9"><Strip days={['on','on','on','slipped','on','on','none','on','today','future','future','future','future','future']} /></L>
        <L t="Reintro, built by reintroStripDays"><Strip days={strip} /></L>
        <L t="Small"><Strip size="sm" days={['exposure','exposure','exposure','on','on','today','future','future','future','future','future','future','future','future']} /></L>
        <L t="Large"><Strip size="lg" days={['exposure','today-exposure','exposure-planned','future','future','future','future','future','future','future','future','future','future','future']} /></L>
      </Row>
      <Row title="Curve">
        <L t="No data"><div className="ob-paper"><SymptomCurve points={[]} /></div></L>
        <L t="Building"><div className="ob-paper"><SymptomCurve points={pts(5)} /></div></L>
        <L t="Baseline known"><div className="ob-paper"><SymptomCurve points={pts(14)} baseline={5} /></div></L>
        <L t="Change"><div className="ob-paper"><SymptomCurve points={pts(40)} baseline={5} todayLabel="3.1 tonight" /></div></L>
      </Row>
      <Row title="Verdict card">
        <VerdictCard food="Eggs" state="untested" style={{ width: 220 }} />
        <VerdictCard food="Dairy" state="next" evidence="Trial begins day 71." style={{ width: 220 }} />
        <VerdictCard food="Crab" state="trial" evidence="Day 6 of 14. Washout." style={{ width: 220 }} />
        <VerdictCard food="Crab" state="ruled" verdict="Safe" evidence="No reaction across 14 days." style={{ width: 220 }} />
        <VerdictCard food="Eggs" state="ruled" verdict="Limit" evidence="Reacted on 1 of 3 exposure days." style={{ width: 220 }} />
        <VerdictCard food="Dairy" state="ruled" verdict="Avoid" evidence="Reacted on 3 of 3 exposure days, with symptoms into washout." style={{ width: 220 }} />
        <VerdictCard food="Eggs" state="ruled" verdict="Limit" evidence="Clean diary; you felt worse." conflicted style={{ width: 220 }} />
        <VerdictCard food="Shrimp" state="ruled" verdict="Avoid" evidence="Stopped on day 1 after a severe reaction." stoppedEarly style={{ width: 220 }} />
      </Row>
      <Row title="Suspect card">
        <SuspectCard food="Gluten and wheat" meta="Common trigger. You eat it daily." state="suspect" line="Third in line." style={{ width: 230 }} />
        <SuspectCard food="Dairy" meta="Common trigger." state="next" line="Starts when crab's washout ends." style={{ width: 230 }} />
        <SuspectCard food="Crab" meta="Lab flagged, low. You eat it rarely." state="exposure" line="Exposure day 2 of 3." style={{ width: 230 }} onClick={() => {}} />
        <SuspectCard food="Crab" meta="Lab flagged, low." state="washout" line="Washout day 5 of 11. Keep it out." style={{ width: 230 }} />
        <SuspectCard food="Crab" meta="Lab flagged, low." state="verdict" line="One survey, then the ruling." style={{ width: 230 }} />
      </Row>
      <Row title="Streak line">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <StreakLine state="none" /><StreakLine state="active" count={12} /><StreakLine state="active" count={1} /><StreakLine state="broken" /><StreakLine state="away" />
        </div>
      </Row>
      <Row title="Check-in button">
        <CheckinButton state="tonight" /><CheckinButton state="logged" /><CheckinButton state="washout" /><CheckinButton state="catchup" /><CheckinButton state="weekly" />
      </Row>
      <Row title="Day counter">
        <DayCounter n={23} of={56} label="elimination" /><DayCounter n={6} of={14} label="crab on trial" /><DayCounter n={42} label="days of reintroduction" /><DayCounter n={98} label="days on record" />
      </Row>
    </main>
  )
}
createRoot(document.getElementById('root')).render(<App />)
