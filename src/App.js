import React, { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Marketing from './pages/Marketing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import { startCheckout } from './utils/checkout'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState('marketing')
  const [isAdmin, setIsAdmin] = useState(false)
  const [paidEmail, setPaidEmail] = useState(null)

  // Detect return from Stripe Checkout and verify the payment was real
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('paid') === 'true' && params.get('session_id')) {
      const sid = params.get('session_id')
      fetch('/.netlify/functions/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sid }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.paid) {
            setPaidEmail(data.email || null)
            setPage('signup')
          } else {
            setPage('marketing')
          }
          window.history.replaceState({}, '', '/')
        })
        .catch(() => { setPage('marketing'); window.history.replaceState({}, '', '/') })
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) setPage('dashboard')
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) setPage('dashboard')
      else { setPage('marketing'); setIsAdmin(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Admin check — uses is_admin_check() SECURITY DEFINER function (no RLS recursion)
  useEffect(() => {
    if (!session) return
    supabase.rpc('is_admin_check')
      .then(({ data, error }) => {
        if (error) {
          // Fallback to direct profile read if the function doesn't exist yet
          supabase.from('profiles').select('is_admin').eq('id', session.user.id).maybeSingle()
            .then(({ data: p }) => setIsAdmin(p?.is_admin === true))
            .catch(() => setIsAdmin(false))
        } else {
          setIsAdmin(data === true)
        }
      })
  }, [session])

  // 24 hour inactivity logout
  useEffect(() => {
    if (!session) return
    const INACTIVITY_LIMIT = 24 * 60 * 60 * 1000
    const lastActivity = localStorage.getItem('sensify_last_activity')
    const now = Date.now()

    // Only log out if they have a previous activity timestamp that's expired
    // Don't log out on a fresh login (no lastActivity stored)
    if (lastActivity && now - parseInt(lastActivity) > INACTIVITY_LIMIT) {
      localStorage.removeItem('sensify_last_activity')
      supabase.auth.signOut()
      return
    }

    // Update activity timestamp
    localStorage.setItem('sensify_last_activity', now.toString())
    const updateActivity = () => localStorage.setItem('sensify_last_activity', Date.now().toString())
    window.addEventListener('click', updateActivity)
    window.addEventListener('keydown', updateActivity)
    return () => {
      window.removeEventListener('click', updateActivity)
      window.removeEventListener('keydown', updateActivity)
    }
  }, [session])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'DM Sans, sans-serif', color: '#3D5C3C' }}>
      Loading...
    </div>
  )

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setPage('marketing')
    setIsAdmin(false)
  }

  if (page === 'marketing') return <Marketing onGetStarted={() => startCheckout()} onSignIn={() => setPage('login')} />
  if (page === 'login') return <Login onSuccess={() => setPage('dashboard')} onSignup={() => startCheckout()} />
  if (page === 'signup') return <Signup prefillEmail={paidEmail} onSuccess={() => setPage('onboarding')} onLogin={() => setPage('login')} />
  if (page === 'onboarding') return <Onboarding onComplete={() => setPage('dashboard')} session={session} />
  if (page === 'admin') return <AdminDashboard session={session} onBack={() => setPage('dashboard')} />
  if (page === 'dashboard') return <Dashboard session={session} onLogout={handleLogout} isAdmin={isAdmin} onAdmin={() => setPage('admin')} />

  return null
}
