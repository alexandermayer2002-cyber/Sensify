import React, { useState } from 'react'
import { supabase } from '../supabase'

const s = {
  wrap: { minHeight: '100vh', background: '#F6F3EC', display: 'flex', flexDirection: 'column', fontFamily: 'DM Sans, sans-serif' },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: '#FFFFFF', borderBottom: '1px solid rgba(0,0,0,0.08)' },
  logo: { fontFamily: 'Fraunces, serif', fontSize: '19px', fontWeight: 500, color: '#1C1C1C' },
  logoEm: { color: '#3D5C3C' },
  back: { fontSize: '13px', color: '#7A7A72', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'DM Sans, sans-serif' },
  body: { flex: 1, padding: '36px 24px 100px', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: '480px', margin: '0 auto', width: '100%' },
  eyebrow: { fontSize: '11px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: '#3D5C3C', marginBottom: '12px' },
  title: { fontFamily: 'Fraunces, serif', fontSize: '28px', fontWeight: 400, lineHeight: 1.2, marginBottom: '8px', letterSpacing: '-0.3px' },
  titleEm: { color: '#3D5C3C' },
  hint: { fontSize: '13px', color: '#7A7A72', marginBottom: '28px', lineHeight: 1.7 },
  label: { fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#1C1C1C' },
  input: { width: '100%', border: '1.5px solid rgba(0,0,0,0.08)', borderRadius: '12px', padding: '14px 16px', fontSize: '15px', fontFamily: 'DM Sans, sans-serif', color: '#1C1C1C', background: '#FFFFFF', outline: 'none', marginBottom: '20px', transition: 'border-color 0.15s' },
  timeGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' },
  timeBtn: { padding: '14px', borderRadius: '12px', border: '1.5px solid rgba(0,0,0,0.08)', background: '#FFFFFF', fontSize: '14px', cursor: 'pointer', color: '#1C1C1C', fontFamily: 'DM Sans, sans-serif', fontWeight: 500, textAlign: 'center', transition: 'all 0.12s' },
  timeBtnOn: { padding: '14px', borderRadius: '12px', border: '1.5px solid #3D5C3C', background: '#3D5C3C', fontSize: '14px', cursor: 'pointer', color: 'white', fontFamily: 'DM Sans, sans-serif', fontWeight: 500, textAlign: 'center' },
  infoBox: { background: '#EDF3ED', borderRadius: '12px', padding: '13px 16px', marginBottom: '16px', fontSize: '13px', color: '#3D5C3C', lineHeight: 1.65 },
  disclaimer: { fontSize: '12px', color: '#7A7A72', lineHeight: 1.6, marginBottom: '16px' },
  footer: { position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 24px', background: '#FAF8F4', borderTop: '1px solid rgba(0,0,0,0.06)' },
  cta: { background: '#3D5C3C', color: 'white', border: 'none', borderRadius: '12px', padding: '14px', width: '100%', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  ctaDisabled: { background: '#3D5C3C', color: 'white', border: 'none', borderRadius: '12px', padding: '14px', width: '100%', fontSize: '14px', fontWeight: 500, cursor: 'not-allowed', fontFamily: 'DM Sans, sans-serif', opacity: 0.35 },
  successWrap: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center', maxWidth: '480px', margin: '0 auto', width: '100%' },
  successIcon: { width: '64px', height: '64px', background: '#EDF3ED', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' },
  focusTag: { background: '#EDF3ED', borderRadius: '12px', padding: '13px 16px', textAlign: 'left', width: '100%', marginBottom: '10px' },
  focusLabel: { fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#3D5C3C', marginBottom: '5px' },
  focusValue: { fontSize: '13px', color: '#1C1C1C' },
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
      <div style={s.body}>
        <div style={s.eyebrow}>One last thing</div>
        <div style={s.title}>Your daily<br /><em style={s.titleEm}>check-in ritual.</em></div>
        <div style={s.hint}>Every evening, take 30 seconds on your dashboard: did you stay on plan, how you slept, your stress, your water. That tiny habit is what makes your results trustworthy.</div>

        <div style={s.focusTag}>
          <div style={s.focusLabel}>Why it matters</div>
          <div style={s.focusValue}>Symptoms move with sleep, stress, and hydration — not just food. Logging both is how we tell a real trigger from an ordinary rough day.</div>
        </div>
        <div style={s.focusTag}>
          <div style={s.focusLabel}>When to do it</div>
          <div style={s.focusValue}>Each evening works best — the day is fresh in your mind. You'll see your streak and your week build on the dashboard.</div>
        </div>

        <div style={s.infoBox}>
          Miss a day? No guilt — it just shows as a gap. Consistency beats perfection.
        </div>
      </div>
      <div style={s.footer}>
        <button style={s.cta} onClick={onComplete}>
          Go to my dashboard →
        </button>
      </div>
    </div>
  )
}
