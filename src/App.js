import React, { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Marketing from './pages/Marketing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState('marketing')
  const [isAdmin, setIsAdmin] = useState(false)

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

  // Admin check — hardcoded bypass for RLS recursion issue
  const ADMIN_IDS = ['826ea0a1-148b-4a2b-8e3f-2d40e1023d4b']

  useEffect(() => {
    if (!session) return
    // First check hardcoded list as bypass for RLS issues
    if (ADMIN_IDS.includes(session.user.id)) {
      setIsAdmin(true)
      return
    }
    // Fall back to database check
    supabase.from('profiles').select('is_admin').eq('id', session.user.id).maybeSingle()
      .then(({ data }) => setIsAdmin(data?.is_admin === true))
      .catch(() => setIsAdmin(false))
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

  if (page === 'marketing') return <Marketing onGetStarted={() => setPage('signup')} onSignIn={() => setPage('login')} />
  if (page === 'login') return <Login onSuccess={() => setPage('dashboard')} onSignup={() => setPage('signup')} />
  if (page === 'signup') return <Signup onSuccess={() => setPage('onboarding')} onLogin={() => setPage('login')} />
  if (page === 'onboarding') return <Onboarding onComplete={() => setPage('dashboard')} session={session} />
  if (page === 'admin') return <AdminDashboard session={session} onBack={() => setPage('dashboard')} />
  if (page === 'dashboard') return <Dashboard session={session} onLogout={handleLogout} isAdmin={isAdmin} onAdmin={() => setPage('admin')} />

  return null
}
