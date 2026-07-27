import React from 'react'

// Shared numeric keypad (numeric-survey spec): empty-start, per-question decimals
// + digit limits, sage ✓ submits. Value is a STRING while typing ('' = untouched).
export default function NumPad({ value, onChange, decimals = false, maxDigits = 2, unit = '', onSubmit }) {
  const press = (k) => {
    if (k === '.') {
      if (!decimals || value.includes('.') || value === '') return
      onChange(value + '.')
      return
    }
    const [whole = '', frac = ''] = value.split('.')
    if (value.includes('.')) {
      if (frac.length >= 1) return // one decimal place is enough for sleep-style entries
      onChange(value + k)
    } else {
      if (whole.length >= maxDigits) return
      if (whole === '0') { onChange(k); return }
      onChange(value + k)
    }
  }
  const back = () => onChange(value.slice(0, -1))
  const ready = value !== '' && value !== '.' && !isNaN(parseFloat(value))
  const key = (label, onPress, style = {}) => (
    <button type="button" onClick={onPress} style={{
      background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 11,
      padding: '13px 0', textAlign: 'center', fontSize: 17, color: '#1C1C1C',
      cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', ...style,
    }}>{label}</button>
  )
  return (
    <div>
      <div style={{ textAlign: 'center', padding: '10px 0 14px' }}>
        <span style={{ fontFamily: 'Fraunces, serif', fontSize: 42, fontWeight: 300, color: value === '' ? '#D8D6CE' : '#1C1C1C' }}>{value === '' ? '—' : value}</span>
        {unit && <div style={{ fontSize: 11, color: value === '' ? '#B8B6AE' : '#8A8A82', marginTop: 2 }}>{unit}</div>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7 }}>
        {['1','2','3','4','5','6','7','8','9'].map(k => key(k, () => press(k)))}
        {decimals
          ? key('.', () => press('.'), { fontSize: 16, color: value.includes('.') || value === '' ? '#D8D6CE' : '#3D5C3C', fontWeight: 600 })
          : key('·', () => {}, { background: '#F4F2EC', border: '1px solid rgba(0,0,0,0.03)', color: '#D8D6CE', cursor: 'default' })}
        {key('0', () => press('0'))}
        <button type="button" onClick={() => ready && onSubmit && onSubmit()} style={{
          background: ready ? '#3D5C3C' : '#E9E7DF', border: 'none', borderRadius: 11,
          padding: '13px 0', textAlign: 'center', fontSize: 16, color: ready ? '#FFFFFF' : '#B8B6AE',
          cursor: ready ? 'pointer' : 'default', fontFamily: 'DM Sans, sans-serif',
          boxShadow: ready ? '0 3px 10px rgba(61,92,60,0.3)' : 'none',
        }}>✓</button>
      </div>
      {value !== '' && (
        <button type="button" onClick={back} style={{ background: 'none', border: 'none', color: '#8A8A82', fontSize: 11, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', marginTop: 8, padding: 0 }}>⌫ delete</button>
      )}
    </div>
  )
}
