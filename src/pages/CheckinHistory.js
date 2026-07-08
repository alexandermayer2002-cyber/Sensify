import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const BASELINE_LABELS = {
  baseline_bloating: { label: 'Bloating', lowerIsBetter: true },
  baseline_gas: { label: 'Gas / cramping', lowerIsBetter: true },
  baseline_reflux: { label: 'Reflux / heartburn', lowerIsBetter: true },
  baseline_digestive: { label: 'Digestive comfort', lowerIsBetter: false },
  baseline_energy: { label: 'Energy levels', lowerIsBetter: false },
  baseline_clarity: { label: 'Mental clarity', lowerIsBetter: false },
  baseline_afternoon: { label: 'Afternoon energy', lowerIsBetter: false },
  baseline_sleep: { label: 'Sleep quality', lowerIsBetter: false },
  baseline_wellbeing: { label: 'Overall wellbeing', lowerIsBetter: false },
}

function SymptomProgress({ profile, checkins }) {
  const sorted = [...checkins].sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at))
  const latest = sorted[sorted.length - 1]
  if (!latest) return null

  const rows = Object.entries(BASELINE_LABELS)
    .filter(([key]) => profile?.[key] != null)
    .map(([key, meta]) => {
      const answerKey = key.replace('baseline_', '')
      const baseline = profile[key]
      const now = latest.answers?.[answerKey]
      if (now == null) return null
      const rawPct = baseline ? Math.round(((now - baseline) / baseline) * 100) : 0
      const improved = meta.lowerIsBetter ? now < baseline : now > baseline
      const worsened = meta.lowerIsBetter ? now > baseline : now < baseline
      const magnitude = Math.abs(rawPct)
      let deltaText, deltaCls, barColor
      if (now === baseline) {
        deltaText = `${baseline} → ${now} · no change`; deltaCls = 'flat'; barColor = '#C8C6BE'
      } else if (improved) {
        const dir = meta.lowerIsBetter ? 'down' : 'up'
        deltaText = `${baseline} → ${now} · ${dir} ${magnitude}%`; deltaCls = 'good'
        barColor = meta.lowerIsBetter ? '#2C9D8A' : '#5DBF8A'
      } else {
        const dir = meta.lowerIsBetter ? 'up' : 'down'
        deltaText = `${baseline} → ${now} · ${dir} ${magnitude}%`; deltaCls = 'bad'; barColor = '#D4894A'
      }
      return { label: meta.label, baseline, now, deltaText, deltaCls, barColor }
    })
    .filter(Boolean)

  if (rows.length === 0) return null

  // Headline: average improvement across all tracked symptoms
  const improvements = rows.map(r => {
    const meta = Object.values(BASELINE_LABELS).find(m => m.label === r.label)
    const lowerBetter = meta?.lowerIsBetter
    const pct = r.baseline ? ((r.now - r.baseline) / r.baseline) * 100 : 0
    return lowerBetter ? -pct : pct // normalize so positive = better
  })
  const avgImprovement = Math.round(improvements.reduce((a, b) => a + b, 0) / improvements.length)

  const pg = {
    card: { background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '16px', padding: '22px', marginBottom: '16px' },
    title: { fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#7A7A72' },
    bigwrap: { display: 'flex', alignItems: 'baseline', gap: '9px', margin: '10px 0 6px' },
    big: { fontFamily: 'Fraunces, serif', fontSize: '36px', fontWeight: 300, color: avgImprovement > 0 ? '#2C9D8A' : avgImprovement < 0 ? '#D4894A' : '#7A7A72', lineHeight: 1 },
    bigsub: { fontSize: '13px', color: '#7A7A72' },
    weeks: { fontSize: '11px', color: '#A8A69E', marginBottom: '20px' },
    legend: { display: 'flex', gap: '16px', marginBottom: '18px', paddingBottom: '16px', borderBottom: '1px solid rgba(0,0,0,0.06)' },
    lgi: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#7A7A72' },
    lgtick: { width: '2px', height: '13px', background: '#999', borderRadius: '1px' },
    lgbar: { width: '14px', height: '7px', borderRadius: '3px', background: '#2C9D8A' },
    row: { marginBottom: '16px' },
    rtop: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '7px' },
    rname: { fontSize: '13px', fontWeight: 500, color: '#1C1C1C' },
    rdelta: { fontSize: '11px', fontFamily: 'DM Mono, monospace', fontWeight: 500 },
    tube: { position: 'relative', height: '9px', background: '#F1EFE8', borderRadius: '5px' },
    base: { position: 'absolute', top: '-3.5px', width: '2px', height: '16px', background: '#999', borderRadius: '1px', zIndex: 2 },
    now: { position: 'absolute', height: '9px', borderRadius: '5px', top: 0 },
    scaleline: { display: 'flex', justifyContent: 'space-between', marginTop: '5px' },
    sc: { fontSize: '9px', color: '#C8C6BE', fontFamily: 'DM Mono, monospace' },
  }
  const deltaColor = { good: '#2C9D8A', bad: '#D4894A', flat: '#A8A69E' }

  return (
    <div style={pg.card}>
      <div style={pg.title}>Your progress so far</div>
      <div style={pg.bigwrap}>
        <span style={pg.big}>{avgImprovement > 0 ? avgImprovement : Math.abs(avgImprovement)}%</span>
        <span style={pg.bigsub}>{avgImprovement > 0 ? 'average symptom improvement' : avgImprovement < 0 ? 'average change to watch' : 'holding at baseline'}</span>
      </div>
      <div style={pg.weeks}>Across {checkins.length} weekly check-in{checkins.length !== 1 ? 's' : ''}</div>

      <div style={pg.legend}>
        <div style={pg.lgi}><span style={pg.lgtick}></span>Where you started</div>
        <div style={pg.lgi}><span style={pg.lgbar}></span>Where you are now</div>
      </div>

      {rows.map((r, i) => (
        <div key={i} style={pg.row}>
          <div style={pg.rtop}>
            <span style={pg.rname}>{r.label}</span>
            <span style={{ ...pg.rdelta, color: deltaColor[r.deltaCls] }}>{r.deltaText}</span>
          </div>
          <div style={pg.tube}>
            <div style={{ ...pg.now, width: `${(r.now / 10) * 100}%`, background: r.barColor }}></div>
            <div style={{ ...pg.base, left: `${(r.baseline / 10) * 100}%` }}></div>
          </div>
        </div>
      ))}

      <div style={pg.scaleline}><span style={pg.sc}>0</span><span style={pg.sc}>5</span><span style={pg.sc}>10</span></div>
    </div>
  )
}

function IntakeMilestoneCard({ profile, formatDate }) {
  const [expanded, setExpanded] = useState(false)

  const baselines = Object.entries(BASELINE_LABELS)
    .filter(([key]) => profile?.[key])
    .map(([key, meta]) => ({ key, ...meta, value: profile[key] }))

  const topFoods = profile?.food_frequency
    ? Object.entries(profile.food_frequency)
        .filter(([_, freq]) => freq === 'daily' || freq === '3-5x')
        .map(([food]) => food)
        .slice(0, 8)
    : []

  return (
    <>
      <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#7A7A72', marginBottom: '10px' }}>Program milestones</div>
      <div style={{ background: '#EDF3ED', border: '1px solid rgba(61,92,60,0.15)', borderRadius: '14px', padding: '18px', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: expanded ? '16px' : '0' }}>
          <div>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: '16px', fontWeight: 300 }}>
              Intake survey <em style={{ fontStyle: 'italic', color: '#3D5C3C' }}>complete.</em>
            </div>
            <div style={{ fontSize: '12px', color: '#7A7A72', marginTop: '2px' }}>{formatDate(profile.intake_completed_at)}</div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{ background: 'rgba(61,92,60,0.1)', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', color: '#3D5C3C', fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
          >
            {expanded ? 'Hide' : 'View all responses'}
          </button>
        </div>

        {expanded && (
          <div style={{ borderTop: '1px solid rgba(61,92,60,0.15)', paddingTop: '16px' }}>

            {/* Symptom focus */}
            {profile?.symptoms?.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#3D5C3C', marginBottom: '8px' }}>Symptom focus</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {profile.symptoms.map(s => (
                    <span key={s} style={{ background: 'rgba(61,92,60,0.15)', color: '#3D5C3C', fontSize: '12px', fontWeight: 500, padding: '4px 10px', borderRadius: '20px' }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Baseline scores */}
            {baselines.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#3D5C3C', marginBottom: '10px' }}>Baseline scores</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {baselines.map(b => (
                    <div key={b.key} style={{ background: 'rgba(255,255,255,0.6)', borderRadius: '10px', padding: '10px 12px' }}>
                      <div style={{ fontSize: '11px', color: '#7A7A72', marginBottom: '4px' }}>{b.label}</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        <span style={{ fontFamily: 'Fraunces, serif', fontSize: '22px', fontWeight: 300, color: '#1C1C1C' }}>{b.value}</span>
                        <span style={{ fontSize: '11px', color: '#7A7A72' }}>/10</span>
                      </div>
                      <div style={{ fontSize: '10px', color: '#7A7A72', marginTop: '2px' }}>{b.lowerIsBetter ? 'lower is better' : 'higher is better'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Most frequent foods */}
            {topFoods.length > 0 && (
              <div>
                <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#3D5C3C', marginBottom: '8px' }}>Foods eaten most often</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {topFoods.map(f => (
                    <span key={f} style={{ background: 'rgba(255,255,255,0.6)', color: '#1C1C1C', fontSize: '12px', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(61,92,60,0.15)' }}>{f}</span>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </>
  )
}

const SCORE_METRICS = [
  { id: 'bloating', label: 'Bloating' },
  { id: 'gas', label: 'Gas' },
  { id: 'reflux', label: 'Reflux' },
  { id: 'digestive', label: 'Digestive' },
  { id: 'energy', label: 'Energy' },
  { id: 'clarity', label: 'Clarity' },
  { id: 'afternoon', label: 'Afternoon energy' },
  { id: 'sleep', label: 'Sleep' },
  { id: 'wellbeing', label: 'Wellbeing' },
]

function CheckinCard({ checkin: c, index: i, profile, formatDate, complianceColors, styles: s }) {
  const [expanded, setExpanded] = useState(false)
  const compliance = c.answers?.compliance
  const compStyle = complianceColors[compliance] || { bg: '#FAF8F4', color: '#7A7A72' }
  const weekNum = c.week_number || i + 1

  const scores = SCORE_METRICS.filter(m => c.answers?.[m.id] !== undefined)
  const contextChanges = c.answers?.context_changes?.filter(ch => ch !== 'Nothing unusual — normal week') || []
  const overallFeeling = c.answers?.overall_feeling
  const notes = c.answers?.notes

  return (
    <div style={s.checkinCard}>
      <div style={s.checkinHeader}>
        <div style={s.checkinWeek}>Week <em style={s.checkinWeekEm}>{weekNum}</em></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={s.checkinDate}>{formatDate(c.submitted_at)}</div>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{ background: 'rgba(0,0,0,0.04)', border: 'none', borderRadius: '7px', padding: '4px 10px', fontSize: '11px', color: '#7A7A72', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 500 }}
          >
            {expanded ? 'Less' : 'More'}
          </button>
        </div>
      </div>

      {/* Always visible — scores */}
      <div style={s.checkinScores}>
        {scores.map(m => {
          const val = c.answers[m.id]
          const baseline = profile?.[`baseline_${m.id}`]
          const change = baseline ? Math.round(((val - baseline) / baseline) * 100) : null
          const lowerIsBetter = ['bloating', 'gas', 'reflux'].includes(m.id)
          const improved = lowerIsBetter ? change < 0 : change > 0
          return (
            <div key={m.id} style={s.scoreChip}>
              <div style={s.scoreLabel}>{m.label}</div>
              <div style={s.scoreVal}>{val}</div>
              {change !== null && (
                <div style={{ fontSize: '10px', fontWeight: 500, color: improved ? '#4A8C6A' : change === 0 ? '#7A7A72' : '#C95B5B', marginTop: '1px' }}>
                  {change > 0 ? '+' : ''}{change}%
                </div>
              )}
            </div>
          )
        })}
      </div>

      {compliance && (
        <div style={{ ...s.compliancePill, background: compStyle.bg, color: compStyle.color }}>
          {compliance} compliant
        </div>
      )}

      {/* Expanded section */}
      {expanded && (
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '14px', marginTop: '10px' }}>

          {overallFeeling && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#7A7A72', marginBottom: '5px' }}>Overall feeling</div>
              <div style={{ fontSize: '13px', color: '#1C1C1C', fontWeight: 500 }}>{overallFeeling} compared to last week</div>
            </div>
          )}

          {contextChanges.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#7A7A72', marginBottom: '6px' }}>What changed</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {contextChanges.map(ch => (
                  <span key={ch} style={{ background: '#FAF8F4', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '20px', fontSize: '11px', padding: '4px 10px', color: '#1C1C1C' }}>{ch}</span>
                ))}
              </div>
            </div>
          )}

          {notes && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#7A7A72', marginBottom: '5px' }}>Notes</div>
              <div style={{ fontSize: '13px', color: '#7A7A72', fontStyle: 'italic', lineHeight: 1.6 }}>"{notes}"</div>
            </div>
          )}

        </div>
      )}

      {c.ai_insight && (
        <div style={s.insightBox}>
          <div style={s.insightTag}>Weekly insight</div>
          <div style={s.insightText}>{c.ai_insight}</div>
        </div>
      )}
    </div>
  )
}

const s = {
  wrap: { minHeight: '100vh', background: '#FAF8F4', display: 'flex', flexDirection: 'column' },
  content: { flex: 1, padding: '24px 20px 48px', maxWidth: '960px', margin: '0 auto', width: '100%' },
  header: { marginBottom: '24px' },
  title: { fontFamily: 'Fraunces, serif', fontSize: '26px', fontWeight: 300, marginBottom: '5px', letterSpacing: '-0.3px' },
  titleEm: { fontStyle: 'italic', color: '#3D5C3C' },
  sub: { fontSize: '13px', color: '#7A7A72', lineHeight: 1.55 },

  // Locked state
  lockedCard: { background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '16px', padding: '32px 24px', textAlign: 'center', marginBottom: '20px' },
  lockedIcon: { width: '48px', height: '48px', background: '#EDF3ED', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' },
  lockedTitle: { fontFamily: 'Fraunces, serif', fontSize: '20px', fontWeight: 300, marginBottom: '6px' },
  lockedTitleEm: { fontStyle: 'italic', color: '#3D5C3C' },
  lockedSub: { fontSize: '13px', color: '#7A7A72', lineHeight: 1.65, maxWidth: '280px', margin: '0 auto' },
  countdown: { display: 'inline-flex', alignItems: 'baseline', gap: '4px', marginTop: '16px', background: '#EDF3ED', padding: '8px 16px', borderRadius: '20px' },
  countdownNum: { fontFamily: 'Fraunces, serif', fontSize: '22px', fontWeight: 300, color: '#3D5C3C', lineHeight: 1 },
  countdownLabel: { fontSize: '12px', color: '#3D5C3C', fontWeight: 500 },

  // Due state
  dueCard: { background: '#FFFFFF', border: '1.5px solid #3D5C3C', borderRadius: '16px', padding: '20px', marginBottom: '20px' },
  dueTag: { fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.7px', color: '#3D5C3C', background: '#EDF3ED', padding: '3px 9px', borderRadius: '20px', display: 'inline-block', marginBottom: '10px' },
  dueTitle: { fontFamily: 'Fraunces, serif', fontSize: '19px', fontWeight: 300, marginBottom: '6px' },
  dueTitleEm: { fontStyle: 'italic', color: '#3D5C3C' },
  dueSub: { fontSize: '13px', color: '#7A7A72', lineHeight: 1.6, marginBottom: '14px' },
  dueBtn: { background: '#3D5C3C', color: 'white', border: 'none', borderRadius: '9px', padding: '11px 20px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },

  // Chart
  chartCard: { background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '14px', padding: '18px', marginBottom: '16px' },
  chartLabel: { fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#7A7A72', marginBottom: '14px' },
  chartArea: { position: 'relative', height: '100px', display: 'flex', alignItems: 'flex-end', gap: '8px', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '8px', marginBottom: '8px' },
  chartBar: { flex: 1, borderRadius: '4px 4px 0 0', minHeight: '4px', transition: 'height 0.3s ease' },
  chartWeekLabels: { display: 'flex', gap: '8px' },
  chartWeekLabel: { flex: 1, fontSize: '10px', color: '#7A7A72', textAlign: 'center' },
  chartLegend: { display: 'flex', gap: '14px', marginTop: '10px' },
  chartLegendItem: { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#7A7A72' },
  chartLegendDot: { width: '8px', height: '8px', borderRadius: '50%' },

  // Check-in cards
  secLabel: { fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#7A7A72', marginBottom: '10px' },
  checkinCard: { background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '13px', padding: '16px', marginBottom: '10px' },
  checkinHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' },
  checkinWeek: { fontFamily: 'Fraunces, serif', fontSize: '16px', fontWeight: 300 },
  checkinWeekEm: { fontStyle: 'italic', color: '#3D5C3C' },
  checkinDate: { fontSize: '11px', color: '#7A7A72' },
  checkinScores: { display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' },
  scoreChip: { display: 'flex', align: 'center', gap: '5px', background: '#FAF8F4', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '8px', padding: '6px 10px' },
  scoreLabel: { fontSize: '10px', color: '#7A7A72', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.4px' },
  scoreVal: { fontFamily: 'Fraunces, serif', fontSize: '16px', fontWeight: 300, lineHeight: 1, marginTop: '1px' },
  compliancePill: { fontSize: '11px', fontWeight: 500, padding: '3px 9px', borderRadius: '20px', display: 'inline-block', marginBottom: '10px' },
  insightBox: { background: '#EDF3ED', borderRadius: '8px', padding: '10px 12px' },
  insightTag: { fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#3D5C3C', marginBottom: '5px' },
  insightText: { fontSize: '12px', color: '#1C1C1C', lineHeight: 1.65 },

  // Empty state
  emptyWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center' },
  emptyIcon: { width: '52px', height: '52px', background: '#FAF8F4', border: '1.5px dashed rgba(0,0,0,0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' },
  emptyTitle: { fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 300, marginBottom: '8px' },
  emptyTitleEm: { fontStyle: 'italic', color: '#3D5C3C' },
  emptySub: { fontSize: '13px', color: '#7A7A72', lineHeight: 1.65, maxWidth: '260px' },
}

const COMPLIANCE_COLORS = {
  'Fully': { bg: '#EAF4EE', color: '#4A8C6A' },
  'Mostly': { bg: '#EDF3ED', color: '#3D5C3C' },
  'Some slip-ups': { bg: '#FDF2EA', color: '#D4894A' },
  'Not at all': { bg: '#FAEAEA', color: '#C95B5B' },
}

export default function CheckinHistory({ session, profile, weeklyDue, onStartCheckin }) {
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCheckins()
  }, [])

  const loadCheckins = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('weekly_checkins')
      .select('*')
      .eq('user_id', session.user.id)
      .order('submitted_at', { ascending: false })
    if (data) setCheckins(data)
    setLoading(false)
  }

  const daysUntilNext = () => {
    if (checkins.length === 0) return 0
    const last = new Date(checkins[0].submitted_at)
    const next = new Date(last.getTime() + 7 * 24 * 60 * 60 * 1000)
    const diff = Math.ceil((next - new Date()) / (1000 * 60 * 60 * 24))
    return Math.max(0, diff)
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const programNotStarted = !profile?.program_phase || profile?.program_phase === 'awaiting_results' || profile?.program_phase === 'pending_review'

  return (
    <div style={s.wrap}>
      <div style={s.content}>
        <div style={s.header}>
          <div style={s.title}>Your <em style={s.titleEm}>history.</em></div>
          <div style={s.sub}>Weekly symptom scores, insights, and compliance trends over time.</div>
        </div>

        {/* DUE STATE */}
        {weeklyDue && !programNotStarted && (
          <>
            <style>{`
              @keyframes chDueRise { from { opacity: 0; transform: translateY(16px) scale(0.985); } to { opacity: 1; transform: translateY(0) scale(1); } }
              @keyframes chDueGlow { 0%, 100% { opacity: 0.06; } 50% { opacity: 0.13; } }
              @keyframes chDueBtn { 0%, 100% { box-shadow: 0 0 0 rgba(139,174,138,0); } 50% { box-shadow: 0 0 22px rgba(139,174,138,0.45); } }
            `}</style>
            <div style={{ position: 'relative', background: '#22301F', borderRadius: 22, padding: '24px 24px 22px', overflow: 'hidden', boxShadow: '0 24px 60px rgba(34,48,31,0.35)', animation: 'chDueRise 0.6s cubic-bezier(0.16,1,0.3,1) both', marginBottom: 20 }}>
              <div style={{ position: 'absolute', top: -70, right: -70, width: 240, height: 240, borderRadius: '50%', background: '#8BAE8A', animation: 'chDueGlow 4s ease-in-out infinite', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: -90, left: -60, width: 200, height: 200, borderRadius: '50%', background: '#E8941F', opacity: 0.05, pointerEvents: 'none' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, position: 'relative' }}>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9.5, letterSpacing: '1.5px', color: '#8BAE8A' }}>SENSIFY · RECORD</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8BAE8A', boxShadow: '0 0 8px rgba(139,174,138,0.9)' }} />
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 8.5, letterSpacing: '1px', color: '#8BAE8A' }}>CHECK-IN OPEN</span>
                </div>
              </div>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 23, fontWeight: 300, color: '#FAF8F4', position: 'relative', lineHeight: 1.2 }}>Your weekly <em style={{ fontStyle: 'italic', color: '#8BAE8A' }}>check-in is ready.</em></div>
              <div style={{ fontSize: 13, color: 'rgba(250,248,244,0.7)', lineHeight: 1.65, margin: '8px 0 16px', position: 'relative', fontWeight: 300 }}>Takes 2 minutes. Complete it to log this week's symptoms and get your weekly insight. It will appear in your history once submitted.</div>
              <button onClick={onStartCheckin} style={{ position: 'relative', width: '100%', background: '#8BAE8A', color: '#22301F', border: 'none', borderRadius: 12, padding: '14px', fontSize: 14.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', animation: 'chDueBtn 2.6s ease-in-out infinite' }}>Start check-in →</button>
            </div>
          </>
        )}

        {/* LOCKED STATE */}
        {!weeklyDue && !programNotStarted && checkins.length > 0 && (() => {
            const remaining = daysUntilNext()
            const dayOfCycle = Math.min(Math.max(7 - remaining, 0), 7)
            const CIRC = 276.5
            return (
              <div style={{ background: 'white', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: '16px', padding: '26px 24px', textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ position: 'relative', width: '110px', height: '110px', margin: '0 auto 14px' }}>
                  <svg width="110" height="110" viewBox="0 0 110 110">
                    <circle cx="55" cy="55" r="48" fill="none" stroke="#EFEDE6" strokeWidth="9" />
                    <circle cx="55" cy="55" r="48" fill="none" stroke="#3D5C3C" strokeWidth="9" strokeLinecap="round"
                      strokeDasharray={`${(dayOfCycle / 7) * 301.6} 301.6`} transform="rotate(-90 55 55)" />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontFamily: 'Fraunces, serif', fontSize: '30px', fontWeight: 300, color: '#3D5C3C', lineHeight: 1 }}>{remaining}</div>
                    <div style={{ fontSize: '8px', color: '#A0A096', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.6px', marginTop: '3px' }}>{remaining === 1 ? 'day to go' : 'days to go'}</div>
                  </div>
                </div>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1.2px', color: '#8BAE8A', marginBottom: '8px' }}>Weekly cycle · Day {dayOfCycle} of 7</div>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: '19px', fontWeight: 300, color: '#1C1C1C' }}>Next check-in <em style={{ fontStyle: 'italic', color: '#3D5C3C' }}>coming soon.</em></div>
                <div style={{ fontSize: '12.5px', color: '#7A7A72', lineHeight: 1.6, maxWidth: '290px', margin: '8px auto 0' }}>Weekly check-ins unlock every 7 days to keep your symptom data consistent and your insights accurate.</div>
              </div>
            )
          })()}

        {/* PROGRAM NOT STARTED */}
        {programNotStarted && (
          <>
            <style>{`
              @keyframes chRowIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
              @keyframes chGlow { 0%, 100% { opacity: 0.05; } 50% { opacity: 0.11; } }
              @keyframes chRise { from { opacity: 0; transform: translateY(18px) scale(0.985); } to { opacity: 1; transform: translateY(0) scale(1); } }
              @keyframes chDotPulse { 0%, 60%, 100% { opacity: 0.25; transform: translateY(0); } 30% { opacity: 1; transform: translateY(-3px); } }
            `}</style>
            <div style={{ textAlign: 'center', marginBottom: 24, animation: 'chRowIn 0.5s ease both' }}>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '2.5px', color: '#C9A227', marginBottom: 12 }}>DAY ZERO · THE RECORD AWAITS</div>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 36, fontWeight: 300, color: '#1C1C1C', lineHeight: 1.1 }}>History starts when<br /><em style={{ fontStyle: 'italic', color: '#3D5C3C' }}>your program begins.</em></div>
            </div>

            <div style={{ position: 'relative', background: '#22301F', borderRadius: 22, padding: '26px 26px 22px', overflow: 'hidden', boxShadow: '0 24px 60px rgba(34,48,31,0.35)', animation: 'chRise 0.7s cubic-bezier(0.16,1,0.3,1) both', marginBottom: 18 }}>
              <div style={{ position: 'absolute', top: -70, right: -70, width: 240, height: 240, borderRadius: '50%', background: '#8BAE8A', animation: 'chGlow 5s ease-in-out infinite', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: -90, left: -60, width: 200, height: 200, borderRadius: '50%', background: '#E8941F', opacity: 0.05, pointerEvents: 'none' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, position: 'relative' }}>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9.5, letterSpacing: '1.5px', color: '#8BAE8A' }}>SENSIFY · RECORD</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E8941F' }} />
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 8.5, letterSpacing: '1px', color: 'rgba(250,248,244,0.55)' }}>AWAITING DAY ONE</span>
                </div>
              </div>

              <div style={{ position: 'relative', animation: 'chRowIn 0.6s ease 0.5s both' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, fontWeight: 700, letterSpacing: '1.2px', color: '#8BAE8A' }}>WEEK 01</span>
                  <span style={{ display: 'inline-flex', gap: 4 }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#8BAE8A', animation: `chDotPulse 1.2s ease-in-out ${i * 0.18}s infinite` }} />
                    ))}
                  </span>
                </div>
                <div style={{ fontSize: 14.5, lineHeight: 1.6, color: 'rgba(250,248,244,0.9)', fontWeight: 300 }}>Your first weekly check-in. Symptoms scored, baseline set, first insight written. This entry is waiting for you.</div>
              </div>

              <div style={{ position: 'relative', borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 16, paddingTop: 14, opacity: 0.45, animation: 'chRowIn 0.6s ease 1.0s both' }}>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, fontWeight: 700, letterSpacing: '1.2px', color: 'rgba(250,248,244,0.5)', marginBottom: 6 }}>WEEK 02</div>
                <div style={{ fontSize: 14.5, lineHeight: 1.6, color: 'rgba(250,248,244,0.55)', fontWeight: 300 }}>Symptoms vs your baseline. The first trend line appears.</div>
              </div>

              <div style={{ position: 'relative', borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 14, paddingTop: 14, opacity: 0.22, animation: 'chRowIn 0.6s ease 1.5s both' }}>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, fontWeight: 700, letterSpacing: '1.2px', color: 'rgba(250,248,244,0.5)', marginBottom: 6 }}>WEEK 03</div>
                <div style={{ fontSize: 14.5, lineHeight: 1.6, color: 'rgba(250,248,244,0.55)', fontWeight: 300 }}>Patterns your memory would miss, kept honest in writing.</div>
              </div>

              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 8.5, letterSpacing: '1.2px', color: 'rgba(250,248,244,0.4)', textAlign: 'center', marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)', position: 'relative' }}>26 WEEKS · ONE HONEST RECORD</div>
            </div>

            <div style={{ fontSize: 13, color: '#7A7A72', lineHeight: 1.65, textAlign: 'center', maxWidth: 360, margin: '0 auto 20px', animation: 'chRowIn 0.6s ease 0.3s both' }}>Complete your intake survey and upload your lab results to activate your elimination protocol. Week one starts the clock.</div>
          </>
        )}

        {/* SYMPTOM PROGRESS — all tracked symptoms vs baseline */}
        {checkins.length >= 1 && (
          <SymptomProgress profile={profile} checkins={checkins} />
        )}

        {/* INTAKE MILESTONE */}
        {profile?.intake_completed_at && (
          <IntakeMilestoneCard profile={profile} formatDate={formatDate} />
        )}

        {/* CHECK-IN HISTORY */}
        {!loading && checkins.length > 0 && (
          <>
            <div style={s.secLabel}>Past entries</div>
            {checkins.map((c, i) => (
              <CheckinCard key={i} checkin={c} index={i} profile={profile} formatDate={formatDate} complianceColors={COMPLIANCE_COLORS} styles={s} />
            ))}
          </>
        )}

        {/* EMPTY STATE — program started but no check-ins yet */}
        {!loading && checkins.length === 0 && !programNotStarted && !weeklyDue && (
          <div style={s.emptyWrap}>
            <div style={s.emptyIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7A7A72" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <div style={s.emptyTitle}>Nothing <em style={s.emptyTitleEm}>yet.</em></div>
            <div style={s.emptySub}>Your symptom scores, compliance data, and weekly insights will appear here after your first weekly check-in.</div>
          </div>
        )}
      </div>
    </div>
  )
}
