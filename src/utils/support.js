import { supabase } from '../supabase'

// ============================================================
// Support data layer — all ticket/message operations in one place,
// so the user side and admin side stay consistent. Every write keeps
// the denormalized ticket fields (status, unread flags, last message)
// in sync so the inbox renders correctly without extra queries.
// ============================================================

const ADMIN_ID = '826ea0a1-148b-4a2b-8e3f-2d40e1023d4b'

function preview(text) {
  const t = (text || '').trim().replace(/\s+/g, ' ')
  return t.length > 80 ? t.slice(0, 80) + '…' : t
}

// ---- USER: create a new ticket with its first message ----
export async function createTicket({ userId, subject, body }) {
  const subj = (subject || '').trim()
  const msg = (body || '').trim()
  if (!subj || !msg) return { error: 'Subject and message are required.' }

  const { data: ticket, error: tErr } = await supabase.from('tickets').insert({
    user_id: userId,
    subject: subj,
    status: 'awaiting',
    last_message_at: new Date().toISOString(),
    last_message_preview: preview(msg),
    last_sender: 'user',
    unread_for_admin: true,
    unread_for_user: false,
    initiated_by: 'user',
  }).select().single()
  if (tErr) return { error: tErr.message }

  const { error: mErr } = await supabase.from('ticket_messages').insert({
    ticket_id: ticket.id, user_id: userId, sender: 'user', body: msg,
  })
  if (mErr) return { error: mErr.message }
  return { ticket }
}

// ---- ADMIN: start a ticket TO a user ----
export async function adminCreateTicket({ userId, subject, body }) {
  const subj = (subject || '').trim()
  const msg = (body || '').trim()
  if (!subj || !msg) return { error: 'Subject and message are required.' }

  const { data: ticket, error: tErr } = await supabase.from('tickets').insert({
    user_id: userId,
    subject: subj,
    status: 'awaiting',
    last_message_at: new Date().toISOString(),
    last_message_preview: preview(msg),
    last_sender: 'admin',
    unread_for_admin: false,
    unread_for_user: true,
    initiated_by: 'admin',
  }).select().single()
  if (tErr) return { error: tErr.message }

  const { error: mErr } = await supabase.from('ticket_messages').insert({
    ticket_id: ticket.id, user_id: userId, sender: 'admin', body: msg,
  })
  if (mErr) return { error: mErr.message }
  return { ticket }
}

// ---- send a message into an existing ticket (either side) ----
export async function sendMessage({ ticketId, userId, sender, body }) {
  const msg = (body || '').trim()
  if (!msg) return { error: 'Message is empty.' }

  const { error: mErr } = await supabase.from('ticket_messages').insert({
    ticket_id: ticketId, user_id: userId, sender, body: msg,
  })
  if (mErr) return { error: mErr.message }

  // Update the denormalized ticket fields + status + unread flags.
  const patch = {
    last_message_at: new Date().toISOString(),
    last_message_preview: preview(msg),
    last_sender: sender,
    status: sender === 'admin' ? 'replied' : 'awaiting',
  }
  if (sender === 'admin') { patch.unread_for_user = true; patch.unread_for_admin = false }
  else { patch.unread_for_admin = true; patch.unread_for_user = false }

  const { error: tErr } = await supabase.from('tickets').update(patch).eq('id', ticketId)
  if (tErr) return { error: tErr.message }
  return { ok: true }
}

// ---- load a single ticket's messages ----
export async function loadThread(ticketId) {
  const { data, error } = await supabase.from('ticket_messages')
    .select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true })
  if (error) return { error: error.message, messages: [] }
  return { messages: data || [] }
}

// ---- USER: list my tickets ----
export async function listUserTickets(userId) {
  const { data, error } = await supabase.from('tickets')
    .select('*').eq('user_id', userId).order('last_message_at', { ascending: false })
  if (error) return { error: error.message, tickets: [] }
  return { tickets: data || [] }
}

// ---- ADMIN: list all tickets (inbox), unread-first then recent ----
export async function listAllTickets() {
  const { data, error } = await supabase.from('tickets')
    .select('*').order('last_message_at', { ascending: false })
  if (error) return { error: error.message, tickets: [] }
  // Attach user display names for the inbox.
  const userIds = [...new Set((data || []).map(t => t.user_id))]
  let nameMap = {}
  if (userIds.length > 0) {
    const { data: profs } = await supabase.from('profiles').select('id, full_name, email').in('id', userIds)
    ;(profs || []).forEach(p => { nameMap[p.id] = { name: p.full_name || p.id.slice(0, 8), email: p.email || '' } })
  }
  const tickets = (data || []).map(t => ({ ...t, user_name: (nameMap[t.user_id] || {}).name || 'User', user_email: (nameMap[t.user_id] || {}).email || '' })).sort((a, b) => {
    if (a.unread_for_admin !== b.unread_for_admin) return a.unread_for_admin ? -1 : 1
    return new Date(b.last_message_at) - new Date(a.last_message_at)
  })
  return { tickets }
}

// ---- mark a ticket read for one side (call when opening it) ----
export async function markRead({ ticketId, side }) {
  const patch = side === 'admin' ? { unread_for_admin: false } : { unread_for_user: false }
  await supabase.from('tickets').update(patch).eq('id', ticketId)
}

// ---- resolve / reopen ----
export async function setTicketStatus({ ticketId, status }) {
  const { error } = await supabase.from('tickets').update({ status }).eq('id', ticketId)
  return error ? { error: error.message } : { ok: true }
}

// ---- unread counts (for badges) ----
export async function userUnreadCount(userId) {
  const { count } = await supabase.from('tickets')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId).eq('unread_for_user', true)
  return count || 0
}

export async function adminUnreadCount() {
  const { count } = await supabase.from('tickets')
    .select('id', { count: 'exact', head: true })
    .eq('unread_for_admin', true)
  return count || 0
}

// ---- Turn-based status label, relative to who's viewing ----
// status.tone: 'action' = it's YOUR turn to respond; 'waiting' = waiting on
// the other side; 'resolved' = closed. This replaces the confusing literal
// "replied"/"awaiting" labels that didn't say whose turn it was.
export function statusLabel(ticket, viewer) {
  // viewer: 'user' | 'admin'
  if (ticket.status === 'resolved') return { text: 'Resolved', tone: 'resolved' }
  const lastSender = ticket.last_sender
  if (!lastSender) return { text: 'Open', tone: 'waiting' }
  // If the other side sent last, it's the viewer's turn to respond.
  const yourTurn = lastSender !== viewer
  if (yourTurn) {
    return { text: viewer === 'admin' ? 'Needs your reply' : 'Sensify replied', tone: 'action' }
  }
  // Viewer sent last → waiting on the other side.
  return { text: viewer === 'admin' ? 'Waiting on user' : 'Waiting on Sensify', tone: 'waiting' }
}
