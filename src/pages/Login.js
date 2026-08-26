import React, { useState } from 'react'
import { supabase } from '../supabase'

const s = {
  wrap: { minHeight: '100vh', background: '#F6F3EC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' },
  logo: { fontFamily: 'Fraunces, serif', fontSize: '28px', fontWeight: 400, color: '#1C1C1C', marginBottom: '36px' },
  logoEm: { color: '#3D5C3C' },
  card: { background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '18px', padding: '32px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 32px rgba(34,48,31,0.07)' },
  title: { fontFamily: 'Fraunces, serif', fontSize: '26px', fontWeight: 400, marginBottom: '6px' },
  titleEm: { color: '#3D5C3C' },
  sub: { fontSize: '14px', color: '#7A7A72', marginBottom: '24px' },
  label: { fontSize: '13px', fontWeight: 500, color: '#1C1C1C', marginBottom: '6px', display: 'block' },
  input: { width: '100%', border: '1.5px solid rgba(0,0,0,0.08)', borderRadius: '12px', padding: '13px 14px', fontSize: '14px', background: '#FFFFFF', color: '#1C1C1C', marginBottom: '14px', outline: 'none' },
  btn: { background: '#3D5C3C', color: 'white', border: 'none', borderRadius: '12px', padding: '14px', width: '100%', fontSize: '14px', fontWeight: 500, cursor: 'pointer', marginTop: '4px' },
  btnGoogle: { background: 'none', color: '#1C1C1C', border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: '12px', padding: '13px', width: '100%', fontSize: '14px', fontWeight: 500, cursor: 'pointer', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  divider: { display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0' },
  divLine: { flex: 1, height: '1px', background: 'rgba(0,0,0,0.08)' },
  divText: { fontSize: '12px', color: '#7A7A72' },
  error: { background: '#FAEAEA', color: '#C95B5B', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', marginBottom: '14px' },
  footer: { textAlign: 'center', marginTop: '16px', fontSize: '13px', color: '#7A7A72' },
  link: { color: '#3D5C3C', fontWeight: 500, cursor: 'pointer', textDecoration: 'none' }
}

export default function Login({ onSuccess, onSignup, onResumePaid }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('login')  // login | forgot | forgot-sent | resume
  const [notice, setNotice] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else onSuccess()
    setLoading(false)
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' })
  }

  const handleForgot = async (e) => {
    e.preventDefault()
    if (!email.trim()) { setError('Enter your email first.'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    setMode('forgot-sent')
  }

  const handleResume = async (e) => {
    e.preventDefault()
    if (!email.trim()) { setError('Enter the email you paid with.'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/.netlify/functions/resume-paid-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      setLoading(false)
      if (data.ok) {
        onResumePaid && onResumePaid(email.trim())
      } else {
        setError(data.error || "We couldn't find a payment under that email. If you think this is wrong, contact us and we'll sort it out.")
      }
    } catch (err) {
      setLoading(false)
      setError('Something went wrong. Please try again.')
    }
  }

  if (mode === 'forgot' || mode === 'forgot-sent') {
    return (
      <div style={s.wrap}>
        <div style={s.logo}>sensi<em style={s.logoEm}>fy</em></div>
        <div style={s.card}>
          {mode === 'forgot-sent' ? (
            <>
              <div style={s.title}>Check your <em style={s.titleEm}>email.</em></div>
              <div style={s.sub}>If an account exists for {email}, we've sent a link to reset your password. It may take a minute to arrive.</div>
              <div style={s.footer}><span style={s.link} onClick={() => { setMode('login'); setError('') }}>← Back to sign in</span></div>
            </>
          ) : (
            <>
              <div style={s.title}>Reset your <em style={s.titleEm}>password.</em></div>
              <div style={s.sub}>Enter your email and we'll send you a reset link.</div>
              {error && <div style={s.error}>{error}</div>}
              <form onSubmit={handleForgot}>
                <label style={s.label}>Email</label>
                <input style={s.input} type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
                <button style={s.btn} type="submit" disabled={loading}>{loading ? 'Sending…' : 'Send reset link →'}</button>
              </form>
              <div style={s.footer}><span style={s.link} onClick={() => { setMode('login'); setError('') }}>← Back to sign in</span></div>
            </>
          )}
        </div>
      </div>
    )
  }

  if (mode === 'resume') {
    return (
      <div style={s.wrap}>
        <div style={s.logo}>sensi<em style={s.logoEm}>fy</em></div>
        <div style={s.card}>
          <div style={s.title}>Finish setting <em style={s.titleEm}>up.</em></div>
          <div style={s.sub}>Already paid but never created your account? Enter the email you used at checkout and we'll pick up where you left off.</div>
          {error && <div style={s.error}>{error}</div>}
          <form onSubmit={handleResume}>
            <label style={s.label}>Email you paid with</label>
            <input style={s.input} type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            <button style={s.btn} type="submit" disabled={loading}>{loading ? 'Checking…' : 'Continue →'}</button>
          </form>
          <div style={s.footer}><span style={s.link} onClick={() => { setMode('login'); setError('') }}>← Back to sign in</span></div>
        </div>
      </div>
    )
  }

  return (
    <div style={s.wrap}>
      <div style={s.logo}>sensi<em style={s.logoEm}>fy</em></div>
      <div style={s.card}>
        <div style={s.title}>Welcome <em style={s.titleEm}>back.</em></div>
        <div style={s.sub}>Sign in to continue your program.</div>
        <button style={s.btnGoogle} onClick={handleGoogle}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>
        <div style={s.divider}><div style={s.divLine}></div><span style={s.divText}>or</span><div style={s.divLine}></div></div>
        {error && <div style={s.error}>{error}</div>}
        <form onSubmit={handleLogin}>
          <label style={s.label}>Email</label>
          <input style={s.input} type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
          <label style={s.label}>Password</label>
          <input style={s.input} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          <button style={s.btn} type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in →'}</button>
        </form>
        <div style={{ textAlign: 'center', marginTop: '12px' }}>
          <span style={{ ...s.link, fontSize: '13px' }} onClick={() => { setMode('forgot'); setError('') }}>Forgot password?</span>
        </div>
        <div style={s.footer}>Don't have an account? <span style={s.link} onClick={onSignup}>Get started</span></div>
        <div style={{ ...s.footer, marginTop: '8px', fontSize: '12px' }}>Paid but never finished setting up? <span style={s.link} onClick={() => { setMode('resume'); setError('') }}>Continue here</span></div>
      </div>
    </div>
  )
}
