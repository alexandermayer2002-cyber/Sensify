import React, { useState, useEffect, useRef } from 'react'
import {
  listAllTickets, loadThread, sendMessage, markRead, setTicketStatus, adminCreateTicket,
} from '../utils/support'
import { supabase } from '../supabase'

// ============================================================
// AdminSupport — the admin inbox + thread, email-style.
// inbox  : all tickets, unread-first, with preview + status
// thread : one ticket, reply, resolve/reopen
// compose: start a new ticket to a chosen user
// ============================================================

function fmt(ts) {
  const d = new Date(ts); const now = new Date()
  const diff = (now - d) / 60000
  if (diff < 1) return 'just now'
  if (diff < 60) return `${Math.round(diff)}m ago`
  if (diff < 1440 && d.toDateString() === now.toDateString()) return `${Math.round(diff / 60)}h ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' · ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export default function AdminSupport({ onUnreadChange }) {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('inbox')   // inbox | thread | compose
  const [active, setActive] = useState(null)
  const [thread, setThread] = useState([])
  const [threadLoading, setThreadLoading] = useState(false)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  // compose
  const [users, setUsers] = useState([])
  const [toUser, setToUser] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState('')
  const threadRef = useRef(null)

  const refresh = async () => {
    const { tickets } = await listAllTickets()
    setTickets(tickets); setLoading(false)
    onUnreadChange && onUnreadChange(tickets.filter(t => t.unread_for_admin).length)
  }
  useEffect(() => { refresh() }, [])
  useEffect(() => { if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight }, [thread])

  const open = async (t) => {
    setActive(t); setView('thread'); setThreadLoading(true); setThread([])
    const { messages } = await loadThread(t.id)
    setThread(messages); setThreadLoading(false)
    if (t.unread_for_admin) {
      await markRead({ ticketId: t.id, side: 'admin' })
      setTickets(prev => prev.map(x => x.id === t.id ? { ...x, unread_for_admin: false } : x))
      onUnreadChange && onUnreadChange(tickets.filter(x => x.unread_for_admin && x.id !== t.id).length)
    }
  }

  const doReply = async () => {
    const text = reply.trim()
    if (!text || sending) return
    setSending(true)
    const optimistic = { id: 'tmp-' + Date.now(), sender: 'admin', body: text, created_at: new Date().toISOString(), _pending: true }
    setThread(prev => [...prev, optimistic]); setReply('')
    const { error } = await sendMessage({ ticketId: active.id, userId: active.user_id, sender: 'admin', body: text })
    setSending(false)
    if (error) { setThread(prev => prev.map(m => m.id === optimistic.id ? { ...m, _failed: true, _pending: false } : m)); return }
    const { messages } = await loadThread(active.id); setThread(messages); refresh()
  }

  const loadUsers = async () => {
    const { data, error } = await supabase.from('profiles').select('id, full_name, email').order('full_name')
    if (error) { setError('Could not load users: ' + error.message); return }
    setUsers((data || []).filter(u => u.full_name))
  }
  const startCompose = () => { setView('compose'); setError(''); setToUser(''); setSubject(''); setBody(''); loadUsers() }
  const submitCompose = async () => {
    setError('')
    if (!toUser) { setError('Pick a user.'); return }
    if (!subject.trim() || !body.trim()) { setError('Subject and message required.'); return }
    setSending(true)
    const { ticket, error } = await adminCreateTicket({ userId: toUser, subject, body })
    setSending(false)
    if (error) { setError(error); return }
    await refresh(); open(ticket)
  }

  const resolve = async () => {
    await setTicketStatus({ ticketId: active.id, status: active.status === 'resolved' ? 'replied' : 'resolved' })
    const newStatus = active.status === 'resolved' ? 'replied' : 'resolved'
    setActive({ ...active, status: newStatus }); refresh()
  }

  const s = {
    wrap: { background: 'white', borderRadius: 14, border: '0.5px solid rgba(0,0,0,0.08)', overflow: 'hidden' },
    head: { padding: '16px 20px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    title: { fontFamily: 'Fraunces,serif', fontSize: 20, color: '#1C1C1C' },
    btn: { background: '#3D5C3C', color: 'white', border: 'none', borderRadius: 9, padding: '8px 14px', fontSize: 12.5, fontWeight: 500, cursor: 'pointer' },
    back: { background: 'none', border: 'none', color: '#8A8A82', fontSize: 13, cursor: 'pointer', padding: 0 },
    row: { padding: '14px 20px', borderBottom: '0.5px solid rgba(0,0,0,0.05)', display: 'flex', gap: 13, alignItems: 'center', cursor: 'pointer' },
    av: { width: 36, height: 36, borderRadius: '50%', background: '#E5E2DA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#6A6A62', flexShrink: 0 },
    pill: (st) => ({ fontSize: 9.5, fontWeight: 600, padding: '3px 7px', borderRadius: 5, textTransform: 'uppercase', letterSpacing: '0.4px', flexShrink: 0,
      background: st === 'awaiting' ? '#FBEFD8' : st === 'replied' ? '#EDF3ED' : '#EDEDEA',
      color: st === 'awaiting' ? '#9A6212' : st === 'replied' ? '#3D5C3C' : '#7A7A72' }),
    input: { width: '100%', boxSizing: 'border-box', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 9, padding: '10px 12px', fontSize: 13.5, background: 'white', fontFamily: 'DM Sans,sans-serif' },
  }

  // COMPOSE
  if (view === 'compose') {
    return (
      <div style={s.wrap}>
        <div style={s.head}><button style={s.back} onClick={() => setView('inbox')}>← Inbox</button></div>
        <div style={{ padding: 20 }}>
          <div style={{ fontFamily: 'Fraunces,serif', fontSize: 19, color: '#1C1C1C', marginBottom: 16 }}>Message a user</div>
          <div style={{ fontSize: 11.5, color: '#6A6A62', marginBottom: 5 }}>To</div>
          {toUser ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', ...s.input, marginBottom: 14 }}>
              <span>{(() => { const u = users.find(u => u.id === toUser); return u ? (u.email ? `${u.full_name} · ${u.email}` : u.full_name) : 'Selected user' })()}</span>
              <button style={{ background: 'none', border: 'none', color: '#8A8A82', cursor: 'pointer', fontSize: 13 }} onClick={() => setToUser('')}>change</button>
            </div>
          ) : (
            <div style={{ marginBottom: 14 }}>
              <input style={s.input} placeholder="Search by name or email…" value={userSearch} onChange={e => setUserSearch(e.target.value)} />
              {users.length === 0 ? (
                <div style={{ fontSize: 12, color: '#A0A096', padding: '8px 2px' }}>No users found.</div>
              ) : (
                <div style={{ maxHeight: 160, overflowY: 'auto', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 9, marginTop: 6 }}>
                  {users.filter(u => {
                    const q = userSearch.toLowerCase()
                    return u.full_name.toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
                  }).map(u => (
                    <div key={u.id} onClick={() => { setToUser(u.id); setUserSearch('') }}
                      style={{ padding: '9px 12px', cursor: 'pointer', borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F2F5EF'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                      <div style={{ fontSize: 13.5, color: '#1C1C1C' }}>{u.full_name}</div>
                      {u.email && <div style={{ fontSize: 11.5, color: '#8A8A82' }}>{u.email}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <div style={{ fontSize: 11.5, color: '#6A6A62', marginBottom: 5 }}>Subject</div>
          <input style={{ ...s.input, marginBottom: 14 }} value={subject} onChange={e => setSubject(e.target.value)} placeholder="What's this about?" maxLength={120} />
          <div style={{ fontSize: 11.5, color: '#6A6A62', marginBottom: 5 }}>Message</div>
          <textarea style={{ ...s.input, minHeight: 110, resize: 'none', marginBottom: 14 }} value={body} onChange={e => setBody(e.target.value)} placeholder="Your message…" maxLength={4000} />
          <button style={{ ...s.btn, width: '100%', padding: 12, opacity: sending ? 0.6 : 1 }} disabled={sending} onClick={submitCompose}>{sending ? 'Sending…' : 'Send'}</button>
          {error && <div style={{ fontSize: 12, color: '#D64545', marginTop: 8 }}>{error}</div>}
        </div>
      </div>
    )
  }

  // THREAD
  if (view === 'thread' && active) {
    return (
      <div style={s.wrap}>
        <div style={s.head}>
          <div>
            <button style={s.back} onClick={() => { setView('inbox'); setActive(null); refresh() }}>← Inbox</button>
            <div style={{ ...s.title, fontSize: 18, marginTop: 4 }}>{active.subject}</div>
            <div style={{ fontSize: 11, color: '#A0A096', marginTop: 2, fontFamily: 'DM Mono,monospace' }}>{active.user_name || ''}{active.user_email ? ` · ${active.user_email}` : ''}</div>
          </div>
          <button style={{ ...s.btn, background: active.status === 'resolved' ? '#8A8A82' : '#EDEDEA', color: active.status === 'resolved' ? 'white' : '#5A5A52' }} onClick={resolve}>
            {active.status === 'resolved' ? 'Reopen' : 'Mark resolved'}
          </button>
        </div>
        <div ref={threadRef} style={{ padding: 20, maxHeight: 400, overflowY: 'auto' }}>
          {threadLoading ? <div style={{ textAlign: 'center', color: '#A0A096', fontSize: 13 }}>Loading…</div> :
            thread.map(m => (
              <div key={m.id} style={{ marginBottom: 14, borderRadius: 12, padding: '14px 16px', border: '0.5px solid rgba(0,0,0,0.07)', background: m.sender === 'admin' ? '#F4F7F2' : 'white', borderLeft: m.sender === 'admin' ? '3px solid #3D5C3C' : '0.5px solid rgba(0,0,0,0.07)', borderTopLeftRadius: m.sender === 'admin' ? 4 : 12, borderBottomLeftRadius: m.sender === 'admin' ? 4 : 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
                  <div style={{ ...s.av, background: m.sender === 'admin' ? '#3D5C3C' : '#E5E2DA', color: m.sender === 'admin' ? 'white' : '#6A6A62', width: 28, height: 28, fontSize: 11 }}>{m.sender === 'admin' ? 'S' : 'U'}</div>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: m.sender === 'admin' ? '#3D5C3C' : '#1C1C1C' }}>{m.sender === 'admin' ? 'You' : 'User'}</div>
                    <div style={{ fontSize: 10, color: '#B0B0A8', fontFamily: 'DM Mono,monospace' }}>{m._pending ? 'Sending…' : m._failed ? 'Failed' : fmt(m.created_at)}</div>
                  </div>
                </div>
                <div style={{ fontSize: 13.5, lineHeight: 1.6, color: m._failed ? '#D64545' : '#3A3A35' }}>{m.body}</div>
              </div>
            ))}
        </div>
        <div style={{ padding: '14px 18px', background: '#FAF8F4', borderTop: '0.5px solid rgba(0,0,0,0.07)', display: 'flex', gap: 9, alignItems: 'flex-end' }}>
          <textarea style={{ flex: 1, border: '1px solid rgba(0,0,0,0.12)', borderRadius: 10, padding: '10px 12px', fontSize: 13, resize: 'none', background: 'white', fontFamily: 'DM Sans,sans-serif' }} rows={1}
            placeholder="Write a reply…" value={reply} onChange={e => setReply(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doReply() } }} />
          <button style={{ ...s.btn, padding: '10px 16px', opacity: (!reply.trim() || sending) ? 0.5 : 1 }} disabled={!reply.trim() || sending} onClick={doReply}>Reply</button>
        </div>
      </div>
    )
  }

  // INBOX
  return (
    <div style={s.wrap}>
      <div style={s.head}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={s.title}>Support inbox</div>
          {tickets.filter(t => t.unread_for_admin).length > 0 &&
            <span style={{ background: '#D64545', color: 'white', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 9 }}>{tickets.filter(t => t.unread_for_admin).length} new</span>}
        </div>
        <button style={s.btn} onClick={startCompose}>+ Message a user</button>
      </div>
      {loading ? <div style={{ padding: 30, textAlign: 'center', color: '#A0A096', fontSize: 13 }}>Loading…</div> :
        tickets.length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: '#A0A096', fontSize: 13.5 }}>No support requests yet.</div> :
          tickets.map(t => (
            <div key={t.id} style={{ ...s.row, background: t.unread_for_admin ? '#FBFAF7' : 'white' }} onClick={() => open(t)}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.unread_for_admin ? '#D64545' : 'transparent', flexShrink: 0 }} />
              <div style={s.av}>{(t.user_name || 'U').slice(0, 2).toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: '#1C1C1C', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.user_name}{t.user_email ? <span style={{ fontWeight: 400, color: '#A0A096', fontSize: 11.5 }}> · {t.user_email}</span> : null}</div>
                  <div style={{ fontSize: 10.5, color: '#B0B0A8', fontFamily: 'DM Mono,monospace', flexShrink: 0 }}>{fmt(t.last_message_at)}</div>
                </div>
                <div style={{ fontSize: 12.5, color: '#3A3A35', fontWeight: 500, marginTop: 1 }}>{t.subject}</div>
                <div style={{ fontSize: 12, color: '#8A8A82', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.last_sender === 'admin' ? 'You: ' : ''}{t.last_message_preview}</div>
              </div>
              <span style={s.pill(t.status)}>{t.status === 'awaiting' ? 'Awaiting' : t.status}</span>
            </div>
          ))}
    </div>
  )
}
