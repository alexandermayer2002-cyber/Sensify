import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import LabResults from './LabResults'
import IntakeSurvey from './IntakeSurvey'
import WeeklyCheckin from './WeeklyCheckin'
import ReintroductionSurvey from './ReintroductionSurvey'
import SlipupSurvey from './SlipupSurvey'
import ComplianceAudit from './ComplianceAudit'
import CheckinHistory from './CheckinHistory'
import FoodMap from './FoodMap'
import ReintroTab from './ReintroTab'
import AskSensify from './AskSensify'
import MaintainHub from './MaintainHub'
import { protocolDay } from '../utils/protocolDay'
import { getProtocolFoods } from '../utils/protocolEngine'
import { todayLocal, localDateString, localDateOffset } from '../utils/dateUtils'
import Support from './Support'
import CommonTrackDecision from './CommonTrackDecision'
import TrackingLanding from './TrackingLanding'
import DailyCheckin from './DailyCheckin'
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

  .snfy-app { min-height: 100vh; background: #F6F3EC; color: #1C1C1C; font-family: 'DM Sans', sans-serif; }

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
  .snfy-msg-btn { position: relative; width: 38px; height: 38px; border-radius: 10px; border: 1px solid rgba(0,0,0,0.08); background: white; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .snfy-msg-btn:hover { background: #F2F5EF; }
  .snfy-msg-icon { font-size: 16px; color: #3D5C3C; }
  .snfy-msg-badge { position: absolute; top: -6px; right: -6px; min-width: 18px; height: 18px; border-radius: 9px; background: #D64545; color: white; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; padding: 0 5px; font-family: 'DM Sans', sans-serif; }
  .snfy-logo em { color: #3D5C3C; font-style: italic; }
  .snfy-nav-tabs { display: flex; gap: 2px; }
  .snfy-tab { font-size: 13px; font-weight: 400; color: #7A7A72; padding: 6px 12px; border: none; background: none; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: color 0.15s; letter-spacing: -0.1px; border-bottom: 2px solid transparent; }
  .snfy-tab.active { color: #1C1C1C; font-weight: 500; border-bottom: 2px solid #3D5C3C; }
  .snfy-tab:hover:not(.active) { color: #1C1C1C; }
  @media (max-width: 600px) {
    .snfy-nav { padding: 0 14px; gap: 6px; }
    .snfy-logo { font-size: 18px; flex-shrink: 0; }
    .snfy-nav-tabs { overflow-x: auto; -webkit-overflow-scrolling: touch; flex: 1; scrollbar-width: none; }
    .snfy-nav-tabs::-webkit-scrollbar { display: none; }
    .snfy-tab { font-size: 12px; padding: 6px 8px; white-space: nowrap; flex-shrink: 0; }
    .snfy-phase-pill { display: none; }
    .snfy-nav-right { gap: 6px; flex-shrink: 0; }
    .snfy-signout { font-size: 11px; }
    .snfy-stats { gap: 7px; }
    .snfy-stat { padding: 11px; }
    .snfy-stat-val { font-size: 23px; }
  }
  .snfy-nav-right { display: flex; align-items: center; gap: 10px; }
  .snfy-phase-pill { font-size: 11.5px; color: #3D5C3C; background: #EDF3ED; padding: 4px 12px; border-radius: 20px; font-weight: 500; border: 1px solid rgba(61,92,60,0.15); }
  .snfy-signout { font-size: 12px; color: #7A7A72; background: none; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; }
  .snfy-signout:hover { color: #1C1C1C; }

  .snfy-layout { padding: 24px 20px 40px; max-width: 960px; margin: 0 auto; display: flex; flex-direction: column; gap: 14px; }
  .snfy-layout > div { display: contents; }
  .snfy-avoiding { order: 1; }
  .snfy-guide-slot { order: 2; }
  .snfy-insight { order: 3; }
  .snfy-weekly-card { order: 4; }
  .snfy-comp { order: 5; }
  .snfy-trends { order: 6; }
  .snfy-layout .snfy-action, .snfy-layout .snfy-greeting, .snfy-layout .snfy-phase { order: -1; }
  @media (min-width: 680px) {
    .snfy-layout { display: grid; grid-template-columns: 1.45fr 1fr; gap: 18px; padding: 24px 28px 48px; align-items: start; }
    .snfy-layout > div { display: block; }
  }

  /* Greeting */
  .snfy-greeting { margin-bottom: 16px; }
  .snfy-greeting h1 { font-family: 'Fraunces', serif; font-size: 28px; font-weight: 300; line-height: 1.2; margin-bottom: 5px; letter-spacing: -0.5px; }
  .snfy-greeting h1 em { font-style: italic; color: #3D5C3C; }
  .snfy-greeting p { font-size: 13px; color: #7A7A72; line-height: 1.55; }

  /* Dark protocol card */
  .snfy-phase { background: #22301F; border-radius: 22px; padding: 22px; color: white; margin-bottom: 14px; position: relative; overflow: hidden; box-shadow: 0 18px 44px rgba(34,48,31,0.28); }
  .snfy-phase-orb { position: absolute; top: -70px; right: -70px; width: 240px; height: 240px; border-radius: 50%; background: #8BAE8A; animation: snfyGlow 5s ease-in-out infinite; pointer-events: none; }
  .snfy-phase-orb2 { position: absolute; bottom: -90px; left: -60px; width: 200px; height: 200px; border-radius: 50%; background: #E8941F; opacity: 0.05; pointer-events: none; }
  @keyframes snfyGlow { 0%, 100% { opacity: 0.05; } 50% { opacity: 0.11; } }
  .snfy-phase::before { content: ''; position: absolute; top: -40px; right: -40px; width: 180px; height: 180px; background: radial-gradient(circle, rgba(139,174,138,0.15) 0%, transparent 70%); pointer-events: none; }
  .snfy-phase-eyebrow { font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.35); margin-bottom: 10px; }
  .snfy-phase-day { font-family: 'Fraunces', serif; font-size: 68px; font-weight: 300; line-height: 0.9; color: white; margin-bottom: 4px; }
  .snfy-phase-of { font-size: 14px; color: rgba(255,255,255,0.3); margin-bottom: 16px; }
  .snfy-pbar { background: rgba(255,255,255,0.08); border-radius: 2px; height: 2px; margin-bottom: 8px; }
  .snfy-pfill { height: 2px; background: #8BAE8A; border-radius: 2px; transition: width 0.6s ease; }
  .snfy-plabel { font-size: 11px; color: rgba(255,255,255,0.25); display: flex; justify-content: space-between; }
  .snfy-phase-streak { display: flex; align-items: center; gap: 8px; margin-top: 14px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.06); }
  .snfy-streak-dot { width: 7px; height: 7px; border-radius: 50%; background: #8BAE8A; flex-shrink: 0; }
  .snfy-streak-text { font-size: 12px; color: rgba(255,255,255,0.4); }
  .snfy-streak-num { font-weight: 500; color: #8BAE8A; }

  /* Action cards */
  .snfy-action { background: #FFFFFF; border-radius: 16px; padding: 20px; margin-bottom: 14px; border: 1px solid rgba(61,92,60,0.2); }
  .snfy-action.amber { border-color: rgba(212,137,74,0.3); }
  .snfy-action.red { border-color: rgba(201,91,91,0.25); }
  .snfy-action.neutral { border-color: rgba(0,0,0,0.07); }
  .snfy-action-tag { display: inline-flex; align-items: center; gap: 6px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; color: #3D5C3C; background: #EDF3ED; padding: 4px 10px; border-radius: 20px; margin-bottom: 12px; }
  .snfy-action-tag.amber { color: #D4894A; background: #FDF2EA; }
  .snfy-action-tag.red { color: #C95B5B; background: #FAEAEA; }
  .snfy-action-dot { width: 5px; height: 5px; border-radius: 50%; background: #3D5C3C; animation: snfy-pulse 2s infinite; }
  @keyframes snfy-pulse { 0%,100%{opacity:1;}50%{opacity:0.3;} }
  .snfy-action h2 { font-family: 'Fraunces', serif; font-size: 19px; font-weight: 300; margin-bottom: 6px; line-height: 1.3; letter-spacing: -0.3px; }
  .snfy-action h2 em { font-style: italic; color: #3D5C3C; }
  .snfy-action h2 em.amber { color: #D4894A; }
  .snfy-action h2 em.red { color: #C95B5B; }
  .snfy-action p { font-size: 13px; color: #7A7A72; line-height: 1.65; margin-bottom: 14px; }
  .snfy-btn { background: #3D5C3C; color: white; border: none; border-radius: 9px; padding: 11px 20px; font-size: 13px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: opacity 0.15s; }
  .snfy-btn:hover { opacity: 0.87; }
  .snfy-btn.amber { background: #D4894A; }
  .snfy-btn.red { background: #C95B5B; }

  /* Stat cards — 3 column */
  .snfy-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-bottom: 14px; }
  .snfy-stat { background: #FFFFFF; border: 1px solid rgba(0,0,0,0.07); border-radius: 12px; padding: 14px; }
  .snfy-stat-label { font-size: 10px; color: #7A7A72; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
  .snfy-stat-val { font-family: 'Fraunces', serif; font-size: 28px; font-weight: 300; line-height: 1; margin-bottom: 3px; }
  .snfy-stat-change { font-size: 10px; font-weight: 500; margin-top: 3px; color: #4A8C6A; }

  /* Compliance dots */
  .snfy-comp { background: #FFFFFF; border: 1px solid rgba(0,0,0,0.07); border-radius: 18px; padding: 20px; margin-bottom: 0; }
  .snfy-comp-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .snfy-comp-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; color: #7A7A72; margin-bottom: 4px; }
  .snfy-comp-count { font-family: 'Fraunces', serif; font-size: 26px; font-weight: 300; line-height: 1; color: #1C1C1C; }
  .snfy-comp-count em { font-style: normal; color: #7A7A72; font-size: 16px; }
  .snfy-comp-streak-wrap { text-align: right; }
  .snfy-comp-streak-num { font-family: 'Fraunces', serif; font-size: 26px; font-weight: 300; line-height: 1; color: #3D5C3C; }
  .snfy-comp-streak-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; color: #7A7A72; margin-top: 4px; }
  .snfy-comp-dots { display: flex; gap: 7px; }
  .snfy-dot { flex: 1; aspect-ratio: 1 / 1.15; border-radius: 11px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; transition: transform 0.15s; }
  .snfy-dot.yes { background: #4A8C6A; }
  .snfy-dot.no { background: #C95B5B; }
  .snfy-dot.empty { background: #F4F2EC; border: 1px solid rgba(0,0,0,0.05); }
  .snfy-dot.future { background: #FAF8F4; border: 1px dashed rgba(0,0,0,0.1); }
  .snfy-dot.missed { background: #DDDAD1; border: 1px solid #C9C6BC; }
  .snfy-dot.logged { background: #C9D8C4; }
  .snfy-dot.logged .snfy-dot-day { color: #3D5C3C; }
  .snfy-dot.logged .snfy-dot-mark { color: #3D5C3C; }
  .snfy-dot.today { box-shadow: 0 0 0 2px #3D5C3C; }
  .snfy-dot-day { font-size: 9px; font-weight: 700; letter-spacing: 0.3px; }
  .snfy-dot.yes .snfy-dot-day, .snfy-dot.no .snfy-dot-day { color: rgba(255,255,255,0.85); }
  .snfy-dot.empty .snfy-dot-day, .snfy-dot.future .snfy-dot-day { color: #A8A69E; }
  .snfy-dot.missed .snfy-dot-day { color: #6A6A62; }
  .snfy-dot-mark { font-size: 14px; font-weight: 700; line-height: 1; }
  .snfy-dot.yes .snfy-dot-mark { color: white; }
  .snfy-dot.no .snfy-dot-mark { color: white; }
  .snfy-dot.empty .snfy-dot-mark { color: rgba(0,0,0,0.15); }
  .snfy-dot.future .snfy-dot-mark { color: rgba(0,0,0,0.12); }
  .snfy-dot.missed .snfy-dot-mark { color: #6A6A62; font-weight: 700; }

  /* Pending cards */
  .snfy-pending { background: #FDF2EA; border: 1px solid rgba(212,137,74,0.18); border-radius: 13px; padding: 14px; margin-bottom: 14px; display: flex; align-items: center; gap: 11px; }
  .snfy-pending-icon { width: 34px; height: 34px; background: #D4894A; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .snfy-audit-pending { background: #FAF8F4; border: 1px solid rgba(0,0,0,0.08); border-radius: 13px; padding: 14px; margin-bottom: 14px; display: flex; align-items: center; gap: 11px; }
  .snfy-audit-icon { width: 34px; height: 34px; background: #EDF3ED; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

  /* Right column */
  .snfy-sec-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; color: #7A7A72; margin-bottom: 9px; }

  /* Avoiding list — full categorized */
  .snfy-avoiding { background: #FFFFFF; border: 1px solid rgba(0,0,0,0.07); border-radius: 18px; padding: 20px; margin-bottom: 0; }
  .snfy-avoid-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .snfy-avoid-count { font-size: 11px; color: #A8A69E; }
  .snfy-avoid-bar { display: flex; gap: 2px; height: 8px; border-radius: 5px; overflow: hidden; margin-bottom: 20px; }
  .snfy-avoid-bar-seg { height: 8px; transition: flex 0.4s ease; }
  .snfy-avoid-group { margin-bottom: 18px; }
  .snfy-avoid-group:last-child { margin-bottom: 0; }
  .snfy-avoid-group-head { display: flex; align-items: center; gap: 8px; margin-bottom: 11px; }
  .snfy-avoid-level-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .snfy-avoid-level-name { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .snfy-avoid-level-count { font-size: 10px; color: #A8A69E; margin-left: auto; font-family: 'DM Mono', monospace; }
  .snfy-avoid-chips { display: flex; flex-wrap: wrap; gap: 7px; }
  .snfy-avoid-chip { font-size: 13px; padding: 7px 13px; border-radius: 10px; font-weight: 500; }

  /* Weekly insight — instrument style */
  .snfy-insight { background: linear-gradient(135deg, rgba(139,174,138,0.13), rgba(44,157,138,0.05)), #FFFFFF; border: 1px solid rgba(61,92,60,0.14); border-radius: 18px; padding: 18px 20px; margin-top: 16px; }
  .snfy-weekly-card { margin-top: 14px; }
  .snfy-weekly-card > div { border-radius: 18px !important; padding: 15px 18px !important; margin-top: 0 !important; }
  .snfy-trends { margin-top: 14px; }
  .snfy-trends > div { border-radius: 18px !important; margin-top: 0 !important; }
  .snfy-insight-head { display: flex; align-items: center; gap: 7px; margin-bottom: 9px; }
  .snfy-insight-dot { width: 6px; height: 6px; border-radius: 50%; background: #2C9D8A; animation: snfyPulse 1.6s infinite; flex-shrink: 0; }
  .snfy-insight-tag { font-family: 'DM Mono', monospace; font-size: 9px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.8px; color: #3D5C3C; }
  .snfy-insight p { font-size: 13.5px; line-height: 1.7; color: #1C1C1C; }
  .snfy-insight-foot { font-family: 'DM Mono', monospace; font-size: 8.5px; letter-spacing: 0.6px; color: #A8A69E; text-transform: uppercase; margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(0,0,0,0.05); }
  @keyframes snfyPulse { 0%, 100% { opacity: 0.35; } 50% { opacity: 1; } }

  .snfy-loading { display: flex; align-items: center; justify-content: center; min-height: 60vh; font-size: 14px; color: #7A7A72; }
`

const BADGE = {
  High: { bg: '#FBE9E9', color: '#A32D2D', dot: '#D64545', cls: 'high' },
  Moderate: { bg: '#FCEFD9', color: '#8A5410', dot: '#E8941F', cls: 'moderate' },
  Low: { bg: '#DEF2EE', color: '#1A6256', dot: '#2C9D8A', cls: 'low' },
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

function YourNumbers({ profile, weekFactors }) {
  const [cat, setCat] = useState('sleep')
  const STRESS_SCALE = { low: 1, mild: 2, moderate: 3, high: 4, severe: 5 }
  const STRESS_NAMES = ['', 'Low', 'Mild', 'Moderate', 'High', 'Severe']
  const CATS = {
    sleep: { label: 'Sleep', unit: 'hours', field: 'sleep', baseline: parseFloat(profile?.baseline_avg_sleep), higherIsBetter: true, decimals: 1 },
    hydration: { label: 'Water', unit: 'cups', field: 'hydration', baseline: parseFloat(profile?.baseline_avg_hydration), higherIsBetter: true, decimals: 1 },
    stress: { label: 'Stress', unit: '', field: 'stress', baseline: STRESS_SCALE[profile?.baseline_avg_stress], higherIsBetter: false, decimals: 1, ordinal: true },
    drinks: { label: 'Alcohol', unit: 'drinks / week', field: 'drinks', baseline: parseFloat(profile?.baseline_avg_drinks_week), higherIsBetter: false, decimals: 1, weeklyTotal: true },
  }
  const cfg = CATS[cat]
  const nums = (rows) => rows.map(r => cfg.ordinal ? STRESS_SCALE[r[cfg.field]] : parseFloat(r[cfg.field])).filter(n => n != null && !isNaN(n))
  const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null
  const today = new Date(); today.setHours(0,0,0,0)
  const wk = (weekFactors || []).filter(r => {
    const [y, m, d] = r.log_date.split('-').map(Number)
    return (today - new Date(y, m - 1, d)) / 86400000 <= 6
  })
  let weekAvg = avg(nums(wk))
  let protoAvg = avg(nums(weekFactors || []))
  if (cfg.weeklyTotal) {
    const wkVals = nums(wk)
    weekAvg = wkVals.length ? wkVals.reduce((a, b) => a + b, 0) : null
    const allVals = nums(weekFactors || [])
    const weeks = Math.max(1, Math.ceil((weekFactors || []).length / 7))
    protoAvg = allVals.length ? allVals.reduce((a, b) => a + b, 0) / weeks : null
  }
  const baseline = isNaN(cfg.baseline) ? null : cfg.baseline
  const bars = [
    { label: 'Baseline', sub: 'from intake', v: baseline, color: '#E0DED6', tcolor: '#7A7A72' },
    { label: 'This week', sub: `${wk.length} check-in${wk.length !== 1 ? 's' : ''}`, v: weekAvg, color: '#8BAE8A', tcolor: '#3D5C3C' },
    { label: 'Protocol', sub: `${(weekFactors || []).length} days`, v: protoAvg, color: '#3D5C3C', tcolor: '#3D5C3C' },
  ]
  const present = bars.filter(b => b.v != null)
  if (present.length < 2) return null
  const max = Math.max(...present.map(b => b.v), 1)
  const ref = weekAvg != null ? weekAvg : protoAvg
  const delta = baseline != null && ref != null ? ref - baseline : null
  const improving = delta != null && (cfg.higherIsBetter ? delta >= 0 : delta <= 0)
  const fmt = (v) => {
    if (v == null) return '—'
    if (cfg.ordinal) return STRESS_NAMES[Math.min(5, Math.max(1, Math.round(v)))]
    return (Math.round(v * 10) / 10).toFixed(cfg.decimals).replace(/\.0$/, '')
  }
  return (
    <div className="snfy-card" style={{ marginTop: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1C1C1C' }}>Your numbers</div>
        <select value={cat} onChange={e => setCat(e.target.value)} style={{ background: '#F4F2EC', border: 'none', borderRadius: 10, padding: '7px 11px', fontSize: 12, color: '#1C1C1C', fontFamily: 'DM Sans, sans-serif', cursor: 'pointer', outline: 'none' }}>
          {Object.entries(CATS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, height: 108, padding: '0 6px', marginBottom: 6 }}>
        {bars.map(b => (
          <div key={b.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, height: '100%', justifyContent: 'flex-end' }}>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: 14, color: b.v == null ? '#C8C6BE' : b.tcolor }}>{fmt(b.v)}</div>
            <div style={{ width: '100%', maxWidth: 50, height: b.v == null ? 3 : `${Math.max((b.v / max) * 78, 5)}%`, background: b.v == null ? '#EFEDE6' : b.color, borderRadius: '8px 8px 3px 3px' }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 20, padding: '0 6px', marginBottom: 12 }}>
        {bars.map(b => (
          <div key={b.label} style={{ flex: 1, textAlign: 'center', fontSize: 9.5, color: '#8A8A82', lineHeight: 1.4 }}>{b.label}<br /><span style={{ color: '#B8B6AE' }}>{b.sub}</span></div>
        ))}
      </div>
      {delta != null && Math.abs(delta) >= 0.05 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: improving ? '#EDF3ED' : '#FDF2EA', borderRadius: 10, padding: '9px 12px' }}>
          <span style={{ fontSize: 13, color: improving ? '#3D5C3C' : '#8A5410' }}>{delta >= 0 ? '↑' : '↓'}</span>
          <span style={{ fontSize: 11.5, color: improving ? '#3D5C3C' : '#8A5410', lineHeight: 1.5 }}>
            <strong>{cfg.ordinal ? `${fmt(ref)} this week vs ${fmt(baseline)} baseline.` : `${delta >= 0 ? '+' : '−'}${fmt(Math.abs(delta))} ${cfg.unit} vs baseline.`}</strong> {improving ? (cfg.higherIsBetter ? `More ${cfg.label.toLowerCase()} is exactly the right direction.` : cfg.ordinal ? 'Calmer than your baseline. Good.' : 'Lower is the right direction here.') : 'Worth keeping an eye on.'}
          </span>
        </div>
      )}
    </div>
  )
}

function SymptomGraph({ profile, checkins, activeMetric, setActiveMetric }) {
  const [trendLens, setTrendLens] = React.useState('average')
  const [phaseLens, setPhaseLens] = React.useState('all')
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
  let points = [{ week: 0, val: metric.baseline, label: 'Baseline' }]
  sortedCheckins.forEach((c, i) => {
    if (c.answers?.[metric.id] !== undefined) {
      points.push({ week: c.week_number || i + 1, val: c.answers[metric.id], label: `Week ${c.week_number || i + 1}`, reintro: c.answers?._phase === 'reintroduction' || (c.week_number || i + 1) > 8, exposure: c.answers?._cycle?.phase === 'exposure', cycleFood: c.answers?._cycle?.food || null })
    }
  })

  const allPoints = points
  if (phaseLens === 'elimination') points = points.filter(p => !p.reintro)
  else if (phaseLens === 'reintroduction') points = points.filter(p => p.reintro || p.week === 0)

  const latest = points[points.length - 1]
  // Values from actual check-ins (exclude the baseline point at index 0)
  const checkinVals = points.slice(1).map(p => p.val)
  const avgVal = checkinVals.length ? checkinVals.reduce((a, b) => a + b, 0) / checkinVals.length : (latest?.val ?? metric.baseline)
  const usedVal = trendLens === 'average' ? avgVal : (latest?.val ?? metric.baseline)
  const change = metric.baseline
    ? Math.round(((usedVal - metric.baseline) / metric.baseline) * 100)
    : 0
  const improved = metric.lowerIsBetter ? change < 0 : change > 0
  const changeLabel = change === 0 ? 'No change'
    : `${change > 0 ? '+' : ''}${change}% ${trendLens === 'average' ? 'avg' : 'latest'}`

  // SVG graph
  const W = 240, H = 90
  const padL = 20, padR = 10, padT = 10, padB = 20
  const gW = W - padL - padR
  const gH = H - padT - padB
  const maxVal = 10, minVal = 0

  const toX = (i) => padL + (i / Math.max(points.length - 1, 1)) * gW
  const toY = (v) => padT + gH - ((v - minVal) / (maxVal - minVal)) * gH

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(p.val)}`).join(' ')
  // Reintro divider: where the story changes chapters (only meaningful in 'all' view)
  const firstReintroIdx = phaseLens === 'all' ? points.findIndex(p => p.reintro) : -1
  const areaD = points.length > 0
    ? `${pathD} L ${toX(points.length - 1)} ${H - padB} L ${toX(0)} ${H - padB} Z`
    : ''

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '14px', padding: '18px', marginTop: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#7A7A72' }}>Symptom trends</div>
        <div style={{ fontSize: '11px', fontWeight: 500, color: improved ? '#4A8C6A' : change === 0 ? '#7A7A72' : '#C95B5B' }}>{changeLabel} vs baseline</div>
      </div>
      {checkinVals.length >= 2 && (<>
        <div style={{ display: 'flex', gap: '4px', background: '#F0EEE7', borderRadius: '8px', padding: '3px', marginBottom: '6px' }}>
          <button onClick={() => setTrendLens('week')} style={{ flex: 1, textAlign: 'center', fontSize: '11.5px', fontWeight: trendLens === 'week' ? 600 : 400, color: trendLens === 'week' ? '#1C1C1C' : '#8A8A82', background: trendLens === 'week' ? '#fff' : 'transparent', padding: '5px 0', borderRadius: '6px', border: 'none', cursor: 'pointer', boxShadow: trendLens === 'week' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' }}>Latest week</button>
          <button onClick={() => setTrendLens('average')} style={{ flex: 1, textAlign: 'center', fontSize: '11.5px', fontWeight: trendLens === 'average' ? 600 : 400, color: trendLens === 'average' ? '#1C1C1C' : '#8A8A82', background: trendLens === 'average' ? '#fff' : 'transparent', padding: '5px 0', borderRadius: '6px', border: 'none', cursor: 'pointer', boxShadow: trendLens === 'average' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' }}>Overall average</button>
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 6, marginBottom: 4 }}>
          {[['all', 'Both phases'], ['elimination', 'Elimination'], ['reintroduction', 'Reintro']].map(([key, label]) => (
            <button key={key} onClick={() => setPhaseLens(key)} style={{ flex: 1, textAlign: 'center', fontSize: '10.5px', fontWeight: phaseLens === key ? 600 : 400, color: phaseLens === key ? '#1C1C1C' : '#8A8A82', background: phaseLens === key ? '#fff' : 'transparent', padding: '4px 0', borderRadius: '6px', border: phaseLens === key ? '1px solid rgba(0,0,0,0.07)' : '1px solid transparent', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>{label}</button>
          ))}
        </div>
      </>)}

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
        {firstReintroIdx > 0 && (<>
          <line x1={toX(firstReintroIdx)} y1={padT} x2={toX(firstReintroIdx)} y2={H - padB} stroke="#D4894A" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />
          <text x={toX(firstReintroIdx) + 3} y={padT + 7} fontSize="6" fill="#D4894A" fontFamily="DM Mono, monospace" letterSpacing="0.5">REINTRO</text>
        </>)}

        {/* Points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={toX(i)} cy={toY(p.val)} r="4" fill="white" stroke={p.exposure ? '#D4894A' : metric.color} strokeWidth="2">{p.cycleFood && <title>{`${p.cycleFood} ${p.exposure ? 'exposure' : 'washout'} week`}</title>}</circle>
            {p.exposure && <circle cx={toX(i)} cy={toY(p.val)} r="7" fill="none" stroke="#D4894A" strokeWidth="1" opacity="0.5" />}
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

// ============================================================
// WeekFactorCards — expandable summary cards for daily factors.
// Collapsed: icon + name + "norm X · this week Y". Tap → accordion
// opens: Your norm vs This week, then a 7-day bar chart (M–S).
// Bar height = the band they reported. Missed days show a dash.
// Purely descriptive (their own logs mirrored back); causal
// interpretation stays gated behind Layer 2 / physician sign-off.
// ============================================================
const FACTOR_DEFS = {
  sleep: {
    name: 'Sleep',
    numeric: true, unit: 'hrs', scaleMax: 10,
    bands: ['under6', '6-7', '7-8', '8plus'],
    labels: { under6: 'Under 6 hrs', '6-7': '6\u20137 hrs', '7-8': '7\u20138 hrs', '8plus': '8+ hrs' },
    colors: ['#C9D8C4', '#9FBE9A', '#6E9A6B', '#3D5C3C'],
    normField: 'baseline_avg_sleep',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3D5C3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  },
  stress: {
    name: 'Stress',
    bands: ['low', 'mild', 'moderate', 'high', 'severe'],
    labels: { low: 'Low', mild: 'Mild', moderate: 'Moderate', high: 'High', severe: 'Severe' },
    colors: ['#DCE7D8', '#E4DFCB', '#EED9A8', '#E8B36B', '#D98A4A'],
    normField: 'baseline_avg_stress',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3D5C3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  },
  hydration: {
    name: 'Water',
    numeric: true, unit: 'cups', scaleMax: 12,
    bands: ['under3', '3-5', '6-8', '8plus'],
    labels: { under3: 'Under 3 glasses', '3-5': '3\u20135 glasses', '6-8': '6\u20138 glasses', '8plus': '8+ glasses' },
    colors: ['#C9D8C4', '#9FBE9A', '#6E9A6B', '#3D5C3C'],
    normField: 'baseline_avg_hydration',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3D5C3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>,
  },
  drinks: {
    name: 'Alcohol',
    numeric: true, unit: '/ week',
    bands: [],
    labels: { '1-3': '1\u20133 / week', '4-7': '4\u20137 / week', '8-14': '8\u201314 / week', '15plus': '15+ / week' },
    colors: [],
    normField: 'baseline_avg_drinks_week',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3D5C3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 22h8"/><path d="M12 11v11"/><path d="m19 3-7 8-7-8Z"/></svg>,
  },
}

function WeekFactorCards({ days, factors, profile }) {
  const [open, setOpen] = useState(null)
  if (!factors || factors.length === 0) return null
  const byDate = {}
  factors.forEach(f => { byDate[f.log_date] = f })

  const factorKeys = profile?.drinks_alcohol === true ? ['sleep', 'stress', 'hydration', 'drinks'] : ['sleep', 'stress', 'hydration']

  const numAvg = (vals) => vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
  const threeVals = (key) => {
    const def = FACTOR_DEFS[key]
    const intake = parseFloat(profile?.[def.normField])
    const weekVals = days.map(d => parseFloat(byDate[d.dateStr]?.[key])).filter(v => !isNaN(v))
    const protoVals = (factors || []).map(f => parseFloat(f[key])).filter(v => !isNaN(v))
    if (key === 'drinks') {
      const weeks = Math.max(1, Math.ceil((factors || []).length / 7))
      return {
        intake: isNaN(intake) ? null : intake,
        week: weekVals.length ? weekVals.reduce((a, b) => a + b, 0) : null,
        proto: protoVals.length ? protoVals.reduce((a, b) => a + b, 0) / weeks : null,
        weekN: weekVals.length, protoN: (factors || []).length,
      }
    }
    return {
      intake: isNaN(intake) ? null : intake,
      week: numAvg(weekVals), proto: numAvg(protoVals),
      weekN: weekVals.length, protoN: protoVals.length,
    }
  }
  const fmt1 = (v) => v == null ? '\u2014' : String(Math.round(v * 10) / 10)

  const weekAvgLabel = (key) => {
    const def = FACTOR_DEFS[key]
    if (key === 'drinks') {
      const vals = days.map(d => byDate[d.dateStr]?.drinks).filter(v => v != null)
      if (vals.length === 0) return null
      const total = vals.reduce((a, b) => a + b, 0)
      return `${total} total`
    }
    if (def.numeric) {
      const vals = days.map(d => parseFloat(byDate[d.dateStr]?.[key])).filter(v => !isNaN(v))
      if (vals.length === 0) return null
      const avg = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
      return `${String(avg)} ${def.unit}`
    }
    const idxs = days.map(d => byDate[d.dateStr]?.[key]).filter(v => v != null).map(v => (def.bands || []).indexOf(v)).filter(i => i >= 0)
    if (idxs.length === 0) return null
    const avg = Math.round(idxs.reduce((a, b) => a + b, 0) / idxs.length)
    return def.labels[def.bands[avg]]
  }

  return (
    <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 7 }}>
      {factorKeys.map(key => {
        const def = FACTOR_DEFS[key]
        const isOpen = open === key
        const rawNorm = profile?.[def.normField]
        const norm = def.numeric
          ? (rawNorm != null && !isNaN(parseFloat(rawNorm)) ? `${parseFloat(rawNorm)} ${def.unit}` : null)
          : ((def.labels || {})[rawNorm] || null)
        const weekAvg = weekAvgLabel(key)
        if (!weekAvg) return null
        return (
          <div key={key} onClick={() => setOpen(isOpen ? null : key)} style={{
            background: '#FAF8F4', borderRadius: 12, padding: '11px 13px', cursor: 'pointer',
            border: isOpen ? '1px solid rgba(61,92,60,0.18)' : '1px solid transparent',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                {def.icon}
                <span style={{ fontSize: 12.5, fontWeight: 500, color: '#1C1C1C' }}>{def.name}</span>
                {!isOpen && (
                  <span style={{ fontSize: 11.5, color: '#8A8A82', marginLeft: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {norm ? `norm ${norm.toLowerCase()} \u00b7 ` : ''}this week {weekAvg.toLowerCase()}
                  </span>
                )}
              </div>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#B0B0A8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', flexShrink: 0 }}><polyline points="6 9 12 15 18 9"/></svg>
            </div>
            {isOpen && (
              <>
                {def.numeric ? (() => {
                  const tv = threeVals(key)
                  const present = [tv.intake, tv.week, tv.proto].filter(v => v != null)
                  const max = Math.max(...present, 1)
                  const bars = [
                    { label: 'Intake', sub: 'your norm', v: tv.intake, color: '#E0DED6', tcolor: '#7A7A72' },
                    { label: 'This week', sub: `${tv.weekN} check-in${tv.weekN !== 1 ? 's' : ''}`, v: tv.week, color: '#8BAE8A', tcolor: '#3D5C3C' },
                    { label: 'Protocol', sub: `${tv.protoN} day${tv.protoN !== 1 ? 's' : ''}`, v: tv.proto, color: '#3D5C3C', tcolor: '#3D5C3C' },
                  ]
                  return (
                    <div style={{ marginTop: 11 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height: 84, padding: '0 6px' }}>
                        {bars.map(b => (
                          <div key={b.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                            <div style={{ fontFamily: 'Fraunces, serif', fontSize: 14, color: b.v == null ? '#C8C6BE' : b.tcolor }}>{fmt1(b.v)}</div>
                            <div style={{ width: '100%', maxWidth: 46, height: b.v == null ? 3 : `${Math.max((b.v / max) * 72, 6)}%`, background: b.v == null ? '#EFEDE6' : b.color, borderRadius: '7px 7px 3px 3px' }} />
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 14, padding: '0 6px', marginTop: 4 }}>
                        {bars.map(b => (
                          <div key={b.label} style={{ flex: 1, textAlign: 'center', fontSize: 8.5, color: '#8A8A82', lineHeight: 1.4 }}>{b.label}<br /><span style={{ color: '#B8B6AE' }}>{b.sub}</span></div>
                        ))}
                      </div>
                    </div>
                  )
                })() : (
                <div style={{ display: 'flex', gap: 20, marginTop: 9 }}>
                  {norm && (
                    <div>
                      <div style={{ fontSize: 9.5, color: '#A0A096', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'DM Mono, monospace' }}>Your norm</div>
                      <div style={{ fontSize: 13.5, fontWeight: 500, color: '#8A8A82', marginTop: 1 }}>{norm}</div>
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 9.5, color: '#A0A096', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'DM Mono, monospace' }}>This week</div>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: '#3D5C3C', marginTop: 1 }}>{weekAvg}{key === 'drinks' ? '' : ' avg'}</div>
                  </div>
                </div>
                )}
                <div style={{ marginTop: 11, paddingTop: 9, borderTop: '1px solid rgba(0,0,0,0.05)' }} onClick={e => e.stopPropagation()}>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 8, letterSpacing: '0.8px', color: '#A0A096', textTransform: 'uppercase', marginBottom: 7 }}>This week, day by day</div>
                  <div style={{ display: 'flex', gap: 7, alignItems: 'flex-end', height: 34 }}>
                    {days.map((d, i) => {
                      const val = byDate[d.dateStr]?.[key]
                      if (key === 'drinks') {
                        if (val == null) {
                          if (d.isFuture) return <div key={i} style={{ flex: 1 }} />
                          return (
                            <div key={i} style={{ flex: 1, display: 'flex', justifyContent: 'center' }} title={`${d.day} \u00b7 not logged`}>
                              <div style={{ width: 9, height: 2.5, borderRadius: 2, background: '#C9C6BC' }} />
                            </div>
                          )
                        }
                        const pct = val === 0 ? 12 : Math.min(100, Math.round((val / 5) * 100))
                        const color = val === 0 ? '#DCE7D8' : val <= 2 ? '#EED9A8' : val <= 4 ? '#E8B36B' : '#D98A4A'
                        return <div key={i} title={`${d.day} \u00b7 ${val} ${val === 1 ? 'drink' : 'drinks'}`} style={{ flex: 1, height: `${pct}%`, background: color, borderRadius: 4 }} />
                      }
                      if (def.numeric) {
                        const n = parseFloat(val)
                        if (!isNaN(n)) {
                          const pct = Math.max(10, Math.min(100, Math.round((n / (def.scaleMax || 10)) * 100)))
                          return <div key={i} title={`${d.day} · ${n} ${def.unit}`} style={{ flex: 1, height: `${pct}%`, background: '#6E9A6B', borderRadius: 4 }} />
                        }
                        if (d.isFuture) return <div key={i} style={{ flex: 1 }} />
                        return (
                          <div key={i} style={{ flex: 1, display: 'flex', justifyContent: 'center' }} title={`${d.day} · not logged`}>
                            <div style={{ width: 9, height: 2.5, borderRadius: 2, background: '#C9C6BC' }} />
                          </div>
                        )
                      }
                      const idx = val != null && def.bands ? def.bands.indexOf(val) : -1
                      if (idx >= 0) {
                        const pct = Math.round(((idx + 1) / def.bands.length) * 100)
                        return <div key={i} title={`${d.day} \u00b7 ${def.labels[val]}`} style={{ flex: 1, height: `${pct}%`, background: def.colors[idx], borderRadius: 4 }} />
                      }
                      if (d.isFuture) return <div key={i} style={{ flex: 1 }} />
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', justifyContent: 'center' }} title={`${d.day} \u00b7 not logged`}>
                          <div style={{ width: 9, height: 2.5, borderRadius: 2, background: '#C9C6BC' }} />
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: 7, marginTop: 4 }}>
                    {days.map((d, i) => (
                      <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 9.5, color: '#A8A69E' }}>{d.day}</div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function Dashboard({ session, onLogout, isAdmin, onAdmin }) {
  const [screen, setScreen] = useState('dashboard')
  const [tab, setTab] = useState('home')
  const [profile, setProfile] = useState(null)
  const [labResult, setLabResult] = useState(null)
  const [reintroRows, setReintroRows] = useState([])  // live reintro cycles for the projection

  useEffect(() => {
    if (!session?.user?.id) return
    // Reintro cycles feed the live completion projection: completed rows
    // leave the queue, the active row's started_at carries restarts.
    supabase.from('reintroduction_results')
      .select('food, sensitivity_level, verdict, started_at')
      .eq('user_id', session.user.id)
      .then(({ data }) => setReintroRows(data || []))
  }, [session?.user?.id])

  const [weeklyDue, setWeeklyDue] = useState(false)
  const [checkinLate, setCheckinLate] = useState(false)
  const [activeCheckinWeek, setActiveCheckinWeek] = useState(1)
  const [activeReintroId, setActiveReintroId] = useState(null)
  const [activeCycleLite, setActiveCycleLite] = useState(null)
  const [complianceData, setComplianceData] = useState([])
  const [weekFactors, setWeekFactors] = useState([])
  const [consecutiveNOs, setConsecutiveNOs] = useState(0)
  const [pendingAudit, setPendingAudit] = useState(false)
  const [dailyDone, setDailyDone] = useState(false)
  const [unreadMsgs, setUnreadMsgs] = useState(0)
  const [loading, setLoading] = useState(true)
  const [milestoneMessage, setMilestoneMessage] = useState(null)
  const [milestoneKey, setMilestoneKey] = useState(null)
  const [guideOpen, setGuideOpen] = useState(false)
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

      // Protocol track seam: the resolver decides which foods drive the protocol.
      // - flagged track  -> the real lab foods, untouched (zero change to today's flow)
      // - common track   -> the chosen tier's foods, injected as labResult.foods so
      //                     every downstream consumer (ReintroTab, compliance, checkins)
      //                     works unchanged without reading the track directly.
      // - declined       -> no protocol foods.
      // Only remap once the user has actively chosen (track_decision === 'active');
      // before that they're in the decision flow and shouldn't have a running protocol.
      let resolvedLab = l
      if (p?.protocol_track === 'common' && p?.track_decision === 'active') {
        const resolved = getProtocolFoods(p, l)
        resolvedLab = { ...(l || {}), foods: resolved.foods, status: 'approved' }
      }
      setLabResult(resolvedLab)

      // Has the user done today's daily check-in?
      try {
        const todayStr = todayLocal()
        const { data: df } = await supabase.from('daily_factors').select('id').eq('user_id', session.user.id).eq('log_date', todayStr).maybeSingle()
        setDailyDone(!!df)
      } catch (e) {}

      // Unread admin messages count (for the nav badge)
      try {
        const { count: umCount } = await supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('user_id', session.user.id).eq('unread_for_user', true)
        setUnreadMsgs(umCount || 0)
      } catch (e) {}

      const { data: c } = await supabase.from('weekly_checkins').select('*').eq('user_id', session.user.id).order('submitted_at', { ascending: false }).limit(8)
      if (c) setCheckins(c)

      // Active reintro cycle (verdict survey id + verdict-ready detection for the hero)
      {
        const { data: ar } = await supabase.from('reintroduction_results')
          .select('id, food, started_at, exposure_days_completed, washout_started_at')
          .eq('user_id', session.user.id).is('verdict', null)
          .order('started_at', { ascending: false }).limit(1).maybeSingle()
        setActiveReintroId(ar?.id || null)
        setActiveCycleLite(ar || null)
      }

      const { data: comp } = await supabase.from('daily_compliance').select('*').eq('user_id', session.user.id).gte('date', localDateOffset(-10)).order('date', { ascending: false })

      // Last-10-days factor logs for the "your week" strip (descriptive mirror only)
      try {
        const { data: wf } = await supabase.from('daily_factors')
          .select('log_date, sleep, stress, hydration, drinks')
          .eq('user_id', session.user.id)
          .gte('log_date', localDateOffset(-120))
        setWeekFactors(wf || [])
      } catch (e) {}

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
        const { data: c } = await supabase.from('weekly_checkins').select('submitted_at, answers, week_number').eq('user_id', session.user.id).order('submitted_at', { ascending: false }).limit(8)

        // Calculate check-in availability based on protocol_start_date
        const protocolStart = p?.protocol_start_date
        if (protocolStart) {
          // Parse as LOCAL date — same as calculateProtocolDay — so both agree
          const [sy, sm, sd] = protocolStart.split('T')[0].split('-').map(Number)
          const startDate = new Date(sy, sm - 1, sd)
          const now = new Date()
          const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          // daysSinceStart aligns with protocol day: start date itself = day 1
          const daysSinceStart = Math.round((todayLocal - startDate) / (1000 * 60 * 60 * 24)) + 1

          // Windows open every 7 days: day 7, 14, 21, 28...
          // On-time window is 48 hours (days 7-8, 14-15...). If missed, the
          // check-in stays available as LATE until the next window opens —
          // users are never silently stranded with a gap week.
          if (daysSinceStart >= 7) {
            const currentWindowWeek = Math.floor(daysSinceStart / 7) // which week we're in
            const windowOpenDay = currentWindowWeek * 7 // day 7, 14, 21...
            const windowCloseDay = windowOpenDay + 1 // 48 hours = 2 calendar days

            const inWindow = daysSinceStart >= windowOpenDay && daysSinceStart <= windowCloseDay

            // A window is complete if a check-in exists for that week number.
            // Uses the stored week_number (not timestamps) so manual
            // protocol_start_date adjustments during testing behave sanely.
            const completedThisWindow = c && c.some(checkin => checkin.week_number === currentWindowWeek)

            // Late grace: anywhere past the 48h window but before the next
            // window, the current week's check-in is still completable
            setWeeklyDue(!completedThisWindow)
            setCheckinLate(!inWindow && !completedThisWindow)
            setActiveCheckinWeek(currentWindowWeek)
          } else {
            setWeeklyDue(false)
            setCheckinLate(false)
          }
        } else {
          setWeeklyDue(false)
        }

        // No improvement detection — after week 4 with high compliance
        const protocolDayNum = p?.protocol_start_date
          ? protocolDay(p.protocol_start_date)
          : 0

        if (protocolDayNum >= 28 && c && c.length >= 4) {
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
    // Tone-awareness: if the latest weekly check-in shows symptoms broadly worsening
    // vs baseline, suppress celebration confetti (milestone messages still show —
    // reaching day 14 on a rough week deserves acknowledgment, not a party).
    const roughWeek = (() => {
      try {
        const latest = (c || []).slice().sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))[0]
        if (!latest?.answers) return false
        const lowerBetter = ['bloating', 'gas', 'reflux']
        const higherBetter = ['digestive', 'energy', 'clarity', 'afternoon', 'sleep', 'wellbeing']
        let worse = 0, better = 0
        for (const k of [...lowerBetter, ...higherBetter]) {
          const bl = p['baseline_' + k]; const cur = latest.answers[k]
          if (bl == null || cur == null) continue
          const improved = lowerBetter.includes(k) ? cur < bl : cur > bl
          const worsened = lowerBetter.includes(k) ? cur > bl : cur < bl
          if (improved) better++; else if (worsened) worse++
        }
        return worse > better && worse >= 2
      } catch { return false }
    })()
    const celebrate = () => {
      if (roughWeek) return
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3500)
    }
    const name = session?.user?.user_metadata?.full_name?.split(' ')[0] || 'there'
    const day = protocolDay(p.protocol_start_date)

    // Day 1 — message stays visible for all of day 1 (re-shown on every load),
    // but the confetti celebration only fires the first time.
    if (day === 1) {
      try {
        const msg = await generateDay1Message({ name, profile: p, labResult: lab })
        setMilestoneMessage(msg)
        setMilestoneKey('day1')
        const shown = await checkMilestoneShown(supabase, session.user.id, 'day1')
        if (!shown) {
          celebrate()
          await markMilestoneShown(supabase, session.user.id, 'day1')
        }
      } catch (e) {}
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
          celebrate()
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
          celebrate()
          await markMilestoneShown(supabase, session.user.id, 'day28')
        } catch (e) {}
      }
    }
    else if (day >= 57 && day < 113) {
      const shown = await checkMilestoneShown(supabase, session.user.id, 'day57')
      if (!shown) {
        try {
          const msg = await generateDay57Message({ name, profile: p, labResult: lab })
          setMilestoneMessage(msg)
          setMilestoneKey('day57')
          celebrate()
          await markMilestoneShown(supabase, session.user.id, 'day57')
        } catch (e) {}
      }
    }
    // Day 113 — moderate unlocks
    else if (day >= 113 && day < 169) {
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
    else if (day >= 169) {
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

  // Streak = consecutive calendar days with a completed daily check-in.
  // Walks real DATES (a missed day breaks it — missing rows used to be
  // skipped over, inflating the count), and counts doing-the-survey, not
  // answering YES — an honest "I slipped" day still continues the streak.
  const cleanDays = (() => {
    const logged = new Set(weekFactors.map(f => f.log_date))
    let count = 0
    const start = new Date()
    if (!logged.has(localDateString(start))) start.setDate(start.getDate() - 1)  // today pending ≠ broken
    for (let i = 0; i < 365; i++) {
      const d = new Date(start); d.setDate(start.getDate() - i)
      if (logged.has(localDateString(d))) count++
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
    // Parse as LOCAL date (new Date('YYYY-MM-DD') is UTC and shifts the day in US timezones)
    const [y, m, d] = profile.protocol_start_date.split('T')[0].split('-').map(Number)
    const start = new Date(y, m - 1, d)
    const now = new Date()
    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const diffDays = Math.round((todayLocal - start) / (1000 * 60 * 60 * 24)) + 1
    // Day 0 = approved, starts tomorrow. Never negative.
    return Math.max(0, diffDays)
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
  const daysUntilReintro = profile?.protocol_start_date ? Math.max(57 - currentDay, 0) : null

  const today = todayLocal()
  const todayEntry = complianceData.find(c => c.date === today)
  const showSlipupCard = todayEntry?.response === 'NO' && !pendingAudit
  const showAuditCard = consecutiveNOs >= 3 && !pendingAudit
  const showIntakeCard = !profile?.intake_completed_at
  const showLabCard = profile?.intake_completed_at && !labResult
  const showPendingLabCard = labResult?.status === 'pending_review'
  const showCheckinCard = weeklyDue && !showIntakeCard && !showLabCard && !showSlipupCard && !showAuditCard
  // Common-track user who has been assigned but hasn't chosen a tier or declined yet.
  const needsCommonDecision = profile?.protocol_track === 'common'
    && profile?.track_decision !== 'active'
    && profile?.track_decision !== 'declined'
  // User who declined the protocol and is in self-tracking mode.
  const isTracking = profile?.track_decision === 'declined'
  const verdictReadyFood = (() => {
    try {
      if (!activeCycleLite?.washout_started_at) return null
      const [y, m, d] = String(activeCycleLite.washout_started_at).split('T')[0].split('-').map(Number)
      const ws = new Date(y, m - 1, d)
      const now = new Date()
      const washoutDay = Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - ws) / 86400000) + 1
      return washoutDay > 11 ? activeCycleLite.food : null
    } catch (e) { return null }
  })()

  const cockpitActive = (calculatedPhase === 'elimination' || calculatedPhase === 'reintroduction') && profile?.protocol_start_date && currentDay >= 1 && !needsCommonDecision && !isTracking && !showIntakeCard && !showLabCard && !showPendingLabCard
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
  if (screen === 'checkin') return <WeeklyCheckin session={session} weekNumber={activeCheckinWeek || currentWeek || 1} profile={profile} currentFoods={labResult?.foods?.map(f => f.name) || []} phase={calculatedPhase || 'elimination'} onBack={() => { setTab('history'); setScreen('checkin-history') }} onComplete={() => { setWeeklyDue(false); setTab('history'); setScreen('checkin-history') }} />
  if (screen === 'daily-checkin') return <DailyCheckin session={session} profile={profile} onBack={() => setScreen('dashboard')} onComplete={() => { setDailyDone(true); setScreen('dashboard') }} />
  if (screen === 'slipup') return <SlipupSurvey session={session} profile={profile} labResult={labResult} currentDay={currentDay} onBack={() => setScreen('dashboard')} onComplete={() => setScreen('dashboard')} />
  if (screen === 'audit') return <ComplianceAudit session={session} eliminatedFoods={labResult?.foods?.map(f => f.name) || []} onBack={() => setScreen('dashboard')} onComplete={() => setScreen('dashboard')} />
  if (screen === 'reintro-survey') return <ReintroductionSurvey session={session} food={profile?.current_reintro_food || 'Eggs'} cycleNumber={profile?.reintro_cycle || 1} baselineScores={{ bloating: profile?.baseline_bloating, energy: profile?.baseline_energy }} symptoms={profile?.symptoms || []} profile={profile} activeReintroId={activeReintroId} onBack={() => setScreen('dashboard')} onComplete={() => setScreen('dashboard')} />

  return (
    <div className="snfy-app">
      <style>{css}</style>

      <nav className="snfy-nav">
        <div className="snfy-logo">Sensify<span style={{ color: '#8BAE8A', fontStyle: 'normal' }}>.</span></div>
        <div className="snfy-nav-tabs">
          {['Home', 'Reintro', 'History', 'Food Map', 'Ask Sensify', 'Maintain'].filter(t => {
            if (t !== 'Maintain') return true
            if (isAdmin) return true  // admins always see Maintain (dev eyes)
            if (!profile?.protocol_start_date) return false  // pre-results: hidden
            const sd = new Date(profile.protocol_start_date + 'T00:00:00')
            const now = new Date(); const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            const pDay = Math.round((todayLocal - sd) / (1000 * 60 * 60 * 24)) + 1
            return pDay >= 57  // appears the day reintroduction unlocks
          }).map(t => (
            <button key={t} className={`snfy-tab${tab === t.toLowerCase().replace(' ', '-') ? ' active' : ''}`} onClick={() => { window.scrollTo(0, 0); setTab(t.toLowerCase().replace(' ', '-')); if (t === 'History') setScreen('checkin-history'); else if (t === 'Food Map') setScreen('food-map'); else if (t === 'Reintro') setScreen('reintro-tab'); else if (t === 'Ask Sensify') setScreen('ask-sensify'); else if (t === 'Maintain') setScreen('maintain'); else setScreen('dashboard') }}>{t}</button>
          ))}
        </div>
        <div className="snfy-nav-right">
          <div className="snfy-phase-pill">{phaseLabel}</div>
          {!isAdmin && (
            <button className="snfy-msg-btn" onClick={() => { setTab('messages'); setScreen('messages') }} title="Support">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3D5C3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              {unreadMsgs > 0 && <span className="snfy-msg-badge">{unreadMsgs}</span>}
            </button>
          )}
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
      ) : screen === 'ask-sensify' ? (
        <div style={{ height: 'calc(100vh - 60px)' }}>
          {(() => {
            // Ask Sensify is locked until lab results are back, because before
            // that it has no Food Map to reason from and could imply results
            // that don't exist yet. Tracking (declined) users are allowed in
            // (observation mode handles their no-Food-Map case safely).
            const resultsBack = (labResult && labResult.status === 'approved') || profile?.track_decision === 'declined' || profile?.program_phase === 'elimination' || profile?.program_phase === 'reintroduction' || profile?.program_phase === 'complete' || profile?.program_phase === 'tracking'
            if (!resultsBack) {
              return (
                <div style={{ height: '100%', overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '28px 20px' }}>
                  <style>{`
                    @keyframes askDotPulse { 0%, 60%, 100% { opacity: 0.25; transform: translateY(0); } 30% { opacity: 1; transform: translateY(-3px); } }
                    @keyframes askMsgIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
                    @keyframes askGlow { 0%, 100% { opacity: 0.05; } 50% { opacity: 0.11; } }
                    @keyframes askRise { from { opacity: 0; transform: translateY(18px) scale(0.985); } to { opacity: 1; transform: translateY(0) scale(1); } }
                  `}</style>
                  <div style={{ maxWidth: 470, width: '100%' }}>

                    <div style={{ textAlign: 'center', marginBottom: 24, animation: 'askMsgIn 0.5s ease both' }}>
                      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '2.5px', color: '#C9A227', marginBottom: 12 }}>LOCKED · UNLOCKS WITH YOUR RESULTS</div>
                      <div style={{ fontFamily: 'Fraunces, serif', fontSize: 36, fontWeight: 300, color: '#1C1C1C', lineHeight: 1.1 }}>A guide that knows<br /><em style={{ fontStyle: 'italic', color: '#3D5C3C' }}>your body.</em></div>
                    </div>

                    <div style={{ position: 'relative', background: '#22301F', borderRadius: 22, padding: '26px 26px 22px', overflow: 'hidden', boxShadow: '0 24px 60px rgba(34,48,31,0.35)', animation: 'askRise 0.7s cubic-bezier(0.16,1,0.3,1) both' }}>
                      <div style={{ position: 'absolute', top: -70, right: -70, width: 240, height: 240, borderRadius: '50%', background: '#8BAE8A', animation: 'askGlow 5s ease-in-out infinite', pointerEvents: 'none' }} />
                      <div style={{ position: 'absolute', bottom: -90, left: -60, width: 200, height: 200, borderRadius: '50%', background: '#E8941F', opacity: 0.05, pointerEvents: 'none' }} />

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, position: 'relative' }}>
                        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9.5, letterSpacing: '1.5px', color: '#8BAE8A' }}>SENSIFY · ASSISTANT</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E8941F' }} />
                          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 8.5, letterSpacing: '1px', color: 'rgba(250,248,244,0.55)' }}>PREVIEW</span>
                        </div>
                      </div>

                      <div style={{ position: 'relative', animation: 'askMsgIn 0.6s ease 0.5s both' }}>
                        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, fontWeight: 700, letterSpacing: '1.2px', color: 'rgba(250,248,244,0.45)', marginBottom: 6 }}>YOU</div>
                        <div style={{ fontSize: 15.5, lineHeight: 1.6, color: 'rgba(250,248,244,0.92)', fontWeight: 300 }}>Dinner at a Thai place tonight. What should I order and what should I skip?</div>
                      </div>

                      <div style={{ position: 'relative', borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 16, paddingTop: 16, animation: 'askMsgIn 0.6s ease 1.1s both' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#8BAE8A', boxShadow: '0 0 10px rgba(139,174,138,0.8)' }} />
                          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, fontWeight: 700, letterSpacing: '1.2px', color: '#8BAE8A' }}>SENSIFY</span>
                        </div>
                        <div style={{ fontSize: 15.5, lineHeight: 1.7, color: '#FAF8F4', fontWeight: 300 }}>Good news: most curries are built on coconut milk, which is clear on your map. Watch the <span style={{ background: 'rgba(214,69,69,0.22)', border: '1px solid rgba(214,69,69,0.45)', padding: '2px 9px', borderRadius: 20, color: '#F2A0A0', fontWeight: 500, boxShadow: '0 0 14px rgba(214,69,69,0.25)' }}>soy</span> in the stir-fries and ask about <span style={{ background: 'rgba(232,148,31,0.18)', border: '1px solid rgba(232,148,31,0.45)', padding: '2px 9px', borderRadius: 20, color: '#F2C078', fontWeight: 500, boxShadow: '0 0 14px rgba(232,148,31,0.22)' }}>peanut</span> garnishes. Pad see ew is the one to skip.</div>
                      </div>

                      <div style={{ position: 'relative', borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 16, paddingTop: 16, animation: 'askMsgIn 0.6s ease 1.9s both' }}>
                        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, fontWeight: 700, letterSpacing: '1.2px', color: 'rgba(250,248,244,0.45)', marginBottom: 6 }}>YOU</div>
                        <div style={{ fontSize: 15.5, lineHeight: 1.6, color: 'rgba(250,248,244,0.92)', fontWeight: 300 }}>What about the mango sticky rice?</div>
                      </div>

                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, animation: 'askMsgIn 0.6s ease 2.5s both' }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#8BAE8A', boxShadow: '0 0 10px rgba(139,174,138,0.8)' }} />
                        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, fontWeight: 700, letterSpacing: '1.2px', color: '#8BAE8A' }}>SENSIFY</span>
                        <span style={{ display: 'inline-flex', gap: 4, marginLeft: 3 }}>
                          {[0, 1, 2].map(i => (
                            <span key={i} style={{ width: 5.5, height: 5.5, borderRadius: '50%', background: '#8BAE8A', animation: `askDotPulse 1.2s ease-in-out ${i * 0.18}s infinite` }} />
                          ))}
                        </span>
                      </div>

                      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                        {['MENUS', 'LABELS', 'RECIPES', 'PHOTOS'].map(w => (
                          <div key={w} style={{ fontFamily: 'DM Mono, monospace', fontSize: 8.5, letterSpacing: '1.5px', color: 'rgba(250,248,244,0.45)' }}>{w}</div>
                        ))}
                      </div>
                    </div>

                    <div style={{ fontSize: 13, color: '#7A7A72', lineHeight: 1.65, textAlign: 'center', maxWidth: 360, margin: '18px auto 0', animation: 'askMsgIn 0.6s ease 0.3s both' }}>Answers come from <strong style={{ color: '#3D5C3C' }}>your</strong> lab results and <strong style={{ color: '#3D5C3C' }}>your</strong> map, never generic advice. Until your results are in, there's nothing to base them on. The wait is what makes them yours.</div>

                  </div>
                </div>
              )
            }
            return <AskSensify session={session} />
          })()}
        </div>
      ) : screen === 'messages' ? (
        <div style={{ height: 'calc(100vh - 60px)' }}>
          <Support session={session} onUnreadChange={(n) => setUnreadMsgs(n)} />
        </div>
      ) : screen === 'maintain' ? (
        <div style={{ height: 'calc(100vh - 60px)', overflowY: 'auto' }}>
          <MaintainHub session={session} profile={profile} isAdmin={isAdmin} />
        </div>
      ) : screen === 'reintro-tab' ? (
        <ReintroTab
          session={session}
          profile={profile}
          labResult={labResult}
          currentDay={currentDay}
          onOpenDailyCheckin={() => setScreen('daily-checkin')}
          onStartVerdictSurvey={(food) => {
            setScreen('reintro-survey')
          }}
        />
      ) : loading ? (
        <div className="snfy-loading">Loading your program...</div>
      ) : (<>
        {cockpitActive && (
          <div style={{ maxWidth: 960, margin: '0 auto', padding: '20px 20px 0' }}>
            <div style={{ position: 'relative', background: '#22301F', borderRadius: 20, padding: '32px 28px 26px', overflow: 'hidden', boxShadow: '0 18px 44px rgba(34,48,31,0.3)' }}>
              <div className="snfy-phase-orb" />
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'rgba(250,248,244,0.5)', marginBottom: 3 }}>{getGreeting()}, {name}</div>
                  <div style={{ fontFamily: 'Fraunces, serif', fontSize: 28, fontWeight: 300, color: '#FAF8F4', lineHeight: 1.1 }}>Day {calculatedPhase === 'reintroduction' ? currentDay - 56 : currentDay} of {calculatedPhase === 'reintroduction' ? 'reintroduction' : 'elimination'}.</div>
                </div>
                {verdictReadyFood ? (
                  <button onClick={() => { window.scrollTo(0, 0); setTab('reintro'); setScreen('reintro-tab') }} style={{ background: '#C9A227', border: 'none', borderRadius: 12, padding: '12px 19px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', boxShadow: '0 0 22px rgba(201,162,39,0.35)' }}>
                    <span style={{ fontSize: 13, color: '#22301F', fontWeight: 700 }}>Your {verdictReadyFood} verdict is ready</span>
                    <span style={{ fontSize: 13, color: '#22301F', fontWeight: 700 }}>{'\u2192'}</span>
                  </button>
                ) : !dailyDone ? (
                  <button onClick={() => setScreen('daily-checkin')} style={{ background: '#8BAE8A', border: 'none', borderRadius: 12, padding: '12px 19px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                    <span style={{ fontSize: 13, color: '#22301F', fontWeight: 600 }}>Tonight's check-in</span>
                    <span style={{ fontSize: 13, color: '#22301F', fontWeight: 700 }}>{'\u2192'}</span>
                  </button>
                ) : (
                  <div style={{ background: 'rgba(139,174,138,0.13)', border: '1px solid rgba(139,174,138,0.28)', borderRadius: 12, padding: '12px 19px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: '#8BAE8A', fontWeight: 600 }}>{'\u2713'} Today logged</span>
                  </div>
                )}
              </div>
              <div style={{ position: 'relative', height: 5, background: 'rgba(255,255,255,0.09)', borderRadius: 3, marginBottom: 7 }}>
                <div style={{ width: `${Math.min(100, Math.max(2, Math.round((calculatedPhase === 'reintroduction' ? ((currentDay - 56) / 112) : (currentDay / 56)) * 100)))}%`, height: 5, background: '#8BAE8A', borderRadius: 3, boxShadow: '0 0 10px rgba(139,174,138,0.5)' }} />
              </div>
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(250,248,244,0.45)' }}>
                <span>{cleanDays} day streak{cleanDays > 0 ? ', unbroken' : ''}</span>
                <span>{calculatedPhase === 'elimination' ? `${Math.max(0, 57 - currentDay)} days to reintroduction` : 'Testing foods, one at a time'}</span>
              </div>
            </div>
          </div>
        )}
        <div className="snfy-layout">

          {/* LEFT COLUMN */}
          <div>
            {!cockpitActive && (
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
            )}

            {/* COMMON TRACK DECISION — shown when assigned common but not yet decided */}
            {needsCommonDecision && (
              <CommonTrackDecision
                session={session}
                profile={profile}
                flaggedCount={labResult?.foods?.length || 0}
                onDecided={loadData}
              />
            )}

            {/* TRACKING LANDING — shown when user declined and is self-tracking */}
            {isTracking && (
              <TrackingLanding
                session={session}
                profile={profile}
                onReverted={loadData}
              />
            )}

            {/* DAILY CHECK-IN PROMPT — shown when active and today's check-in isn't done.
                Only once the protocol has actually begun (currentDay >= 1), so it
                doesn't appear the day before, while elimination "starts tomorrow". */}
            {!cockpitActive && !dailyDone && !needsCommonDecision && !showIntakeCard && !showLabCard && !showPendingLabCard &&
             ((currentDay >= 1 && (calculatedPhase === 'elimination' || calculatedPhase === 'reintroduction')) || isTracking) && (
              <button className="snfy-action" style={{ width: '100%', textAlign: 'left', cursor: 'pointer', border: '1px solid rgba(61,92,60,0.2)', background: '#EDF3ED' }} onClick={() => setScreen('daily-checkin')}>
                <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.7px', color: '#3D5C3C', marginBottom: '6px' }}>Daily check-in</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#1C1C1C', marginBottom: '3px' }}>How's today going?</div>
                <div style={{ fontSize: '13px', color: '#5A6A55' }}>A few quick taps to log how you slept, your stress, and more. Tap to start →</div>
              </button>
            )}

            {/* MILESTONE MESSAGE */}
            {milestoneMessage && (
              <div className="snfy-action" style={{ background: '#1C1C1C', borderColor: '#1C1C1C', color: 'white', position: 'relative' }}>
                <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.7px', color: 'rgba(255,255,255,0.5)', marginBottom: '10px' }}>
                  {milestoneKey === 'day1' ? 'Day 1' : milestoneKey === 'day3' ? 'Day 3' : milestoneKey === 'day14' ? '2 week milestone' : milestoneKey === 'day28' ? 'One month in' : milestoneKey === 'day57' ? 'Reintroduction begins' : milestoneKey === 'day113' ? 'Moderate tier unlocked' : milestoneKey === 'day169' ? 'Final tier unlocked' : 'Milestone'}
                </div>
                <p style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.75, marginBottom: 0, fontSize: '14px' }}>{milestoneMessage}</p>
                <button onClick={() => setMilestoneMessage(null)} style={{ position: 'absolute', top: '14px', right: '14px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '18px', lineHeight: 1, fontFamily: 'DM Sans, sans-serif' }}>×</button>
              </div>
            )}

            {/* DARK PROTOCOL CARD */}
            {!cockpitActive && (calculatedPhase === 'elimination' || calculatedPhase === 'reintroduction') && profile?.protocol_start_date && (
              <div className="snfy-phase">
                <div className="snfy-phase-orb" />
                <div className="snfy-phase-orb2" />
                <div className="snfy-phase-eyebrow">{calculatedPhase === 'elimination' ? 'Elimination phase' : 'Reintroduction phase'}</div>
                {currentDay === 0 ? (
                  <>
                    <div style={{ fontFamily: 'Fraunces, serif', fontSize: '34px', fontWeight: 300, color: 'white', lineHeight: 1.15, marginBottom: '6px' }}>Starts <em style={{ fontStyle: 'italic', color: '#8BAE8A' }}>tomorrow.</em></div>
                    <div className="snfy-phase-of">Your elimination phase begins tomorrow.</div>
                    <div className="snfy-pbar"><div className="snfy-pfill" style={{ width: '0%' }}></div></div>
                    <div className="snfy-plabel"><span>Day 1</span><span>56 days total</span></div>
                  </>
                ) : (
                  <>
                    <div className="snfy-phase-day">{currentDay}</div>
                    <div className="snfy-phase-of">of {calculatedPhase === 'elimination' ? '56' : '168'} days</div>
                    <div className="snfy-pbar"><div className="snfy-pfill" style={{ width: `${eliminationProgressPct}%` }}></div></div>
                    <div className="snfy-plabel">
                      <span>Day 1</span>
                      <span>{daysUntilReintro !== null && daysUntilReintro > 0 ? `${daysUntilReintro} days to reintroduction` : calculatedPhase === 'reintroduction' ? 'Reintroduction active' : '56 days total'}</span>
                    </div>
                    <div className="snfy-phase-streak">
                      <div className="snfy-streak-dot"></div>
                      <div className="snfy-streak-text"><span className="snfy-streak-num">{cleanDays} day</span> check-in streak</div>
                    </div>
                    {(() => {
                      // Projected Food Map completion — LIVE, synced to the person's
                      // actual path. Engine rules: each tier begins at the LATER of its
                      // severity floor (57/113/169) or the prior tier finishing; one
                      // 14-day cycle per food. Live inputs: completed cycles leave the
                      // queue; the active cycle's started_at carries restarts; the
                      // whole thing keys off protocol_start_date so elimination clock
                      // resets shift it too. "~" because audits can still move it.
                      if (!labResult?.foods || !profile?.protocol_start_date) return null
                      const startDate = new Date(profile.protocol_start_date)
                      const dayOf = (dateStr) => Math.floor((new Date(dateStr) - startDate) / 86400000) + 1
                      const todayDay = dayOf(new Date())
                      const freq = profile?.food_frequency || {}
                      const isCommon = profile?.protocol_track === 'common'
                      const doneOrActive = new Set(reintroRows.map(r => r.food))
                      const active = reintroRows.find(r => r.verdict == null)
                      const remainingFor = (level) => (isCommon
                        ? (level === 'Low' ? labResult.foods : [])
                        : labResult.foods.filter(f => f.level === level)
                      ).filter(f => {
                        const q = freq[f.name]
                        return q && q !== 'never' && !doneOrActive.has(f.name)
                      }).length
                      const tiers = [
                        { floor: 57, count: remainingFor('Low') },
                        { floor: 113, count: remainingFor('Moderate') },
                        { floor: 169, count: remainingFor('High') },
                      ]
                      // Cursor: where the timeline currently stands.
                      let cursor = Math.max(57, todayDay)
                      if (active?.started_at) cursor = Math.max(cursor, dayOf(active.started_at) + 14)
                      let any = !!active
                      tiers.forEach(t => {
                        if (t.count === 0) return
                        any = true
                        cursor = Math.max(cursor, t.floor) + 14 * t.count
                      })
                      if (!any) return null
                      const finish = new Date(startDate)
                      finish.setDate(finish.getDate() + cursor - 1)
                      const label = finish.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8BAE8A" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Projected map completion <span style={{ fontWeight: 500, color: '#8BAE8A' }}>~{label}</span> · Day {cursor}</div>
                        </div>
                      )
                    })()}
                  </>
                )}
              </div>
            )}


            {/* AWAITING APPROVAL state */}
            {profile?.program_phase === 'pending_review' && !showIntakeCard && !showLabCard && (
              <div className="snfy-phase" style={{ background: '#3D5C3C' }}>
                <div className="snfy-phase-eyebrow">Your program</div>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: '22px', fontWeight: 300, color: 'white', marginBottom: '8px' }}>Awaiting <em style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.7)' }}>approval.</em></div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>Complete setup to begin</div>
                <div className="snfy-pbar" style={{ marginTop: '16px' }}><div className="snfy-pfill" style={{ width: '0%' }}></div></div>
                <div className="snfy-plabel"><span></span><span>6 months total</span></div>
              </div>
            )}

            {/* ACTION CARDS */}
            {showIntakeCard && (
              <div className="snfy-action">
                <div className="snfy-action-tag"><div className="snfy-action-dot"></div>Complete your setup</div>
                <h2>Start your <em>intake survey.</em></h2>
                <p>Tell us about your symptoms and how often you eat certain foods. Takes about 5 minutes.</p>
                <button className="snfy-btn" onClick={() => setScreen('intake')}>Start intake survey →</button>
              </div>
            )}

            {showLabCard && (
              <div className="snfy-action">
                <div className="snfy-action-tag"><div className="snfy-action-dot"></div>Action needed</div>
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
                <p>Takes 60 seconds. No judgment — just data that makes your weekly insights more accurate.</p>
                <button className="snfy-btn red" onClick={() => setScreen('slipup')}>Tell us what happened →</button>
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


            {/* AI INSIGHT — the voice card */}
            <div className="snfy-insight" style={{ marginTop: 14 }}>
              <div className="snfy-insight-head">
                <span className="snfy-insight-dot"></span>
                <span className="snfy-insight-tag">{
                  profile?.latest_insight ? `WEEKLY INSIGHT · WEEK ${profile?.latest_insight_week || 1}`
                  : (currentDay >= 1 ? `PROTOCOL · DAY ${currentDay}` : 'GETTING STARTED')
                }</span>
              </div>
              <p>{
                profile?.latest_insight
                || (currentDay >= 1
                  ? `You're on day ${currentDay} of your ${calculatedPhase === 'reintroduction' ? 'reintroduction' : 'elimination'} phase. Your first weekly insight will appear here after your first weekly check-in, drawn from how your symptoms change.`
                  : 'Once you complete your setup and upload your lab results, your weekly insights will appear here, generated from your symptom data after each check-in.')
              }</p>
              {profile?.latest_insight && <div className="snfy-insight-foot">GENERATED FROM YOUR CHECK-IN DATA</div>}
            </div>

            {/* WEEKLY CHECK-IN — slim state card */}
            <div className="snfy-weekly-card">
            {showCheckinCard ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: checkinLate ? '#FDF2EA' : '#EDF3ED', border: checkinLate ? '1px solid rgba(212,137,74,0.25)' : '1px solid rgba(61,92,60,0.18)', borderRadius: 12, padding: '12px 14px', marginTop: 14 }}>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#1C1C1C' }}>Weekly check-in</div>
                  <div style={{ fontSize: 10.5, color: checkinLate ? '#8A5410' : '#3D5C3C', marginTop: 1 }}>{checkinLate ? "Catch up — your data still matters" : 'Due now · takes 2 minutes'}</div>
                </div>
                <button className={`snfy-btn${checkinLate ? ' amber' : ''}`} style={{ padding: '9px 15px', fontSize: 12.5 }} onClick={() => setScreen('checkin')}>Start →</button>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAF8F4', borderRadius: 12, padding: '12px 14px', marginTop: 14 }}>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#1C1C1C' }}>Weekly check-in</div>
                  <div style={{ fontSize: 10.5, color: '#8A8A82', marginTop: 1 }}>{checkins.length === 0 ? 'Opens at the end of week 1' : 'Done — next one opens at week\u2019s end'}</div>
                </div>
                <span style={{ fontSize: 11, color: '#B8B6AE' }}>{checkins.length === 0 ? 'Locked' : '\u2713'}</span>
              </div>
            )}
            </div>

            {/* COMPLIANCE DOTS */}
            {(calculatedPhase === 'elimination' || calculatedPhase === 'reintroduction') && (
              <div className="snfy-comp" style={{ marginTop: '14px' }}>
                {(() => {
                  const now = new Date()
                  const todayStr = localDateString(now)
                  // Anchor the week to PROTOCOL DAY 1, not calendar Monday, so a user
                  // who starts mid-week gets a full 7-day week from their day 1.
                  let weekStart
                  let startDayNum = 1
                  if (profile?.protocol_start_date) {
                    const [yy, mm, dd] = profile.protocol_start_date.split('T')[0].split('-').map(Number)
                    const protoStart = new Date(yy, mm - 1, dd)
                    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate())
                    const daysSince = Math.max(0, Math.round((todayLocal - protoStart) / (1000 * 60 * 60 * 24)))
                    const weekIndex = Math.floor(daysSince / 7)
                    weekStart = new Date(protoStart)
                    weekStart.setDate(protoStart.getDate() + weekIndex * 7)
                    startDayNum = weekIndex * 7 + 1
                  } else {
                    weekStart = new Date(now)
                    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7))
                  }
                  const dowLabels = ['Su','Mo','Tu','We','Th','Fr','Sa']
                  const days = Array.from({ length: 7 }).map((_, i) => {
                    const td = new Date(weekStart)
                    td.setDate(weekStart.getDate() + i)
                    const dateStr = localDateString(td)
                    const entry = complianceData.find(c => c.date === dateStr)
                    const isFuture = dateStr > todayStr
                    const isToday = dateStr === todayStr
                    const day = dowLabels[td.getDay()]
                    let cls, mark
                    if (entry?.response === 'YES') { cls = 'yes'; mark = '\u2713' }        // did check-in + complied
                    else if (entry?.response === 'NO') { cls = 'no'; mark = '\u2717' }     // did check-in + slipped
                    else if (isFuture) { cls = 'future'; mark = '' }
                    else if (isToday) { cls = 'empty'; mark = '\u00b7' }                   // today, pending - not missed yet
                    else { cls = 'missed'; mark = '\u2013' }  // forgot — the only streak-breaker
                    return { day, cls: cls + (isToday ? ' today' : ''), mark, dateStr, isFuture }
                  })
                  const weekLabel = profile?.protocol_start_date ? `Days ${startDayNum}\u2013${startDayNum + 6}` : 'This week'
                  return (
                    <>
                      <div className="snfy-comp-top">
                        <div>
                          <div className="snfy-comp-label">{weekLabel}</div>
                        </div>
                        <div className="snfy-comp-streak-wrap">
                          <div className="snfy-comp-streak-num">{cleanDays}</div>
                          <div className="snfy-comp-streak-label">day streak</div>
                        </div>
                      </div>
                      <div className="snfy-comp-dots">
                        {days.map((d, i) => (
                          <div key={i} className={`snfy-dot ${d.cls}`}>
                            <span className="snfy-dot-day">{d.day}</span>
                            <span className="snfy-dot-mark">{d.mark}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '10px', justifyContent: 'center' }}>
                        {[
                          { bg: '#3D5C3C', fg: 'white', m: '\u2713', label: 'Followed plan' },
                          { bg: '#C95B5B', fg: 'white', m: '\u2717', label: 'Slipped' },
                          { bg: '#DDDAD1', fg: '#6A6A62', m: '\u2013', label: 'Missed \u2014 resets streak' },
                        ].map((l, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ width: '14px', height: '14px', borderRadius: '4px', background: l.bg, color: l.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 700, flexShrink: 0 }}>{l.m}</span>
                            <span style={{ fontSize: '10px', color: '#8A8A82' }}>{l.label}</span>
                          </div>
                        ))}
                      </div>
                      <WeekFactorCards days={days} factors={weekFactors} profile={profile} />
                    </>
                  )
                })()}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div>
            {/* FIRST WEEK GUIDE (#19, button + panel form) — days 1-7, retires after first weekly check-in */}
            {calculatedPhase === 'elimination' && currentDay >= 1 && currentDay <= 7 && checkins.length === 0 && (() => {
              const flagged = (labResult?.foods || []).filter(f => f.level !== 'No sensitivity')
              const goto = (t, s) => { setGuideOpen(false); window.scrollTo(0, 0); setTab(t); setScreen(s) }
              return (
                <>
                  <button className="snfy-guide-slot" onClick={() => setGuideOpen(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, background: '#FFFFFF', border: '1.5px solid #3D5C3C', borderRadius: 18, padding: '14px 15px', cursor: 'pointer', textAlign: 'left', fontFamily: 'DM Sans, sans-serif', boxShadow: '0 2px 10px rgba(61,92,60,0.1)', marginBottom: 14 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: '#3D5C3C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1C1C1C' }}>Your first-week guide</div>
                      <div style={{ fontSize: 11.5, color: '#7A7A72', marginTop: 1 }}>What to do, and what every tab is for</div>
                    </div>
                    <span style={{ color: '#3D5C3C', fontSize: 16, fontWeight: 600 }}>›</span>
                  </button>

                  {guideOpen && (
                    <div onClick={() => setGuideOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(28,28,28,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
                      <div onClick={e => e.stopPropagation()} style={{ background: '#FAF8F4', borderRadius: 18, padding: '20px 18px', maxWidth: 420, width: '100%', maxHeight: '86vh', overflowY: 'auto', boxShadow: '0 30px 80px rgba(0,0,0,0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 400, color: '#1C1C1C' }}>Your first week</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ background: '#EDF3ED', color: '#3D5C3C', borderRadius: 12, padding: '3px 10px', fontSize: 10, fontWeight: 600 }}>DAY {currentDay} OF 7</span>
                            <button onClick={() => setGuideOpen(false)} style={{ width: 27, height: 27, borderRadius: '50%', background: '#EFEDE6', border: 'none', color: '#7A7A72', fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>✕</button>
                          </div>
                        </div>
                        <div style={{ fontSize: 12.5, color: '#7A7A72', lineHeight: 1.65, marginBottom: 16 }}>{currentDay === 1 ? 'Elimination starts today.' : 'Elimination is underway.'} Eight clean weeks gives your body a quiet baseline, and every answer you earn later is measured against it.</div>

                        <div style={{ display: 'flex', gap: 12, marginBottom: 15 }}>
                          <div style={{ width: 25, height: 25, borderRadius: '50%', background: '#3D5C3C', color: '#fff', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>1</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1C1C1C', marginBottom: 6 }}>Stop eating your flagged foods</div>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                              {flagged.map(f => <span key={f.name} style={{ background: '#EFEDE6', color: '#5A5A52', borderRadius: 14, padding: '3px 9px', fontSize: 11 }}>{f.name}</span>)}
                            </div>
                            <button onClick={() => goto('food-map', 'food-map')} style={{ background: 'none', border: 'none', padding: 0, fontSize: 12, color: '#3D5C3C', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>See sensitivity levels →</button>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12, marginBottom: 15 }}>
                          <div style={{ width: 25, height: 25, borderRadius: '50%', background: dailyDone ? '#3D5C3C' : '#8BAE8A', color: '#fff', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {dailyDone ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg> : '2'}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1C1C1C', marginBottom: 2 }}>{dailyDone ? (currentDay === 1 ? 'First check-in logged' : "Today's check-in logged") : 'Check in every day'}</div>
                            <div style={{ fontSize: 12, color: '#7A7A72', lineHeight: 1.6 }}>{dailyDone ? `Day ${currentDay === 1 ? 'one' : currentDay} is on the record. ${7 - currentDay} more night${7 - currentDay !== 1 ? 's' : ''} this week, ten seconds each.` : `Ten seconds each night: did you stick to it, how you slept, how you feel. ${currentDay === 1 ? 'Tonight is your first.' : 'Tonight counts.'}`}</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12, marginBottom: 17 }}>
                          <div style={{ width: 25, height: 25, borderRadius: '50%', background: '#E0DED6', color: '#7A7A72', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>3</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1C1C1C', marginBottom: 2 }}>Every week, a bigger check-in</div>
                            <div style={{ fontSize: 12, color: '#7A7A72', lineHeight: 1.6 }}>A real review of your week against your baseline. Your first lands {currentDay >= 7 ? 'today' : currentDay === 6 ? 'tomorrow' : `in ${7 - currentDay} days`}.</div>
                          </div>
                        </div>

                        <div style={{ borderTop: '1px solid rgba(0,0,0,0.07)', paddingTop: 15 }}>
                          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 16, fontWeight: 400, color: '#1C1C1C', marginBottom: 3 }}>Know your tabs</div>
                          <div style={{ fontSize: 11.5, color: '#A8A69E', marginBottom: 12 }}>Tap any of them to look around. Nothing breaks.</div>
                          {[
                            ['Ask Sensify', 'Can I eat this? What can I eat at an Italian restaurant? Ask anything, starting now.', 'ask-sensify', 'ask-sensify'],
                            ['History', 'Every check-in logged, and your symptoms graphed against your baseline so you can see yourself getting better.', 'history', 'checkin-history'],
                            ['Reintro', 'From day 57, you eat your flagged foods again one at a time to find out which ones actually cause problems.', 'reintro', 'reintro-tab'],
                            ['Food Map', "Where it all ends up. Your flagged foods today, turning into answers you've earned along the way.", 'food-map', 'food-map'],
                          ].map(([nm, desc, t, scr], i, arr) => (
                            <button key={nm} onClick={() => goto(t, scr)} style={{ display: 'flex', gap: 11, alignItems: 'center', padding: '10px 11px', borderRadius: 11, background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.05)', marginBottom: i < arr.length - 1 ? 7 : 0, width: '100%', cursor: 'pointer', textAlign: 'left', fontFamily: 'DM Sans, sans-serif' }}>
                              <span style={{ background: '#EDF3ED', borderRadius: 8, padding: '5px 10px', fontSize: 11, fontWeight: 600, color: '#3D5C3C', flexShrink: 0 }}>{nm}</span>
                              <span style={{ fontSize: 11.5, color: '#7A7A72', lineHeight: 1.5, flex: 1 }}>{desc}</span>
                              <span style={{ color: '#C8C6BE', fontSize: 13 }}>›</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )
            })()}
            {/* FULL CATEGORIZED AVOIDING LIST */}
            <div className="snfy-avoiding">
              <div className="snfy-avoid-header">
                <div className="snfy-sec-label" style={{ marginBottom: 0 }}>Currently avoiding</div>
                {showAvoidingList && <div className="snfy-avoid-count">{labResult?.foods?.length || 0} foods total</div>}
              </div>

              {showAvoidingList && labResult?.foods?.length > 0 ? (
                <>
                  {(() => {
                    const colors = { High: '#D64545', Moderate: '#E8941F', Low: '#2C9D8A' }
                    const textColors = { High: '#A32D2D', Moderate: '#8A5410', Low: '#1A6256' }
                    const chipBg = { High: '#FBE9E9', Moderate: '#FCEFD9', Low: '#DEF2EE' }
                    const order = ['High', 'Moderate', 'Low']
                    const grouped = order.map(level => ({
                      level,
                      foods: labResult.foods.filter(f => f.level === level),
                    })).filter(g => g.foods.length > 0)

                    return (
                      <>
                        {/* Proportion bar — whole sensitivity profile at a glance */}
                        <div className="snfy-avoid-bar">
                          {grouped.map(g => (
                            <div key={g.level} className="snfy-avoid-bar-seg" style={{ flex: g.foods.length, background: colors[g.level] }} />
                          ))}
                        </div>

                        {grouped.map(g => (
                          <div key={g.level} className="snfy-avoid-group">
                            <div className="snfy-avoid-group-head">
                              <div className="snfy-avoid-level-dot" style={{ background: colors[g.level] }}></div>
                              <div className="snfy-avoid-level-name" style={{ color: textColors[g.level] }}>{g.level} sensitivity</div>
                              <div className="snfy-avoid-level-count">{g.foods.length}</div>
                            </div>
                            <div className="snfy-avoid-chips">
                              {g.foods.map((food, i) => (
                                <span key={i} className="snfy-avoid-chip" style={{ background: chipBg[g.level], color: textColors[g.level] }}>{food.name}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </>
                    )
                  })()}
                </>
              ) : (
                <div style={{ padding: '20px 0', textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#1C1C1C', marginBottom: '6px' }}>No foods yet</div>
                  <div style={{ fontSize: '12px', color: '#7A7A72', lineHeight: 1.65 }}>
                    {!labResult ? 'Your elimination list will appear here once your lab results are uploaded and approved.'
                      : labResult.status === 'pending_review' ? 'Your lab results are under review.'
                      : 'No foods flagged on your elimination list.'}
                  </div>
                </div>
              )}

            </div>

            {/* SYMPTOM TRENDS — ambient monitor */}
            <div className="snfy-trends">
              <SymptomGraph profile={profile} checkins={checkins} activeMetric={activeGraphMetric} setActiveMetric={setActiveGraphMetric} />
            </div>

          </div>

        </div>
      </>)}

      {/* CONFETTI OVERLAY */}
      {showConfetti && <ConfettiOverlay />}
    </div>
  )
}
