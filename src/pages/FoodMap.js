import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Fraunces:ital,wght@0,300;0,500;1,300&display=swap');

  .fm-wrap { min-height: 100vh; background: #FAF8F4; font-family: 'DM Sans', sans-serif; color: #1C1C1C; }
  .fm-content { max-width: 680px; margin: 0 auto; padding: 24px 20px 60px; }

  .fm-header { background: #1C1C1C; border-radius: 18px; padding: 26px; margin-bottom: 14px; color: white; }
  .fm-header-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 18px; }
  .fm-logo { font-family: 'Fraunces', serif; font-size: 15px; font-weight: 300; opacity: 0.45; letter-spacing: -0.2px; }
  .fm-logo em { font-style: italic; }
  .fm-complete-badge { font-size: 10px; font-weight: 600; letter-spacing: 0.6px; text-transform: uppercase; background: rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 20px; opacity: 0.65; }
  .fm-name { font-family: 'Fraunces', serif; font-size: 30px; font-weight: 300; letter-spacing: -0.5px; margin-bottom: 4px; line-height: 1.2; }
  .fm-name em { font-style: italic; color: #8BAE8A; }
  .fm-subtitle { font-size: 12px; opacity: 0.4; margin-bottom: 20px; }
  .fm-summary { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 9px; }
  .fm-sum-card { background: rgba(255,255,255,0.06); border-radius: 11px; padding: 13px; text-align: center; }
  .fm-sum-num { font-family: 'Fraunces', serif; font-size: 26px; font-weight: 300; line-height: 1; margin-bottom: 4px; }
  .fm-sum-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.45; }
  .fm-sum-card.safe .fm-sum-num { color: #6DBF8A; }
  .fm-sum-card.limit .fm-sum-num { color: #D4894A; }
  .fm-sum-card.avoid .fm-sum-num { color: #E07070; }

  .fm-section { background: #FFFFFF; border: 1px solid rgba(0,0,0,0.07); border-radius: 16px; overflow: hidden; margin-bottom: 10px; }
  .fm-section.empty { opacity: 0.5; }
  .fm-section-header { display: flex; align-items: center; justify-content: space-between; padding: 15px 18px; border-bottom: 1px solid rgba(0,0,0,0.06); }
  .fm-section-left { display: flex; align-items: center; gap: 12px; }
  .fm-icon { width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 15px; }
  .fm-icon.safe { background: #EAF4EE; }
  .fm-icon.limit { background: #FDF2EA; }
  .fm-icon.avoid { background: #FAEAEA; }
  .fm-section-title { font-size: 15px; font-weight: 500; margin-bottom: 2px; }
  .fm-section-title.safe { color: #2D6B42; }
  .fm-section-title.limit { color: #9A5F1A; }
  .fm-section-title.avoid { color: #8B2E2E; }
  .fm-section-desc { font-size: 12px; color: #7A7A72; }
  .fm-count { font-size: 12px; color: #7A7A72; font-weight: 500; }
  .fm-pills { padding: 14px 18px; display: flex; flex-wrap: wrap; gap: 8px; }
  .fm-pill { font-size: 13px; font-weight: 500; padding: 7px 14px; border-radius: 22px; letter-spacing: -0.1px; }
  .fm-pill.safe { background: #EAF4EE; color: #2D6B42; }
  .fm-pill.limit { background: #FDF2EA; color: #9A5F1A; }
  .fm-pill.avoid { background: #FAEAEA; color: #8B2E2E; }
  .fm-pill.empty { background: #FAF8F4; color: #7A7A72; border: 1.5px dashed rgba(0,0,0,0.1); font-size: 12px; font-weight: 400; }

  .fm-flagged { background: #FFFFFF; border: 1px solid rgba(0,0,0,0.07); border-radius: 16px; overflow: hidden; margin-bottom: 10px; opacity: 0.75; }
  .fm-flagged-header { padding: 11px 18px; background: #FAF8F4; border-bottom: 1px solid rgba(0,0,0,0.06); font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; color: #7A7A72; }
  .fm-flagged-item { display: flex; align-items: center; justify-content: space-between; padding: 11px 18px; font-size: 13px; }
  .fm-flagged-item + .fm-flagged-item { border-top: 1px solid rgba(0,0,0,0.04); }
  .fm-flagged-left { display: flex; align-items: center; gap: 10px; }
  .fm-flagged-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .fm-flagged-right { display: flex; align-items: center; gap: 8px; }
  .fm-flagged-status { font-size: 11px; color: #7A7A72; font-style: italic; }
  .fm-badge { font-size: 10px; font-weight: 600; padding: 3px 9px; border-radius: 20px; }
  .fm-badge.high { background: #FAEAEA; color: #8B2E2E; }
  .fm-badge.moderate { background: #FDF2EA; color: #9A5F1A; }
  .fm-badge.low { background: #EAF4EE; color: #2D6B42; }

  .fm-no-sensitivity { background: #FFFFFF; border: 1px solid rgba(0,0,0,0.07); border-radius: 16px; overflow: hidden; margin-bottom: 10px; opacity: 0.6; }

  .fm-footer { background: #FFFFFF; border: 1px solid rgba(0,0,0,0.07); border-radius: 14px; padding: 16px 18px; display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 6px; }
  .fm-footer-text { font-size: 12px; color: #7A7A72; line-height: 1.6; flex: 1; }
  .fm-share-btn { background: #1C1C1C; color: white; border: none; border-radius: 9px; padding: 9px 18px; font-size: 12px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; white-space: nowrap; flex-shrink: 0; transition: opacity 0.15s; }
  .fm-share-btn:hover { opacity: 0.85; }

  .fm-empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 56px 24px; text-align: center; }
  .fm-empty-icon { width: 56px; height: 56px; background: #EDF3ED; border-radius: 18px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
  .fm-empty-title { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 300; margin-bottom: 8px; }
  .fm-empty-title em { font-style: italic; color: #3D5C3C; }
  .fm-empty-sub { font-size: 13px; color: #7A7A72; line-height: 1.7; max-width: 280px; margin: 0 auto 24px; }
  .fm-info-card { background: #EDF3ED; border-radius: 12px; padding: 14px 16px; }
  .fm-info-text { font-size: 13px; color: #3D5C3C; line-height: 1.75; }

  .fm-loading { display: flex; align-items: center; justify-content: center; min-height: 60vh; font-size: 14px; color: #7A7A72; font-family: 'Fraunces', serif; font-style: italic; }
`

export default function FoodMap({ session, profile, labResult }) {
  const [foodMap, setFoodMap] = useState([])
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

  const name = profile?.full_name?.split(' ')[0] || 'Your'
  const programNotStarted = !profile?.program_phase || profile?.program_phase === 'awaiting_results'
  const hasNoResults = !labResult || labResult.status === 'pending_review'
  const totalTested = foodMap.length
  const completedDate = foodMap.length > 0 ? new Date(Math.max(...foodMap.map(f => new Date(f.updated_at)))).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : null

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
        <div className="fm-empty-state">
          <div className="fm-empty-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3D5C3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
          </div>
          <div className="fm-empty-title">Your Food Map is <em>waiting.</em></div>
          <div className="fm-empty-sub">
            {programNotStarted
              ? 'Upload your lab results and start your elimination protocol to begin building your personal Food Map.'
              : 'Your Food Map will start filling in as you complete reintroductions. Each verdict gets added here automatically.'}
          </div>
          <div className="fm-info-card">
            <div className="fm-info-text">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2D6B42', flexShrink: 0 }}></div>
                  <span><strong>Safe</strong> — tested and tolerated. Eat freely.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#9A5F1A', flexShrink: 0 }}></div>
                  <span><strong>Limit</strong> — fine in small amounts. Be mindful.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8B2E2E', flexShrink: 0 }}></div>
                  <span><strong>Avoid</strong> — clear, repeatable trigger confirmed.</span>
                </div>
                <div style={{ marginTop: '4px', paddingTop: '8px', borderTop: '1px solid rgba(61,92,60,0.15)', fontSize: '12px', opacity: 0.8 }}>Every category is earned through structured testing — not lab guesswork.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="fm-wrap">
      <style>{css}</style>
      <div className="fm-content">

        {/* DARK HEADER */}
        <div className="fm-header">
          <div className="fm-header-top">
            <div className="fm-logo">sensi<em>fy</em></div>
            <div className="fm-complete-badge">
              {totalTested > 0 ? `${totalTested} food${totalTested !== 1 ? 's' : ''} tested` : 'In progress'}
            </div>
          </div>
          <div className="fm-name"><em>{name}'s</em> Food Map.</div>
          <div className="fm-subtitle">
            {completedDate ? `Last updated ${completedDate}` : 'Building as reintroductions complete'} · 6-month elimination & reintroduction protocol
          </div>
          <div className="fm-summary">
            <div className="fm-sum-card safe">
              <div className="fm-sum-num">{safeFoods.length}</div>
              <div className="fm-sum-label">Safe</div>
            </div>
            <div className="fm-sum-card limit">
              <div className="fm-sum-num">{limitFoods.length}</div>
              <div className="fm-sum-label">Limit</div>
            </div>
            <div className="fm-sum-card avoid">
              <div className="fm-sum-num">{avoidFoods.length}</div>
              <div className="fm-sum-label">Avoid</div>
            </div>
          </div>
        </div>

        {/* SAFE */}
        <div className={`fm-section${safeFoods.length === 0 ? ' empty' : ''}`}>
          <div className="fm-section-header">
            <div className="fm-section-left">
              <div className="fm-icon safe">
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#2D6B42' }}></div>
              </div>
              <div>
                <div className="fm-section-title safe">Safe</div>
                <div className="fm-section-desc">Tested and tolerated. Eat freely.</div>
              </div>
            </div>
            <div className="fm-count">{safeFoods.length} food{safeFoods.length !== 1 ? 's' : ''}</div>
          </div>
          <div className="fm-pills">
            {safeFoods.length > 0
              ? safeFoods.map((f, i) => <div key={i} className="fm-pill safe">{f.food}</div>)
              : <div className="fm-pill empty">No safe foods confirmed yet</div>}
          </div>
        </div>

        {/* LIMIT */}
        <div className={`fm-section${limitFoods.length === 0 ? ' empty' : ''}`}>
          <div className="fm-section-header">
            <div className="fm-section-left">
              <div className="fm-icon limit">
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#9A5F1A' }}></div>
              </div>
              <div>
                <div className="fm-section-title limit">Limit</div>
                <div className="fm-section-desc">Dose-sensitive. Fine in small amounts.</div>
              </div>
            </div>
            <div className="fm-count">{limitFoods.length} food{limitFoods.length !== 1 ? 's' : ''}</div>
          </div>
          <div className="fm-pills">
            {limitFoods.length > 0
              ? limitFoods.map((f, i) => <div key={i} className="fm-pill limit">{f.food}</div>)
              : <div className="fm-pill empty">No limit foods confirmed yet</div>}
          </div>
        </div>

        {/* AVOID */}
        <div className={`fm-section${avoidFoods.length === 0 ? ' empty' : ''}`}>
          <div className="fm-section-header">
            <div className="fm-section-left">
              <div className="fm-icon avoid">
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#8B2E2E' }}></div>
              </div>
              <div>
                <div className="fm-section-title avoid">Avoid</div>
                <div className="fm-section-desc">Clear trigger confirmed. Skip it.</div>
              </div>
            </div>
            <div className="fm-count">{avoidFoods.length} food{avoidFoods.length !== 1 ? 's' : ''}</div>
          </div>
          <div className="fm-pills">
            {avoidFoods.length > 0
              ? avoidFoods.map((f, i) => <div key={i} className="fm-pill avoid">{f.food}</div>)
              : <div className="fm-pill empty">No trigger foods confirmed yet</div>}
          </div>
        </div>

        {/* FLAGGED NOT YET TESTED */}
        {flaggedFoods.length > 0 && (
          <div className="fm-flagged">
            <div className="fm-flagged-header">Flagged — awaiting reintroduction ({flaggedFoods.length})</div>
            {flaggedFoods.map((f, i) => (
              <div key={i} className="fm-flagged-item">
                <div className="fm-flagged-left">
                  <div className="fm-flagged-dot" style={{ background: f.level === 'High' ? '#C95B5B' : f.level === 'Moderate' ? '#D4894A' : '#4A8C6A' }} />
                  {f.name}
                </div>
                <div className="fm-flagged-right">
                  <div className="fm-flagged-status">Awaiting reintroduction</div>
                  <div className={`fm-badge ${f.level.toLowerCase()}`}>{f.level}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* NO SENSITIVITY */}
        {noSensitivityFoods.length > 0 && (
          <div className="fm-no-sensitivity">
            <div className="fm-section-header">
              <div className="fm-section-left">
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#FAF8F4', border: '1px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(0,0,0,0.15)' }}></div>
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 500, color: '#7A7A72', marginBottom: '2px' }}>No sensitivity detected</div>
                  <div style={{ fontSize: '12px', color: '#7A7A72' }}>Lab showed no reaction. Likely safe.</div>
                </div>
              </div>
              <div className="fm-count">{noSensitivityFoods.length} foods</div>
            </div>
            <div className="fm-pills">
              {noSensitivityFoods.map((f, i) => (
                <div key={i} style={{ fontSize: '13px', fontWeight: 500, padding: '7px 14px', borderRadius: '22px', background: '#FAF8F4', color: '#7A7A72', border: '1px solid rgba(0,0,0,0.07)' }}>{f.name}</div>
              ))}
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="fm-footer">
          <div className="fm-footer-text">Sensitivities can change over time. After completing your program you can retest any food in your Avoid list.</div>
          <button className="fm-share-btn">Share my Food Map →</button>
        </div>

      </div>
    </div>
  )
}
