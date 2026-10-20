import React, { useState } from 'react'
import { supabase } from '../supabase'

const s = {
  wrap: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', boxShadow: 'var(--shadow-1)' },
  logo: { fontFamily: 'Fraunces, serif', fontSize: '19px', fontWeight: 500, color: '#20241F' },
  logoEm: { color: '#3D5C3C' },
  back: { fontSize: '13px', color: '#73736A', cursor: 'pointer', background: 'none', border: 'none' },
  body: { flex: 1, padding: '36px 24px 100px', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: '480px', margin: '0 auto', width: '100%' },
  eyebrow: { display: 'block', marginBottom: '12px' },
  title: { fontFamily: 'Fraunces, serif', fontSize: '32px', fontWeight: 300, lineHeight: 1.2, marginBottom: '8px', letterSpacing: '-0.3px' },
  titleEm: { color: '#3D5C3C' },
  hint: { fontSize: '13px', color: '#73736A', marginBottom: '28px', lineHeight: 1.7 },
  label: { fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#20241F' },
  input: { width: '100%', border: 'none', boxShadow: 'var(--shadow-1)', borderRadius: '14px', padding: '14px 16px', fontSize: '16px', color: '#20241F', background: '#FFFFFF', outline: 'none', marginBottom: '20px' },
  timeGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' },
  timeBtn: { padding: '14px', borderRadius: '16px', border: 'none', boxShadow: 'var(--shadow-1)', background: '#FFFFFF', fontSize: '14px', cursor: 'pointer', color: '#20241F', fontWeight: 500, textAlign: 'center', transition: 'all 0.12s' },
  timeBtnOn: { padding: '14px', borderRadius: '16px', border: 'none', boxShadow: 'var(--shadow-pill)', background: '#3D5C3C', fontSize: '14px', cursor: 'pointer', color: 'white', fontWeight: 600, textAlign: 'center' },
  infoBox: { background: 'rgba(139,174,138,0.12)', borderRadius: '16px', padding: '13px 16px', marginBottom: '16px', fontSize: '13px', color: '#3D5C3C', lineHeight: 1.65 },
  disclaimer: { fontSize: '12px', color: '#73736A', lineHeight: 1.6, marginBottom: '16px' },
  footer: { position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 24px', background: 'rgba(251,248,242,0.92)', backdropFilter: 'blur(8px)', boxShadow: '0 -8px 24px rgba(56,62,48,0.06)' },
  cta: { width: '100%' },
  ctaDisabled: { width: '100%' },
  successWrap: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center', maxWidth: '480px', margin: '0 auto', width: '100%' },
  successIcon: { width: '64px', height: '64px', background: '#EDF3ED', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' },
  focusTag: { background: '#F7F5EE', borderRadius: '16px', padding: '14px 16px', textAlign: 'left', width: '100%', marginBottom: '10px' },
  focusLabel: { display: 'block', marginBottom: '5px' },
  focusValue: { fontSize: '13px', color: '#20241F', lineHeight: 1.6 },
}

export default function Onboarding({ onComplete, session }) {
  const name = session?.user?.user_metadata?.full_name?.split(' ')[0] || 'there'

  return (
    <div style={s.wrap}>
      <div style={s.topBar}>
        <div style={{ width: 40 }} />
        <div style={s.logo}>sensi<em style={s.logoEm}>fy</em></div>
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
