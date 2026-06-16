import React, { useState, useRef } from 'react'
import { supabase } from '../supabase'
import { aiCall } from '../utils/aiClient'

const s = {
  wrap: { minHeight: '100vh', background: '#FAF8F4', display: 'flex', flexDirection: 'column' },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: '#FFFFFF', borderBottom: '1px solid rgba(0,0,0,0.08)' },
  logo: { fontFamily: 'Fraunces, serif', fontSize: '19px', fontWeight: 500, color: '#1C1C1C' },
  logoEm: { color: '#3D5C3C', fontStyle: 'italic' },
  back: { fontSize: '13px', color: '#7A7A72', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'DM Sans, sans-serif' },
  content: { flex: 1, padding: '28px 24px' },
  title: { fontFamily: 'Fraunces, serif', fontSize: '26px', fontWeight: 300, marginBottom: '6px' },
  titleEm: { fontStyle: 'italic', color: '#3D5C3C' },
  sub: { fontSize: '14px', color: '#7A7A72', marginBottom: '28px', lineHeight: 1.6 },
  methodRow: { display: 'flex', gap: '10px', marginBottom: '24px' },
  methodBtn: { flex: 1, padding: '14px 10px', borderRadius: '12px', border: '1.5px solid rgba(0,0,0,0.08)', background: '#FFFFFF', cursor: 'pointer', textAlign: 'center', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.12s' },
  methodBtnActive: { flex: 1, padding: '14px 10px', borderRadius: '12px', border: '2px solid #3D5C3C', background: '#EDF3ED', cursor: 'pointer', textAlign: 'center', fontFamily: 'DM Sans, sans-serif' },
  methodIcon: { fontSize: '24px', marginBottom: '5px' },
  methodLabel: { fontSize: '12px', fontWeight: 500, color: '#1C1C1C' },
  uploadZone: { border: '2px dashed rgba(61,92,60,0.2)', borderRadius: '14px', padding: '40px 20px', textAlign: 'center', background: '#EDF3ED', cursor: 'pointer', marginBottom: '16px', transition: 'all 0.15s' },
  uploadIcon: { width: '48px', height: '48px', background: '#3D5C3C', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' },
  uploadTitle: { fontSize: '15px', fontWeight: 500, marginBottom: '4px' },
  uploadSub: { fontSize: '13px', color: '#7A7A72' },
  fileInput: { display: 'none' },
  fileCard: { background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '10px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' },
  fileIcon: { width: '34px', height: '34px', background: '#FAEAEA', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '16px' },
  fileName: { fontSize: '13px', fontWeight: 500 },
  fileSize: { fontSize: '11px', color: '#7A7A72' },
  fileRemove: { marginLeft: 'auto', fontSize: '12px', color: '#C95B5B', cursor: 'pointer' },
  manualSection: { marginBottom: '16px' },
  manualSearch: { width: '100%', border: '1.5px solid rgba(0,0,0,0.08)', borderRadius: '10px', padding: '12px 14px', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', marginBottom: '12px', outline: 'none', background: '#FFFFFF' },
  foodItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' },
  foodName: { fontSize: '14px', fontWeight: 400 },
  levelBtns: { display: 'flex', gap: '5px' },
  levelBtn: { padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(0,0,0,0.1)', background: '#FAF8F4', fontSize: '11px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 500, color: '#7A7A72', transition: 'all 0.1s' },
  levelBtnHigh: { padding: '4px 10px', borderRadius: '20px', border: '1px solid #D64545', background: '#FBE9E9', fontSize: '11px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 500, color: '#A32D2D' },
  levelBtnMod: { padding: '4px 10px', borderRadius: '20px', border: '1px solid #E8941F', background: '#FCEFD9', fontSize: '11px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 500, color: '#8A5410' },
  levelBtnLow: { padding: '4px 10px', borderRadius: '20px', border: '1px solid #2C9D8A', background: '#DEF2EE', fontSize: '11px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 500, color: '#1A6256' },
  processingCard: { background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '14px', padding: '32px 24px', textAlign: 'center', marginBottom: '16px' },
  spinner: { width: '36px', height: '36px', border: '3px solid #EDF3ED', borderTopColor: '#3D5C3C', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' },
  processingTitle: { fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 300, marginBottom: '6px' },
  processingTitle2: { fontStyle: 'italic', color: '#3D5C3C' },
  processingSub: { fontSize: '13px', color: '#7A7A72' },
  resultSection: { marginBottom: '20px' },
  resultHeader: { fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#7A7A72', marginBottom: '8px' },
  resultItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '9px', marginBottom: '7px' },
  resultLeft: { display: 'flex', alignItems: 'center', gap: '9px', fontSize: '14px' },
  resultDot: { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
  badge: { fontSize: '11px', fontWeight: 500, padding: '3px 9px', borderRadius: '20px' },
  editSelect: { fontSize: '12px', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '6px', padding: '3px 7px', background: '#FAF8F4', color: '#1C1C1C', fontFamily: 'DM Sans, sans-serif', cursor: 'pointer' },
  confirmBar: { background: '#EDF3ED', border: '1px solid rgba(61,92,60,0.13)', borderRadius: '10px', padding: '11px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#3D5C3C' },
  checkIcon: { width: '16px', height: '16px', background: '#3D5C3C', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  errorCard: { background: '#FAEAEA', border: '1px solid rgba(201,91,91,0.2)', borderRadius: '10px', padding: '14px', marginBottom: '16px', fontSize: '13px', color: '#C95B5B', lineHeight: 1.6 },
  cta: { background: '#3D5C3C', color: 'white', border: 'none', borderRadius: '11px', padding: '14px', width: '100%', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', marginBottom: '10px' },
  ctaDisabled: { background: '#3D5C3C', color: 'white', border: 'none', borderRadius: '11px', padding: '14px', width: '100%', fontSize: '14px', fontWeight: 500, cursor: 'not-allowed', fontFamily: 'DM Sans, sans-serif', opacity: 0.4, marginBottom: '10px' },
  secBtn: { background: 'none', color: '#7A7A72', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '11px', padding: '13px', width: '100%', fontSize: '13px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
}

const COMMON_FOODS = [
  'Beef', 'Chicken', 'Pork', 'Lamb', 'Turkey', 'Egg White', 'Egg Yolk',
  'Cow Milk', 'Cheese', 'Yogurt', 'Butter', 'Whey',
  'Wheat', 'Gluten', 'Corn', 'Rice', 'Oats', 'Barley', 'Rye',
  'Almond', 'Cashew', 'Walnut', 'Peanut', 'Pistachio', 'Hazelnut', 'Pecan',
  'Soy', 'Tofu',
  'Salmon', 'Tuna', 'Shrimp', 'Cod', 'Halibut', 'Scallop', 'Crab', 'Lobster',
  'Broccoli', 'Spinach', 'Tomato', 'Carrot', 'Celery', 'Garlic', 'Onion', 'Mushroom', 'Potato', 'Sweet Potato',
  'Apple', 'Banana', 'Orange', 'Strawberry', 'Blueberry', 'Grape', 'Pineapple', 'Mango', 'Avocado', 'Lemon',
  'Coffee', 'Tea', 'Cocoa', 'Vanilla', 'Cane Sugar', 'Honey', 'Sesame', 'Sunflower Seed', 'Flaxseed',
]

const SENSITIVITY_COLORS = {
  High: { bg: '#FBE9E9', color: '#A32D2D', dot: '#D64545' },
  Moderate: { bg: '#FCEFD9', color: '#8A5410', dot: '#E8941F' },
  Low: { bg: '#DEF2EE', color: '#1A6256', dot: '#2C9D8A' },
}

export default function LabResults({ session, onComplete, onBack }) {
  const [method, setMethod] = useState('pdf')
  const [file, setFile] = useState(null)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [processingMsg, setProcessingMsg] = useState('')
  const [extractedFoods, setExtractedFoods] = useState(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [manualFoods, setManualFoods] = useState({})
  const [saving, setSaving] = useState(false)
  const fileRef = useRef()
  const cameraRef = useRef()

  const handleFile = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setUploadedFile(e.target.files[0])
      setExtractedFoods(null)
      setError('')
    }
  }

  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const analyzeFile = async () => {
    if (!file) return
    setProcessing(true)
    setError('')

    try {
      setProcessingMsg('Reading your results...')
      const base64 = await toBase64(file)
      const isPDF = file.type === 'application/pdf'

      setTimeout(() => setProcessingMsg('Identifying flagged foods...'), 1200)
      setTimeout(() => setProcessingMsg('Categorizing sensitivity levels...'), 2400)

      const messages = [{
            role: 'user',
            content: [
              {
                type: isPDF ? 'document' : 'image',
                source: {
                  type: 'base64',
                  media_type: file.type,
                  data: base64,
                },
              },
              {
                type: 'text',
                text: `This is a food sensitivity lab result. Extract all flagged foods and their sensitivity levels. 
                
Return ONLY a JSON object with this exact structure, no other text:
{
  "foods": [
    { "name": "Food Name", "level": "High" },
    { "name": "Food Name", "level": "Moderate" },
    { "name": "Food Name", "level": "Low" }
  ]
}

Rules:
- Only include foods that showed a reaction (High, Moderate, or Low)
- Do not include foods with no reaction or foods not tested
- Level must be exactly "High", "Moderate", or "Low"
- Food names should be clean and capitalized (e.g. "Cow Milk" not "cow's milk IgG")
- Return only the JSON, no markdown, no explanation`
              }
            ]
          }]

      const text = await aiCall(messages, 1000)
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)

      setExtractedFoods(parsed.foods)
      setProcessingMsg('')
    } catch (err) {
      setError('Something went wrong reading your file. Please try manual entry instead.')
    }

    setProcessing(false)
  }

  const updateFoodLevel = (index, level) => {
    const updated = [...extractedFoods]
    updated[index].level = level
    setExtractedFoods(updated)
  }

  const toggleManualFood = (food, level) => {
    setManualFoods(prev => {
      if (prev[food] === level) {
        const updated = { ...prev }
        delete updated[food]
        return updated
      }
      return { ...prev, [food]: level }
    })
  }

  const getManualFoodsAsArray = () => {
    return Object.entries(manualFoods).map(([name, level]) => ({ name, level }))
  }

  const handleSave = async () => {
    setSaving(true)
    const foods = method === 'manual' ? getManualFoodsAsArray() : extractedFoods

    if (!foods || foods.length === 0) {
      setError('Please add at least one flagged food before continuing.')
      setSaving(false)
      return
    }

    let file_url = null
    let file_path = null
    if (uploadedFile) {
      const fileExt = uploadedFile.name?.split('.').pop() || 'jpg'
      const fileName = `${session.user.id}-${Date.now()}.${fileExt}`
      const { data: storageData, error: storageError } = await supabase.storage
        .from('lab-results')
        .upload(fileName, uploadedFile, { contentType: uploadedFile.type, upsert: true })
      if (!storageError && storageData) {
        // Store the path, not a public URL — bucket should be private.
        // Admin dashboard generates short-lived signed URLs for viewing.
        file_path = fileName
        const { data: urlData } = supabase.storage.from('lab-results').getPublicUrl(fileName)
        file_url = urlData?.publicUrl // legacy fallback while bucket is still public
      }
    }

    const { error } = await supabase.from('lab_results').upsert({
      user_id: session.user.id,
      user_name: session.user.user_metadata?.full_name || session.user.email,
      foods,
      file_url,
      file_path,
      submitted_at: new Date().toISOString(),
      status: 'pending_review',
    })

    if (error) {
      setError('Could not save your results. Please try again.')
      setSaving(false)
      return
    }

    await supabase.from('profiles').update({
      program_phase: 'pending_review',
    }).eq('id', session.user.id)

    setSaving(false)
    onComplete()
  }

  const filteredFoods = COMMON_FOODS.filter(f =>
    f.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={s.wrap}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <div style={s.topBar}>
        <button style={s.back} onClick={onBack}>← Back</button>
        <div style={s.logo}>sensi<em style={s.logoEm}>fy</em></div>
        <div style={{ width: 40 }}></div>
      </div>

      <div style={s.content}>
        <div style={s.title}>Upload your <em style={s.titleEm}>lab results.</em></div>
        <div style={s.sub}>Choose how you'd like to enter your food sensitivity results. Only enter foods that showed a reaction — anything left blank is assumed clear.</div>

        <div style={s.methodRow}>
          <div style={method === 'pdf' ? s.methodBtnActive : s.methodBtn} onClick={() => { setMethod('pdf'); setExtractedFoods(null); setError('') }}>
            <div style={s.methodIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </div>
            <div style={s.methodLabel}>Upload PDF</div>
          </div>
          <div style={method === 'photo' ? s.methodBtnActive : s.methodBtn} onClick={() => { setMethod('photo'); setExtractedFoods(null); setError('') }}>
            <div style={s.methodIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </div>
            <div style={s.methodLabel}>Take photo</div>
          </div>
          <div style={method === 'manual' ? s.methodBtnActive : s.methodBtn} onClick={() => { setMethod('manual'); setExtractedFoods(null); setError('') }}>
            <div style={s.methodIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </div>
            <div style={s.methodLabel}>Manual entry</div>
          </div>
        </div>

        {error && <div style={s.errorCard}>{error}</div>}

        {(method === 'pdf' || method === 'photo') && !extractedFoods && !processing && (
          <>
            <div style={s.uploadZone} onClick={() => method === 'photo' ? cameraRef.current.click() : fileRef.current.click()}>
              <div style={s.uploadIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <div style={s.uploadTitle}>{method === 'photo' ? 'Take a photo' : 'Upload your PDF'}</div>
              <div style={s.uploadSub}>{method === 'photo' ? 'Point your camera at your results' : 'Tap to browse your files'}</div>
            </div>
            <input ref={fileRef} type="file" accept=".pdf" style={s.fileInput} onChange={handleFile} />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={s.fileInput} onChange={handleFile} />

            {file && (
              <div style={s.fileCard}>
                <div style={s.fileIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3D5C3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {method === 'photo'
                      ? <><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></>
                      : <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></>
                    }
                  </svg>
                </div>
                <div>
                  <div style={s.fileName}>{file.name}</div>
                  <div style={s.fileSize}>{(file.size / 1024).toFixed(0)} KB · Ready to analyze</div>
                </div>
                <div style={s.fileRemove} onClick={() => setFile(null)}>Remove</div>
              </div>
            )}

            <button style={file ? s.cta : s.ctaDisabled} onClick={analyzeFile} disabled={!file}>
              Analyze my results →
            </button>
            <button style={s.secBtn} onClick={() => setMethod('manual')}>Enter manually instead</button>
          </>
        )}

        {processing && (
          <div style={s.processingCard}>
            <div style={s.spinner}></div>
            <div style={s.processingTitle}>
              <em style={s.processingTitle2}>{processingMsg}</em>
            </div>
            <div style={s.processingSub}>This takes about 10 seconds</div>
          </div>
        )}

        {extractedFoods && !processing && (
          <>
            <div style={s.confirmBar}>
              <div style={s.checkIcon}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              {extractedFoods.length} food{extractedFoods.length !== 1 ? 's' : ''} extracted from your results
            </div>

            {['High', 'Moderate', 'Low'].map(level => {
              const foods = extractedFoods.filter(f => f.level === level)
              if (foods.length === 0) return null
              const colors = SENSITIVITY_COLORS[level]
              return (
                <div key={level} style={s.resultSection}>
                  <div style={s.resultHeader}>{level} sensitivity</div>
                  {foods.map((food, i) => (
                    <div key={i} style={s.resultItem}>
                      <div style={s.resultLeft}>
                        <div style={{ ...s.resultDot, background: colors.dot }}></div>
                        {food.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ ...s.badge, background: colors.bg, color: colors.color }}>{level}</div>
                        <select
                          style={s.editSelect}
                          value={food.level}
                          onChange={e => updateFoodLevel(extractedFoods.indexOf(food), e.target.value)}
                        >
                          <option>High</option>
                          <option>Moderate</option>
                          <option>Low</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}

            <button style={s.cta} onClick={handleSave} disabled={saving}>
              {saving ? 'Submitting...' : 'Looks right — submit for review →'}
            </button>
            <button style={s.secBtn} onClick={() => setExtractedFoods(null)}>Re-analyze</button>
          </>
        )}

        {method === 'manual' && (
          <>
            <input
              style={s.manualSearch}
              placeholder="Search foods..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div style={{ fontSize: '12px', color: '#7A7A72', marginBottom: '12px' }}>
              Tap a sensitivity level next to any food that showed a reaction. Leave others blank.
            </div>
            <div style={s.manualSection}>
              {filteredFoods.map((food, foodIndex) => (
                <div
                  key={food}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    marginBottom: '2px',
                    background: manualFoods[food] ? '#EDF3ED' : foodIndex % 2 === 0 ? '#FFFFFF' : '#FAF8F4',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (!manualFoods[food]) e.currentTarget.style.background = '#EDF3ED' }}
                  onMouseLeave={e => { if (!manualFoods[food]) e.currentTarget.style.background = foodIndex % 2 === 0 ? '#FFFFFF' : '#FAF8F4' }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 400 }}>{food}</div>
                  <div style={s.levelBtns}>
                    <button style={manualFoods[food] === 'High' ? s.levelBtnHigh : s.levelBtn} onClick={() => toggleManualFood(food, 'High')}>High</button>
                    <button style={manualFoods[food] === 'Moderate' ? s.levelBtnMod : s.levelBtn} onClick={() => toggleManualFood(food, 'Moderate')}>Mod</button>
                    <button style={manualFoods[food] === 'Low' ? s.levelBtnLow : s.levelBtn} onClick={() => toggleManualFood(food, 'Low')}>Low</button>
                  </div>
                </div>
              ))}
            </div>

            {Object.keys(manualFoods).length > 0 && (
              <div style={s.confirmBar}>
                <div style={s.checkIcon}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                {Object.keys(manualFoods).length} food{Object.keys(manualFoods).length !== 1 ? 's' : ''} flagged
              </div>
            )}

            <button
              style={Object.keys(manualFoods).length > 0 ? s.cta : s.ctaDisabled}
              onClick={handleSave}
              disabled={Object.keys(manualFoods).length === 0 || saving}
            >
              {saving ? 'Submitting...' : 'Submit for review →'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
