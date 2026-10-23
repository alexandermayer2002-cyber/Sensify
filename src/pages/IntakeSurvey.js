import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import NumPad from '../components/NumPad'
import { normalizeMilestones, serializeMilestones } from '../utils/aiInsights'

const FOOD_CATEGORIES = [
  { category: 'Proteins', foods: ['Beef', 'Chicken', 'Pork', 'Lamb', 'Turkey', 'Egg White', 'Egg Yolk'] },
  { category: 'Dairy', foods: ['Cow Milk', 'Cheese', 'Yogurt', 'Butter', 'Whey', 'Casein'] },
  { category: 'Grains', foods: ['Wheat', 'Gluten', 'Corn', 'Rice', 'Oats', 'Barley', 'Rye', 'Spelt'] },
  { category: 'Nuts & Seeds', foods: ['Almond', 'Cashew', 'Walnut', 'Peanut', 'Pistachio', 'Hazelnut', 'Pecan', 'Sesame', 'Sunflower Seed', 'Flaxseed'] },
  { category: 'Legumes', foods: ['Soy', 'Tofu', 'Lentil', 'Chickpea', 'Black Bean', 'Kidney Bean'] },
  { category: 'Seafood', foods: ['Salmon', 'Tuna', 'Shrimp', 'Cod', 'Halibut', 'Scallop', 'Crab', 'Lobster', 'Clam', 'Oyster'] },
  { category: 'Vegetables', foods: ['Broccoli', 'Spinach', 'Tomato', 'Carrot', 'Celery', 'Garlic', 'Onion', 'Mushroom', 'Potato', 'Sweet Potato', 'Pepper', 'Cucumber', 'Zucchini'] },
  { category: 'Fruits', foods: ['Apple', 'Banana', 'Orange', 'Strawberry', 'Blueberry', 'Grape', 'Pineapple', 'Mango', 'Avocado', 'Lemon', 'Peach', 'Watermelon'] },
  { category: 'Other', foods: ['Coffee', 'Tea', 'Cocoa', 'Vanilla', 'Cane Sugar', 'Honey', 'Yeast', 'Mustard', 'Ginger'] },
]

const FREQUENCY_OPTIONS = [
  { label: 'Daily', value: 'daily' },
  { label: '3–5x/week', value: '3-5x' },
  { label: '1–2x/week', value: '1-2x' },
  { label: 'Rarely', value: 'rarely' },
  { label: 'Almost never', value: 'almost-never' },
  { label: 'Never', value: 'never' },
]

// Lifestyle baseline options — captured at intake as the personal "normal" that
// daily check-in factors are later compared against to detect divergence.
const SLEEP_BANDS = [
  { label: 'Under 6 hours', value: 'under6' },
  { label: '6–7 hours', value: '6-7' },
  { label: '7–8 hours', value: '7-8' },
  { label: '8+ hours', value: '8plus' },
]
const STRESS_BANDS = [
  { label: 'Low', value: 'low' },
  { label: 'Mild', value: 'mild' },
  { label: 'Moderate', value: 'moderate' },
  { label: 'High', value: 'high' },
  { label: 'Severe', value: 'severe' },
]
const HYDRATION_BANDS = [
  { label: 'Under 3 cups', value: 'under3' },
  { label: '3–5 cups', value: '3-5' },
  { label: '6–8 cups', value: '6-8' },
  { label: '8+ cups', value: '8plus' },
]
const GENDER_OPTIONS = [
  { label: 'Female', value: 'female' },
  { label: 'Male', value: 'male' },
  { label: 'Prefer not to say', value: 'undisclosed' },
]

// Range validation for lifestyle numpad entries. Keeps impossible baselines
// (e.g. 65 hours of sleep) out of the profile the AI insights compare against.
const PAD_LIMITS = {
  avg_sleep: { min: 0, max: 14, warn: 'Between 0 and 14 hours.' },
  avg_hydration: { min: 0, max: 20, warn: 'Between 0 and 20 cups.' },
  avg_drinks_week: { min: 0, max: 30, warn: 'Between 0 and 30 drinks.' },
}
const padInRange = (field, v) => {
  if (!v) return true
  const n = parseFloat(v)
  return !isNaN(n) && n >= PAD_LIMITS[field].min && n <= PAD_LIMITS[field].max
}


const FREQ_NEVER = ['Never', 'Rarely or never']
const FREQ_FREQUENT = ['Daily', 'A few times a week', 'Regularly', 'Almost daily', 'Most afternoons', 'Daily and severe', 'Poor. Hard to fall or stay asleep', 'Very poor']

const isFrequent = (val) => val && FREQ_FREQUENT.some(f => val.includes(f.split(' ')[0]) || val === f)
const isNever = (val) => !val || FREQ_NEVER.includes(val)

const PAGE_CSS = `
  .sn-input { background: #FFFFFF; border: none; box-shadow: var(--shadow-1), inset 0 1px 3px rgba(56,62,48,0.05); transition: box-shadow var(--t-fast) var(--ease); }
  .sn-input:focus { outline: none; box-shadow: 0 0 0 3px rgba(61,92,60,0.30), var(--shadow-1); }
  .sn-pad button { min-height: 52px; transition: transform 120ms var(--ease), box-shadow 120ms var(--ease); }
  .sn-pad button:active { transform: scale(0.94); }
`

const s = {
  wrap: { minHeight: '100vh', background: 'transparent', display: 'flex', flexDirection: 'column' },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', boxShadow: 'var(--shadow-1)', position: 'sticky', top: 0, zIndex: 10 },
  logo: { fontFamily: 'Fraunces, serif', fontSize: '19px', fontWeight: 500, color: '#20241F' },
  logoEm: { color: '#3D5C3C' },
  back: { fontSize: '13px', color: '#73736A', cursor: 'pointer', background: 'none', border: 'none' },
  track: { margin: '14px 24px 0', maxWidth: '560px' },
  content: { flex: 1, padding: '32px 24px 100px', maxWidth: '560px', margin: '0 auto', width: '100%' },
  eyebrow: { display: 'block', marginBottom: '10px' },
  title: { fontFamily: 'Fraunces, serif', fontSize: '30px', fontWeight: 300, lineHeight: 1.22, marginBottom: '8px', letterSpacing: '-0.4px' },
  titleEm: { fontStyle: 'normal', color: 'inherit' },
  hint: { fontSize: '13px', color: '#73736A', marginBottom: '28px', lineHeight: 1.7 },
  importantNote: { fontSize: '12.5px', color: '#73736A', lineHeight: 1.6, marginBottom: '20px' },
  categoryGrid: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' },
  categoryCard: { background: '#FFFFFF', border: 'none', boxShadow: 'var(--shadow-1)', borderRadius: '16px', padding: '18px', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'flex-start', gap: '14px' },
  categoryCardOn: { background: '#EDF3ED', border: 'none', boxShadow: '0 0 0 1.5px #3D5C3C, var(--shadow-1)', borderRadius: '16px', padding: '18px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '14px' },
  categoryCardDisabled: { background: '#FAF8F4', border: 'none', boxShadow: 'none', borderRadius: '16px', padding: '18px', cursor: 'not-allowed', display: 'flex', alignItems: 'flex-start', gap: '14px', opacity: 0.4 },
  categoryCheck: { width: '20px', height: '20px', borderRadius: '6px', border: '1.5px solid rgba(0,0,0,0.15)', background: '#FFFFFF', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' },
  categoryCheckOn: { width: '20px', height: '20px', borderRadius: '6px', border: '1.5px solid #3D5C3C', background: '#3D5C3C', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' },
  categoryTitle: { fontSize: '15px', fontWeight: 600, color: '#20241F', marginBottom: '3px' },
  categoryTitleOn: { fontSize: '15px', fontWeight: 600, color: '#3D5C3C', marginBottom: '3px' },
  categoryDesc: { fontSize: '13px', color: '#73736A', lineHeight: 1.5 },
  maxNote: { fontSize: '12px', color: '#73736A', textAlign: 'center', marginTop: '-8px', marginBottom: '20px' },
  questionBlock: { marginBottom: '14px', padding: '18px 16px' },
  questionLabel: { fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 400, marginBottom: '12px', lineHeight: 1.3, color: '#20241F' },
  optionGrid: { display: 'flex', flexDirection: 'column', gap: '8px' },
  option: { padding: '13px 16px', borderRadius: '16px', border: 'none', background: '#F7F5EE', fontSize: '14px', cursor: 'pointer', color: '#3B4036', textAlign: 'left', transition: 'all 0.12s', lineHeight: 1.4 },
  optionOn: { padding: '13px 16px', borderRadius: '16px', border: 'none', background: '#3D5C3C', fontSize: '14px', cursor: 'pointer', color: '#FFFFFF', textAlign: 'left', fontWeight: 600, lineHeight: 1.4, boxShadow: 'var(--shadow-pill)' },
  sectionDivider: { display: 'flex', alignItems: 'center', gap: '12px', margin: '28px 0 24px' },
  sectionDividerLine: { flex: 1, height: '1px', background: 'rgba(0,0,0,0.07)' },
  sectionDividerLabel: { whiteSpace: 'nowrap' },
  scaleWrap: { marginBottom: '28px' },
  scaleLabels: { display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#73736A', marginBottom: '8px' },
  scaleRow: { display: 'flex', gap: '5px' },
  sbt: { flex: 1, height: '44px', borderRadius: '10px', border: 'none', background: '#EDF3ED', fontSize: '14px', cursor: 'pointer', fontWeight: 400, color: '#5A5A52', transition: 'all 0.12s' },
  sbtOn: { flex: 1, height: '44px', borderRadius: '10px', border: 'none', background: '#3D5C3C', fontSize: '18px', cursor: 'pointer', fontWeight: 400, color: 'white', fontFamily: 'Fraunces, serif', boxShadow: 'var(--shadow-pill)' },
  textarea: { width: '100%', borderRadius: '14px', padding: '14px 15px', fontSize: '16px', color: '#20241F', resize: 'none', height: '96px', lineHeight: 1.5 },
  categoryTitle2: { fontFamily: 'Fraunces, serif', fontSize: '15px', fontWeight: 400, color: '#3D5C3C', margin: '22px 0 12px', letterSpacing: '-0.2px' },
  freqBtns: { display: 'flex', flexWrap: 'wrap', gap: '4px' },
  freqBtn: { padding: '7px 11px', borderRadius: '999px', border: 'none', background: '#FFFFFF', boxShadow: 'var(--shadow-1)', fontSize: '12px', cursor: 'pointer', color: '#73736A', fontWeight: 600, transition: 'all 0.12s', whiteSpace: 'nowrap' },
  freqBtnOn: { padding: '7px 11px', borderRadius: '999px', border: 'none', background: '#3D5C3C', fontSize: '12px', cursor: 'pointer', color: '#FFFFFF', fontWeight: 600, boxShadow: 'var(--shadow-pill)', whiteSpace: 'nowrap' },
  footer: { position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 24px', background: 'rgba(251,248,242,0.92)', backdropFilter: 'blur(8px)', boxShadow: '0 -8px 24px rgba(56,62,48,0.06)' },
  cta: { width: '100%' },
  ctaDisabled: { width: '100%' },
  padWarn: { marginTop: 8, padding: '8px 11px', background: '#FBF0DF', color: '#9A6212', borderRadius: 10, fontSize: '11.5px', lineHeight: 1.5 },
}

export default function IntakeSurvey({ session, onComplete, onBack }) {
  const [step, setStep] = useState(-1)
  const [agreed, setAgreed] = useState(false)
  // Separate, optional research consent. Never required, never bundled into
  // the service agreement: retrofitting consent is impossible, so this exists
  // from day one even though nothing uses the data yet.
  const [researchOk, setResearchOk] = useState(false)
  const [signatureName, setSignatureName] = useState('')
  const [selectedCategories, setSelectedCategories] = useState([])
  const [answers, setAnswers] = useState({})
  const [foodFrequency, setFoodFrequency] = useState({})
  // Lifestyle baselines (sleep/stress/hydration/gender/alcohol) — the personal
  // "normal" that daily check-in factors are compared against for divergence.
  const [lifestyle, setLifestyle] = useState({})
  const [openPad, setOpenPad] = useState(null)
  const [padWarning, setPadWarning] = useState(null)
  const [saving, setSaving] = useState(false)

  // Draft persistence (QA 2026-10-21 #5): all intake state was in-memory only,
  // so a mid-intake refresh (or a phone discarding the backgrounded tab) lost
  // everything including the signed consent. Mirror the draft to localStorage
  // on change, rehydrate on mount, clear on completion. Best-effort: storage
  // can be unavailable (private mode), so every touch is wrapped.
  const draftKey = `sensify.intakeDraft.${session?.user?.id || 'anon'}`
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey)
      if (raw) {
        const d = JSON.parse(raw)
        if (d && typeof d.step === 'number') {
          setStep(d.step)
          setAgreed(!!d.agreed)
          setResearchOk(!!d.researchOk)
          setSignatureName(d.signatureName || '')
          setSelectedCategories(Array.isArray(d.selectedCategories) ? d.selectedCategories : [])
          setAnswers(d.answers || {})
          setFoodFrequency(d.foodFrequency || {})
          setLifestyle(d.lifestyle || {})
        }
      }
    } catch (e) { /* storage unavailable — intake still works, just unsaved */ }
    setHydrated(true)
  }, [])
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(draftKey, JSON.stringify({ step, agreed, researchOk, signatureName, selectedCategories, answers, foodFrequency, lifestyle }))
    } catch (e) { /* best-effort */ }
  }, [hydrated, step, agreed, researchOk, signatureName, selectedCategories, answers, foodFrequency, lifestyle])

  const hasDigestive = selectedCategories.includes('digestive')
  const hasEnergy = selectedCategories.includes('energy')
  const hasGeneral = selectedCategories.includes('general')

  const toggleCategory = (cat) => {
    setSelectedCategories(prev => {
      if (prev.includes(cat)) return prev.filter(c => c !== cat)
      if (prev.length >= 2) return prev
      return [...prev, cat]
    })
  }

  const setAnswer = (key, val) => setAnswers(prev => ({ ...prev, [key]: val }))

  const setFrequency = (food, freq) => {
    setFoodFrequency(prev => {
      if (prev[food] === freq) { const u = { ...prev }; delete u[food]; return u }
      return { ...prev, [food]: freq }
    })
  }

  // Build symptom questions based on category selections
  const getSymptomQuestions = () => {
    const questions = []

    if (hasDigestive) {
      questions.push({ section: 'Digestive symptoms', id: 'bloating_freq', label: 'How often do you experience bloating?', options: ['Never', 'A few times a month', 'A few times a week', 'Daily'] })
      questions.push({ section: null, id: 'bloating_timing', label: 'When does bloating typically happen?', options: ['After every meal', 'After specific foods', 'Randomly throughout the day', 'Mostly in the morning', 'Mostly in the evening'] })
      questions.push({ section: null, id: 'gas_cramping_freq', label: 'How often do you experience gas or cramping?', options: ['Never', 'Occasionally', 'A few times a week', 'Daily'] })
      questions.push({ section: null, id: 'reflux_freq', label: 'How often do you experience reflux or heartburn?', options: ['Never', 'Occasionally', 'A few times a week', 'Daily'] })
      questions.push({ section: null, id: 'digestion_regularity', label: 'How would you describe your digestion regularity?', options: ['Very regular', 'Mostly regular', 'Inconsistent', 'Often irregular or uncomfortable'] })
      questions.push({ section: null, id: 'digestive_duration', label: 'How long have you been dealing with digestive symptoms?', options: ['Less than 6 months', '6–12 months', '1–3 years', 'More than 3 years'] })
    }

    if (hasEnergy) {
      questions.push({ section: hasDigestive ? 'Energy symptoms' : 'Energy symptoms', id: 'fatigue_freq', label: 'How would you describe your overall fatigue levels?', options: ['Rarely tired', 'Occasionally tired', 'Often tired', 'Chronically exhausted'] })
      questions.push({ section: null, id: 'brain_fog_freq', label: 'Do you experience brain fog or difficulty concentrating?', options: ['Never', 'Occasionally', 'A few times a week', 'Daily'] })
      questions.push({ section: null, id: 'crashes_freq', label: 'Do you experience afternoon energy crashes?', options: ['Never', 'Occasionally', 'Most afternoons', 'Daily and severe'] })
      questions.push({ section: null, id: 'sleep_quality', label: 'How would you describe your sleep quality?', options: ['Restful and consistent', 'Okay but not great', 'Poor. Hard to fall or stay asleep', 'Very poor'] })
      questions.push({ section: null, id: 'energy_duration', label: 'How long have you been dealing with low energy or brain fog?', options: ['Less than 6 months', '6–12 months', '1–3 years', 'More than 3 years'] })
    }

    if (hasGeneral) {
      // Strict category set (Alex's #9/#10 ruling): wellness owns its own questions,
      // borrows nothing from digestive or energy. Deeper category rework waits on advisors.
      questions.push({ section: hasDigestive || hasEnergy ? 'General wellness' : 'Your wellness', id: 'general_unwell_freq', label: 'How often do you feel generally unwell or below your normal?', options: ['Rarely or never', 'Occasionally', 'Regularly', 'Almost daily'] })
      questions.push({ section: null, id: 'general_comfort', label: 'How would you describe your day to day physical comfort? Think headaches, aches, or heaviness.', options: ['Comfortable most days', 'Occasional discomfort', 'Uncomfortable most days', 'In discomfort daily'] })
      questions.push({ section: null, id: 'general_postmeal', label: 'How often do you feel worse after eating, without knowing why?', options: ['Never', 'Occasionally', 'Regularly', 'Almost daily'] })
      if (!hasEnergy) {
        questions.push({ section: null, id: 'sleep_quality', label: 'How would you describe your sleep quality?', options: ['Restful and consistent', 'Okay but not great', 'Poor. Hard to fall or stay asleep', 'Very poor'] })
      }
      if (!hasDigestive) {
        questions.push({ section: null, id: 'general_digestion', label: 'How often do you experience digestive discomfort like bloating, gas, or cramping?', options: ['Rarely or never', 'Occasionally', 'Regularly', 'Almost daily'] })
      }
      if (!hasEnergy) {
        questions.push({ section: null, id: 'general_energy', label: 'How would you describe your typical energy levels?', options: ['Consistently good', 'Variable. Good and bad days', 'Often low', 'Chronically poor'] })
      }
      questions.push({ section: null, id: 'general_duration', label: 'How long have you felt below your baseline?', options: ['Less than 6 months', '6–12 months', '1–3 years', 'More than 3 years'] })
      questions.push({ section: null, id: 'interest_reason', label: 'What made you interested in food sensitivity testing?', options: null, type: 'text', placeholder: 'Tell us in your own words...', optional: true })
    }

    // Always at end
    questions.push({ section: null, id: 'additional_context', label: 'Anything else you want us to know before we start?', options: null, type: 'text', placeholder: 'Recent diet changes, foods you already suspect, anything at all', optional: true })

    return questions
  }

  // Build baseline scales based on what they actually reported
  const getBaselineScales = () => {
    const scales = []
    const a = answers

    // Digestive scales — only if they said they have these symptoms
    if (hasDigestive || hasGeneral) {
      if (!isNever(a.bloating_freq) || !isNever(a.general_digestion)) {
        scales.push({ id: 'baseline_bloating', label: 'In a typical week, how would you rate your bloating?', low: 'None at all', high: 'Severe' })
      }
      if (!isNever(a.gas_cramping_freq)) {
        scales.push({ id: 'baseline_gas', label: 'In a typical week, how would you rate your gas or cramping?', low: 'None at all', high: 'Severe' })
      }
      if (!isNever(a.reflux_freq)) {
        scales.push({ id: 'baseline_reflux', label: 'In a typical week, how would you rate your reflux or heartburn?', low: 'None at all', high: 'Severe' })
      }
      if (a.digestion_regularity && a.digestion_regularity !== 'Very regular') {
        scales.push({ id: 'baseline_digestive', label: 'In a typical week, how would you rate your overall digestive comfort?', low: 'Very comfortable', high: 'Very uncomfortable' })
      }
    }

    // Energy scales — only if they said they have these symptoms
    if (hasEnergy || hasGeneral) {
      if (a.fatigue_freq && a.fatigue_freq !== 'Rarely tired') {
        scales.push({ id: 'baseline_energy', label: 'In a typical week, how would you rate your energy?', low: 'Exhausted', high: 'Full energy' })
      }
      if (!isNever(a.brain_fog_freq)) {
        scales.push({ id: 'baseline_clarity', label: 'In a typical week, how would you rate your mental clarity?', low: 'Very foggy', high: 'Crystal clear' })
      }
      if (isFrequent(a.crashes_freq)) {
        scales.push({ id: 'baseline_afternoon', label: 'In a typical week, how would you rate your afternoon energy?', low: 'Severe crash', high: 'Sustained energy' })
      }
      if (a.sleep_quality && a.sleep_quality !== 'Restful and consistent') {
        scales.push({ id: 'baseline_sleep', label: 'In a typical week, how would you rate your sleep quality?', low: 'Very poor', high: 'Excellent' })
      }
    }

    // Wellness owns its baselines: every wellness selection produces a real weekly.
    if (hasGeneral) {
      scales.push({ id: 'baseline_wellbeing', label: 'In a typical week, how would you rate your overall wellbeing?', low: 'Very poor', high: 'Excellent' })
      if (a.general_energy && (a.general_energy === 'Often low' || a.general_energy === 'Chronically poor') && !scales.some(s => s.id === 'baseline_energy')) {
        scales.push({ id: 'baseline_energy', label: 'In a typical week, how would you rate your energy?', low: 'Exhausted', high: 'Full energy' })
      }
      if (a.general_postmeal && a.general_postmeal !== 'Never' && !scales.some(s => s.id === 'baseline_digestive')) {
        scales.push({ id: 'baseline_digestive', label: 'In a typical week, how would you rate your comfort after meals?', low: 'Very uncomfortable', high: 'Very comfortable' })
      }
      if (!hasEnergy && a.sleep_quality && a.sleep_quality !== 'Restful and consistent' && !scales.some(s => s.id === 'baseline_sleep')) {
        scales.push({ id: 'baseline_sleep', label: 'In a typical week, how would you rate your sleep quality?', low: 'Very poor', high: 'Excellent' })
      }
    }

    return scales
  }

  const symptomQuestions = getSymptomQuestions()
  const baselineScales = getBaselineScales()

  const requiredSymptomQuestions = symptomQuestions.filter(q => !q.optional && (!q.type || q.type !== 'text'))
  const allSymptomAnswered = requiredSymptomQuestions.every(q => answers[q.id])
  const allBaselinesAnswered = baselineScales.length === 0 || baselineScales.every(s => answers[s.id])

  const progressPct = step === -1 ? 0 : step === 0 ? 8 : step === 1 ? 30 : step === 2 ? 55 : step === 3 ? 78 : step === 4 ? 94 : 100

  const handleComplete = async () => {
    setSaving(true)
    const symptoms = []
    if (hasDigestive) symptoms.push('Digestive')
    if (hasEnergy) symptoms.push('Energy')
    if (hasGeneral) symptoms.push('General wellness')

    await supabase.from('profiles').upsert({
      id: session.user.id,
      full_name: session.user.user_metadata?.full_name,
      symptoms,
      baseline_bloating: answers.baseline_bloating ?? null,
      baseline_energy: answers.baseline_energy ?? null,
      baseline_digestive: answers.baseline_digestive ?? null,
      baseline_clarity: answers.baseline_clarity ?? null,
      baseline_gas: answers.baseline_gas ?? null,
      baseline_reflux: answers.baseline_reflux ?? null,
      baseline_afternoon: answers.baseline_afternoon ?? null,
      baseline_sleep: answers.baseline_sleep ?? null,
      baseline_wellbeing: answers.baseline_wellbeing ?? null,
      intake_answers: answers,
      food_frequency: foodFrequency,
      gender: lifestyle.gender,
      baseline_avg_sleep: lifestyle.avg_sleep,
      baseline_avg_stress: lifestyle.avg_stress,
      baseline_avg_hydration: lifestyle.avg_hydration,
      drinks_alcohol: lifestyle.drinks_alcohol === 'yes',
      baseline_avg_drinks_week: lifestyle.drinks_alcohol === 'yes' ? lifestyle.avg_drinks_week : null,
      program_phase: 'awaiting_results',
      intake_completed_at: new Date().toISOString(),
      consent_agreed: true,
      consent_name: signatureName,
      consent_timestamp: new Date().toISOString(),
    })
    // Optional research consent rides the milestones KV (the column that
    // accepts arrays), read-merge-write so nothing else is clobbered.
    if (researchOk) {
      try {
        const { data: prof } = await supabase.from('profiles').select('shown_milestones').eq('id', session.user.id).single()
        const current = normalizeMilestones(prof?.shown_milestones)
        await supabase.from('profiles').update({
          shown_milestones: serializeMilestones({ ...current, research_consent: new Date().toISOString() }),
        }).eq('id', session.user.id)
      } catch (e) { /* optional consent must never block intake */ }
    }
    setSaving(false)
    try { localStorage.removeItem(draftKey) } catch (e) { /* best-effort */ }
    onComplete()
  }

  const canProceedFromAgreement = agreed && signatureName.trim().length >= 2

  // STEP -1 — Agreement
  if (step === -1) return (
    <div style={s.wrap}>
      <style>{PAGE_CSS}</style>
      <div style={s.topBar}>
        <button style={s.back} onClick={onBack}>← Back</button>
        <div style={s.logo}>Sensify<span style={s.logoEm}>.</span></div>
        <div style={{ width: 40 }} />
      </div>
      <div className="sn-rise" key={step} style={{ ...s.content, paddingTop: '40px' }}>
        <div className="sn-micro" style={s.eyebrow}>Before you begin</div>
        <div style={s.title}>A few things to<br /><em style={s.titleEm}>understand first.</em></div>
        <div style={s.hint}>Please read and agree to the following before starting your intake survey.</div>

        <div className="sn-card" style={{ padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              {
                icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3D5C3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
                title: 'Not medical advice',
                desc: 'Sensify is a wellness and educational program. It is not a medical service and does not diagnose, treat, or cure any condition. Always consult a qualified healthcare provider for medical concerns.'
              },
              {
                icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3D5C3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>,
                title: 'AI insights are informational only',
                desc: 'AI-generated insights are based on your self-reported data and are for educational purposes only. They do not constitute medical advice or a clinical diagnosis.'
              },
              {
                icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3D5C3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
                title: 'Your data is shared with the Sensify team',
                desc: 'Your program data, including symptom responses, lab results, and compliance history, is accessible to the Sensify team for account verification, protocol support, and quality review.'
              },
              {
                icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3D5C3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
                title: 'Results are based on self-reporting',
                desc: 'Food sensitivity results are based on your reported symptoms during a structured elimination and reintroduction protocol. Individual results vary.'
              },
              {
                icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3D5C3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
                title: 'Finding no triggers is a valid result',
                desc: 'Some people complete the protocol and find their body tolerates everything well. That is a real, useful answer, not a failure. It means food sensitivity is unlikely to be driving your symptoms, and we will tell you so honestly rather than invent a problem.'
              },
              {
                icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3D5C3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
                title: 'Daily check-ins are part of the program',
                desc: 'Your program includes a quick daily check-in inside the app, plus weekly reviews. Staying consistent with check-ins is what makes your results trustworthy.'
              },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '13px', alignItems: 'flex-start' }}>
                <div style={{ width: '32px', height: '32px', background: '#EDF3ED', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>{item.icon}</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px', color: '#1C1C1C' }}>{item.title}</div>
                  <div style={{ fontSize: '13px', color: '#7A7A72', lineHeight: 1.65 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Checkbox */}
        <div
          style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '20px', cursor: 'pointer' }}
          onClick={() => setAgreed(!agreed)}
        >
          <div style={{ width: '22px', height: '22px', borderRadius: '6px', border: `1.5px solid ${agreed ? '#3D5C3C' : 'rgba(0,0,0,0.15)'}`, background: agreed ? '#3D5C3C' : '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px', transition: 'all 0.15s' }}>
            {agreed && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
          </div>
          <div style={{ fontSize: '13px', color: '#1C1C1C', lineHeight: 1.65, paddingTop: '1px' }}>
            I understand that Sensify is a wellness program and not a medical service, that insights are for informational purposes only, and that my program data may be accessed by the Sensify team to support my program. I agree to receive account and program notifications from Sensify.
          </div>
        </div>

        {/* Optional research consent: its own decision, visually subordinate,
            defaults off, and the program works identically either way. */}
        <div
          style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '20px', cursor: 'pointer', background: '#F7F5EE', borderRadius: '16px', padding: '12px 14px' }}
          onClick={() => setResearchOk(!researchOk)}
        >
          <div style={{ width: '22px', height: '22px', borderRadius: '6px', border: `1.5px solid ${researchOk ? '#3D5C3C' : 'rgba(0,0,0,0.15)'}`, background: researchOk ? '#3D5C3C' : '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px', transition: 'all 0.15s' }}>
            {researchOk && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
          </div>
          <div style={{ fontSize: '12.5px', color: '#5A5A52', lineHeight: 1.6, paddingTop: '1px' }}>
            <span style={{ fontWeight: 600, color: '#1C1C1C' }}>Optional:</span> my de-identified program data, never my name or contact details, may be used to improve Sensify and for research. The program is exactly the same either way, and I can change my mind by contacting support.
          </div>
        </div>

        {/* Signature */}
        <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#1C1C1C' }}>
          Type your full name as your signature
        </div>
        <input
          className="sn-input"
          style={{ width: '100%', height: 'auto', padding: '14px 16px', fontSize: '16px', marginBottom: '6px', fontFamily: 'Fraunces, serif', color: '#20241F', borderRadius: '14px', boxSizing: 'border-box' }}
          placeholder="Your full name"
          value={signatureName}
          onChange={e => setSignatureName(e.target.value)}
        />
        <div style={{ fontSize: '11px', color: '#7A7A72', marginBottom: '8px' }}>
          By typing your name above you confirm you have read and agree to the terms.
        </div>
      </div>
      <div style={s.footer}>
        <button
          className="sn-btn"
          style={s.cta}
          disabled={!canProceedFromAgreement}
          onClick={() => setStep(0)}
        >
          I agree, start my intake
        </button>
      </div>
    </div>
  )

  // STEP 0 — Category selection
  if (step === 0) return (
    <div style={s.wrap}>
      <style>{PAGE_CSS}</style>
      <div style={s.topBar}>
        <button style={s.back} onClick={onBack}>← Back</button>
        <div style={s.logo}>Sensify<span style={s.logoEm}>.</span></div>
        <div style={{ width: 40 }} />
      </div>
      <div style={{ padding: '14px 24px 2px' }}>
        <div className="sn-track" style={{ maxWidth: '560px', margin: '0 auto' }}>
          <div className="sn-fill" style={{ width: `${progressPct}%`, transition: 'width 0.4s var(--ease)' }} />
          <div className="sn-dot" style={{ left: `${progressPct}%` }} />
        </div>
      </div>
      <div className="sn-rise" key={step} style={s.content}>
        <div className="sn-micro" style={s.eyebrow}>Step 1 of 5</div>
        <div style={s.title}>What are you hoping<br />to <em style={s.titleEm}>understand?</em></div>
        <div style={s.hint}>Select up to two. This shapes every question, baseline score, and weekly insight throughout your program.</div>
        <div style={s.categoryGrid}>
          {[
            { id: 'digestive', title: 'Digestive health', desc: 'Bloating, gas, cramping, reflux, irregular digestion, discomfort after eating' },
            { id: 'energy', title: 'Energy & clarity', desc: 'Fatigue, brain fog, afternoon crashes, poor sleep, mental sluggishness' },
            { id: 'general', title: 'General wellness', desc: 'No specific complaint. I want to understand how food affects how I feel overall' },
          ].map(cat => {
            const isOn = selectedCategories.includes(cat.id)
            const isDisabled = !isOn && selectedCategories.length >= 2
            return (
              <div key={cat.id} style={isDisabled ? s.categoryCardDisabled : isOn ? s.categoryCardOn : s.categoryCard} onClick={() => !isDisabled && toggleCategory(cat.id)}>
                <div style={isOn ? s.categoryCheckOn : s.categoryCheck}>
                  {isOn && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                </div>
                <div>
                  <div style={isOn ? s.categoryTitleOn : s.categoryTitle}>{cat.title}</div>
                  <div style={s.categoryDesc}>{cat.desc}</div>
                </div>
              </div>
            )
          })}
        </div>
        {selectedCategories.length === 2 && <div style={s.maxNote}>Maximum 2 selected</div>}
      </div>
      <div style={s.footer}>
        <button className="sn-btn" style={s.cta} disabled={selectedCategories.length === 0} onClick={() => setStep(1)}>Continue</button>
      </div>
    </div>
  )

  // STEP 1 — Adaptive symptom questions
  if (step === 1) return (
    <div style={s.wrap}>
      <style>{PAGE_CSS}</style>
      <div style={s.topBar}>
        <button style={s.back} onClick={() => setStep(0)}>← Back</button>
        <div style={s.logo}>Sensify<span style={s.logoEm}>.</span></div>
        <div style={{ width: 40 }} />
      </div>
      <div style={{ padding: '14px 24px 2px' }}>
        <div className="sn-track" style={{ maxWidth: '560px', margin: '0 auto' }}>
          <div className="sn-fill" style={{ width: `${progressPct}%`, transition: 'width 0.4s var(--ease)' }} />
          <div className="sn-dot" style={{ left: `${progressPct}%` }} />
        </div>
      </div>
      <div className="sn-rise" key={step} style={s.content}>
        <div className="sn-micro" style={s.eyebrow}>Step 2 of 5</div>
        <div style={s.title}>Tell us about<br /><em style={s.titleEm}>your symptoms.</em></div>
        <div style={s.hint}>Be honest. Not your best day, not your worst. Your typical reality. The more accurate your answers, the more useful your weekly insights will be.</div>

        {symptomQuestions.map((q, i) => (
          <div key={q.id}>
            {q.section && (
              <div style={s.sectionDivider}>
                <div style={s.sectionDividerLine} />
                <div className="sn-micro sn-micro-dim" style={s.sectionDividerLabel}>{q.section}</div>
                <div style={s.sectionDividerLine} />
              </div>
            )}
            {(!q.type || q.type !== 'text') ? (
              <div className="sn-card" style={{ padding: '18px 16px', marginBottom: '12px' }}>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 400, color: '#20241F', lineHeight: 1.3, marginBottom: '12px' }}>{q.label}</div>
                <div style={s.optionGrid}>
                  {q.options.map(opt => (
                    <button key={opt} style={answers[q.id] === opt ? s.optionOn : s.option} onClick={() => setAnswer(q.id, opt)}>{opt}</button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="sn-card" style={{ padding: '18px 16px', marginBottom: '12px' }}>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 400, color: '#20241F', lineHeight: 1.3, marginBottom: '12px' }}>{q.label} {q.optional && <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#A8A69E', fontWeight: 400 }}>(optional)</span>}</div>
                <textarea className="sn-input" style={s.textarea} placeholder={q.placeholder} value={answers[q.id] || ''} onChange={e => setAnswer(q.id, e.target.value)} />
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={s.footer}>
        <button className="sn-btn" style={s.cta} disabled={!allSymptomAnswered} onClick={() => setStep(2)}>Continue</button>
      </div>
    </div>
  )

  // STEP 2 — Dynamic baseline scores
  if (step === 2) return (
    <div style={s.wrap}>
      <style>{PAGE_CSS}</style>
      <div style={s.topBar}>
        <button style={s.back} onClick={() => setStep(1)}>← Back</button>
        <div style={s.logo}>Sensify<span style={s.logoEm}>.</span></div>
        <div style={{ width: 40 }} />
      </div>
      <div style={{ padding: '14px 24px 2px' }}>
        <div className="sn-track" style={{ maxWidth: '560px', margin: '0 auto' }}>
          <div className="sn-fill" style={{ width: `${progressPct}%`, transition: 'width 0.4s var(--ease)' }} />
          <div className="sn-dot" style={{ left: `${progressPct}%` }} />
        </div>
      </div>
      <div className="sn-rise" key={step} style={s.content}>
        <div className="sn-micro" style={s.eyebrow}>Step 3 of 5</div>
        <div style={s.title}>Rate your symptoms<br /><em style={s.titleEm}>right now.</em></div>
        <div style={s.hint}>
          {baselineScales.length > 0
            ? `Based on what you told us, we're asking about ${baselineScales.length} symptom${baselineScales.length !== 1 ? 's' : ''}.`
            : 'Rate how you\'re feeling overall today. This becomes your baseline.'}
        </div>
        <div style={s.importantNote}>
          Be honest, not hopeful — these scores only help you if they're real.
        </div>

        {baselineScales.length > 0 && (
          <div className="sn-hero" style={{ borderRadius: '24px', padding: '22px 20px', marginBottom: '18px' }}>
            <div className="sn-micro" style={{ position: 'relative', color: '#C9A227', marginBottom: '10px' }}>This part matters most</div>
            <div style={{ position: 'relative', fontFamily: 'Fraunces, serif', fontSize: '21px', fontWeight: 400, color: '#FAF8F4', lineHeight: 1.25, marginBottom: '8px' }}>Think about what's <em style={{ color: '#8BAE8A' }}>normal for you.</em></div>
            <div style={{ position: 'relative', fontSize: '12.5px', color: 'rgba(250,248,244,0.65)', lineHeight: 1.6 }}>A typical week over the past couple of months, not just how you feel today. This becomes your baseline, and everything you improve gets measured against it.</div>
          </div>
        )}
        {baselineScales.length > 0 ? baselineScales.map(scale => (
          <div key={scale.id} className="sn-card" style={{ padding: '18px 16px', marginBottom: '12px' }}>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 400, color: '#20241F', lineHeight: 1.3 }}>{scale.label}</div>
            <div style={{ ...s.scaleLabels, margin: '13px 0 8px' }}><span>{scale.low}</span><span>{scale.high}</span></div>
            <div style={s.scaleRow}>
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <button key={n} style={answers[scale.id] === n ? { ...s.sbtOn, fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 600 } : s.sbt} onClick={() => setAnswer(scale.id, n)}>{n}</button>
              ))}
            </div>
          </div>
        )) : (
          <div style={{ color: '#7A7A72', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
            Based on your answers, your symptoms are minimal in a typical week. That's a good starting point. We'll track any changes from here.
          </div>
        )}
      </div>
      <div style={s.footer}>
        <button className="sn-btn" style={s.cta} disabled={!allBaselinesAnswered} onClick={() => setStep(3)}>Continue</button>
      </div>
    </div>
  )

  // STEP 3 — Food frequency
  if (step === 3) return (
    <div style={s.wrap}>
      <style>{PAGE_CSS}</style>
      <div style={s.topBar}>
        <button style={s.back} onClick={() => setStep(2)}>← Back</button>
        <div style={s.logo}>Sensify<span style={s.logoEm}>.</span></div>
        <div style={{ width: 40 }} />
      </div>
      <div style={{ padding: '14px 24px 2px' }}>
        <div className="sn-track" style={{ maxWidth: '560px', margin: '0 auto' }}>
          <div className="sn-fill" style={{ width: `${progressPct}%`, transition: 'width 0.4s var(--ease)' }} />
          <div className="sn-dot" style={{ left: `${progressPct}%` }} />
        </div>
      </div>
      <div className="sn-rise" key={step} style={s.content}>
        <div className="sn-micro" style={s.eyebrow}>Step 4 of 5</div>
        <div style={s.title}>How often do you eat<br /><em style={s.titleEm}>these foods?</em></div>
        <div style={s.hint}>Only rate foods you actually eat. Leave anything blank and we'll assume you rarely or never eat it.</div>
        <div style={s.importantNote}>
          This helps us build your elimination list the moment your lab results arrive. No extra steps needed.
        </div>
        {FOOD_CATEGORIES.map(cat => (
          <div key={cat.category}>
            <div style={s.categoryTitle2}>{cat.category}</div>
            {cat.foods.map((food, foodIndex) => (
              <div
                key={food}
                style={{ padding: '13px 15px', borderRadius: '16px', marginBottom: '7px', background: '#FFFFFF', boxShadow: 'var(--shadow-1)' }}
              >
                {/* Stacked: name above a wrapping pill row, so all six options
                    stay on-screen at phone width (QA 2026-10-21 #1). */}
                <div style={{ fontSize: '14.5px', color: '#20241F', fontWeight: 500, marginBottom: '9px' }}>{food}</div>
                <div style={s.freqBtns}>
                  {FREQUENCY_OPTIONS.map(opt => (
                    <button key={opt.value} style={foodFrequency[food] === opt.value ? s.freqBtnOn : s.freqBtn} onClick={() => setFrequency(food, opt.value)}>{opt.label}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={s.footer}>
        <button className="sn-btn" style={s.cta} onClick={() => setStep(4)}>
          Continue
        </button>
      </div>
    </div>
  )

  // STEP 4 — Lifestyle baselines (sleep, stress, hydration, gender, alcohol)
  if (step === 4) {
    const drinks = lifestyle.drinks_alcohol
    const setLife = (k, v) => setLifestyle(prev => ({ ...prev, [k]: v }))
    const lifestyleComplete = lifestyle.avg_sleep && lifestyle.avg_stress && lifestyle.avg_hydration
      && lifestyle.gender && lifestyle.drinks_alcohol
      && (lifestyle.drinks_alcohol === 'no' || lifestyle.avg_drinks_week)
      && padInRange('avg_sleep', lifestyle.avg_sleep)
      && padInRange('avg_hydration', lifestyle.avg_hydration)
      && padInRange('avg_drinks_week', lifestyle.avg_drinks_week)
    // Out-of-range entries never close the pad; the warning stays until corrected.
    const confirmPad = (field) => {
      if (!padInRange(field, lifestyle[field])) { setPadWarning(field); return }
      setPadWarning(null)
      setOpenPad(null)
    }
    const NumField = ({ field, unit, decimals, maxDigits }) => (
      <>
        <button type="button" onClick={() => { setPadWarning(null); setOpenPad(openPad === field ? null : field) }} style={{ width: '100%', textAlign: 'left', background: '#FFFFFF', border: 'none', boxShadow: 'var(--shadow-1), inset 0 1px 3px rgba(56,62,48,0.05)', borderRadius: 14, padding: '13px 15px', fontSize: 15, color: !lifestyle[field] ? '#B8B6AE' : '#20241F', cursor: 'pointer' }}>
          {!lifestyle[field] ? 'Tap to enter' : `${lifestyle[field]} ${unit}`}
        </button>
        {openPad === field && (
          <div className="sn-pad" style={{ marginTop: 10 }}>
            <NumPad value={lifestyle[field] || ''} onChange={v => { setPadWarning(null); setLifestyle({ ...lifestyle, [field]: v }) }} decimals={decimals} maxDigits={maxDigits} unit={unit} onSubmit={() => confirmPad(field)} />
            {padWarning === field && <div style={s.padWarn}>{PAD_LIMITS[field].warn}</div>}
          </div>
        )}
      </>
    )
    const Band = ({ field, options }) => (
      <div style={s.freqBtns}>
        {options.map(opt => (
          <button key={opt.value}
            style={lifestyle[field] === opt.value ? s.freqBtnOn : s.freqBtn}
            onClick={() => setLife(field, opt.value)}>{opt.label}</button>
        ))}
      </div>
    )
    return (
      <div style={s.wrap}>
        <style>{PAGE_CSS}</style>
        <div style={s.topBar}>
          <button style={s.back} onClick={() => setStep(3)}>← Back</button>
          <div style={s.logo}>Sensify<span style={s.logoEm}>.</span></div>
          <div style={{ width: 40 }} />
        </div>
        <div style={{ padding: '14px 24px 2px' }}>
        <div className="sn-track" style={{ maxWidth: '560px', margin: '0 auto' }}>
          <div className="sn-fill" style={{ width: `${progressPct}%`, transition: 'width 0.4s var(--ease)' }} />
          <div className="sn-dot" style={{ left: `${progressPct}%` }} />
        </div>
      </div>
        <div className="sn-rise" key={step} style={s.content}>
          <div className="sn-micro" style={s.eyebrow}>Step 5 of 5</div>
          <div style={s.title}>A bit about<br /><em style={s.titleEm}>your normal.</em></div>
          <div style={s.hint}>Sleep, stress, and a few habits shape how you feel as much as food does. Knowing your usual baseline lets us tell a real change from an ordinary day later on.</div>

          <div className="sn-card" style={s.questionBlock}>
            <div style={s.questionLabel}>On a typical night, how many hours do you sleep? <span style={{ color: '#A0A096', fontWeight: 400, fontSize: '13px' }}>to the half hour is fine</span></div>
            <NumField field="avg_sleep" unit="hours" decimals maxDigits={2} />
          </div>

          <div className="sn-card" style={s.questionBlock}>
            <div style={s.questionLabel}>How would you describe your usual stress level?</div>
            <Band field="avg_stress" options={STRESS_BANDS} />
          </div>

          <div className="sn-card" style={s.questionBlock}>
            <div style={s.questionLabel}>On a typical day, how many cups of water do you drink?</div>
            <NumField field="avg_hydration" unit="cups" maxDigits={2} />
          </div>

          <div className="sn-card" style={s.questionBlock}>
            <div style={s.questionLabel}>What's your sex? <span style={{ color: '#A0A096', fontWeight: 400 }}>(so we can account for cycle-related effects if relevant)</span></div>
            <Band field="gender" options={GENDER_OPTIONS} />
          </div>

          <div className="sn-card" style={s.questionBlock}>
            <div style={s.questionLabel}>Do you drink alcohol?</div>
            <div style={s.freqBtns}>
              {[{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }].map(opt => (
                <button key={opt.value}
                  style={lifestyle.drinks_alcohol === opt.value ? s.freqBtnOn : s.freqBtn}
                  onClick={() => setLife('drinks_alcohol', opt.value)}>{opt.label}</button>
              ))}
            </div>
          </div>

          {drinks === 'yes' && (
            <div className="sn-card" style={s.questionBlock}>
              <div style={s.questionLabel}>About how many drinks per week, on average?</div>
              <NumField field="avg_drinks_week" unit="drinks / week" maxDigits={2} />
            </div>
          )}
        </div>
        <div style={s.footer}>
          <button className="sn-btn" style={s.cta} disabled={!lifestyleComplete || saving} onClick={handleComplete}>
            {saving ? 'Saving your program...' : 'Complete intake →'}
          </button>
        </div>
      </div>
    )
  }

  return null
}
