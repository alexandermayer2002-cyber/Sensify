import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'

// ============================================================
// UserMessages — the user's side of two-way admin<->user messaging.
// A conversation thread: admin messages on the left, user replies on
// the right. Opening it marks admin messages as read.
// ============================================================

const css = `
  .umsg-wrap { display: flex; flex-direction: column; height: 100%; background: #FAF8F4; }
  .umsg-head { padding: 20px 24px 16px; border-bottom: 1px solid rgba(0,0,0,0.06); background: white; }
  .umsg-title { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 300; color: #1C1C1C; }
  .umsg-title em { font-style: italic; color: #3D5C3C; }
  .umsg-sub { font-size: 12.5px; color: #8A8A82; margin-top: 3px; }
  .umsg-thread { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 14px; }
  .umsg-empty { margin: auto; text-align: center; color: #A0A096; max-width: 280px; }
  .umsg-empty-icon { width: 52px; height: 52px; border-radius: 50%; background: #EDF3ED; display: flex; align-items: center; justify-content: center; font-size: 22px; margin: 0 auto 14px; }
  .umsg-row { display: flex; flex-direction: column; max-width: 78%; }
  .umsg-row.admin { align-self: flex-start; align-items: flex-start; }
  .umsg-row.user { align-self: flex-end; align-items: flex-end; }
  .umsg-bubble { padding: 12px 15px; border-radius: 16px; font-size: 14px; line-height: 1.5; }
  .umsg-row.admin .umsg-bubble { background: white; border: 1px solid rgba(0,0,0,0.07); color: #1C1C1C; border-bottom-left-radius: 5px; }
  .umsg-row.user .umsg-bubble { background: #3D5C3C; color: white; border-bottom-right-radius: 5px; }
  .umsg-subject { font-weight: 600; margin-bottom: 4px; font-size: 13px; }
  .umsg-meta { font-size: 10px; color: #B0B0A8; margin-top: 5px; font-family: 'DM Mono', monospace; text-transform: uppercase; letter-spacing: 0.5px; }
  .umsg-sender { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; color: #8BAE8A; margin-bottom: 5px; font-family: 'DM Mono', monospace; }
  .umsg-compose { padding: 14px 18px; border-top: 1px solid rgba(0,0,0,0.06); background: white; display: flex; gap: 10px; align-items: flex-end; }
  .umsg-input { flex: 1; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 14px; padding: 11px 14px; font-size: 14px; font-family: 'DM Sans', sans-serif; resize: none; max-height: 120px; outline: none; }
  .umsg-input:focus { border-color: #3D5C3C; }
  .umsg-send { width: 42px; height: 42px; border-radius: 50%; border: none; background: #3D5C3C; color: white; font-size: 17px; cursor: pointer; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
  .umsg-send:disabled { background: #C3CDBF; cursor: not-allowed; }
`

export default function UserMessages({ session, onRead }) {
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const threadRef = useRef(null)

  const load = async () => {
    const { data } = await supabase.from('messages').select('*').eq('user_id', session.user.id).order('created_at', { ascending: true })
    setMessages(data || [])
    setLoading(false)
    // Mark admin messages as read
    const unreadAdmin = (data || []).filter(m => m.sender === 'admin' && !m.read)
    if (unreadAdmin.length > 0) {
      await supabase.from('messages').update({ read: true }).eq('user_id', session.user.id).eq('sender', 'admin').eq('read', false)
      onRead && onRead()
    }
  }

  useEffect(() => { load() }, [session.user.id])
  useEffect(() => { if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight }, [messages])

  const send = async () => {
    const text = draft.trim()
    if (!text || sending) return
    setSending(true)
    const { error } = await supabase.from('messages').insert({
      user_id: session.user.id, sender: 'user', body: text, read: false,
    })
    setSending(false)
    if (error) { alert('Could not send: ' + error.message); return }
    setDraft('')
    load()
  }

  const fmt = (ts) => {
    const d = new Date(ts)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' · ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  }

  return (
    <div className="umsg-wrap">
      <style>{css}</style>
      <div className="umsg-head">
        <div className="umsg-title">Messages from <em>Sensify</em></div>
        <div className="umsg-sub">Questions or notes from your care team appear here. You can reply anytime.</div>
      </div>
      <div className="umsg-thread" ref={threadRef}>
        {loading ? null : messages.length === 0 ? (
          <div className="umsg-empty">
            <div className="umsg-empty-icon">💬</div>
            <div style={{ fontSize: 14, color: '#6A6A62', lineHeight: 1.5 }}>No messages yet. If your care team needs to reach you, it'll show up here.</div>
          </div>
        ) : messages.map(m => (
          <div key={m.id} className={`umsg-row ${m.sender}`}>
            {m.sender === 'admin' && <div className="umsg-sender">Sensify team</div>}
            <div className="umsg-bubble">
              {m.subject && m.sender === 'admin' && <div className="umsg-subject">{m.subject}</div>}
              {m.body}
            </div>
            <div className="umsg-meta">{fmt(m.created_at)}</div>
          </div>
        ))}
      </div>
      <div className="umsg-compose">
        <textarea className="umsg-input" rows={1} placeholder="Write a reply..." value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} />
        <button className="umsg-send" disabled={!draft.trim() || sending} onClick={send}>↑</button>
      </div>
    </div>
  )
}
