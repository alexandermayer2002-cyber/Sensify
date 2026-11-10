// =============================================================================
// TESTING ONLY. Creates a pre-confirmed ROBOT account — emails carrying the
// pinned alexandermayer2002+(fable|qa|robot) prefix — because email
// confirmation (ON since 2026-11-10) strands robots at a confirmation wall
// for inboxes nobody reads. The pattern check happens HERE, server-side:
// any other email is refused 403, so no real account can be minted or
// pre-confirmed through this door. The door creates the auth user and the
// same bare profile row Signup.js writes — nothing else (no approvals, no
// intake, no labs). Approved by Alex 2026-11-10.
// =============================================================================
const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'POST only' }
  let body
  try { body = JSON.parse(event.body || '{}') } catch { return { statusCode: 400, body: 'bad json' } }
  const email = (body.email || '').trim().toLowerCase()
  const password = body.password || ''
  const full_name = String(body.full_name || 'Robot Tester').slice(0, 80)
  if (!/^alexandermayer2002\+(fable|qa|robot)[^@]*@gmail\.com$/i.test(email)) { // pinned prefix (Door Sentry 2026-11-06)
    return { statusCode: 403, body: JSON.stringify({ ok: false, error: 'not a test account' }) }
  }
  if (password.length < 8) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'password too short' }) }
  }
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  })
  if (error) {
    const already = /already|registered|exists/i.test(error.message)
    return { statusCode: already ? 409 : 500, body: JSON.stringify({ ok: false, error: error.message }) }
  }
  // Mirror Signup.js's immediate profile row so a door-made robot is
  // indistinguishable from a confirmed real signup downstream.
  const row = {
    id: data.user.id,
    full_name,
    email,
    program_phase: 'awaiting_results',
    created_at: new Date().toISOString(),
  }
  const { error: pErr } = await supabase.from('profiles').upsert(row)
  if (pErr) {
    // Auth user exists; intake's own upsert recovers a missing profile later.
    return { statusCode: 200, body: JSON.stringify({ ok: true, user_id: data.user.id, profile_error: pErr.message }) }
  }
  return { statusCode: 200, body: JSON.stringify({ ok: true, user_id: data.user.id }) }
}
