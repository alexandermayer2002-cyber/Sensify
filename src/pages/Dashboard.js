import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import LabResults from './LabResults'
import IntakeSurvey from './IntakeSurvey'
import WeeklyCheckin from './WeeklyCheckin'
import ReintroductionSurvey from './ReintroductionSurvey'
import SlipupSurvey from './SlipupSurvey'
import ComplianceAudit from './ComplianceAudit'
import DailyComplianceDisplay from './DailyComplianceDisplay'
import CheckinHistory from './CheckinHistory'
import FoodMap from './FoodMap'
import ReintroTab from './ReintroTab'
import {
  generateDay1Message,
  generateDay3Message,
  generateDay14Message,
  generateDay28Message,
  generateDay57Message,
  generateModerateUnlockMessage,
  generateHighUnlockMessage,
  checkMilestoneShown,
  markMilestoneShown,
} from '../utils/aiInsights'

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Fraunces:ital,wght@0,300;0,500;1,300&display=swap');

  .snfy-app { min-height: 100vh; background: #FAF8F4; color: #1C1C1C; font-family: 'DM Sans', sans-serif; }

  .snfy-nav {
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(0,0,0,0.07);
    padding: 0 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 56px;
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .snfy-logo { font-family: 'Fraunces', serif; font-size: 20px; font-weight: 500; color: #1C1C1C; letter-spacing: -0.3px; }
  .snfy-logo em { color: #3D5C3C; font-style: italic; }
  .snfy-nav-tabs { display: flex; gap: 2px; }
  .snfy-tab { font-size: 13px; font-weight: 400; color: #7A7A72; padding: 6px 12px; border: none; background: none; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: color 0.15s; letter-spacing: -0.1px; border-bottom: 2px solid transparent; }
  .snfy-tab.active { color: #1C1C1C; font-weight: 500; border-bottom: 2px solid #3D5C3C; }
  .snfy-tab:hover:not(.active) { color: #1C1C1C; }
  @media (max-width: 600px) { .snfy-tab { font-size: 12px; padding: 6px 8px; } }
  .snfy-nav-right { display: flex; align-items: center; gap: 10px; }
  .snfy-phase-pill { font-size: 11.5px; color: #3D5C3C; background: #EDF3ED; padding: 4px 12px; border-radius: 20px; font-weight: 500; }
  .snfy-signout { font-size: 12px; color: #7A7A72; background: none; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; }
  .snfy-signout:hover { color: #1C1C1C; }

  .snfy-layout { padding: 24px 20px 40px; max-width: 960px; margin: 0 auto; }
  @media (min-width: 680px) {
    .snfy-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 28px 28px 48px; align-items: start; }
    .snfy-layout > div:last-child { padding-top: 0; }
  }

  .snfy-greeting { margin-bottom: 22px; }
  .snfy-greeting h1 { font-family: 'Fraunces', serif; font-size: 28px; font-weight: 300; line-height: 1.2; margin-bottom: 5px; letter-spacing: -0.5px; }
  .snfy-greeting h1 em { font-style: italic; color: #3D5C3C; }
  .snfy-greeting p { font-size: 13px; color: #7A7A72; line-height: 1.55; }

  .snfy-action { background: #FFFFFF; border-radius: 16px; padding: 20px; margin-bottom: 14px; border: 1.5px solid #3D5C3C; }
  .snfy-action.amber { border-color: #D4894A; }
  .snfy-action.red { border-color: rgba(201,91,91,0.5); }
  .snfy-action-tag { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.7px; color: #3D5C3C; background: #EDF3ED; padding: 3px 9px; border-radius: 20px; display: inline-block; margin-bottom: 10px; }
  .snfy-action-tag.amber { color: #D4894A; background: #FDF2EA; }
  .snfy-action-tag.red { color: #C95B5B; background: #FAEAEA; }
  .snfy-action h2 { font-family: 'Fraunces', serif; font-size: 19px; font-weight: 300; margin-bottom: 6px; line-height: 1.3; letter-spacing: -0.3px; }
  .snfy-action h2 em { font-style: italic; color: #3D5C3C; }
  .snfy-action h2 em.amber { color: #D4894A; }
  .snfy-action h2 em.red { color: #C95B5B; }
  .snfy-action p { font-size: 13px; color: #7A7A72; line-height: 1.65; margin-bottom: 14px; }
  .snfy-btn { background: #3D5C3C; color: white; border: none; border-radius: 9px; padding: 11px 20px; font-size: 13px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: opacity 0.15s; }
  .snfy-btn:hover { opacity: 0.87; }
  .snfy-btn.amber { background: #D4894A; }
  .snfy-btn.red { background: #C95B5B; }

  .snfy-phase { background: #3D5C3C; border-radius: 16px; padding: 20px; color: white; margin-bottom: 14px; }
  .snfy-phase-meta { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
  .snfy-phase-meta span { font-size: 10px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; opacity: 0.55; }
  .snfy-phase-meta small { font-size: 11px; opacity: 0.65; font-weight: 500; }
  .snfy-phase h3 { font-family: 'Fraunces', serif; font-size: 21px; font-weight: 300; margin-bottom: 16px; letter-spacing: -0.3px; }
  .snfy-pbar { background: rgba(255,255,255,0.15); border-radius: 4px; height: 5px; margin-bottom: 8px; overflow: hidden; }
  .snfy-pfill { height: 100%; background: rgba(255,255,255,0.9); border-radius: 4px; transition: width 0.6s ease; }
  .snfy-plabel { font-size: 11px; opacity: 0.65; display: flex; justify-content: space-between; }

  .snfy-pending { background: #FDF2EA; border: 1px solid rgba(212,137,74,0.18); border-radius: 13px; padding: 14px; margin-bottom: 14px; display: flex; align-items: center; gap: 11px; }
  .snfy-pending-icon { width: 34px; height: 34px; background: #D4894A; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .snfy-audit-pending { background: #FAF8F4; border: 1px solid rgba(0,0,0,0.08); border-radius: 13px; padding: 14px; margin-bottom: 14px; display: flex; align-items: center; gap: 11px; }
  .snfy-audit-icon { width: 34px; height: 34px; background: #EDF3ED; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

  .snfy-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
  .snfy-stat { background: #FFFFFF; border: 1px solid rgba(0,0,0,0.07); border-radius: 13px; padding: 15px; }
  .snfy-stat-label { font-size: 10px; color: #7A7A72; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
  .snfy-stat-val { font-family: 'Fraunces', serif; font-size: 32px; font-weight: 300; line-height: 1; margin-bottom: 3px; letter-spacing: -0.5px; }
  .snfy-stat-sub { font-size: 11px; color: #7A7A72; }
  .snfy-stat-change { font-size: 11px; font-weight: 500; margin-top: 3px; color: #4A8C6A; }

  .snfy-sec-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; color: #7A7A72; margin-bottom: 9px; }

  .snfy-avoiding { background: #FFFFFF; border: 1px solid rgba(0,0,0,0.07); border-radius: 14px; overflow: hidden; margin-bottom: 14px; }
  .snfy-avoid-scroll { max-height: 220px; overflow-y: auto; }
  .snfy-avoid-scroll::-webkit-scrollbar { width: 3px; }
  .snfy-avoid-scroll::-webkit-scrollbar-track { background: transparent; }
  .snfy-avoid-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 3px; }
  .snfy-avoid-group { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding: 9px 14px 6px; color: #7A7A72; background: #FAF8F4; }
  .snfy-avoid-item { display: flex; align-items: center; justify-content: space-between; padding: 11px 14px; border-top: 1px solid rgba(0,0,0,0.05); font-size: 13px; }
  .snfy-avoid-left { display: flex; align-items: center; gap: 9px; }
  .snfy-avoid-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .snfy-badge { font-size: 11px; font-weight: 500; padding: 3px 9px; border-radius: 20px; }
  .snfy-badge.high { background: #FAEAEA; color: #C95B5B; }
  .snfy-badge.moderate { background: #FDF2EA; color: #D4894A; }
  .snfy-badge.low { background: #EAF4EE; color: #4A8C6A; }

  .snfy-insight { background: #FFFFFF; border: 1px solid rgba(0,0,0,0.07); border-left: 3px solid #3D5C3C; border-radius: 0 13px 13px 0; padding: 16px; margin-bottom: 14px; }
  .snfy-insight-tag { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; color: #3D5C3C; margin-bottom: 8px; }
  .snfy-insight p { font-size: 13px; line-height: 1.75; color: #1C1C1C; }

  .snfy-loading { display: flex; align-items: center; justify-content: center; min-height: 60vh; font-size: 14px; color: #7A7A72; }
`

const BADGE = {
  High: { bg: '#FAEAEA', color: '#C95B5B', dot: '#C95B5B', cls: 'high' },
  Moderate: { bg: '#FDF2EA', color: '#D4894A', dot: '#D4894A', cls: 'moderate' },
  Low: { bg: '#EAF4EE', color: '#4A8C6A', dot: '#4A8C6A', cls: 'low' },
}

// Confetti overlay — brand colors, 3.5 seconds, fades out
function ConfettiOverlay() {
  const canvasRef = React.useRef(null)
  const pieces = React.useRef([])
  const raf = React.useRef(null)

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const colors = ['#3D5C3C', '#8BAE8A', '#D4894A', '#FAF8F4', '#EDF3ED', '#4A8C6A', '#C8D8C8']
    for (let i = 0; i < 120; i++) {
      pieces.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        w: Math.random() * 10 + 5,
        h: Math.random() * 5 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 4,
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * 3 + 2,
        opacity: 1,
      })
    }

    let start = null
    const duration = 3500

    const animate = (ts) => {
      if (!start) start = ts
      const elapsed = ts - start
      const progress = Math.min(elapsed / duration, 1)

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      pieces.current.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        p.rotation += p.rotSpeed
        p.opacity = progress > 0.6 ? 1 - ((progress - 0.6) / 0.4) : 1

        ctx.save()
        ctx.globalAlpha = p.opacity
        ctx.translate(p.x + p.w / 2, p.y + p.h / 2)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx.restore()
      })

      if (progress < 1) raf.current = requestAnimationFrame(animate)
    }

    raf.current = requestAnimationFrame(animate)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 999 }}
    />
  )
}

// Interactive symptom graph
function SymptomGraph({ profile, checkins, activeMetric, setActiveMetric }) {
  const metrics = []
  if (profile?.baseline_bloating) metrics.push({ id: 'bloating', label: 'Bloating', baseline: profile.baseline_bloating, color: '#C95B5B', lowerIsBetter: true })
  if (profile?.baseline_energy) metrics.push({ id: 'energy', label: 'Energy', baseline: profile.baseline_energy, color: '#3D5C3C', lowerIsBetter: false })
  if (profile?.baseline_clarity) metrics.push({ id: 'clarity', label: 'Clarity', baseline: profile.baseline_clarity, color: '#4A8C6A', lowerIsBetter: false })
  if (profile?.baseline_sleep) metrics.push({ id: 'sleep', label: 'Sleep', baseline: profile.baseline_sleep, color: '#D4894A', lowerIsBetter: false })
  if (profile?.baseline_gas) metrics.push({ id: 'gas', label: 'Gas', baseline: profile.baseline_gas, color: '#7A7A72', lowerIsBetter: true })

  const selected = activeMetric || metrics[0]?.id
  const metric = metrics.find(m => m.id === selected) || metrics[0]

  if (!metric || checkins.length === 0) {
    return (
      <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '14px', padding: '20px', marginTop: '14px' }}>
        <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#7A7A72', marginBottom: '10px' }}>Symptom trends</div>
        <div style={{ fontSize: '13px', color: '#7A7A72', lineHeight: 1.65 }}>
          {metrics.length === 0 ? 'Complete your intake survey to set baselines.' : 'Your symptom trends will appear here after your first weekly check-in.'}
        </div>
      </div>
    )
  }

  const sortedCheckins = [...checkins].sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at))
  const points = [{ week: 0, val: metric.baseline, label: 'Baseline' }]
  sortedCheckins.forEach((c, i) => {
    if (c.answers?.[metric.id] !== undefined) {
      points.push({ week: c.week_number || i + 1, val: c.answers[metric.id], label: `Week ${c.week_number || i + 1}` })
    }
  })

  const latest = points[points.length - 1]
  const change = latest && metric.baseline
    ? Math.round(((latest.val - metric.baseline) / metric.baseline) * 100)
    : 0
  const improved = metric.lowerIsBetter ? change < 0 : change > 0
  const changeLabel = change === 0 ? 'No change' : `${change > 0 ? '+' : ''}${change}% from baseline`

  // SVG graph
  const W = 240, H = 90
  const padL = 20, padR = 10, padT = 10, padB = 20
  const gW = W - padL - padR
  const gH = H - padT - padB
  const maxVal = 10, minVal = 0

  const toX = (i) => padL + (i / Math.max(points.length - 1, 1)) * gW
  const toY = (v) => padT + gH - ((v - minVal) / (maxVal - minVal)) * gH

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(p.val)}`).join(' ')
  const areaD = points.length > 0
    ? `${pathD} L ${toX(points.length - 1)} ${H - padB} L ${toX(0)} ${H - padB} Z`
    : ''

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '14px', padding: '18px', marginTop: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#7A7A72' }}>Symptom trends</div>
        <div style={{ fontSize: '11px', fontWeight: 500, color: improved ? '#4A8C6A' : change === 0 ? '#7A7A72' : '#C95B5B' }}>{changeLabel}</div>
      </div>

      {/* Metric selector pills */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {metrics.map(m => (
          <button
            key={m.id}
            onClick={() => setActiveMetric(m.id)}
            style={{
              padding: '4px 10px', borderRadius: '20px', border: 'none', cursor: 'pointer',
              fontSize: '11px', fontWeight: 500, fontFamily: 'DM Sans, sans-serif',
              background: selected === m.id ? m.color : 'rgba(0,0,0,0.04)',
              color: selected === m.id ? 'white' : '#7A7A72',
              transition: 'all 0.15s',
            }}
          >{m.label}</button>
        ))}
      </div>

      {/* SVG graph */}
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
        {/* Grid lines */}
        {[2, 4, 6, 8, 10].map(v => (
          <line key={v} x1={padL} y1={toY(v)} x2={W - padR} y2={toY(v)} stroke="rgba(0,0,0,0.05)" strokeWidth="1" />
        ))}
        {/* Baseline reference line */}
        <line x1={padL} y1={toY(metric.baseline)} x2={W - padR} y2={toY(metric.baseline)} stroke={metric.color} strokeWidth="1" strokeDasharray="3,3" opacity="0.4" />

        {/* Area fill */}
        {areaD && <path d={areaD} fill={metric.color} opacity="0.07" />}
        {/* Line */}
        <path d={pathD} fill="none" stroke={metric.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={toX(i)} cy={toY(p.val)} r="4" fill="white" stroke={metric.color} strokeWidth="2" />
            {i === points.length - 1 && (
              <text x={toX(i)} y={toY(p.val) - 8} textAnchor="middle" fontSize="10" fill={metric.color} fontFamily="DM Sans, sans-serif" fontWeight="500">{p.val}</text>
            )}
          </g>
        ))}

        {/* X axis labels */}
        {points.map((p, i) => (
          <text key={i} x={toX(i)} y={H - 4} textAnchor="middle" fontSize="8" fill="#7A7A72" fontFamily="DM Sans, sans-serif">{p.label}</text>
        ))}
      </svg>

      {/* Summary row */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
        <div style={{ flex: 1, background: '#FAF8F4', borderRadius: '8px', padding: '10px 12px' }}>
          <div style={{ fontSize: '10px', color: '#7A7A72', marginBottom: '3px' }}>Baseline</div>
          <div style={{ fontSize: '20px', fontFamily: 'Fraunces, serif', fontWeight: 300 }}>{metric.baseline}</div>
        </div>
        <div style={{ flex: 1, background: '#FAF8F4', borderRadius: '8px', padding: '10px 12px' }}>
          <div style={{ fontSize: '10px', color: '#7A7A72', marginBottom: '3px' }}>Latest</div>
          <div style={{ fontSize: '20px', fontFamily: 'Fraunces, serif', fontWeight: 300, color: improved ? '#4A8C6A' : change === 0 ? '#1C1C1C' : '#C95B5B' }}>{latest?.val ?? '—'}</div>
        </div>
        <div style={{ flex: 1, background: '#FAF8F4', borderRadius: '8px', padding: '10px 12px' }}>
          <div style={{ fontSize: '10px', color: '#7A7A72', marginBottom: '3px' }}>Check-ins</div>
          <div style={{ fontSize: '20px', fontFamily: 'Fraunces, serif', fontWeight: 300 }}>{points.length - 1}</div>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard({ session, onLogout, isAdmin, onAdmin }) {
  const [screen, setScreen] = useState('dashboard')
  const [tab, setTab] = useState('home')
  const [profile, setProfile] = useState(null)
  const [labResult, setLabResult] = useState(null)
  const [weeklyDue, setWeeklyDue] = useState(false)
  const [complianceData, setComplianceData] = useState([])
  const [consecutiveNOs, setConsecutiveNOs] = useState(0)
  const [pendingAudit, setPendingAudit] = useState(false)
  const [loading, setLoading] = useState(true)
  const [milestoneMessage, setMilestoneMessage] = useState(null)
  const [milestoneKey, setMilestoneKey] = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [checkins, setCheckins] = useState([])
  const [activeGraphMetric, setActiveGraphMetric] = useState(null)

  const name = session?.user?.user_metadata?.full_name?.split(' ')[0] || 'there'

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  useEffect(() => { loadData() }, [screen])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: p } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      setProfile(p)

      const { data: l } = await supabase.from('lab_results').select('*').eq('user_id', session.user.id).order('submitted_at', { ascending: false }).limit(1).single()
      setLabResult(l)

      const { data: c } = await supabase.from('weekly_checkins').select('*').eq('user_id', session.user.id).order('submitted_at', { ascending: false }).limit(8)
      if (c) setCheckins(c)

      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const { data: comp } = await supabase.from('daily_compliance').select('*').eq('user_id', session.user.id).gte('date', sevenDaysAgo.toISOString().split('T')[0]).order('date', { ascending: false })
      if (comp) {
        setComplianceData(comp)
        let nos = 0
        for (const entry of comp) {
          if (entry.response === 'NO') nos++
          else break
        }
        setConsecutiveNOs(nos)
      }

      const { data: audit } = await supabase.from('compliance_audit').select('*').eq('user_id', session.user.id).eq('status', 'pending_admin_review').single()
      setPendingAudit(!!audit)

      if (p?.program_phase === 'elimination' || p?.program_phase === 'reintroduction') {
        const { data: c } = await supabase.from('weekly_checkins').select('submitted_at, answers').eq('user_id', session.user.id).order('submitted_at', { ascending: false }).limit(4)

        // Calculate check-in availability based on protocol_start_date
        const protocolStart = p?.protocol_start_date
        if (protocolStart) {
          const startDate = new Date(protocolStart)
          const today = new Date()
          const daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24))

          // Windows open every 7 days: day 7, 14, 21, 28...
          // Each window stays open for 48 hours (days 7-8, 14-15, 21-22...)
          if (daysSinceStart >= 7) {
            const currentWindowWeek = Math.floor(daysSinceStart / 7) // which week we're in
            const windowOpenDay = currentWindowWeek * 7 // day 7, 14, 21...
            const windowCloseDay = windowOpenDay + 1 // 48 hours = 2 calendar days

            const inWindow = daysSinceStart >= windowOpenDay && daysSinceStart <= windowCloseDay

            const completedThisWindow = c && c.some(checkin => {
              const checkinDay = Math.floor((new Date(checkin.submitted_at) - startDate) / (1000 * 60 * 60 * 24))
              return checkinDay >= windowOpenDay && checkinDay <= windowCloseDay
            })

            setWeeklyDue(inWindow && !completedThisWindow)
          } else {
            setWeeklyDue(false)
          }
        } else {
          setWeeklyDue(false)
        }

        // No improvement detection — after week 4 with high compliance
        const protocolDay = p?.protocol_start_date
          ? Math.floor((new Date() - new Date(p.protocol_start_date)) / (1000 * 60 * 60 * 24)) + 1
          : 0

        if (protocolDay >= 28 && c && c.length >= 4) {
          const baselineBloating = p?.baseline_bloating
          const baselineEnergy = p?.baseline_energy
          const latestBloating = c[0]?.answers?.bloating
          const latestEnergy = c[0]?.answers?.energy

          const bloatingImprovement = baselineBloating && latestBloating
            ? ((baselineBloating - latestBloating) / baselineBloating) * 100
            : 100

          const energyImprovement = baselineEnergy && latestEnergy
            ? ((latestEnergy - baselineEnergy) / baselineEnergy) * 100
            : 100

          const avgImprovement = (bloatingImprovement + energyImprovement) / 2

          const highComplianceCount = c.filter(checkin =>
            checkin.answers?.compliance === 'Fully' || checkin.answers?.compliance === 'Mostly'
          ).length

          if (avgImprovement < 15 && highComplianceCount >= 3) {
            const { data: existingAudit } = await supabase
              .from('compliance_audit')
              .select('id')
              .eq('user_id', session.user.id)
              .eq('trigger_type', 'no_improvement')
              .gte('triggered_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
              .maybeSingle()

            if (!existingAudit) {
              await supabase.from('compliance_audit').insert({
                user_id: session.user.id,
                triggered_at: new Date().toISOString(),
                trigger_type: 'no_improvement',
                hardest_parts: [],
                status: 'pending_admin_review',
              })
            }
          }
        }
      }
      // Check for milestone messages
      if (p?.protocol_start_date) {
        try {
          checkMilestones(p, l, c || [])
        } catch (e) {}
      }

    } catch (e) {}
    setLoading(false)
  }
  const checkMilestones = async (p, lab, c) => {
    if (!p?.protocol_start_date) return
    const name = session?.user?.user_metadata?.full_name?.split(' ')[0] || 'there'
    const startDate = new Date(p.protocol_start_date)
    const today = new Date()
    const day = Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1

    // Day 1
    if (day === 1) {
      const shown = await checkMilestoneShown(supabase, session.user.id, 'day1')
      if (!shown) {
        try {
          const msg = await generateDay1Message({ name, profile: p, labResult: lab })
          setMilestoneMessage(msg)
          setMilestoneKey('day1')
          setShowConfetti(true)
          setTimeout(() => setShowConfetti(false), 3500)
          await markMilestoneShown(supabase, session.user.id, 'day1')
        } catch (e) {}
      }
    }
    // Day 3
    else if (day === 3) {
      const shown = await checkMilestoneShown(supabase, session.user.id, 'day3')
      if (!shown) {
        try {
          const { generateDay3Message: gen } = await import('../utils/aiInsights')
          const msg = await gen({ name, profile: p, labResult: lab })
          setMilestoneMessage(msg)
          setMilestoneKey('day3')
          await markMilestoneShown(supabase, session.user.id, 'day3')
        } catch (e) {}
      }
    }
    // Day 14
    else if (day === 14) {
      const shown = await checkMilestoneShown(supabase, session.user.id, 'day14')
      if (!shown) {
        try {
          const msg = await generateDay14Message({ name, profile: p, checkins: c })
          setMilestoneMessage(msg)
          setMilestoneKey('day14')
          setShowConfetti(true)
          setTimeout(() => setShowConfetti(false), 3500)
          await markMilestoneShown(supabase, session.user.id, 'day14')
        } catch (e) {}
      }
    }
    // Day 28
    else if (day === 28) {
      const shown = await checkMilestoneShown(supabase, session.user.id, 'day28')
      if (!shown) {
        try {
          const msg = await generateDay28Message({ name, profile: p, checkins: c })
          setMilestoneMessage(msg)
          setMilestoneKey('day28')
          setShowConfetti(true)
          setTimeout(() => setShowConfetti(false), 3500)
          await markMilestoneShown(supabase, session.user.id, 'day28')
        } catch (e) {}
      }
    }
    else if (day === 57) {
      const shown = await checkMilestoneShown(supabase, session.user.id, 'day57')
      if (!shown) {
        try {
          const msg = await generateDay57Message({ name, profile: p, labResult: lab })
          setMilestoneMessage(msg)
          setMilestoneKey('day57')
          setShowConfetti(true)
          setTimeout(() => setShowConfetti(false), 3500)
          await markMilestoneShown(supabase, session.user.id, 'day57')
        } catch (e) {}
      }
    }
    // Day 113 — moderate unlocks
    else if (day === 113) {
      const shown = await checkMilestoneShown(supabase, session.user.id, 'day113')
      if (!shown) {
        try {
          const msg = await generateModerateUnlockMessage({ name, profile: p, labResult: lab })
          setMilestoneMessage(msg)
          setMilestoneKey('day113')
          await markMilestoneShown(supabase, session.user.id, 'day113')
        } catch (e) {}
      }
    }
    // Day 169 — high unlocks
    else if (day === 169) {
      const shown = await checkMilestoneShown(supabase, session.user.id, 'day169')
      if (!shown) {
        try {
          const msg = await generateHighUnlockMessage({ name, profile: p, labResult: lab })
          setMilestoneMessage(msg)
          setMilestoneKey('day169')
          await markMilestoneShown(supabase, session.user.id, 'day169')
        } catch (e) {}
      }
    }
  }

  const cleanDays = (() => {
    let count = 0
    const sorted = [...complianceData].sort((a, b) => new Date(b.date) - new Date(a.date))
    for (const entry of sorted) {
      if (entry.response === 'YES') count++
      else break
    }
    return count
  })()

  // Calculate current day and phase from protocol_start_date
  // Only counts if intake is completed AND lab results approved
  const calculateProtocolDay = () => {
    if (!profile?.protocol_start_date) return 0
    if (!profile?.intake_completed_at) return 0
    if (profile?.program_phase === 'pending_review' || profile?.program_phase === 'awaiting_results') return 0
    const start = new Date(profile.protocol_start_date)
    const today = new Date()
    const diffMs = today - start
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1
    return Math.max(1, diffDays)
  }

  const calculatePhase = (day) => {
    if (!profile?.protocol_start_date) return profile?.program_phase || null
    if (!profile?.intake_completed_at) return profile?.program_phase || null
    if (day <= 56) return 'elimination'
    return 'reintroduction'
  }

  const currentDay = calculateProtocolDay()
  const currentWeek = Math.ceil(currentDay / 7)
  const calculatedPhase = calculatePhase(currentDay)
  const eliminationProgressPct = profile?.protocol_start_date ? Math.min((currentDay / 56) * 100, 100) : 0
  const daysUntilReintro = profile?.protocol_start_date ? Math.max(56 - currentDay, 0) : null

  const today = new Date().toISOString().split('T')[0]
  const todayEntry = complianceData.find(c => c.date === today)
  const showSlipupCard = todayEntry?.response === 'NO' && !pendingAudit
  const showAuditCard = consecutiveNOs >= 3 && !pendingAudit
  const showIntakeCard = !profile?.intake_completed_at
  const showLabCard = profile?.intake_completed_at && !labResult
  const showPendingLabCard = labResult?.status === 'pending_review'
  const showCheckinCard = weeklyDue && !showIntakeCard && !showLabCard && !showSlipupCard && !showAuditCard
  const showReintroCard = calculatedPhase === 'reintroduction' && profile?.current_reintro_day >= 14

  const phaseLabel = calculatedPhase === 'elimination' ? 'Elimination'
    : calculatedPhase === 'reintroduction' ? 'Reintroduction'
    : profile?.program_phase === 'pending_review' ? 'Pending'
    : 'Setup'

  const phaseFull = calculatedPhase === 'elimination' ? 'Elimination Phase'
    : calculatedPhase === 'reintroduction' ? 'Reintroduction Phase'
    : profile?.program_phase === 'pending_review' ? 'Awaiting Approval'
    : 'Setup in progress'

  const highFoods = labResult?.foods?.filter(f => f.level === 'High') || []
  const moderateFoods = labResult?.foods?.filter(f => f.level === 'Moderate') || []
  const showAvoidingList = labResult?.foods && labResult.status !== 'pending_review'

  if (screen === 'intake') return <IntakeSurvey session={session} onBack={() => setScreen('dashboard')} onComplete={() => setScreen('dashboard')} />
  if (screen === 'labresults') return <LabResults session={session} onBack={() => setScreen('dashboard')} onComplete={() => setScreen('dashboard')} />
  if (screen === 'checkin') return <WeeklyCheckin session={session} weekNumber={currentWeek || 1} profile={profile} currentFoods={labResult?.foods?.map(f => f.name) || []} phase={calculatedPhase || 'elimination'} onBack={() => setScreen('checkin-history')} onComplete={() => { setWeeklyDue(false); setScreen('checkin-history') }} />
  if (screen === 'slipup') return <SlipupSurvey session={session} profile={profile} labResult={labResult} currentDay={currentDay} onBack={() => setScreen('dashboard')} onComplete={() => setScreen('dashboard')} />
  if (screen === 'audit') return <ComplianceAudit session={session} eliminatedFoods={labResult?.foods?.map(f => f.name) || []} onBack={() => setScreen('dashboard')} onComplete={() => setScreen('dashboard')} />
  if (screen === 'reintro-survey') return <ReintroductionSurvey session={session} food={profile?.current_reintro_food || 'Eggs'} cycleNumber={profile?.reintro_cycle || 1} baselineScores={{ bloating: profile?.baseline_bloating, energy: profile?.baseline_energy }} symptoms={profile?.symptoms || []} onBack={() => setScreen('dashboard')} onComplete={() => setScreen('dashboard')} />

  return (
    <div className="snfy-app">
      <style>{css}</style>

      <nav className="snfy-nav">
        <div className="snfy-logo">sensi<em>fy</em></div>
        <div className="snfy-nav-tabs">
          {['Home', 'Reintro', 'History', 'Food Map'].map(t => (
            <button key={t} className={`snfy-tab${tab === t.toLowerCase().replace(' ', '-') ? ' active' : ''}`} onClick={() => { setTab(t.toLowerCase().replace(' ', '-')); if (t === 'History') setScreen('checkin-history'); else if (t === 'Food Map') setScreen('food-map'); else if (t === 'Reintro') setScreen('reintro-tab'); else setScreen('dashboard') }}>{t}</button>
          ))}
        </div>
        <div className="snfy-nav-right">
          <div className="snfy-phase-pill">{phaseLabel}</div>
          {isAdmin && <button className="snfy-signout" onClick={onAdmin} style={{ color: '#3D5C3C', fontWeight: 500 }}>Admin</button>}
          <button className="snfy-signout" onClick={onLogout}>Sign out</button>
        </div>
      </nav>

      {screen === 'checkin-history' ? (
        <CheckinHistory
          session={session}
          profile={profile}
          weeklyDue={weeklyDue}
          onStartCheckin={() => setScreen('checkin')}
        />
      ) : screen === 'food-map' ? (
        <FoodMap
          session={session}
          profile={profile}
          labResult={labResult}
        />
      ) : screen === 'reintro-tab' ? (
        <ReintroTab
          session={session}
          profile={profile}
          labResult={labResult}
          currentDay={currentDay}
          onStartVerdictSurvey={(food) => {
            setScreen('reintro-survey')
          }}
        />
      ) : loading ? (
        <div className="snfy-loading">Loading your program...</div>
      ) : (
        <div className="snfy-layout">

          {/* LEFT COLUMN */}
          <div>
            <div className="snfy-greeting">
              <h1>{getGreeting()},<br /><em>{name}.</em></h1>
              <p>
                {showIntakeCard ? "Welcome to Sensify. Let's get you set up."
                  : showAuditCard ? "Let's talk about the last few days."
                  : showSlipupCard ? "We logged a slip-up today. Tell us what happened."
                  : showLabCard ? 'Your intake is complete. Upload your lab results to begin.'
                  : showPendingLabCard ? 'Your results are under review.'
                  : "You're making real progress. Keep going."}
              </p>
            </div>

            {/* MILESTONE MESSAGE */}
            {milestoneMessage && (
              <div className="snfy-action" style={{ background: '#1C1C1C', borderColor: '#1C1C1C', color: 'white', position: 'relative' }}>
                <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.7px', color: 'rgba(255,255,255,0.5)', marginBottom: '10px' }}>
                  {milestoneKey === 'day1' ? 'Day 1' : milestoneKey === 'day3' ? 'Day 3' : milestoneKey === 'day14' ? '2 week milestone' : milestoneKey === 'day28' ? 'One month in' : milestoneKey === 'day57' ? 'Reintroduction unlocked' : milestoneKey === 'day113' ? 'Moderate tier unlocked' : milestoneKey === 'day169' ? 'Final tier unlocked' : 'Milestone'}
                </div>
                <p style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.75, marginBottom: 0, fontSize: '14px' }}>{milestoneMessage}</p>
                <button
                  onClick={() => setMilestoneMessage(null)}
                  style={{ position: 'absolute', top: '14px', right: '14px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '18px', lineHeight: 1, fontFamily: 'DM Sans, sans-serif' }}
                >×</button>
              </div>
            )}

            {showIntakeCard && (
              <div className="snfy-action">
                <div className="snfy-action-tag">Complete your setup</div>
                <h2>Start your <em>intake survey.</em></h2>
                <p>Tell us about your symptoms and how often you eat certain foods. Takes about 5 minutes.</p>
                <button className="snfy-btn" onClick={() => setScreen('intake')}>Start intake survey →</button>
              </div>
            )}

            {showLabCard && (
              <div className="snfy-action">
                <div className="snfy-action-tag">Action needed</div>
                <h2>Upload your <em>lab results.</em></h2>
                <p>PDF, photo, or manual entry — the AI reads your results and builds your elimination list in seconds.</p>
                <button className="snfy-btn" onClick={() => setScreen('labresults')}>Upload results →</button>
              </div>
            )}

            {showPendingLabCard && (
              <div className="snfy-pending">
                <div className="snfy-pending-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '2px' }}>Results under review</div>
                  <div style={{ fontSize: '12px', color: '#7A7A72' }}>We'll notify you within 24 hours once approved.</div>
                </div>
              </div>
            )}

            {showAuditCard && (
              <div className="snfy-action amber">
                <div className="snfy-action-tag amber">3 days off plan</div>
                <h2>Let's <em className="amber">figure this out together.</em></h2>
                <p>Three days in a row is hard. Let's treat it as information, not failure. Takes about 3 minutes.</p>
                <button className="snfy-btn amber" onClick={() => setScreen('audit')}>Let's talk →</button>
              </div>
            )}

            {pendingAudit && (
              <div className="snfy-audit-pending">
                <div className="snfy-audit-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3D5C3C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '2px' }}>Guidance being prepared</div>
                  <div style={{ fontSize: '12px', color: '#7A7A72' }}>Your personalized guidance will be ready within 24 hours.</div>
                </div>
              </div>
            )}

            {showSlipupCard && (
              <div className="snfy-action red">
                <div className="snfy-action-tag red">Slip-up logged today</div>
                <h2>What <em className="red">happened today?</em></h2>
                <p>Takes 60 seconds. No judgment — just data that makes your AI insights more accurate.</p>
                <button className="snfy-btn red" onClick={() => setScreen('slipup')}>Tell us what happened →</button>
              </div>
            )}

            {showCheckinCard && (
              <div className="snfy-action">
                <div className="snfy-action-tag">Due now</div>
                <h2>Your weekly <em>check-in.</em></h2>
                <p>Takes 2 minutes. The AI uses your answers to generate this week's personalized insight.</p>
                <button className="snfy-btn" onClick={() => setScreen('checkin')}>Start check-in →</button>
              </div>
            )}

            {showReintroCard && (
              <div className="snfy-action">
                <div className="snfy-action-tag">Day 14 — verdict ready</div>
                <h2><em>{profile?.current_reintro_food}</em> reintroduction complete.</h2>
                <p>Complete your survey and get your AI verdict — Safe, Limit, or Avoid.</p>
                <button className="snfy-btn" onClick={() => setScreen('reintro-survey')}>Get my verdict →</button>
              </div>
            )}

            <div className="snfy-phase">
              <div className="snfy-phase-meta">
                <span>Your program</span>
                <small>{profile?.protocol_start_date ? `Day ${currentDay} of 56` : '—'}</small>
              </div>
              <h3>{phaseFull}</h3>
              <div className="snfy-pbar">
                <div className="snfy-pfill" style={{ width: `${eliminationProgressPct}%` }}></div>
              </div>
              <div className="snfy-plabel">
                <span>
                  {profile?.protocol_start_date
                    ? calculatedPhase === 'elimination'
                      ? `Week ${currentWeek} of 8`
                      : 'Reintroduction phase active'
                    : 'Complete setup to begin'}
                </span>
                <span>
                  {daysUntilReintro !== null && daysUntilReintro > 0
                    ? `Reintro unlocks in ${daysUntilReintro} day${daysUntilReintro !== 1 ? 's' : ''}`
                    : '6 months total'}
                </span>
              </div>
            </div>

            <DailyComplianceDisplay complianceData={complianceData} cleanDays={cleanDays} />
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ marginTop: 0 }}>
            {/* ALWAYS-VISIBLE AVOIDING LIST */}
            <div className="snfy-sec-label" style={{ marginTop: '55px' }}>Currently avoiding</div>
            <div className="snfy-avoiding">
              {showAvoidingList && (highFoods.length > 0 || moderateFoods.length > 0) ? (
                <div className="snfy-avoid-scroll">
                  {highFoods.length > 0 && (
                    <>
                      <div className="snfy-avoid-group">High sensitivity</div>
                      {highFoods.map((food, i) => (
                        <div key={i} className="snfy-avoid-item">
                          <div className="snfy-avoid-left">
                            <div className="snfy-avoid-dot" style={{ background: '#C95B5B' }}></div>
                            {food.name}
                          </div>
                          <div className="snfy-badge high">High</div>
                        </div>
                      ))}
                    </>
                  )}
                  {moderateFoods.length > 0 && (
                    <>
                      <div className="snfy-avoid-group">Moderate sensitivity</div>
                      {moderateFoods.map((food, i) => (
                        <div key={i} className="snfy-avoid-item">
                          <div className="snfy-avoid-left">
                            <div className="snfy-avoid-dot" style={{ background: '#D4894A' }}></div>
                            {food.name}
                          </div>
                          <div className="snfy-badge moderate">Moderate</div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              ) : (
                <div style={{ padding: '28px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#1C1C1C', marginBottom: '6px' }}>No foods yet</div>
                  <div style={{ fontSize: '12px', color: '#7A7A72', lineHeight: 1.65 }}>
                    {!labResult
                      ? 'Your elimination list will appear here once your lab results are uploaded and approved.'
                      : labResult.status === 'pending_review'
                      ? 'Your lab results are under review. Your elimination list will appear here once approved.'
                      : 'No foods flagged on your elimination list.'}
                  </div>
                </div>
              )}
            </div>

            {/* AI INSIGHT */}
            <div className="snfy-insight">
              <div className="snfy-insight-tag">{profile?.latest_insight ? `AI insight — week ${profile?.latest_insight_week || 1}` : 'Getting started'}</div>
              <p>
                {profile?.latest_insight || 'Once you complete your setup and upload your lab results, the AI will start tracking your symptoms and generating personalized weekly insights here.'}
              </p>
            </div>

            {/* BASELINE STAT CARDS — replaced with interactive symptom graph */}
            <SymptomGraph profile={profile} checkins={checkins} activeMetric={activeGraphMetric} setActiveMetric={setActiveGraphMetric} />
          </div>

        </div>
      )}

      {/* CONFETTI OVERLAY */}
      {showConfetti && <ConfettiOverlay />}
    </div>
  )
}
