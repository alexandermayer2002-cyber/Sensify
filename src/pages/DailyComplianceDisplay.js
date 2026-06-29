import React from 'react'
import { localDateString } from '../utils/dateUtils'

// Shows 7-dot visual for past 7 days compliance
// Green = YES, Red = NO, Gray = no response
export default function DailyComplianceDisplay({ complianceData = [], cleanDays = 0 }) {
  const s = {
    wrap: { background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '10px', padding: '14px 16px', marginBottom: '13px' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' },
    label: { fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#7A7A72' },
    count: { display: 'flex', alignItems: 'baseline', gap: '4px' },
    countNum: { fontFamily: 'Fraunces, serif', fontSize: '22px', fontWeight: 300, color: '#1C1C1C', lineHeight: 1 },
    countLabel: { fontSize: '11px', color: '#7A7A72' },
    dotsRow: { display: 'flex', gap: '6px', alignItems: 'center' },
    dotWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', flex: 1 },
    dotYes: { width: '100%', height: '8px', borderRadius: '4px', background: '#4A8C6A' },
    dotNo: { width: '100%', height: '8px', borderRadius: '4px', background: '#C95B5B' },
    dotNone: { width: '100%', height: '8px', borderRadius: '4px', background: 'rgba(0,0,0,0.06)' },
    dayLabel: { fontSize: '10px', color: '#7A7A72', fontWeight: 500 },
    legend: { display: 'flex', gap: '14px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(0,0,0,0.05)' },
    legendItem: { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#7A7A72' },
    legendDot: { width: '8px', height: '8px', borderRadius: '2px' },
  }

  // Build 7-day array — today going back 6 days
  const days = []
  const dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = localDateString(d)
    const dayLabel = dayLabels[d.getDay()]
    const entry = complianceData.find(c => c.date === dateStr)
    const isToday = i === 0

    days.push({
      date: dateStr,
      label: isToday ? 'Today' : dayLabel,
      response: entry?.response || null,
      isToday,
    })
  }

  const getDotStyle = (response) => {
    if (response === 'YES') return s.dotYes
    if (response === 'NO') return s.dotNo
    return s.dotNone
  }

  const streakMessage = () => {
    if (cleanDays === 0) return 'Start your streak'
    if (cleanDays === 1) return '1 clean day'
    return `${cleanDays} clean days`
  }

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={s.label}>Daily compliance</div>
        <div style={s.count}>
          <div style={s.countNum}>{cleanDays}</div>
          <div style={s.countLabel}>day streak</div>
        </div>
      </div>

      <div style={s.dotsRow}>
        {days.map((day, i) => (
          <div key={i} style={s.dotWrap}>
            <div style={getDotStyle(day.response)} />
            <div style={{ ...s.dayLabel, color: day.isToday ? '#3D5C3C' : '#7A7A72', fontWeight: day.isToday ? 600 : 500 }}>
              {day.label}
            </div>
          </div>
        ))}
      </div>

      <div style={s.legend}>
        <div style={s.legendItem}>
          <div style={{ ...s.legendDot, background: '#4A8C6A' }} />
          On plan
        </div>
        <div style={s.legendItem}>
          <div style={{ ...s.legendDot, background: '#C95B5B' }} />
          Slip-up
        </div>
        <div style={s.legendItem}>
          <div style={{ ...s.legendDot, background: 'rgba(0,0,0,0.1)' }} />
          No response
        </div>
      </div>
    </div>
  )
}
