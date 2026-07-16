import React, { useState } from 'react'
import { supabase } from '../supabase'

const s = {
  wrap: { minHeight: '100vh', background: '#FAF8F4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' },
  logo: { fontFamily: 'Fraunces, serif', fontSize: '28px', fontWeight: 300, color: '#1C1C1C', marginBottom: '36px' },
  logoEm: { color: '#3D5C3C', fontStyle: 'italic' },
  card: { background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '400px' },
  title: { fontFamily: 'Fraunces, serif', fontSize: '26px', fontWeight: 300, marginBottom: '6px' },
  titleEm: { fontStyle: 'italic', color: '#3D5C3C' },
  sub: { fontSize: '14px', color: '#7A7A72', marginBottom: '24px' },
  label: { fontSize: '13px', fontWeight: 500, color: '#1C1C1C', marginBottom: '6px', display: 'block' },
  input: { width: '100%', border: '1.5px solid rgba(0,0,0,0.08)', borderRadius: '10px', padding: '13px 14px', fontSize: '14px', background: '#FFFFFF', color: '#1C1C1C', marginBottom: '14px', outline: 'none' },
  btn: { background: '#3D5C3C', color: 'white', border: 'none', borderRadius: '10px', padding: '14px', width: '100%', fontSize: '14px', fontWeight: 500, cursor: 'pointer', marginTop: '4px' },
  btnGoogle: { background: 'none', color: '#1C1C1C', border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: '10px', padding: '13px', width: '100%', fontSize: '14px', fontWeight: 500, cursor: 'pointer', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  divider: { display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0' },
  divLine: { flex: 1, height: '1px', background: 'rgba(0,0,0,0.08)' },
  divText: { fontSize: '12px', color: '#7A7A72' },
  error: { background: '#FAEAEA', color: '#C95B5B', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', marginBottom: '14px' },
  success: { background: '#EAF4EE', color: '#4A8C6A', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', marginBottom: '14px' },
  footer: { textAlign: 'center', marginTop: '16px', fontSize: '13px', color: '#7A7A72' },
  link: { color: '#3D5C3C', fontWeight: 500, cursor: 'pointer' },
  disclaimer: { fontSize: '11px', color: '#7A7A72', textAlign: 'center', marginTop: '14px', lineHeight: 1.6 }
}

export default function Signup({ onSuccess, onLogin, prefillEmail }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState(prefillEmail || '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    })
    if (error) {
      setError(error.message)
    } else {
      // Create profile row immediately on signup
      if (data?.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: name,
          email: email,
          program_phase: 'awaiting_results',
          created_at: new Date().toISOString(),
        })
      }
      setSuccess('Account created! You can now sign in.')
    }
    setLoading(false)
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' })
  }

  return (
    <div style={s.wrap}>
      <div style={s.logo}>Sensify<span style={{ color: '#3D5C3C' }}>.</span></div>
      <div style={s.card}>
        <div style={s.title}>Create your <em style={s.titleEm}>account.</em></div>
        <div style={s.sub}>Just the basics. No medical history needed.</div>
        <button style={s.btnGoogle} onClick={handleGoogle}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>
        <div style={s.divider}><div style={s.divLine}></div><span style={s.divText}>or</span><div style={s.divLine}></div></div>
        {error && <div style={s.error}>{error}</div>}
        {success && <div style={s.success}>{success}</div>}
        {prefillEmail && !success && (
          <div style={{ position: 'relative', background: '#22301F', borderRadius: '16px', padding: '22px 20px', marginBottom: '18px', overflow: 'hidden', boxShadow: '0 14px 36px rgba(34,48,31,0.25)', textAlign: 'center' }}>
            <div style={{ position: 'absolute', top: -50, left: -50, width: 160, height: 160, borderRadius: '50%', background: '#8BAE8A', opacity: 0.1, pointerEvents: 'none' }} />
            <div style={{ position: 'relative', width: 40, height: 40, borderRadius: '50%', background: 'rgba(139,174,138,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#8BAE8A', fontSize: 18 }}>✓</div>
            <div style={{ position: 'relative', fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 400, color: '#FAF8F4', lineHeight: 1.25, marginBottom: 6 }}>Payment received.</div>
            <div style={{ position: 'relative', fontSize: 12.5, color: 'rgba(250,248,244,0.7)', lineHeight: 1.6 }}>Your program is paid for. Now let's create the account it lives in.</div>
          </div>
        )}
        {!success && (
          <form onSubmit={handleSignup}>
            <label style={s.label}>Full name</label>
            <input style={s.input} type="text" placeholder="Sarah Chen" value={name} onChange={e => setName(e.target.value)} required />
            <label style={s.label}>Email</label>
            <input style={{ ...s.input, ...(prefillEmail ? { background: '#F4F2EC', color: '#6A6A62', cursor: 'not-allowed' } : {}) }} type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} required readOnly={!!prefillEmail} title={prefillEmail ? 'Locked to the email you paid with' : undefined} />
            <label style={s.label}>Password</label>
            <input style={s.input} type="password" placeholder="At least 8 characters" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
            <label style={s.label}>Confirm password</label>
            <input style={{ ...s.input, borderColor: confirmPassword && confirmPassword !== password ? '#C95B5B' : undefined }} type="password" placeholder="Re-enter your password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={8} />
            {confirmPassword && confirmPassword !== password && (
              <div style={{ fontSize: '12px', color: '#C95B5B', marginTop: '-8px', marginBottom: '10px' }}>Passwords do not match</div>
            )}
            <button style={s.btn} type="submit" disabled={loading}>{loading ? 'Creating account...' : 'Create account →'}</button>
          </form>
        )}
        {success && <button style={s.btn} onClick={onLogin}>Go to sign in →</button>}
        <div style={s.disclaimer}>By continuing you agree to our <a href="/terms.html" target="_blank" rel="noopener noreferrer" style={{ color: '#3D5C3C', textDecoration: 'underline' }}>Terms of Service</a> and <a href="/privacy.html" target="_blank" rel="noopener noreferrer" style={{ color: '#3D5C3C', textDecoration: 'underline' }}>Privacy Policy</a>. This program is for wellness purposes only and is not a medical diagnosis.</div>
        <div style={{ ...s.footer, marginTop: '12px' }}>Already have an account? <span style={s.link} onClick={onLogin}>Sign in</span></div>
      </div>
    </div>
  )
}
