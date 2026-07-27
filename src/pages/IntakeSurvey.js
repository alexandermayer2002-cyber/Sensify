import React, { useState } from 'react'
import { supabase } from '../supabase'
import NumPad from '../components/NumPad'

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


const FREQ_NEVER = ['Never', 'Rarely or never']
const FREQ_FREQUENT = ['Daily', 'A few times a week', 'Regularly', 'Almost daily', 'Most afternoons', 'Daily and severe', 'Poor. Hard to fall or stay asleep', 'Very poor']

const isFrequent = (val) => val && FREQ_FREQUENT.some(f => val.includes(f.split(' ')[0]) || val === f)
const isNever = (val) => !val || FREQ_NEVER.includes(val)

const s = {
  wrap: { minHeight: '100vh', background: '#FAF8F4', display: 'flex', flexDirection: 'column', fontFamily: 'DM Sans, sans-serif' },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: '#FFFFFF', borderBottom: '1px solid rgba(0,0,0,0.08)', position: 'sticky', top: 0, zIndex: 10 },
  logo: { fontFamily: 'Fraunces, serif', fontSize: '19px', fontWeight: 500, color: '#1C1C1C' },
  logoEm: { color: '#3D5C3C' },
  back: { fontSize: '13px', color: '#7A7A72', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'DM Sans, sans-serif' },
  progress: { height: '3px', background: 'rgba(0,0,0,0.06)' },
  progressFill: { height: '100%', background: '#3D5C3C', transition: 'width 0.4s ease' },
  content: { flex: 1, padding: '32px 24px 100px', maxWidth: '560px', margin: '0 auto', width: '100%' },
  eyebrow: { fontSize: '12px', fontWeight: 500, color: '#7A7A72', marginBottom: '10px' },
  title: { fontFamily: 'Fraunces, serif', fontSize: '26px', fontWeight: 400, lineHeight: 1.22, marginBottom: '8px', letterSpacing: '-0.4px' },
  titleEm: { fontStyle: 'normal', color: 'inherit' },
  hint: { fontSize: '13px', color: '#7A7A72', marginBottom: '28px', lineHeight: 1.7 },
  importantNote: { fontSize: '12.5px', color: '#7A7A72', lineHeight: 1.6, marginBottom: '20px' },
  categoryGrid: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' },
  categoryCard: { background: '#FFFFFF', border: '1.5px solid rgba(0,0,0,0.08)', borderRadius: '14px', padding: '18px', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'flex-start', gap: '14px' },
  categoryCardOn: { background: '#EDF3ED', border: '1.5px solid #3D5C3C', borderRadius: '14px', padding: '18px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '14px' },
  categoryCardDisabled: { background: '#FAF8F4', border: '1.5px solid rgba(0,0,0,0.05)', borderRadius: '14px', padding: '18px', cursor: 'not-allowed', display: 'flex', alignItems: 'flex-start', gap: '14px', opacity: 0.4 },
  categoryCheck: { width: '20px', height: '20px', borderRadius: '6px', border: '1.5px solid rgba(0,0,0,0.15)', background: '#FFFFFF', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' },
  categoryCheckOn: { width: '20px', height: '20px', borderRadius: '6px', border: '1.5px solid #3D5C3C', background: '#3D5C3C', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' },
  categoryTitle: { fontSize: '15px', fontWeight: 500, color: '#1C1C1C', marginBottom: '3px' },
  categoryTitleOn: { fontSize: '15px', fontWeight: 500, color: '#3D5C3C', marginBottom: '3px' },
  categoryDesc: { fontSize: '13px', color: '#7A7A72', lineHeight: 1.5 },
  maxNote: { fontSize: '12px', color: '#7A7A72', textAlign: 'center', marginTop: '-8px', marginBottom: '20px' },
  questionBlock: { marginBottom: '14px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '14px', padding: '18px 16px' },
  questionLabel: { fontFamily: 'Fraunces, serif', fontSize: '17.5px', fontWeight: 400, marginBottom: '12px', lineHeight: 1.3, color: '#1C1C1C' },
  optionGrid: { display: 'flex', flexDirection: 'column', gap: '8px' },
  option: { padding: '13px 16px', borderRadius: '11px', border: 'none', background: '#F4F2EC', fontSize: '14px', cursor: 'pointer', color: '#3A3A35', fontFamily: 'DM Sans, sans-serif', textAlign: 'left', transition: 'all 0.12s', lineHeight: 1.4 },
  optionOn: { padding: '13px 16px', borderRadius: '11px', border: 'none', background: '#3D5C3C', fontSize: '14px', cursor: 'pointer', color: '#FFFFFF', fontFamily: 'DM Sans, sans-serif', textAlign: 'left', fontWeight: 500, lineHeight: 1.4, boxShadow: '0 2px 8px rgba(61,92,60,0.28)' },
  sectionDivider: { display: 'flex', alignItems: 'center', gap: '12px', margin: '28px 0 24px' },
  sectionDividerLine: { flex: 1, height: '1px', background: 'rgba(0,0,0,0.07)' },
  sectionDividerLabel: { fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#7A7A72', whiteSpace: 'nowrap' },
  scaleWrap: { marginBottom: '28px' },
  scaleLabels: { display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#7A7A72', marginBottom: '8px' },
  scaleRow: { display: 'flex', gap: '5px' },
  sbt: { flex: 1, height: '44px', borderRadius: '9px', border: 'none', background: '#EDF3ED', fontSize: '14px', cursor: 'pointer', fontWeight: 400, color: '#5A5A52', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.12s' },
  sbtOn: { flex: 1, height: '44px', borderRadius: '9px', border: 'none', background: '#3D5C3C', fontSize: '18px', cursor: 'pointer', fontWeight: 400, color: 'white', fontFamily: 'Fraunces, serif', boxShadow: '0 2px 8px rgba(61,92,60,0.3)' },
  textarea: { width: '100%', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '12px', padding: '14px 15px', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', color: '#1C1C1C', background: '#FAF8F4', resize: 'none', height: '96px', outline: 'none', lineHeight: 1.5 },
  categoryTitle2: { fontFamily: 'Fraunces, serif', fontSize: '15px', fontWeight: 400, color: '#3D5C3C', margin: '22px 0 12px', letterSpacing: '-0.2px' },
  freqBtns: { display: 'flex', gap: '4px' },
  freqBtn: { padding: '7px 11px', borderRadius: '8px', border: 'none', background: '#EDF3ED', fontSize: '12px', cursor: 'pointer', color: '#5A5A52', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.12s', whiteSpace: 'nowrap' },
  freqBtnOn: { padding: '7px 11px', borderRadius: '8px', border: 'none', background: '#3D5C3C', fontSize: '12px', cursor: 'pointer', color: '#FFFFFF', fontWeight: 500, fontFamily: 'DM Sans, sans-serif', boxShadow: '0 2px 6px rgba(61,92,60,0.25)', whiteSpace: 'nowrap' },
  footer: { position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 24px', background: '#FAF8F4', borderTop: '1px solid rgba(0,0,0,0.06)' },
  cta: { background: '#3D5C3C', color: 'white', border: 'none', borderRadius: '11px', padding: '14px', width: '100%', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  ctaDisabled: { background: '#3D5C3C', color: 'white', border: 'none', borderRadius: '11px', padding: '14px', width: '100%', fontSize: '14px', fontWeight: 500, cursor: 'not-allowed', fontFamily: 'DM Sans, sans-serif', opacity: 0.35 },
}

export default function IntakeSurvey({ session, onComplete, onBack }) {
  const [step, setStep] = useState(-1)
  const [agreed, setAgreed] = useState(false)
  const [signatureName, setSignatureName] = useState('')
  const [selectedCategories, setSelectedCategories] = useState([])
  const [answers, setAnswers] = useState({})
  const [foodFrequency, setFoodFrequency] = useState({})
  // Lifestyle baselines (sleep/stress/hydration/gender/alcohol) — the personal
  // "normal" that daily check-in factors are compared against for divergence.
  const [lifestyle, setLifestyle] = useState({})
  const [openPad, setOpenPad] = useState(null)
  const [saving, setSaving] = useState(false)

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
      questions.push({ section: hasDigestive || hasEnergy ? 'General wellness' : 'Your wellness', id: 'general_digestion', label: 'How often do you experience digestive discomfort like bloating, gas, or cramping?', options: ['Rarely or never', 'Occasionally', 'Regularly', 'Almost daily'] })
      if (!hasEnergy) {
        questions.push({ section: null, id: 'general_energy', label: 'How would you describe your typical energy levels?', options: ['Consistently good', 'Variable. Good and bad days', 'Often low', 'Chronically poor'] })
        questions.push({ section: null, id: 'general_crashes', label: 'Do you experience afternoon energy crashes?', options: ['Never', 'Occasionally', 'Most afternoons', 'Daily'] })
        questions.push({ section: null, id: 'sleep_quality', label: 'How would you describe your sleep quality?', options: ['Restful and consistent', 'Okay but not great', 'Poor. Hard to fall or stay asleep', 'Very poor'] })
      }
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
      if (isFrequent(a.crashes_freq) || isFrequent(a.general_crashes)) {
        scales.push({ id: 'baseline_afternoon', label: 'In a typical week, how would you rate your afternoon energy?', low: 'Severe crash', high: 'Sustained energy' })
      }
      if (a.sleep_quality && a.sleep_quality !== 'Restful and consistent') {
        scales.push({ id: 'baseline_sleep', label: 'In a typical week, how would you rate your sleep quality?', low: 'Very poor', high: 'Excellent' })
      }
    }

    // General fallback — if no specific symptoms flagged but they selected general
    if (hasGeneral && scales.length === 0) {
      scales.push({ id: 'baseline_wellbeing', label: 'In a typical week, how would you rate your overall wellbeing?', low: 'Very poor', high: 'Excellent' })
      scales.push({ id: 'baseline_energy', label: 'In a typical week, how would you rate your energy?', low: 'Exhausted', high: 'Full energy' })
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
      baseline_bloating: answers.baseline_bloating,
      baseline_energy: answers.baseline_energy,
      baseline_digestive: answers.baseline_digestive,
      baseline_clarity: answers.baseline_clarity,
      baseline_gas: answers.baseline_gas,
      baseline_reflux: answers.baseline_reflux,
      baseline_afternoon: answers.baseline_afternoon,
      baseline_sleep: answers.baseline_sleep,
      baseline_wellbeing: answers.baseline_wellbeing,
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
    setSaving(false)
    onComplete()
  }

  const canProceedFromAgreement = agreed && signatureName.trim().length >= 2

  // STEP -1 — Agreement
  if (step === -1) return (
    <div style={s.wrap}>
      <div style={s.topBar}>
        <button style={s.back} onClick={onBack}>← Back</button>
        <div style={s.logo}>Sensify<span style={s.logoEm}>.</span></div>
        <div style={{ width: 40 }} />
      </div>
      <div style={{ ...s.content, paddingTop: '40px' }}>
        <div style={s.eyebrow}>Before you begin</div>
        <div style={s.title}>A few things to<br /><em style={s.titleEm}>understand first.</em></div>
        <div style={s.hint}>Please read and agree to the following before starting your intake survey.</div>

        <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
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
                desc: 'Your program includes a quick daily check-in inside the app, plus weekly reviews. Staying consistent with check-ins is what makes your results trustworthy. We may send you email reminders to help you stay on track.'
              },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '13px', alignItems: 'flex-start', paddingBottom: i < 5 ? '16px' : 0, borderBottom: i < 5 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
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
            I understand that Sensify is a wellness program and not a medical service, that insights are for informational purposes only, and that my program data may be accessed by the Sensify team to support my program. I agree to receive program-related emails from Sensify, including check-in reminders and account notifications.
          </div>
        </div>

        {/* Signature */}
        <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#1C1C1C' }}>
          Type your full name as your signature
        </div>
        <input
          style={{ width: '100%', height: 'auto', padding: '14px 16px', fontSize: '16px', marginBottom: '6px', fontFamily: 'Fraunces, serif', color: '#1C1C1C', background: '#FAF8F4', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '12px', outline: 'none', boxSizing: 'border-box' }}
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
          style={canProceedFromAgreement ? s.cta : s.ctaDisabled}
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
      <div style={s.topBar}>
        <button style={s.back} onClick={onBack}>← Back</button>
        <div style={s.logo}>Sensify<span style={s.logoEm}>.</span></div>
        <div style={{ width: 40 }} />
      </div>
      <div style={s.progress}><div style={{ ...s.progressFill, width: `${progressPct}%` }} /></div>
      <div style={s.content}>
        <div style={s.eyebrow}>Step 1 of 5</div>
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
        <button style={selectedCategories.length > 0 ? s.cta : s.ctaDisabled} disabled={selectedCategories.length === 0} onClick={() => setStep(1)}>Continue</button>
      </div>
    </div>
  )

  // STEP 1 — Adaptive symptom questions
  if (step === 1) return (
    <div style={s.wrap}>
      <div style={s.topBar}>
        <button style={s.back} onClick={() => setStep(0)}>← Back</button>
        <div style={s.logo}>Sensify<span style={s.logoEm}>.</span></div>
        <div style={{ width: 40 }} />
      </div>
      <div style={s.progress}><div style={{ ...s.progressFill, width: `${progressPct}%` }} /></div>
      <div style={s.content}>
        <div style={s.eyebrow}>Step 2 of 5</div>
        <div style={s.title}>Tell us about<br /><em style={s.titleEm}>your symptoms.</em></div>
        <div style={s.hint}>Be honest. Not your best day, not your worst. Your typical reality. The more accurate your answers, the more useful your weekly insights will be.</div>

        {symptomQuestions.map((q, i) => (
          <div key={q.id}>
            {q.section && (
              <div style={s.sectionDivider}>
                <div style={s.sectionDividerLine} />
                <div style={s.sectionDividerLabel}>{q.section}</div>
                <div style={s.sectionDividerLine} />
              </div>
            )}
            {(!q.type || q.type !== 'text') ? (
              <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '14px', padding: '18px 16px', marginBottom: '12px' }}>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: '17.5px', fontWeight: 400, color: '#1C1C1C', lineHeight: 1.3, marginBottom: '12px' }}>{q.label}</div>
                <div style={s.optionGrid}>
                  {q.options.map(opt => (
                    <button key={opt} style={answers[q.id] === opt ? s.optionOn : s.option} onClick={() => setAnswer(q.id, opt)}>{opt}</button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '14px', padding: '18px 16px', marginBottom: '12px' }}>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: '17.5px', fontWeight: 400, color: '#1C1C1C', lineHeight: 1.3, marginBottom: '12px' }}>{q.label} {q.optional && <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#A8A69E', fontWeight: 400 }}>(optional)</span>}</div>
                <textarea style={s.textarea} placeholder={q.placeholder} value={answers[q.id] || ''} onChange={e => setAnswer(q.id, e.target.value)} />
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={s.footer}>
        <button style={allSymptomAnswered ? s.cta : s.ctaDisabled} disabled={!allSymptomAnswered} onClick={() => setStep(2)}>Continue</button>
      </div>
    </div>
  )

  // STEP 2 — Dynamic baseline scores
  if (step === 2) return (
    <div style={s.wrap}>
      <div style={s.topBar}>
        <button style={s.back} onClick={() => setStep(1)}>← Back</button>
        <div style={s.logo}>Sensify<span style={s.logoEm}>.</span></div>
        <div style={{ width: 40 }} />
      </div>
      <div style={s.progress}><div style={{ ...s.progressFill, width: `${progressPct}%` }} /></div>
      <div style={s.content}>
        <div style={s.eyebrow}>Step 3 of 5</div>
        <div style={s.title}>Rate your symptoms<br /><em style={s.titleEm}>right now.</em></div>
        <div style={s.hint}>
          {baselineScales.length > 0
            ? `Based on what you told us, we're asking about ${baselineScales.length} symptom${baselineScales.length !== 1 ? 's' : ''}. These scores become your starting point. Every improvement will be measured against them.`
            : 'Rate how you\'re feeling overall today. This becomes your baseline.'}
        </div>
        <div style={s.importantNote}>
          These scores become your starting point. Every improvement we track will be measured against what you enter here, so be honest, not hopeful.
        </div>

        {baselineScales.length > 0 && (
          <div style={{ position: 'relative', background: '#22301F', borderRadius: '18px', padding: '22px 20px', marginBottom: '18px', overflow: 'hidden', boxShadow: '0 16px 40px rgba(34,48,31,0.25)' }}>
            <div style={{ position: 'absolute', top: -50, right: -50, width: 170, height: 170, borderRadius: '50%', background: '#8BAE8A', opacity: 0.1, pointerEvents: 'none' }} />
            <div style={{ position: 'relative', fontFamily: 'DM Mono, monospace', fontSize: '9px', letterSpacing: '1.5px', color: '#C9A227', textTransform: 'uppercase', marginBottom: '10px' }}>This part matters most</div>
            <div style={{ position: 'relative', fontFamily: 'Fraunces, serif', fontSize: '21px', fontWeight: 300, color: '#FAF8F4', lineHeight: 1.25, marginBottom: '8px' }}>Think about what's <em style={{ fontStyle: 'italic', color: '#8BAE8A' }}>normal for you.</em></div>
            <div style={{ position: 'relative', fontSize: '12.5px', color: 'rgba(250,248,244,0.65)', lineHeight: 1.6 }}>A typical week over the past couple of months, not just how you feel today. This becomes your baseline, and everything you improve gets measured against it.</div>
          </div>
        )}
        {baselineScales.length > 0 ? baselineScales.map(scale => (
          <div key={scale.id} style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '14px', padding: '18px 16px', marginBottom: '12px' }}>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: '17.5px', fontWeight: 400, color: '#1C1C1C', lineHeight: 1.3 }}>{scale.label}</div>
            <div style={{ ...s.scaleLabels, margin: '13px 0 8px' }}><span>{scale.low}</span><span>{scale.high}</span></div>
            <div style={s.scaleRow}>
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <button key={n} style={answers[scale.id] === n ? { ...s.sbtOn, fontFamily: 'DM Sans, sans-serif', fontSize: '16px', fontWeight: 600 } : s.sbt} onClick={() => setAnswer(scale.id, n)}>{n}</button>
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
        <button style={allBaselinesAnswered ? s.cta : s.ctaDisabled} disabled={!allBaselinesAnswered} onClick={() => setStep(3)}>Continue</button>
      </div>
    </div>
  )

  // STEP 3 — Food frequency
  if (step === 3) return (
    <div style={s.wrap}>
      <div style={s.topBar}>
        <button style={s.back} onClick={() => setStep(2)}>← Back</button>
        <div style={s.logo}>Sensify<span style={s.logoEm}>.</span></div>
        <div style={{ width: 40 }} />
      </div>
      <div style={s.progress}><div style={{ ...s.progressFill, width: `${progressPct}%` }} /></div>
      <div style={s.content}>
        <div style={s.eyebrow}>Step 4 of 5</div>
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
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '13px 15px', borderRadius: '12px', marginBottom: '7px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.06)' }}
              >
                <div style={{ fontSize: '14.5px', color: '#1C1C1C', fontWeight: 500 }}>{food}</div>
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
        <button style={s.cta} onClick={() => setStep(4)}>
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
    const NumField = ({ field, unit, decimals, maxDigits }) => (
      <>
        <button type="button" onClick={() => setOpenPad(openPad === field ? null : field)} style={{ width: '100%', textAlign: 'left', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, padding: '13px 15px', fontSize: 15, fontFamily: 'DM Sans, sans-serif', color: !lifestyle[field] ? '#B8B6AE' : '#1C1C1C', cursor: 'pointer' }}>
          {!lifestyle[field] ? 'Tap to enter' : `${lifestyle[field]} ${unit}`}
        </button>
        {openPad === field && (
          <div style={{ marginTop: 10 }}>
            <NumPad value={lifestyle[field] || ''} onChange={v => setLifestyle({ ...lifestyle, [field]: v })} decimals={decimals} maxDigits={maxDigits} unit={unit} onSubmit={() => setOpenPad(null)} />
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
        <div style={s.topBar}>
          <button style={s.back} onClick={() => setStep(3)}>← Back</button>
          <div style={s.logo}>Sensify<span style={s.logoEm}>.</span></div>
          <div style={{ width: 40 }} />
        </div>
        <div style={s.progress}><div style={{ ...s.progressFill, width: `${progressPct}%` }} /></div>
        <div style={s.content}>
          <div style={s.eyebrow}>Step 5 of 5</div>
          <div style={s.title}>A bit about<br /><em style={s.titleEm}>your normal.</em></div>
          <div style={s.hint}>Sleep, stress, and a few habits shape how you feel as much as food does. Knowing your usual baseline lets us tell a real change from an ordinary day later on.</div>

          <div style={s.questionBlock}>
            <div style={s.questionLabel}>On a typical night, how many hours do you sleep? <span style={{ color: '#A0A096', fontWeight: 400, fontSize: '13px' }}>(7.5 counts)</span></div>
            <NumField field="avg_sleep" unit="hours" decimals maxDigits={2} />
          </div>

          <div style={s.questionBlock}>
            <div style={s.questionLabel}>How would you describe your usual stress level?</div>
            <Band field="avg_stress" options={STRESS_BANDS} />
          </div>

          <div style={s.questionBlock}>
            <div style={s.questionLabel}>On a typical day, how many cups of water do you drink?</div>
            <NumField field="avg_hydration" unit="cups" maxDigits={2} />
          </div>

          <div style={s.questionBlock}>
            <div style={s.questionLabel}>What's your sex? <span style={{ color: '#A0A096', fontWeight: 400 }}>(so we can account for cycle-related effects if relevant)</span></div>
            <Band field="gender" options={GENDER_OPTIONS} />
          </div>

          <div style={s.questionBlock}>
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
            <div style={s.questionBlock}>
              <div style={s.questionLabel}>About how many drinks per week, on average?</div>
              <div style={s.freqBtns}>
                {[{ label: '1–3', value: '1-3' }, { label: '4–7', value: '4-7' }, { label: '8–14', value: '8-14' }, { label: '15+', value: '15plus' }].map(opt => (
                  <button key={opt.value}
                    style={lifestyle.avg_drinks_week === opt.value ? s.freqBtnOn : s.freqBtn}
                    onClick={() => setLife('avg_drinks_week', opt.value)}>{opt.label}</button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div style={s.footer}>
          <button style={lifestyleComplete ? s.cta : s.ctaDisabled} disabled={!lifestyleComplete || saving} onClick={handleComplete}>
            {saving ? 'Saving your program...' : 'Complete intake →'}
          </button>
        </div>
      </div>
    )
  }

  return null
}
