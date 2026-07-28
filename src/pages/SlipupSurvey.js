import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { todayLocal } from '../utils/dateUtils'
import { generateSlipupMessage } from '../utils/aiInsights'

const s = {
  wrap: { minHeight: '100vh', background: 'transparent', display: 'flex', flexDirection: 'column' },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: '#FFFFFF', borderBottom: '1px solid rgba(0,0,0,0.08)' },
  logo: { fontFamily: 'Fraunces, serif', fontSize: '19px', fontWeight: 500, color: '#1C1C1C' },
  logoEm: { color: '#3D5C3C', fontStyle: 'italic' },
  back: { fontSize: '13px', color: '#7A7A72', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'DM Sans, sans-serif' },
  content: { flex: 1, padding: '28px 24px 100px' },
  eyebrow: { fontSize: '11px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: '#3D5C3C', marginBottom: '12px' },
  title: { fontFamily: 'Fraunces, serif', fontSize: '26px', fontWeight: 300, lineHeight: 1.2, marginBottom: '8px' },
  titleEm: { fontStyle: 'italic', color: '#3D5C3C' },
  hint: { fontSize: '13px', color: '#7A7A72', marginBottom: '28px', lineHeight: 1.65 },
  label: { fontSize: '14px', fontWeight: 500, marginBottom: '12px', lineHeight: 1.5 },
  searchInput: { width: '100%', border: '1.5px solid rgba(0,0,0,0.08)', borderRadius: '11px', padding: '13px 16px', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', color: '#1C1C1C', background: '#FFFFFF', outline: 'none', marginBottom: '10px' },
  foodList: { maxHeight: '200px', overflowY: 'auto', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '11px', background: '#FFFFFF', marginBottom: '20px' },
  foodItem: { padding: '11px 14px', borderBottom: '1px solid rgba(0,0,0,0.05)', fontSize: '14px', cursor: 'pointer', color: '#1C1C1C', transition: 'background 0.1s' },
  foodItemSelected: { padding: '11px 14px', borderBottom: '1px solid rgba(0,0,0,0.05)', fontSize: '14px', cursor: 'pointer', color: '#3D5C3C', background: '#EDF3ED', fontWeight: 500 },
  selectedPills: { display: 'flex', flexWrap: 'wrap', gap: '7px', marginBottom: '20px' },
  pill: { display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '20px', background: '#EDF3ED', fontSize: '13px', color: '#3D5C3C', fontWeight: 500 },
  pillRemove: { cursor: 'pointer', fontSize: '14px', color: '#8BAE8A', lineHeight: 1 },
  divider: { height: '1px', background: 'rgba(0,0,0,0.06)', margin: '24px 0' },
  reasonGrid: { display: 'flex', flexDirection: 'column', gap: '9px', marginBottom: '20px' },
  reasonBtn: { padding: '14px 16px', borderRadius: '11px', border: '1.5px solid rgba(0,0,0,0.08)', background: '#FFFFFF', fontSize: '14px', cursor: 'pointer', color: '#1C1C1C', fontFamily: 'DM Sans, sans-serif', textAlign: 'left', transition: 'all 0.12s' },
  reasonBtnOn: { padding: '14px 16px', borderRadius: '11px', border: '1.5px solid #3D5C3C', background: '#EDF3ED', fontSize: '14px', cursor: 'pointer', color: '#3D5C3C', fontFamily: 'DM Sans, sans-serif', textAlign: 'left', fontWeight: 500 },
  footer: { position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 24px', background: '#FAF8F4', borderTop: '1px solid rgba(0,0,0,0.06)' },
  cta: { background: '#3D5C3C', color: 'white', border: 'none', borderRadius: '11px', padding: '14px', width: '100%', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  ctaDisabled: { background: '#3D5C3C', color: 'white', border: 'none', borderRadius: '11px', padding: '14px', width: '100%', fontSize: '14px', fontWeight: 500, cursor: 'not-allowed', fontFamily: 'DM Sans, sans-serif', opacity: 0.35 },
  successWrap: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center' },
  successIcon: { width: '56px', height: '56px', background: '#EDF3ED', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' },
  successTitle: { fontFamily: 'Fraunces, serif', fontSize: '22px', fontWeight: 300, marginBottom: '10px' },
  successTitleEm: { fontStyle: 'italic', color: '#3D5C3C' },
  successMsg: { fontSize: '14px', color: '#7A7A72', lineHeight: 1.7, maxWidth: '280px', margin: '0 auto 28px' },
  infoCard: { background: '#EDF3ED', borderRadius: '11px', padding: '14px 16px', textAlign: 'left', width: '100%' },
  infoLabel: { fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#3D5C3C', marginBottom: '5px' },
  infoText: { fontSize: '13px', color: '#1C1C1C', lineHeight: 1.6 },
}

const COMMON_FOODS = [
  'Beef', 'Chicken', 'Pork', 'Lamb', 'Turkey', 'Salmon', 'Tuna', 'Shrimp',
  'Cow Milk', 'Cheese', 'Yogurt', 'Butter', 'Whey', 'Ice cream',
  'Wheat', 'Bread', 'Pasta', 'Gluten', 'Corn', 'Rice', 'Oats', 'Barley',
  'Almond', 'Cashew', 'Walnut', 'Peanut', 'Peanut butter', 'Pistachio',
  'Soy', 'Tofu', 'Edamame', 'Soy sauce',
  'Egg', 'Mayonnaise',
  'Tomato', 'Onion', 'Garlic', 'Mushroom', 'Potato',
  'Apple', 'Banana', 'Orange', 'Strawberry', 'Grapes',
  'Coffee', 'Alcohol', 'Sugar', 'Chocolate',
  'Restaurant food', 'Packaged snack', 'Fast food', 'Other',
]

const REASONS = [
  { id: 'intentional', label: 'Intentional — I chose to eat it' },
  { id: 'accidental', label: 'Accidental — I didn\'t realize it wasn\'t on my plan' },
  { id: 'hidden', label: 'Hidden ingredient — I thought the food was safe' },
  { id: 'unsure', label: 'I\'m not sure' },
]

export default function SlipupSurvey({ session, profile, labResult, currentDay, onComplete, onBack }) {
  const [search, setSearch] = useState('')
  const [selectedFoods, setSelectedFoods] = useState([])
  const [reason, setReason] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [aiMessage, setAiMessage] = useState('')
  const [loadingAi, setLoadingAi] = useState(false)

  const name = session?.user?.user_metadata?.full_name?.split(' ')[0] || 'there'

  const filteredFoods = COMMON_FOODS.filter(f =>
    f.toLowerCase().includes(search.toLowerCase()) && !selectedFoods.includes(f)
  )

  const toggleFood = (food) => {
    setSelectedFoods(prev => prev.includes(food) ? prev.filter(f => f !== food) : [...prev, food])
  }

  const canSubmit = reason !== ''

  const handleSubmit = async () => {
    setSubmitting(true)
    const today = todayLocal()

    await supabase.from('daily_compliance').upsert({
      user_id: session.user.id,
      date: today,
      response: 'NO',
      slip_up_foods: selectedFoods,
      slip_up_reason: reason,
      logged_at: new Date().toISOString(),
    }, { onConflict: 'user_id,date' })

    setSubmitting(false)
    setSubmitted(true)

    // Generate AI slip-up acknowledgment
    setLoadingAi(true)
    try {
      const topFood = selectedFoods[0] || 'a flagged food'
      const foodLevel = labResult?.foods?.find(f => f.name === topFood)?.level || 'flagged'
      const msg = await generateSlipupMessage({
        name,
        food: topFood,
        sensitivityLevel: foodLevel,
        currentDay: currentDay || 0,
      })
      setAiMessage(msg)
    } catch (e) {}
    setLoadingAi(false)
  }

  if (submitted) return (
    <div style={s.wrap}>
      <div style={s.topBar}>
        <div style={{ width: 40 }} />
        <div style={s.logo}>sensi<em style={s.logoEm}>fy</em></div>
        <div style={{ width: 40 }} />
      </div>
      <div style={s.successWrap}>
        <div style={s.successIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3D5C3C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div style={s.successTitle}>Logged. <em style={s.successTitleEm}>Thanks for telling us.</em></div>

        {loadingAi ? (
          <div style={{ ...s.infoCard, marginBottom: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#3D5C3C', fontStyle: 'italic' }}>Getting your personalized guidance...</div>
          </div>
        ) : aiMessage ? (
          <div style={{ ...s.infoCard, marginBottom: '12px' }}>
            <div style={s.infoLabel}>What this means</div>
            <div style={s.infoText}>{aiMessage}</div>
          </div>
        ) : (
          <div style={{ ...s.successMsg }}>
            One slip-up doesn't undo your progress — it's one data point. Your clean days are still there. Tomorrow is a fresh start.
          </div>
        )}

        <div style={{ ...s.infoCard, marginBottom: 0 }}>
          <div style={s.infoLabel}>What happens next</div>
          <div style={s.infoText}>This gets factored into your weekly insight. Patterns across multiple days tell us much more than any single day.</div>
        </div>
      </div>
      <div style={s.footer}>
        <button style={s.cta} onClick={onComplete}>Back to dashboard</button>
      </div>
    </div>
  )

  return (
    <div style={s.wrap}>
      <div style={s.topBar}>
        <button style={s.back} onClick={onBack}>← Back</button>
        <div style={s.logo}>sensi<em style={s.logoEm}>fy</em></div>
        <div style={{ width: 40 }} />
      </div>

      <div style={s.content}>
        <div style={s.eyebrow}>Slip-up logged</div>
        <div style={s.title}>What <em style={s.titleEm}>happened today?</em></div>
        <div style={s.hint}>No judgment — this is just data. The more we know, the better your weekly insights become.</div>

        <div style={s.label}>What did you eat that wasn't on your plan?</div>
        <input
          style={s.searchInput}
          placeholder="Search foods or type your own..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && search.trim()) {
              toggleFood(search.trim())
              setSearch('')
            }
          }}
        />

        {selectedFoods.length > 0 && (
          <div style={s.selectedPills}>
            {selectedFoods.map(food => (
              <div key={food} style={s.pill}>
                {food}
                <span style={s.pillRemove} onClick={() => toggleFood(food)}>×</span>
              </div>
            ))}
          </div>
        )}

        {search.length > 0 && (
          <div style={s.foodList}>
            {filteredFoods.slice(0, 8).map(food => (
              <div key={food} style={s.foodItem} onClick={() => { toggleFood(food); setSearch('') }}>
                {food}
              </div>
            ))}
            {search.trim() && !COMMON_FOODS.find(f => f.toLowerCase() === search.toLowerCase()) && (
              <div style={s.foodItem} onClick={() => { toggleFood(search.trim()); setSearch('') }}>
                Add "{search.trim()}"
              </div>
            )}
          </div>
        )}

        <div style={s.divider} />

        <div style={s.label}>How did it happen?</div>
        <div style={s.reasonGrid}>
          {REASONS.map(r => (
            <button
              key={r.id}
              style={reason === r.id ? s.reasonBtnOn : s.reasonBtn}
              onClick={() => setReason(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div style={s.footer}>
        <button
          style={canSubmit ? s.cta : s.ctaDisabled}
          disabled={!canSubmit || submitting}
          onClick={handleSubmit}
        >
          {submitting ? 'Logging...' : 'Submit →'}
        </button>
      </div>
    </div>
  )
}
