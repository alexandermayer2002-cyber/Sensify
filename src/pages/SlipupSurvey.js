import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { todayLocal } from '../utils/dateUtils'
import { generateSlipupMessage } from '../utils/aiInsights'

const PAGE_CSS = `
  .sn-input { background: #FFFFFF; border: none; box-shadow: var(--shadow-1), inset 0 1px 3px rgba(56,62,48,0.05); transition: box-shadow var(--t-fast) var(--ease); }
  .sn-input:focus { outline: none; box-shadow: 0 0 0 3px rgba(61,92,60,0.30), var(--shadow-1); }
`

const s = {
  wrap: { minHeight: '100vh', background: 'transparent', display: 'flex', flexDirection: 'column' },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', boxShadow: 'var(--shadow-1)' },
  logo: { fontFamily: 'Fraunces, serif', fontSize: '19px', fontWeight: 500, color: '#20241F' },
  logoEm: { color: '#3D5C3C', fontStyle: 'italic' },
  back: { fontSize: '13px', color: '#73736A', cursor: 'pointer', background: 'none', border: 'none' },
  content: { flex: 1, padding: '28px 24px 100px', maxWidth: '560px', margin: '0 auto', width: '100%' },
  eyebrow: { display: 'block', marginBottom: '12px' },
  title: { fontFamily: 'Fraunces, serif', fontSize: '30px', fontWeight: 300, lineHeight: 1.2, marginBottom: '8px', letterSpacing: '-0.3px' },
  titleEm: { fontStyle: 'italic', color: '#3D5C3C' },
  hint: { fontSize: '13px', color: '#73736A', marginBottom: '28px', lineHeight: 1.65 },
  label: { fontSize: '14px', fontWeight: 600, marginBottom: '12px', lineHeight: 1.5 },
  searchInput: { width: '100%', borderRadius: '14px', padding: '13px 16px', fontSize: '16px', color: '#20241F', marginBottom: '10px' },
  foodList: { maxHeight: '200px', overflowY: 'auto', border: 'none', boxShadow: 'var(--shadow-2)', borderRadius: '16px', background: '#FFFFFF', marginBottom: '20px' },
  foodItem: { padding: '11px 14px', fontSize: '14px', cursor: 'pointer', color: '#20241F', transition: 'background 0.1s' },
  foodItemSelected: { padding: '11px 14px', fontSize: '14px', cursor: 'pointer', color: '#3D5C3C', background: '#EDF3ED', fontWeight: 500 },
  selectedPills: { display: 'flex', flexWrap: 'wrap', gap: '7px', marginBottom: '20px' },
  pill: { display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', borderRadius: '999px', background: '#3D5C3C', fontSize: '13px', color: '#FFFFFF', fontWeight: 600, boxShadow: 'var(--shadow-pill)' },
  pillRemove: { cursor: 'pointer', fontSize: '14px', color: '#C9D8C8', lineHeight: 1 },
  divider: { height: '1px', background: 'rgba(0,0,0,0.06)', margin: '24px 0' },
  reasonGrid: { display: 'flex', flexDirection: 'column', gap: '9px', marginBottom: '20px' },
  reasonBtn: { padding: '14px 16px', borderRadius: '16px', border: 'none', boxShadow: 'var(--shadow-1)', background: '#FFFFFF', fontSize: '14px', cursor: 'pointer', color: '#20241F', textAlign: 'left', transition: 'all 0.12s' },
  reasonBtnOn: { padding: '14px 16px', borderRadius: '16px', border: 'none', boxShadow: 'var(--shadow-pill)', background: '#3D5C3C', fontSize: '14px', cursor: 'pointer', color: '#FFFFFF', textAlign: 'left', fontWeight: 600 },
  footer: { position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 24px', background: 'rgba(251,248,242,0.92)', backdropFilter: 'blur(8px)', boxShadow: '0 -8px 24px rgba(56,62,48,0.06)' },
  cta: { width: '100%' },
  ctaDisabled: { width: '100%' },
  successWrap: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center', maxWidth: '560px', margin: '0 auto', width: '100%' },
  successIcon: { width: '56px', height: '56px', background: '#EDF3ED', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', boxShadow: 'var(--shadow-1)' },
  successTitle: { fontFamily: 'Fraunces, serif', fontSize: '24px', fontWeight: 300, marginBottom: '10px' },
  successTitleEm: { fontStyle: 'italic', color: '#3D5C3C' },
  successMsg: { fontSize: '14px', color: '#73736A', lineHeight: 1.7, maxWidth: '280px', margin: '0 auto 28px' },
  infoCard: { background: '#F7F5EE', borderRadius: '16px', padding: '14px 16px', textAlign: 'left', width: '100%' },
  infoLabel: { display: 'block', marginBottom: '5px' },
  infoText: { fontSize: '13px', color: '#20241F', lineHeight: 1.6 },
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
  { id: 'intentional', label: 'Intentional. I chose to eat it' },
  { id: 'accidental', label: 'Accidental. I didn\'t realize it wasn\'t on my plan' },
  { id: 'hidden', label: 'Hidden ingredient. I thought the food was safe' },
  { id: 'unsure', label: 'I\'m not sure' },
]

export default function SlipupSurvey({ session, profile, labResult, currentDay, onComplete, onBack }) {
  const [search, setSearch] = useState('')
  const [selectedFoods, setSelectedFoods] = useState([])
  const [reason, setReason] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [aiMessage, setAiMessage] = useState('')
  const [loadingAi, setLoadingAi] = useState(false)

  const name = session?.user?.user_metadata?.full_name?.split(' ')[0] || 'there'

  const filteredFoods = COMMON_FOODS.filter(f =>
    f.toLowerCase().includes(search.toLowerCase()) && !selectedFoods.includes(f)
  )

  const toggleFood = (food) => {
    setSelectedFoods(prev => prev.includes(food) ? prev.filter(f => f !== food) : [...prev, food])
  }

  // A slip-up without the food is a survey without its data (QA 2026-10-24 #6).
  const canSubmit = reason !== '' && selectedFoods.length > 0

  const handleSubmit = async () => {
    setSubmitting(true)
    setSubmitError('')
    const today = todayLocal()

    // Checked write (QA 2026-10-24 #3 family): a failed save says so.
    const { error: upErr } = await supabase.from('daily_compliance').upsert({
      user_id: session.user.id,
      date: today,
      response: 'NO',
      slip_up_foods: selectedFoods,
      slip_up_reason: reason,
      logged_at: new Date().toISOString(),
    }, { onConflict: 'user_id,date' })
    if (upErr) {
      setSubmitError("That didn't save — your answers are still here. Tap Submit to try again.")
      setSubmitting(false)
      return
    }

    setSubmitting(false)
    setSubmitted(true)

    // Generate AI slip-up acknowledgment
    setLoadingAi(true)
    try {
      const topFood = selectedFoods[0]
      // Never claim an off-list food is "a flagged sensitivity" (QA 2026-10-24
      // #2) — the prompt gets the honest provenance instead.
      const foodLevel = labResult?.foods?.find(f => f.name.toLowerCase() === topFood.toLowerCase())?.level
        || 'not on their flagged list — a food they chose to log anyway'
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
      <style>{PAGE_CSS}</style>
      <div className="sn-rise" style={s.successWrap}>
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
            <div className="sn-micro" style={s.infoLabel}>What this means</div>
            <div style={s.infoText}>{aiMessage}</div>
          </div>
        ) : (
          <div style={{ ...s.successMsg }}>
            One slip-up doesn't undo your progress. It's one data point. Your clean days are still there. Tomorrow is a fresh start.
          </div>
        )}

        <div style={{ ...s.infoCard, marginBottom: 0 }}>
          <div className="sn-micro" style={s.infoLabel}>What happens next</div>
          <div style={s.infoText}>This gets factored into your weekly insight. Patterns across multiple days tell us much more than any single day.</div>
        </div>
      </div>
      <div style={s.footer}>
        <button className="sn-btn" style={s.cta} onClick={onComplete}>Back to dashboard</button>
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

      <style>{PAGE_CSS}</style>
      <div className="sn-rise" style={s.content}>
        <div className="sn-micro" style={s.eyebrow}>Slip-up logged</div>
        <div style={s.title}>What <em style={s.titleEm}>happened today?</em></div>
        <div style={s.hint}>No judgment, this is just data. The more we know, the better your weekly insights become.</div>

        <div style={s.label}>What did you eat that wasn't on your plan?</div>
        <input
          className="sn-input"
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
          className="sn-btn"
          style={s.cta}
          disabled={!canSubmit || submitting}
          onClick={handleSubmit}
          title={!canSubmit ? (selectedFoods.length === 0 ? 'Add the food you ate above first' : 'Pick how it happened above first') : undefined}
        >
          {submitting ? 'Logging...' : 'Submit →'}
        </button>
        {submitError && <div style={{ background: '#FAEAEA', color: '#8B2E2E', borderRadius: 12, padding: '10px 13px', fontSize: 12.5, lineHeight: 1.55, marginTop: 10 }}>{submitError}</div>}
      </div>
    </div>
  )
}
