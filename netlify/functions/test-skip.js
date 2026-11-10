// TESTING ONLY. The server-side time machine for ROBOT accounts (+fable/+qa/
// +robot emails, validated here). Shifts the account's entire history back N
// days and backfills the lived days as clean on-plan check-ins. Service key,
// so it is authoritative; any non-test email is refused. No effect on real
// customers, who have no time controls of any kind.
const { createClient } = require('@supabase/supabase-js')

const shiftDate = (iso, n) => {
  const d = new Date(String(iso).split('T')[0] + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString().split('T')[0]
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'POST only' }
  let email, days
  try { const b = JSON.parse(event.body || '{}'); email = (b.email || '').trim().toLowerCase(); days = Math.max(1, Math.min(200, Number(b.days) || 0)) } catch { return { statusCode: 400, body: 'bad json' } }
  if (!/^alexandermayer2002\+(fable|qa|robot)[^@]*@gmail\.com$/i.test(email)) return { statusCode: 403, body: JSON.stringify({ ok: false }) } // pinned to the QA address prefix (Door Sentry 2026-11-06)
  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  const { data: prof } = await sb.from('profiles').select('id, protocol_start_date').eq('email', email).maybeSingle()
  if (!prof) return { statusCode: 404, body: JSON.stringify({ ok: false, error: 'no profile' }) }
  const uid = prof.id
  const out = { shifted: {}, fills: 0, errors: [] }

  if (prof.protocol_start_date) {
    const { error } = await sb.from('profiles').update({ protocol_start_date: shiftDate(prof.protocol_start_date, days) }).eq('id', uid)
    if (error) out.errors.push('profiles: ' + error.message)
  }
  const shiftTable = async (table, col, key = 'id') => {
    const { data: rows, error: se } = await sb.from(table).select(`${key}, ${col}`).eq('user_id', uid)
    if (se) { out.errors.push(`${table} select: ` + se.message); return }
    let n = 0
    // Oldest first: shifting back by N days, each row moves onto a date its
    // predecessor has already vacated, so dense histories never collide with
    // the unique (user_id, date) constraints.
    const sorted = (rows || []).filter(r => r[col] != null)
      .sort((a, b) => String(a[col]).localeCompare(String(b[col])))
    for (const r of sorted) {
      const { error } = await sb.from(table).update({ [col]: shiftDate(r[col], days) }).eq(key, r[key])
      if (error) out.errors.push(`${table}: ` + error.message); else n++
    }
    out.shifted[table + '.' + col] = n
  }
  await shiftTable('daily_factors', 'log_date')
  await shiftTable('daily_compliance', 'date')
  await shiftTable('reintro_daily_logs', 'log_date')
  await shiftTable('reintroduction_results', 'started_at')
  await shiftTable('reintroduction_results', 'washout_started_at')
  { // symptom_logs: shift BOTH the timestamp and log_date (QA 2026-11-06
    // full-run #5, approved by Alex 2026-11-10): shifting only logged_at
    // piled time-traveled personas' symptom events onto the real-world date
    // and skewed weekly insights/trends for every fleet persona.
    const { data: rows } = await sb.from('symptom_logs').select('id, logged_at, log_date').eq('user_id', uid)
    let n = 0
    for (const r of (rows || [])) {
      const t = new Date(r.logged_at); t.setUTCDate(t.getUTCDate() - days)
      const upd = { logged_at: t.toISOString() }
      if (r.log_date) {
        const ld = new Date(r.log_date + 'T12:00:00Z'); ld.setUTCDate(ld.getUTCDate() - days)
        upd.log_date = ld.toISOString().split('T')[0]
      }
      const { error } = await sb.from('symptom_logs').update(upd).eq('id', r.id)
      if (error) out.errors.push('symptom_logs: ' + error.message); else n++
    }
    out.shifted['symptom_logs.logged_at'] = n
  }
  // Backfill lived days (yesterday back N), clean + on plan
  for (let i = 1; i <= days; i++) {
    const d = new Date(); d.setUTCDate(d.getUTCDate() - i)
    const ds = d.toISOString().split('T')[0]
    // ignoreDuplicates: fills are for MISSING days only. A day the robot
    // actually logged (an engineered stress day, a symptom day) must survive
    // the skip, or no data pattern can ever be built for the AI to read.
    const { error: fe } = await sb.from('daily_factors').upsert({ user_id: uid, log_date: ds, sleep: '7', stress: 'low', hydration: '6', followed_protocol: true }, { onConflict: 'user_id,log_date', ignoreDuplicates: true })
    if (fe) out.errors.push('fill factors ' + ds + ': ' + fe.message)
    const { error: ce } = await sb.from('daily_compliance').upsert({ user_id: uid, date: ds, response: 'YES', logged_at: ds + 'T20:00:00Z' }, { onConflict: 'user_id,date', ignoreDuplicates: true })
    if (ce) out.errors.push('fill compliance ' + ds + ': ' + ce.message)
    if (!fe) out.fills++
  }
  return { statusCode: 200, body: JSON.stringify({ ok: out.errors.length === 0, ...out }) }
}
