import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { protocolDay } from '../utils/protocolDay'

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&family=Fraunces:ital,opsz,wght@0,9..144,300;1,9..144,300&family=DM+Mono:wght@400;500&display=swap');

  .fm-wrap { min-height: calc(100vh - 56px); background: transparent; font-family: 'DM Sans', sans-serif; color: #1C1C1C; }
  .fm-content { max-width: 760px; margin: 0 auto; padding: 24px 20px 56px; }
  .fm-loading { display: flex; align-items: center; justify-content: center; min-height: 50vh; font-size: 14px; color: #7A7A72; }

  /* DARK INSTRUMENT HEADER */
  .fm-header { background: transparent; border-radius: 0; padding: 0 0 18px; margin-bottom: 18px; position: relative; overflow: visible; box-shadow: none; border-bottom: 1px solid rgba(0,0,0,0.08); }
  .fm-header-orb, .fm-header-orb2 { display: none; }
  .fm-header-top { display: flex; flex-direction: column; align-items: center; text-align: center; margin-bottom: 16px; position: relative; animation: fmFade 0.55s ease 0.15s both; }
  .fm-eyebrow { font-family: 'DM Mono', monospace; font-size: 8px; font-weight: 500; text-transform: uppercase; letter-spacing: 2.2px; color: #9A927E; margin-bottom: 8px; }
  .fm-name { font-family: 'Fraunces', serif; font-size: 26px; font-weight: 400; color: #1C1C1C; letter-spacing: -0.3px; }
  .fm-name em { font-style: normal; color: #1C1C1C; }
  .fm-meta { font-family: 'DM Mono', monospace; font-size: 8px; color: #9A927E; text-align: center; line-height: 1.9; letter-spacing: 0.8px; }
  .fm-meta span { color: #3D5C3C; }
  .fm-cert { position: relative; background: linear-gradient(180deg, #FDFBF6, #F8F4EA); border: 1px solid rgba(0,0,0,0.11); border-radius: 6px; padding: 38px 40px 28px; box-shadow: 0 24px 60px rgba(60,50,30,0.2), 0 4px 14px rgba(60,50,30,0.09), inset 0 0 80px rgba(201,162,39,0.035); max-width: 680px; margin: 0 auto; animation: fmLay 0.9s cubic-bezier(0.22, 1, 0.36, 1) both; }
  @keyframes fmLay {
    0% { opacity: 0; transform: translateY(-42px) scale(1.05) rotate(-1.6deg); }
    55% { opacity: 1; transform: translateY(0) scale(1) rotate(0.4deg); }
    75% { transform: rotate(-0.2deg); }
    100% { opacity: 1; transform: translateY(0) scale(1) rotate(0deg); }
  }
  @keyframes fmSetDown {
    0% { opacity: 0; transform: perspective(1400px) rotateX(16deg) translateY(-36px) scale(1.05); box-shadow: 0 70px 110px rgba(60,50,30,0.3), 0 20px 40px rgba(60,50,30,0.14), inset 0 0 80px rgba(201,162,39,0.035); }
    55% { opacity: 1; }
    100% { opacity: 1; transform: perspective(1400px) rotateX(0deg) translateY(0) scale(1); box-shadow: 0 24px 60px rgba(60,50,30,0.22), 0 4px 14px rgba(60,50,30,0.1), inset 0 0 80px rgba(201,162,39,0.035); }
  }
  @media (prefers-reduced-motion: reduce) { .fm-cert { animation: none; } }
  .fm-cert::before { content: ''; position: absolute; inset: 7px; border: 1px solid rgba(160,140,90,0.22); border-radius: 2px; pointer-events: none; }
  @media (max-width: 620px) { .fm-cert { padding: 26px 18px 20px; border-radius: 8px; } }
  .fm-ghost-row { display: flex; align-items: center; gap: 9px; padding: 9px 2px; border-bottom: 1px solid rgba(0,0,0,0.05); }
  .fm-ghost-row:last-child { border-bottom: none; }
  .fm-ghost-mark { width: 8px; height: 8px; border-radius: 2px; border: 1px dashed rgba(0,0,0,0.16); }
  .fm-ghost-line { flex: 1; }
  @keyframes fmTestPulse { 0%, 100% { background: rgba(232,148,31,0.06); } 50% { background: rgba(232,148,31,0.13); } }
  .fm-testing-row { animation: fmTestPulse 2.4s ease-in-out infinite; border-radius: 8px; }
  .fm-serial { position: absolute; top: 14px; right: 16px; font-family: 'DM Mono', monospace; font-size: 7px; letter-spacing: 1.2px; color: #B8B0A0; }
  .fm-cert-eyebrow { font-family: 'DM Mono', monospace; font-size: 8px; letter-spacing: 2.2px; color: #9A927E; margin-bottom: 8px; text-align: center; text-transform: uppercase; }
  .fm-gold-rule { height: 2px; background: #C9A227; margin: 10px auto 12px; opacity: 0.5; width: 44px; animation: fmRule 0.5s ease 0.5s both; }
  @keyframes fmFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fmRule { from { width: 0; } to { width: 44px; } }
  @keyframes fmRow { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
  .fm-title-type { overflow: hidden; white-space: nowrap; display: inline-block; max-width: 0; animation: fmTitleType 1.7s 0.7s forwards; }
  @keyframes fmTitleType { to { max-width: 100%; } }
  .fm-title-caret { display: inline-block; width: 2.5px; height: 26px; background: #8A8474; margin-left: 6px; vertical-align: -3px; animation: fmCaret 1s steps(1) 0.7s infinite; }
  @keyframes fmCaret { 50% { opacity: 0; } }
  .fm-stamp-progress { width: 60px; height: 60px; border: 2px dashed rgba(138,132,116,0.5); border-radius: 50%; display: flex; align-items: center; justify-content: center; transform: rotate(-8deg); animation: fmFade 0.6s ease 2s both; }
  .fm-stamp-progress-text { font-family: 'DM Mono', monospace; font-size: 6px; letter-spacing: 0.6px; color: #8A8474; line-height: 1.5; text-align: center; }
  @keyframes fmStamp { 0% { opacity: 0; transform: rotate(-8deg) scale(2.6); } 60% { opacity: 1; transform: rotate(-8deg) scale(0.92); } 80% { transform: rotate(-8deg) scale(1.06); } 100% { opacity: 1; transform: rotate(-8deg) scale(1); } }
  .fm-anim-1 { animation: fmFade 0.55s ease 0.15s both; }
  .fm-anim-2 { animation: fmFade 0.5s ease 0.7s both; }
  .fm-anim-3 { animation: fmFade 0.45s ease 1.0s both; }
  .fm-anim-4 { animation: fmFade 0.45s ease 1.25s both; }
  .fm-anim-5 { animation: fmFade 0.45s ease 1.5s both; }
  .fm-stamp { width: 60px; height: 60px; border: 2px solid rgba(61,92,60,0.45); border-radius: 50%; display: flex; align-items: center; justify-content: center; animation: fmStamp 0.55s cubic-bezier(0.2,1.4,0.4,1) 1.9s both; }
  .fm-stamp-text { font-family: 'DM Mono', monospace; font-size: 6px; letter-spacing: 0.6px; color: #3D5C3C; line-height: 1.5; text-align: center; }
  .fm-progress-mark { width: 52px; height: 52px; border: 1.5px dashed rgba(0,0,0,0.18); border-radius: 50%; display: flex; align-items: center; justify-content: center; }

  .fm-scan { display: flex; gap: 16px; align-items: center; position: relative; }
  @media (max-width: 540px) { .fm-scan { flex-direction: column; align-items: stretch; } .fm-ring-wrap { margin: 0 auto; } }
  .fm-ring-wrap { position: relative; width: 104px; height: 104px; flex-shrink: 0; }
  .fm-ring-label { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .fm-ring-num { font-family: 'Fraunces', serif; font-size: 28px; font-weight: 300; line-height: 1; color: #1C1C1C; }
  .fm-ring-sub { font-size: 8px; text-transform: uppercase; letter-spacing: 1px; color: #9A927E; margin-top: 3px; }
  .fm-dist { flex: 1; }
  .fm-dist-row { display: flex; align-items: center; gap: 10px; margin-bottom: 9px; }
  .fm-dist-row:last-child { margin-bottom: 0; }
  .fm-dist-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; width: 42px; }
  .fm-dist-track { flex: 1; height: 4px; background: rgba(0,0,0,0.06); border-radius: 2px; overflow: hidden; }
  .fm-dist-fill { height: 4px; border-radius: 2px; transition: width 0.7s ease; }
  .fm-dist-count { font-family: 'DM Mono', monospace; font-size: 11px; color: #9A927E; width: 20px; text-align: right; }

  /* SECTIONS */
  .fm-section { background: transparent; border: none; border-radius: 0; padding: 0; margin-bottom: 18px; }
  .fm-section.empty { opacity: 0.55; }
  .fm-sec-head { display: flex; align-items: baseline; gap: 8px; margin-bottom: 6px; }
  .fm-sec-dot { display: none; }
  .fm-sec-name { font-family: 'Fraunces', serif; font-size: 16px; font-weight: 400; text-transform: none; letter-spacing: 0; }
  .fm-sec-name.safe { color: #137663; }
  .fm-sec-name.limit { color: #9A5E0B; }
  .fm-sec-name.avoid { color: #B03434; }
  .fm-sec-desc { font-size: 11px; color: #7A7A72; margin-left: 4px; }
  .fm-sec-line { flex: 1; border-bottom: 1px dotted rgba(0,0,0,0.15); height: auto; background: none; align-self: center; }
  .fm-sec-count { font-family: 'DM Mono', monospace; font-size: 7.5px; letter-spacing: 0.8px; color: #9A927E; }

  .fm-grid { display: flex; flex-direction: column; gap: 0; }
  .fm-chip { border-radius: 0; padding: 9px 3px; display: flex; align-items: center; justify-content: space-between; gap: 8px; border-bottom: 1px solid rgba(0,0,0,0.05); animation: fmRow 0.4s ease both; }
  .fm-chip:last-child { border-bottom: none; }
  .fm-chip::before { content: ''; width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }
  .fm-chip.safe::before { background: #2C9D8A; }
  .fm-chip.limit::before { background: #E8941F; }
  .fm-chip.avoid::before { background: #D64545; }
  .fm-chip.empty::before { display: none; }
  .fm-chip.safe, .fm-chip.limit, .fm-chip.avoid { background: transparent; border-left: none; border-right: none; border-top: none; }
  .fm-chip.empty { background: #FAF8F4; border: 1px dashed rgba(0,0,0,0.1); justify-content: center; }
  .fm-chip-name { font-size: 12.5px; font-weight: 400; color: #1C1C1C; }
  .fm-chip-empty-text { font-size: 12px; color: #7A7A72; }
  .fm-chip-val { font-family: 'DM Mono', monospace; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.3px; }
  .fm-chip.safe .fm-chip-val { color: #2D6B42; }
  .fm-chip.limit .fm-chip-val { color: #9A5F1A; }
  .fm-chip.avoid .fm-chip-val { color: #8B2E2E; }

  /* FLAGGED AWAITING */
  .fm-flagged { background: white; border: 1px solid rgba(0,0,0,0.07); border-radius: 16px; padding: 18px 20px; margin-bottom: 12px; }
  .fm-flagged-item { display: flex; align-items: center; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid rgba(0,0,0,0.04); font-size: 13px; }
  .fm-flagged-item:last-child { border-bottom: none; }
  .fm-flagged-left { display: flex; align-items: center; gap: 9px; }
  .fm-flagged-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .fm-flagged-status { font-family: 'DM Mono', monospace; font-size: 9.5px; color: #7A7A72; text-transform: uppercase; letter-spacing: 0.4px; }

  /* NO SENSITIVITY */
  .fm-nosens { background: white; border: 1px solid rgba(0,0,0,0.07); border-radius: 16px; padding: 18px 20px; margin-bottom: 12px; }
  .fm-nosens-pills { display: flex; flex-wrap: wrap; gap: 6px; }
  .fm-nosens-pill { font-size: 12px; padding: 6px 12px; border-radius: 20px; background: #FAF8F4; color: #7A7A72; border: 1px solid rgba(0,0,0,0.07); }

  /* FOOTER */
  @media (max-width: 540px) { .fm-footer { flex-direction: column; align-items: stretch; text-align: center; } }
  .fm-verify { font-family: 'DM Mono', monospace; font-size: 9.5px; color: rgba(255,255,255,0.3); letter-spacing: 0.5px; line-height: 1.7; }
  .fm-share-btn { background: #8BAE8A; color: #0E0E0C; border: none; border-radius: 9px; padding: 11px 18px; font-size: 13px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; white-space: nowrap; transition: opacity 0.15s; }
  .fm-share-btn:hover { opacity: 0.88; }

  /* EMPTY STATE */
  .fm-empty-state { background: white; border: 1px solid rgba(0,0,0,0.07); border-radius: 18px; padding: 44px 28px; text-align: center; max-width: 480px; margin: 40px auto; }
  .fm-empty-icon { width: 52px; height: 52px; border-radius: 14px; background: #EDF3ED; display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; }
  .fm-empty-title { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 300; margin-bottom: 10px; }
  .fm-empty-title em { font-style: italic; color: #3D5C3C; }
  .fm-empty-sub { font-size: 13px; color: #7A7A72; line-height: 1.7; margin-bottom: 20px; }
  .fm-info-card { background: #FAF8F4; border-radius: 12px; padding: 16px; text-align: left; }
  .fm-info-text { font-size: 13px; line-height: 1.7; color: #1C1C1C; }
`

export default function FoodMap({ session, profile, labResult }) {
  const [foodMap, setFoodMap] = useState([])
  const [activeCycle, setActiveCycle] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFoodMap()
  }, [])

  const loadFoodMap = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('food_map')
        .select('*')
        .eq('user_id', session.user.id)
        .order('updated_at', { ascending: false })
      if (data) setFoodMap(data)
      const { data: active } = await supabase
        .from('reintroduction_results')
        .select('food, started_at, exposure_days_completed, washout_started_at')
        .eq('user_id', session.user.id)
        .is('verdict', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      setActiveCycle(active || null)
    } catch (e) {}
    setLoading(false)
  }

  const safeFoods = foodMap.filter(f => f.verdict === 'Safe')
  const limitFoods = foodMap.filter(f => f.verdict === 'Limit')
  const avoidFoods = foodMap.filter(f => f.verdict === 'Avoid')

  const flaggedFoods = labResult?.foods?.filter(f =>
    (f.level === 'High' || f.level === 'Moderate' || f.level === 'Low') &&
    !foodMap.find(m => m.food?.toLowerCase() === f.name?.toLowerCase())
  ) || []

  const noSensitivityFoods = labResult?.foods?.filter(f => f.level === 'No sensitivity') || []

  // Testing-order helpers for the elimination manifest.
  const [freqOverrides, setFreqOverrides] = useState({})
  const [confirmAdd, setConfirmAdd] = useState(null) // food object pending confirm
  const foodFrequency = { ...(profile?.food_frequency || {}), ...freqOverrides }
  const FREQ_RANK = { 'daily': 1, '3-5x': 2, '1-2x': 3, 'rarely': 4, 'never': 5 }
  const FREQ_TAG = { 'daily': 'EATEN DAILY', '3-5x': '3–5X / WEEK', '1-2x': '1–2X / WEEK', 'rarely': 'RARELY', 'never': 'NEVER' }
  const isCommonTrack = profile?.protocol_track === 'common'
  const qualifying = (level) => {
    if (!labResult?.foods) return []
    const pool = isCommonTrack
      ? (level === 'Low' ? labResult.foods : [])
      : labResult.foods.filter(f => f.level === level)
    return pool
      .filter(f => foodFrequency[f.name] !== 'never')
      .filter(f => !foodMap.some(m => m.food === f.name))
      .sort((a, b) => (FREQ_RANK[foodFrequency[a.name]] || 99) - (FREQ_RANK[foodFrequency[b.name]] || 99))
  }
  const notScheduled = (labResult?.foods || []).filter(f => foodFrequency[f.name] === 'never' && f.level !== 'No sensitivity')
  const addToPlan = async (food) => {
    const updated = { ...foodFrequency, [food.name]: 'rarely' }
    setFreqOverrides(prev => ({ ...prev, [food.name]: 'rarely' }))
    setConfirmAdd(null)
    try { await supabase.from('profiles').update({ food_frequency: updated }).eq('id', session.user.id) } catch (e) {}
  }
  const manifestTiers = (isCommonTrack
    ? [{ key: 'Low', day: 57, title: 'Your test foods', chip: '#EDF3ED', chipText: '#3D5C3C', accent: '#3D5C3C' }]
    : [
      { key: 'Low', day: 57, title: 'Low — tests first', chip: '#EDF3ED', chipText: '#3D5C3C', accent: '#3D5C3C' },
      { key: 'Moderate', day: 113, title: 'Moderate', chip: '#FBEFD8', chipText: '#9A6212', accent: '#9A6212' },
      { key: 'High', day: 169, title: 'High — tests last', chip: '#FBE9E9', chipText: '#A32D2D', accent: '#A32D2D' },
    ]).map(t => ({ ...t, foods: qualifying(t.key) })).filter(t => t.foods.length > 0)
  const manifestTotal = manifestTiers.reduce((a, t) => a + t.foods.length, 0)

  const name = profile?.full_name?.split(' ')[0] || 'Your'
  const programNotStarted = !profile?.program_phase || profile?.program_phase === 'awaiting_results'
  const hasNoResults = !labResult || labResult.status === 'pending_review'
  const totalTested = foodMap.length
  const completedDate = foodMap.length > 0 ? new Date(Math.max(...foodMap.map(f => new Date(f.updated_at)))).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : null

  // Protocol day count for the metadata readout
  const protocolDays = protocolDay(profile?.protocol_start_date)
  const isComplete = profile?.program_phase === 'complete'
  const memberId = session?.user?.id ? `SF-${session.user.id.slice(0, 4).toUpperCase()}-${session.user.id.slice(4, 8).toUpperCase()}` : 'SF-0000'

  // Reaction label from stored reintro data if present
  const reactionLabel = (f) => {
    const dayEarned = (() => {
      try {
        if (!profile?.protocol_start_date || !f.updated_at) return null
        const [y, m, d] = String(profile.protocol_start_date).split('T')[0].split('-').map(Number)
        const start = new Date(y, m - 1, d)
        const upd = new Date(f.updated_at)
        const dd = Math.floor((new Date(upd.getFullYear(), upd.getMonth(), upd.getDate()) - start) / 86400000) + 1
        return dd > 0 ? dd : null
      } catch (e) { return null }
    })()
    const pre = dayEarned ? `DAY ${dayEarned} · ` : ''
    if (f.verdict === 'Safe') return pre + 'NO REACTION'
    if (f.verdict === 'Limit') return pre + 'MILD, DOSE-LINKED'
    if (f.verdict === 'Avoid') return pre + 'SYMPTOMS CONFIRMED'
    return ''
  }

  // Segmented ring math
  const ringTotal = Math.max(totalTested, 1)
  const C = 2 * Math.PI * 44 // circumference at r=44
  const gap = totalTested > 1 ? 4 : 0
  const seg = (count) => Math.max((count / ringTotal) * C - gap, 0)
  const safeLen = seg(safeFoods.length)
  const limitLen = seg(limitFoods.length)
  const avoidLen = seg(avoidFoods.length)
  const limitOffset = -((safeFoods.length / ringTotal) * C)
  const avoidOffset = -(((safeFoods.length + limitFoods.length) / ringTotal) * C)

  if (loading) return (
    <div className="fm-wrap">
      <style>{css}</style>
      <div className="fm-loading">Loading your Food Map...</div>
    </div>
  )

  if (hasNoResults) return (
    <div className="fm-wrap">
      <style>{css}</style>
      <div className="fm-content">

        {/* THE BLANK CERTIFICATE — same document, earliest era. It exists from day zero, waiting to be written. */}
        <div className="fm-cert">
          <div className="fm-serial">NO. 0001</div>

          <div className="fm-anim-1" style={{ textAlign: 'center', marginBottom: 6 }}>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '7.5px', letterSpacing: '2.2px', color: '#9A927E', marginBottom: 7, textTransform: 'uppercase' }}>SENSIFY · {programNotStarted ? 'AWAITING LAB RESULTS' : 'RESULTS IN REVIEW'}</div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div className="fm-title-type" style={{ fontFamily: 'Fraunces, serif', fontSize: '32px', fontWeight: 380, color: '#2A2620', letterSpacing: '0.2px', fontVariationSettings: "'SOFT' 60, 'WONK' 1", animationTimingFunction: `steps(${(name + "'s Food Map").length})` }}>{name}'s Food Map<span className="fm-title-caret"></span></div>
            </div>
            <div className="fm-gold-rule"></div>
          </div>
          <div className="fm-anim-2" style={{ textAlign: 'center', fontFamily: 'DM Mono, monospace', fontSize: '7.5px', letterSpacing: '0.8px', color: '#9A927E', marginBottom: 18 }}>
            NO FOODS TESTED YET · PROTOCOL NOT STARTED
          </div>

          {[
            { label: 'Safe', color: '#137663', mark: '#2C9D8A', sub: 'EAT FREELY', sample: 'Almond', ev: 'DAY 71 · NO REACTION' },
            { label: 'Limit', color: '#9A5E0B', mark: '#E8941F', sub: 'SMALL AMOUNTS', sample: 'Coffee', ev: 'DAY 113 · MILD, DOSE-LINKED' },
            { label: 'Avoid', color: '#B03434', mark: '#D64545', sub: 'CONFIRMED TRIGGERS', sample: 'Dairy', ev: 'DAY 85 · SYMPTOMS CONFIRMED' },
          ].map((tier, ti) => (
            <div key={tier.label} className={`fm-anim-${ti + 3}`} style={{ marginBottom: 15 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                <span style={{ fontFamily: 'Fraunces, serif', fontSize: '19px', color: tier.color }}>{tier.label}</span>
                <span style={{ flex: 1, borderBottom: '1px dotted rgba(0,0,0,0.15)', alignSelf: 'center' }}></span>
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '7.5px', letterSpacing: '0.8px', color: '#9A927E' }}>{tier.sub}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 2px', opacity: 0.45, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: tier.mark, flexShrink: 0 }}></span>
                  <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#1C1C1C' }}>{tier.sample}</span>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '6px', letterSpacing: '0.7px', color: '#9A927E', border: '1px solid rgba(0,0,0,0.14)', borderRadius: 8, padding: '1.5px 6px' }}>EXAMPLE</span>
                </div>
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '7px', letterSpacing: '0.6px', color: '#8A8474' }}>{tier.ev}</span>
              </div>
              <div className="fm-ghost-row"><span className="fm-ghost-mark" style={{ borderColor: tier.mark, opacity: 0.4 }}></span><span className="fm-ghost-line"></span></div>
              <div className="fm-ghost-row"><span className="fm-ghost-mark" style={{ borderColor: tier.mark, opacity: 0.4 }}></span><span className="fm-ghost-line"></span></div>
            </div>
          ))}

          <div className="fm-anim-5" style={{ textAlign: 'center', fontSize: '12.5px', color: '#8A8474', lineHeight: 1.6, margin: '4px auto 6px', maxWidth: 340 }}>
            The faded rows are examples of what an earned verdict looks like. Your lab results write the real first entries, your body earns every one after that.
          </div>

          <div className="fm-anim-5" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 18, paddingTop: 14, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '7px', letterSpacing: '1px', color: '#9A927E' }}>EVERY VERDICT EARNED ON YOUR BODY</div>
            <div className="fm-stamp-progress"><div className="fm-stamp-progress-text">IN<br />PROGRESS<br />·</div></div>
          </div>
        </div>

      </div>
    </div>
  )

  return (
    <div className="fm-wrap">
      <style>{css}</style>
      <div className="fm-content">

        {/* THE CERTIFICATE — mirrors the approved mock exactly */}
        <div className="fm-cert">
          <div className="fm-serial">NO. 0001</div>

          <div className="fm-anim-1" style={{ textAlign: 'center', marginBottom: 6 }}>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '7.5px', letterSpacing: '2.2px', color: '#9A927E', marginBottom: 7, textTransform: 'uppercase' }}>SENSIFY · {isComplete ? 'VERIFIED RESULT' : (protocolDays > 0 && protocolDays <= 56) ? 'IN CALIBRATION' : 'IN PROGRESS'}</div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div className="fm-title-type" style={{ fontFamily: 'Fraunces, serif', fontSize: '32px', fontWeight: 380, color: '#2A2620', letterSpacing: '0.2px', fontVariationSettings: "'SOFT' 60, 'WONK' 1", animationTimingFunction: `steps(${(name + "'s Food Map").length})` }}>{name}'s Food Map<span className="fm-title-caret"></span></div>
            </div>
            <div className="fm-gold-rule"></div>
          </div>
          <div className="fm-anim-2" style={{ textAlign: 'center', fontFamily: 'DM Mono, monospace', fontSize: '7.5px', letterSpacing: '0.8px', color: '#9A927E', marginBottom: 18 }}>
            {totalTested} OF {Math.max(manifestTotal + totalTested, totalTested) || totalTested} FOODS TESTED{protocolDays > 0 ? ` · DAY ${protocolDays}` : ''}{completedDate ? ` · ${completedDate.toUpperCase()}` : ''}
          </div>

          {activeCycle && (
            <div className="fm-anim-3 fm-testing-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 12px', marginBottom: 16, border: '1px solid rgba(232,148,31,0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#E8941F', boxShadow: '0 0 10px rgba(232,148,31,0.6)' }}></span>
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#9A5E0B' }}>{activeCycle.food}</span>
              </div>
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '7.5px', letterSpacing: '0.8px', color: '#9A5E0B' }}>
                NOW TESTING · {(activeCycle.exposure_days_completed || 0) < 3 ? `EXPOSURE ${Math.min((activeCycle.exposure_days_completed || 0) + 1, 3)} OF 3` : 'WASHOUT'} · VERDICT PENDING
              </span>
            </div>
          )}

          {[
            { key: 'safe', label: 'Safe', sub: totalTested === 0 ? 'EAT FREELY' : `${safeFoods.length} EARNED`, subPre: totalTested === 0 ? null : 'EAT FREELY · ', color: '#137663', mark: '#2C9D8A', foods: safeFoods, empty: 'Awaiting first clean reintroduction' },
            { key: 'limit', label: 'Limit', sub: totalTested === 0 ? 'SMALL AMOUNTS' : `${limitFoods.length} EARNED`, subPre: totalTested === 0 ? null : 'SMALL AMOUNTS · ', color: '#9A5E0B', mark: '#E8941F', foods: limitFoods, empty: 'No dose-linked verdicts yet' },
            { key: 'avoid', label: 'Avoid', sub: totalTested === 0 ? 'CONFIRMED TRIGGERS' : `${avoidFoods.length} CONFIRMED`, subPre: null, color: '#B03434', mark: '#D64545', foods: avoidFoods, empty: 'No confirmed triggers yet' },
          ].map((tier, ti) => (
            <div key={tier.key} className={`fm-anim-${ti + 3}`} style={{ marginBottom: 15 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                <span style={{ fontFamily: 'Fraunces, serif', fontSize: '19px', color: tier.color }}>{tier.label}</span>
                <span style={{ flex: 1, borderBottom: '1px dotted rgba(0,0,0,0.15)', alignSelf: 'center' }}></span>
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '7.5px', letterSpacing: '0.8px', color: '#9A927E' }}>{tier.subPre || ''}{tier.sub}</span>
              </div>
              {tier.foods.length > 0 ? tier.foods.map((f, fi) => (
                <div key={fi} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 2px', borderBottom: fi < tier.foods.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none', animation: `fmRow 0.4s ease ${1.1 + ti * 0.25 + fi * 0.12}s both` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: tier.mark, flexShrink: 0 }}></span>
                    <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#1C1C1C' }}>{f.food}</span>
                  </div>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '7px', letterSpacing: '0.6px', color: '#8A8474' }}>{reactionLabel(f)}</span>
                </div>
              )) : (
                <>
                  <div className="fm-ghost-row"><span className="fm-ghost-mark"></span><span className="fm-ghost-line"></span></div>
                  <div className="fm-ghost-row"><span className="fm-ghost-mark"></span><span className="fm-ghost-line"></span><span style={{ fontFamily: 'DM Mono, monospace', fontSize: '7px', letterSpacing: '0.7px', color: '#C9C2B0' }}>{tier.empty.toUpperCase()}</span></div>
                </>
              )}
            </div>
          ))}

          {manifestTotal > 0 && (
            <div className="fm-anim-5" style={{ marginTop: 4, marginBottom: 15 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                <span style={{ fontFamily: 'Fraunces, serif', fontSize: '15px', color: '#1C1C1C' }}>Testing schedule</span>
                <span style={{ flex: 1, borderBottom: '1px dotted rgba(0,0,0,0.15)', alignSelf: 'center' }}></span>
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '7.5px', letterSpacing: '0.8px', color: '#9A927E' }}>{totalTested === 0 ? 'FIRST VERDICTS ~DAY 71' : `${manifestTotal} REMAINING`}</span>
              </div>
              {(() => { let n = 0; return manifestTiers.map((mt, mi) => mt.foods.map((f, fi) => { n += 1; return (
                <div key={`${mi}-${fi}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 2px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '8px', color: '#C9C2B0', width: 16 }}>{String(n).padStart(2, '0')}</span>
                    <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#1C1C1C' }}>{f.name}</span>
                  </div>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '7px', letterSpacing: '0.5px', color: protocolDays >= mt.day ? '#3D5C3C' : '#9A927E', fontWeight: protocolDays >= mt.day ? 700 : 400 }}>{protocolDays >= mt.day ? 'UNLOCKED' : (mt.day - protocolDays) === 1 ? 'UNLOCKS TOMORROW' : `IN ${mt.day - protocolDays} DAYS`}</span>
                </div>
              ) }) ) })()}
            </div>
          )}

          {notScheduled.length > 0 && (
            <div style={{ marginBottom: 15 }}>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '7px', letterSpacing: '0.8px', color: '#B8B0A0', marginBottom: 6 }}>NOT SCHEDULED — YOU TOLD US YOU NEVER EAT THESE</div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {notScheduled.map(f => (
                  <button key={f.name} onClick={() => setConfirmAdd(f)} style={{ background: 'rgba(0,0,0,0.04)', color: '#8A8474', borderRadius: 12, padding: '4px 10px', fontSize: '11px', border: '1px dashed rgba(0,0,0,0.12)', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>{f.name}</button>
                ))}
              </div>
              {confirmAdd && (
                <div style={{ marginTop: 8, padding: '10px 12px', background: 'rgba(0,0,0,0.03)', borderRadius: 8 }}>
                  <div style={{ fontSize: '11.5px', color: '#1C1C1C', marginBottom: 8 }}>Add <strong>{confirmAdd.name}</strong> to your testing plan?</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => addToPlan(confirmAdd)} style={{ background: '#3D5C3C', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 13px', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Add to plan</button>
                    <button onClick={() => setConfirmAdd(null)} style={{ background: 'rgba(0,0,0,0.05)', color: '#7A7A72', border: 'none', borderRadius: 7, padding: '6px 13px', fontSize: '11.5px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="fm-anim-5" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 20, paddingTop: 14, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '7px', letterSpacing: '1px', color: '#9A927E' }}>EVERY VERDICT EARNED ON YOUR BODY</div>
            {isComplete ? (
              <div className="fm-stamp"><div className="fm-stamp-text">SENSIFY<br />VERIFIED<br />·</div></div>
            ) : (
              <div className="fm-stamp-progress"><div className="fm-stamp-progress-text">IN<br />PROGRESS<br />·</div></div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
