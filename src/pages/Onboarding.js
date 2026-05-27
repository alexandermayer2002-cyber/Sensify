import React, { useState } from 'react'
import { supabase } from '../supabase'

const s = {
  wrap: { minHeight: '100vh', background: '#FAF8F4', display: 'flex', flexDirection: 'column', fontFamily: 'DM Sans, sans-serif' },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: '#FFFFFF', borderBottom: '1px solid rgba(0,0,0,0.08)' },
  logo: { fontFamily: 'Fraunces, serif', fontSize: '19px', fontWeight: 500, color: '#1C1C1C' },
  logoEm: { color: '#3D5C3C', fontStyle: 'italic' },
  back: { fontSize: '13px', color: '#7A7A72', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'DM Sans, sans-serif' },
  body: { flex: 1, padding: '36px 24px 100px', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: '480px', margin: '0 auto', width: '100%' },
  eyebrow: { fontSize: '11px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: '#3D5C3C', marginBottom: '12px' },
  title: { fontFamily: 'Fraunces, serif', fontSize: '28px', fontWeight: 300, lineHeight: 1.2, marginBottom: '8px', letterSpacing: '-0.3px' },
  titleEm: { fontStyle: 'italic', color: '#3D5C3C' },
  hint: { fontSize: '13px', color: '#7A7A72', marginBottom: '28px', lineHeight: 1.7 },
  label: { fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#1C1C1C' },
  input: { width: '100%', border: '1.5px solid rgba(0,0,0,0.08)', borderRadius: '11px', padding: '14px 16px', fontSize: '15px', fontFamily: 'DM Sans, sans-serif', color: '#1C1C1C', background: '#FFFFFF', outline: 'none', marginBottom: '20px', transition: 'border-color 0.15s' },
  timeGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' },
  timeBtn: { padding: '14px', borderRadius: '11px', border: '1.5px solid rgba(0,0,0,0.08)', background: '#FFFFFF', fontSize: '14px', cursor: 'pointer', color: '#1C1C1C', fontFamily: 'DM Sans, sans-serif', fontWeight: 500, textAlign: 'center', transition: 'all 0.12s' },
  timeBtnOn: { padding: '14px', borderRadius: '11px', border: '1.5px solid #3D5C3C', background: '#3D5C3C', fontSize: '14px', cursor: 'pointer', color: 'white', fontFamily: 'DM Sans, sans-serif', fontWeight: 500, textAlign: 'center' },
  infoBox: { background: '#EDF3ED', borderRadius: '11px', padding: '13px 16px', marginBottom: '16px', fontSize: '13px', color: '#3D5C3C', lineHeight: 1.65 },
  disclaimer: { fontSize: '12px', color: '#7A7A72', lineHeight: 1.6, marginBottom: '16px' },
  footer: { position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 24px', background: '#FAF8F4', borderTop: '1px solid rgba(0,0,0,0.06)' },
  cta: { background: '#3D5C3C', color: 'white', border: 'none', borderRadius: '11px', padding: '14px', width: '100%', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  ctaDisabled: { background: '#3D5C3C', color: 'white', border: 'none', borderRadius: '11px', padding: '14px', width: '100%', fontSize: '14px', fontWeight: 500, cursor: 'not-allowed', fontFamily: 'DM Sans, sans-serif', opacity: 0.35 },
  successWrap: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center', maxWidth: '480px', margin: '0 auto', width: '100%' },
  successIcon: { width: '64px', height: '64px', background: '#EDF3ED', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' },
  focusTag: { background: '#EDF3ED', borderRadius: '11px', padding: '13px 16px', textAlign: 'left', width: '100%', marginBottom: '10px' },
  focusLabel: { fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#3D5C3C', marginBottom: '5px' },
  focusValue: { fontSize: '13px', color: '#1C1C1C' },
}

const TEXT_TIMES = ['6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM']

export default function Onboarding({ onComplete, session }) {
  const [phone, setPhone] = useState('')
  const [textTime, setTextTime] = useState('')
  const [saving, setSaving] = useState(false)

  const name = session?.user?.user_metadata?.full_name?.split(' ')[0] || 'there'

  const formatPhone = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 10)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0,3)}) ${digits.slice(3)}`
    return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`
  }

  const phoneValid = phone.replace(/\D/g, '').length === 10

  const handleComplete = async () => {
    setSaving(true)
    await supabase.from('profiles').update({
      phone_number: phone.replace(/\D/g, ''),
      text_time_preference: textTime,
      sms_opted_in: true,
    }).eq('id', session.user.id)
    setSaving(false)
    onComplete()
  }

  return (
    <div style={s.wrap}>
      <div style={s.topBar}>
        <div style={{ width: 40 }} />
        <div style={s.logo}>sensi<em style={s.logoEm}>fy</em></div>
        <div style={{ width: 40 }} />
      </div>
      <div style={s.body}>
        <div style={s.eyebrow}>One last thing</div>
        <div style={s.title}>Set up your<br /><em style={s.titleEm}>daily check-in.</em></div>
        <div style={s.hint}>Every evening we'll send you a quick text — just reply YES or NO to log your daily compliance. It takes one second and keeps your program on track.</div>

        <div style={s.label}>Your mobile number</div>
        <input
          style={s.input}
          type="tel"
          placeholder="(555) 000-0000"
          value={phone}
          onChange={e => setPhone(formatPhone(e.target.value))}
        />

        <div style={s.label}>What time works best?</div>
        <div style={s.timeGrid}>
          {TEXT_TIMES.map(time => (
            <button key={time} style={textTime === time ? s.timeBtnOn : s.timeBtn} onClick={() => setTextTime(time)}>{time}</button>
          ))}
        </div>

        <div style={s.infoBox}>
          We'll text you every evening at your chosen time. Reply YES if you stayed on plan, NO if something came up. That's all we need.
        </div>

        <div style={s.disclaimer}>
          Standard messaging rates may apply. Reply STOP anytime to unsubscribe.
        </div>
      </div>
      <div style={s.footer}>
        <button
          style={phoneValid && textTime ? s.cta : s.ctaDisabled}
          disabled={!phoneValid || !textTime || saving}
          onClick={handleComplete}
        >
          {saving ? 'Saving...' : 'Go to my dashboard →'}
        </button>
      </div>
    </div>
  )
}
