// =============================================================================
// TESTING ONLY. Flips lab_results.status to 'approved' for ROBOT accounts —
// emails carrying a +fable / +qa / +robot tag — because client-side RLS
// (correctly) blocks users from approving their own labs. The pattern check
// happens HERE, server-side: any other email is refused. Real customers are
// untouched; their approval remains the human admin's, exactly as in prod.
// =============================================================================
const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'POST only' }
  let email
  try { email = (JSON.parse(event.body || '{}').email || '').trim().toLowerCase() } catch { return { statusCode: 400, body: 'bad json' } }
  if (!/\+(fable|qa|robot)/i.test(email)) {
    return { statusCode: 403, body: JSON.stringify({ ok: false, error: 'not a test account' }) }
  }
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  const { data: prof } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle()
  if (!prof) return { statusCode: 404, body: JSON.stringify({ ok: false, error: 'no profile' }) }
  const { error } = await supabase.from('lab_results').update({ status: 'approved' }).eq('user_id', prof.id)
  if (error) return { statusCode: 500, body: JSON.stringify({ ok: false, error: error.message }) }
  return { statusCode: 200, body: JSON.stringify({ ok: true }) }
}
