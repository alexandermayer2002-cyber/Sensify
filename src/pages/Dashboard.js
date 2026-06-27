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
import AskSensify from './AskSensify'
import MaintainHub from './MaintainHub'
import { getProtocolFoods } from '../utils/protocolEngine'
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

  .snfy-layout { padding: 24px 20px 40px; max-width: 960px; margin: 0 auto; }
  @media (min-width: 680px) {
    .snfy-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 24px 28px 48px; align-items: start; }
  }

  /* Greeting */
  .snfy-greeting { margin-bottom: 16px; }
  .snfy-greeting h1 { font-family: 'Fraunces', serif; font-size: 28px; font-weight: 300; line-height: 1.2; margin-bottom: 5px; letter-spacing: -0.5px; }
  .snfy-greeting h1 em { font-style: italic; color: #3D5C3C; }
  .snfy-greeting p { font-size: 13px; color: #7A7A72; line-height: 1.55; }

  /* Dark protocol card */
  .snfy-phase { background: #1C1C1C; border-radius: 16px; padding: 22px; color: white; margin-bottom: 14px; position: relative; overflow: hidden; }
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
  .snfy-comp { background: #FFFFFF; border: 1px solid rgba(0,0,0,0.07); border-radius: 16px; padding: 18px; margin-bottom: 0; }
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
  .snfy-dot.today { box-shadow: 0 0 0 2px #3D5C3C; }
  .snfy-dot-day { font-size: 9px; font-weight: 700; letter-spacing: 0.3px; }
  .snfy-dot.yes .snfy-dot-day, .snfy-dot.no .snfy-dot-day { color: rgba(255,255,255,0.85); }
  .snfy-dot.empty .snfy-dot-day, .snfy-dot.future .snfy-dot-day { color: #A8A69E; }
  .snfy-dot-mark { font-size: 14px; font-weight: 700; line-height: 1; }
  .snfy-dot.yes .snfy-dot-mark { color: white; }
  .snfy-dot.no .snfy-dot-mark { color: white; }
  .snfy-dot.empty .snfy-dot-mark { color: rgba(0,0,0,0.15); }
  .snfy-dot.future .snfy-dot-mark { color: rgba(0,0,0,0.12); }

  /* Pending cards */
  .snfy-pending { background: #FDF2EA; border: 1px solid rgba(212,137,74,0.18); border-radius: 13px; padding: 14px; margin-bottom: 14px; display: flex; align-items: center; gap: 11px; }
  .snfy-pending-icon { width: 34px; height: 34px; background: #D4894A; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .snfy-audit-pending { background: #FAF8F4; border: 1px solid rgba(0,0,0,0.08); border-radius: 13px; padding: 14px; margin-bottom: 14px; display: flex; align-items: center; gap: 11px; }
  .snfy-audit-icon { width: 34px; height: 34px; background: #EDF3ED; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

  /* Right column */
  .snfy-sec-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; color: #7A7A72; margin-bottom: 9px; }

  /* Avoiding list — full categorized */
  .snfy-avoiding { background: #FFFFFF; border: 1px solid rgba(0,0,0,0.07); border-radius: 16px; padding: 20px; margin-bottom: 0; }
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
  .snfy-insight { background: #FFFFFF; border: 1px solid rgba(0,0,0,0.08); border-radius: 12px; padding: 16px; margin-top: 16px; }
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
  const [checkinLate, setCheckinLate] = useState(false)
  const [activeCheckinWeek, setActiveCheckinWeek] = useState(1)
  const [activeReintroId, setActiveReintroId] = useState(null)
  const [complianceData, setComplianceData] = useState([])
  const [consecutiveNOs, setConsecutiveNOs] = useState(0)
  const [pendingAudit, setPendingAudit] = useState(false)
  const [dailyDone, setDailyDone] = useState(false)
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
        const todayStr = new Date().toISOString().split('T')[0]
        const { data: df } = await supabase.from('daily_factors').select('id').eq('user_id', session.user.id).eq('log_date', todayStr).maybeSingle()
        setDailyDone(!!df)
      } catch (e) {}

      const { data: c } = await supabase.from('weekly_checkins').select('*').eq('user_id', session.user.id).order('submitted_at', { ascending: false }).limit(8)
      if (c) setCheckins(c)

      // Active reintro cycle id (for the verdict survey)
      if (p?.current_reintro_food) {
        const { data: ar } = await supabase.from('reintroduction_results')
          .select('id').eq('user_id', session.user.id).is('verdict', null)
          .order('started_at', { ascending: false }).limit(1).maybeSingle()
        setActiveReintroId(ar?.id || null)
      }

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

  const today = new Date().toISOString().split('T')[0]
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
        <div className="snfy-logo">sensi<em>fy</em></div>
        <div className="snfy-nav-tabs">
          {['Home', 'Reintro', 'History', 'Food Map', 'Ask Sensify', 'Maintain'].map(t => (
            <button key={t} className={`snfy-tab${tab === t.toLowerCase().replace(' ', '-') ? ' active' : ''}`} onClick={() => { setTab(t.toLowerCase().replace(' ', '-')); if (t === 'History') setScreen('checkin-history'); else if (t === 'Food Map') setScreen('food-map'); else if (t === 'Reintro') setScreen('reintro-tab'); else if (t === 'Ask Sensify') setScreen('ask-sensify'); else if (t === 'Maintain') setScreen('maintain'); else setScreen('dashboard') }}>{t}</button>
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
      ) : screen === 'ask-sensify' ? (
        <div style={{ height: 'calc(100vh - 60px)' }}>
          <AskSensify session={session} />
        </div>
      ) : screen === 'maintain' ? (
        <div style={{ height: 'calc(100vh - 60px)', overflowY: 'auto' }}>
          <MaintainHub session={session} profile={profile} />
        </div>
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
            {!dailyDone && !needsCommonDecision && !showIntakeCard && !showLabCard && !showPendingLabCard &&
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
                  {milestoneKey === 'day1' ? 'Day 1' : milestoneKey === 'day3' ? 'Day 3' : milestoneKey === 'day14' ? '2 week milestone' : milestoneKey === 'day28' ? 'One month in' : milestoneKey === 'day57' ? 'Reintroduction unlocked' : milestoneKey === 'day113' ? 'Moderate tier unlocked' : milestoneKey === 'day169' ? 'Final tier unlocked' : 'Milestone'}
                </div>
                <p style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.75, marginBottom: 0, fontSize: '14px' }}>{milestoneMessage}</p>
                <button onClick={() => setMilestoneMessage(null)} style={{ position: 'absolute', top: '14px', right: '14px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '18px', lineHeight: 1, fontFamily: 'DM Sans, sans-serif' }}>×</button>
              </div>
            )}

            {/* DARK PROTOCOL CARD */}
            {(calculatedPhase === 'elimination' || calculatedPhase === 'reintroduction') && profile?.protocol_start_date && (
              <div className="snfy-phase">
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
                      <div className="snfy-streak-text"><span className="snfy-streak-num">{cleanDays} day</span> clean streak</div>
                    </div>
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

            {showCheckinCard && (
              <div className={`snfy-action${checkinLate ? ' amber' : ''}`}>
                <div className={`snfy-action-tag${checkinLate ? ' amber' : ''}`}>{checkinLate ? 'Catch up' : <><div className="snfy-action-dot"></div>Due now</>}</div>
                <h2>Your weekly <em className={checkinLate ? 'amber' : ''}>check-in.</em></h2>
                <p>{checkinLate ? "You missed this week's window — but your data still matters. Complete it now to keep your insights on track." : "Takes 2 minutes. The AI uses your answers to generate this week's personalized insight."}</p>
                <button className={`snfy-btn${checkinLate ? ' amber' : ''}`} onClick={() => setScreen('checkin')}>Start check-in →</button>
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

            {/* STAT CARDS — 3 column */}
            {(calculatedPhase === 'elimination' || calculatedPhase === 'reintroduction') && checkins.length > 0 && (() => {
              const latest = checkins[0]
              const metrics = []
              if (profile?.baseline_bloating && latest?.answers?.bloating !== undefined) metrics.push({ label: 'Bloating', val: latest.answers.bloating, baseline: profile.baseline_bloating, lowerBetter: true })
              if (profile?.baseline_energy && latest?.answers?.energy !== undefined) metrics.push({ label: 'Energy', val: latest.answers.energy, baseline: profile.baseline_energy, lowerBetter: false })
              if (profile?.baseline_clarity && latest?.answers?.clarity !== undefined) metrics.push({ label: 'Clarity', val: latest.answers.clarity, baseline: profile.baseline_clarity, lowerBetter: false })
              if (metrics.length === 0) return null
              return (
                <div className="snfy-stats" style={{ gridTemplateColumns: `repeat(${Math.min(metrics.length, 3)}, 1fr)`, marginTop: '14px' }}>
                  {metrics.slice(0, 3).map((m, i) => {
                    const change = Math.round(((m.val - m.baseline) / m.baseline) * 100)
                    const improved = m.lowerBetter ? change < 0 : change > 0
                    return (
                      <div key={i} className="snfy-stat">
                        <div className="snfy-stat-label">{m.label}</div>
                        <div className="snfy-stat-val">{m.val}</div>
                        <div className="snfy-stat-change" style={{ color: improved ? '#4A8C6A' : change === 0 ? '#7A7A72' : '#C95B5B' }}>
                          {change > 0 ? '↑' : change < 0 ? '↓' : '—'} {Math.abs(change)}% baseline
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}

            {/* COMPLIANCE DOTS */}
            {(calculatedPhase === 'elimination' || calculatedPhase === 'reintroduction') && (
              <div className="snfy-comp" style={{ marginTop: '14px' }}>
                {(() => {
                  const now = new Date()
                  const todayStr = now.toISOString().split('T')[0]
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
                    const dateStr = td.toISOString().split('T')[0]
                    const entry = complianceData.find(c => c.date === dateStr)
                    const isFuture = dateStr > todayStr
                    const isToday = dateStr === todayStr
                    const day = dowLabels[td.getDay()]
                    let cls, mark
                    if (entry?.response === 'YES') { cls = 'yes'; mark = '\u2713' }
                    else if (entry?.response === 'NO') { cls = 'no'; mark = '\u2717' }
                    else if (isFuture) { cls = 'future'; mark = '' }
                    else { cls = 'empty'; mark = '\u00b7' }
                    return { day, cls: cls + (isToday ? ' today' : ''), mark }
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
                    </>
                  )
                })()}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div>
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

              {/* WEEKLY INSIGHT — instrument style */}
              <div className="snfy-insight">
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
            </div>

            {/* SYMPTOM GRAPH */}
            <div style={{ marginTop: '14px' }}>
              <SymptomGraph profile={profile} checkins={checkins} activeMetric={activeGraphMetric} setActiveMetric={setActiveGraphMetric} />
            </div>
          </div>

        </div>
      )}

      {/* CONFETTI OVERLAY */}
      {showConfetti && <ConfettiOverlay />}
    </div>
  )
}
