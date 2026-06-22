import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import { askSensify, saveMealLog, saveMessage, loadHistory } from '../utils/askSensify'

export default function AskSensify({ session, foodMap: foodMapProp = null }) {
  const [foodMap, setFoodMap] = useState(foodMapProp || [])
  const [labFoods, setLabFoods] = useState([])
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      // Load the user's Food Map if not passed in
      if (!foodMapProp) {
        try {
          const { data } = await supabase.from('food_map').select('*').eq('user_id', session.user.id)
          if (data) setFoodMap(data)
        } catch (e) {}
      }
      // Load lab results so the assistant knows flagged vs clean foods
      try {
        const { data: lab } = await supabase.from('lab_results').select('foods').eq('user_id', session.user.id).order('submitted_at', { ascending: false }).limit(1).single()
        if (lab?.foods) setLabFoods(lab.foods)
      } catch (e) {}
      const history = await loadHistory(session.user.id)
      setMessages(history)
      setLoaded(true)
    }
    load()
  }, [session.user.id, foodMapProp])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, sending])

  const send = async () => {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    const userMsg = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setSending(true)
    saveMessage({ userId: session.user.id, role: 'user', content: text })

    try {
      const { reply, foodsToLog, mapContext } = await askSensify({
        userMessage: text,
        foodMap,
        labFoods,
        history: messages.slice(-12),
      })

      // Log any meal the assistant detected
      if (foodsToLog.length > 0) {
        await saveMealLog({ userId: session.user.id, rawText: text, foods: foodsToLog, mapContext })
      }

      const aiMsg = { role: 'assistant', content: reply }
      setMessages(prev => [...prev, aiMsg])
      saveMessage({ userId: session.user.id, role: 'assistant', content: reply })
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I had trouble with that. Mind trying again?" }])
    }
    setSending(false)
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const suggestions = [
    'Can I eat pad thai?',
    'I had eggs and toast for breakfast',
    "What's safe at an Italian restaurant?",
  ]

  return (
    <div style={s.wrap}>
      <style>{css}</style>
      <div style={s.header}>
        <div style={s.headerTitle}>Ask <em style={s.em}>Sensify</em></div>
        <div style={s.headerSub}>Your Food Map, working at every meal.</div>
      </div>

      <div style={s.thread} ref={scrollRef}>
        {loaded && messages.length === 0 && (
          <div style={s.empty}>
            <div style={s.emptyTitle}>What can I help you eat?</div>
            <div style={s.emptyText}>Ask if a food is safe for you, tell me what you ate, or ask what to order somewhere. I check everything against your Food Map.</div>
            <div style={s.chips}>
              {suggestions.map((sug, i) => (
                <button key={i} style={s.chip} onClick={() => setInput(sug)}>{sug}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={m.role === 'user' ? s.userRow : s.aiRow}>
            <div style={m.role === 'user' ? s.userBubble : s.aiBubble}>{m.content}</div>
          </div>
        ))}
        {sending && (
          <div style={s.aiRow}>
            <div style={s.aiBubble}><span style={s.dots}>•••</span></div>
          </div>
        )}
      </div>

      <div style={s.inputBar}>
        <textarea
          style={s.input}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask about a food, or tell me what you ate..."
          rows={1}
        />
        <button style={input.trim() && !sending ? s.send : s.sendOff} onClick={send} disabled={!input.trim() || sending}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
      <div style={s.disclaimer}>Ask Sensify uses your Food Map for guidance. It is not medical advice. When unsure about an ingredient, double-check.</div>
    </div>
  )
}

const css = `
@keyframes asPulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
`

const s = {
  wrap: { display: 'flex', flexDirection: 'column', height: '100%', maxWidth: '680px', margin: '0 auto', width: '100%' },
  header: { padding: '20px 20px 14px' },
  headerTitle: { fontFamily: 'Fraunces, serif', fontSize: '24px', fontWeight: 300 },
  em: { fontStyle: 'italic', color: '#3D5C3C' },
  headerSub: { fontSize: '13px', color: '#7A7A72', marginTop: '2px' },
  thread: { flex: 1, overflowY: 'auto', padding: '8px 16px 16px', display: 'flex', flexDirection: 'column', gap: '12px' },
  empty: { textAlign: 'center', padding: '36px 16px', margin: 'auto 0' },
  emptyTitle: { fontFamily: 'Fraunces, serif', fontSize: '22px', fontWeight: 300, marginBottom: '10px' },
  emptyText: { fontSize: '14px', color: '#7A7A72', lineHeight: 1.6, maxWidth: '420px', margin: '0 auto 22px' },
  chips: { display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '320px', margin: '0 auto' },
  chip: { padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', background: '#FFFFFF', fontSize: '13.5px', color: '#3D5C3C', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 500 },
  userRow: { display: 'flex', justifyContent: 'flex-end' },
  aiRow: { display: 'flex', justifyContent: 'flex-start' },
  userBubble: { background: '#3D5C3C', color: 'white', padding: '11px 15px', borderRadius: '16px 16px 4px 16px', fontSize: '14.5px', lineHeight: 1.5, maxWidth: '80%', whiteSpace: 'pre-wrap' },
  aiBubble: { background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', color: '#1C1C1C', padding: '11px 15px', borderRadius: '16px 16px 16px 4px', fontSize: '14.5px', lineHeight: 1.55, maxWidth: '85%', whiteSpace: 'pre-wrap' },
  dots: { letterSpacing: '2px', color: '#3D5C3C', animation: 'asPulse 1.2s infinite' },
  inputBar: { display: 'flex', gap: '8px', padding: '12px 16px', borderTop: '1px solid rgba(0,0,0,0.07)', alignItems: 'flex-end' },
  input: { flex: 1, resize: 'none', border: '1px solid rgba(0,0,0,0.12)', borderRadius: '14px', padding: '12px 14px', fontSize: '14.5px', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.4, maxHeight: '120px', outline: 'none' },
  send: { width: '42px', height: '42px', borderRadius: '12px', border: 'none', background: '#3D5C3C', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sendOff: { width: '42px', height: '42px', borderRadius: '12px', border: 'none', background: '#C8C6BE', cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  disclaimer: { fontSize: '10.5px', color: '#A8A69E', textAlign: 'center', padding: '0 16px 12px', lineHeight: 1.5 },
}
