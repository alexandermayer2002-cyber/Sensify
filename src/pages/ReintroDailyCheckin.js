import React, { useState } from 'react'
import { supabase } from '../supabase'
import { todayLocal } from '../utils/dateUtils'

// Daily reintro check-in. Phase-aware:
//  - Exposure: did you eat it? -> symptoms? -> per-symptom intensity
//  - Washout: any lingering/delayed symptoms? -> per-symptom intensity
// Severe intensity anywhere fires the stop-cycle safety off-ramp.

const INTENSITIES = ['mild', 'moderate', 'severe']

export default function ReintroDailyCheckin({ session, profile, reintro, phase, exposureNumber, onComplete, onStopCycle }) {
  const food = reintro?.food
  const trackedSymptoms = profile?.symptoms?.length
    ? buildSymptomList(profile)
    : ['Bloating', 'Gas', 'Cramping', 'Fatigue', 'Headache', 'Other']

  const [step, setStep] = useState(phase === 'exposure' ? 'ate' : 'symptoms')
  const [ateFood, setAteFood] = useState(null)
  const [portion, setPortion] = useState(null) // 'small' | 'normal' | 'large'
  const [hadSymptoms, setHadSymptoms] = useState(null)
  const [symptomIntensities, setSymptomIntensities] = useState({}) // { name: intensity }
  const [saving, setSaving] = useState(false)
  const [showSevereWarning, setShowSevereWarning] = useState(false)
  const [otherText, setOtherText] = useState('')

  const toggleSymptom = (name) => {
    setSymptomIntensities(prev => {
      const next = { ...prev }
      if (next[name]) delete next[name]
      else next[name] = 'mild'
      return next
    })
  }

  const setIntensity = (name, intensity) => {
    setSymptomIntensities(prev => ({ ...prev, [name]: intensity }))
    if (intensity === 'severe') setShowSevereWarning(true)
  }

  const anySevere = Object.values(symptomIntensities).includes('severe')

  const save = async (stoppedEarly = false) => {
    setSaving(true)
    const today = todayLocal()
    const symptoms = Object.entries(symptomIntensities).map(([name, intensity]) => ({ name: name === 'Other' && otherText.trim() ? otherText.trim() : name, intensity }))

    const { error } = await supabase.from('reintro_daily_logs').upsert({
      user_id: session.user.id,
      reintro_id: reintro.id,
      food,
      log_date: today,
      phase,
      ate_food: phase === 'exposure' ? ateFood : null,
      exposure_number: phase === 'exposure' && ateFood ? exposureNumber : null,
      had_symptoms: symptoms.length > 0,
      symptoms,
      stopped_early: stoppedEarly,
    }, { onConflict: 'user_id,reintro_id,log_date' })

    // Dose rides the cycle's answers jsonb, keyed by date (read-merge-write;
    // the verdict survey merges rather than replaces, so doses survive).
    if (!error && phase === 'exposure' && ateFood && portion) {
      try {
        const { data: cyc } = await supabase.from('reintroduction_results').select('answers').eq('id', reintro.id).single()
        const a = cyc?.answers || {}
        await supabase.from('reintroduction_results').update({
          answers: { ...a, doses: { ...(a.doses || {}), [today]: portion } },
        }).eq('id', reintro.id)
      } catch (e) { /* dose is enrichment; never blocks the log */ }
    }

    setSaving(false)
    if (error) { alert(`Could not save: ${error.message}`); return }

    if (stoppedEarly) { onStopCycle?.(); return }
    onComplete?.({ ateFood, symptoms })
  }

  return (
    <div style={s.wrap}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={s.card} className="sn-rise">
        <div style={s.eyebrow}>{phase === 'exposure' ? `Exposure day ${exposureNumber || ''}` : 'Washout check'} · {food}</div>

        {/* SEVERE WARNING BANNER */}
        {showSevereWarning && (
          <div style={s.severe}>
            <div style={s.severeTitle}>Stop and take care of yourself first</div>
            <div style={s.severeText}>
              A severe reaction means this food is a clear trigger. Stop eating {food} now. If you have difficulty breathing, throat tightening, swelling, or vomiting, seek medical care right away.
            </div>
            <button style={s.severeBtn} onClick={() => save(true)} disabled={saving}>
              {saving ? 'Saving...' : `Stop the ${food} cycle`}
            </button>
            <button style={s.severeGhost} onClick={() => setShowSevereWarning(false)}>Go back</button>
          </div>
        )}

        {!showSevereWarning && (
          <>
            {/* EXPOSURE: ate food? */}
            {step === 'ate' && (
              <div style={{ animation: 'fadeUp 0.3s ease' }}>
                <h2 style={s.q}>Did you eat <em style={s.em}>{food}</em> today?</h2>
                <p style={s.sub}>The test only works when you actually eat it. No judgment if today didn't work out.</p>
                <div style={s.btnRow}>
                  <button style={s.choiceBtn} onClick={() => { setAteFood(true) }}>Yes, I ate it</button>
                  <button style={s.choiceBtnAlt} onClick={() => { setAteFood(false); save(false) }} disabled={saving}>
                    {saving ? 'Saving...' : 'Not today'}
                  </button>
                </div>
                {/* DOSE: one tap, exposure days only. This is what lets a
                    Limit verdict cite an actual serving size later. */}
                {ateFood === true && (
                  <div style={{ marginTop: '16px', animation: 'fadeUp 0.3s ease' }}>
                    <p style={{ ...s.sub, marginBottom: '8px' }}>Roughly how much?</p>
                    <div style={s.btnRow}>
                      {[['small', 'A little'], ['normal', 'A normal serving'], ['large', 'A lot']].map(([id, label]) => (
                        <button key={id} style={portion === id ? s.choiceBtn : s.choiceBtnAlt}
                          onClick={() => { setPortion(id); setStep('symptoms') }}>{label}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SYMPTOMS yes/no */}
            {step === 'symptoms' && hadSymptoms === null && (
              <div style={{ animation: 'fadeUp 0.3s ease' }}>
                <h2 style={s.q}>{phase === 'exposure' ? 'Any symptoms today?' : 'Any lingering or delayed symptoms today?'}</h2>
                <p style={s.sub}>{phase === 'exposure' ? 'Note anything you noticed after eating it.' : 'Reactions can surface a day or two after the last serving.'}</p>
                <div style={s.btnRow}>
                  <button style={s.choiceBtnAlt} onClick={() => { setHadSymptoms(false); }}>No symptoms</button>
                  <button style={s.choiceBtn} onClick={() => setHadSymptoms(true)}>Yes, some</button>
                </div>
                {hadSymptoms === false && (
                  <button style={{ ...s.submit, marginTop: '14px' }} onClick={() => save(false)} disabled={saving}>
                    {saving ? 'Saving...' : 'Log a clean day →'}
                  </button>
                )}
              </div>
            )}

            {/* SYMPTOM PICKER + INTENSITY */}
            {step === 'symptoms' && hadSymptoms === true && (
              <div style={{ animation: 'fadeUp 0.3s ease' }}>
                <h2 style={s.q}>Which symptoms, and how strong?</h2>
                <p style={s.sub}>Tap a symptom, then set its intensity.</p>
                <div style={s.symptomList}>
                  {trackedSymptoms.map(name => {
                    const active = !!symptomIntensities[name]
                    return (
                      <div key={name} style={s.symptomRow}>
                        <button
                          style={{ ...s.symptomToggle, ...(active ? s.symptomToggleActive : {}) }}
                          onClick={() => toggleSymptom(name)}
                        >{name}</button>
                        {active && name === 'Other' && (
                          <input
                            type="text"
                            value={otherText}
                            onChange={e => setOtherText(e.target.value)}
                            placeholder="What did you notice?"
                            style={{ background: 'var(--tint-warm)', border: 'none', borderRadius: 'var(--r-sm)', padding: '12px 14px', fontSize: '13px', color: 'var(--ink)', outline: 'none', marginLeft: '4px' }}
                          />
                        )}
                        {active && (
                          <div style={s.intensityRow}>
                            {INTENSITIES.map(level => (
                              <button
                                key={level}
                                style={{
                                  ...s.intBtn,
                                  ...(symptomIntensities[name] === level ? s.intBtnActive[level] : {}),
                                }}
                                onClick={() => setIntensity(name, level)}
                              >{level}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                <button
                  style={{ ...s.submit, opacity: Object.keys(symptomIntensities).length ? 1 : 0.4 }}
                  disabled={!Object.keys(symptomIntensities).length || saving}
                  onClick={() => anySevere ? setShowSevereWarning(true) : save(false)}
                >
                  {saving ? 'Saving...' : 'Log today →'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Build a symptom list from the user's tracked focus areas
function buildSymptomList(profile) {
  const list = []
  const sym = profile?.symptoms || []
  if (sym.includes('Digestive')) list.push('Bloating', 'Gas', 'Cramping', 'Reflux', 'Loose stools')
  if (sym.includes('Energy')) list.push('Fatigue', 'Afternoon crash', 'Brain fog')
  if (sym.includes('General wellness')) list.push('Headache', 'Joint aches', 'Skin flare', 'Poor sleep')
  list.push('Other')
  return [...new Set(list)]
}

const s = {
  wrap: { minHeight: 'calc(100vh - 56px)', background: 'transparent', padding: '24px 20px' },
  card: { maxWidth: '460px', margin: '0 auto', background: 'var(--paper)', border: 'none', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-2)', padding: '26px' },
  eyebrow: { fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.17em', color: 'var(--forest-500)', marginBottom: '16px' },
  q: { fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 300, marginBottom: '8px', lineHeight: 1.25, letterSpacing: '-0.3px' },
  em: { fontStyle: 'italic', color: '#3D5C3C' },
  sub: { fontSize: '13px', color: 'var(--gray)', lineHeight: 1.6, marginBottom: '20px' },
  btnRow: { display: 'flex', gap: '10px' },
  choiceBtn: { flex: 1, background: 'var(--forest-500)', color: 'white', border: 'none', borderRadius: 'var(--r-md)', padding: '14px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--shadow-pill)' },
  choiceBtnAlt: { flex: 1, background: 'var(--tint-warm)', color: 'var(--ink-soft)', border: 'none', borderRadius: 'var(--r-md)', padding: '14px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' },
  submit: { width: '100%', background: 'var(--forest-500)', color: 'white', border: 'none', borderRadius: 'var(--r-md)', padding: '14px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--shadow-pill)', marginTop: '18px' },
  symptomList: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '4px' },
  symptomRow: { display: 'flex', flexDirection: 'column', gap: '8px' },
  symptomToggle: { textAlign: 'left', background: 'var(--tint-warm)', border: 'none', borderRadius: 'var(--r-md)', padding: '13px 14px', fontSize: '13px', cursor: 'pointer', color: 'var(--ink-soft)', transition: 'all 0.12s' },
  symptomToggleActive: { background: 'var(--forest-500)', border: 'none', color: '#FFFFFF', fontWeight: 600, boxShadow: 'var(--shadow-pill)' },
  intensityRow: { display: 'flex', gap: '6px', paddingLeft: '4px', marginBottom: '4px' },
  intBtn: { flex: 1, background: 'var(--paper)', border: 'none', borderRadius: 'var(--r-sm)', padding: '9px', fontSize: '12px', cursor: 'pointer', color: 'var(--gray)', textTransform: 'capitalize', boxShadow: 'var(--shadow-1)' },
  intBtnActive: {
    mild: { background: '#EAF4EE', border: 'none', color: '#2D6B42', fontWeight: 600, boxShadow: '0 4px 12px -2px rgba(74,140,106,0.3)' },
    moderate: { background: 'var(--limit-100)', border: 'none', color: 'var(--limit-700)', fontWeight: 600, boxShadow: '0 4px 12px -2px rgba(212,137,74,0.3)' },
    severe: { background: 'var(--avoid-100)', border: 'none', color: 'var(--avoid-700)', fontWeight: 600, boxShadow: '0 4px 12px -2px rgba(201,91,91,0.3)' },
  },
  severe: { background: 'var(--avoid-100)', border: 'none', borderRadius: 'var(--r-md)', padding: '20px', boxShadow: '0 12px 30px -8px rgba(214,69,69,0.28)', animation: 'fadeUp 0.3s ease' },
  severeTitle: { fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 400, color: 'var(--avoid-700)', marginBottom: '10px' },
  severeText: { fontSize: '13px', color: 'var(--ink)', lineHeight: 1.7, marginBottom: '18px' },
  severeBtn: { width: '100%', background: '#C95B5B', color: 'white', border: 'none', borderRadius: 'var(--r-md)', padding: '14px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', marginBottom: '8px', boxShadow: '0 10px 24px -6px rgba(201,91,91,0.45)' },
  severeGhost: { width: '100%', background: 'none', border: 'none', color: 'var(--gray)', padding: '8px', fontSize: '13px', cursor: 'pointer' },
}
