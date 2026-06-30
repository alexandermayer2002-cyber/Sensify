import React, { useState, useEffect, useRef } from 'react'
import {
  listUserTickets, createTicket, loadThread, sendMessage, markRead, setTicketStatus,
} from '../utils/support'

// ============================================================
// Support — the user's correspondence center. Three views:
//   list    — their tickets, with status
//   compose — a new request (subject + message)
//   thread  — one ticket, email-style, with reply
// ============================================================

const css = `
  .sup-wrap { display:flex; flex-direction:column; height:100%; background:#FAF8F4; }
  .sup-head { padding:20px max(22px, calc((100% - 620px) / 2)) 16px; background:white; border-bottom:0.5px solid rgba(0,0,0,0.07); display:flex; align-items:center; justify-content:space-between; }
  .sup-compose-bar { padding:14px max(18px, calc((100% - 620px) / 2)); background:white; border-top:0.5px solid rgba(0,0,0,0.07); display:flex; gap:9px; align-items:flex-end; }
  .sup-head-l { display:flex; align-items:center; gap:10px; }
  .sup-back { background:none; border:none; color:#8A8A82; font-size:13px; cursor:pointer; padding:0; }
  .sup-title { font-family:'Fraunces',serif; font-size:22px; font-weight:300; color:#1C1C1C; }
  .sup-title em { font-style:italic; color:#3D5C3C; }
  .sup-sub { font-size:12.5px; color:#8A8A82; margin-top:2px; }
  .sup-newbtn { background:#3D5C3C; color:white; border:none; border-radius:9px; padding:8px 14px; font-size:12.5px; font-weight:500; cursor:pointer; }
  .sup-body { flex:1; overflow-y:auto; padding:18px max(22px, calc((100% - 620px) / 2)); }
  .sup-ticket { background:white; border:0.5px solid rgba(0,0,0,0.08); border-radius:11px; padding:13px 15px; margin-bottom:9px; cursor:pointer; }
  .sup-ticket:hover { border-color:#3D5C3C; }
  .sup-trow { display:flex; justify-content:space-between; align-items:center; gap:10px; }
  .sup-tsubj { font-size:13.5px; font-weight:500; color:#1C1C1C; }
  .sup-tprev { font-size:12px; color:#8A8A82; margin-top:3px; line-height:1.4; }
  .sup-tdate { font-size:10.5px; color:#B0B0A8; margin-top:6px; font-family:'DM Mono',monospace; }
  .sup-pill { font-size:9.5px; font-weight:600; padding:3px 7px; border-radius:5px; text-transform:uppercase; letter-spacing:0.4px; white-space:nowrap; flex-shrink:0; }
  .sup-pill.awaiting { background:#FBEFD8; color:#9A6212; }
  .sup-pill.replied { background:#EDF3ED; color:#3D5C3C; }
  .sup-pill.resolved { background:#EDEDEA; color:#7A7A72; }
  .sup-dot { width:8px; height:8px; border-radius:50%; background:#D64545; flex-shrink:0; }
  .sup-empty { text-align:center; color:#A0A096; max-width:300px; margin:48px auto; }
  .sup-empty-icon { width:52px; height:52px; border-radius:50%; background:#EDF3ED; display:flex; align-items:center; justify-content:center; font-size:22px; margin:0 auto 14px; color:#3D5C3C; }
  .sup-label { font-size:11.5px; color:#6A6A62; margin-bottom:5px; }
  .sup-input { width:100%; box-sizing:border-box; border:1px solid rgba(0,0,0,0.12); border-radius:9px; padding:10px 12px; font-size:13.5px; background:white; font-family:'DM Sans',sans-serif; }
  .sup-input:focus { outline:none; border-color:#3D5C3C; }
  .sup-note { display:flex; align-items:center; gap:7px; margin:13px 0 16px; padding:9px 11px; background:#EDF3ED; border-radius:8px; font-size:11.5px; color:#3D5C3C; }
  .sup-warn { font-size:11px; color:#9A6212; background:#FBEFD8; border-radius:8px; padding:9px 11px; margin-bottom:14px; line-height:1.45; }
  .sup-primary { width:100%; background:#3D5C3C; color:white; border:none; border-radius:10px; padding:12px; font-size:13.5px; font-weight:500; cursor:pointer; }
  .sup-primary:disabled { background:#C3CDBF; cursor:not-allowed; }
  .sup-msg { margin-bottom:14px; border-radius:12px; padding:14px 16px; border:0.5px solid rgba(0,0,0,0.07); }
  .sup-msg.admin { background:#F4F7F2; border-left:3px solid #3D5C3C; border-top-left-radius:4px; border-bottom-left-radius:4px; }
  .sup-msg.user { background:white; }
  .sup-msg-head { display:flex; align-items:center; gap:9px; margin-bottom:8px; }
  .sup-av { width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:600; flex-shrink:0; }
  .sup-av.user { background:#E5E2DA; color:#6A6A62; }
  .sup-av.admin { background:#3D5C3C; color:white; }
  .sup-sender { font-size:12.5px; font-weight:600; }
  .sup-ts { font-size:10px; color:#B0B0A8; font-family:'DM Mono',monospace; }
  .sup-mbody { font-size:13.5px; line-height:1.6; color:#3A3A35; }
  .sup-divider { border-top:0.5px solid rgba(0,0,0,0.06); margin:18px 0; }
  .sup-reply { flex:1; border:1px solid rgba(0,0,0,0.12); border-radius:10px; padding:10px 12px; font-size:13px; resize:none; max-height:120px; background:white; font-family:'DM Sans',sans-serif; }
  .sup-reply:focus { outline:none; border-color:#3D5C3C; }
  .sup-send { background:#3D5C3C; color:white; border:none; border-radius:10px; padding:10px 16px; font-size:13px; font-weight:500; cursor:pointer; flex-shrink:0; }
  .sup-send:disabled { background:#C3CDBF; cursor:not-allowed; }
  .sup-resolved-banner { text-align:center; font-size:11.5px; color:#7A7A72; padding:10px; background:#EDEDEA; }
  .sup-reopen { background:none; border:none; color:#3D5C3C; font-weight:500; cursor:pointer; text-decoration:underline; font-size:11.5px; }
  .sup-err { font-size:12px; color:#D64545; margin-top:8px; }
`

function fmt(ts) {
  const d = new Date(ts)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' · ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export default function Support({ session, onUnreadChange }) {
  const [view, setView] = useState('list')      // list | compose | thread
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState(null)     // active ticket
  const [thread, setThread] = useState([])
  const [threadLoading, setThreadLoading] = useState(false)
  // compose
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  // reply
  const [reply, setReply] = useState('')
  const threadRef = useRef(null)

  const refreshList = async () => {
    const { tickets } = await listUserTickets(session.user.id)
    setTickets(tickets)
    setLoading(false)
    onUnreadChange && onUnreadChange(tickets.filter(t => t.unread_for_user).length)
  }
  useEffect(() => { refreshList() }, [session.user.id])
  useEffect(() => { if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight }, [thread])

  const openTicket = async (t) => {
    setActive(t); setView('thread'); setThreadLoading(true); setThread([])
    const { messages } = await loadThread(t.id)
    setThread(messages); setThreadLoading(false)
    if (t.unread_for_user) {
      await markRead({ ticketId: t.id, side: 'user' })
      setTickets(prev => prev.map(x => x.id === t.id ? { ...x, unread_for_user: false } : x))
      onUnreadChange && onUnreadChange(tickets.filter(x => x.unread_for_user && x.id !== t.id).length)
    }
  }

  const submitNew = async () => {
    setError('')
    if (!subject.trim() || !body.trim()) { setError('Please add a subject and a message.'); return }
    setSending(true)
    const { ticket, error } = await createTicket({ userId: session.user.id, subject, body })
    setSending(false)
    if (error) { setError(error); return }
    setSubject(''); setBody('')
    await refreshList()
    openTicket(ticket)
  }

  const submitReply = async () => {
    const text = reply.trim()
    if (!text || sending) return
    setSending(true)
    // optimistic
    const optimistic = { id: 'tmp-' + Date.now(), sender: 'user', body: text, created_at: new Date().toISOString(), _pending: true }
    setThread(prev => [...prev, optimistic])
    setReply('')
    const { error } = await sendMessage({ ticketId: active.id, userId: session.user.id, sender: 'user', body: text })
    setSending(false)
    if (error) {
      setThread(prev => prev.map(m => m.id === optimistic.id ? { ...m, _failed: true, _pending: false } : m))
      return
    }
    const { messages } = await loadThread(active.id)
    setThread(messages)
    refreshList()
  }

  // ---- COMPOSE ----
  if (view === 'compose') {
    return (
      <div className="sup-wrap"><style>{css}</style>
        <div className="sup-head">
          <div className="sup-head-l">
            <button className="sup-back" onClick={() => { setView('list'); setError('') }}>← Support</button>
          </div>
        </div>
        <div className="sup-body">
          <div style={{ fontFamily: 'Fraunces,serif', fontSize: 21, fontWeight: 300, color: '#1C1C1C', marginBottom: 18 }}>New request</div>
          <div className="sup-label">Subject</div>
          <input className="sup-input" style={{ marginBottom: 14 }} placeholder="What's this about?" value={subject} onChange={e => setSubject(e.target.value)} maxLength={120} />
          <div className="sup-label">Message</div>
          <textarea className="sup-input" style={{ minHeight: 120, resize: 'none', marginBottom: 4 }} placeholder="Tell us what's going on..." value={body} onChange={e => setBody(e.target.value)} maxLength={4000} />
          <div className="sup-note"><span aria-hidden="true">⏱</span> Our team usually responds within 1 day.</div>
          <div className="sup-warn">If this is a medical emergency, don't wait for us — call your doctor or 911.</div>
          <button className="sup-primary" disabled={sending || !subject.trim() || !body.trim()} onClick={submitNew}>{sending ? 'Sending…' : 'Send request'}</button>
          {error && <div className="sup-err">{error}</div>}
        </div>
      </div>
    )
  }

  // ---- THREAD ----
  if (view === 'thread' && active) {
    const isResolved = active.status === 'resolved'
    return (
      <div className="sup-wrap"><style>{css}</style>
        <div className="sup-head">
          <div>
            <button className="sup-back" onClick={() => { setView('list'); setActive(null); refreshList() }}>← Support</button>
            <div className="sup-title" style={{ fontSize: 19, marginTop: 4 }}>{active.subject}</div>
            <div className="sup-ts" style={{ marginTop: 3 }}>{active.status === 'awaiting' ? 'Awaiting reply' : active.status === 'replied' ? 'Replied' : 'Resolved'}</div>
          </div>
        </div>
        <div className="sup-body" ref={threadRef}>
          {threadLoading ? <div style={{ textAlign: 'center', color: '#A0A096', fontSize: 13, marginTop: 30 }}>Loading…</div> :
            thread.map((m, i) => (
              <div className={`sup-msg ${m.sender}`} key={m.id}>
                <div className="sup-msg-head">
                  <div className={`sup-av ${m.sender}`}>{m.sender === 'admin' ? 'S' : (session.user.user_metadata?.full_name?.[0] || 'Y')}</div>
                  <div>
                    <div className="sup-sender" style={{ color: m.sender === 'admin' ? '#3D5C3C' : '#1C1C1C' }}>{m.sender === 'admin' ? 'Sensify team' : 'You'}</div>
                    <div className="sup-ts">{m._pending ? 'Sending…' : m._failed ? 'Failed to send' : fmt(m.created_at)}</div>
                  </div>
                </div>
                <div className="sup-mbody" style={m._failed ? { color: '#D64545' } : {}}>{m.body}</div>
              </div>
            ))}
        </div>
        {isResolved ? (
          <div className="sup-resolved-banner">This request is resolved. <button className="sup-reopen" onClick={async () => { await setTicketStatus({ ticketId: active.id, status: 'awaiting' }); setActive({ ...active, status: 'awaiting' }) }}>Reopen</button></div>
        ) : (
          <div className="sup-compose-bar">
            <textarea className="sup-reply" rows={1} placeholder="Write a reply..." value={reply}
              onChange={e => setReply(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitReply() } }} />
            <button className="sup-send" disabled={!reply.trim() || sending} onClick={submitReply}>Reply</button>
          </div>
        )}
      </div>
    )
  }

  // ---- LIST ----
  return (
    <div className="sup-wrap"><style>{css}</style>
      <div className="sup-head">
        <div className="sup-head-l">
          <div>
            <div className="sup-title">Support</div>
            <div className="sup-sub">We usually reply within 1 day.</div>
          </div>
        </div>
        <button className="sup-newbtn" onClick={() => { setView('compose'); setError('') }}>+ New request</button>
      </div>
      <div className="sup-body">
        {loading ? <div style={{ textAlign: 'center', color: '#A0A096', fontSize: 13, marginTop: 30 }}>Loading…</div> :
          tickets.length === 0 ? (
            <div className="sup-empty">
              <div className="sup-empty-icon">💬</div>
              <div style={{ fontSize: 14, color: '#6A6A62', lineHeight: 1.5, marginBottom: 16 }}>No requests yet. Need a hand with your results, your protocol, or anything else? We're here.</div>
              <button className="sup-newbtn" onClick={() => setView('compose')}>+ New request</button>
            </div>
          ) : tickets.map(t => (
            <div className="sup-ticket" key={t.id} onClick={() => openTicket(t)}>
              <div className="sup-trow">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  {t.unread_for_user && <span className="sup-dot" />}
                  <span className="sup-tsubj">{t.subject}</span>
                </div>
                <span className={`sup-pill ${t.status}`}>{t.status === 'awaiting' ? 'Awaiting reply' : t.status}</span>
              </div>
              <div className="sup-tprev">{t.last_sender === 'admin' ? 'Sensify: ' : ''}{t.last_message_preview}</div>
              <div className="sup-tdate">{fmt(t.last_message_at)}</div>
            </div>
          ))}
      </div>
    </div>
  )
}
