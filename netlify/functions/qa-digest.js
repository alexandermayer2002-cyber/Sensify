// QA DIGEST — read-only door for the Morning Brief agent (Cohort Watch +
// Feedback Triage; approved by Alex 2026-11-06 for the friends-and-family
// testing window). Returns an aggregate cohort snapshot and open support
// tickets. STRICTLY READ-ONLY: this function performs no writes.
//
// Gate: requires the key in env var QA_DIGEST_KEY (set it in Netlify →
// Site settings → Environment variables). Requests without the matching
// key get 403. The function is inert (503) until the env var exists.
// The matching key the agent sends lives in the PRIVATE repo at
// qa/digest.key — same trust domain as the agent prompts; rotate both to
// revoke.
const { createClient } = require('@supabase/supabase-js')

const DAY = 86400000
const iso = (ms) => new Date(ms).toISOString()

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'POST only' }
  const KEY = process.env.QA_DIGEST_KEY
  if (!KEY) return { statusCode: 503, body: JSON.stringify({ ok: false, error: 'QA_DIGEST_KEY not configured' }) }
  let key
  try { key = (JSON.parse(event.body || '{}').key || '') } catch { return { statusCode: 400, body: 'bad json' } }
  if (key !== KEY) return { statusCode: 403, body: JSON.stringify({ ok: false }) }

  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  const out = { ok: true, generated_at: new Date().toISOString(), cohort: [], tickets: [], errors: [] }
  const isTest = (e) => /^alexandermayer2002\+(fable|qa|qan4|robot)[^@]*@gmail\.com$/i.test(e || '')

  try {
    const { data: profs, error } = await sb.from('profiles')
      .select('id, email, full_name, program_phase, intake_completed_at, protocol_start_date, last_checkin_at, created_at')
    if (error) throw error
    const now = Date.now()
    for (const p of profs || []) {
      if (isTest(p.email)) continue // robots never appear in the cohort
      const { data: lab } = await sb.from('lab_results')
        .select('status, submitted_at').eq('user_id', p.id || '00000000-0000-0000-0000-000000000000').maybeSingle()
      out.cohort.push({
        name: p.full_name || p.email,
        stage: !p.intake_completed_at ? 'pre-intake'
          : p.program_phase === 'awaiting_results' ? 'awaiting lab entry'
          : p.program_phase === 'pending_review' ? 'lab pending YOUR approval'
          : p.program_phase || 'unknown',
        signed_up: p.created_at,
        lab_pending_hours: lab && lab.status === 'pending_review' && lab.submitted_at
          ? Math.round((now - new Date(lab.submitted_at).getTime()) / 3600000) : null,
        quiet_days: p.last_checkin_at
          ? Math.floor((now - new Date(p.last_checkin_at).getTime()) / DAY) : null,
      })
    }
  } catch (e) { out.errors.push('cohort: ' + e.message) }

  try {
    const { data: tix, error } = await sb.from('tickets')
      .select('id, user_id, subject, status, last_message_at, last_message_preview, last_sender, created_at')
      .neq('status', 'closed').order('last_message_at', { ascending: false }).limit(50)
    if (error) throw error
    // map user_id -> email so triage can tell robots from real testers
    const ids = [...new Set((tix || []).map(t => t.user_id).filter(Boolean))]
    const emails = {}
    if (ids.length) {
      const { data: tp } = await sb.from('profiles').select('id, email').in('id', ids)
      for (const p of (tp || [])) emails[p.id] = p.email
    }
    out.tickets = (tix || []).map(t => ({ ...t, user_email: emails[t.user_id] || null, from_test_account: isTest(emails[t.user_id]) }))
  } catch (e) { out.errors.push('tickets: ' + e.message) }

  return { statusCode: 200, body: JSON.stringify(out) }
}
