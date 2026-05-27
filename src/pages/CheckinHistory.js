import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'

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
          <div style={s.sub}>Weekly symptom scores, AI insights, and compliance trends over time.</div>
        </div>

        {/* DUE STATE */}
        {weeklyDue && !programNotStarted && (
          <div style={s.dueCard}>
            <div style={s.dueTag}>Due now</div>
            <div style={s.dueTitle}>Your weekly <em style={s.dueTitleEm}>check-in is ready.</em></div>
            <div style={s.dueSub}>Takes 2 minutes. Complete it to log this week's symptoms and get your AI insight. It will appear in your history once submitted.</div>
            <button style={s.dueBtn} onClick={onStartCheckin}>Start check-in →</button>
          </div>
        )}

        {/* LOCKED STATE */}
        {!weeklyDue && !programNotStarted && checkins.length > 0 && (
          <div style={s.lockedCard}>
            <div style={s.lockedIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3D5C3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            </div>
            <div style={s.lockedTitle}>Next check-in <em style={s.lockedTitleEm}>coming soon.</em></div>
            <div style={s.lockedSub}>Weekly check-ins unlock every 7 days to keep your symptom data consistent and your AI insights accurate.</div>
            <div style={s.countdown}>
              <div style={s.countdownNum}>{daysUntilNext()}</div>
              <div style={s.countdownLabel}>{daysUntilNext() === 1 ? 'day until next check-in' : 'days until next check-in'}</div>
            </div>
          </div>
        )}

        {/* PROGRAM NOT STARTED */}
        {programNotStarted && (
          <div style={s.lockedCard}>
            <div style={s.lockedIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3D5C3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div style={s.lockedTitle}>History starts when your <em style={s.lockedTitleEm}>program begins.</em></div>
            <div style={s.lockedSub}>Complete your intake survey and upload your lab results to activate your elimination protocol. Your weekly check-in history will appear here.</div>
          </div>
        )}

        {/* TREND CHART — only if 2+ check-ins */}
        {checkins.length >= 2 && (
          <div style={s.chartCard}>
            <div style={s.chartLabel}>Symptom trend</div>
            <div style={s.chartArea}>
              {[...checkins].reverse().slice(-8).map((c, i) => {
                const bloating = c.answers?.bloating || 0
                const energy = c.answers?.energy || 0
                const maxVal = 10
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', gap: '3px', alignItems: 'flex-end', height: '100%' }}>
                    <div style={{ ...s.chartBar, background: '#C95B5B', height: `${(bloating / maxVal) * 100}%`, opacity: 0.7 }} title={`Bloating: ${bloating}`} />
                    <div style={{ ...s.chartBar, background: '#3D5C3C', height: `${(energy / maxVal) * 100}%`, opacity: 0.7 }} title={`Energy: ${energy}`} />
                  </div>
                )
              })}
            </div>
            <div style={s.chartWeekLabels}>
              {[...checkins].reverse().slice(-8).map((c, i) => (
                <div key={i} style={s.chartWeekLabel}>W{c.week_number || i + 1}</div>
              ))}
            </div>
            <div style={s.chartLegend}>
              <div style={s.chartLegendItem}><div style={{ ...s.chartLegendDot, background: '#C95B5B' }}></div>Bloating</div>
              <div style={s.chartLegendItem}><div style={{ ...s.chartLegendDot, background: '#3D5C3C' }}></div>Energy</div>
            </div>
          </div>
        )}

        {/* INTAKE MILESTONE */}
        {profile?.intake_completed_at && (
          <>
            {checkins.length === 0 && <div style={s.secLabel}>Program milestones</div>}
            <div style={{ ...s.checkinCard, background: '#EDF3ED', border: '1px solid rgba(61,92,60,0.15)', marginBottom: '10px' }}>
              <div style={s.checkinHeader}>
                <div style={s.checkinWeek}>Intake survey <em style={s.checkinWeekEm}>complete.</em></div>
                <div style={s.checkinDate}>{formatDate(profile.intake_completed_at)}</div>
              </div>
              <div style={s.checkinScores}>
                {profile.symptoms?.length > 0 && (
                  <div style={s.scoreChip}>
                    <div>
                      <div style={s.scoreLabel}>Focus areas</div>
                      <div style={{ fontSize: '12px', color: '#3D5C3C', fontWeight: 500, marginTop: '2px' }}>{profile.symptoms.join(' · ')}</div>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                {profile.baseline_bloating && (
                  <div style={{ fontSize: '12px', color: '#3D5C3C' }}>Bloating baseline: <strong>{profile.baseline_bloating}/10</strong></div>
                )}
                {profile.baseline_energy && (
                  <div style={{ fontSize: '12px', color: '#3D5C3C' }}>Energy baseline: <strong>{profile.baseline_energy}/10</strong></div>
                )}
              </div>
            </div>
          </>
        )}

        {/* CHECK-IN HISTORY */}
        {!loading && checkins.length > 0 && (
          <>
            <div style={s.secLabel}>Past entries</div>
            {checkins.map((c, i) => {
              const compliance = c.answers?.compliance
              const compStyle = COMPLIANCE_COLORS[compliance] || { bg: '#FAF8F4', color: '#7A7A72' }
              return (
                <div key={i} style={s.checkinCard}>
                  <div style={s.checkinHeader}>
                    <div style={s.checkinWeek}>Week <em style={s.checkinWeekEm}>{c.week_number || i + 1}</em></div>
                    <div style={s.checkinDate}>{formatDate(c.submitted_at)}</div>
                  </div>

                  <div style={s.checkinScores}>
                    {c.answers?.bloating && (
                      <div style={s.scoreChip}>
                        <div>
                          <div style={s.scoreLabel}>Bloating</div>
                          <div style={s.scoreVal}>{c.answers.bloating}</div>
                        </div>
                      </div>
                    )}
                    {c.answers?.energy && (
                      <div style={s.scoreChip}>
                        <div>
                          <div style={s.scoreLabel}>Energy</div>
                          <div style={s.scoreVal}>{c.answers.energy}</div>
                        </div>
                      </div>
                    )}
                    {c.answers?.skin && (
                      <div style={s.scoreChip}>
                        <div>
                          <div style={s.scoreLabel}>Skin</div>
                          <div style={s.scoreVal}>{c.answers.skin}</div>
                        </div>
                      </div>
                    )}
                    {c.answers?.brain_fog && (
                      <div style={s.scoreChip}>
                        <div>
                          <div style={s.scoreLabel}>Brain fog</div>
                          <div style={s.scoreVal}>{c.answers.brain_fog}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {compliance && (
                    <div style={{ ...s.compliancePill, background: compStyle.bg, color: compStyle.color }}>
                      {compliance} compliant
                    </div>
                  )}

                  {c.answers?.notes && (
                    <div style={{ fontSize: '12px', color: '#7A7A72', marginBottom: '10px', fontStyle: 'italic' }}>
                      "{c.answers.notes}"
                    </div>
                  )}

                  {c.ai_insight && (
                    <div style={s.insightBox}>
                      <div style={s.insightTag}>AI insight</div>
                      <div style={s.insightText}>{c.ai_insight}</div>
                    </div>
                  )}
                </div>
              )
            })}
          </>
        )}

        {/* EMPTY STATE — program started but no check-ins yet */}
        {!loading && checkins.length === 0 && !programNotStarted && !weeklyDue && (
          <div style={s.emptyWrap}>
            <div style={s.emptyIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7A7A72" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <div style={s.emptyTitle}>Nothing <em style={s.emptyTitleEm}>yet.</em></div>
            <div style={s.emptySub}>Your symptom scores, compliance data, and AI insights will appear here after your first weekly check-in.</div>
          </div>
        )}
      </div>
    </div>
  )
}
