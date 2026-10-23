import React from 'react'

// Wired back into the signup flow 2026-10-23 (QA 2026-10-21 #4: this screen —
// the one piece of habit education in the product — was unreachable dead code).
// Dead styles from its earlier multi-step incarnation deleted at the same time.
const s = {
  wrap: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', boxShadow: 'var(--shadow-1)' },
  logo: { fontFamily: 'Fraunces, serif', fontSize: '19px', fontWeight: 500, color: '#20241F' },
  body: { flex: 1, padding: '36px 24px 100px', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: '480px', margin: '0 auto', width: '100%' },
  eyebrow: { display: 'block', marginBottom: '12px' },
  title: { fontFamily: 'Fraunces, serif', fontSize: '32px', fontWeight: 300, lineHeight: 1.2, marginBottom: '8px', letterSpacing: '-0.3px' },
  titleEm: { color: '#3D5C3C' },
  hint: { fontSize: '13px', color: '#73736A', marginBottom: '28px', lineHeight: 1.7 },
  infoBox: { background: 'rgba(139,174,138,0.12)', borderRadius: '16px', padding: '13px 16px', marginBottom: '16px', fontSize: '13px', color: '#3D5C3C', lineHeight: 1.65 },
  footer: { position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 24px', background: 'rgba(251,248,242,0.92)', backdropFilter: 'blur(8px)', boxShadow: '0 -8px 24px rgba(56,62,48,0.06)' },
  cta: { width: '100%' },
  focusTag: { background: '#F7F5EE', borderRadius: '16px', padding: '14px 16px', textAlign: 'left', width: '100%', marginBottom: '10px' },
  focusLabel: { display: 'block', marginBottom: '5px' },
  focusValue: { fontSize: '13px', color: '#20241F', lineHeight: 1.6 },
}

export default function Onboarding({ onComplete }) {
  return (
    <div style={s.wrap}>
      <div style={s.topBar}>
        <div style={{ width: 40 }} />
        <div style={s.logo}>Sensify<span style={{ color: '#3D5C3C' }}>.</span></div>
        <div style={{ width: 40 }} />
      </div>
      <div className="sn-rise" style={s.body}>
        <div className="sn-micro" style={s.eyebrow}>One last thing</div>
        <div style={s.title}>Your daily<br /><em style={s.titleEm}>check-in ritual.</em></div>
        <div style={s.hint}>Every evening, take 30 seconds on your dashboard: did you stay on plan, how you slept, your stress, your water. That tiny habit is what makes your results trustworthy.</div>

        <div style={s.focusTag}>
          <div className="sn-micro" style={s.focusLabel}>Why it matters</div>
          <div style={s.focusValue}>Symptoms move with sleep, stress, and hydration, not just food. Logging both is how we tell a real trigger from an ordinary rough day.</div>
        </div>
        <div style={s.focusTag}>
          <div className="sn-micro" style={s.focusLabel}>When to do it</div>
          <div style={s.focusValue}>Each evening works best, while the day is fresh in your mind. You'll see your streak and your week build on the dashboard.</div>
        </div>

        <div style={s.infoBox}>
          Miss a day? No guilt. It just shows as a gap. Consistency beats perfection.
        </div>
      </div>
      <div style={s.footer}>
        <button className="sn-btn" style={s.cta} onClick={onComplete}>
          Go to my dashboard →
        </button>
      </div>
    </div>
  )
}
