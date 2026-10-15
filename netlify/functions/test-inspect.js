// TESTING ONLY. Read-only state inspector for ROBOT accounts (+fable/+qa/+robot
// emails, validated server-side). Lets automated QA verify what each UI step
// actually wrote. Refuses any other email. No writes.
const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'POST only' }
  let email
  try { email = (JSON.parse(event.body || '{}').email || '').trim().toLowerCase() } catch { return { statusCode: 400, body: 'bad json' } }
  if (!/\+(fable|qa|robot)/i.test(email)) return { statusCode: 403, body: JSON.stringify({ ok: false }) }
  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  const { data: prof } = await sb.from('profiles').select('id, protocol_start_date, program_phase, protocol_track, current_reintro_food').eq('email', email).maybeSingle()
  if (!prof) return { statusCode: 404, body: JSON.stringify({ ok: false }) }
  const uid = prof.id
  const [{ data: cycles }, { data: logs }, { data: facts }, { data: evs }] = await Promise.all([
    sb.from('reintroduction_results').select('food, started_at, washout_started_at, exposure_days_completed, verdict').eq('user_id', uid).order('started_at'),
    sb.from('reintro_daily_logs').select('food, log_date, phase, ate_food, had_symptoms').eq('user_id', uid).order('log_date'),
    sb.from('daily_factors').select('log_date').eq('user_id', uid).order('log_date', { ascending: false }).limit(3),
    sb.from('symptom_logs').select('symptom, logged_at').eq('user_id', uid).order('logged_at', { ascending: false }).limit(5),
  ])
  return { statusCode: 200, body: JSON.stringify({ ok: true, profile: prof, cycles, reintro_logs: logs, recent_factors: facts, recent_events: evs }) }
}
