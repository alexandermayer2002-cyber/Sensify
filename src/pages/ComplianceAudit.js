import React, { useState } from 'react'
import { supabase } from '../supabase'
import { aiPrompt } from '../utils/aiClient'

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
  label: { fontSize: '14px', fontWeight: 600, marginBottom: '14px', lineHeight: 1.5 },
  optionGrid: { display: 'flex', flexDirection: 'column', gap: '9px', marginBottom: '24px' },
  option: { padding: '14px 16px', borderRadius: '16px', border: 'none', boxShadow: 'var(--shadow-1)', background: '#FFFFFF', fontSize: '14px', cursor: 'pointer', color: '#20241F', textAlign: 'left', transition: 'all 0.12s', lineHeight: 1.5 },
  optionOn: { padding: '14px 16px', borderRadius: '16px', border: 'none', boxShadow: '0 0 0 1.5px #3D5C3C, var(--shadow-1)', background: '#EDF3ED', fontSize: '14px', cursor: 'pointer', color: '#3D5C3C', textAlign: 'left', fontWeight: 600, lineHeight: 1.5 },
  optionMulti: { padding: '14px 16px', borderRadius: '16px', border: 'none', boxShadow: 'var(--shadow-1)', background: '#FFFFFF', fontSize: '14px', cursor: 'pointer', color: '#20241F', textAlign: 'left', transition: 'all 0.12s', lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: '12px' },
  optionMultiOn: { padding: '14px 16px', borderRadius: '16px', border: 'none', boxShadow: '0 0 0 1.5px #3D5C3C, var(--shadow-1)', background: '#EDF3ED', fontSize: '14px', cursor: 'pointer', color: '#3D5C3C', textAlign: 'left', fontWeight: 600, lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: '12px' },
  checkbox: { width: '18px', height: '18px', borderRadius: '5px', border: '1.5px solid rgba(0,0,0,0.15)', background: '#FFFFFF', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { width: '18px', height: '18px', borderRadius: '5px', border: '1.5px solid #3D5C3C', background: '#3D5C3C', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  textarea: { width: '100%', borderRadius: '14px', padding: '13px 16px', fontSize: '16px', color: '#20241F', resize: 'none', height: '100px', marginBottom: '20px' },
  scaleWrap: { marginBottom: '24px' },
  scaleLabels: { display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#73736A', marginBottom: '8px' },
  scaleRow: { display: 'flex', gap: '5px' },
  sbt: { flex: 1, height: '42px', borderRadius: '10px', border: 'none', boxShadow: 'var(--shadow-1)', background: '#FFFFFF', fontSize: '13px', cursor: 'pointer', fontWeight: 500, color: '#20241F', transition: 'all 0.12s' },
  sbtOn: { flex: 1, height: '42px', borderRadius: '10px', border: 'none', background: '#3D5C3C', fontSize: '13px', cursor: 'pointer', fontWeight: 600, color: 'white', boxShadow: 'var(--shadow-pill)' },
  infoCard: { background: '#F7F5EE', borderRadius: '16px', padding: '14px 16px', marginBottom: '16px' },
  infoLabel: { display: 'block', marginBottom: '7px' },
  infoText: { fontSize: '13px', color: '#20241F', lineHeight: 1.7 },
  warningCard: { background: '#FDF2EA', borderRadius: '16px', padding: '14px 16px', marginBottom: '16px' },
  warningLabel: { display: 'block', color: '#9A5F1A', marginBottom: '7px' },
  warningText: { fontSize: '13px', color: '#20241F', lineHeight: 1.7 },
  divider: { height: '1px', background: 'rgba(0,0,0,0.06)', margin: '20px 0' },
  footer: { position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 24px', background: 'rgba(251,248,242,0.92)', backdropFilter: 'blur(8px)', boxShadow: '0 -8px 24px rgba(56,62,48,0.06)' },
  cta: { width: '100%', marginBottom: '10px' },
  ctaDisabled: { width: '100%', marginBottom: '10px' },
  secBtn: { width: '100%' },
  submittedWrap: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center', maxWidth: '560px', margin: '0 auto', width: '100%' },
  submittedIcon: { width: '60px', height: '60px', background: '#EDF3ED', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', boxShadow: 'var(--shadow-1)' },
  submittedTitle: { fontFamily: 'Fraunces, serif', fontSize: '24px', fontWeight: 300, marginBottom: '10px' },
  submittedTitleEm: { fontStyle: 'italic', color: '#3D5C3C' },
  submittedMsg: { fontSize: '14px', color: '#73736A', lineHeight: 1.7, maxWidth: '280px', margin: '0 auto 28px' },
  pendingCard: { background: '#FDF2EA', borderRadius: '16px', padding: '16px', width: '100%', textAlign: 'left' },
  pendingLabel: { display: 'block', color: '#9A5F1A', marginBottom: '6px' },
  pendingText: { fontSize: '13px', color: '#20241F', lineHeight: 1.6 },
  spinner: { width: '32px', height: '32px', border: '3px solid #EDF3ED', borderTopColor: '#3D5C3C', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' },
}

const HARDEST_PARTS = [
  { id: 'cravings', label: 'Food cravings', sub: 'Missing specific foods on the plan' },
  { id: 'social', label: 'Social situations', sub: 'Eating out, family meals, events' },
  { id: 'hidden', label: 'Hidden ingredients', sub: 'Didn\'t realize the food contained something' },
  { id: 'life', label: 'Life got in the way', sub: 'Stress, busy schedule, disrupted routine' },
  { id: 'cooking', label: 'Cooking for others', sub: 'Making food for family or a partner' },
  { id: 'cost', label: 'Cost', sub: 'Eating on the elimination plan is more expensive' },
  { id: 'ideas', label: 'Don\'t know what to eat', sub: 'Ran out of safe food ideas' },
  { id: 'other', label: 'Other', sub: 'Something else is going on' },
]

const generateAuditInsight = async ({ name, selectedReasons, branchAnswers, eliminatedFoods }) => {
  const reasonLabels = selectedReasons.map(id => HARDEST_PARTS.find(h => h.id === id)?.label).join(', ')

  const prompt = `You are the AI health coach inside Sensify, a food sensitivity wellness program. A user has triggered a compliance audit after 3 consecutive days off their elimination plan.

USER: ${name}
REASONS THEY SELECTED: ${reasonLabels}
BRANCH ANSWERS: ${JSON.stringify(branchAnswers)}
ELIMINATED FOODS: ${eliminatedFoods?.join(', ') || 'their elimination list'}

Write a warm, personal acknowledgment that:
1. Acknowledges their specific situation based on what they shared
2. Reframes this as information, not failure
3. Gives ONE specific, practical observation based on their reasons
4. Ends by telling them their personalized guidance is being prepared

RULES:
- 3-4 sentences maximum
- Never clinical or judgmental
- Never diagnose or make medical claims
- Sound like a warm, smart health coach
- Reference what they actually said, never generic
- Do NOT give a plan recommendation. End by saying personal guidance usually lands on their dashboard within a day
- Do not start with "Great" or "Well done"

Write only the message text, no labels or formatting.`

  try {
    return await aiPrompt(prompt, 200)
  } catch (e) {
    return "Thank you for sharing what's been going on. We're reviewing everything you told us — personal guidance usually lands on your dashboard within a day."
  }
}

export default function ComplianceAudit({ session, eliminatedFoods = [], onComplete, onBack }) {
  const [phase, setPhase] = useState('opening') // opening, q1, branches, submitted
  const [selectedReasons, setSelectedReasons] = useState([])
  const [currentBranch, setCurrentBranch] = useState(0)
  const [branchAnswers, setBranchAnswers] = useState({})
  const [otherText, setOtherText] = useState('')
  const [stressScore, setStressScore] = useState(null)
  const [socialWhen, setSocialWhen] = useState('')
  const [cookingRole, setCookingRole] = useState('')
  const [craving, setCraving] = useState('')
  const [aiMessage, setAiMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const name = session?.user?.user_metadata?.full_name?.split(' ')[0] || 'there'

  const toggleReason = (id) => {
    setSelectedReasons(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const branchOrder = selectedReasons.filter(r => r !== 'other')
  const activeBranch = branchOrder[currentBranch]
  const hasMoreBranches = currentBranch < branchOrder.length - 1
  const hasOther = selectedReasons.includes('other')

  const advanceBranch = (answer) => {
    setBranchAnswers(prev => ({ ...prev, [activeBranch]: answer }))
    if (hasMoreBranches) {
      setCurrentBranch(prev => prev + 1)
    } else if (hasOther) {
      setCurrentBranch(branchOrder.length) // go to other
    } else {
      handleSubmit()
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setSubmitError('')

    const allAnswers = {
      ...branchAnswers,
      stress_score: stressScore,
      social_when: socialWhen,
      cooking_role: cookingRole,
      craving_food: craving,
      other_text: otherText,
    }

    // THE CONFESSION LANDS FIRST (QA 2026-10-24 #3): the insert used to run
    // after the slow AI call, unchecked — a failure showed the full success
    // screen while Alex's review queue stayed empty. Insert, verify, then
    // generate the acknowledgment (cosmetic) and backfill it.
    const { data: inserted, error: insErr } = await supabase.from('compliance_audit').insert({
      user_id: session.user.id,
      triggered_at: new Date().toISOString(),
      hardest_parts: selectedReasons,
      branch_responses: allAnswers,
      ai_acknowledgment: '',
      status: 'pending_admin_review',
    }).select().single()
    if (insErr || !inserted) {
      setSubmitError("That didn't send — your answers are all still here, nothing was lost.")
      setPhase('submit_error')
      setSubmitting(false)
      return
    }

    setGenerating(true)
    setPhase('submitted')

    const insight = await generateAuditInsight({
      name,
      selectedReasons,
      branchAnswers: allAnswers,
      eliminatedFoods,
    })
    setAiMessage(insight)
    try { await supabase.from('compliance_audit').update({ ai_acknowledgment: insight }).eq('id', inserted.id) } catch (e) {}

    setGenerating(false)
    setSubmitting(false)
  }

  // OPENING SCREEN
  if (phase === 'opening') return (
    <div style={s.wrap}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }` + PAGE_CSS}</style>
      <div style={s.topBar}>
        <button style={s.back} onClick={onBack}>← Back</button>
        <div style={s.logo}>sensi<em style={s.logoEm}>fy</em></div>
        <div style={{ width: 40 }} />
      </div>
      <div className="sn-rise" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 24px 100px', maxWidth: '560px', margin: '0 auto', width: '100%' }}>
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: '32px', fontWeight: 300, lineHeight: 1.3, marginBottom: '20px', letterSpacing: '-0.3px' }}>
          Three days is hard.<br /><em style={{ fontStyle: 'italic', color: '#3D5C3C' }}>Let's not treat it as failure.</em>
        </div>
        <div style={{ fontSize: '15px', color: '#7A7A72', lineHeight: 1.8, marginBottom: '24px' }}>
          What we know from experience is that most elimination slip-ups aren't about willpower. They're about friction. Something in your environment or routine is making it hard to follow the plan.
        </div>
        <div style={{ fontSize: '15px', color: '#1C1C1C', lineHeight: 1.8, fontWeight: 500 }}>
          Let's find it.
        </div>
      </div>
      <div style={s.footer}>
        <button className="sn-btn" style={s.cta} onClick={() => setPhase('q1')}>Okay, let's figure it out →</button>
      </div>
    </div>
  )

  // QUESTION 1 — What's been hardest
  if (phase === 'q1') return (
    <div style={s.wrap}>
      <style>{PAGE_CSS}</style>
      <div style={s.topBar}>
        <button style={s.back} onClick={() => setPhase('opening')}>← Back</button>
        <div style={s.logo}>sensi<em style={s.logoEm}>fy</em></div>
        <div style={{ width: 40 }} />
      </div>
      <div className="sn-rise" style={s.content}>
        <div className="sn-micro" style={s.eyebrow}>Tell us what's going on</div>
        <div style={s.title}>What's been the<br /><em style={s.titleEm}>hardest part?</em></div>
        <div style={s.hint}>Select everything that applies. We'll go through each one.</div>
        <div style={s.optionGrid}>
          {HARDEST_PARTS.map(h => (
            <button
              key={h.id}
              style={selectedReasons.includes(h.id) ? s.optionMultiOn : s.optionMulti}
              onClick={() => toggleReason(h.id)}
            >
              <div style={selectedReasons.includes(h.id) ? s.checkboxOn : s.checkbox}>
                {selectedReasons.includes(h.id) && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                )}
              </div>
              <div>
                <div style={{ fontWeight: selectedReasons.includes(h.id) ? 500 : 400 }}>{h.label}</div>
                <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '2px' }}>{h.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
      <div style={s.footer}>
        <button
          className="sn-btn"
          style={s.cta}
          disabled={selectedReasons.length === 0}
          onClick={() => {
            if (branchOrder.length > 0) setPhase('branches')
            else if (hasOther) setPhase('other')
            else handleSubmit()
          }}
        >
          Continue →
        </button>
      </div>
    </div>
  )

  // BRANCH SCREENS
  if (phase === 'branches' && activeBranch) {

    // CRAVINGS BRANCH
    if (activeBranch === 'cravings') return (
      <div style={s.wrap}>
        <style>{PAGE_CSS}</style>
        <div style={s.topBar}>
          <button style={s.back} onClick={() => { setCurrentBranch(0); setPhase('q1') }}>← Back</button>
          <div style={s.logo}>sensi<em style={s.logoEm}>fy</em></div>
          <div style={{ fontSize: '11px', color: '#7A7A72', background: '#EDF3ED', padding: '4px 10px', borderRadius: '20px', fontWeight: 500 }}>Food cravings</div>
        </div>
        <div className="sn-rise" style={s.content}>
          <div className="sn-micro" style={s.eyebrow}>Let's talk cravings</div>
          <div style={s.title}>Is there a specific<br /><em style={s.titleEm}>food you're missing?</em></div>
          <div style={s.hint}>This helps us give you more relevant context about what you're going through.</div>
          <input
            className="sn-input"
            style={{ ...s.textarea, height: '52px', resize: 'none', marginBottom: '20px' }}
            placeholder="e.g. dairy, bread, coffee..."
            value={craving}
            onChange={e => setCraving(e.target.value)}
          />
          <div style={s.infoCard}>
            <div className="sn-micro" style={s.infoLabel}>Worth knowing</div>
            <div style={s.infoText}>
              {craving
                ? `Missing ${craving} is completely normal. Most cravings peak around week 2 and then fade. The good news: you're getting closer to finding out if it's actually causing your symptoms. That answer is worth the craving.`
                : `Most cravings during elimination peak around week 2 and then fade. What feels intense right now usually becomes much easier to manage. You're doing the hard part.`}
            </div>
          </div>
        </div>
        <div style={s.footer}>
          <button className="sn-btn" style={s.cta} onClick={() => advanceBranch({ craving_food: craving })}>
            {hasMoreBranches || hasOther ? 'Continue →' : 'Submit →'}
          </button>
        </div>
      </div>
    )

    // SOCIAL BRANCH
    if (activeBranch === 'social') return (
      <div style={s.wrap}>
        <style>{PAGE_CSS}</style>
        <div style={s.topBar}>
          <button style={s.back} onClick={() => { setCurrentBranch(0); setPhase('q1') }}>← Back</button>
          <div style={s.logo}>sensi<em style={s.logoEm}>fy</em></div>
          <div style={{ fontSize: '11px', color: '#7A7A72', background: '#EDF3ED', padding: '4px 10px', borderRadius: '20px', fontWeight: 500 }}>Social situations</div>
        </div>
        <div className="sn-rise" style={s.content}>
          <div className="sn-micro" style={s.eyebrow}>Let's talk social eating</div>
          <div style={s.title}>When does it<br /><em style={s.titleEm}>happen most?</em></div>
          <div style={s.hint}>Knowing when helps us give you a specific strategy rather than general advice.</div>
          <div style={s.optionGrid}>
            {[
              { id: 'weekends', label: 'Weekends' },
              { id: 'evenings', label: 'Weekday evenings' },
              { id: 'work', label: 'Work lunches or meetings' },
              { id: 'family', label: 'Family meals' },
              { id: 'varies', label: 'It varies' },
            ].map(opt => (
              <button key={opt.id} style={socialWhen === opt.id ? s.optionOn : s.option} onClick={() => setSocialWhen(opt.id)}>
                {opt.label}
              </button>
            ))}
          </div>
          {socialWhen && (
            <div style={s.infoCard}>
              <div className="sn-micro" style={s.infoLabel}>What helps</div>
              <div style={s.infoText}>
                {socialWhen === 'weekends' && "Weekends are the most common slip-up time. One thing that helps: decide before Saturday what you'll do when your eliminated foods come up. A plan made in advance is much easier than a decision made in the moment."}
                {socialWhen === 'evenings' && "Evening slip-ups usually happen when you're tired and haven't planned ahead. A simple fix: make sure you have something you can eat ready before 6pm so you're not making food decisions when your willpower is lowest."}
                {socialWhen === 'work' && "Work situations are tough because you often can't control what's available. The most practical approach is bringing your own food on days you know it'll be an issue. It feels awkward once and then becomes normal."}
                {socialWhen === 'family' && "Family meals are hard because there's emotional pressure on top of food pressure. You don't have to explain the whole protocol. Most people accept 'I'm doing an elimination diet for a few weeks' without needing more detail."}
                {socialWhen === 'varies' && "When it happens everywhere, the issue is usually planning. Pick one thing you can always eat at any restaurant or gathering before you arrive. Having that decided in advance removes the in-the-moment pressure."}
              </div>
            </div>
          )}
        </div>
        <div style={s.footer}>
          <button
            className="sn-btn"
            style={s.cta}
            disabled={!socialWhen}
            onClick={() => advanceBranch({ social_when: socialWhen })}
          >
            {hasMoreBranches || hasOther ? 'Continue →' : 'Submit →'}
          </button>
        </div>
      </div>
    )

    // HIDDEN INGREDIENTS BRANCH
    if (activeBranch === 'hidden') return (
      <div style={s.wrap}>
        <style>{PAGE_CSS}</style>
        <div style={s.topBar}>
          <button style={s.back} onClick={() => { setCurrentBranch(0); setPhase('q1') }}>← Back</button>
          <div style={s.logo}>sensi<em style={s.logoEm}>fy</em></div>
          <div style={{ fontSize: '11px', color: '#7A7A72', background: '#EDF3ED', padding: '4px 10px', borderRadius: '20px', fontWeight: 500 }}>Hidden ingredients</div>
        </div>
        <div className="sn-rise" style={s.content}>
          <div className="sn-micro" style={s.eyebrow}>Hidden ingredients</div>
          <div style={s.title}>This is more<br /><em style={s.titleEm}>common than you think.</em></div>
          <div style={s.hint}>Hidden ingredients are one of the most common reasons people don't see improvement, and it's almost never the person's fault. Labels are confusing by design.</div>

          <div style={s.infoCard}>
            <div className="sn-micro" style={s.infoLabel}>Where your foods hide</div>
            <div style={s.infoText}>
              <strong>Dairy</strong>: salad dressings, protein bars, some breads, anything labeled 'non-dairy' that contains casein or whey.<br /><br />
              <strong>Gluten</strong>: soy sauce, most condiments, soups, processed meats, some medications.<br /><br />
              <strong>Eggs</strong>: mayonnaise, most baked goods, pasta, glazed or brushed foods.<br /><br />
              <strong>Soy</strong>: vegetable broth, canned tuna, most Asian sauces, protein bars.<br /><br />
              <strong>Corn</strong>: dextrose, maltodextrin, citric acid, xanthan gum, modified food starch.
            </div>
          </div>

          <div style={s.warningCard}>
            <div className="sn-micro" style={s.warningLabel}>The simple rule</div>
            <div style={s.warningText}>If you didn't make it yourself or can't read every ingredient, assume it might contain something on your list. That level of caution only needs to last until reintroduction begins.</div>
          </div>
        </div>
        <div style={s.footer}>
          <button className="sn-btn" style={s.cta} onClick={() => advanceBranch({ hidden_reviewed: true })}>
            {hasMoreBranches || hasOther ? 'Got it, continue →' : 'Got it, submit →'}
          </button>
        </div>
      </div>
    )

    // LIFE GOT IN THE WAY BRANCH
    if (activeBranch === 'life') return (
      <div style={s.wrap}>
        <style>{PAGE_CSS}</style>
        <div style={s.topBar}>
          <button style={s.back} onClick={() => { setCurrentBranch(0); setPhase('q1') }}>← Back</button>
          <div style={s.logo}>sensi<em style={s.logoEm}>fy</em></div>
          <div style={{ fontSize: '11px', color: '#7A7A72', background: '#EDF3ED', padding: '4px 10px', borderRadius: '20px', fontWeight: 500 }}>Life got in the way</div>
        </div>
        <div className="sn-rise" style={s.content}>
          <div className="sn-micro" style={s.eyebrow}>Let's check in on you</div>
          <div style={s.title}>How stressed have<br />you been <em style={s.titleEm}>this week?</em></div>
          <div style={s.hint}>Stress genuinely affects digestion and food choices. This isn't an excuse. It's important context.</div>
          <div style={s.scaleWrap}>
            <div style={s.scaleLabels}><span>Completely fine</span><span>Extremely stressed</span></div>
            <div style={s.scaleRow}>
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <button key={n} style={stressScore === n ? s.sbtOn : s.sbt} onClick={() => setStressScore(n)}>{n}</button>
              ))}
            </div>
          </div>
          {stressScore && (
            <div style={stressScore >= 8 ? s.warningCard : s.infoCard}>
              <div className="sn-micro" style={{ color: stressScore >= 8 ? '#9A5F1A' : '#3D5C3C', marginBottom: '7px' }}>
                {stressScore >= 8 ? 'High stress acknowledged' : stressScore >= 5 ? 'Moderate stress noted' : 'Good to know'}
              </div>
              <div style={{ fontSize: '13px', color: '#1C1C1C', lineHeight: 1.7 }}>
                {stressScore >= 8
                  ? "When stress is this high, following any protocol becomes genuinely hard. We're not going to pretend otherwise. Your guidance will account for this, and give you options."
                  : stressScore >= 5
                  ? "Moderate stress is one of the most common reasons people slip during elimination. Not because of willpower, but because stress affects food choices and digestion in real ways. This isn't an excuse. It's data."
                  : "Even when life feels manageable, disruptions to routine can knock the plan sideways. The protocol works best when it's built into your routine rather than worked around it."}
              </div>
            </div>
          )}
        </div>
        <div style={s.footer}>
          <button
            className="sn-btn"
            style={s.cta}
            disabled={!stressScore}
            onClick={() => advanceBranch({ stress_score: stressScore })}
          >
            {hasMoreBranches || hasOther ? 'Continue →' : 'Submit →'}
          </button>
        </div>
      </div>
    )

    // COOKING FOR OTHERS BRANCH
    if (activeBranch === 'cooking') return (
      <div style={s.wrap}>
        <style>{PAGE_CSS}</style>
        <div style={s.topBar}>
          <button style={s.back} onClick={() => { setCurrentBranch(0); setPhase('q1') }}>← Back</button>
          <div style={s.logo}>sensi<em style={s.logoEm}>fy</em></div>
          <div style={{ fontSize: '11px', color: '#7A7A72', background: '#EDF3ED', padding: '4px 10px', borderRadius: '20px', fontWeight: 500 }}>Cooking for others</div>
        </div>
        <div className="sn-rise" style={s.content}>
          <div className="sn-micro" style={s.eyebrow}>Let's talk about cooking</div>
          <div style={s.title}>Are you the main<br /><em style={s.titleEm}>cook at home?</em></div>
          <div style={s.hint}>Cooking for others while on an elimination protocol is genuinely one of the hardest situations.</div>
          <div style={s.optionGrid}>
            {[
              { id: 'yes', label: 'Yes, I do most of the cooking' },
              { id: 'no', label: 'No, someone else usually cooks' },
              { id: 'sometimes', label: 'Sometimes, it varies' },
            ].map(opt => (
              <button key={opt.id} style={cookingRole === opt.id ? s.optionOn : s.option} onClick={() => setCookingRole(opt.id)}>
                {opt.label}
              </button>
            ))}
          </div>
          {cookingRole && (
            <div style={s.infoCard}>
              <div className="sn-micro" style={s.infoLabel}>What helps</div>
              <div style={s.infoText}>
                {cookingRole === 'yes' && "Batch cook your own food separately at the start of the week so it's always ready. Find 2-3 meals that work for everyone so you're not always making two separate things."}
                {cookingRole === 'no' && "When someone else is cooking, communication is everything. You don't need to explain the whole protocol, just the specific foods to avoid. A simple list on the fridge or a quick text goes a long way."}
                {cookingRole === 'sometimes' && "The days you cook are your easiest days, since you control everything. Focus your energy on planning for the days you don't cook. What does that situation usually look like?"}
              </div>
            </div>
          )}
        </div>
        <div style={s.footer}>
          <button
            className="sn-btn"
            style={s.cta}
            disabled={!cookingRole}
            onClick={() => advanceBranch({ cooking_role: cookingRole })}
          >
            {hasMoreBranches || hasOther ? 'Continue →' : 'Submit →'}
          </button>
        </div>
      </div>
    )

    // COST BRANCH
    if (activeBranch === 'cost') return (
      <div style={s.wrap}>
        <style>{PAGE_CSS}</style>
        <div style={s.topBar}>
          <button style={s.back} onClick={() => { setCurrentBranch(0); setPhase('q1') }}>← Back</button>
          <div style={s.logo}>sensi<em style={s.logoEm}>fy</em></div>
          <div style={{ fontSize: '11px', color: '#7A7A72', background: '#EDF3ED', padding: '4px 10px', borderRadius: '20px', fontWeight: 500 }}>Cost</div>
        </div>
        <div className="sn-rise" style={s.content}>
          <div className="sn-micro" style={s.eyebrow}>Let's talk about cost</div>
          <div style={s.title}>This is a<br /><em style={s.titleEm}>real challenge.</em></div>
          <div style={s.hint}>Eating on an elimination protocol can genuinely cost more, especially if you're replacing staple foods. You're not alone in this.</div>
          <div style={s.infoCard}>
            <div className="sn-micro" style={s.infoLabel}>What helps</div>
            <div style={s.infoText}>
              The most affordable elimination diets focus on whole foods rather than specialty products. Rice, vegetables, plain proteins, and legumes (if not on your list) are usually the most budget-friendly safe foods. Specialty 'free from' products are convenient but not necessary.
            </div>
          </div>
          <div style={s.infoCard}>
            <div className="sn-micro" style={s.infoLabel}>The bigger picture</div>
            <div style={s.infoText}>
              This is temporary. You're not building a permanent expensive diet. You're doing this for a limited time to get answers that will inform how you eat for years. The cost-per-day math looks very different when framed that way.
            </div>
          </div>
        </div>
        <div style={s.footer}>
          <button className="sn-btn" style={s.cta} onClick={() => advanceBranch({ cost_acknowledged: true })}>
            {hasMoreBranches || hasOther ? 'Continue →' : 'Submit →'}
          </button>
        </div>
      </div>
    )

    // DON'T KNOW WHAT TO EAT BRANCH
    if (activeBranch === 'ideas') return (
      <div style={s.wrap}>
        <style>{PAGE_CSS}</style>
        <div style={s.topBar}>
          <button style={s.back} onClick={() => { setCurrentBranch(0); setPhase('q1') }}>← Back</button>
          <div style={s.logo}>sensi<em style={s.logoEm}>fy</em></div>
          <div style={{ fontSize: '11px', color: '#7A7A72', background: '#EDF3ED', padding: '4px 10px', borderRadius: '20px', fontWeight: 500 }}>Meal ideas</div>
        </div>
        <div className="sn-rise" style={s.content}>
          <div className="sn-micro" style={s.eyebrow}>Let's fix this</div>
          <div style={s.title}>Running out of<br /><em style={s.titleEm}>ideas is fixable.</em></div>
          <div style={s.hint}>The most sustainable approach is building a small rotation of meals you actually like rather than trying to eat something different every day.</div>
          <div style={s.infoCard}>
            <div className="sn-micro" style={s.infoLabel}>Simple meal frameworks</div>
            <div style={s.infoText}>
              • Protein + roasted vegetables + safe starch<br />
              • Protein + salad with olive oil and lemon<br />
              • Safe grain bowl with protein and vegetables<br />
              • Soup with safe protein and vegetables<br />
              • Stir fry with safe protein, vegetables, and rice
            </div>
          </div>
          <div style={s.warningCard}>
            <div className="sn-micro" style={s.warningLabel}>Remember</div>
            <div style={s.warningText}>Boring is fine. Consistent is better. Pick two meals you can eat this week without thinking about it and repeat them as many times as you need to.</div>
          </div>
        </div>
        <div style={s.footer}>
          <button className="sn-btn" style={s.cta} onClick={() => advanceBranch({ ideas_reviewed: true })}>
            {hasMoreBranches || hasOther ? 'Continue →' : 'Submit →'}
          </button>
        </div>
      </div>
    )
  }

  // OTHER BRANCH
  if (phase === 'branches' && (!activeBranch || currentBranch >= branchOrder.length) && hasOther) return (
    <div style={s.wrap}>
      <style>{PAGE_CSS}</style>
      <div style={s.topBar}>
        <button style={s.back} onClick={() => { setCurrentBranch(0); setPhase('q1') }}>← Back</button>
        <div style={s.logo}>sensi<em style={s.logoEm}>fy</em></div>
        <div style={{ fontSize: '11px', color: '#7A7A72', background: '#EDF3ED', padding: '4px 10px', borderRadius: '20px', fontWeight: 500 }}>Other</div>
      </div>
      <div className="sn-rise" style={s.content}>
        <div className="sn-micro" style={s.eyebrow}>Tell us more</div>
        <div style={s.title}>What else is<br /><em style={s.titleEm}>going on?</em></div>
        <div style={s.hint}>Sometimes it's something we haven't thought to ask about. Tell us what's actually happening and we'll factor it into your guidance.</div>
        <textarea
          className="sn-input"
          style={s.textarea}
          placeholder="Tell us what's been making it hard..."
          value={otherText}
          onChange={e => setOtherText(e.target.value)}
        />
      </div>
      <div style={s.footer}>
        {submitError && <div style={{ background: '#FAEAEA', color: '#8B2E2E', borderRadius: 12, padding: '10px 13px', fontSize: 12.5, lineHeight: 1.55, marginBottom: 10 }}>{submitError}</div>}
        <button
          className="sn-btn"
          style={s.cta}
          disabled={otherText.trim().length === 0 || submitting}
          onClick={handleSubmit}
        >
          {submitting ? 'Submitting...' : 'Submit →'}
        </button>
      </div>
    </div>
  )

  // SUBMITTED SCREEN
  // Insert failure gets its own screen with a retry (QA 2026-10-24 #3):
  // every answer is still in state, so Try again re-sends the same audit.
  if (phase === 'submit_error') return (
    <div style={s.wrap}>
      <style>{PAGE_CSS}</style>
      <div style={s.topBar}>
        <div style={{ width: 40 }} />
        <div style={s.logo}>sensi<em style={s.logoEm}>fy</em></div>
        <div style={{ width: 40 }} />
      </div>
      <div className="sn-rise" style={s.content}>
        <div style={{ background: '#FAEAEA', color: '#8B2E2E', borderRadius: 16, padding: '14px 16px', fontSize: 13.5, lineHeight: 1.6, marginBottom: 16 }}>{submitError}</div>
        <button className="sn-btn" style={s.cta} disabled={submitting} onClick={handleSubmit}>
          {submitting ? 'Sending...' : 'Try again →'}
        </button>
      </div>
    </div>
  )

  if (phase === 'submitted') return (
    <div style={s.wrap}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }` + PAGE_CSS}</style>
      <div style={s.topBar}>
        <div style={{ width: 40 }} />
        <div style={s.logo}>sensi<em style={s.logoEm}>fy</em></div>
        <div style={{ width: 40 }} />
      </div>
      <div className="sn-rise" style={s.submittedWrap}>
        {generating ? (
          <>
            <div style={s.spinner} />
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 300, color: '#7A7A72', fontStyle: 'italic' }}>Processing your responses...</div>
          </>
        ) : (
          <>
            <div style={s.submittedIcon}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#3D5C3C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div style={s.submittedTitle}>Thank you, <em style={s.submittedTitleEm}>{name}.</em></div>
            <div style={s.submittedMsg}>{aiMessage}</div>
            <div style={{ ...s.pendingCard, marginBottom: '12px' }}>
              <div className="sn-micro" style={s.pendingLabel}>What happens next</div>
              <div style={s.pendingText}>We're reviewing everything you shared. Personal guidance usually lands within a day — it will meet you right here on your dashboard.</div>
            </div>
          </>
        )}
      </div>
      {!generating && (
        <div style={s.footer}>
          <button className="sn-btn" style={s.cta} onClick={onComplete}>Back to dashboard</button>
        </div>
      )}
    </div>
  )

  return null
}
