import React, { useState } from 'react'
import { supabase } from '../supabase'

// Shown when the user arrives from a password-reset email link.
// Supabase has already signed them in via the recovery token; this
// screen just sets the new password.

const INPUT_CSS = `
  .sn-input { background: #FFFFFF; border: none; box-shadow: var(--shadow-1), inset 0 1px 3px rgba(56,62,48,0.05); transition: box-shadow var(--t-fast) var(--ease); }
  .sn-input:focus { outline: none; box-shadow: 0 0 0 3px rgba(61,92,60,0.30), var(--shadow-1); }
`

const s = {
  wrap: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' },
  logo: { fontFamily: 'Fraunces, serif', fontSize: '30px', fontWeight: 300, letterSpacing: '-0.3px', color: '#20241F', marginBottom: '36px' },
  logoEm: { color: '#3D5C3C', fontStyle: 'italic' },
  card: { padding: '32px 28px', width: '100%', maxWidth: '400px' },
  title: { fontFamily: 'Fraunces, serif', fontSize: '28px', fontWeight: 300, letterSpacing: '-0.3px', marginBottom: '6px' },
  titleEm: { fontStyle: 'italic', color: '#3D5C3C' },
  sub: { fontSize: '13px', color: '#73736A', marginBottom: '24px', lineHeight: 1.6 },
  label: { marginBottom: '7px', display: 'block' },
  input: { width: '100%', borderRadius: '14px', padding: '13px 14px', fontSize: '16px', color: '#20241F', marginBottom: '14px', boxSizing: 'border-box' },
  btn: { width: '100%', marginTop: '4px' },
  error: { background: '#FAEAEA', color: '#C95B5B', borderRadius: '10px', padding: '10px 12px', fontSize: '13px', marginBottom: '14px' },
}

export default function ResetPassword({ onDone }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setError(error.message); return }
    onDone()
  }

  return (
    <div style={s.wrap}>
      <style>{INPUT_CSS}</style>
      <div style={s.logo}>sensi<em style={s.logoEm}>fy</em></div>
      <div className="sn-card sn-rise" style={s.card}>
        <div style={s.title}>Set a new <em style={s.titleEm}>password.</em></div>
        <div style={s.sub}>Choose a new password for your account.</div>
        {error && <div style={s.error}>{error}</div>}
        <form onSubmit={submit}>
          <label className="sn-micro" style={s.label}>New password</label>
          <input className="sn-input" style={s.input} type="password" placeholder="At least 8 characters" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
          <label className="sn-micro" style={s.label}>Confirm new password</label>
          <input className="sn-input" style={s.input} type="password" placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)} required />
          <button className="sn-btn" style={s.btn} type="submit" disabled={loading}>{loading ? 'Saving…' : 'Save new password →'}</button>
        </form>
      </div>
    </div>
  )
}
