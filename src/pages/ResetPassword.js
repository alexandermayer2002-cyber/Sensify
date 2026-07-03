import React, { useState } from 'react'
import { supabase } from '../supabase'

// Shown when the user arrives from a password-reset email link.
// Supabase has already signed them in via the recovery token; this
// screen just sets the new password.

const s = {
  wrap: { minHeight: '100vh', background: '#FAF8F4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' },
  logo: { fontFamily: 'Fraunces, serif', fontSize: '28px', fontWeight: 300, color: '#1C1C1C', marginBottom: '36px' },
  logoEm: { color: '#3D5C3C', fontStyle: 'italic' },
  card: { background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '400px' },
  title: { fontFamily: 'Fraunces, serif', fontSize: '26px', fontWeight: 300, marginBottom: '6px' },
  titleEm: { fontStyle: 'italic', color: '#3D5C3C' },
  sub: { fontSize: '14px', color: '#7A7A72', marginBottom: '24px' },
  label: { fontSize: '13px', fontWeight: 500, color: '#1C1C1C', marginBottom: '6px', display: 'block' },
  input: { width: '100%', border: '1.5px solid rgba(0,0,0,0.08)', borderRadius: '10px', padding: '13px 14px', fontSize: '14px', background: '#FFFFFF', color: '#1C1C1C', marginBottom: '14px', outline: 'none', boxSizing: 'border-box' },
  btn: { background: '#3D5C3C', color: 'white', border: 'none', borderRadius: '10px', padding: '14px', width: '100%', fontSize: '14px', fontWeight: 500, cursor: 'pointer', marginTop: '4px' },
  error: { background: '#FAEAEA', color: '#C95B5B', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', marginBottom: '14px' },
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
      <div style={s.logo}>sensi<em style={s.logoEm}>fy</em></div>
      <div style={s.card}>
        <div style={s.title}>Set a new <em style={s.titleEm}>password.</em></div>
        <div style={s.sub}>Choose a new password for your account.</div>
        {error && <div style={s.error}>{error}</div>}
        <form onSubmit={submit}>
          <label style={s.label}>New password</label>
          <input style={s.input} type="password" placeholder="At least 8 characters" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
          <label style={s.label}>Confirm new password</label>
          <input style={s.input} type="password" placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)} required />
          <button style={s.btn} type="submit" disabled={loading}>{loading ? 'Saving…' : 'Save new password →'}</button>
        </form>
      </div>
    </div>
  )
}
